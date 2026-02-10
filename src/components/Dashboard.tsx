import { motion } from 'framer-motion';
import { Search, Trash2, ShieldCheck, Loader2, DollarSign, TrendingUp, Info } from 'lucide-react';
import { ScanResult } from '@/hooks/useDustScanner';
import { StatCard } from '@/components/StatCard';
import { DustTable } from '@/components/DustTable';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useSolPrice } from '@/hooks/useSolPrice';
import type { ChainType } from '@/hooks/useChain';

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
  chain: ChainType;
}

export const Dashboard = ({
  scanResult,
  isScanning,
  isReclaiming,
  onScan,
  onReclaim,
  onToggleSelection,
  onSelectAll,
  onDeselectAll,
  safeModeEnabled,
  onSafeModeChange,
  chain,
}: DashboardProps) => {
  const { solPrice, formatUsd, isLoading: priceLoading } = useSolPrice();
  const isSolana = chain === 'solana';

  const selectedCount = scanResult.accounts.filter(
    (a) => a.selected && a.status === 'pending'
  ).length;

  const protectedCount = scanResult.accounts.filter(
    (a) => a.status === 'protected'
  ).length;

  const selectedSol = scanResult.accounts
    .filter((a) => a.selected && a.status === 'pending')
    .reduce((sum, a) => sum + a.balance, 0);

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        {/* Controls Row */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center justify-between gap-4 mb-8"
        >
          {/* Safe Mode Toggle (Solana only) */}
          {isSolana ? (
            <div className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center gap-2">
                <ShieldCheck className={`w-5 h-5 ${safeModeEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
                <Label htmlFor="safe-mode" className="font-medium">
                  Safe Mode
                </Label>
              </div>
              <Switch
                id="safe-mode"
                checked={safeModeEnabled}
                onCheckedChange={onSafeModeChange}
              />
              <span className="text-xs text-muted-foreground font-mono">
                {safeModeEnabled ? 'Ignoring accounts < 24h old' : 'All accounts included'}
              </span>
              {protectedCount > 0 && (
                <span className="text-xs text-accent font-mono">
                  ({protectedCount} protected)
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border">
              <Info className="w-5 h-5 text-[hsl(45,100%,50%)]" />
              <span className="text-sm font-mono text-muted-foreground">
                BNB Smart Chain • Dust Token Scanner
              </span>
            </div>
          )}

          {/* Rescan Button */}
          <Button
            variant="outline"
            onClick={() => onScan(safeModeEnabled)}
            disabled={isScanning}
          >
            {isScanning ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Search className="w-4 h-4 mr-2" />
            )}
            Rescan
          </Button>
        </motion.div>

        {/* Price Indicator */}
        {isSolana && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 mb-4 text-sm"
          >
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-muted-foreground">SOL Price:</span>
            <span className="font-mono text-primary">
              {priceLoading ? '...' : solPrice ? `$${solPrice.toFixed(2)}` : 'N/A'}
            </span>
          </motion.div>
        )}

        {/* Stats Grid */}
        <div className={`grid grid-cols-1 ${isSolana ? 'md:grid-cols-4' : 'md:grid-cols-2'} gap-6 mb-8`}>
          <StatCard
            label="Total Scanned"
            value={scanResult.totalScanned}
            icon={Search}
            variant="default"
            delay={0}
          />
          <StatCard
            label={isSolana ? 'Dust Detected' : 'Dust Tokens'}
            value={scanResult.dustDetected}
            icon={Trash2}
            variant="warning"
            delay={0.1}
          />
          {isSolana && (
            <>
              <StatCard
                label="Recoverable SOL"
                value={scanResult.recoverableSol}
                suffix="SOL"
                decimals={4}
                icon={ShieldCheck}
                variant="success"
                delay={0.2}
              />
              <StatCard
                label="USD Value"
                value={solPrice ? scanResult.recoverableSol * solPrice : 0}
                prefix="$"
                decimals={2}
                icon={DollarSign}
                variant="success"
                delay={0.3}
              />
            </>
          )}
        </div>

        {/* Dust Table */}
          <DustTable
            accounts={scanResult.accounts}
            onToggleSelection={onToggleSelection}
            onSelectAll={onSelectAll}
            onDeselectAll={onDeselectAll}
            chain={chain}
          />

        {/* Reclaim / Sweep Button */}
        {selectedCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 flex justify-center"
          >
            <Button
              size="lg"
              onClick={onReclaim}
              disabled={isReclaiming}
              className={`h-16 px-12 text-xl font-bold rounded-xl pulse-glow ${
                isSolana
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'bg-[hsl(45,100%,50%)] text-black hover:bg-[hsl(45,100%,45%)]'
              }`}
            >
              {isReclaiming ? (
                <>
                  <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                  Processing...
                </>
              ) : isSolana ? (
                <>
                  <Trash2 className="w-6 h-6 mr-3" />
                  Sweep & Reclaim ({selectedCount} accounts • {selectedSol.toFixed(4)} SOL {solPrice ? `≈ ${formatUsd(selectedSol)}` : ''})
                </>
              ) : (
                <>
                  <Trash2 className="w-6 h-6 mr-3" />
                  Sweep {selectedCount} Dust Token{selectedCount > 1 ? 's' : ''} 🔥
                </>
              )}
            </Button>
          </motion.div>
        )}
      </div>
    </section>
  );
};
