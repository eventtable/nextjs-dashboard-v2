import { NextRequest, NextResponse } from 'next/server';
import { depotPositionen } from '@/data/depot';

let cachedCookie = '';
let cookieExpiry = 0;
let cachedCrumb = '';

async function getYahooCookieAndCrumb(): Promise<{ cookie: string; crumb: string }> {
  if (cachedCookie && cachedCrumb && Date.now() < cookieExpiry) {
    return { cookie: cachedCookie, crumb: cachedCrumb };
  }
  try {
    const cookieRes = await fetch('https://finance.yahoo.com/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html',
      },
    });
    const setCookie = cookieRes.headers.get('set-cookie') || '';
    cachedCookie = setCookie.split(';')[0] || '';

    const crumbRes = await fetch('https://query1.finance.yahoo.com/v1/test/getcrumb', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Cookie': cachedCookie,
      },
    });
    cachedCrumb = await crumbRes.text();
    cookieExpiry = Date.now() + 25 * 60 * 1000;
  } catch {
    // proceed without cookie/crumb; fallback prices will be used
  }
  return { cookie: cachedCookie, crumb: cachedCrumb };
}

export async function GET(_req: NextRequest) {
  try {
    const { cookie, crumb } = await getYahooCookieAndCrumb();

    const livePrices: Record<string, { price: number; changePercent: number }> = {};

    await Promise.allSettled(
      depotPositionen.map(async (pos) => {
        // Skip bond ISINs – Yahoo Finance won't have them
        if (pos.ticker === pos.isin) return;
        try {
          const url = crumb
            ? `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(pos.ticker)}?interval=1d&range=2d&crumb=${encodeURIComponent(crumb)}`
            : `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(pos.ticker)}?interval=1d&range=2d`;

          const res = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Accept': 'application/json',
              ...(cookie ? { 'Cookie': cookie } : {}),
            },
          });
          if (!res.ok) return;

          const data = await res.json();
          const meta = data?.chart?.result?.[0]?.meta;
          if (!meta) return;

          const price = meta.regularMarketPrice ?? meta.previousClose;
          const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? price;
          const changePercent = prevClose > 0 ? ((price - prevClose) / prevClose) * 100 : 0;

          livePrices[pos.ticker] = {
            price: Math.round(price * 100) / 100,
            changePercent: Math.round(changePercent * 100) / 100,
          };
        } catch {
          // use static fallback
        }
      })
    );

    const positions = depotPositionen.map((pos) => {
      const live = livePrices[pos.ticker];
      const currentPrice = live?.price ?? pos.kursProStueck;
      const currentValue = Math.round(currentPrice * pos.stueck * 100) / 100;
      const gainLoss = Math.round((currentPrice - pos.einstandKurs) * pos.stueck * 100) / 100;
      const kaufwert = Math.round(pos.einstandKurs * pos.stueck * 100) / 100;
      const gainLossPercent = kaufwert > 0 ? Math.round((gainLoss / kaufwert) * 10000) / 100 : 0;

      return {
        name: pos.name,
        shortName: pos.shortName,
        isin: pos.isin,
        ticker: pos.ticker,
        stueck: pos.stueck,
        kaufkurs: pos.einstandKurs,
        kaufwert,
        category: pos.category,
        strategy: pos.strategy,
        currency: pos.currency,
        lagerland: pos.lagerland,
        livePrice: live?.price ?? null,
        livePriceEur: currentPrice,
        liveCurrency: pos.currency,
        liveChangePercent: live?.changePercent ?? null,
        currentValue,
        gainLoss,
        gainLossPercent,
      };
    });

    const totalValue = Math.round(positions.reduce((s, p) => s + p.currentValue, 0) * 100) / 100;
    const totalReported = Math.round(positions.reduce((s, p) => s + p.kaufwert, 0) * 100) / 100;

    return NextResponse.json({
      positions,
      totalValue,
      totalReported,
      lastUpdate: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Depot API error:', error);
    return NextResponse.json({ error: 'Fehler beim Laden der Depot-Daten' }, { status: 500 });
  }
}
