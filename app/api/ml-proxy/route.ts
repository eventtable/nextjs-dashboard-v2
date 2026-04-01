import { NextRequest, NextResponse } from 'next/server';

// ML API proxy - originally pointed to VPS port 5000
// In Abacus deployment, uses fallback data
const ML_API_URL = process.env.ML_API_URL || '';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const endpoint = searchParams.get('endpoint') || 'predict';
  const symbol = searchParams.get('symbol') || '';

  // If ML API is configured, proxy to it
  if (ML_API_URL) {
    try {
      const url = `${ML_API_URL}/${endpoint}?symbol=${encodeURIComponent(symbol)}`;
      const res = await fetch(url, { headers: { 'Content-Type': 'application/json' } });
      const data = await res.json();
      return NextResponse.json(data);
    } catch {
      // Fall through to fallback
    }
  }

  // Fallback ML data
  return NextResponse.json({
    symbol,
    endpoint,
    status: 'fallback',
    message: 'ML API not available, using cached data',
    data: null,
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const endpoint = new URL(req.url).searchParams.get('endpoint') || 'predict';

  if (ML_API_URL) {
    try {
      const res = await fetch(`${ML_API_URL}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      return NextResponse.json(data);
    } catch {
      // Fall through
    }
  }

  return NextResponse.json({ status: 'fallback', data: null });
}
