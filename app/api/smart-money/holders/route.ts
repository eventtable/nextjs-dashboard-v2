import { NextRequest, NextResponse } from 'next/server';
import { getYahooAuth } from '@/lib/yahoo-auth';

export const dynamic = 'force-dynamic';

const EMPTY_RESPONSE = {
  institutionalHolders: [],
  majorHolders: null,
  insiderTransactions: [],
};

// ── SEC EDGAR helpers (US stocks only) ──────────────────────────────────────

async function getCIKForTicker(ticker: string): Promise<string | null> {
  try {
    // company_tickers_exchange.json maps ticker → CIK
    const res = await fetch(
      'https://www.sec.gov/files/company_tickers_exchange.json',
      {
        headers: { 'User-Agent': 'nextjs-dashboard research@example.com' },
        signal: AbortSignal.timeout(8000),
      },
    );
    if (!res.ok) return null;
    const json = await res.json();
    // format: { fields: [...], data: [[cik, name, ticker, exchange], ...] }
    const tickerUpper = ticker.toUpperCase();
    const row = (json.data as any[]).find((r: any) => r[2] === tickerUpper);
    if (!row) return null;
    return String(row[0]).padStart(10, '0');
  } catch {
    return null;
  }
}

interface EdgarForm4 {
  name: string;
  relation: string;
  type: string;
  shares: number | null;
  value: number | null;
  date: string | null;
}

async function getEdgarInsiderTransactions(cik: string): Promise<EdgarForm4[]> {
  try {
    const res = await fetch(
      `https://data.sec.gov/submissions/CIK${cik}.json`,
      {
        headers: { 'User-Agent': 'nextjs-dashboard research@example.com' },
        signal: AbortSignal.timeout(8000),
      },
    );
    if (!res.ok) return [];
    const sub = await res.json();

    const recent = sub?.filings?.recent;
    if (!recent) return [];

    const forms: string[] = recent.form ?? [];
    const dates: string[] = recent.filingDate ?? [];
    const accessions: string[] = recent.accessionNumber ?? [];
    const primaryDocs: string[] = recent.primaryDocument ?? [];
    const reportNames: string[] = recent.reportingName ?? [];

    // Collect up to 12 most-recent Form 4 filings
    const form4Indices: number[] = [];
    for (let i = 0; i < forms.length && form4Indices.length < 12; i++) {
      if (forms[i] === '4') form4Indices.push(i);
    }

    const results: (EdgarForm4 | null)[] = await Promise.all(
      form4Indices.map(async (idx) => {
        try {
          const accNoClean = accessions[idx].replace(/-/g, '');
          const cikNum = parseInt(cik, 10);
          const xmlUrl = `https://www.sec.gov/Archives/edgar/data/${cikNum}/${accNoClean}/${primaryDocs[idx]}`;
          const xRes = await fetch(xmlUrl, {
            headers: { 'User-Agent': 'nextjs-dashboard research@example.com' },
            signal: AbortSignal.timeout(5000),
          });
          if (!xRes.ok) return null;
          const xml = await xRes.text();

          // Parse key fields from Form 4 XML
          const transCode = xml.match(/<transactionCode>([^<]+)<\/transactionCode>/)?.[1] ?? '';
          const sharesRaw = xml.match(/<transactionShares>\s*<value>([^<]+)<\/value>/)?.[1];
          const priceRaw = xml.match(/<transactionPricePerShare>\s*<value>([^<]+)<\/value>/)?.[1];
          const rptName = xml.match(/<rptOwnerName>([^<]+)<\/rptOwnerName>/)?.[1] ?? (reportNames[idx] ?? '');
          const relation = xml.match(/<officerTitle>([^<]+)<\/officerTitle>/)?.[1] ??
                           (xml.includes('<isDirector>1</isDirector>') ? 'Director' :
                            xml.includes('<isOfficer>1</isOfficer>') ? 'Officer' : '');

          const shares = sharesRaw ? parseFloat(sharesRaw) : null;
          const price = priceRaw ? parseFloat(priceRaw) : null;
          const value = shares != null && price != null ? Math.round(shares * price) : null;

          const typeMap: Record<string, string> = {
            P: 'Buy', S: 'Sell', A: 'Award', D: 'Disposition',
            F: 'Tax withholding', G: 'Gift', M: 'Option exercise',
          };

          return {
            name: rptName,
            relation,
            type: typeMap[transCode] ?? transCode,
            shares,
            value,
            date: dates[idx] ?? null,
          } as EdgarForm4;
        } catch {
          return null;
        }
      }),
    );

    return results.filter((r): r is EdgarForm4 => r !== null && r.name !== '');
  } catch {
    return [];
  }
}

