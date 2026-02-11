import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Wallet, Coins, FileCheck, AlertTriangle, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DustAccount } from '@/hooks/useDustScanner';
import { useSolPrice } from '@/hooks/useSolPrice';

interface TransactionPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  accounts: DustAccount[];
  totalSol: number;
  isLoading?: boolean;
}

const RENT_PER_ACCOUNT = 0.00203928;

export const TransactionPreview = ({ isOpen, onClose, onConfirm, accounts, totalSol, isLoading = false }: TransactionPreviewProps) => {
  const { solPrice, formatUsd } = useSolPrice();
  const batchCount = Math.ceil(accounts.length / 20);
  const estimatedFee = 0.000005 * batchCount;
  const netReclaim = totalSol - estimatedFee;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm" onClick={onClose}>
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-border bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileCheck className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-bold text-lg">Transaction Preview</h2>
                <p className="text-sm text-muted-foreground font-mono">Simulation Results</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5" /></Button>
          </div>

          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">What will happen</h3>
              <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-muted/30 border border-border">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center"><Wallet className="w-6 h-6 text-accent" /></div>
                  <span className="text-xs font-mono text-muted-foreground">{accounts.length} Accounts</span>
                </div>
                <div className="flex-1 flex items-center gap-2">
                  <div className="flex-1 h-0.5 bg-gradient-to-r from-accent to-primary" />
                  <ArrowRight className="w-5 h-5 animate-pulse text-primary" />
                  <div className="flex-1 h-0.5 bg-primary" />
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center glow-green"><Coins className="w-6 h-6 text-primary" /></div>
                  <span className="text-xs font-mono text-primary">{netReclaim.toFixed(4)} SOL</span>
                  {solPrice && <span className="text-xs font-mono text-muted-foreground flex items-center gap-1"><DollarSign className="w-3 h-3" />{formatUsd(netReclaim)}</span>}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Breakdown</h3>
              <div className="space-y-2 font-mono text-sm">
                <div className="flex justify-between items-center p-3 rounded-lg bg-muted/20"><span className="text-muted-foreground">Accounts to close</span><span className="text-foreground">{accounts.length}</span></div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-muted/20"><span className="text-muted-foreground">Rent per account</span><span className="text-foreground">{RENT_PER_ACCOUNT} SOL</span></div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-muted/20"><span className="text-muted-foreground">Total recoverable</span><span className="text-primary">+{totalSol.toFixed(4)} SOL</span></div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-muted/20"><span className="text-muted-foreground">Transactions needed</span><span className="text-foreground">{batchCount}</span></div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-muted/20"><span className="text-muted-foreground">Est. network fee</span><span className="text-accent">~{estimatedFee.toFixed(6)} SOL</span></div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-primary/10 border border-primary/30">
                  <span className="font-semibold text-foreground">Net reclaim</span>
                  <div className="text-right">
                    <span className="font-bold text-primary text-lg">+{netReclaim.toFixed(4)} SOL</span>
                    {solPrice && <span className="block text-sm text-muted-foreground">≈ {formatUsd(netReclaim)}</span>}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl bg-accent/10 border border-accent/30">
              <AlertTriangle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-accent">Non-reversible action</p>
                <p className="text-muted-foreground mt-1">Closing these accounts cannot be undone. The rent will be returned to your wallet.</p>
              </div>
            </div>
          </div>

          <div className="flex gap-4 p-6 border-t border-border bg-muted/30">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button onClick={onConfirm} disabled={isLoading} className="flex-1 pulse-glow bg-primary text-primary-foreground hover:bg-primary/90">
              {isLoading ? 'Processing...' : 'Confirm & Execute'}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
