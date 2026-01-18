import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useNetwork } from '@/hooks/useNetwork';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { BotStatus } from '@/components/BotStatus';
import { Zap, Shield } from 'lucide-react';

export const Header = () => {
  const { connected, publicKey } = useWallet();
  const { network, setNetwork, isMainnet } = useNetwork();

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

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
            <div className="flex items-center gap-2">
              {/* Pulsing Network Indicator */}
              <div 
                className={`w-2 h-2 rounded-full pulse-dot ${
                  isMainnet ? 'bg-primary' : 'bg-accent'
                }`} 
              />
              <span className={`text-sm font-mono ${!isMainnet ? 'text-accent' : 'text-muted-foreground'}`}>
                DEV
              </span>
            </div>
            <Switch
              checked={isMainnet}
              onCheckedChange={(checked) => setNetwork(checked ? 'mainnet-beta' : 'devnet')}
            />
            <div className="flex items-center gap-2">
              <span className={`text-sm font-mono ${isMainnet ? 'text-primary' : 'text-muted-foreground'}`}>
                MAIN
              </span>
            </div>
            {isMainnet && (
              <Badge variant="outline" className="ml-2 text-primary border-primary">
                <Shield className="w-3 h-3 mr-1" />
                LIVE
              </Badge>
            )}
          </div>

          {/* Bot Status Indicator */}
          <BotStatus className="hidden md:flex" />

          {/* Connected Wallet Address */}
          {connected && publicKey && (
            <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/30 border border-border">
              <div className="w-2 h-2 rounded-full bg-primary pulse-dot" />
              <code className="text-xs font-mono text-muted-foreground">
                {truncateAddress(publicKey.toBase58())}
              </code>
            </div>
          )}

          {/* Wallet Button */}
          <WalletMultiButton className="!bg-primary !text-primary-foreground hover:!bg-primary/90 !rounded-lg !h-10 !font-semibold" />
        </div>
      </div>
    </header>
  );
};
