import { FC, useMemo } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletReadyState } from '@solana/wallet-adapter-base';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Wallet, X } from 'lucide-react';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ALWAYS_SHOW = ['mobile wallet adapter', 'walletconnect'];

export const WalletModal: FC<WalletModalProps> = ({ isOpen, onClose }) => {
  const { wallets, select } = useWallet();

  const filteredWallets = useMemo(() => {
    return wallets.filter((wallet) => {
      const name = wallet.adapter.name.toLowerCase();
      if (ALWAYS_SHOW.some((s) => name.includes(s))) return true;
      return (
        wallet.readyState === WalletReadyState.Installed ||
        wallet.readyState === WalletReadyState.Loadable
      );
    });
  }, [wallets]);

  const handleSelect = (walletName: string) => {
    const wallet = wallets.find((w) => w.adapter.name === walletName);
    if (wallet) {
      select(wallet.adapter.name);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-mono text-foreground">
            <Wallet className="w-5 h-5 text-primary" />
            Connect Wallet
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2 mt-4">
          {filteredWallets.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6 font-mono">
              No wallets detected. Install a Solana wallet extension to continue.
            </p>
          ) : (
            filteredWallets.map((wallet) => (
              <Button
                key={wallet.adapter.name}
                variant="outline"
                className="w-full justify-start gap-3 h-14 border-border bg-secondary/30 hover:bg-secondary/60 hover:border-primary/40 transition-all font-mono"
                onClick={() => handleSelect(wallet.adapter.name)}
              >
                {wallet.adapter.icon && (
                  <img
                    src={wallet.adapter.icon}
                    alt={wallet.adapter.name}
                    className="w-6 h-6 rounded"
                  />
                )}
                <span className="text-foreground">{wallet.adapter.name}</span>
                {wallet.readyState === WalletReadyState.Installed && (
                  <span className="ml-auto text-xs text-primary font-mono">Detected</span>
                )}
              </Button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
