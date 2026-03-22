import { useState, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
  PublicKey,
  ParsedAccountData,
  ConfirmedSignatureInfo,
  Transaction,
  SystemProgram,
  ComputeBudgetProgram,
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  createCloseAccountInstruction,
} from '@solana/spl-token';

const WSOL_MINT = new PublicKey('So11111111111111111111111111111111111111112');
const RENT_PER_ACCOUNT_LAMPORTS = 2039280; // exact lamports
const RENT_PER_ACCOUNT = RENT_PER_ACCOUNT_LAMPORTS / 1e9;

// KoraKeep treasury — replace with your actual treasury pubkey
const KORAKEEP_TREASURY = new PublicKey('AwMD85ABuTBWsTdg5K7xPpdxjWYzFtykc4ACcSLt9783');

const FEE_BPS = 1500; // 15% in basis points

export interface DustAccount {
  address: string;
  mint: string;
  type: 'wSOL' | 'Token';
  balance: number;
  status: 'pending' | 'processing' | 'closed' | 'error' | 'protected';
  selected: boolean;
  createdAt?: number;
}

export interface ScanResult {
  totalScanned: number;
  dustDetected: number;
  recoverableSol: number;
  accounts: DustAccount[];
}

export interface ReclaimResult {
  success: boolean;
  reclaimed: number;
  closed: number;
  signatures: string[];
  error?: string;
}

interface UseDustScannerReturn {
  scanResult: ScanResult | null;
  isScanning: boolean;
  isReclaiming: boolean;
  scanError: string | null;
  scanProgress: number;
  scanForDust: (safeModeEnabled: boolean) => Promise<{ success: boolean; error?: string }>;
  reclaimDust: (accountsToClose: DustAccount[]) => Promise<ReclaimResult>;
  toggleAccountSelection: (address: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
}

/**
 * Calculate the 15% fee in lamports using integer math (no floating point).
 * Returns { userLamports, feeLamports } for a given number of accounts.
 */
export function splitRent(accountCount: number): { grossLamports: number; feeLamports: number; userLamports: number } {
  const grossLamports = accountCount * RENT_PER_ACCOUNT_LAMPORTS;
  const feeLamports = Math.floor((grossLamports * FEE_BPS) / 10_000);
  const userLamports = grossLamports - feeLamports;
  return { grossLamports, feeLamports, userLamports };
}

/** Human-readable RPC error message */
function humanizeRpcError(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);
  if (msg.includes('403') || msg.includes('Access forbidden')) {
    return 'RPC access denied. Try switching networks or try again later.';
  }
  if (msg.includes('429') || msg.includes('Too many requests')) {
    return 'Rate limited by RPC. Please wait a moment and retry.';
  }
  if (msg.includes('timeout') || msg.includes('Timeout') || msg.includes('ETIMEDOUT')) {
    return 'Network timeout — the Solana RPC is congested. Please try again.';
  }
  if (msg.includes('blockhash')) {
    return 'Transaction expired due to network congestion. Please retry.';
  }
  if (msg.includes('insufficient funds') || msg.includes('Insufficient')) {
    return 'Insufficient SOL for transaction fees.';
  }
  return msg || 'An unexpected error occurred. Please try again.';
}

