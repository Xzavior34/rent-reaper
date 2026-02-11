import { FC, ReactNode, useMemo, useCallback } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
  CoinbaseWalletAdapter,
  TrustWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { WalletConnectWalletAdapter } from '@walletconnect/solana-adapter';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { clusterApiUrl } from '@solana/web3.js';
import { useNetwork } from '@/hooks/useNetwork';

import '@solana/wallet-adapter-react-ui/styles.css';

// WalletConnect Project ID - Get yours at https://cloud.walletconnect.com
const WALLETCONNECT_PROJECT_ID = 'e899c82be21d4acca2c8aec45e893598';

interface WalletContextProviderProps {
  children: ReactNode;
}

export const WalletContextProvider: FC<WalletContextProviderProps> = ({ children }) => {
  const { network } = useNetwork();

  const endpoint = useMemo(() => {
    if (network === 'mainnet-beta') {
      // Use PublicNode free RPC (CORS-compatible, no API key needed)
      return 'https://solana-rpc.publicnode.com';
    }
    return clusterApiUrl(WalletAdapterNetwork.Devnet);
  }, [network]);

  const walletNetwork = network === 'mainnet-beta' 
    ? WalletAdapterNetwork.Mainnet 
    : WalletAdapterNetwork.Devnet;

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new TrustWalletAdapter(),
      new WalletConnectWalletAdapter({
        network: walletNetwork,
        options: {
          projectId: WALLETCONNECT_PROJECT_ID,
        },
      }),
      new TorusWalletAdapter(),
      new CoinbaseWalletAdapter(),
    ],
    [walletNetwork]
  );

  const onError = useCallback((error: Error) => {
    console.error('Wallet error:', error);
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} onError={onError} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
