import { NextRequest, NextResponse } from 'next/server';
import { getYahooAuth } from '@/lib/yahoo-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q') || '';

  if (!query || query.length < 1) {
    return NextResponse.json({ results: [] });
  }

  try {
    const { cookie, crumb } = await getYahooAuth().catch(() => ({ cookie: '', crumb: '' }));

    const crumbParam = crumb ? `&crumb=${encodeURIComponent(crumb)}` : '';
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&lang=en-US&region=US&quotesCount=15&newsCount=0&enableFuzzyQuery=true&enableNavLinks=false${crumbParam}`;

    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      'Accept': 'application/json',
    };
    if (cookie) headers['Cookie'] = cookie;

    const res = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) throw new Error(`Yahoo search error: ${res.status}`);

    const data = await res.json();
    const quotes = data?.quotes || [];

    const results = quotes
      .filter((q: any) => q.symbol && (q.shortname || q.longname))
      .map((q: any) => ({
        ticker: q.symbol,                          // was "symbol" — component expects "ticker"
        name: q.longname || q.shortname || q.symbol,
        sector: q.industry || q.typeDisp || '',
        index: q.exchDisp || q.exchange || '',
      }));

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}
