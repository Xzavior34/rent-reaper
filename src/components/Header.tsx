import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useNetwork } from '@/hooks/useNetwork';
import { useChain } from '@/hooks/useChain';
import { useEvmWallet } from '@/hooks/useEvmWallet';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BotStatus } from '@/components/BotStatus';
import { Zap, Shield, Wallet, LogOut } from 'lucide-react';

export const Header = () => {
  const { connected: solConnected, publicKey } = useWallet();
  const { network, setNetwork, isMainnet } = useNetwork();
  const { chain, setChain } = useChain();
  const { connected: evmConnected, truncatedAddress, connect: connectEvm, disconnect: disconnectEvm, connecting: evmConnecting } = useEvmWallet();

  const isSolana = chain === 'solana';
  const isBnb = chain === 'bnb';

  const truncateSolAddress = (address: string) => {
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

        {/* Controls */}
        <div className="flex items-center gap-3">
          {/* Chain Selector */}
          <div className="flex items-center bg-secondary/50 rounded-lg p-1">
            <button
              onClick={() => setChain('solana')}
              className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-all ${
                isSolana
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              SOL
            </button>
            <button
              onClick={() => setChain('bnb')}
              className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-all ${
                isBnb
                  ? 'bg-[hsl(45,100%,50%)] text-black'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              BNB
            </button>
          </div>

          {/* Network Toggle (Solana only) */}
          {isSolana && (
            <div className="hidden md:flex items-center gap-3 bg-secondary/50 rounded-lg px-4 py-2">
              <div className="flex items-center gap-2">
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
          )}

          {/* BSC Mainnet Badge */}
          {isBnb && (
            <Badge variant="outline" className="hidden md:flex text-[hsl(45,100%,50%)] border-[hsl(45,100%,50%)]">
              BSC Mainnet
            </Badge>
          )}

          {/* Bot Status */}
          <BotStatus className="hidden md:flex" />

          {/* Wallet Address Display */}
          {isSolana && solConnected && publicKey && (
            <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/30 border border-border">
              <div className="w-2 h-2 rounded-full bg-primary pulse-dot" />
              <code className="text-xs font-mono text-muted-foreground">
                {truncateSolAddress(publicKey.toBase58())}
              </code>
            </div>
          )}
          {isBnb && evmConnected && (
            <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/30 border border-border">
              <div className="w-2 h-2 rounded-full bg-[hsl(45,100%,50%)] pulse-dot" />
              <code className="text-xs font-mono text-muted-foreground">
                {truncatedAddress}
              </code>
            </div>
          )}

          {/* Wallet Button */}
          {isSolana ? (
            <WalletMultiButton className="!bg-primary !text-primary-foreground hover:!bg-primary/90 !rounded-lg !h-10 !font-semibold" />
          ) : evmConnected ? (
            <Button
              variant="outline"
              size="sm"
              onClick={disconnectEvm}
              className="font-mono h-10"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Disconnect
            </Button>
          ) : (
            <Button
              onClick={connectEvm}
              disabled={evmConnecting}
              className="bg-[hsl(45,100%,50%)] text-black hover:bg-[hsl(45,100%,45%)] font-semibold h-10 rounded-lg"
            >
              <Wallet className="w-4 h-4 mr-2" />
              {evmConnecting ? 'Connecting...' : 'Connect Wallet'}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
