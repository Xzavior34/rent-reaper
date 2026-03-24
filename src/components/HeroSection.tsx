import { motion } from 'framer-motion';
import { useWallet } from '@solana/wallet-adapter-react';
import { Zap, Shield, Clock, ArrowRight, Cpu, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WalletButton } from '@/components/WalletButton';
import { TypingEffect } from '@/components/TypingEffect';
import { useState } from 'react';

interface HeroSectionProps {
  onScan: () => void;
  isScanning: boolean;
}

export const HeroSection = ({ onScan, isScanning }: HeroSectionProps) => {
  const { connected } = useWallet();
  const [showSubtext, setShowSubtext] = useState(false);

  return (
    <section className="relative py-12 sm:py-20 overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-30" />
      <div className="absolute top-20 left-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-primary/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-20 right-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-accent/10 rounded-full blur-[100px]" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-4xl mx-auto"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary/10 border border-primary/20 mb-6 sm:mb-8"
          >
            <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
            <span className="text-xs sm:text-sm font-mono text-primary">Non-Custodial & Secure</span>
          </motion.div>

          <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold mb-4 sm:mb-6 leading-tight">
            <span className="text-foreground">
              <TypingEffect text="Stop Leaking Capital." speed={40} delay={500} onComplete={() => setShowSubtext(true)} />
            </span>
            <br />
            {showSubtext && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-primary text-glow-green">
                <TypingEffect text="Reclaim Your Rent." speed={40} delay={200} />
              </motion.span>
            )}
          </h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: showSubtext ? 1 : 0 }}
            transition={{ delay: 0.5 }}
            className="text-base sm:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto font-mono px-2"
          >
            Automated analysis for Solana wallets. Find abandoned token accounts, recover locked SOL, and clean up your wallet in one click.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: showSubtext ? 1 : 0 }}
            transition={{ delay: 0.7 }}
            className="grid grid-cols-2 sm:flex sm:flex-wrap justify-center gap-2 sm:gap-4 mb-8 sm:mb-12 px-2"
          >
            {[
              { icon: Zap, text: 'Instant Analysis' },
              { icon: Lock, text: 'Client-Side Only' },
              { icon: Clock, text: 'Safe Mode' },
              { icon: Cpu, text: 'Batch Processing' },
            ].map((feature, index) => (
              <motion.div
                key={feature.text}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg bg-secondary/50 border border-border"
              >
                <feature.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium font-mono whitespace-nowrap">{feature.text}</span>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: showSubtext ? 1 : 0, scale: showSubtext ? 1 : 0.95 }}
            transition={{ delay: 1 }}
          >
            {!connected ? (
              <WalletButton size="lg" className="h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg font-bold rounded-xl pulse-glow" />
            ) : (
              <Button
                size="lg"
                onClick={onScan}
                disabled={isScanning}
                className="h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg font-bold rounded-xl pulse-glow font-mono bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isScanning ? (
                  <span className="animate-pulse">SCANNING...</span>
                ) : (
                  <>
                    SCAN FOR LEAKS
                    <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
                  </>
                )}
              </Button>
            )}
          </motion.div>

          {!connected && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5 }}
              className="mt-10 sm:mt-16"
            >
              <p className="text-[10px] sm:text-xs text-muted-foreground font-mono mb-4 sm:mb-6 uppercase tracking-wider">
                // Demo Mode - Connect Wallet for Live Data
              </p>
              <div className="grid grid-cols-3 gap-3 sm:gap-6 max-w-3xl mx-auto">
                {[
                  { label: 'Scanned', value: '142', suffix: '', color: 'text-foreground' },
                  { label: 'Dust', value: '42', suffix: '', color: 'text-accent text-glow-orange' },
                  { label: 'Recoverable', value: '0.0856', suffix: 'SOL', color: 'text-primary text-glow-green' },
                ].map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.6 + index * 0.1 }}
                    className="p-3 sm:p-6 rounded-xl bg-card/50 border border-border backdrop-blur-sm glow-green"
                  >
                    <p className="text-[10px] sm:text-xs text-muted-foreground mb-1 sm:mb-2 font-mono uppercase tracking-wider">{stat.label}</p>
                    <p className={`text-xl sm:text-4xl font-bold font-mono ${stat.color}`}>
                      {stat.value}
                      {stat.suffix && <span className="text-xs sm:text-lg ml-0.5 sm:ml-1 text-muted-foreground">{stat.suffix}</span>}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
};
