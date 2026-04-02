import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Fetch Fear & Greed from Alternative.me (free, no auth)
  let fearGreed: { value: number; classification: string } = { value: 50, classification: 'Neutral' };
  try {
    const fngRes = await fetch('https://api.alternative.me/fng/?limit=1', {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(8000),
    });
    if (fngRes.ok) {
      const fngJson = await fngRes.json();
      const entry = fngJson?.data?.[0];
      if (entry) {
        fearGreed = {
          value: Number(entry.value),
          classification: entry.value_classification ?? 'Neutral',
        };
      }
    }
  } catch (err) {
    console.error('Fear & Greed fetch error:', err);
  }

  // Fetch VIX from Yahoo Finance
  let vix: number | null = null;
  try {
    const vixRes = await fetch(
      'https://query1.finance.yahoo.com/v8/finance/chart/%5EVIX?interval=1d&range=5d',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(8000),
      }
    );
    if (vixRes.ok) {
      const vixJson = await vixRes.json();
      const closes: (number | null)[] =
        vixJson?.chart?.result?.[0]?.indicators?.quote?.[0]?.close ?? [];
      const validCloses = closes.filter((v): v is number => v !== null && v !== undefined);
      if (validCloses.length > 0) {
        vix = Math.round(validCloses[validCloses.length - 1] * 100) / 100;
      }
    }
  } catch (err) {
    console.error('VIX fetch error:', err);
  }

  return NextResponse.json({
    fearGreed,
    vix,
    timestamp: new Date().toISOString(),
  });
}
