import { NextRequest, NextResponse } from 'next/server';

// Yahoo Finance v10 quoteSummary with crumb/cookie auth
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get('symbol');
  const modules = searchParams.get('modules') || 'summaryDetail,financialData,defaultKeyStatistics,assetProfile,earnings,recommendationTrend,upgradeDowngradeHistory,calendarEvents,earningsTrend';

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol required' }, { status: 400 });
  }

  try {
    // Step 1: Get crumb
    const crumbRes = await fetch('https://query1.finance.yahoo.com/v1/test/getcrumb', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*',
        'Cookie': await getYahooCookie(),
      },
    });
    const crumb = await crumbRes.text();

    // Step 2: Get cookie if needed
    let cookie = await getYahooCookie();
    if (!cookie) {
      const cookieRes = await fetch('https://finance.yahoo.com', {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      });
      const setCookie = cookieRes.headers.get('set-cookie') || '';
      cookie = setCookie.split(';')[0];
    }

    // Step 3: Fetch quote summary
    const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=${modules}&crumb=${encodeURIComponent(crumb)}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Cookie': cookie,
      },
    });

    if (!res.ok) {
      throw new Error(`Yahoo Finance error: ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Yahoo Finance API error:', error);
    return NextResponse.json({ error: 'Failed to fetch stock data' }, { status: 500 });
  }
}

// Simple cookie cache (in-memory, resets on cold start)
let cachedCookie = '';
let cookieExpiry = 0;

async function getYahooCookie(): Promise<string> {
  if (cachedCookie && Date.now() < cookieExpiry) return cachedCookie;

  try {
    const res = await fetch('https://finance.yahoo.com/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
      },
    });
    const setCookie = res.headers.get('set-cookie') || '';
    cachedCookie = setCookie.split(';')[0];
    cookieExpiry = Date.now() + 30 * 60 * 1000; // 30 min
    return cachedCookie;
  } catch {
    return '';
  }
}
