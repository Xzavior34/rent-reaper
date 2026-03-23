import { useState, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Header } from '@/components/Header';
import { HeroSection } from '@/components/HeroSection';
import { Dashboard } from '@/components/Dashboard';
import { Footer } from '@/components/Footer';
import { TransactionPreview } from '@/components/TransactionPreview';
import { SuccessReceipt } from '@/components/SuccessReceipt';
import { WalletModal } from '@/components/WalletModal';
import { useWalletModal } from '@/contexts/WalletModalContext';
import { useDustScanner, ReclaimResult } from '@/hooks/useDustScanner';
import { useToast } from '@/hooks/use-toast';
import { useConfetti } from '@/hooks/useConfetti';

const Index = () => {
  const { connected } = useWallet();
  const { toast } = useToast();
  const { fireConfetti } = useConfetti();
  const [safeModeEnabled, setSafeModeEnabled] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [receiptData, setReceiptData] = useState<{ reclaimedSol: number; closedCount: number; signatures: string[] } | null>(null);

  const scanner = useDustScanner();
  const { scanResult, isScanning, isReclaiming, scanProgress } = scanner;

  const handleScan = useCallback(
    async (safeMode: boolean = safeModeEnabled) => {
      const result = await scanner.scanForDust(safeMode);
      if (result.success) {
        toast({
          title: 'Scan Complete',
          description: 'Your wallet has been analyzed for dust accounts.',
        });
      } else {
        toast({
          title: 'Scan Issue',
          description: result.error || 'Could not fully scan wallet. Try again.',
          variant: 'destructive',
        });
      }
    },
    [scanner, safeModeEnabled, toast]
  );

  const handleShowPreview = useCallback(() => setShowPreview(true), []);
  const handleClosePreview = useCallback(() => setShowPreview(false), []);

  const handleReclaim = useCallback(async () => {
    if (!scanResult) return;
    const selectedAccounts = scanResult.accounts.filter(a => a.selected && a.status === 'pending');
    setShowPreview(false);

    const result: ReclaimResult = await scanner.reclaimDust(selectedAccounts);
    if (result.success) {
      fireConfetti();
      setReceiptData({
        reclaimedSol: result.reclaimed,
        closedCount: result.closed,
        signatures: result.signatures,
      });
    } else {
      toast({
        title: 'Reclaim Failed',
        description: result.error || 'Some accounts could not be closed. Please try again.',
        variant: 'destructive',
      });
    }
  }, [scanResult, scanner, toast, fireConfetti]);

  const handleSafeModeChange = useCallback((enabled: boolean) => setSafeModeEnabled(enabled), []);

  const selectedAccounts = scanResult?.accounts.filter(a => a.selected && a.status === 'pending') || [];

  return (
    <div className="min-h-screen flex flex-col bg-background relative crt-flicker">
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
            onReclaim={handleShowPreview}
            onToggleSelection={scanner.toggleAccountSelection}
            onSelectAll={scanner.selectAll}
            onDeselectAll={scanner.deselectAll}
            safeModeEnabled={safeModeEnabled}
            onSafeModeChange={handleSafeModeChange}
            scanProgress={scanProgress}
          />
        )}
      </main>
      <Footer />
      <TransactionPreview
        isOpen={showPreview}
        onClose={handleClosePreview}
        onConfirm={handleReclaim}
        accounts={selectedAccounts}
        totalSol={scanResult?.recoverableSol || 0}
        isLoading={isReclaiming}
      />
      {receiptData && (
        <SuccessReceipt
          isOpen={!!receiptData}
          onClose={() => setReceiptData(null)}
          reclaimedSol={receiptData.reclaimedSol}
          closedCount={receiptData.closedCount}
          signatures={receiptData.signatures}
        />
      )}
    </div>
  );
};

export default Index;
