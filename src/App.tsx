import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { NetworkProvider } from "@/hooks/useNetwork";
import { ChainProvider } from "@/hooks/useChain";
import { WalletContextProvider } from "@/contexts/WalletContextProvider";
import { EvmWalletProvider } from "@/hooks/useEvmWallet";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ChainProvider>
      <NetworkProvider>
        <WalletContextProvider>
          <EvmWalletProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </EvmWalletProvider>
        </WalletContextProvider>
      </NetworkProvider>
    </ChainProvider>
  </QueryClientProvider>
);

export default App;
