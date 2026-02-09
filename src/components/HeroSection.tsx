import { motion } from 'framer-motion';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Zap, Shield, Clock, ArrowRight, Cpu, Lock, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TypingEffect } from '@/components/TypingEffect';
import { useState } from 'react';
import { useChain } from '@/hooks/useChain';
import { useEvmWallet } from '@/hooks/useEvmWallet';

interface HeroSectionProps {
  onScan: () => void;
  isScanning: boolean;
}

export const HeroSection = ({ onScan, isScanning }: HeroSectionProps) => {
  const { connected: solConnected } = useWallet();
  const { chain } = useChain();
  const { connected: evmConnected, connect: connectEvm, connecting: evmConnecting } = useEvmWallet();
  const [showSubtext, setShowSubtext] = useState(false);

  const isSolana = chain === 'solana';
  const isConnected = isSolana ? solConnected : evmConnected;

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
            <span className="text-foreground">
              <TypingEffect
                text="Stop Leaking Capital."
                speed={40}
                delay={500}
                onComplete={() => setShowSubtext(true)}
              />
            </span>
            <br />
            {showSubtext && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-primary text-glow-green"
              >
                <TypingEffect
                  text="Reclaim Your Rent."
                  speed={40}
                  delay={200}
                />
              </motion.span>
            )}
          </h1>

          {/* Subtext */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: showSubtext ? 1 : 0 }}
            transition={{ delay: 0.5 }}
            className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto font-mono"
          >
            {isSolana
              ? 'Automated analysis for Solana wallets. Find abandoned token accounts, recover locked SOL, and clean up your wallet in one click.'
              : 'Multi-chain dust scanner. Scan your BNB Smart Chain wallet for worthless tokens and dust balances.'}
          </motion.p>

          {/* Feature Pills */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: showSubtext ? 1 : 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-wrap justify-center gap-4 mb-12"
          >
            {[
              { icon: Zap, text: 'Instant Analysis' },
              { icon: Lock, text: 'Client-Side Only' },
              { icon: Clock, text: isSolana ? 'Safe Mode Protection' : 'BEP-20 Scanning' },
              { icon: Cpu, text: isSolana ? 'Batch Processing' : 'Multi-Chain' },
            ].map((feature, index) => (
              <motion.div
                key={feature.text}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary/50 border border-border"
              >
                <feature.icon className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium font-mono">{feature.text}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: showSubtext ? 1 : 0, scale: showSubtext ? 1 : 0.95 }}
            transition={{ delay: 1 }}
          >
            {!isConnected ? (
              isSolana ? (
                <WalletMultiButton className="!bg-primary !text-primary-foreground hover:!bg-primary/90 !rounded-xl !h-14 !px-8 !text-lg !font-bold pulse-glow !font-mono" />
              ) : (
                <Button
                  onClick={connectEvm}
                  disabled={evmConnecting}
                  className="h-14 px-8 text-lg font-bold rounded-xl bg-[hsl(45,100%,50%)] text-black hover:bg-[hsl(45,100%,45%)] pulse-glow font-mono"
                >
                  <Wallet className="w-5 h-5 mr-2" />
                  {evmConnecting ? 'Connecting...' : 'Connect BNB Wallet'}
                </Button>
              )
            ) : (
              <Button
                size="lg"
                onClick={onScan}
                disabled={isScanning}
                className={`h-14 px-8 text-lg font-bold rounded-xl pulse-glow font-mono ${
                  isSolana
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-[hsl(45,100%,50%)] text-black hover:bg-[hsl(45,100%,45%)]'
                }`}
              >
                {isScanning ? (
                  <span className="animate-pulse">SCANNING...</span>
                ) : (
                  <>
                    SCAN FOR {isSolana ? 'LEAKS' : 'DUST'}
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </>
                )}
              </Button>
            )}
          </motion.div>

          {/* Demo Stats (when not connected) */}
          {!isConnected && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5 }}
              className="mt-16"
            >
              <p className="text-xs text-muted-foreground font-mono mb-6 uppercase tracking-wider">
                // Demo Mode - Connect Wallet for Live Data
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
                {(isSolana ? [
                  { label: 'Accounts Scanned', value: '142', suffix: '', color: 'text-foreground' },
                  { label: 'Dust Detected', value: '42', suffix: '', color: 'text-accent text-glow-orange' },
                  { label: 'Recoverable', value: '0.0856', suffix: 'SOL', color: 'text-primary text-glow-green' },
                ] : [
                  { label: 'Tokens Scanned', value: '85', suffix: '', color: 'text-foreground' },
                  { label: 'Dust Tokens', value: '23', suffix: '', color: 'text-accent text-glow-orange' },
                  { label: 'Chains Supported', value: '2', suffix: '', color: 'text-primary text-glow-green' },
                ]).map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.6 + index * 0.1 }}
                    className="p-6 rounded-xl bg-card/50 border border-border backdrop-blur-sm glow-green"
                  >
                    <p className="text-xs text-muted-foreground mb-2 font-mono uppercase tracking-wider">{stat.label}</p>
                    <p className={`text-4xl font-bold font-mono ${stat.color}`}>
                      {stat.value}
                      {stat.suffix && (
                        <span className="text-lg ml-1 text-muted-foreground">{stat.suffix}</span>
                      )}
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
