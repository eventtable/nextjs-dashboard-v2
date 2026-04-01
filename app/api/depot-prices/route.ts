import { NextRequest, NextResponse } from 'next/server';
import { depotPositionen } from '@/data/depot';

// Lightweight price-only endpoint (used for ticker updates)
export async function GET(req: NextRequest) {
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
        if (price) prices[ticker] = Math.round(price * 100) / 100;
      } catch {
        // Use static fallback
        const pos = depotPositionen.find(p => p.ticker === ticker);
        if (pos) prices[ticker] = pos.kursProStueck;
      }
    })
  );

  return NextResponse.json({ prices, updatedAt: new Date().toISOString() });
}
