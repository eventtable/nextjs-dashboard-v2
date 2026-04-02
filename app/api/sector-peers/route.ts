import { NextRequest, NextResponse } from 'next/server';
import { PEERS } from '@/data/peers';

export const dynamic = 'force-dynamic';

// Hedging pairs by sector — counter-cyclical stocks
const HEDGING_MAP: Record<string, Array<{ ticker: string; name: string; sector: string; reason: string }>> = {
  'Big Tech': [
    { ticker: 'XOM', name: 'ExxonMobil', sector: 'Energy', reason: 'Energie läuft gegensätzlich zu Tech' },
    { ticker: 'GLD', name: 'Gold ETF (SPDR)', sector: 'Gold', reason: 'Safe-Haven bei Tech-Korrektur' },
    { ticker: 'KO', name: 'Coca-Cola', sector: 'Consumer Staples', reason: 'Defensiv, niedrige Korrelation' },
    { ticker: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare', reason: 'Healthcare läuft in Rezessionen gut' },
  ],
  'Enterprise Software': [
    { ticker: 'XOM', name: 'ExxonMobil', sector: 'Energy', reason: 'Energie vs. Software gegensätzlich' },
    { ticker: 'NEM', name: 'Newmont', sector: 'Gold Mining', reason: 'Gold als Safe-Haven' },
    { ticker: 'PG', name: 'Procter & Gamble', sector: 'Consumer Staples', reason: 'Defensive Qualität' },
  ],
  'Insurance': [
    { ticker: 'AAPL', name: 'Apple', sector: 'Big Tech', reason: 'Tech wächst wenn Versicherungen stagnieren' },
    { ticker: 'TSLA', name: 'Tesla', sector: 'EV', reason: 'Wachstum vs. defensive Versicherung' },
    { ticker: 'NEM', name: 'Newmont', sector: 'Gold Mining', reason: 'Gold ergänzt Versicherungsportfolio' },
  ],
  'Reinsurance': [
    { ticker: 'AAPL', name: 'Apple', sector: 'Big Tech', reason: 'Tech als Wachstumskomponente' },
    { ticker: 'AMZN', name: 'Amazon', sector: 'E-Commerce/Cloud', reason: 'Wachstum zu defensiven Rückversicherern' },
  ],
  'EV Manufacturing': [
    { ticker: 'XOM', name: 'ExxonMobil', sector: 'Traditional Energy', reason: 'Fossile Energie vs. EV-Disruption' },
    { ticker: 'CVX', name: 'Chevron', sector: 'Traditional Energy', reason: 'Öl profitiert wenn EV-Verkäufe fallen' },
    { ticker: 'ALV.DE', name: 'Allianz', sector: 'Insurance', reason: 'Defensiv bei EV-Volatilität' },
  ],
  'Gold Mining': [
    { ticker: 'MSFT', name: 'Microsoft', sector: 'Big Tech', reason: 'Risk-On vs. Gold als Safe-Haven' },
    { ticker: 'AAPL', name: 'Apple', sector: 'Big Tech', reason: 'Tech-Wachstum gegensätzlich zu Gold' },
    { ticker: 'JPM', name: 'JPMorgan Chase', sector: 'Financials', reason: 'Zinsen schaden Gold, helfen Banken' },
  ],
  'Technology': [
    { ticker: 'XOM', name: 'ExxonMobil', sector: 'Energy', reason: 'Energie läuft gegensätzlich zu Tech' },
    { ticker: 'GLD', name: 'Gold ETF (SPDR)', sector: 'Gold', reason: 'Safe-Haven bei Tech-Korrektur' },
    { ticker: 'KO', name: 'Coca-Cola', sector: 'Consumer Staples', reason: 'Defensiv, niedrige Korrelation' },
    { ticker: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare', reason: 'Healthcare läuft in Rezessionen gut' },
  ],
  'Pharma (Diabetes/Obesity)': [
    { ticker: 'XOM', name: 'ExxonMobil', sector: 'Energy', reason: 'Zyklisch vs. defensiv' },
    { ticker: 'MSFT', name: 'Microsoft', sector: 'Big Tech', reason: 'Tech-Wachstum vs. defensives Healthcare' },
    { ticker: 'JPM', name: 'JPMorgan Chase', sector: 'Financials', reason: 'Zinssensitiv vs. pharma-defensiv' },
  ],
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ticker = (searchParams.get('ticker') || searchParams.get('symbol') || '').toUpperCase();

  if (!ticker) {
    return NextResponse.json({ sector: null, sectorLabel: null, peers: [], hedgingPairs: [] });
  }

  // Look up in our PEERS data — try exact ticker first, then strip exchange suffix
  const tickerBase = ticker.replace(/\.(DE|PA|CO|L|AS|MI|MC|SW)$/i, '');
  const peerInfo = PEERS[ticker] ?? PEERS[tickerBase];

  if (peerInfo) {
    const branche = peerInfo.branche;
    const peerTickers = peerInfo.peers;

    const peers = peerTickers.map((t: string) => ({
      ticker: t,
      name: t,
      sector: branche,
      index: '',
      sectorLabel: branche,
    }));

    const hedgingPairs = (HEDGING_MAP[branche] ?? []).map(h => ({
      ticker: h.ticker,
      name: h.name,
      sector: h.sector,
      index: '',
      sectorLabel: h.sector,
      reason: h.reason,
    }));

    return NextResponse.json({ sector: branche, sectorLabel: branche, peers, hedgingPairs });
  }

  // Fallback: try Yahoo Finance summaryProfile to get sector, then match against our data
  try {
    const url = `https://query2.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(ticker)}?modules=summaryProfile`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
      signal: AbortSignal.timeout(6000),
    });
    if (res.ok) {
      const json = await res.json();
      const profile = json?.quoteSummary?.result?.[0]?.summaryProfile;
      const sector = profile?.sector ?? null;

      // Find peers in same sector from our data
      const sameSectorPeers = Object.entries(PEERS)
        .filter(([t]) => t !== ticker)
        .filter(([, p]) => {
          const s = p.branche.toLowerCase();
          return sector && (s.includes(sector.toLowerCase()) || sector.toLowerCase().includes(s));
        })
        .slice(0, 5)
        .map(([t, p]) => ({ ticker: t, name: t, sector: p.branche, index: '', sectorLabel: p.branche }));

      const hedgingPairs = (HEDGING_MAP[sector ?? ''] ?? []).map(h => ({
        ticker: h.ticker, name: h.name, sector: h.sector, index: '', sectorLabel: h.sector, reason: h.reason,
      }));

      return NextResponse.json({ sector, sectorLabel: sector, peers: sameSectorPeers, hedgingPairs });
    }
  } catch { /* ignore */ }

  return NextResponse.json({ sector: null, sectorLabel: null, peers: [], hedgingPairs: [] });
}
