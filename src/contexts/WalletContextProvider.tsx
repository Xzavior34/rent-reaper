import { FC, ReactNode, useMemo, useCallback } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalContextProvider } from '@/contexts/WalletModalContext';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import { TorusWalletAdapter } from '@solana/wallet-adapter-torus';
import { CoinbaseWalletAdapter } from '@solana/wallet-adapter-coinbase';
import { TrustWalletAdapter } from '@solana/wallet-adapter-trust';
import { WalletConnectWalletAdapter } from '@walletconnect/solana-adapter';
import {
  SolanaMobileWalletAdapter,
  createDefaultAddressSelector,
  createDefaultAuthorizationResultCache,
  createDefaultWalletNotFoundHandler,
} from '@solana-mobile/wallet-adapter-mobile';
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
      return 'https://solana-rpc.publicnode.com';
    }
    return clusterApiUrl(WalletAdapterNetwork.Devnet);
  }, [network]);

  const walletNetwork = network === 'mainnet-beta' 
    ? WalletAdapterNetwork.Mainnet 
    : WalletAdapterNetwork.Devnet;

  const wallets = useMemo(
    () => [
      new SolanaMobileWalletAdapter({
        addressSelector: createDefaultAddressSelector(),
        appIdentity: { name: 'KoraKeep', uri: window.location.origin },
        authorizationResultCache: createDefaultAuthorizationResultCache(),
        chain: walletNetwork === WalletAdapterNetwork.Mainnet ? 'solana:mainnet' : 'solana:devnet',
        onWalletNotFound: createDefaultWalletNotFoundHandler(),
      }),
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new TrustWalletAdapter(),
      new CoinbaseWalletAdapter(),
      new TorusWalletAdapter(),
      new WalletConnectWalletAdapter({
        network: walletNetwork,
        options: {
          projectId: WALLETCONNECT_PROJECT_ID,
        },
      }),
    ],
    [walletNetwork]
  );

  const onError = useCallback((error: Error) => {
    console.error('Wallet error:', error);
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} onError={onError} autoConnect>
        <WalletModalContextProvider>{children}</WalletModalContextProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
