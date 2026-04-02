import { NextRequest, NextResponse } from 'next/server';
import { getYahooAuth } from '@/lib/yahoo-auth';
import { searchLocal } from '@/lib/ticker-lookup';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q') || '';

  if (!query || query.length < 1) {
    return NextResponse.json({ results: [] });
  }

  // 1. Search curated local list first (fast, reliable, no API needed)
  const localResults = searchLocal(query, 6).map((s) => ({
    ticker: s.ticker,
    name: s.name,
    sector: s.sector,
    index: s.exchange,
  }));

  // 2. Supplement with Yahoo Finance for stocks not in local list
  try {
    const { cookie, crumb } = await getYahooAuth().catch(() => ({ cookie: '', crumb: '' }));
    const crumbParam = crumb ? `&crumb=${encodeURIComponent(crumb)}` : '';
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&lang=en-US&region=US&quotesCount=10&newsCount=0&enableFuzzyQuery=false${crumbParam}`;

    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json',
    };
    if (cookie) headers['Cookie'] = cookie;

    const res = await fetch(url, { headers, signal: AbortSignal.timeout(5000) });

    if (res.ok) {
      const data = await res.json();
      const quotes = data?.quotes || [];

      // Only EQUITY type with valid, non-empty ticker symbols
      const yahooResults = quotes
        .filter((q: any) =>
          q.symbol &&
          typeof q.symbol === 'string' &&
          q.symbol.trim().length > 0 &&
          q.symbol.trim().length <= 15 &&
          (q.shortname || q.longname) &&
          q.quoteType === 'EQUITY'
        )
        .map((q: any) => ({
          ticker: q.symbol.trim(),
          name: q.longname || q.shortname,
          sector: q.industry || '',
          index: q.exchDisp || q.exchange || '',
        }))
        // Deduplicate: skip if already in local results
        .filter((r: any) => !localResults.some((l) => l.ticker === r.ticker));

      // Merge: local first (more relevant), then Yahoo extras
      const combined = [...localResults, ...yahooResults].slice(0, 10);
      return NextResponse.json({ results: combined });
    }
  } catch (error) {
    console.error('Yahoo search error:', error);
  }

  // Fallback: local only
  return NextResponse.json({ results: localResults });
}
