import { useState } from 'react';
import { useNetwork } from '@/hooks/useNetwork';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { BotStatus } from '@/components/BotStatus';
import { WalletButton } from '@/components/WalletButton';
import { Button } from '@/components/ui/button';
import { Zap, Shield, Menu, X } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

export const Header = () => {
  const { network, setNetwork, isMainnet } = useNetwork();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center glow-green">
            <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          </div>
          <div>
            <h1 className="font-bold text-lg sm:text-xl tracking-tight">
              <span className="text-primary">Kora</span>
              <span className="text-foreground">Keep</span>
            </h1>
            <p className="text-[10px] sm:text-xs text-muted-foreground font-mono">RENT RECLAMATION</p>
          </div>
        </div>

        {/* Desktop Controls */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-3 bg-secondary/50 rounded-lg px-4 py-2">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full pulse-dot ${isMainnet ? 'bg-primary' : 'bg-accent'}`} />
              <span className={`text-sm font-mono ${!isMainnet ? 'text-accent' : 'text-muted-foreground'}`}>DEV</span>
            </div>
            <Switch
              checked={isMainnet}
              onCheckedChange={(checked) => setNetwork(checked ? 'mainnet-beta' : 'devnet')}
            />
            <div className="flex items-center gap-2">
              <span className={`text-sm font-mono ${isMainnet ? 'text-primary' : 'text-muted-foreground'}`}>MAIN</span>
            </div>
            {isMainnet && (
              <Badge variant="outline" className="ml-2 text-primary border-primary">
                <Shield className="w-3 h-3 mr-1" />
                LIVE
              </Badge>
            )}
          </div>
          <BotStatus />
          <WalletButton className="h-10 rounded-lg font-semibold" />
        </div>

        {/* Mobile Controls */}
        <div className="flex md:hidden items-center gap-2">
          <WalletButton className="h-9 rounded-lg font-semibold text-xs px-3" />
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 bg-card border-border">
              <SheetHeader>
                <SheetTitle className="font-mono text-primary text-left">Settings</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                {/* Network Toggle */}
                <div className="space-y-3">
                  <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Network</p>
                  <div className="flex items-center gap-3 bg-secondary/50 rounded-lg px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full pulse-dot ${isMainnet ? 'bg-primary' : 'bg-accent'}`} />
                      <span className={`text-sm font-mono ${!isMainnet ? 'text-accent' : 'text-muted-foreground'}`}>DEV</span>
                    </div>
                    <Switch
                      checked={isMainnet}
                      onCheckedChange={(checked) => setNetwork(checked ? 'mainnet-beta' : 'devnet')}
                    />
                    <span className={`text-sm font-mono ${isMainnet ? 'text-primary' : 'text-muted-foreground'}`}>MAIN</span>
                    {isMainnet && (
                      <Badge variant="outline" className="text-primary border-primary text-xs">
                        <Shield className="w-3 h-3 mr-1" />
                        LIVE
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Bot Status */}
                <div className="space-y-3">
                  <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Bot Status</p>
                  <BotStatus />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};
