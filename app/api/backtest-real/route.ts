import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Returns real monthly closes scaled to a given starting capital
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ticker = searchParams.get('ticker') ?? '';
  const years  = Math.min(Math.max(Number(searchParams.get('years') ?? '5'), 1), 20);
  const capital = Number(searchParams.get('capital') ?? '10000');

  if (!ticker) return NextResponse.json({ error: 'Missing ticker' }, { status: 400 });

  const range = `${years}y`;
  const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1mo&range=${range}`;

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return NextResponse.json({ error: 'Yahoo fetch failed', status: res.status }, { status: 502 });

    const json = await res.json();
    const result = json?.chart?.result?.[0];
    if (!result) return NextResponse.json({ error: 'No data' }, { status: 404 });

    const timestamps: number[] = result.timestamp ?? [];
    const closes: (number | null)[] = result.indicators?.quote?.[0]?.close ?? [];

    // Filter out null entries
    const valid: { month: string; close: number }[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      if (closes[i] != null) {
        const d = new Date(timestamps[i] * 1000);
        const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        valid.push({ month, close: closes[i]! });
      }
    }

    if (!valid.length) return NextResponse.json({ error: 'No valid data points' }, { status: 404 });

    // Scale: buy `shares` at first close, track portfolio value
    const firstClose = valid[0].close;
    const shares = capital / firstClose;

    const data = valid.map(({ month, close }) => ({
      month,
      real: Math.round(shares * close),
    }));

    const totalReturn = ((data[data.length - 1].real - capital) / capital) * 100;

    return NextResponse.json({ data, totalReturn, firstClose, shares });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
