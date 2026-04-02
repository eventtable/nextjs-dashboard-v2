import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getYahooAuth } from '@/lib/yahoo-auth';
import { getEdgarCIK, fetchEdgarInsiderTransactions, fetchYahooSmartMoney, SmartMoneyData } from '@/lib/edgar';

export const dynamic = 'force-dynamic';

const CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const EMPTY: SmartMoneyData = {
  institutionalHolders: [],
  majorHolders: null,
  insiderTransactions: [],
  source: 'cache',
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ticker = searchParams.get('ticker');
  if (!ticker) return NextResponse.json({ error: 'Ticker erforderlich' }, { status: 400 });

  // ── 1. Check DB cache ──────────────────────────────────────────────────────
  try {
    const cached = await prisma.smartMoneyCache.findUnique({ where: { ticker } });
    if (cached) {
      const ageMs = Date.now() - cached.updatedAt.getTime();
      if (ageMs < CACHE_MAX_AGE_MS) {
        const data = JSON.parse(cached.data) as SmartMoneyData;
        return NextResponse.json({ ...data, source: 'cache', cachedAt: cached.updatedAt });
      }
    }
  } catch { /* DB error → fall through to live fetch */ }

  // ── 2. Live fetch (Yahoo + EDGAR fallback) ─────────────────────────────────
  try {
    const { cookie, crumb } = await getYahooAuth().catch(() => ({ cookie: '', crumb: '' }));

    let data: SmartMoneyData | null = await fetchYahooSmartMoney(ticker, cookie, crumb);

    // EDGAR fallback for US stocks with missing insider data
    if (!data || data.insiderTransactions.length === 0) {
      const cik = await getEdgarCIK(ticker);
      if (cik) {
        const edgarTxs = await fetchEdgarInsiderTransactions(cik);
        if (edgarTxs.length > 0) {
          data = {
            institutionalHolders: data?.institutionalHolders ?? [],
            majorHolders: data?.majorHolders ?? null,
            insiderTransactions: edgarTxs,
            source: 'edgar',
          };
        }
      }
    }

    if (!data) return NextResponse.json(EMPTY);

    // Persist to cache for future requests
    try {
      await prisma.smartMoneyCache.upsert({
        where: { ticker },
        update: { data: JSON.stringify(data) },
        create: { ticker, data: JSON.stringify(data) },
      });
    } catch { /* cache write failure is non-fatal */ }

    return NextResponse.json(data);
  } catch (err) {
    console.error('Holders fetch error:', err);
    return NextResponse.json(EMPTY);
  }
}
