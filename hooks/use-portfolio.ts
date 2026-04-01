import { useState, useEffect } from 'react';

interface PortfolioData {
  totalValue: number;
  totalChange: number;
  totalChangePercent: number;
  isLoading: boolean;
  error: string | null;
}

export function usePortfolio(): PortfolioData {
  const [data, setData] = useState<PortfolioData>({
    totalValue: 8659.05, // Default fallback
    totalChange: 0,
    totalChangePercent: 0,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        // Try to get from localStorage first (sync with depot page)
        const stored = localStorage.getItem('meinDepot');
        if (stored) {
          const positions = JSON.parse(stored);
          const total = positions.reduce((sum: number, pos: any) => sum + (pos.wertEur || 0), 0);
          setData({
            totalValue: total,
            totalChange: 0,
            totalChangePercent: 0,
            isLoading: false,
            error: null,
          });
          return;
        }

        // Fallback: fetch from depot-prices API
        const response = await fetch('/api/depot-prices');
        if (!response.ok) throw new Error('Failed to fetch');
        const result = await response.json();
        const prices = result.prices || {};
        let totalVal = 0;
        Object.values(prices).forEach((p: any) => {
          if (p?.valueEur) totalVal += p.valueEur;
        });
        setData({
          totalValue: totalVal || 8659.05,
          totalChange: 0,
          totalChangePercent: 0,
          isLoading: false,
          error: null,
        });
      } catch (err) {
        // On error, keep default value but stop loading
        setData(prev => ({
          ...prev,
          isLoading: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        }));
      }
    };

    fetchPortfolio();

    // Listen for storage changes (when depot is updated)
    const handleStorageChange = () => {
      fetchPortfolio();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('depotUpdated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('depotUpdated', handleStorageChange);
    };
  }, []);

  return data;
}