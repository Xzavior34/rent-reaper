import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

interface EvmWalletContextType {
  address: string | null;
  connected: boolean;
  connecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  truncatedAddress: string;
  sendTransaction: (to: string, data: string) => Promise<string>;
}

const EvmWalletContext = createContext<EvmWalletContextType | undefined>(undefined);

const BSC_CHAIN_ID = '0x38';

export const EvmWalletProvider = ({ children }: { children: ReactNode }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connected = !!address;
  const truncatedAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : '';

  const getProvider = useCallback(() => {
    if (typeof window === 'undefined') return null;
    return window.ethereum ?? null;
  }, []);

  // Check if already connected on mount
  useEffect(() => {
    const provider = getProvider();
    if (!provider) return;

    const check = async () => {
      try {
        const accounts: string[] = await provider.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setAddress(accounts[0]);
        }
      } catch {
        // silently fail
      }
    };
    check();
  }, [getProvider]);

  // Listen for account/chain changes
  useEffect(() => {
    const provider = getProvider();
    if (!provider) return;

    const handleAccounts = (accounts: string[]) => {
      setAddress(accounts.length > 0 ? accounts[0] : null);
    };
    const handleChainChanged = () => {
      // Reload to ensure correct chain state
      window.location.reload();
    };

    provider.on('accountsChanged', handleAccounts);
    provider.on('chainChanged', handleChainChanged);
    return () => {
      provider.removeListener('accountsChanged', handleAccounts);
      provider.removeListener('chainChanged', handleChainChanged);
    };
  }, [getProvider]);

  const ensureBscChain = useCallback(async (provider: NonNullable<Window['ethereum']>) => {
    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: BSC_CHAIN_ID }],
      });
    } catch (switchError: any) {
      // Chain not added yet
      if (switchError.code === 4902 || switchError.code === -32603) {
        await provider.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: BSC_CHAIN_ID,
            chainName: 'BNB Smart Chain Mainnet',
            nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
            rpcUrls: ['https://bsc-dataseed.binance.org', 'https://bsc-dataseed1.defibit.io'],
            blockExplorerUrls: ['https://bscscan.com'],
          }],
        });
      } else if (switchError.code === 4001) {
        throw new Error('User rejected chain switch');
      } else {
        throw switchError;
      }
    }
  }, []);

  const connect = useCallback(async () => {
    const provider = getProvider();
    if (!provider) {
      setError('No EVM wallet found. Install MetaMask or Trust Wallet to connect.');
      return;
    }

    setConnecting(true);
    setError(null);

    try {
      // First request accounts (triggers wallet popup)
      const accounts: string[] = await provider.request({ method: 'eth_requestAccounts' });

      if (accounts.length === 0) {
        throw new Error('No accounts returned from wallet');
      }

      // Then switch to BSC
      await ensureBscChain(provider);

      setAddress(accounts[0]);
    } catch (err: any) {
      const message = err?.code === 4001
        ? 'Connection rejected by user'
        : err instanceof Error
          ? err.message
          : 'Failed to connect wallet';
      setError(message);
    } finally {
      setConnecting(false);
    }
  }, [getProvider, ensureBscChain]);

  const disconnect = useCallback(() => {
    setAddress(null);
    setError(null);
  }, []);

  const sendTransaction = useCallback(async (to: string, data: string): Promise<string> => {
    const provider = getProvider();
    if (!provider || !address) throw new Error('Wallet not connected');

    await ensureBscChain(provider);

    const txHash: string = await provider.request({
      method: 'eth_sendTransaction',
      params: [{
        from: address,
        to,
        data,
        value: '0x0',
      }],
    });

    return txHash;
  }, [getProvider, address, ensureBscChain]);

  return (
    <EvmWalletContext.Provider value={{ address, connected, connecting, error, connect, disconnect, truncatedAddress, sendTransaction }}>
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
      sendTransaction: async () => { throw new Error('No provider'); return ''; },
    };
  }
  return context;
};
