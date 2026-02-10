import { useState, useCallback } from 'react';
import type { DustAccount, ScanResult } from './useDustScanner';

const BSC_RPC = 'https://bsc-dataseed.binance.org';
const BURN_ADDRESS = '0x000000000000000000000000000000000000dEaD';

// ERC20 transfer function signature: transfer(address,uint256)
const encodeTransfer = (to: string, amount: bigint): string => {
  const fnSig = '0xa9059cbb'; // keccak256("transfer(address,uint256)") first 4 bytes
  const paddedTo = to.slice(2).padStart(64, '0');
  const paddedAmount = amount.toString(16).padStart(64, '0');
  return `${fnSig}${paddedTo}${paddedAmount}`;
};

export const useBnbDustScanner = () => {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isReclaiming, setIsReclaiming] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  const scanForDust = useCallback(async (address: string): Promise<{ success: boolean; error?: string }> => {
    if (!address) return { success: false, error: 'No wallet address' };

    setIsScanning(true);
    setScanError(null);

    try {
      // Use Ankr multichain API for token balances
      const response = await fetch('https://rpc.ankr.com/multichain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'ankr_getAccountBalance',
          params: {
            blockchain: ['bsc'],
            walletAddress: address,
            onlyWhitelisted: false,
          },
          id: 1,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message || 'Ankr API error');
      }

      const dustAccounts: DustAccount[] = [];
      const allAssets = data.result?.assets || [];

      for (const asset of allAssets) {
        const balance = parseFloat(asset.balance || '0');
        const balanceUsd = parseFloat(asset.balanceUsd || '0');
        const decimals = parseInt(asset.tokenDecimals || '18', 10);

        // Consider dust: USD value < $0.01 or zero balance, skip native BNB
        const isDust = (balanceUsd < 0.01 || balance === 0) && asset.tokenType !== 'NATIVE';

        if (isDust && asset.contractAddress) {
          dustAccounts.push({
            address: asset.contractAddress,
            mint: asset.contractAddress,
            type: 'BEP20',
            balance,
            status: 'pending',
            selected: balance > 0, // Auto-select tokens with non-zero balance (can be swept)
            symbol: asset.tokenSymbol || 'Unknown',
            tokenName: asset.tokenName || 'Unknown Token',
            chain: 'bnb',
            decimals,
            rawBalance: asset.balanceRawInteger || '0',
          });
        }
      }

      setScanResult({
        totalScanned: allAssets.length,
        dustDetected: dustAccounts.length,
        recoverableSol: 0,
        accounts: dustAccounts,
      });

      return { success: true };
    } catch (error) {
      // Fallback: get native BNB balance only
      try {
        const balanceResponse = await fetch(BSC_RPC, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_getBalance',
            params: [address, 'latest'],
            id: 1,
          }),
        });

        const balanceData = await balanceResponse.json();

        if (balanceData.error) {
          throw new Error(balanceData.error.message || 'BSC RPC error');
        }

        setScanResult({
          totalScanned: 1,
          dustDetected: 0,
          recoverableSol: 0,
          accounts: [],
        });

        return { success: true };
      } catch (fallbackError) {
        const errorMessage = fallbackError instanceof Error ? fallbackError.message : 'Failed to scan BNB wallet';
        setScanError(errorMessage);
        setScanResult({
          totalScanned: 0,
          dustDetected: 0,
          recoverableSol: 0,
          accounts: [],
        });
        return { success: false, error: errorMessage };
      }
    } finally {
      setIsScanning(false);
    }
  }, []);

  const reclaimDust = useCallback(async (
    accountsToClose: DustAccount[],
    sendTransaction: (to: string, data: string) => Promise<string>
  ): Promise<{ success: boolean; swept: number; failed: number }> => {
    const toSweep = accountsToClose.filter(a => a.selected && a.status === 'pending' && a.balance > 0);

    if (toSweep.length === 0) {
      return { success: false, swept: 0, failed: 0 };
    }

    setIsReclaiming(true);
    let swept = 0;
    let failed = 0;

    // Update status to processing
    setScanResult(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        accounts: prev.accounts.map(a =>
          toSweep.find(s => s.address === a.address)
            ? { ...a, status: 'processing' as const }
            : a
        ),
      };
    });

    for (const account of toSweep) {
      try {
        const rawBalance = account.rawBalance || '0';
        const amount = BigInt(rawBalance);
        
        if (amount <= 0n) {
          // Skip zero balance
          setScanResult(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              accounts: prev.accounts.map(a =>
                a.address === account.address ? { ...a, status: 'closed' as const, selected: false } : a
              ),
            };
          });
          swept++;
          continue;
        }

        const data = encodeTransfer(BURN_ADDRESS, amount);
        await sendTransaction(account.address, data);

        setScanResult(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            accounts: prev.accounts.map(a =>
              a.address === account.address ? { ...a, status: 'closed' as const, selected: false } : a
            ),
          };
        });
        swept++;
      } catch (err) {
        setScanResult(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            accounts: prev.accounts.map(a =>
              a.address === account.address ? { ...a, status: 'error' as const } : a
            ),
          };
        });
        failed++;
      }
    }

    setIsReclaiming(false);
    return { success: swept > 0, swept, failed };
  }, []);

  const toggleAccountSelection = useCallback((addr: string) => {
    setScanResult(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        accounts: prev.accounts.map(a =>
          a.address === addr && a.status === 'pending' ? { ...a, selected: !a.selected } : a
        ),
      };
    });
  }, []);

  const selectAll = useCallback(() => {
    setScanResult(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        accounts: prev.accounts.map(a =>
          a.status === 'pending' ? { ...a, selected: true } : a
        ),
      };
    });
  }, []);

  const deselectAll = useCallback(() => {
    setScanResult(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        accounts: prev.accounts.map(a => ({ ...a, selected: false })),
      };
    });
  }, []);

  const resetScan = useCallback(() => {
    setScanResult(null);
    setScanError(null);
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
    resetScan,
  };
};
