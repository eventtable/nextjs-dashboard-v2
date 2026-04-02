/**
 * Yahoo Finance authentication helper.
 *
 * Vercel runs in EU (Frankfurt). Yahoo Finance shows a GDPR consent page for
 * EU IPs, which blocks cookie/crumb auth. We use a three-tier fallback:
 *
 *  1. Standard flow with en-US Accept-Language (bypasses GDPR page)
 *  2. Hardcoded consent cookie (A1=d) – bypasses consent without a page hit
 *  3. No-auth chart endpoint on query2 – works for basic price data
 */

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

// Hardcoded consent bypass: Yahoo Finance accepts A1=d to skip consent
const CONSENT_COOKIE = 'A1=d; A3=d; cmp=t=0&j=0&u=1---&v=2';

let cachedCookie = '';
let cachedCrumb  = '';
let cookieExpiry = 0;

function collectCookies(res: Response): string {
  const raw: string[] =
    typeof (res.headers as any).getSetCookie === 'function'
      ? (res.headers as any).getSetCookie()
      : (res.headers.get('set-cookie') ?? '').split(/,(?=[^ ])/).map((s: string) => s.trim());
  return raw.map((c) => c.split(';')[0].trim()).filter(Boolean).join('; ');
}

function isValidCrumb(c: string): boolean {
  return !!c && !c.startsWith('<') && c.length < 50 && c.length > 2;
}

async function fetchCrumb(cookie: string): Promise<string> {
  const res = await fetch('https://query1.finance.yahoo.com/v1/test/getcrumb', {
    headers: {
      'User-Agent': UA,
      'Accept': 'text/plain,*/*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': 'https://finance.yahoo.com/',
      'Cookie': cookie,
    },
  });
  const text = (await res.text()).trim();
  return isValidCrumb(text) ? text : '';
}

export async function getYahooAuth(): Promise<{ cookie: string; crumb: string }> {
  if (cachedCookie && cachedCrumb && Date.now() < cookieExpiry) {
    return { cookie: cachedCookie, crumb: cachedCrumb };
  }

  // Tier 1: standard homepage flow with en-US
  try {
    const homeRes = await fetch('https://finance.yahoo.com/', {
      headers: {
        'User-Agent': UA,
        'Accept': 'text/html,application/xhtml+xml,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    });
    const cookie = collectCookies(homeRes);
    if (cookie) {
      const crumb = await fetchCrumb(cookie);
      if (crumb) {
        cachedCookie = cookie;
        cachedCrumb  = crumb;
        cookieExpiry = Date.now() + 20 * 60 * 1000;
        return { cookie, crumb };
      }
    }
  } catch { /* fall through */ }

  // Tier 2: hardcoded consent cookie bypass
  try {
    const crumb = await fetchCrumb(CONSENT_COOKIE);
    if (crumb) {
      cachedCookie = CONSENT_COOKIE;
      cachedCrumb  = crumb;
      cookieExpiry = Date.now() + 15 * 60 * 1000;
      return { cookie: CONSENT_COOKIE, crumb };
    }
  } catch { /* fall through */ }

  // Tier 3: return empty – callers fall back to static/chart data
  return { cookie: CONSENT_COOKIE, crumb: '' };
}

/** Standard headers for authenticated Yahoo Finance requests */
export function yahooHeaders(cookie: string): HeadersInit {
  return {
    'User-Agent': UA,
    'Accept': 'application/json,text/plain,*/*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://finance.yahoo.com/',
    'Cookie': cookie || CONSENT_COOKIE,
  };
}

/**
 * Fetch a single price via the v8 chart endpoint (no crumb needed).
 * Returns null on failure so callers can use static fallback.
 */
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
