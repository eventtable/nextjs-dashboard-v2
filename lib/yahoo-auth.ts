/**
 * Yahoo Finance cookie + crumb authentication.
 * Uses fc.yahoo.com for reliable cookie acquisition from datacenter IPs
 * (same approach as Python yfinance library).
 */

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

let cachedCookie  = '';
let cachedCrumb   = '';
let cookieExpiry  = 0;

/** Extract all Set-Cookie values from a response */
function extractCookies(res: Response): string {
  if (typeof (res.headers as any).getSetCookie === 'function') {
    const cookies: string[] = (res.headers as any).getSetCookie();
    return cookies.map((c: string) => c.split(';')[0]).join('; ');
  }
  const raw = res.headers.get('set-cookie') || '';
  if (!raw) return '';
  return raw.split(/,\s*(?=[A-Za-z0-9_-]+=)/).map(c => c.split(';')[0]).join('; ');
}

export function clearYahooCache() {
  cachedCookie = '';
  cachedCrumb  = '';
  cookieExpiry = 0;
}

async function acquireCookies(): Promise<string> {
  // Strategy 1: fc.yahoo.com (most reliable from datacenter IPs)
  // This endpoint always sets cookies even without following redirects
  try {
    const res = await fetch('https://fc.yahoo.com', {
      headers: { 'User-Agent': UA },
      redirect: 'manual',
      signal: AbortSignal.timeout(5000),
    });
    const cookies = extractCookies(res);
    if (cookies) return cookies;
  } catch { /* try next */ }

  // Strategy 2: finance.yahoo.com homepage
  try {
    const res = await fetch('https://finance.yahoo.com/', {
      headers: {
        'User-Agent': UA,
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(8000),
    });
    const cookies = extractCookies(res);
    if (cookies) return cookies;
  } catch { /* try next */ }

  // Strategy 3: consent cookie directly
  try {
    const res = await fetch('https://consent.yahoo.com/v2/collectConsent?sessionId=1', {
      headers: { 'User-Agent': UA },
      redirect: 'manual',
      signal: AbortSignal.timeout(5000),
    });
    const cookies = extractCookies(res);
    if (cookies) return cookies;
  } catch { /* ignore */ }

  return '';
}

export async function getYahooAuth(): Promise<{ cookie: string; crumb: string }> {
  if (cachedCookie && cachedCrumb && Date.now() < cookieExpiry) {
    return { cookie: cachedCookie, crumb: cachedCrumb };
  }

  const cookie = await acquireCookies();

  // Get crumb using the acquired cookies
  let crumb = '';
  for (const host of ['query2', 'query1']) {
    try {
      const headers: Record<string, string> = { 'User-Agent': UA };
      if (cookie) headers['Cookie'] = cookie;
      const r = await fetch(`https://${host}.finance.yahoo.com/v1/test/getcrumb`, {
        headers,
        redirect: 'follow',
        signal: AbortSignal.timeout(5000),
      });
      if (!r.ok) continue;
      const text = (await r.text()).trim();
      if (text && !text.startsWith('<') && text !== 'Unauthorized' && text.length < 80) {
        crumb = text;
        break;
      }
    } catch { /* try next */ }
  }

  if (cookie && crumb) {
    cachedCookie = cookie;
    cachedCrumb  = crumb;
    cookieExpiry = Date.now() + 15 * 60 * 1000;
  }

  return { cookie: cookie || cachedCookie, crumb: crumb || cachedCrumb };
}

export function yahooHeaders(cookie: string): HeadersInit {
  const headers: Record<string, string> = {
    'User-Agent': UA,
    'Accept': 'application/json',
  };
  if (cookie) headers['Cookie'] = cookie;
  return headers;
}

export async function fetchChartPrice(
  ticker: string,
  cookie: string,
  crumb: string,
): Promise<{ price: number; changePercent: number } | null> {
  const crumbParam = crumb ? `&crumb=${encodeURIComponent(crumb)}` : '';
  const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=2d${crumbParam}`;
  try {
    const res = await fetch(url, {
      headers: yahooHeaders(cookie),
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta) return null;

    if (meta.currency && meta.currency !== 'EUR') return null;

    const price     = meta.regularMarketPrice ?? meta.previousClose;
    const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? price;
    return {
      price:         Math.round(price * 100) / 100,
      changePercent: prevClose > 0 ? Math.round(((price - prevClose) / prevClose) * 10000) / 100 : 0,
    };
  } catch {
    return null;
  }
}
