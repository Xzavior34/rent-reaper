import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Wallet, Coins, FileCheck, AlertTriangle, DollarSign, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DustAccount } from '@/hooks/useDustScanner';
import { useSolPrice } from '@/hooks/useSolPrice';
import type { ChainType } from '@/hooks/useChain';

interface TransactionPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  accounts: DustAccount[];
  totalSol: number;
  isLoading?: boolean;
  chain?: ChainType;
}

const RENT_PER_ACCOUNT = 0.00203928;

export const TransactionPreview = ({
  isOpen,
  onClose,
  onConfirm,
  accounts,
  totalSol,
  isLoading = false,
  chain = 'solana',
}: TransactionPreviewProps) => {
  const { solPrice, formatUsd } = useSolPrice();
  const isSolana = chain === 'solana';
  const batchCount = isSolana ? Math.ceil(accounts.length / 20) : accounts.length;
  const estimatedFee = isSolana ? 0.000005 * batchCount : 0.0005 * batchCount; // BNB gas ~0.0005 per tx
  const netReclaim = isSolana ? totalSol - estimatedFee : 0;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border bg-muted/30">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isSolana ? 'bg-primary/10' : 'bg-[hsl(45,100%,50%)]/10'}`}>
                {isSolana ? (
                  <FileCheck className="w-5 h-5 text-primary" />
                ) : (
                  <Flame className="w-5 h-5 text-[hsl(45,100%,50%)]" />
                )}
              </div>
              <div>
                <h2 className="font-bold text-lg">{isSolana ? 'Transaction Preview' : 'Sweep Preview'}</h2>
                <p className="text-sm text-muted-foreground font-mono">
                  {isSolana ? 'Simulation Results' : 'Burn Dust Tokens'}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                What will happen
              </h3>

              <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-muted/30 border border-border">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-accent" />
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">
                    {accounts.length} {isSolana ? 'Accounts' : 'Tokens'}
                  </span>
                </div>

                <div className="flex-1 flex items-center gap-2">
                  <div className={`flex-1 h-0.5 bg-gradient-to-r ${isSolana ? 'from-accent to-primary' : 'from-accent to-[hsl(45,100%,50%)]'}`} />
                  <ArrowRight className={`w-5 h-5 animate-pulse ${isSolana ? 'text-primary' : 'text-[hsl(45,100%,50%)]'}`} />
                  <div className={`flex-1 h-0.5 ${isSolana ? 'bg-primary' : 'bg-[hsl(45,100%,50%)]'}`} />
                </div>

                <div className="flex flex-col items-center gap-2">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isSolana ? 'bg-primary/20 glow-green' : 'bg-[hsl(45,100%,50%)]/20'}`}>
                    {isSolana ? (
                      <Coins className="w-6 h-6 text-primary" />
                    ) : (
                      <Flame className="w-6 h-6 text-[hsl(45,100%,50%)]" />
                    )}
                  </div>
                  <span className={`text-xs font-mono ${isSolana ? 'text-primary' : 'text-[hsl(45,100%,50%)]'}`}>
                    {isSolana ? `${netReclaim.toFixed(4)} SOL` : 'Burn Address'}
                  </span>
                  {isSolana && solPrice && (
                    <span className="text-xs font-mono text-muted-foreground flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      {formatUsd(netReclaim)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Breakdown */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Breakdown
              </h3>

              <div className="space-y-2 font-mono text-sm">
                <div className="flex justify-between items-center p-3 rounded-lg bg-muted/20">
                  <span className="text-muted-foreground">{isSolana ? 'Accounts to close' : 'Tokens to sweep'}</span>
                  <span className="text-foreground">{accounts.length}</span>
                </div>

                {isSolana && (
                  <>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-muted/20">
                      <span className="text-muted-foreground">Rent per account</span>
                      <span className="text-foreground">{RENT_PER_ACCOUNT} SOL</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-muted/20">
                      <span className="text-muted-foreground">Total recoverable</span>
                      <span className="text-primary">+{totalSol.toFixed(4)} SOL</span>
                    </div>
                  </>
                )}

                <div className="flex justify-between items-center p-3 rounded-lg bg-muted/20">
                  <span className="text-muted-foreground">Transactions needed</span>
                  <span className="text-foreground">{batchCount}</span>
                </div>

                <div className="flex justify-between items-center p-3 rounded-lg bg-muted/20">
                  <span className="text-muted-foreground">Est. network fee</span>
                  <span className="text-accent">~{estimatedFee.toFixed(6)} {isSolana ? 'SOL' : 'BNB'}</span>
                </div>

                {isSolana && (
                  <div className="flex justify-between items-center p-3 rounded-lg bg-primary/10 border border-primary/30">
                    <span className="font-semibold text-foreground">Net reclaim</span>
                    <div className="text-right">
                      <span className="font-bold text-primary text-lg">+{netReclaim.toFixed(4)} SOL</span>
                      {solPrice && (
                        <span className="block text-sm text-muted-foreground">
                          ≈ {formatUsd(netReclaim)}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {!isSolana && (
                  <div className="flex justify-between items-center p-3 rounded-lg bg-[hsl(45,100%,50%)]/10 border border-[hsl(45,100%,50%)]/30">
                    <span className="font-semibold text-foreground">Action</span>
                    <span className="font-bold text-[hsl(45,100%,50%)]">Send to burn 🔥</span>
                  </div>
                )}
              </div>
            </div>

            {/* Warning */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-accent/10 border border-accent/30">
              <AlertTriangle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-accent">Non-reversible action</p>
                <p className="text-muted-foreground mt-1">
                  {isSolana
                    ? 'Closing these accounts cannot be undone. The rent will be returned to your wallet.'
                    : 'Swept tokens will be sent to the burn address (0x...dEaD) and cannot be recovered.'}
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-4 p-6 border-t border-border bg-muted/30">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex-1 pulse-glow ${isSolana
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-[hsl(45,100%,50%)] text-black hover:bg-[hsl(45,100%,45%)]'}`}
            >
              {isLoading ? 'Processing...' : isSolana ? 'Confirm & Execute' : 'Confirm & Sweep'}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
