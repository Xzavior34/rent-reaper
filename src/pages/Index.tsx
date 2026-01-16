import { useState, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Header } from '@/components/Header';
import { HeroSection } from '@/components/HeroSection';
import { Dashboard } from '@/components/Dashboard';
import { Footer } from '@/components/Footer';
import { useDustScanner } from '@/hooks/useDustScanner';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const { connected } = useWallet();
  const { toast } = useToast();
  const [safeModeEnabled, setSafeModeEnabled] = useState(true);

  const {
    scanResult,
    isScanning,
    isReclaiming,
    scanForDust,
    reclaimDust,
    toggleAccountSelection,
    selectAll,
    deselectAll,
  } = useDustScanner();

  const handleScan = useCallback(
    async (safeMode: boolean = safeModeEnabled) => {
      await scanForDust(safeMode);
      toast({
        title: 'Scan Complete',
        description: 'Your wallet has been analyzed for dust accounts.',
      });
    },
    [scanForDust, safeModeEnabled, toast]
  );

  const handleReclaim = useCallback(async () => {
    if (!scanResult) return;

    const selectedAccounts = scanResult.accounts.filter(
      (a) => a.selected && a.status === 'pending'
    );

    const result = await reclaimDust(selectedAccounts);

    if (result.success) {
      toast({
        title: '✓ Reclaim Successful!',
        description: `Reclaimed ${result.reclaimed.toFixed(4)} SOL from ${result.closed} accounts.`,
        className: 'bg-primary/10 border-primary',
      });
    } else {
      toast({
        title: 'Reclaim Failed',
        description: 'Some accounts could not be closed. Please try again.',
        variant: 'destructive',
      });
    }
  }, [scanResult, reclaimDust, toast]);

  const handleSafeModeChange = useCallback((enabled: boolean) => {
    setSafeModeEnabled(enabled);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background relative crt-flicker">
      {/* CRT Scanlines overlay */}
      <div className="fixed inset-0 pointer-events-none scanlines z-50" />

      <Header />

      <main className="flex-1">
        {!connected || !scanResult ? (
          <HeroSection onScan={() => handleScan(safeModeEnabled)} isScanning={isScanning} />
        ) : (
          <Dashboard
            scanResult={scanResult}
            isScanning={isScanning}
            isReclaiming={isReclaiming}
            onScan={handleScan}
            onReclaim={handleReclaim}
            onToggleSelection={toggleAccountSelection}
            onSelectAll={selectAll}
            onDeselectAll={deselectAll}
            safeModeEnabled={safeModeEnabled}
            onSafeModeChange={handleSafeModeChange}
          />
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Index;
