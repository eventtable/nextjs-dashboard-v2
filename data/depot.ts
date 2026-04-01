// Depot-Daten für Frank Müller
// Stand: 29.03.2026 (Auszug Trade Republic)
// 15 Positionen (MBB verkauft)

export interface Position {
  id: string;
  name: string;
  ticker: string;
  typ: 'Aktie' | 'ETF' | 'Anleihe';
  stueck: number;
  wertEur: number;
  kursProStueck: number;
  einstandKurs: number;  // Dein Durchschnittskaufpreis
  performanceProzent: number;
  gewinnEur: number;
  sektor?: string;
  isin?: string;
}

// Echte Depot-Daten vom 29.03.2026
export const depotPositionen: Position[] = [
  // Aktien (6)
  {
    id: '1',
    name: 'Barrick Mining',
    ticker: 'GOLD',
    typ: 'Aktie',
    stueck: 14,
    wertEur: 467.60,
    kursProStueck: 33.40,
    einstandKurs: 43.63,
    performanceProzent: -23.4,
    gewinnEur: -143.22,
    sektor: 'Mining',
    isin: 'CA06849F1080'
  },
  {
    id: '2',
    name: 'BYD',
    ticker: 'BYD6.DE',
    typ: 'Aktie',
    stueck: 43,
    wertEur: 464.40,
    kursProStueck: 10.80,
    einstandKurs: 13.62,
    performanceProzent: -20.7,
    gewinnEur: -121.26,
    sektor: 'Automotive',
    isin: 'CNE100000296'
  },
  {
    id: '3',
    name: 'SAP',
    ticker: 'SAP.DE',
    typ: 'Aktie',
    stueck: 2.5,
    wertEur: 354.40,
    kursProStueck: 141.76,
    einstandKurs: 198.08,
    performanceProzent: -28.4,
    gewinnEur: -140.80,
    sektor: 'Software',
    isin: 'DE0007164600'
  },
  {
    id: '4',
    name: 'Allianz',
    ticker: 'ALV.DE',
    typ: 'Aktie',
    stueck: 1,
    wertEur: 348.80,
    kursProStueck: 348.80,
    einstandKurs: 362.00,
    performanceProzent: -3.6,
    gewinnEur: -13.20,
    sektor: 'Insurance',
    isin: 'DE0008404005'
  },
  {
    id: '5',
    name: 'Munich Re',
    ticker: 'MUV2.DE',
    typ: 'Aktie',
    stueck: 1,
    wertEur: 519.00,
    kursProStueck: 519.00,
    einstandKurs: 547.00,
    performanceProzent: -5.1,
    gewinnEur: -28.00,
    sektor: 'Insurance',
    isin: 'DE0008430026'
  },
  {
    id: '6',
    name: 'Novo Nordisk',
    ticker: 'NOVO-B.CO',
    typ: 'Aktie',
    stueck: 21.5,
    wertEur: 654.68,
    kursProStueck: 30.45,
    einstandKurs: 43.14,
    performanceProzent: -29.4,
    gewinnEur: -272.84,
    sektor: 'Pharma',
    isin: 'DK0062498333'
  },
  {
    id: '7',
    name: 'Microsoft',
    ticker: 'MSFT',
    typ: 'Aktie',
    stueck: 1.45,
    wertEur: 449.36,
    kursProStueck: 309.90,
    einstandKurs: 348.69,
    performanceProzent: -11.1,
    gewinnEur: -56.25,
    sektor: 'Technology',
    isin: 'US5949181045'
  },
  // ETFs (7)
  {
    id: '8',
    name: 'HANetf Future of Defence',
    ticker: 'NATO',
    typ: 'ETF',
    stueck: 31,
    wertEur: 495.26,
    kursProStueck: 15.98,
    einstandKurs: 18.02,
    performanceProzent: -11.3,
    gewinnEur: -63.24,
    isin: 'IE000OJ5TQP4'
  },
  {
    id: '9',
    name: 'iShares Physical Gold',
    ticker: 'IGLN.L',
    typ: 'ETF',
    stueck: 15,
    wertEur: 1130.70,
    kursProStueck: 75.38,
    einstandKurs: 80.71,
    performanceProzent: -6.6,
    gewinnEur: -79.95,
    isin: 'IE00B4ND3602'
  },
  {
    id: '10',
    name: 'WisdomTree DAX 3x Short',
    ticker: '3DES',
    typ: 'ETF',
    stueck: 2000,
    wertEur: 451.80,
    kursProStueck: 0.23,
    einstandKurs: 0.233,
    performanceProzent: -1.3,
    gewinnEur: -6.00,
    isin: 'IE00B8GKPP93'
  },
  {
    id: '11',
    name: 'Xtrackers AI & Big Data',
    ticker: 'XAI',
    typ: 'ETF',
    stueck: 4.666933,
    wertEur: 660.65,
    kursProStueck: 141.56,
    einstandKurs: 153.03,
    performanceProzent: -7.5,
    gewinnEur: -53.53,
    isin: 'IE00BGV5VN51'
  },
  {
    id: '12',
    name: 'Vanguard FTSE World High Div',
    ticker: 'VHYD',
    typ: 'ETF',
    stueck: 6.791796,
    wertEur: 554.69,
    kursProStueck: 81.67,
    einstandKurs: 77.51,
    performanceProzent: 5.4,
    gewinnEur: 28.25,
    isin: 'IE00BK5BR626'
  },
  {
    id: '13',
    name: 'Xtrackers MSCI World Energy',
    ticker: 'XDWC',
    typ: 'ETF',
    stueck: 15,
    wertEur: 977.10,
    kursProStueck: 65.14,
    einstandKurs: 52.40,
    performanceProzent: 24.3,
    gewinnEur: 191.10,
    isin: 'IE00BM67HM91'
  },
  {
    id: '14',
    name: 'iShares Bloomberg Roll Select Comm',
    ticker: 'COMO',
    typ: 'ETF',
    stueck: 52,
    wertEur: 466.44,
    kursProStueck: 8.97,
    einstandKurs: 9.28,
    performanceProzent: -3.3,
    gewinnEur: -16.12,
    isin: 'IE00BZ1NCS44'
  },
  {
    id: '15',
    name: 'Amundi MSCI Emerging Markets',
    ticker: 'AMEM',
    typ: 'ETF',
    stueck: 42,
    wertEur: 262.11,
    kursProStueck: 6.24,
    einstandKurs: 6.70,
    performanceProzent: -6.9,
    gewinnEur: -19.32,
    isin: 'LU1681045370'
  },
  // Anleihe (1)
  // Investiert: 536,82€ zu 99,50% = ~539,57€ Nennwert
  // Aktueller Wert bei 24,50% = ~132€
  {
    id: '16',
    name: 'Air Baltic Bonds 2024/29',
    ticker: 'XS2800678224',
    typ: 'Anleihe',
    stueck: 5.3957,  // ~539,57€ Nennwert / 100€
    wertEur: 132.19,
    kursProStueck: 24.50,
    einstandKurs: 99.50,
    performanceProzent: -75.4,
    gewinnEur: -404.63,
    isin: 'XS2800678224'
  }
];

