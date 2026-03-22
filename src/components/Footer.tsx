import { Github, Twitter, Shield, MessageCircle } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="border-t border-border bg-card/30 py-8 mt-auto">
      <div className="container mx-auto px-4 space-y-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="w-4 h-4" />
            <span>100% Non-Custodial • Your keys, your SOL</span>
          </div>

          <div className="text-sm text-muted-foreground font-mono">
            Built for Kora Protocol
          </div>

          <div className="flex items-center gap-4">
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="GitHub">
              <Github className="w-5 h-5" />
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Twitter">
              <Twitter className="w-5 h-5" />
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Discord">
              <MessageCircle className="w-5 h-5" />
            </a>
          </div>
        </div>

        {/* Legal links */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground font-mono">
          <a href="#" className="hover:text-foreground transition-colors">Terms of Use</a>
          <span>•</span>
          <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
          <span>•</span>
          <a href="#" className="hover:text-foreground transition-colors">Pricing</a>
          <span>•</span>
          <a href="#" className="hover:text-foreground transition-colors flex items-center gap-1">
            <MessageCircle className="w-3 h-3" /> Discord Support
          </a>
        </div>

        {/* Non-custodial disclosure */}
        <p className="text-center text-xs text-muted-foreground/70 max-w-2xl mx-auto">
          KoraKeep is a non-custodial utility. We do not store private keys or take possession of your assets.
          A 15% service fee is deducted from recovered rent. All transactions are executed on-chain and are irreversible.
        </p>
      </div>
    </footer>
  );
};
