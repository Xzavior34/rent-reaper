import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

interface EvmWalletContextType {
  address: string | null;
  connected: boolean;
  connecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  truncatedAddress: string;
}

const EvmWalletContext = createContext<EvmWalletContextType | undefined>(undefined);

export const EvmWalletProvider = ({ children }: { children: ReactNode }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connected = !!address;
  const truncatedAddress = address 
    ? `${address.slice(0, 6)}...${address.slice(-4)}` 
    : '';

  // Check if already connected
  useEffect(() => {
    const check = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) setAddress(accounts[0]);
        } catch {
          // silently fail
        }
      }
    };
    check();
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (!window.ethereum) return;
    const handler = (accounts: string[]) => {
      setAddress(accounts.length > 0 ? accounts[0] : null);
    };
    window.ethereum.on('accountsChanged', handler);
    return () => { window.ethereum?.removeListener('accountsChanged', handler); };
  }, []);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setError('No EVM wallet found. Please install MetaMask or Trust Wallet.');
      return;
    }
    setConnecting(true);
    setError(null);
    try {
      // Try switching to BSC
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x38' }],
        });
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x38',
              chainName: 'BNB Smart Chain',
              nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
              rpcUrls: ['https://bsc-dataseed.binance.org'],
              blockExplorerUrls: ['https://bscscan.com'],
            }],
          });
        }
      }
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts.length > 0) setAddress(accounts[0]);
    } catch (err) {
      console.error('EVM connect error:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setError(null);
  }, []);

  return (
    <EvmWalletContext.Provider value={{ address, connected, connecting, error, connect, disconnect, truncatedAddress }}>
      {children}
    </EvmWalletContext.Provider>
  );
};

export const useEvmWallet = () => {
  const context = useContext(EvmWalletContext);
  if (!context) {
    return {
      address: null,
      connected: false,
      connecting: false,
      error: null,
      connect: async () => {},
      disconnect: () => {},
      truncatedAddress: '',
    };
  }
  return context;
};
