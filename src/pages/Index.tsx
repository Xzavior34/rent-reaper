import { useState, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Header } from '@/components/Header';
import { HeroSection } from '@/components/HeroSection';
import { Dashboard } from '@/components/Dashboard';
import { Footer } from '@/components/Footer';
import { TransactionPreview } from '@/components/TransactionPreview';
import { useDustScanner } from '@/hooks/useDustScanner';
import { useBnbDustScanner } from '@/hooks/useBnbDustScanner';
import { useChain } from '@/hooks/useChain';
import { useEvmWallet } from '@/hooks/useEvmWallet';
import { useToast } from '@/hooks/use-toast';
import { useConfetti } from '@/hooks/useConfetti';

const Index = () => {
  const { connected: solConnected } = useWallet();
  const { chain } = useChain();
  const { connected: evmConnected, address: evmAddress, sendTransaction } = useEvmWallet();
  const { toast } = useToast();
  const { fireConfetti } = useConfetti();
  const [safeModeEnabled, setSafeModeEnabled] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  const isSolana = chain === 'solana';
  const isConnected = isSolana ? solConnected : evmConnected;

  const solScanner = useDustScanner();
  const bnbScanner = useBnbDustScanner();

  const activeScanner = isSolana ? solScanner : bnbScanner;
  const { scanResult, isScanning, isReclaiming } = activeScanner;

  const handleScan = useCallback(
    async (safeMode: boolean = safeModeEnabled) => {
      let result: { success: boolean; error?: string };

      if (isSolana) {
        result = await solScanner.scanForDust(safeMode);
      } else {
        if (!evmAddress) {
          toast({ title: 'Wallet Not Connected', description: 'Please connect your BNB wallet first.', variant: 'destructive' });
          return;
        }
        result = await bnbScanner.scanForDust(evmAddress);
      }

      if (result.success) {
        toast({
          title: 'Scan Complete',
          description: isSolana
            ? 'Your wallet has been analyzed for dust accounts.'
            : 'Your BNB wallet has been scanned for dust tokens.',
        });
      } else {
        toast({
          title: 'Scan Issue',
          description: result.error || 'Could not fully scan wallet. Try again.',
          variant: 'destructive',
        });
      }
    },
    [isSolana, solScanner, bnbScanner, evmAddress, safeModeEnabled, toast]
  );

  const handleShowPreview = useCallback(() => {
    setShowPreview(true);
  }, []);

  const handleClosePreview = useCallback(() => {
    setShowPreview(false);
  }, []);

  const handleReclaim = useCallback(async () => {
    if (!scanResult) return;

    const selectedAccounts = scanResult.accounts.filter(
      (a) => a.selected && a.status === 'pending'
    );

    setShowPreview(false);

    if (isSolana) {
      const result = await solScanner.reclaimDust(selectedAccounts);
      if (result.success) {
        fireConfetti();
        toast({
          title: '🎉 Reclaim Successful!',
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
    } else {
      const result = await bnbScanner.reclaimDust(selectedAccounts, sendTransaction);
      if (result.success) {
        fireConfetti();
        toast({
          title: '🎉 Sweep Successful!',
          description: `Swept ${result.swept} dust token${result.swept > 1 ? 's' : ''} to burn address.${result.failed > 0 ? ` ${result.failed} failed.` : ''}`,
          className: 'bg-primary/10 border-primary',
        });
      } else {
        toast({
          title: 'Sweep Failed',
          description: 'Could not sweep dust tokens. Please try again.',
          variant: 'destructive',
        });
      }
    }
  }, [scanResult, solScanner, bnbScanner, toast, fireConfetti, isSolana, sendTransaction]);

  const handleSafeModeChange = useCallback((enabled: boolean) => {
    setSafeModeEnabled(enabled);
  }, []);

  const selectedAccounts = scanResult?.accounts.filter(
    (a) => a.selected && a.status === 'pending'
  ) || [];

  return (
    <div className="min-h-screen flex flex-col bg-background relative crt-flicker">
      <div className="fixed inset-0 pointer-events-none scanlines z-50" />

      <Header />

      <main className="flex-1">
        {!isConnected || !scanResult ? (
          <HeroSection onScan={() => handleScan(safeModeEnabled)} isScanning={isScanning} />
        ) : (
          <Dashboard
            scanResult={scanResult}
            isScanning={isScanning}
            isReclaiming={isReclaiming}
            onScan={handleScan}
            onReclaim={handleShowPreview}
            onToggleSelection={activeScanner.toggleAccountSelection}
            onSelectAll={activeScanner.selectAll}
            onDeselectAll={activeScanner.deselectAll}
            safeModeEnabled={safeModeEnabled}
            onSafeModeChange={handleSafeModeChange}
            chain={chain}
          />
        )}
      </main>

      <Footer />

      {/* Transaction Preview Modal */}
      <TransactionPreview
        isOpen={showPreview}
        onClose={handleClosePreview}
        onConfirm={handleReclaim}
        accounts={selectedAccounts}
        totalSol={scanResult?.recoverableSol || 0}
        isLoading={isReclaiming}
        chain={chain}
      />
    </div>
  );
};

export default Index;
