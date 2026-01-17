import { useState, useEffect, useCallback } from 'react';

interface PriceData {
  solPrice: number | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export const useSolPrice = (refreshInterval = 30000) => {
  const [priceData, setPriceData] = useState<PriceData>({
    solPrice: null,
    isLoading: true,
    error: null,
    lastUpdated: null,
  });

  const fetchPrice = useCallback(async () => {
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd',
        {
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch SOL price');
      }

      const data = await response.json();
      const solPrice = data.solana?.usd;

      if (typeof solPrice !== 'number') {
        throw new Error('Invalid price data');
      }

      setPriceData({
        solPrice,
        isLoading: false,
        error: null,
        lastUpdated: new Date(),
      });
    } catch (err) {
      setPriceData((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      }));
    }
  }, []);

  useEffect(() => {
    fetchPrice();

    const interval = setInterval(fetchPrice, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchPrice, refreshInterval]);

  const formatUsd = useCallback(
    (solAmount: number): string => {
      if (priceData.solPrice === null) return '--';
      const usdValue = solAmount * priceData.solPrice;
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(usdValue);
    },
    [priceData.solPrice]
  );

  return {
    ...priceData,
    formatUsd,
    refetch: fetchPrice,
  };
};
