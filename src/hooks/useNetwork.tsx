import { createContext, useContext, useState, ReactNode } from 'react';

type NetworkType = 'devnet' | 'mainnet-beta';

interface NetworkContextType {
  network: NetworkType;
  setNetwork: (network: NetworkType) => void;
  isMainnet: boolean;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const NetworkProvider = ({ children }: { children: ReactNode }) => {
  // 1. Check local storage first, default to MAINNET if nothing is saved
  const [network, setNetworkState] = useState<NetworkType>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('korakeep-network');
      if (saved === 'mainnet-beta' || saved === 'devnet') {
        return saved;
      }
    }
    // 👇 DEFAULT CHANGED TO MAINNET 👇
    return 'mainnet-beta'; 
  });

  // 2. Save the choice to local storage whenever the user toggles it
  const setNetwork = (newNetwork: NetworkType) => {
    setNetworkState(newNetwork);
    if (typeof window !== 'undefined') {
      localStorage.setItem('korakeep-network', newNetwork);
    }
  };

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
    // Return default values if used outside provider
    return {
      network: 'mainnet-beta' as NetworkType, // 👇 CHANGED HERE
      setNetwork: () => {},
      isMainnet: true, // 👇 AND HERE
    };
  }
  return context;
};
