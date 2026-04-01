// Depot-Analyse - Sektoren, Länder, Balance

export interface SektorVerteilung {
  sektor: string;
  wert: number;
  prozent: number;
  farbe: string;
}

export interface LaenderVerteilung {
  land: string;
  wert: number;
  prozent: number;
  farbe: string;
}

export interface BalanceCheck {
  kategorie: string;
  ziel: number;
  ist: number;
  differenz: number;
  status: 'optimal' | 'ok' | 'warning' | 'critical';
}

// Sektoren-Verteilung basierend auf aktuellen Positionen
export const sektorenDaten: SektorVerteilung[] = [
  { sektor: 'ETF - Energie', wert: 977.10, prozent: 11.64, farbe: '#60B5FF' },
  { sektor: 'ETF - Gold', wert: 1130.70, prozent: 13.48, farbe: '#FFD700' },
  { sektor: 'ETF - Dividenden', wert: 554.69, prozent: 6.61, farbe: '#22c55e' },
  { sektor: 'ETF - KI/Tech', wert: 660.65, prozent: 7.88, farbe: '#a855f7' },
  { sektor: 'ETF - Rüstung', wert: 495.26, prozent: 5.90, farbe: '#ef4444' },
  { sektor: 'ETF - Rohstoffe', wert: 466.44, prozent: 5.56, farbe: '#f97316' },
  { sektor: 'ETF - EM/Divers', wert: 713.91, prozent: 8.51, farbe: '#14b8a6' },
  { sektor: 'Aktien - Tech', wert: 803.76, prozent: 9.58, farbe: '#3b82f6' },
  { sektor: 'Aktien - Pharma', wert: 654.68, prozent: 7.80, farbe: '#ec4899' },
  { sektor: 'Aktien - Automotive', wert: 464.40, prozent: 5.54, farbe: '#8b5cf6' },
  { sektor: 'Aktien - Versicherung', wert: 867.80, prozent: 10.35, farbe: '#06b6d4' },
  { sektor: 'Aktien - Mining', wert: 467.60, prozent: 5.57, farbe: '#f59e0b' },
  { sektor: 'Aktien - Software', wert: 354.40, prozent: 4.22, farbe: '#6366f1' },
  { sektor: 'Anleihen', wert: 131.52, prozent: 1.57, farbe: '#64748b' },
];

// Länder-Verteilung
export const laenderDaten: LaenderVerteilung[] = [
  { land: 'Deutschland', wert: 1622.20, prozent: 19.34, farbe: '#ef4444' },      // SAP, Allianz, Munich Re
  { land: 'USA', wert: 449.36, prozent: 5.36, farbe: '#3b82f6' },                  // Microsoft
  { land: 'China', wert: 464.40, prozent: 5.54, farbe: '#f59e0b' },               // BYD
  { land: 'Kanada', wert: 467.60, prozent: 5.57, farbe: '#ef4444' },              // Barrick
  { land: 'Dänemark', wert: 654.68, prozent: 7.80, farbe: '#dc2626' },            // Novo Nordisk
  { land: 'Irland (ETFs)', wert: 2706.49, prozent: 32.27, farbe: '#16a34a' },      // iShares Gold, DAX Short, AI, Commodities, Energy
  { land: 'UK (ETFs)', wert: 1049.95, prozent: 12.52, farbe: '#1d4ed8' },          // Defence, Vanguard
  { land: 'Luxemburg (ETFs)', wert: 262.11, prozent: 3.12, farbe: '#2563eb' },     // Amundi EM
  { land: 'Lettland', wert: 131.52, prozent: 1.57, farbe: '#dc2626' },             // Air Baltic
  { land: 'Global/World ETFs', wert: 1572.25, prozent: 18.75, farbe: '#22c55e' }, // World Energy, Vanguard, etc.
];

// 1/3 Balance Check
export const balanceCheck: BalanceCheck[] = [
  {
    kategorie: 'Performance (Tech/KI/E-Mobilität)',
    ziel: 33.33,
    ist: 33.26,
    differenz: -0.07,
    status: 'optimal'
  },
  {
    kategorie: 'Dividenden/Defensiv (ETFs/Versicherung)',
    ziel: 33.33,
    ist: 37.84,
    differenz: +4.51,
    status: 'ok'
  },
  {
    kategorie: 'Absicherung (Gold/Anleihen/Diversifikation)',
    ziel: 33.33,
    ist: 28.90,
    differenz: -4.43,
    status: 'warning'
  }
];

// Zusammenfassung
export const VERTEILUNG_ZUSAMMENFASSUNG = {
  sektoren: {
    anzahl: 14,
    top3: ['ETF - Gold (13.5%)', 'Deutschland (19.3%)', 'Irland ETFs (32.3%)']
  },
  laender: {
    anzahl: 10,
    top3: ['Irland ETFs (32.3%)', 'Deutschland (19.3%)', 'Global ETFs (18.8%)']
  },
  balance: {
    status: 'Gut',
    empfehlung: 'Absicherung leicht erhöhen (Gold/Anleihen)'
  }
};

// Rebalance Empfehlungen
export const rebalanceEmpfehlungen = [
  {
    typ: 'warning',
    titel: 'Absicherung zu niedrig',
    beschreibung: 'Die Absicherung liegt bei 28,9% statt 33,3%. Erwäge Nachkauf von Gold oder defensive ETFs.',
    prioritaet: 'mittel'
  },
  {
    typ: 'info',
    titel: 'Dividenden/Defensiv leicht übergewichtet',
    beschreibung: '37,8% statt 33,3% - passt noch im Rahmen, aber beobachten.',
    prioritaet: 'niedrig'
  },
  {
    typ: 'success',
    titel: 'Performance-Block optimal',
    beschreibung: '33,3% Performance-Aktien - perfekt balanciert!',
    prioritaet: 'keine'
  }
];
