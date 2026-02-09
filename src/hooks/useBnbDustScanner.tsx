import { useState, useCallback } from 'react';
import type { DustAccount, ScanResult } from './useDustScanner';

const BSC_RPC = 'https://bsc-dataseed.binance.org';

export const useBnbDustScanner = () => {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  const scanForDust = useCallback(async (address: string): Promise<{ success: boolean; error?: string }> => {
    if (!address) return { success: false, error: 'No wallet address' };

    setIsScanning(true);
    setScanError(null);

    try {
      console.log('Starting BNB scan for:', address);

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
        console.warn('Ankr API error, trying fallback:', data.error);
        throw new Error(data.error.message || 'Ankr API error');
      }

      const dustAccounts: DustAccount[] = [];
      const allAssets = data.result?.assets || [];

      for (const asset of allAssets) {
        const balance = parseFloat(asset.balance || '0');
        const balanceUsd = parseFloat(asset.balanceUsd || '0');

        // Consider dust: USD value < $0.01 or zero balance, skip native BNB
        const isDust = (balanceUsd < 0.01 || balance === 0) && asset.tokenType !== 'NATIVE';

        if (isDust) {
          dustAccounts.push({
            address: asset.contractAddress || address,
            mint: asset.contractAddress || '',
            type: 'BEP20',
            balance,
            status: 'pending',
            selected: false, // BNB dust can't be reclaimed
            symbol: asset.tokenSymbol,
            tokenName: asset.tokenName,
            chain: 'bnb',
          });
        }
      }

      console.log('BNB dust tokens found:', dustAccounts.length, 'out of', allAssets.length, 'total assets');

      setScanResult({
        totalScanned: allAssets.length,
        dustDetected: dustAccounts.length,
        recoverableSol: 0,
        accounts: dustAccounts,
      });

      return { success: true };
    } catch (error) {
      console.warn('Ankr multichain failed, using BSC RPC fallback:', error);

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

        const bnbBalance = parseInt(balanceData.result, 16) / 1e18;
        console.log('Native BNB balance:', bnbBalance);

        setScanResult({
          totalScanned: 1,
          dustDetected: 0,
          recoverableSol: 0,
          accounts: [],
        });

        return { success: true };
      } catch (fallbackError) {
        console.error('BSC fallback also failed:', fallbackError);
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
    isReclaiming: false,
    scanError,
    scanForDust,
    toggleAccountSelection,
    selectAll,
    deselectAll,
    resetScan,
  };
};
