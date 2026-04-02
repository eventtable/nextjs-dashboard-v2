import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { depotPositionen } from '@/data/depot';
import { prisma } from '@/lib/prisma';
import { getYahooAuth, fetchChartPrice } from '@/lib/yahoo-auth';

export const dynamic = 'force-dynamic';

// Sanity check: reject live price if outside 4× / 0.25× range of stored price
function sanityCheck(price: number, fallback: number | undefined): boolean {
  if (!fallback) return true;
  return price >= fallback * 0.25 && price <= fallback * 4;
}

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
  }

  const isAdmin = (session.user as any)?.isAdmin === true;

  // Determine which positions to use
  let rawPositions: typeof depotPositionen;

  if (isAdmin) {
    rawPositions = depotPositionen;
  } else {
    // Load from DB
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { depot: true },
    });
    const dbPositions = user?.depot?.positions ? JSON.parse(user.depot.positions) : [];
    if (dbPositions.length === 0) {
      return NextResponse.json({ positions: [], totalValue: 0, totalReported: 0, lastUpdate: new Date().toISOString() });
    }
    rawPositions = dbPositions;
  }

  try {
    const { cookie, crumb } = await getYahooAuth().catch(() => ({ cookie: '', crumb: '' }));

    const livePrices: Record<string, { price: number; changePercent: number }> = {};

    await Promise.allSettled(
      rawPositions.map(async (pos: any) => {
        if (pos.ticker === pos.isin) return;
        const result = await fetchChartPrice(pos.ticker, cookie, crumb);
        if (result && sanityCheck(result.price, pos.kursProStueck)) {
          livePrices[pos.ticker] = result;
        }
      })
    );

    const positions = rawPositions.map((pos: any) => {
      const live = livePrices[pos.ticker];
      const currentPrice = live?.price ?? pos.kursProStueck;
      const currentValue = Math.round(currentPrice * pos.stueck * 100) / 100;
      const einstand = pos.einstandKurs ?? pos.kursProStueck;
      const gainLoss = Math.round((currentPrice - einstand) * pos.stueck * 100) / 100;
      const kaufwert = Math.round(einstand * pos.stueck * 100) / 100;
      const gainLossPercent = kaufwert > 0 ? Math.round((gainLoss / kaufwert) * 10000) / 100 : 0;

      return {
        name: pos.name,
        shortName: pos.shortName ?? pos.name,
        isin: pos.isin,
        ticker: pos.ticker,
        stueck: pos.stueck,
        kaufkurs: einstand,
        kaufwert,
        category: pos.category ?? 'aktie',
        strategy: pos.strategy ?? 'wachstum',
        currency: pos.currency ?? 'EUR',
        lagerland: pos.lagerland ?? '—',
        livePrice: live?.price ?? null,
        livePriceEur: currentPrice,
        liveCurrency: pos.currency ?? 'EUR',
        liveChangePercent: live?.changePercent ?? null,
        currentValue,
        gainLoss,
        gainLossPercent,
      };
    });

    const totalValue = Math.round(positions.reduce((s: number, p: any) => s + p.currentValue, 0) * 100) / 100;
    const totalReported = Math.round(positions.reduce((s: number, p: any) => s + p.kaufwert, 0) * 100) / 100;

    return NextResponse.json({ positions, totalValue, totalReported, lastUpdate: new Date().toISOString() });
  } catch (error: any) {
    console.error('Depot API error:', error);
    return NextResponse.json({ error: 'Fehler beim Laden der Depot-Daten' }, { status: 500 });
  }
}
