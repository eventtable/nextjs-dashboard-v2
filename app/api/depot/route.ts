import { NextRequest, NextResponse } from 'next/server';
import { depotPositionen } from '@/data/depot';
import { getYahooAuth, fetchChartPrice } from '@/lib/yahoo-auth';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  try {
    const { cookie, crumb } = await getYahooAuth().catch(() => ({ cookie: '', crumb: '' }));

    const livePrices: Record<string, { price: number; changePercent: number }> = {};

    await Promise.allSettled(
      depotPositionen.map(async (pos) => {
        if (pos.ticker === pos.isin) return; // bonds have no Yahoo ticker
        const result = await fetchChartPrice(pos.ticker, cookie, crumb);
        if (result) livePrices[pos.ticker] = result;
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
