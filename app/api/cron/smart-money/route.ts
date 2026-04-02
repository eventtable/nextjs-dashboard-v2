/**
 * Weekly cron job: refresh Smart Money cache for tracked tickers.
 * Triggered by Vercel Cron (vercel.json) every Monday at 06:00 UTC.
 * Also callable manually via GET with Authorization: Bearer <CRON_SECRET>.
 *
 * Env vars required:
 *   CRON_SECRET  — any random string, set in Vercel project settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getYahooAuth } from '@/lib/yahoo-auth';
import { getEdgarCIK, fetchEdgarInsiderTransactions, fetchYahooSmartMoney, SmartMoneyData } from '@/lib/edgar';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 min — enough for sequential ticker refresh

// Tickers to keep fresh in the cache
const TRACKED_TICKERS = [
  'AAPL', 'MSFT', 'SAP.DE', 'NVDA', 'GOOGL', 'AMZN', 'META',
  'BYD6.DE', 'ALV.DE', 'MUV2.DE', 'NOVO-B.CO', 'NVO',
];

async function refreshTicker(ticker: string, cookie: string, crumb: string): Promise<{ ticker: string; source: string; ok: boolean }> {
  try {
    // 1. Try Yahoo Finance first
    let data: SmartMoneyData | null = await fetchYahooSmartMoney(ticker, cookie, crumb);

    // 2. If Yahoo has no insider data, try SEC EDGAR (US stocks only)
    if ((!data || data.insiderTransactions.length === 0)) {
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

    if (!data || (data.institutionalHolders.length === 0 && data.insiderTransactions.length === 0)) {
      return { ticker, source: 'none', ok: false };
    }

    await prisma.smartMoneyCache.upsert({
      where: { ticker },
      update: { data: JSON.stringify(data) },
      create: { ticker, data: JSON.stringify(data) },
    });

    return { ticker, source: data.source, ok: true };
  } catch (err) {
    console.error(`[cron/smart-money] Error for ${ticker}:`, err);
    return { ticker, source: 'error', ok: false };
  }
}

export async function GET(req: NextRequest) {
  // Verify secret — Vercel passes it as Bearer token in Authorization header,
  // or you can call with ?secret=... for manual triggers
  const authHeader = req.headers.get('authorization') ?? '';
  const secretParam = new URL(req.url).searchParams.get('secret') ?? '';
  const cronSecret = process.env.CRON_SECRET ?? '';

  if (cronSecret && authHeader !== `Bearer ${cronSecret}` && secretParam !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { cookie, crumb } = await getYahooAuth().catch(() => ({ cookie: '', crumb: '' }));

  const results: { ticker: string; source: string; ok: boolean }[] = [];

  // Refresh tickers sequentially to avoid rate limits
  for (const ticker of TRACKED_TICKERS) {
    const result = await refreshTicker(ticker, cookie, crumb);
    results.push(result);
    // Small delay between requests
    await new Promise(r => setTimeout(r, 500));
  }

  const ok = results.filter(r => r.ok).length;
  console.log(`[cron/smart-money] Refreshed ${ok}/${results.length} tickers`);

  return NextResponse.json({
    refreshed: ok,
    total: results.length,
    results,
    timestamp: new Date().toISOString(),
  });
}
