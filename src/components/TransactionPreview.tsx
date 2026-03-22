import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Wallet, Coins, FileCheck, AlertTriangle, DollarSign, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DustAccount, splitRent } from '@/hooks/useDustScanner';
import { useSolPrice } from '@/hooks/useSolPrice';

interface TransactionPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  accounts: DustAccount[];
  totalSol: number;
  isLoading?: boolean;
}

export const TransactionPreview = ({ isOpen, onClose, onConfirm, accounts, totalSol, isLoading = false }: TransactionPreviewProps) => {
  const { solPrice, formatUsd } = useSolPrice();
  const [feeAcknowledged, setFeeAcknowledged] = useState(false);

  const batchCount = Math.ceil(accounts.length / 20);
  const estimatedFee = 0.000005 * batchCount;

  // Use integer math for fee split
  const { grossLamports, feeLamports, userLamports } = splitRent(accounts.length);
  const grossSol = grossLamports / 1e9;
  const feeSol = feeLamports / 1e9;
  const netSol = (userLamports / 1e9) - estimatedFee;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm" onClick={onClose}>
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-border bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileCheck className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-bold text-lg">Transaction Preview</h2>
                <p className="text-sm text-muted-foreground font-mono">Review before signing</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5" /></Button>
          </div>

          <div className="p-6 space-y-6">
            {/* Visual flow */}
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
                  <span className="text-xs font-mono text-primary">{netSol.toFixed(4)} SOL</span>
                  {solPrice && <span className="text-xs font-mono text-muted-foreground flex items-center gap-1"><DollarSign className="w-3 h-3" />{formatUsd(netSol)}</span>}
                </div>
              </div>
            </div>

            {/* Breakdown */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Breakdown</h3>
              <div className="space-y-2 font-mono text-sm">
                <div className="flex justify-between items-center p-3 rounded-lg bg-muted/20">
                  <span className="text-muted-foreground">Accounts to close</span>
                  <span className="text-foreground">{accounts.length}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-muted/20">
                  <span className="text-muted-foreground">Gross recovery</span>
                  <span className="text-foreground">+{grossSol.toFixed(4)} SOL</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-accent/10 border border-accent/30">
                  <span className="text-accent">KoraKeep fee (15%)</span>
                  <span className="text-accent">−{feeSol.toFixed(4)} SOL</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-muted/20">
                  <span className="text-muted-foreground">Transactions needed</span>
                  <span className="text-foreground">{batchCount}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-muted/20">
                  <span className="text-muted-foreground">Est. network fee</span>
                  <span className="text-muted-foreground">~{estimatedFee.toFixed(6)} SOL</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-primary/10 border border-primary/30">
                  <span className="font-semibold text-foreground">Your net profit</span>
                  <div className="text-right">
                    <span className="font-bold text-primary text-lg">+{netSol.toFixed(4)} SOL</span>
                    {solPrice && <span className="block text-sm text-muted-foreground">≈ {formatUsd(netSol)}</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Warning */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-accent/10 border border-accent/30">
              <AlertTriangle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-accent">Non-reversible action</p>
                <p className="text-muted-foreground mt-1">Closing these accounts cannot be undone. 85% of the recovered rent will be returned to your wallet. 15% goes to KoraKeep as a service fee.</p>
              </div>
            </div>

            {/* Mandatory opt-in */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-secondary/50 border border-border">
              <Checkbox
                id="fee-consent"
                checked={feeAcknowledged}
                onCheckedChange={(checked) => setFeeAcknowledged(checked === true)}
                className="mt-0.5"
              />
              <label htmlFor="fee-consent" className="text-sm cursor-pointer select-none">
                <span className="font-medium text-foreground flex items-center gap-1">
                  <CheckSquare className="w-4 h-4 text-primary inline" />
                  I understand the 15% fee
                </span>
                <p className="text-muted-foreground mt-1">
                  I confirm that {feeSol.toFixed(4)} SOL ({solPrice ? formatUsd(feeSol) : '--'}) will be sent to the KoraKeep treasury as a service fee.
                </p>
              </label>
            </div>
          </div>

          <div className="flex gap-4 p-6 border-t border-border bg-muted/30">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button
              onClick={() => { onConfirm(); setFeeAcknowledged(false); }}
              disabled={isLoading || !feeAcknowledged}
              className="flex-1 pulse-glow bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isLoading ? 'Processing...' : 'Confirm & Execute'}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