// ── Yahoo Finance v10 quoteSummary ───────────────────────────────────────────

async function fetchYahooHolders(ticker: string) {
  const { cookie, crumb } = await getYahooAuth().catch(() => ({ cookie: '', crumb: '' }));
  const modules = 'institutionOwnership,majorHoldersBreakdown,insiderTransactions';
  const crumbParam = crumb ? `&crumb=${encodeURIComponent(crumb)}` : '';

  for (const host of ['query1', 'query2']) {
    try {
      const url = `https://${host}.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(ticker)}?modules=${modules}&formatted=true${crumbParam}`;
      const headers: Record<string, string> = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://finance.yahoo.com',
        'Origin': 'https://finance.yahoo.com',
      };
      if (cookie) headers['Cookie'] = cookie;

      const res = await fetch(url, { headers, signal: AbortSignal.timeout(10000) });
      if (!res.ok) continue;

      const json = await res.json();
      const result = json?.quoteSummary?.result?.[0];
      if (result) return result;
    } catch { /* try next host */ }
  }
  return null;
}

// ── Route handler ────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ticker = searchParams.get('ticker');
  if (!ticker) return NextResponse.json({ error: 'Ticker erforderlich' }, { status: 400 });

  try {
    // 1. Try Yahoo Finance
    const yahooResult = await fetchYahooHolders(ticker);

    const ownershipList: any[] = yahooResult?.institutionOwnership?.ownershipList ?? [];
    const institutionalHolders = ownershipList.map((item: any) => ({
      name: item.organization ?? '',
      pctHeld: item.pctHeld?.raw != null ? Math.round(item.pctHeld.raw * 10000) / 100 : null,
      shares: item.position?.raw ?? null,
      value: item.value?.raw ?? null,
      reportDate: item.reportDate?.fmt ?? null,
    }));

    const mhb = yahooResult?.majorHoldersBreakdown;
    const majorHolders = mhb
      ? {
          insidersPercent: mhb.insidersPercentHeld?.raw != null
            ? Math.round(mhb.insidersPercentHeld.raw * 10000) / 100 : null,
          institutionsPercent: mhb.institutionsPercentHeld?.raw != null
            ? Math.round(mhb.institutionsPercentHeld.raw * 10000) / 100 : null,
        }
      : null;

    const yahooTxList: any[] = yahooResult?.insiderTransactions?.transactions ?? [];
    let insiderTransactions = yahooTxList.map((tx: any) => {
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

    // 2. If Yahoo returned no insider data, try SEC EDGAR (US stocks only)
    const isUSStock = !ticker.includes('.') || ticker.endsWith('.US');
    if (insiderTransactions.length === 0 && isUSStock) {
      const cik = await getCIKForTicker(ticker.replace('.US', ''));
      if (cik) {
        insiderTransactions = await getEdgarInsiderTransactions(cik);
      }
    }

    return NextResponse.json({ institutionalHolders, majorHolders, insiderTransactions });
  } catch (err) {
    console.error('Holders fetch error:', err);
    return NextResponse.json(EMPTY_RESPONSE);
  }
}
