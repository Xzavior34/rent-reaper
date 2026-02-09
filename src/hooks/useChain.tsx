import { createContext, useContext, useState, ReactNode } from 'react';

export type ChainType = 'solana' | 'bnb';

interface ChainContextType {
  chain: ChainType;
  setChain: (chain: ChainType) => void;
}

const ChainContext = createContext<ChainContextType | undefined>(undefined);

export const ChainProvider = ({ children }: { children: ReactNode }) => {
  const [chain, setChain] = useState<ChainType>('solana');

  return (
    <ChainContext.Provider value={{ chain, setChain }}>
      {children}
    </ChainContext.Provider>
  );
};

export const useChain = () => {
  const context = useContext(ChainContext);
  if (!context) {
    return { chain: 'solana' as ChainType, setChain: () => {} };
  }
  return context;
};