// Berechnete Werte
export const berechneDepotSummen = () => {
  const gesamtWert = depotPositionen.reduce((sum, pos) => sum + pos.wertEur, 0);
  const gesamtGewinn = depotPositionen.reduce((sum, pos) => sum + pos.gewinnEur, 0);
  const investiert = depotPositionen.reduce((sum, pos) => sum + (pos.stueck * pos.einstandKurs), 0);
  const performanceProzent = ((gesamtWert - investiert) / investiert) * 100;
  
  return {
    gesamtWert: Math.round(gesamtWert * 100) / 100,
    gesamtGewinn: Math.round(gesamtGewinn * 100) / 100,
    investiert: Math.round(investiert * 100) / 100,
    performanceProzent: Math.round(performanceProzent * 100) / 100,
    anzahlPositionen: depotPositionen.length
  };
};

// Filter-Funktionen
export const filterNachTyp = (typ: 'Aktie' | 'ETF' | 'Anleihe') => {
  return depotPositionen.filter(pos => pos.typ === typ);
};

// Asset Allocation
export const berechneAssetAllocation = () => {
  const aktien = depotPositionen.filter(p => p.typ === 'Aktie').reduce((s, p) => s + p.wertEur, 0);
  const etfs = depotPositionen.filter(p => p.typ === 'ETF').reduce((s, p) => s + p.wertEur, 0);
  const anleihen = depotPositionen.filter(p => p.typ === 'Anleihe').reduce((s, p) => s + p.wertEur, 0);
  const gesamt = aktien + etfs + anleihen;
  
  return [
    { name: 'Aktien', wert: aktien, prozent: Math.round((aktien / gesamt) * 100 * 100) / 100 },
    { name: 'ETFs', wert: etfs, prozent: Math.round((etfs / gesamt) * 100 * 100) / 100 },
    { name: 'Anleihen', wert: anleihen, prozent: Math.round((anleihen / gesamt) * 100 * 100) / 100 }
  ];
};

// Historische Daten (simuliert für Chart)
export interface DepotHistorie {
  datum: string;
  depotwert: number;
  investiert: number;
}

export const depotHistorie: DepotHistorie[] = [
  { datum: '2025-01-01', depotwert: 9593.77, investiert: 9593.77 },
  { datum: '2025-03-01', depotwert: 9200.00, investiert: 9593.77 },
  { datum: '2025-06-01', depotwert: 8900.00, investiert: 9593.77 },
  { datum: '2025-09-01', depotwert: 8600.00, investiert: 9593.77 },
  { datum: '2025-12-01', depotwert: 8500.00, investiert: 9593.77 },
  { datum: '2026-01-01', depotwert: 8400.00, investiert: 9593.77 },
  { datum: '2026-02-01', depotwert: 8350.00, investiert: 9593.77 },
  { datum: '2026-03-01', depotwert: 8400.00, investiert: 9593.77 },
  { datum: '2026-03-27', depotwert: 8611.16, investiert: 9593.77 },
  { datum: '2026-03-29', depotwert: 8388.51, investiert: 9593.77 },
  { datum: '2026-03-30', depotwert: 8389.18, investiert: 9596.51 },
];

// Zusammenfassung (Werden automatisch von berechneDepotSummen() berechnet)
export const DEPOT_ZUSAMMENFASSUNG = {
  stand: '2026-03-30',
  gesamtWert: 8389.18,
  investiert: 9596.51,
  gewinnVerlust: -1199.01,
  performanceProzent: -12.58,
  anzahlPositionen: 16,
  verteilung: {
    aktien: 6,
    etfs: 9,
    anleihen: 1
  }
};

// Verkaufte Positionen
export const verkauftePositionen = [
  {
    name: 'MBB SE',
    ticker: 'MBBK.DE',
    verkaufsDatum: '2026-03-29',
    realisierterVerlust: -48.00,
    anmerkung: 'Verkauf mit Verlust'
  }
];
