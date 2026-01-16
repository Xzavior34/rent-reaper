import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useNetwork } from '@/hooks/useNetwork';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Zap, Shield } from 'lucide-react';

export const Header = () => {
  const { connected } = useWallet();
  const { network, setNetwork, isMainnet } = useNetwork();

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center glow-green">
            <Zap className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight">
              <span className="text-primary">Kora</span>
              <span className="text-foreground">Keep</span>
            </h1>
            <p className="text-xs text-muted-foreground font-mono">RENT RECLAMATION</p>
          </div>
        </div>

        {/* Network Selector + Wallet */}
        <div className="flex items-center gap-4">
          {/* Network Toggle */}
          <div className="flex items-center gap-3 bg-secondary/50 rounded-lg px-4 py-2">
            <span className={`text-sm font-mono ${!isMainnet ? 'text-primary' : 'text-muted-foreground'}`}>
              Devnet
            </span>
            <Switch
              checked={isMainnet}
              onCheckedChange={(checked) => setNetwork(checked ? 'mainnet-beta' : 'devnet')}
            />
            <span className={`text-sm font-mono ${isMainnet ? 'text-primary' : 'text-muted-foreground'}`}>
              Mainnet
            </span>
            {isMainnet && (
              <Badge variant="outline" className="ml-2 text-accent border-accent">
                <Shield className="w-3 h-3 mr-1" />
                LIVE
              </Badge>
            )}
          </div>

          {/* Wallet Button */}
          <WalletMultiButton className="!bg-primary !text-primary-foreground hover:!bg-primary/90 !rounded-lg !h-10 !font-semibold" />
        </div>
      </div>
    </header>
  );
};
