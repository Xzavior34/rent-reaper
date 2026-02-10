import { useState, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, ParsedAccountData, ConfirmedSignatureInfo } from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  createCloseAccountInstruction,
} from '@solana/spl-token';
import { Transaction } from '@solana/web3.js';

// Wrapped SOL mint address
const WSOL_MINT = new PublicKey('So11111111111111111111111111111111111111112');

// Rent per token account (approximately 0.00203928 SOL)
const RENT_PER_ACCOUNT = 0.00203928;

export interface DustAccount {
  address: string;
  mint: string;
  type: 'wSOL' | 'Token' | 'BEP20';
  balance: number;
  status: 'pending' | 'processing' | 'closed' | 'error' | 'protected';
  selected: boolean;
  createdAt?: number;
  symbol?: string;
  tokenName?: string;
  chain?: 'solana' | 'bnb';
  decimals?: number;
  rawBalance?: string;
}

export interface ScanResult {
  totalScanned: number;
  dustDetected: number;
  recoverableSol: number;
  accounts: DustAccount[];
}

interface UseDustScannerReturn {
  scanResult: ScanResult | null;
  isScanning: boolean;
  isReclaiming: boolean;
  scanError: string | null;
  scanForDust: (safeModeEnabled: boolean) => Promise<{ success: boolean; error?: string }>;
  reclaimDust: (accountsToClose: DustAccount[]) => Promise<{ success: boolean; reclaimed: number; closed: number }>;
  toggleAccountSelection: (address: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
}

export const useDustScanner = (): UseDustScannerReturn => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isReclaiming, setIsReclaiming] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  const getAccountAge = useCallback(
    async (accountAddress: string): Promise<number | null> => {
      try {
        const signatures: ConfirmedSignatureInfo[] = await connection.getSignaturesForAddress(
          new PublicKey(accountAddress),
          { limit: 1 }
        );
        if (signatures.length > 0 && signatures[0].blockTime) {
          return signatures[0].blockTime * 1000; // Convert to milliseconds
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
      
      try {
        console.log('Starting scan on network, publicKey:', publicKey.toBase58());
        
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
          programId: TOKEN_PROGRAM_ID,
        });

        console.log('Found token accounts:', tokenAccounts.value.length);

        const dustAccounts: DustAccount[] = [];
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

        for (const account of tokenAccounts.value) {
          const parsedData = account.account.data as ParsedAccountData;
          const info = parsedData.parsed?.info;

          if (!info) continue;

          const mint = info.mint as string;
          const balance = info.tokenAmount?.uiAmount || 0;
          const isWsol = mint === WSOL_MINT.toBase58();

          // Check if this is a dust account
          const isDust = balance === 0 || (isWsol && balance < 0.001);

          if (isDust) {
            let createdAt: number | undefined;
            let isProtected = false;

            if (safeModeEnabled) {
              createdAt = (await getAccountAge(account.pubkey.toBase58())) ?? undefined;
              if (createdAt && createdAt > oneDayAgo) {
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
        }

        const selectableAccounts = dustAccounts.filter((a) => a.status !== 'protected');

        console.log('Dust accounts found:', dustAccounts.length);

        // Always set result, even if empty
        setScanResult({
          totalScanned: tokenAccounts.value.length,
          dustDetected: dustAccounts.length,
          recoverableSol: selectableAccounts.length * RENT_PER_ACCOUNT,
          accounts: dustAccounts,
        });

        return { success: true };
      } catch (error) {
        console.error('Scan error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to scan wallet';
        setScanError(errorMessage);
        
        // Set empty result so we still navigate to dashboard
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
    async (accountsToClose: DustAccount[]) => {
      if (!publicKey || !sendTransaction) {
        return { success: false, reclaimed: 0, closed: 0 };
      }

      setIsReclaiming(true);
      let totalClosed = 0;

      try {
        // Filter only selected pending accounts
        const toClose = accountsToClose.filter(
          (a) => a.selected && a.status === 'pending'
        );

        // Update status to processing
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

        // Batch transactions (max 20 per tx to avoid size limits)
        const BATCH_SIZE = 20;
        for (let i = 0; i < toClose.length; i += BATCH_SIZE) {
          const batch = toClose.slice(i, i + BATCH_SIZE);
          const transaction = new Transaction();

          for (const account of batch) {
            const instruction = createCloseAccountInstruction(
              new PublicKey(account.address),
              publicKey, // destination - send rent back to wallet
              publicKey  // owner
            );
            transaction.add(instruction);
          }

          const signature = await sendTransaction(transaction, connection);
          await connection.confirmTransaction(signature, 'confirmed');

          // Update status for closed accounts
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
        }

        const reclaimedSol = totalClosed * RENT_PER_ACCOUNT;

        // Update recoverable SOL
        setScanResult((prev) => {
          if (!prev) return prev;
          const remaining = prev.accounts.filter(
            (a) => a.status === 'pending' && a.selected
          ).length;
          return {
            ...prev,
            recoverableSol: remaining * RENT_PER_ACCOUNT,
          };
        });

        return { success: true, reclaimed: reclaimedSol, closed: totalClosed };
      } catch (error) {
        console.error('Reclaim error:', error);
        
        // Update status to error for processing accounts
        setScanResult((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            accounts: prev.accounts.map((a) =>
              a.status === 'processing' ? { ...a, status: 'error' as const } : a
            ),
          };
        });

        return { success: false, reclaimed: 0, closed: totalClosed };
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
        a.address === address && a.status === 'pending'
          ? { ...a, selected: !a.selected }
          : a
      );
      const selectedCount = accounts.filter(
        (a) => a.selected && a.status === 'pending'
      ).length;
      return {
        ...prev,
        accounts,
        recoverableSol: selectedCount * RENT_PER_ACCOUNT,
      };
    });
  }, []);

  const selectAll = useCallback(() => {
    setScanResult((prev) => {
      if (!prev) return prev;
      const accounts = prev.accounts.map((a) =>
        a.status === 'pending' ? { ...a, selected: true } : a
      );
      const selectedCount = accounts.filter(
        (a) => a.selected && a.status === 'pending'
      ).length;
      return {
        ...prev,
        accounts,
        recoverableSol: selectedCount * RENT_PER_ACCOUNT,
      };
    });
  }, []);

  const deselectAll = useCallback(() => {
    setScanResult((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        accounts: prev.accounts.map((a) => ({ ...a, selected: false })),
        recoverableSol: 0,
      };
    });
  }, []);

  return {
    scanResult,
    isScanning,
    isReclaiming,
    scanError,
    scanForDust,
    reclaimDust,
    toggleAccountSelection,
    selectAll,
    deselectAll,
  };
};
