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
    // Fetch 6-month daily chart for each position in parallel
    const results = await Promise.allSettled(
      depotPositionen
        .filter(p => p.ticker !== p.isin) // skip bonds without real ticker
        .map(async (pos) => {
          const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(pos.ticker)}?interval=1d&range=6mo`;
          const res = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
            signal: AbortSignal.timeout(8000),
          });
          if (!res.ok) return null;
          const json = await res.json();
          const result = json?.chart?.result?.[0];
          if (!result) return null;

          const timestamps: number[] = result.timestamp || [];
          const closes: (number | null)[] = result.indicators?.quote?.[0]?.close || [];
          const rawLatestClose = closes.filter(Boolean).slice(-1)[0] ?? pos.kursProStueck;
          // Apply same sanity check as depot-prices: reject if >4× stored price (Yahoo wrong-price bug)
          const latestClose = (pos.kursProStueck && rawLatestClose > pos.kursProStueck * 4)
            ? pos.kursProStueck
            : rawLatestClose;

          // EUR factor: normalize historical prices to EUR using stored reference price
          const eurFactor = pos.kursProStueck / latestClose;

          return {
            ticker: pos.ticker,
            stueck: pos.stueck,
            eurFactor,
            timestamps,
            closes,
          };
        })
    );

    // Build date → portfolio value map
    const dateMap: Record<string, number> = {};

    for (const r of results) {
      if (r.status !== 'fulfilled' || !r.value) continue;
      const { stueck, eurFactor, timestamps, closes } = r.value;
      for (let i = 0; i < timestamps.length; i++) {
        const close = closes[i];
        if (!close) continue;
        const date = new Date(timestamps[i] * 1000).toISOString().split('T')[0];
        const valueEur = stueck * close * eurFactor;
        dateMap[date] = (dateMap[date] ?? 0) + valueEur;
      }
    }

    // Add bonds at static value (no ticker = no chart)
    const bondValue = depotPositionen
      .filter(p => p.ticker === p.isin)
      .reduce((s, p) => s + p.wertEur, 0);

    const chartData = Object.entries(dateMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, value]) => ({
        date,
        value: Math.round((value + bondValue) * 100) / 100,
      }));

    return NextResponse.json({ chartData });
  } catch (err: any) {
    return NextResponse.json({ chartData: [] }, { status: 500 });
  }
}
