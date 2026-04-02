export type StrategyType = 'dividende' | 'wachstum' | 'value' | 'etf' | 'anleihe' | 'rohstoff' | 'absicherung';
export type AssetCategory = 'aktie' | 'etf' | 'etp' | 'anleihe' | 'rohstoff' | 'cash';

export const STRATEGY_CONFIG: Record<StrategyType, { label: string; color: string; description: string; targetPercent: number }> = {
  dividende: { label: 'Dividende', color: '#22c55e', description: 'Regelmäßige Ausschüttungen, stabile Erträge', targetPercent: 30 },
  wachstum:  { label: 'Wachstum',  color: '#60B5FF', description: 'Hohe Wachstumsraten, Kursgewinne',           targetPercent: 25 },
  value:     { label: 'Value',     color: '#f0b90b', description: 'Unterbewertete Substanzwerte',                targetPercent: 20 },
  etf:       { label: 'ETF',       color: '#a78bfa', description: 'Breite Diversifikation, passiv',              targetPercent: 15 },
  anleihe:   { label: 'Anleihe',   color: '#94a3b8', description: 'Sichere Zinserträge, Kapitalerhalt',          targetPercent: 5  },
  rohstoff:  { label: 'Rohstoff',  color: '#fb923c', description: 'Inflationsschutz, Sachwerte',                 targetPercent: 5  },
  absicherung: { label: 'Absicherung', color: '#64748b', description: 'Hedging und Risikominimierung',           targetPercent: 0  },
};

export const CATEGORY_LABELS: Record<AssetCategory, string> = {
  aktie:    'Aktie',
  etf:      'ETF',
  etp:      'ETP',
  anleihe:  'Anleihe',
  rohstoff: 'Rohstoff',
  cash:     'Cash',
};

export interface Position {
  id: string;
  name: string;
  shortName: string;
  ticker: string;
  isin: string;
  typ: 'Aktie' | 'ETF' | 'Anleihe';
  category: AssetCategory;
  strategy: StrategyType;
  currency: string;
  lagerland: string;
  stueck: number;
  wertEur: number;
  kursProStueck: number;   // Aktueller Kurs (EUR-Äquivalent) – Fallback wenn Yahoo fehlschlägt
  einstandKurs: number;    // Durchschnittlicher Kaufkurs
  performanceProzent: number;
  gewinnEur: number;
  sektor?: string;
}

