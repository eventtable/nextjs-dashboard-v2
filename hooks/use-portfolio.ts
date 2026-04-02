'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface PortfolioData {
  totalValue: number;
  totalChange: number;
  totalChangePercent: number;
  isLoading: boolean;
  error: string | null;
}

export function usePortfolio(): PortfolioData {
  const { data: session, status } = useSession();
  const isAdmin = (session?.user as any)?.isAdmin === true;

  const [data, setData] = useState<PortfolioData>({
    totalValue: 0,
    totalChange: 0,
    totalChangePercent: 0,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    // Still loading session — wait
    if (status === 'loading') return;

    // Non-admin users always see 0
    if (!isAdmin) {
      setData({ totalValue: 0, totalChange: 0, totalChangePercent: 0, isLoading: false, error: null });
      return;
    }

    const fetchPortfolio = async () => {
      try {
        // Try to get from localStorage first (sync with depot page)
        const stored = localStorage.getItem('meinDepot');
        if (stored) {
          const positions = JSON.parse(stored);
          const total = positions.reduce((sum: number, pos: any) => sum + (pos.wertEur || 0), 0);
          setData({ totalValue: total, totalChange: 0, totalChangePercent: 0, isLoading: false, error: null });
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
        setData({ totalValue: totalVal || 0, totalChange: 0, totalChangePercent: 0, isLoading: false, error: null });
      } catch (err) {
        setData(prev => ({ ...prev, isLoading: false, error: err instanceof Error ? err.message : 'Unknown error' }));
      }
    };

    fetchPortfolio();

    const handleStorageChange = () => fetchPortfolio();
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('depotUpdated', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('depotUpdated', handleStorageChange);
    };
  }, [status, isAdmin]);

  return data;
}
