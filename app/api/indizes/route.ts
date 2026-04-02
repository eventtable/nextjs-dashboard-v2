import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const INDICES = [
  { symbol: '^GDAXI',    name: 'DAX',         region: 'Deutschland', currency: '€' },
  { symbol: '^STOXX50E', name: 'Euro Stoxx 50',region: 'Europa',      currency: '€' },
  { symbol: '^FTSE',     name: 'FTSE 100',     region: 'UK',          currency: '£' },
  { symbol: '^GSPC',     name: 'S&P 500',      region: 'USA',         currency: '$' },
  { symbol: '^IXIC',     name: 'NASDAQ',       region: 'USA',         currency: '$' },
  { symbol: '^DJI',      name: 'Dow Jones',    region: 'USA',         currency: '$' },
  { symbol: '^N225',     name: 'Nikkei 225',   region: 'Japan',       currency: '¥' },
  { symbol: '^HSI',      name: 'Hang Seng',    region: 'HK',          currency: 'HK$' },
  { symbol: 'GC=F',      name: 'Gold',         region: 'Rohstoff',    currency: '$' },
  { symbol: 'CL=F',      name: 'Öl (WTI)',     region: 'Rohstoff',    currency: '$' },
  { symbol: 'EURUSD=X',  name: 'EUR/USD',      region: 'Währung',     currency: '' },
  { symbol: '^VIX',      name: 'VIX (Angst)',  region: 'Volatilität', currency: '' },
];

async function fetchIndex(symbol: string) {
  // Fetch 1 year of daily data for full chart + Fibonacci
  const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1y`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) return null;
  const json = await res.json();
  const result = json?.chart?.result?.[0];
  if (!result) return null;

  const meta = result.meta;
  const closes: number[] = result.indicators?.quote?.[0]?.close ?? [];
  const timestamps: number[] = result.timestamp ?? [];

  // Build full year chart, filter nulls
  const sparkline: { t: number; v: number }[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (closes[i] != null) sparkline.push({ t: timestamps[i], v: closes[i] });
  }

  const price = meta.regularMarketPrice ?? sparkline[sparkline.length - 1]?.v ?? 0;
  const prev  = meta.chartPreviousClose ?? sparkline[sparkline.length - 2]?.v ?? price;
  const changeDay = prev ? ((price - prev) / prev) * 100 : 0;

  // 1M and 3M change
  const first = sparkline[0]?.v ?? price;
  const qIdx = Math.floor(sparkline.length * 0.75); // ~3M ago
  const mid = sparkline[qIdx]?.v ?? price;
  const change1M = sparkline[sparkline.length > 22 ? sparkline.length - 22 : 0]?.v
    ? ((price - sparkline[sparkline.length > 22 ? sparkline.length - 22 : 0].v) / sparkline[sparkline.length > 22 ? sparkline.length - 22 : 0].v) * 100
    : 0;
  const change3M = mid ? ((price - mid) / mid) * 100 : 0;
  const changeYTD = first ? ((price - first) / first) * 100 : 0;

  // 52-week high/low for Fibonacci
  const validCloses = sparkline.map(s => s.v);
  const high52w = Math.max(...validCloses);
  const low52w  = Math.min(...validCloses);

  // Simple trend: MA20 vs MA50
  const ma20 = validCloses.length >= 20
    ? validCloses.slice(-20).reduce((a, b) => a + b, 0) / 20
    : price;
  const ma50 = validCloses.length >= 50
    ? validCloses.slice(-50).reduce((a, b) => a + b, 0) / 50
    : price;

  let trend: 'bullish' | 'bearish' | 'neutral';
  let trendLabel: string;
  if (price > ma20 && ma20 > ma50) {
    trend = 'bullish'; trendLabel = 'Aufwärtstrend';
  } else if (price < ma20 && ma20 < ma50) {
    trend = 'bearish'; trendLabel = 'Abwärtstrend';
  } else {
    trend = 'neutral'; trendLabel = 'Seitwärts';
  }

  return {
    price,
    changeDay,
    change1M,
    change3M,
    changeYTD,
    trend,
    trendLabel,
    ma20,
    ma50,
    high52w,
    low52w,
    sparkline, // full year
    currency: meta.currency ?? '',
  };
}

export async function GET() {
  const results = await Promise.allSettled(
    INDICES.map(async (idx) => {
      const data = await fetchIndex(idx.symbol);
      return { ...idx, ...data };
    })
  );

  const indices = results.map((r, i) =>
    r.status === 'fulfilled' ? r.value : { ...INDICES[i], price: null, trend: 'neutral', trendLabel: 'N/A', sparkline: [], changeDay: 0, change1M: 0, change3M: 0 }
  );

  return NextResponse.json({ indices, updatedAt: new Date().toISOString() });
}
