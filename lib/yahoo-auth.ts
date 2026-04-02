/**
 * Yahoo Finance cookie + crumb authentication.
 */

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

let cachedCookie  = '';
let cachedCrumb   = '';
let cookieExpiry  = 0;

/** Extract all Set-Cookie values from a response and join them for the Cookie header */
function extractCookies(res: Response): string {
  // Node 18.14+ supports getSetCookie() returning string[]
  if (typeof (res.headers as any).getSetCookie === 'function') {
    const cookies: string[] = (res.headers as any).getSetCookie();
    return cookies.map((c: string) => c.split(';')[0]).join('; ');
  }
  // Fallback: undici concatenates Set-Cookie headers with ", "
  // Split carefully: cookie entries start after ", " followed by a word char
  const raw = res.headers.get('set-cookie') || '';
  if (!raw) return '';
  return raw.split(/,\s*(?=[A-Za-z0-9_-]+=)/).map(c => c.split(';')[0]).join('; ');
}

export function clearYahooCache() {
  cachedCookie = '';
  cachedCrumb  = '';
  cookieExpiry = 0;
}

export async function getYahooAuth(): Promise<{ cookie: string; crumb: string }> {
  if (cachedCookie && cachedCrumb && Date.now() < cookieExpiry) {
    return { cookie: cachedCookie, crumb: cachedCrumb };
  }

  // Step 1: Get cookies from Yahoo Finance homepage
  let cookie = '';
  try {
    const homeRes = await fetch('https://finance.yahoo.com/', {
      headers: {
        'User-Agent': UA,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(8000),
    });
    cookie = extractCookies(homeRes);
  } catch { /* ignore, try crumb without cookie */ }

  // Step 2: Get crumb — try query1 then query2, with and without cookie
  let crumb = '';
  const crumbHosts = ['query1', 'query2'];
  for (const host of crumbHosts) {
    try {
      const headers: Record<string, string> = { 'User-Agent': UA };
      if (cookie) headers['Cookie'] = cookie;
      const r = await fetch(`https://${host}.finance.yahoo.com/v1/test/getcrumb`, {
        headers,
        signal: AbortSignal.timeout(5000),
      });
      const text = (await r.text()).trim();
      // Valid crumb: non-empty, not HTML, not "Unauthorized"
      if (text && !text.startsWith('<') && text !== 'Unauthorized' && text.length < 50) {
        crumb = text;
        break;
      }
    } catch { /* try next */ }
  }

  if (crumb) {
    cachedCookie = cookie;
    cachedCrumb  = crumb;
    cookieExpiry = Date.now() + 20 * 60 * 1000;
  }

  return { cookie, crumb };
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

    // Only use live price if Yahoo returns EUR – otherwise the static EUR
    // price from depot.ts is more accurate than an unconverted foreign price
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
