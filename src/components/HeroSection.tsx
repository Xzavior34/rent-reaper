import { motion } from 'framer-motion';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Zap, Shield, Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeroSectionProps {
  onScan: () => void;
  isScanning: boolean;
}

export const HeroSection = ({ onScan, isScanning }: HeroSectionProps) => {
  const { connected } = useWallet();

  return (
    <section className="relative py-20 overflow-hidden">
      {/* Grid Background */}
      <div className="absolute inset-0 grid-bg opacity-30" />

      {/* Gradient Orbs */}
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-[100px]" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-4xl mx-auto"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8"
          >
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-sm font-mono text-primary">Non-Custodial & Secure</span>
          </motion.div>

          {/* Main Headline */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="text-foreground">Stop Leaking Capital.</span>
            <br />
            <span className="text-primary text-glow-green">Reclaim Your Rent.</span>
          </h1>

          {/* Subtext */}
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Automated analysis for Solana wallets. Find abandoned token accounts,
            recover locked SOL, and clean up your wallet in one click.
          </p>

          {/* Feature Pills */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {[
              { icon: Zap, text: 'Instant Analysis' },
              { icon: Shield, text: 'Client-Side Only' },
              { icon: Clock, text: 'Safe Mode Protection' },
            ].map((feature, index) => (
              <motion.div
                key={feature.text}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary/50 border border-border"
              >
                <feature.icon className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">{feature.text}</span>
              </motion.div>
            ))}
          </div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
          >
            {!connected ? (
              <WalletMultiButton className="!bg-primary !text-primary-foreground hover:!bg-primary/90 !rounded-xl !h-14 !px-8 !text-lg !font-bold pulse-glow" />
            ) : (
              <Button
                size="lg"
                onClick={onScan}
                disabled={isScanning}
                className="h-14 px-8 text-lg font-bold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 pulse-glow"
              >
                {isScanning ? (
                  <>
                    <span className="animate-pulse">Scanning...</span>
                  </>
                ) : (
                  <>
                    Scan for Leaks
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </>
                )}
              </Button>
            )}
          </motion.div>

          {/* Demo Stats (when not connected) */}
          {!connected && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto"
            >
              {[
                { label: 'Accounts Scanned', value: '142', suffix: '' },
                { label: 'Dust Detected', value: '23', suffix: '' },
                { label: 'Recoverable', value: '0.0469', suffix: 'SOL' },
              ].map((stat, index) => (
                <div
                  key={stat.label}
                  className="p-6 rounded-xl bg-card/50 border border-border backdrop-blur-sm"
                >
                  <p className="text-sm text-muted-foreground mb-2">{stat.label}</p>
                  <p className="text-3xl font-bold font-mono text-primary">
                    {stat.value}
                    {stat.suffix && (
                      <span className="text-lg ml-1 text-muted-foreground">{stat.suffix}</span>
                    )}
                  </p>
                </div>
              ))}
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
};
