import { createContext, useContext, useState, ReactNode } from 'react';

type NetworkType = 'devnet' | 'mainnet-beta';

interface NetworkContextType {
  network: NetworkType;
  setNetwork: (network: NetworkType) => void;
  isMainnet: boolean;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const NetworkProvider = ({ children }: { children: ReactNode }) => {
  const [network, setNetwork] = useState<NetworkType>('devnet');

  return (
    <NetworkContext.Provider
      value={{
        network,
        setNetwork,
        isMainnet: network === 'mainnet-beta',
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (!context) {
    // Return default values if used outside provider (for initial setup)
    return {
      network: 'devnet' as NetworkType,
      setNetwork: () => {},
      isMainnet: false,
    };
  }
  return context;
};
