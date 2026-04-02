'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { depotPositionen } from '@/data/depot';

// Static baseline from depot.ts — matches what's shown on the Depot page
const DEPOT_TOTAL = depotPositionen.reduce((s, p) => s + p.wertEur, 0);

interface PortfolioData {
  totalValue: number;
  totalChange: number;
  totalChangePercent: number;
  isLoading: boolean;
}

export function usePortfolio(): PortfolioData {
  const { data: session, status } = useSession();
  const [totalValue, setTotalValue] = useState(0);

  useEffect(() => {
    if (status === 'loading') return;

    const isAdmin = (session?.user as any)?.isAdmin === true;

    if (!isAdmin) {
      setTotalValue(0);
      return;
    }

    // Admin: use live localStorage value if available, else static depot total
    try {
      const stored = localStorage.getItem('meinDepot');
      if (stored) {
        const positions = JSON.parse(stored);
        const total = positions.reduce((s: number, p: any) => s + (p.wertEur || 0), 0);
        if (total > 0) { setTotalValue(total); return; }
      }
    } catch { /* ignore */ }

    setTotalValue(DEPOT_TOTAL);
  }, [status, session]);

  return { totalValue, totalChange: 0, totalChangePercent: 0, isLoading: status === 'loading' };
}
