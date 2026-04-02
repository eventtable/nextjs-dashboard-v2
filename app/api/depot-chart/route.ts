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
    const stockPositions = depotPositionen.filter(p => p.ticker !== p.isin);
    const bondValue = depotPositionen
      .filter(p => p.ticker === p.isin)
      .reduce((s, p) => s + p.wertEur, 0);

    // Fetch YTD daily chart for each stock position
    const fetched = await Promise.allSettled(
      stockPositions.map(async (pos) => {
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

          const timestamps: number[] = result.timestamp ?? [];
          const closes: (number | null)[] = result.indicators?.quote?.[0]?.close ?? [];
          if (timestamps.length === 0) return null;

          const storedRef = pos.kursProStueck;

          // Latest valid close → reference for today's value
          const latestClose = closes.filter(Boolean).slice(-1)[0] ?? null;
          if (!latestClose) return null;

          // If Yahoo's latest price is wildly off (e.g. wrong currency scale),
          // use storedRef so ratios remain meaningful
          const referenceClose =
            latestClose > storedRef * 4 || latestClose < storedRef * 0.25
              ? storedRef
              : latestClose;

          // Build date → EUR value map for this position
          const dateValues = new Map<string, number>();
          for (let i = 0; i < timestamps.length; i++) {
            const close = closes[i];
            if (!close) continue;
            // Skip individual bad spikes
            if (close > storedRef * 4 || close < storedRef * 0.25) continue;
            const date = new Date(timestamps[i] * 1000).toISOString().split('T')[0];
            dateValues.set(date, pos.wertEur * (close / referenceClose));
          }

          return { posId: pos.id, wertEur: pos.wertEur, dateValues };
        } catch {
          return null;
        }
      }),
    );

    // Collect all dates that appear in at least one position's data
    const allDates = new Set<string>();
    const positionResults: Map<string, Map<string, number>> = new Map();

    for (let i = 0; i < fetched.length; i++) {
      const r = fetched[i];
      const pos = stockPositions[i];
      if (r.status === 'fulfilled' && r.value) {
        for (const date of r.value.dateValues.keys()) allDates.add(date);
        positionResults.set(pos.id, r.value.dateValues);
      } else {
        // No data → will use flat wertEur on every date
        positionResults.set(pos.id, new Map());
      }
    }

    const sortedDates = Array.from(allDates).sort();

    // For each date: sum contributions from all positions.
    // Positions without data for that specific date use their current wertEur (flat line).
    // This ensures "Heute" always equals the actual depot total.
    const chartData = sortedDates.map((date) => {
      let total = bondValue;
      for (const pos of stockPositions) {
        const dateValues = positionResults.get(pos.id)!;
        if (dateValues.has(date)) {
          total += dateValues.get(date)!;
        } else {
          // Missing data → assume no change, use current EUR value
          total += pos.wertEur;
        }
      }
      return { date, value: Math.round(total * 100) / 100 };
    });

    // Expected annual dividends
    const KNOWN_DIV_YIELDS: Record<string, number> = {
      'ALV.DE':   0.050,
      'MUV2.DE':  0.040,
      'VHYD.L':   0.040,
      'PAEEM.PA': 0.030,
      'NOVO-B.CO':0.015,
      'SAP.DE':   0.015,
      'MSFT':     0.007,
    };
    const expectedAnnualDividends = depotPositionen.reduce((sum, p) => {
      return sum + p.wertEur * (KNOWN_DIV_YIELDS[p.ticker] ?? 0);
    }, 0);

    return NextResponse.json({
      chartData,
      expectedAnnualDividends: Math.round(expectedAnnualDividends),
    });
  } catch {
    return NextResponse.json({ chartData: [], expectedAnnualDividends: 0 }, { status: 500 });
  }
}
