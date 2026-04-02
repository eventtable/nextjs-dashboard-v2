import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const YAHOO_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept': 'application/json',
};

const EMPTY_RESPONSE = {
  institutionalHolders: [],
  majorHolders: null,
  insiderTransactions: [],
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ticker = searchParams.get('ticker');

  if (!ticker) {
    return NextResponse.json({ error: 'Ticker erforderlich' }, { status: 400 });
  }

  try {
    const modules = 'institutionOwnership,majorHoldersBreakdown,insiderTransactions';
    const url = `https://query2.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(ticker)}?modules=${modules}`;

    const res = await fetch(url, {
      headers: YAHOO_HEADERS,
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      console.error(`Yahoo holders fetch failed: ${res.status} for ${ticker}`);
      return NextResponse.json(EMPTY_RESPONSE);
    }

    const json = await res.json();
    const result = json?.quoteSummary?.result?.[0];

    if (!result) {
      return NextResponse.json(EMPTY_RESPONSE);
    }

    // Map institutionOwnership
    const ownershipList: any[] = result.institutionOwnership?.ownershipList ?? [];
    const institutionalHolders = ownershipList.map((item: any) => ({
      name: item.organization ?? '',
      pctHeld: item.pctHeld?.raw != null ? Math.round(item.pctHeld.raw * 10000) / 100 : null,
      shares: item.position?.raw ?? null,
      value: item.value?.raw ?? null,
      reportDate: item.reportDate?.fmt ?? null,
    }));

    // Map majorHoldersBreakdown
    const mhb = result.majorHoldersBreakdown;
    const majorHolders = mhb
      ? {
          insidersPercent:
            mhb.insidersPercentHeld?.raw != null
              ? Math.round(mhb.insidersPercentHeld.raw * 10000) / 100
              : null,
          institutionsPercent:
            mhb.institutionsPercentHeld?.raw != null
              ? Math.round(mhb.institutionsPercentHeld.raw * 10000) / 100
              : null,
        }
      : null;

    // Map insiderTransactions
    const transactions: any[] = result.insiderTransactions?.transactions ?? [];
    const insiderTransactions = transactions.map((tx: any) => {
      const text: string = tx.transactionText ?? '';
      const isSale = /sale|sell/i.test(text);
      const isPurchase = /purchase|buy/i.test(text);
      const type = isSale ? 'Sell' : isPurchase ? 'Buy' : text || 'Unknown';
      return {
        name: tx.filerName ?? '',
        relation: tx.filerRelation ?? '',
        type,
        shares: tx.shares?.raw ?? null,
        value: tx.value?.raw ?? null,
        date: tx.startDate?.fmt ?? null,
      };
    });

    return NextResponse.json({ institutionalHolders, majorHolders, insiderTransactions });
  } catch (err) {
    console.error('Holders fetch error:', err);
    return NextResponse.json(EMPTY_RESPONSE);
  }
}