export const useDustScanner = (): UseDustScannerReturn => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isReclaiming, setIsReclaiming] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanProgress, setScanProgress] = useState(0);

  const getAccountAge = useCallback(
    async (accountAddress: string): Promise<number | null> => {
      try {
        const signatures: ConfirmedSignatureInfo[] = await connection.getSignaturesForAddress(
          new PublicKey(accountAddress),
          { limit: 1 }
        );
        if (signatures.length > 0 && signatures[0].blockTime) {
          return signatures[0].blockTime * 1000;
        }
        return null;
      } catch {
        return null;
      }
    },
    [connection]
  );

  const scanForDust = useCallback(
    async (safeModeEnabled: boolean): Promise<{ success: boolean; error?: string }> => {
      if (!publicKey) {
        return { success: false, error: 'Wallet not connected' };
      }

      setIsScanning(true);
      setScanError(null);
      setScanProgress(0);

      try {
        console.log('Starting scan, publicKey:', publicKey.toBase58());

        // Fetch both token program accounts with individual error handling
        let legacyAccounts: { value: any[] } = { value: [] };
        let token2022Accounts: { value: any[] } = { value: [] };

        setScanProgress(10);

        try {
          legacyAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
            programId: TOKEN_PROGRAM_ID,
          });
        } catch (err) {
          console.warn('Legacy token fetch failed, continuing:', err);
        }

        setScanProgress(30);

        try {
          token2022Accounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
            programId: TOKEN_2022_PROGRAM_ID,
          });
        } catch {
          // Token-2022 may not be supported on all RPCs
        }

        setScanProgress(50);

        const allTokenAccounts = [...legacyAccounts.value, ...token2022Accounts.value];
        console.log('Found token accounts:', allTokenAccounts.length);

        const dustAccounts: DustAccount[] = [];
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
        const total = allTokenAccounts.length;

        for (let idx = 0; idx < total; idx++) {
          const account = allTokenAccounts[idx];
          const parsedData = account.account.data as ParsedAccountData;
          const info = parsedData.parsed?.info;
          if (!info) continue;

          const mint = info.mint as string;
          const balance = info.tokenAmount?.uiAmount || 0;
          const isWsol = mint === WSOL_MINT.toBase58();

          // STRICT: non-wSOL must be exactly 0 balance; wSOL must be < 0.001
          const isDust = balance === 0 || (isWsol && balance < 0.001);

          if (isDust) {
            let createdAt: number | undefined;
            let isProtected = false;

            if (safeModeEnabled) {
              try {
                createdAt = (await getAccountAge(account.pubkey.toBase58())) ?? undefined;
                if (createdAt && createdAt > oneDayAgo) {
                  isProtected = true;
                }
              } catch {
                // If we can't check age, protect by default in safe mode
                isProtected = true;
              }
            }

            dustAccounts.push({
              address: account.pubkey.toBase58(),
              mint,
              type: isWsol ? 'wSOL' : 'Token',
              balance,
              status: isProtected ? 'protected' : 'pending',
              selected: !isProtected,
              createdAt,
            });
          }

          // Update progress from 50% to 90%
          if (total > 0) {
            setScanProgress(50 + Math.floor((idx / total) * 40));
          }
        }

        setScanProgress(95);

        const selectableAccounts = dustAccounts.filter(a => a.status !== 'protected');
        console.log('Dust accounts found:', dustAccounts.length);

        setScanResult({
          totalScanned: allTokenAccounts.length,
          dustDetected: dustAccounts.length,
          recoverableSol: selectableAccounts.length * RENT_PER_ACCOUNT,
          accounts: dustAccounts,
        });

        setScanProgress(100);
        return { success: true };
      } catch (error) {
        console.error('Scan error:', error);
        const errorMessage = humanizeRpcError(error);
        setScanError(errorMessage);

        setScanResult({
          totalScanned: 0,
          dustDetected: 0,
          recoverableSol: 0,
          accounts: [],
        });

        return { success: false, error: errorMessage };
      } finally {
        setIsScanning(false);
      }
    },
    [connection, publicKey, getAccountAge]
  );

  const reclaimDust = useCallback(
    async (accountsToClose: DustAccount[]): Promise<ReclaimResult> => {
      if (!publicKey || !sendTransaction) {
        return { success: false, reclaimed: 0, closed: 0, signatures: [], error: 'Wallet not connected' };
      }

      setIsReclaiming(true);
      let totalClosed = 0;
      const allSignatures: string[] = [];

      try {
        const toClose = accountsToClose.filter(a => a.selected && a.status === 'pending');

        if (toClose.length === 0) {
          return { success: false, reclaimed: 0, closed: 0, signatures: [], error: 'No accounts selected' };
        }

        setScanResult((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            accounts: prev.accounts.map((a) =>
              toClose.find((tc) => tc.address === a.address)
                ? { ...a, status: 'processing' as const }
                : a
            ),
          };
        });

        const BATCH_SIZE = 20;
        for (let i = 0; i < toClose.length; i += BATCH_SIZE) {
          const batch = toClose.slice(i, i + BATCH_SIZE);
          const transaction = new Transaction();

          // Add priority fee for congestion resilience (small: 5000 micro-lamports per CU)
          transaction.add(
            ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 5000 })
          );

          // Close accounts — rent returns to the *connected wallet* (publicKey) first
          for (const account of batch) {
            const instruction = createCloseAccountInstruction(
              new PublicKey(account.address),
              publicKey, // destination: rent goes to user wallet
              publicKey  // authority
            );
            transaction.add(instruction);
          }

          // Compute the 15% fee for this batch using integer math
          const { feeLamports } = splitRent(batch.length);

          // Atomic fee transfer to KoraKeep treasury in the SAME transaction
          if (feeLamports > 0) {
            transaction.add(
              SystemProgram.transfer({
                fromPubkey: publicKey,
                toPubkey: KORAKEEP_TREASURY,
                lamports: feeLamports,
              })
            );
          }

          try {
            const signature = await sendTransaction(transaction, connection);
            await connection.confirmTransaction(signature, 'confirmed');

            allSignatures.push(signature);

            setScanResult((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                accounts: prev.accounts.map((a) =>
                  batch.find((b) => b.address === a.address)
                    ? { ...a, status: 'closed' as const }
                    : a
                ),
              };
            });

            totalClosed += batch.length;
          } catch (batchError) {
            console.error('Batch error:', batchError);

            // Mark this batch as error but continue with remaining batches
            setScanResult((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                accounts: prev.accounts.map((a) =>
                  batch.find((b) => b.address === a.address) && a.status === 'processing'
                    ? { ...a, status: 'error' as const }
                    : a
                ),
              };
            });

            // If entire tx failed, stop processing
            const errorMsg = humanizeRpcError(batchError);
            if (totalClosed === 0) {
              return {
                success: false,
                reclaimed: 0,
                closed: 0,
                signatures: allSignatures,
                error: errorMsg,
              };
            }
            // Partial success — break and report what we got
            break;
          }
        }

        // Use integer math for final reclaimed amount (user's 85%)
        const { userLamports } = splitRent(totalClosed);
        const reclaimedSol = userLamports / 1e9;

        setScanResult((prev) => {
          if (!prev) return prev;
          const remaining = prev.accounts.filter(a => a.status === 'pending' && a.selected).length;
          return { ...prev, recoverableSol: remaining * RENT_PER_ACCOUNT };
        });

        return { success: true, reclaimed: reclaimedSol, closed: totalClosed, signatures: allSignatures };
      } catch (error) {
        console.error('Reclaim error:', error);

        setScanResult((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            accounts: prev.accounts.map((a) =>
              a.status === 'processing' ? { ...a, status: 'error' as const } : a
            ),
          };
        });

        return {
          success: false,
          reclaimed: 0,
          closed: totalClosed,
          signatures: allSignatures,
          error: humanizeRpcError(error),
        };
      } finally {
        setIsReclaiming(false);
      }
    },
    [connection, publicKey, sendTransaction]
  );

  const toggleAccountSelection = useCallback((address: string) => {
    setScanResult((prev) => {
      if (!prev) return prev;
      const accounts = prev.accounts.map((a) =>
        a.address === address && a.status === 'pending' ? { ...a, selected: !a.selected } : a
      );
      const selectedCount = accounts.filter(a => a.selected && a.status === 'pending').length;
      return { ...prev, accounts, recoverableSol: selectedCount * RENT_PER_ACCOUNT };
    });
  }, []);

  const selectAll = useCallback(() => {
    setScanResult((prev) => {
      if (!prev) return prev;
      const accounts = prev.accounts.map((a) => a.status === 'pending' ? { ...a, selected: true } : a);
      const selectedCount = accounts.filter(a => a.selected && a.status === 'pending').length;
      return { ...prev, accounts, recoverableSol: selectedCount * RENT_PER_ACCOUNT };
    });
  }, []);

  const deselectAll = useCallback(() => {
    setScanResult((prev) => {
      if (!prev) return prev;
      return { ...prev, accounts: prev.accounts.map((a) => ({ ...a, selected: false })), recoverableSol: 0 };
    });
  }, []);

  return {
    scanResult,
    isScanning,
    isReclaiming,
    scanError,
    scanProgress,
    scanForDust,
    reclaimDust,
    toggleAccountSelection,
    selectAll,
    deselectAll,
  };
};
