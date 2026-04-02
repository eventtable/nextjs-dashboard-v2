import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { depotPositionen } from '@/data/depot';

export const dynamic = 'force-dynamic';

// Lightweight price-only endpoint (used for ticker updates)
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.isAdmin) {
    return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const tickersParam = searchParams.get('tickers');
  const tickers = tickersParam
    ? tickersParam.split(',')
    : depotPositionen.map(p => p.ticker);

  const prices: Record<string, number> = {};

  await Promise.allSettled(
    tickers.map(async (ticker) => {
      try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`;
        const res = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
        });
        if (!res.ok) return;
        const data = await res.json();
        const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
        if (price) {
          // Sanity check: reject live price if it's more than 4× or less than 0.25× the fallback
          // (PAEEM.PA: Yahoo returns ~29€ instead of ~6€, 4× threshold rejects this)
          const fallback = depotPositionen.find(p => p.ticker === ticker)?.kursProStueck;
          const plausible = !fallback || (price >= fallback * 0.25 && price <= fallback * 4);
          if (plausible) prices[ticker] = Math.round(price * 100) / 100;
        }
      } catch {
        // Use static fallback
        const pos = depotPositionen.find(p => p.ticker === ticker);
        if (pos) prices[ticker] = pos.kursProStueck;
      }
    })
  );

  return NextResponse.json({ prices, updatedAt: new Date().toISOString() });
}
