/**
 * Yahoo Finance cookie + crumb authentication.
 *
 * Vercel runs in EU (Frankfurt). Using Accept-Language: de-DE triggers the
 * GDPR consent page which sets no usable cookie → crumb returns HTML → 401.
 * Fix: always request with en-US to get the regular page.
 */

let cachedCookie = '';
let cachedCrumb  = '';
let cookieExpiry = 0;

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

function collectCookies(res: Response): string {
  // getSetCookie() is available in Node 18+ / Undici
  const raw: string[] =
    typeof (res.headers as any).getSetCookie === 'function'
      ? (res.headers as any).getSetCookie()
      : (res.headers.get('set-cookie') ?? '').split(/,(?=[^ ])/).map((s: string) => s.trim());

  return raw
    .map((c) => c.split(';')[0].trim())
    .filter(Boolean)
    .join('; ');
}

export async function getYahooAuth(): Promise<{ cookie: string; crumb: string }> {
  if (cachedCookie && cachedCrumb && Date.now() < cookieExpiry) {
    return { cookie: cachedCookie, crumb: cachedCrumb };
  }

  // Step 1 – fetch homepage with en-US to bypass EU consent page
  const homeRes = await fetch('https://finance.yahoo.com/', {
    headers: {
      'User-Agent': UA,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',   // ← key: avoid GDPR page
    },
    redirect: 'follow',
  });
  const cookie = collectCookies(homeRes);

  // Step 2 – fetch crumb
  const crumbRes = await fetch('https://query1.finance.yahoo.com/v1/test/getcrumb', {
    headers: {
      'User-Agent': UA,
      'Accept': 'text/plain,*/*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': 'https://finance.yahoo.com/',
      'Cookie': cookie,
    },
  });
  const crumb = (await crumbRes.text()).trim();

  // Validate: crumb is ~8-12 random chars, never HTML
  if (!crumb || crumb.startsWith('<') || crumb.length > 50) {
    throw new Error(`Invalid Yahoo crumb (status ${crumbRes.status})`);
  }

  cachedCookie = cookie;
  cachedCrumb  = crumb;
  cookieExpiry = Date.now() + 20 * 60 * 1000; // 20 min

  return { cookie, crumb };
}

/** Shared headers for authenticated Yahoo Finance requests */
export function yahooHeaders(cookie: string): HeadersInit {
  return {
    'User-Agent': UA,
    'Accept': 'application/json,text/plain,*/*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://finance.yahoo.com/',
    'Cookie': cookie,
  };
}
