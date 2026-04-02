import { NextRequest, NextResponse } from 'next/server';
import { calculateRSI } from '@/lib/stock-utils';
import type { StockData } from '@/lib/types';
import { getYahooAuth, yahooHeaders, clearYahooCache } from '@/lib/yahoo-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ticker = searchParams.get('ticker') || searchParams.get('symbol') || '';
  const range = searchParams.get('range') || '1y';

  if (!ticker) {
    return NextResponse.json({ error: 'Ticker erforderlich' }, { status: 400 });
  }

  try {
    const { cookie, crumb } = await getYahooAuth();

    const modules = [
      'summaryDetail',
      'financialData',
      'defaultKeyStatistics',
      'assetProfile',
      'recommendationTrend',
      'calendarEvents',
    ].join(',');

    // Fetch quote summary
    const summaryUrl = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(ticker)}?modules=${modules}&crumb=${encodeURIComponent(crumb)}`;
    let summaryRes = await fetch(summaryUrl, { headers: yahooHeaders(cookie) });

    // On 401/403: clear cached auth and retry once with fresh credentials
    if (summaryRes.status === 401 || summaryRes.status === 403) {
      clearYahooCache();
      const fresh = await getYahooAuth();
      const retryUrl = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(ticker)}?modules=${modules}&crumb=${encodeURIComponent(fresh.crumb)}`;
      summaryRes = await fetch(retryUrl, { headers: yahooHeaders(fresh.cookie) });
    }

    // On 404/422: fall back to v7/quote for basic price data (international stocks)
    let sd: any = {}, fd: any = {}, ks: any = {}, ap: any = {}, ce: any = {};

    if (summaryRes.status === 404 || summaryRes.status === 422) {
      const quoteUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(ticker)}&crumb=${encodeURIComponent(crumb)}`;
      const quoteRes = await fetch(quoteUrl, { headers: yahooHeaders(cookie), signal: AbortSignal.timeout(6000) });
      if (!quoteRes.ok) {
        return NextResponse.json({ error: `Yahoo Finance: ${summaryRes.status}` }, { status: 502 });
      }
      const quoteJson = await quoteRes.json();
      const q = quoteJson?.quoteResponse?.result?.[0];
      if (!q) return NextResponse.json({ error: 'Aktie nicht gefunden' }, { status: 404 });

      sd = {
        currency: q.currency,
        regularMarketPrice: { raw: q.regularMarketPrice },
        regularMarketPreviousClose: { raw: q.regularMarketPreviousClose },
        open: { raw: q.regularMarketOpen },
        dayHigh: { raw: q.regularMarketDayHigh },
        dayLow: { raw: q.regularMarketDayLow },
        volume: { raw: q.regularMarketVolume },
        averageVolume: { raw: q.averageDailyVolume3Month },
        marketCap: { raw: q.marketCap },
        trailingPE: { raw: q.trailingPE },
        forwardPE: { raw: q.forwardPE },
        beta: { raw: q.beta },
        fiftyTwoWeekHigh: { raw: q.fiftyTwoWeekHigh },
        fiftyTwoWeekLow: { raw: q.fiftyTwoWeekLow },
        fiftyDayAverage: { raw: q.fiftyDayAverage },
        twoHundredDayAverage: { raw: q.twoHundredDayAverage },
        dividendYield: { raw: q.trailingAnnualDividendYield || 0 },
        trailingAnnualDividendYield: { raw: q.trailingAnnualDividendYield },
        trailingAnnualDividendRate: { raw: q.trailingAnnualDividendRate },
      };
      ap = { longName: q.longName, shortName: q.shortName, sector: q.sector || '', country: q.country || '' };
      ks = { shortName: { raw: q.shortName }, exchange: { raw: q.fullExchangeName } };
    } else {
      if (!summaryRes.ok) {
        const errText = await summaryRes.text();
        console.error('Yahoo summary error:', summaryRes.status, errText.slice(0, 200));
        return NextResponse.json({ error: `Yahoo Finance: ${summaryRes.status}` }, { status: 502 });
      }

      const summaryJson = await summaryRes.json();
      const result = summaryJson?.quoteSummary?.result?.[0];

      if (!result) {
        return NextResponse.json({ error: 'Aktie nicht gefunden' }, { status: 404 });
      }

      sd = result.summaryDetail || {};
      fd = result.financialData || {};
      ks = result.defaultKeyStatistics || {};
      ap = result.assetProfile || {};
      ce = result.calendarEvents || {};
    }

    // Fetch chart data for RSI + historical prices
    const chartInterval = range === '5y' ? '1wk' : '1d';
    const chartUrl = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=${chartInterval}&range=${range}`;
    let chartData: { date: string; close: number; volume?: number }[] = [];
    let rsi = 50;
    let currentPrice = fd.currentPrice?.raw ?? sd.regularMarketPrice?.raw ?? 0;
    let previousClose = sd.regularMarketPreviousClose?.raw ?? 0;

    try {
      const chartRes = await fetch(chartUrl, { headers: yahooHeaders(cookie) });
      if (chartRes.ok) {
        const chartJson = await chartRes.json();
        const chartResult = chartJson?.chart?.result?.[0];
        if (chartResult) {
          const timestamps: number[] = chartResult.timestamp || [];
          const closes: number[] = chartResult.indicators?.quote?.[0]?.close || [];
          const volumes: number[] = chartResult.indicators?.quote?.[0]?.volume || [];

          chartData = timestamps
            .map((ts, i) => ({
              date: new Date(ts * 1000).toISOString().split('T')[0],
              close: closes[i] ?? null,
              volume: volumes[i] ?? undefined,
            }))
            .filter((d) => d.close !== null) as { date: string; close: number; volume?: number }[];

          if (closes.filter(Boolean).length >= 15) {
            rsi = calculateRSI(closes.filter(Boolean));
          }

          const meta = chartResult.meta;
          if (!currentPrice) currentPrice = meta.regularMarketPrice ?? 0;
          if (!previousClose) previousClose = meta.chartPreviousClose ?? meta.previousClose ?? 0;
        }
      }
    } catch (chartErr) {
      console.error('Chart fetch error:', chartErr);
    }

    const change = currentPrice - previousClose;
    const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;

    // Determine trend from 200-day MA
    const twoHundredDayAvg = ks.twoHundredDayAverageChange?.raw
      ? currentPrice - ks.twoHundredDayAverageChange.raw
      : null;
    const trend: 'up' | 'down' | 'neutral' =
      twoHundredDayAvg
        ? currentPrice > twoHundredDayAvg ? 'up' : 'down'
        : 'neutral';

    const stockData: StockData = {
      ticker: ticker.toUpperCase(),
      name: ap.longName || ap.shortName || ks.shortName?.raw || ticker,
      currency: sd.currency || 'USD',
      exchange: ks.exchange?.raw || '',
      sector: ap.sector || '',
      industry: ap.industry || '',
      description: ap.longBusinessSummary || '',
      website: ap.website || '',
      country: ap.country || '',
      employees: ap.fullTimeEmployees || undefined,

      currentPrice,
      previousClose,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100,
      open: sd.open?.raw ?? undefined,
      dayHigh: sd.dayHigh?.raw ?? undefined,
      dayLow: sd.dayLow?.raw ?? undefined,
      volume: sd.volume?.raw ?? undefined,
      avgVolume: sd.averageVolume?.raw ?? undefined,
      marketCap: sd.marketCap?.raw ?? undefined,

      kgv: sd.trailingPE?.raw ?? null,
      forwardKgv: sd.forwardPE?.raw ?? null,
      pegRatio: ks.pegRatio?.raw ?? null,
      priceToBook: ks.priceToBook?.raw ?? null,
      priceToSales: ks.priceToSalesTrailing12Months?.raw ?? null,
      evEbitda: ks.enterpriseToEbitda?.raw ?? null,
      enterpriseValue: ks.enterpriseValue?.raw ?? null,

      eps: ks.trailingEps?.raw ?? null,
      epsForward: ks.forwardEps?.raw ?? null,
      earningsDate: ce.earnings?.earningsDate?.[0]?.fmt ?? null,
      revenueGrowth: fd.revenueGrowth?.raw ?? null,
      earningsGrowth: fd.earningsGrowth?.raw ?? null,

      grossMargin: fd.grossMargins?.raw ?? null,
      operatingMargin: fd.operatingMargins?.raw ?? null,
      profitMargin: fd.profitMargins?.raw ?? null,
      returnOnEquity: fd.returnOnEquity?.raw ?? null,
      returnOnAssets: fd.returnOnAssets?.raw ?? null,
      ebitda: fd.ebitda?.raw ?? null,
      freeCashflow: fd.freeCashflow?.raw ?? null,

      verschuldungsgrad: fd.debtToEquity?.raw ?? null,
      currentRatio: fd.currentRatio?.raw ?? null,
      totalDebt: fd.totalDebt?.raw ?? null,
      totalCash: fd.totalCash?.raw ?? null,

      dividendenRendite: (sd.dividendYield?.raw ?? 0) * 100,
      trailingDividendYield: (sd.trailingAnnualDividendYield?.raw ?? 0) * 100,
      trailingDividendRate: sd.trailingAnnualDividendRate?.raw ?? null,
      forwardDividendAmount: sd.dividendRate?.raw ?? null,
      forwardDividendYield: (sd.dividendYield?.raw ?? 0) * 100,
      payoutRatio: (sd.payoutRatio?.raw ?? 0) * 100,
      fiveYearAvgDividendYield: sd.fiveYearAvgDividendYield?.raw ?? null,
      exDividendDate: sd.exDividendDate?.fmt ?? null,
      dividendDate: sd.dividendDate?.fmt ?? null,

      rsi,
      beta: sd.beta?.raw ?? null,
      fiftyTwoWeekHigh: sd.fiftyTwoWeekHigh?.raw ?? null,
      fiftyTwoWeekLow: sd.fiftyTwoWeekLow?.raw ?? null,
      fiftyDayAverage: sd.fiftyDayAverage?.raw ?? null,
      twoHundredDayAverage: sd.twoHundredDayAverage?.raw ?? null,
      trend,

      targetMeanPrice: fd.targetMeanPrice?.raw ?? null,
      targetHighPrice: fd.targetHighPrice?.raw ?? null,
      targetLowPrice: fd.targetLowPrice?.raw ?? null,
      recommendationKey: fd.recommendationKey ?? null,
      numberOfAnalystOpinions: fd.numberOfAnalystOpinions?.raw ?? null,

      chartData,
    };

    return NextResponse.json(stockData);
  } catch (error: any) {
    console.error('Stock API error:', error);
    return NextResponse.json({ error: error.message || 'Interner Fehler' }, { status: 500 });
  }
}
