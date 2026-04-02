/**
 * Yahoo Finance cookie + crumb authentication.
 * Kept intentionally simple – close to the original working implementation.
 */

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

let cachedCookie  = '';
let cachedCrumb   = '';
let cookieExpiry  = 0;

export async function getYahooAuth(): Promise<{ cookie: string; crumb: string }> {
  if (cachedCookie && cachedCrumb && Date.now() < cookieExpiry) {
    return { cookie: cachedCookie, crumb: cachedCrumb };
  }

  // Step 1: Get cookie from Yahoo Finance homepage
  const homeRes = await fetch('https://finance.yahoo.com/', {
    headers: {
      'User-Agent': UA,
      'Accept': 'text/html',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });
  const setCookie = homeRes.headers.get('set-cookie') || '';
  const cookie = setCookie.split(';')[0] || '';

  // Step 2: Get crumb
  const crumbRes = await fetch('https://query1.finance.yahoo.com/v1/test/getcrumb', {
    headers: {
      'User-Agent': UA,
      'Cookie': cookie,
    },
  });
  const crumb = (await crumbRes.text()).trim();

  cachedCookie = cookie;
  cachedCrumb  = crumb;
  cookieExpiry = Date.now() + 25 * 60 * 1000;

  return { cookie, crumb };
}

export function yahooHeaders(cookie: string): HeadersInit {
  return {
    'User-Agent': UA,
    'Accept': 'application/json',
    'Cookie': cookie,
  };
}

export async function fetchChartPrice(
  ticker: string,
  cookie: string,
  crumb: string,
): Promise<{ price: number; changePercent: number } | null> {
  const crumbParam = crumb ? `&crumb=${encodeURIComponent(crumb)}` : '';
  const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=2d${crumbParam}`;
  try {
    const res = await fetch(url, { headers: yahooHeaders(cookie) });
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