// Stand: 02.04.2026 (Trade Republic)
export const depotPositionen: Position[] = [
  // ── Aktien ────────────────────────────────────────────────────────────────
  {
    id: '1', name: 'Barrick Mining Corp.', shortName: 'Barrick',
    ticker: 'GOLD', isin: 'CA06849F1080', typ: 'Aktie',
    category: 'aktie', strategy: 'rohstoff', currency: 'USD', lagerland: 'Kanada',
    stueck: 14, kursProStueck: 36.48, einstandKurs: 43.63,
    wertEur: 510.72, gewinnEur: -100.10, performanceProzent: -16.4, sektor: 'Mining',
  },
  {
    id: '2', name: 'BYD Co. Ltd.', shortName: 'BYD',
    ticker: 'BYD6.DE', isin: 'CNE100000296', typ: 'Aktie',
    category: 'aktie', strategy: 'wachstum', currency: 'EUR', lagerland: 'Hongkong',
    stueck: 43, kursProStueck: 11.49, einstandKurs: 13.62,
    wertEur: 494.07, gewinnEur: -91.59, performanceProzent: -15.6, sektor: 'Automotive',
  },
  {
    id: '3', name: 'SAP SE', shortName: 'SAP',
    ticker: 'SAP.DE', isin: 'DE0007164600', typ: 'Aktie',
    category: 'aktie', strategy: 'wachstum', currency: 'EUR', lagerland: 'Deutschland',
    stueck: 2.5, kursProStueck: 147.10, einstandKurs: 198.08,
    wertEur: 367.75, gewinnEur: -127.45, performanceProzent: -25.7, sektor: 'Software',
  },
  {
    id: '4', name: 'Allianz SE', shortName: 'Allianz',
    ticker: 'ALV.DE', isin: 'DE0008404005', typ: 'Aktie',
    category: 'aktie', strategy: 'dividende', currency: 'EUR', lagerland: 'Deutschland',
    stueck: 1, kursProStueck: 368.00, einstandKurs: 362.00,
    wertEur: 368.00, gewinnEur: 6.00, performanceProzent: 1.7, sektor: 'Insurance',
  },
  {
    id: '5', name: 'Münchener Rückvers.-Ges. AG', shortName: 'Munich Re',
    ticker: 'MUV2.DE', isin: 'DE0008430026', typ: 'Aktie',
    category: 'aktie', strategy: 'dividende', currency: 'EUR', lagerland: 'Deutschland',
    stueck: 1, kursProStueck: 539.80, einstandKurs: 547.00,
    wertEur: 539.80, gewinnEur: -7.20, performanceProzent: -1.3, sektor: 'Insurance',
  },
  {
    id: '6', name: 'Novo-Nordisk AS', shortName: 'Novo Nordisk',
    ticker: 'NOVO-B.CO', isin: 'DK0062498333', typ: 'Aktie',
    category: 'aktie', strategy: 'wachstum', currency: 'DKK', lagerland: 'Dänemark',
    stueck: 21.5, kursProStueck: 31.28, einstandKurs: 43.14,
    wertEur: 672.41, gewinnEur: -255.00, performanceProzent: -27.5, sektor: 'Pharma',
  },
  {
    id: '7', name: 'Microsoft Corp.', shortName: 'Microsoft',
    ticker: 'MSFT', isin: 'US5949181045', typ: 'Aktie',
    category: 'aktie', strategy: 'wachstum', currency: 'USD', lagerland: 'USA',
    stueck: 1.45, kursProStueck: 319.10, einstandKurs: 348.69,
    wertEur: 462.70, gewinnEur: -42.91, performanceProzent: -8.5, sektor: 'Technology',
  },
  // ── ETFs ──────────────────────────────────────────────────────────────────
  {
    id: '8', name: 'HanETF Future of Defence ETF', shortName: 'NATO ETF',
    ticker: 'NATO', isin: 'IE000OJ5TQP4', typ: 'ETF',
    category: 'etf', strategy: 'etf', currency: 'USD', lagerland: 'UK',
    stueck: 31, kursProStueck: 16.98, einstandKurs: 18.02,
    wertEur: 526.44, gewinnEur: -32.24, performanceProzent: -5.8,
  },
  {
    id: '9', name: 'iShares Physical Gold ETC', shortName: 'Gold ETC',
    ticker: 'IGLN.L', isin: 'IE00B4ND3602', typ: 'ETF',
    category: 'etp', strategy: 'rohstoff', currency: 'USD', lagerland: 'Irland',
    stueck: 15, kursProStueck: 79.20, einstandKurs: 80.71,
    wertEur: 1188.00, gewinnEur: -22.65, performanceProzent: -1.9,
  },
  {
    id: '10', name: 'WisdomTree DAX 3x Short ETP', shortName: '3x Short DAX',
    ticker: '3DES', isin: 'IE00B8GKPP93', typ: 'ETF',
    category: 'etp', strategy: 'absicherung', currency: 'EUR', lagerland: 'Irland',
    stueck: 2000, kursProStueck: 0.1897, einstandKurs: 0.233,
    wertEur: 379.40, gewinnEur: -86.60, performanceProzent: -18.6,
  },
  {
    id: '11', name: 'Xtr.(IE)-Art.Int.+Big Data ETF', shortName: 'AI & Big Data',
    ticker: 'XAIX.DE', isin: 'IE00BGV5VN51', typ: 'ETF',
    category: 'etf', strategy: 'wachstum', currency: 'USD', lagerland: 'Irland',
    stueck: 4.666933, kursProStueck: 147.10, einstandKurs: 153.03,
    wertEur: 686.51, gewinnEur: -27.67, performanceProzent: -3.9,
  },
  {
    id: '12', name: 'Vanguard FTSE All-World High Div ETF', shortName: 'World Div ETF',
    ticker: 'VHYD.L', isin: 'IE00BK5BR626', typ: 'ETF',
    category: 'etf', strategy: 'dividende', currency: 'USD', lagerland: 'UK',
    stueck: 6.791796, kursProStueck: 83.47, einstandKurs: 77.51,
    wertEur: 566.91, gewinnEur: 40.48, performanceProzent: 7.7,
  },
  {
    id: '13', name: 'Xtr.(IE) - MSCI World Energy ETF', shortName: 'World Energy',
    ticker: 'XDWC.L', isin: 'IE00BM67HM91', typ: 'ETF',
    category: 'etf', strategy: 'wachstum', currency: 'USD', lagerland: 'Irland',
    stueck: 15, kursProStueck: 61.03, einstandKurs: 52.40,
    wertEur: 915.45, gewinnEur: 129.45, performanceProzent: 16.5,
  },
  {
    id: '14', name: 'iShares Bloomberg Roll Select Commodity ETF', shortName: 'Commodity ETF',
    ticker: 'COMO.L', isin: 'IE00BZ1NCS44', typ: 'ETF',
    category: 'etf', strategy: 'rohstoff', currency: 'USD', lagerland: 'Irland',
    stueck: 52, kursProStueck: 8.81, einstandKurs: 9.28,
    wertEur: 458.02, gewinnEur: -24.44, performanceProzent: -5.1,
  },
  {
    id: '15', name: 'AIS-Amundi MSCI Emerging Markets', shortName: 'Emerging Markets',
    ticker: 'PAEEM.PA', isin: 'LU1681045370', typ: 'ETF',
    category: 'etf', strategy: 'etf', currency: 'EUR', lagerland: 'Frankreich',
    stueck: 42, kursProStueck: 6.34, einstandKurs: 6.70,
    wertEur: 266.28, gewinnEur: -15.12, performanceProzent: -5.4,
  },
  // ── Anleihe ───────────────────────────────────────────────────────────────
  {
    id: '16', name: 'Air Baltic Bonds 2024/29', shortName: 'Air Baltic',
    ticker: 'XS2800678224', isin: 'XS2800678224', typ: 'Anleihe',
    category: 'anleihe', strategy: 'anleihe', currency: 'EUR', lagerland: 'UK',
    stueck: 5.3957, kursProStueck: 34.32, einstandKurs: 99.50,
    wertEur: 185.20, gewinnEur: -351.79, performanceProzent: -65.5,
  },
];

export const berechneDepotSummen = () => {
  const gesamtWert = depotPositionen.reduce((sum, pos) => sum + pos.wertEur, 0);
  const gesamtGewinn = depotPositionen.reduce((sum, pos) => sum + pos.gewinnEur, 0);
  const investiert = depotPositionen.reduce((sum, pos) => sum + pos.stueck * pos.einstandKurs, 0);
  return {
    gesamtWert: Math.round(gesamtWert * 100) / 100,
    gesamtGewinn: Math.round(gesamtGewinn * 100) / 100,
    investiert: Math.round(investiert * 100) / 100,
    performanceProzent: Math.round(((gesamtWert - investiert) / investiert) * 10000) / 100,
    anzahlPositionen: depotPositionen.length,
  };
};
