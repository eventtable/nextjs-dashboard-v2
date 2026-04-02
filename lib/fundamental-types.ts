export type KennzahlStatus = 'gut' | 'mittel' | 'schlecht' | 'neutral';

export interface KennzahlBewertung {
  label?: string;
  formatted?: string;
  einheit?: string;
  hilfetext?: string;
  value?: number | null;
  wert?: number | null;
  wertFormatiert?: string;
  status: KennzahlStatus;
  beschreibung?: string;
  benchmark?: string;
}

export interface TabBewertung {
  gesamtScore: number;
  maxPunkte: number;
  durchschnittsPunkte: number;
  totalKennzahlen: number;
  gut: number;
  mittel: number;
  schlecht: number;
  rating: 'GUT' | 'MITTEL' | 'SCHLECHT';
  farbe: string;
  empfehlung: string;
  score: number;
  // legacy fields
  tab?: string;
  status?: KennzahlStatus;
  kennzahlen?: Record<string, KennzahlBewertung>;
}

export interface GesamtBewertung {
  gesamtScore: number;
  maxPunkte: number;
  durchschnittsPunkte: number;
  totalKennzahlen: number;
  gut: number;
  mittel: number;
  schlecht: number;
  rating?: 'GUT' | 'MITTEL' | 'SCHLECHT';
  farbe: string;
  empfehlung: 'STARK' | 'SOLIDE' | 'SCHWACH';
  // legacy fields
  score?: number;
  status?: KennzahlStatus;
  label?: string;
  tabs?: TabBewertung[];
}

export interface BewertungsKennzahlen {
  pegRatio: number | null;
  evEbitda: number | null;
  priceToBook: number | null;
  priceToSales: number | null;
  evToSales: number | null;
  epsTrailing: number | null;
  epsForward: number | null;
  enterpriseValue: number | null;
}

export interface ProfitabilitaetsKennzahlen {
  ebitdaMargin: number | null;
  grossMargin: number | null;
  operatingMargin: number | null;
  netMargin?: number | null;
  returnOnEquity?: number | null;
  returnOnAssets?: number | null;
  revenueGrowth?: number | null;
  earningsGrowth: number | null;
}

export interface BilanzKennzahlen {
  currentRatio: number | null;
  quickRatio: number | null;
  netCash: number | null;
  shortRatio: number | null;
  perf52W: number | null;
  debtToEquity?: number | null;
  debtToEbitda?: number | null;
  interestCoverage?: number | null;
  freeCashflowYield?: number | null;
  freeCashflowMargin?: number | null;
}

export interface FundamentalData {
  bewertung: BewertungsKennzahlen;
  profitabilitaet: ProfitabilitaetsKennzahlen;
  bilanz: BilanzKennzahlen;
  sektor?: string;
  land?: string;
  boerse?: string;
}
