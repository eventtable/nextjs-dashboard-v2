import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { depotPositionen } from '@/data/depot';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.isAdmin) {
    return NextResponse.json({ chartData: [] }, { status: 403 });
  }

  try {
    // Fetch YTD daily chart for each position in parallel
    const results = await Promise.allSettled(
      depotPositionen
        .filter(p => p.ticker !== p.isin) // bonds have no real ticker
        .map(async (pos) => {
          try {
            const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(pos.ticker)}?interval=1d&range=ytd`;
            const res = await fetch(url, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                Accept: 'application/json',
              },
              signal: AbortSignal.timeout(8000),
            });
            if (!res.ok) return null;
            const json = await res.json();
            const result = json?.chart?.result?.[0];
            if (!result) return null;

            const timestamps: number[] = result.timestamp || [];
            const closes: (number | null)[] = result.indicators?.quote?.[0]?.close || [];

            // Find the last valid close price from Yahoo
            const latestClose = closes.filter(Boolean).slice(-1)[0] ?? null;
            if (!latestClose || timestamps.length === 0) return null;

            // Sanity check: if Yahoo's latest price is wildly off from our stored reference,
            // the stock's unit prices are wrong (e.g. PAEEM.PA 29.72 vs real 6.34).
            // In that case we trust our stored wertEur and use the ratio approach anyway —
            // price ratios cancel currency/split effects as long as Yahoo is consistently wrong.
            // But if only SOME data points are wrong (spikes), we skip those.
            const storedRef = pos.kursProStueck;
            const yahooScaleSuspect = latestClose > storedRef * 4 || latestClose < storedRef * 0.25;
            // If scale is suspect, normalize so latestClose == storedRef (ratios stay correct)
            const referenceClose = yahooScaleSuspect ? storedRef : latestClose;

            return {
              ticker: pos.ticker,
              wertEur: pos.wertEur,  // current EUR value = our anchor
              storedRef,
              referenceClose,
              timestamps,
              closes,
            };
          } catch {
            return null;
          }
        }),
    );

    // Bond positions: static value across all dates
    const bondValue = depotPositionen
      .filter(p => p.ticker === p.isin)
      .reduce((s, p) => s + p.wertEur, 0);

    // Total stock wertEur (bonds excluded — they're added as static later)
    const totalStockWertEur = depotPositionen
      .filter(p => p.ticker !== p.isin)
      .reduce((s, p) => s + p.wertEur, 0);

    // Build date → { value, coveredWertEur } map
    const dateMap: Record<string, number> = {};
    const dateCoverage: Record<string, number> = {};

    for (const r of results) {
      if (r.status !== 'fulfilled' || !r.value) continue;
      const { wertEur, storedRef, referenceClose, timestamps, closes } = r.value;

      for (let i = 0; i < timestamps.length; i++) {
        const close = closes[i];
        if (!close) continue;

        // Skip bad data points: outside 4×/0.25× of stored reference
        if (close > storedRef * 4 || close < storedRef * 0.25) continue;

        const date = new Date(timestamps[i] * 1000).toISOString().split('T')[0];
        dateMap[date] = (dateMap[date] ?? 0) + wertEur * (close / referenceClose);
        dateCoverage[date] = (dateCoverage[date] ?? 0) + wertEur;
      }
    }

    // Only keep dates where ≥85% of the stock portfolio has price data.
    // Days with missing positions cause artificial dips — skip them.
    const sortedDates = Object.keys(dateMap)
      .filter(d => (dateCoverage[d] ?? 0) / totalStockWertEur >= 0.85)
      .sort();

    // Expected annual dividends per position (approximate yield, for context)
    const KNOWN_DIV_YIELDS: Record<string, number> = {
      'ALV.DE':    0.050,  // Allianz ~5%
      'MUV2.DE':   0.040,  // Munich Re ~4%
      'VHYD.L':    0.040,  // World High Div ETF ~4%
      'PAEEM.PA':  0.030,  // EM ETF ~3%
      'NOVO-B.CO': 0.015,  // Novo Nordisk ~1.5%
      'IGLN.L':    0.000,  // Gold ETP - no dividend
      'GOLD.L':    0.000,
      'BYD6.DE':   0.000,
      'MSFT':      0.007,  // Microsoft ~0.7%
      'SAP.DE':    0.015,  // SAP ~1.5%
    };

    const expectedAnnualDividends = depotPositionen.reduce((sum, p) => {
      const yield_ = KNOWN_DIV_YIELDS[p.ticker] ?? 0;
      return sum + p.wertEur * yield_;
    }, 0);

    const chartData = sortedDates.map((date) => ({
      date,
      value: Math.round((dateMap[date] + bondValue) * 100) / 100,
    }));

    return NextResponse.json({ chartData, expectedAnnualDividends: Math.round(expectedAnnualDividends) });
  } catch {
    return NextResponse.json({ chartData: [], expectedAnnualDividends: 0 }, { status: 500 });
  }
}
