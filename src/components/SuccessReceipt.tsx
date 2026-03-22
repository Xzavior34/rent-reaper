import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, CheckCircle, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSolPrice } from '@/hooks/useSolPrice';
import { useNetwork } from '@/hooks/useNetwork';
import { useState } from 'react';

interface SuccessReceiptProps {
  isOpen: boolean;
  onClose: () => void;
  reclaimedSol: number;
  closedCount: number;
  signatures: string[];
}

export const SuccessReceipt = ({ isOpen, onClose, reclaimedSol, closedCount, signatures }: SuccessReceiptProps) => {
  const { formatUsd } = useSolPrice();
  const { isMainnet } = useNetwork();
  const [copiedSig, setCopiedSig] = useState<string | null>(null);

  const solscanBase = isMainnet ? 'https://solscan.io/tx/' : 'https://solscan.io/tx/';
  const solscanCluster = isMainnet ? '' : '?cluster=devnet';

  const copySig = async (sig: string) => {
    await navigator.clipboard.writeText(sig);
    setCopiedSig(sig);
    setTimeout(() => setCopiedSig(null), 2000);
  };

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
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md bg-card border border-primary/30 rounded-2xl shadow-2xl overflow-hidden glow-green"
        >
          <div className="p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center"
            >
              <CheckCircle className="w-10 h-10 text-primary" />
            </motion.div>

            <h2 className="text-2xl font-bold mb-2">🎉 Reclaim Successful!</h2>
            <p className="text-muted-foreground font-mono mb-6">Your wallet has been cleaned.</p>

            <div className="space-y-3 mb-6">
              <div className="p-4 rounded-xl bg-primary/10 border border-primary/30">
                <p className="text-sm text-muted-foreground mb-1">SOL Recovered (after fees)</p>
                <p className="text-3xl font-bold font-mono text-primary text-glow-green">
                  +{reclaimedSol.toFixed(4)} SOL
                </p>
                <p className="text-sm text-muted-foreground mt-1">≈ {formatUsd(reclaimedSol)}</p>
              </div>

              <div className="p-3 rounded-lg bg-muted/30 text-sm font-mono">
                <span className="text-muted-foreground">Accounts closed: </span>
                <span className="text-foreground">{closedCount}</span>
              </div>
            </div>

            {/* Transaction signatures with Solscan links */}
            {signatures.length > 0 && (
              <div className="space-y-2 mb-6">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-mono">Transaction{signatures.length > 1 ? 's' : ''}</p>
                {signatures.map((sig, idx) => (
                  <div key={sig} className="flex items-center gap-2 p-2 rounded-lg bg-muted/20 text-xs font-mono">
                    <span className="text-muted-foreground truncate flex-1">
                      {sig.slice(0, 20)}...{sig.slice(-8)}
                    </span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => copySig(sig)}>
                      {copiedSig === sig ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
                    </Button>
                    <a
                      href={`${solscanBase}${sig}${solscanCluster}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80 shrink-0"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                ))}
              </div>
            )}

            <Button onClick={onClose} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              Done
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
