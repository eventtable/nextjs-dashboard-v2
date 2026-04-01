import { NextRequest, NextResponse } from 'next/server';
import { depotPositionen } from '@/data/depot';

// Live depot prices via Yahoo Finance v8 chart API
export async function GET(req: NextRequest) {
  const tickers = depotPositionen.map(p => p.ticker);

  try {
    const prices: Record<string, { price: number; change: number; changePercent: number }> = {};

    await Promise.allSettled(
      tickers.map(async (ticker) => {
        try {
          const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=2d`;
          const res = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Accept': 'application/json',
            },
          });

          if (!res.ok) return;

          const data = await res.json();
          const result = data?.chart?.result?.[0];
          if (!result) return;

          const meta = result.meta;
          const price = meta.regularMarketPrice ?? meta.previousClose;
          const prevClose = meta.chartPreviousClose ?? meta.previousClose;
          const change = price - prevClose;
          const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;

          prices[ticker] = {
            price: Math.round(price * 100) / 100,
            change: Math.round(change * 100) / 100,
            changePercent: Math.round(changePercent * 100) / 100,
          };
        } catch {
          // Use fallback price from static data
          const pos = depotPositionen.find(p => p.ticker === ticker);
          if (pos) {
            prices[ticker] = { price: pos.kursProStueck, change: 0, changePercent: 0 };
          }
        }
      })
    );

    // Merge with static depot data
    const positions = depotPositionen.map(pos => {
      const live = prices[pos.ticker];
      const currentPrice = live?.price ?? pos.kursProStueck;
      const currentValue = currentPrice * pos.stueck;
      const gainEur = (currentPrice - pos.einstandKurs) * pos.stueck;
      const gainPct = pos.einstandKurs > 0 ? ((currentPrice - pos.einstandKurs) / pos.einstandKurs) * 100 : 0;

      return {
        ...pos,
        kursProStueck: currentPrice,
        wertEur: Math.round(currentValue * 100) / 100,
        gewinnEur: Math.round(gainEur * 100) / 100,
        performanceProzent: Math.round(gainPct * 100) / 100,
        tagChange: live?.change ?? 0,
        tagChangePercent: live?.changePercent ?? 0,
      };
    });

    const totalValue = positions.reduce((sum, p) => sum + p.wertEur, 0);
    const totalGain = positions.reduce((sum, p) => sum + p.gewinnEur, 0);
    const totalInvested = depotPositionen.reduce((sum, p) => sum + p.einstandKurs * p.stueck, 0);

    return NextResponse.json({
      positions,
      summary: {
        totalValue: Math.round(totalValue * 100) / 100,
        totalGain: Math.round(totalGain * 100) / 100,
        totalInvested: Math.round(totalInvested * 100) / 100,
        totalGainPercent: totalInvested > 0 ? Math.round((totalGain / totalInvested) * 10000) / 100 : 0,
        positionCount: positions.length,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Depot API error:', error);
    return NextResponse.json({ error: 'Failed to fetch depot data' }, { status: 500 });
  }
}
