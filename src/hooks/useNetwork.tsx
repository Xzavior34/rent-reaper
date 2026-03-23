import { createContext, useContext, useState, ReactNode } from 'react';

type NetworkType = 'devnet' | 'mainnet-beta';

interface NetworkContextType {
  network: NetworkType;
  setNetwork: (network: NetworkType) => void;
  isMainnet: boolean;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const NetworkProvider = ({ children }: { children: ReactNode }) => {
  // Removed the localStorage logic that caused the freeze.
  // We are just setting a clean, simple default to Mainnet.
  const [network, setNetwork] = useState<NetworkType>('mainnet-beta');

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
    return {
      network: 'mainnet-beta' as NetworkType,
      setNetwork: () => {},
      isMainnet: true,
    };
  }
  return context;
};
