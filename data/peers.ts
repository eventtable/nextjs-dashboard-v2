// Peer-Daten für Matrix 2.0 KGV-Vergleich
// Branchen-Durchschnitte und Konkurrenz-Ticker

export interface PeerInfo {
  branche: string;
  durchschnittKGV: number;
  medianKGV: number;
  peers: string[];
  beschreibung: string;
}

export const PEERS: Record<string, PeerInfo> = {
  'SAP': {
    branche: 'Enterprise Software',
    durchschnittKGV: 25.0,
    medianKGV: 24.0,
    peers: ['ORCL', 'CRM', 'ADBE', 'INTU'],
    beschreibung: 'Cloud-Umstellung läuft, aber Wachstum verlangsamt sich'
  },
  'ALV': {
    branche: 'Insurance',
    durchschnittKGV: 11.0,
    medianKGV: 10.5,
    peers: ['AXA', 'ZURVY', 'HNR1.DE'],
    beschreibung: 'Solide Dividendenrendite, defensive Qualität'
  },
  'MUV2': {
    branche: 'Reinsurance',
    durchschnittKGV: 12.0,
    medianKGV: 11.5,
    peers: ['RNR', 'RE', 'BRLN.AS'],
    beschreibung: 'Rückversicherung Premium-Player, stabile Cashflows'
  },
  'MSFT': {
    branche: 'Big Tech',
    durchschnittKGV: 28.0,
    medianKGV: 27.0,
    peers: ['AAPL', 'GOOGL', 'AMZN', 'META'],
    beschreibung: 'KI-Wachstum treibt Bewertung, aber noch fair'
  },
  'GOLD': {
    branche: 'Gold Mining',
    durchschnittKGV: 14.0,
    medianKGV: 13.5,
    peers: ['NEM', 'AEM', 'WPM', 'KL'],
    beschreibung: 'Goldpreis-abhängig, stabile Dividende'
  },
  'BYD6.DE': {
    branche: 'EV Manufacturing',
    durchschnittKGV: 18.0,
    medianKGV: 15.0,
    peers: ['TSLA', 'LI', 'NIO', 'XPEV'],
    beschreibung: 'Chinesischer Markt unter Druck, aber technologisch führend'
  },
  'NOVO-B.CO': {
    branche: 'Pharma (Diabetes/Obesity)',
    durchschnittKGV: 22.0,
    medianKGV: 20.0,
    peers: ['LLY', 'PFE', 'NVS', 'AZN'],
    beschreibung: 'Wegovy-Hype vorbei, aber Ozempic weiter stark'
  },
};

// Benchmark-Indizes für ETF-Vergleich
export const ETF_BENCHMARKS = {
  'VHYD': { benchmark: 'VWRL', name: 'Vanguard FTSE All-World' },
  'IGLN.L': { benchmark: 'GC=F', name: 'Gold Futures' },
  'NATO': { benchmark: 'XAR', name: 'Aerospace & Defense ETF' },
  'XDWC': { benchmark: 'XLE', name: 'Energy Select SPDR' },
  'XAI': { benchmark: 'BOTZ', name: 'Global X Robotics & AI' },
  'AMEM': { benchmark: 'EEM', name: 'iShares EM ETF' },
  'COMO': { benchmark: 'DBC', name: 'Invesco Commodity Index' },
};

// Historische KGVs für Trend-Analyse (5 Jahre)
export const HISTORISCHE_KGV = {
  'SAP': { '2021': 32, '2022': 28, '2023': 30, '2024': 26, '2025': 23, '2026': 22.5 },
  'ALV': { '2021': 12, '2022': 11, '2023': 10, '2024': 11, '2025': 11, '2026': 10.2 },
  'MUV2': { '2021': 14, '2022': 13, '2023': 12, '2024': 12, '2025': 12, '2026': 11.8 },
  'MSFT': { '2021': 35, '2022': 28, '2023': 32, '2024': 34, '2025': 30, '2026': 28.5 },
  'GOLD': { '2021': 16, '2022': 18, '2023': 17, '2024': 16, '2025': 15, '2026': 14.2 },
  'BYD6.DE': { '2021': 85, '2022': 65, '2023': 45, '2024': 25, '2025': 22, '2026': 18.5 },
  'NOVO-B.CO': { '2021': 28, '2022': 35, '2023': 42, '2024': 38, '2025': 30, '2026': 24.0 },
};
