import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@/contexts/WalletModalContext';
import { Button } from '@/components/ui/button';
import { Wallet, LogOut } from 'lucide-react';
import { FC } from 'react';

interface WalletButtonProps {
  className?: string;
  size?: 'default' | 'lg';
}

export const WalletButton: FC<WalletButtonProps> = ({ className = '', size = 'default' }) => {
  const { connected, publicKey, disconnect, wallet } = useWallet();
  const { open } = useWalletModal();

  const truncate = (addr: string) => `${addr.slice(0, 4)}...${addr.slice(-4)}`;

  if (connected && publicKey) {
    return (
      <Button
        variant="outline"
        size={size}
        onClick={() => disconnect()}
        className={`gap-2 font-mono border-border bg-secondary/30 hover:bg-destructive/20 hover:border-destructive/40 hover:text-destructive transition-all ${className}`}
      >
        {wallet?.adapter.icon && (
          <img src={wallet.adapter.icon} alt="" className="w-4 h-4 rounded" />
        )}
        <span>{truncate(publicKey.toBase58())}</span>
        <LogOut className="w-3.5 h-3.5" />
      </Button>
    );
  }

  return (
    <Button
      size={size}
      onClick={open}
      className={`gap-2 font-mono bg-primary text-primary-foreground hover:bg-primary/90 ${className}`}
    >
      <Wallet className="w-4 h-4" />
      Connect Wallet
    </Button>
  );
};
