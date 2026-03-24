import { motion } from 'framer-motion';
import { Search, Trash2, ShieldCheck, Loader2, DollarSign, TrendingUp } from 'lucide-react';
import { ScanResult } from '@/hooks/useDustScanner';
import { StatCard } from '@/components/StatCard';
import { DustTable } from '@/components/DustTable';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useSolPrice } from '@/hooks/useSolPrice';

interface DashboardProps {
  scanResult: ScanResult;
  isScanning: boolean;
  isReclaiming: boolean;
  onScan: (safeMode: boolean) => void;
  onReclaim: () => void;
  onToggleSelection: (address: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  safeModeEnabled: boolean;
  onSafeModeChange: (enabled: boolean) => void;
  scanProgress: number;
}

export const Dashboard = ({
  scanResult, isScanning, isReclaiming, onScan, onReclaim,
  onToggleSelection, onSelectAll, onDeselectAll, safeModeEnabled, onSafeModeChange,
  scanProgress,
}: DashboardProps) => {
  const { solPrice, formatUsd, isLoading: priceLoading } = useSolPrice();

  const selectedCount = scanResult.accounts.filter(a => a.selected && a.status === 'pending').length;
  const protectedCount = scanResult.accounts.filter(a => a.status === 'protected').length;
  const selectedSol = scanResult.accounts
    .filter(a => a.selected && a.status === 'pending')
    .reduce((sum, a) => sum + a.balance, 0);

  const grossRentSol = selectedCount * 0.00203928;
  const feeSol = Math.floor((selectedCount * 2039280 * 1500) / 10_000) / 1e9;
  const netSol = grossRentSol - feeSol;

  return (
    <section className="py-6 sm:py-12">
      <div className="container mx-auto px-3 sm:px-4">
        {/* Controls row */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-card border border-border w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <ShieldCheck className={`w-4 h-4 sm:w-5 sm:h-5 ${safeModeEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
              <Label htmlFor="safe-mode" className="font-medium text-sm">Safe Mode</Label>
            </div>
            <Switch id="safe-mode" checked={safeModeEnabled} onCheckedChange={onSafeModeChange} />
            <span className="text-[10px] sm:text-xs text-muted-foreground font-mono hidden sm:inline">
              {safeModeEnabled ? 'Ignoring < 24h' : 'All included'}
            </span>
            {protectedCount > 0 && (
              <span className="text-[10px] sm:text-xs text-accent font-mono">({protectedCount} protected)</span>
            )}
          </div>
          <Button variant="outline" onClick={() => onScan(safeModeEnabled)} disabled={isScanning} className="w-full sm:w-auto">
            {isScanning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
            Rescan
          </Button>
        </motion.div>

        {/* Scan progress bar */}
        {isScanning && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 space-y-2">
            <div className="flex justify-between text-xs font-mono text-muted-foreground">
              <span>Scanning wallet...</span>
              <span>{scanProgress}%</span>
            </div>
            <Progress value={scanProgress} className="h-2" />
          </motion.div>
        )}

        {/* SOL Price */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 mb-4 text-sm">
          <TrendingUp className="w-4 h-4 text-primary" />
          <span className="text-muted-foreground">SOL Price:</span>
          <span className="font-mono text-primary">{priceLoading ? '...' : solPrice ? `$${solPrice.toFixed(2)}` : 'N/A'}</span>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <StatCard label="Total Scanned" value={scanResult.totalScanned} icon={Search} variant="default" delay={0} />
          <StatCard label="Dust Detected" value={scanResult.dustDetected} icon={Trash2} variant="warning" delay={0.1} />
          <StatCard label="Recoverable SOL" value={scanResult.recoverableSol} suffix="SOL" decimals={4} icon={ShieldCheck} variant="success" delay={0.2} />
          <StatCard label="USD Value" value={solPrice ? scanResult.recoverableSol * solPrice : 0} prefix="$" decimals={2} icon={DollarSign} variant="success" delay={0.3} />
        </div>

        <DustTable accounts={scanResult.accounts} onToggleSelection={onToggleSelection} onSelectAll={onSelectAll} onDeselectAll={onDeselectAll} />

        {selectedCount > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-6 sm:mt-8 flex justify-center px-2">
            <Button
              size="lg"
              onClick={onReclaim}
              disabled={isReclaiming}
              className="h-12 sm:h-16 px-6 sm:px-12 text-sm sm:text-xl font-bold rounded-xl pulse-glow bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto"
            >
              {isReclaiming ? (
                <><Loader2 className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 animate-spin" />Processing...</>
              ) : (
                <><Trash2 className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />Sweep ({selectedCount} • ~{netSol.toFixed(4)} SOL{solPrice ? ` ≈ ${formatUsd(netSol)}` : ''})</>
              )}
            </Button>
          </motion.div>
        )}
      </div>
    </section>
  );
};
