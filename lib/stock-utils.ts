import { PEERS as peers } from '@/data/peers';

// ─── Formatters ───────────────────────────────────────────────────────────────

export function formatNumber(value: number | null | undefined, decimals = 2): string {
  if (value === null || value === undefined || isNaN(Number(value))) return 'N/A';
  return Number(value).toLocaleString('de-DE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatPercent(value: number | null | undefined, decimals = 2): string {
  if (value === null || value === undefined || isNaN(Number(value))) return 'N/A';
  return `${formatNumber(value, decimals)}%`;
}

export function formatMarketCap(value: number | null | undefined): string {
  if (!value) return 'N/A';
  if (value >= 1e12) return `${(value / 1e12).toFixed(2)} Bio.`;
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)} Mrd.`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)} Mio.`;
  return formatNumber(value, 0);
}

export function formatCurrency(value: number | null | undefined, currency = 'EUR'): string {
  if (value === null || value === undefined) return 'N/A';
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency }).format(value);
}

// ─── Peer Groups ──────────────────────────────────────────────────────────────

export const PEER_GROUPS = peers;

export function findPeerGroup(ticker: string): { name: string; members: { ticker: string; name: string }[] } | null {
  const groups = Object.values(peers) as any[];
  const group = groups.find((g) => g.members?.some((m: any) => m.ticker === ticker));
  return group ?? null;
}

// ─── Matrix Ampel ─────────────────────────────────────────────────────────────

interface AmpelInput {
  kgv: number | null;
  rsi: number;
  fcfPositiv: boolean;
  dividendenRendite: number;
  umsatzWachstum: number | null;
  verschuldungsgrad: number | null;
}

interface AmpelResult {
  status: 'gruen' | 'gelb' | 'orange' | 'rot';
  label: string;
  beschreibung: string;
  score: number;
  color: string;
  emoji: string;
  details: { kriterium: string; erfuellt: boolean; wert: string }[];
}

export function berechneAmpel(input: AmpelInput): AmpelResult {
  const { kgv, rsi, fcfPositiv, dividendenRendite, umsatzWachstum, verschuldungsgrad } = input;

  const kriterien = [
    {
      kriterium: 'KGV < 25',
      erfuellt: kgv !== null && kgv > 0 && kgv < 25,
      wert: kgv !== null ? `KGV: ${kgv.toFixed(1)}` : 'N/A',
    },
    {
      kriterium: 'RSI 30–70 (nicht überhitzt)',
      erfuellt: rsi >= 30 && rsi <= 70,
      wert: `RSI: ${rsi.toFixed(1)}`,
    },
    {
      kriterium: 'Positiver Free Cashflow',
      erfuellt: fcfPositiv,
      wert: fcfPositiv ? 'FCF positiv' : 'FCF negativ',
    },
    {
      kriterium: 'Dividendenrendite ≥ 1%',
      erfuellt: dividendenRendite >= 1,
      wert: `${dividendenRendite.toFixed(2)}%`,
    },
    {
      kriterium: 'Umsatzwachstum > 0%',
      erfuellt: umsatzWachstum !== null && umsatzWachstum > 0,
      wert: umsatzWachstum !== null ? `${(umsatzWachstum * 100).toFixed(1)}%` : 'N/A',
    },
    {
      kriterium: 'Verschuldungsgrad < 1.5',
      erfuellt: verschuldungsgrad !== null && verschuldungsgrad < 1.5,
      wert: verschuldungsgrad !== null ? verschuldungsgrad.toFixed(2) : 'N/A',
    },
  ];

  const erfuellt = kriterien.filter((k) => k.erfuellt).length;
  const score = Math.round((erfuellt / kriterien.length) * 100);

  let status: AmpelResult['status'];
  let label: string;
  let beschreibung: string;
  let color: string;
  let emoji: string;

  if (score >= 80) {
    status = 'gruen';
    label = 'Kaufen';
    beschreibung = 'Starke Fundamentaldaten – gutes Chance-Risiko-Verhältnis';
    color = '#22c55e';
    emoji = '🟢';
  } else if (score >= 60) {
    status = 'gelb';
    label = 'Beobachten';
    beschreibung = 'Solide Basis, aber einige Kriterien noch nicht erfüllt';
    color = '#eab308';
    emoji = '🟡';
  } else if (score >= 40) {
    status = 'orange';
    label = 'Vorsicht';
    beschreibung = 'Mehrere Schwächen – erhöhtes Risiko beachten';
    color = '#f97316';
    emoji = '🟠';
  } else {
    status = 'rot';
    label = 'Meiden';
    beschreibung = 'Schwache Fundamentaldaten – hohe Risikoposition';
    color = '#ef4444';
    emoji = '🔴';
  }

  return { status, label, beschreibung, score, color, emoji, details: kriterien };
}

// ─── RSI Calculation ──────────────────────────────────────────────────────────

export function calculateRSI(closes: number[], period = 14): number {
  if (closes.length < period + 1) return 50;

  let gains = 0;
  let losses = 0;

  for (let i = closes.length - period; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }

  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return Math.round(100 - 100 / (1 + rs));
}
