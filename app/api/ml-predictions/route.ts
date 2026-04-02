import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const ML_API_URL = process.env.ML_API_URL || '';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // Proxy to VPS ML server if configured
  if (ML_API_URL) {
    try {
      const params = new URLSearchParams();
      searchParams.forEach((v, k) => params.set(k, v));
      const url = `${ML_API_URL}/api/ml-predictions${params.toString() ? '?' + params.toString() : ''}`;
      const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(10000),
      });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch {
      // Fall through to mock data
    }
  }

  // Fallback mock data matching VPS response shape
  return NextResponse.json({
    predictions: [],
    summary: {
      win_rate: 0,
      total_predictions: 0,
      correct_predictions: 0,
      wrong_predictions: 0,
      score_grade: 'N/A',
    },
    liveSummary: null,
    backtestSummary: null,
    pagination: { page: 1, per_page: 20, total: 0, pages: 0 },
    source: 'fallback',
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  if (ML_API_URL) {
    try {
      const res = await fetch(`${ML_API_URL}/api/ml-predictions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(10000),
      });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch {
      // Fall through
    }
  }

  return NextResponse.json({ status: 'fallback', data: null });
}
