import { createContext, useContext, useState, FC, ReactNode, useCallback } from 'react';

interface WalletModalContextType {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

const WalletModalContext = createContext<WalletModalContextType>({
  isOpen: false,
  open: () => {},
  close: () => {},
});

export const useWalletModal = () => useContext(WalletModalContext);

export const WalletModalContextProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  return (
    <WalletModalContext.Provider value={{ isOpen, open, close }}>
      {children}
    </WalletModalContext.Provider>
  );
};
