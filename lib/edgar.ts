/**
 * SEC EDGAR data fetcher for insider transactions (Form 4) and institutional holders (13F).
 * Uses public EDGAR APIs — no API key required.
 */

const EDGAR_UA = 'nextjs-dashboard research@example.com';

// ── CIK lookup ───────────────────────────────────────────────────────────────

/**
 * Resolve ticker → 10-digit CIK using EDGAR's browse endpoint.
 * Returns null for non-US tickers (contain a dot suffix like .DE, .PA).
 */
export async function getEdgarCIK(ticker: string): Promise<string | null> {
  // European/non-US tickers are not in EDGAR
  if (ticker.includes('.') && !ticker.endsWith('.US')) return null;
  const cleanTicker = ticker.replace(/\.US$/, '');

  try {
    const url = `https://efts.sec.gov/LATEST/search-index?q=%22${encodeURIComponent(cleanTicker)}%22&forms=4&dateRange=custom&startdt=2020-01-01&hits.hits._source=period_of_report,file_date,entity_name,file_num`;
    const res = await fetch(url, {
      headers: { 'User-Agent': EDGAR_UA, Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    // entity_id is in the hit — but we actually need CIK from the submissions API
    // Use the browse-edgar ATOM feed which accepts tickers directly
  } catch { /* fall through */ }

  // Primary: browse-edgar ATOM feed supports ticker lookup directly
  try {
    const atomUrl = `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${encodeURIComponent(cleanTicker)}&type=4&dateb=&owner=include&count=1&output=atom`;
    const res = await fetch(atomUrl, {
      headers: { 'User-Agent': EDGAR_UA, Accept: 'application/atom+xml, text/xml' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const text = await res.text();
    // CIK is in the company-search-results URL: /cgi-bin/browse-edgar?action=getcompany&CIK=0000320193&...
    const match = text.match(/CIK=(\d{10})/);
    if (match) return match[1];
    // Also try shorter format
    const match2 = text.match(/\/data\/(\d+)\//);
    if (match2) return match2[1].padStart(10, '0');
    return null;
  } catch {
    return null;
  }
}

// ── Insider Transactions (Form 4) ────────────────────────────────────────────

export interface InsiderTx {
  name: string;
  relation: string;
  type: string;
  shares: number | null;
  value: number | null;
  date: string | null;
}

export async function fetchEdgarInsiderTransactions(cik: string): Promise<InsiderTx[]> {
  try {
    const res = await fetch(
      `https://data.sec.gov/submissions/CIK${cik}.json`,
      {
        headers: { 'User-Agent': EDGAR_UA },
        signal: AbortSignal.timeout(10000),
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

    // Collect up to 15 most-recent Form 4 filings
    const form4Indices: number[] = [];
    for (let i = 0; i < forms.length && form4Indices.length < 15; i++) {
      if (forms[i] === '4') form4Indices.push(i);
    }

    const cikNum = parseInt(cik, 10);
    const results = await Promise.all(
      form4Indices.map(async (idx): Promise<InsiderTx | null> => {
        try {
          const accNoClean = accessions[idx].replace(/-/g, '');
          const xmlUrl = `https://www.sec.gov/Archives/edgar/data/${cikNum}/${accNoClean}/${primaryDocs[idx]}`;
          const xRes = await fetch(xmlUrl, {
            headers: { 'User-Agent': EDGAR_UA },
            signal: AbortSignal.timeout(6000),
          });
          if (!xRes.ok) return null;
          const xml = await xRes.text();

          const transCode = xml.match(/<transactionCode>([^<]+)<\/transactionCode>/)?.[1] ?? '';
          const sharesRaw = xml.match(/<transactionShares>\s*<value>([^<]+)<\/value>/)?.[1];
          const priceRaw  = xml.match(/<transactionPricePerShare>\s*<value>([^<]+)<\/value>/)?.[1];
          const rptName   = xml.match(/<rptOwnerName>([^<]+)<\/rptOwnerName>/)?.[1] ?? '';
          const relation  = xml.match(/<officerTitle>([^<]+)<\/officerTitle>/)?.[1] ??
                            (xml.includes('<isDirector>1</isDirector>') ? 'Director' :
                             xml.includes('<isOfficer>1</isOfficer>') ? 'Officer' : '');

          const shares = sharesRaw ? parseFloat(sharesRaw) : null;
          const price  = priceRaw  ? parseFloat(priceRaw)  : null;
          const value  = shares != null && price != null ? Math.round(shares * price) : null;

          const typeMap: Record<string, string> = {
            P: 'Buy', S: 'Sell', A: 'Award', D: 'Disposition',
            F: 'Tax withholding', G: 'Gift', M: 'Option exercise',
          };

          if (!rptName) return null;
          return { name: rptName, relation, type: typeMap[transCode] ?? transCode, shares, value, date: dates[idx] ?? null };
        } catch {
          return null;
        }
      }),
    );

    return results.filter((r): r is InsiderTx => r !== null);
  } catch {
    return [];
  }
}

// ── Institutional Holders (13F) ──────────────────────────────────────────────

export interface InstitutionalHolder {
  name: string;
  pctHeld: number | null;
  shares: number | null;
  value: number | null;
  reportDate: string | null;
}

export interface MajorHolders {
  insidersPercent: number | null;
  institutionsPercent: number | null;
}

export interface SmartMoneyData {
  institutionalHolders: InstitutionalHolder[];
  majorHolders: MajorHolders | null;
  insiderTransactions: InsiderTx[];
  source: 'yahoo' | 'edgar' | 'cache';
}

// Yahoo Finance v10 quoteSummary for institutional data
export async function fetchYahooSmartMoney(
  ticker: string,
  cookie: string,
  crumb: string,
): Promise<SmartMoneyData | null> {
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
      if (!result) continue;

      const ownershipList: any[] = result.institutionOwnership?.ownershipList ?? [];
      const institutionalHolders: InstitutionalHolder[] = ownershipList.map((item: any) => ({
        name: item.organization ?? '',
        pctHeld: item.pctHeld?.raw != null ? Math.round(item.pctHeld.raw * 10000) / 100 : null,
        shares: item.position?.raw ?? null,
        value: item.value?.raw ?? null,
        reportDate: item.reportDate?.fmt ?? null,
      }));

      const mhb = result.majorHoldersBreakdown;
      const majorHolders: MajorHolders | null = mhb ? {
        insidersPercent: mhb.insidersPercentHeld?.raw != null
          ? Math.round(mhb.insidersPercentHeld.raw * 10000) / 100 : null,
        institutionsPercent: mhb.institutionsPercentHeld?.raw != null
          ? Math.round(mhb.institutionsPercentHeld.raw * 10000) / 100 : null,
      } : null;

      const yahooTxList: any[] = result.insiderTransactions?.transactions ?? [];
      const insiderTransactions: InsiderTx[] = yahooTxList.map((tx: any) => {
        const text: string = tx.transactionText ?? '';
        const isSale = /sale|sell/i.test(text);
        const isPurchase = /purchase|buy/i.test(text);
        return {
          name: tx.filerName ?? '',
          relation: tx.filerRelation ?? '',
          type: isSale ? 'Sell' : isPurchase ? 'Buy' : text || 'Unknown',
          shares: tx.shares?.raw ?? null,
          value: tx.value?.raw ?? null,
          date: tx.startDate?.fmt ?? null,
        };
      });

      // Only return if we got meaningful data
      if (institutionalHolders.length > 0 || insiderTransactions.length > 0 || majorHolders) {
        return { institutionalHolders, majorHolders, insiderTransactions, source: 'yahoo' };
      }
    } catch { /* try next */ }
  }
  return null;
}
