export type StrategyType = 'dividende' | 'wachstum' | 'value' | 'etf' | 'anleihe' | 'rohstoff' | 'absicherung';
export type AssetCategory = 'aktie' | 'etf' | 'etp' | 'anleihe' | 'rohstoff' | 'cash';

export const STRATEGY_CONFIG: Record<StrategyType, { label: string; color: string; description: string; targetPercent: number }> = {
  dividende: {
    label: 'Dividende',
    color: '#22c55e',
    description: 'Regelmäßige Ausschüttungen, stabile Erträge',
    targetPercent: 30,
  },
  wachstum: {
    label: 'Wachstum',
    color: '#60B5FF',
    description: 'Hohe Wachstumsraten, Kursgewinne',
    targetPercent: 25,
  },
  value: {
    label: 'Value',
    color: '#f0b90b',
    description: 'Unterbewertete Substanzwerte',
    targetPercent: 20,
  },
  etf: {
    label: 'ETF',
    color: '#a78bfa',
    description: 'Breite Diversifikation, passiv',
    targetPercent: 15,
  },
  anleihe: {
    label: 'Anleihe',
    color: '#94a3b8',
    description: 'Sichere Zinserträge, Kapitalerhalt',
    targetPercent: 5,
  },
  rohstoff: {
    label: 'Rohstoff',
    color: '#fb923c',
    description: 'Inflationsschutz, Sachwerte',
    targetPercent: 5,
  },
  absicherung: {
    label: 'Absicherung',
    color: '#64748b',
    description: 'Hedging und Risikominimierung',
    targetPercent: 0,
  },
};

export const CATEGORY_LABELS: Record<AssetCategory, string> = {
  aktie: 'Aktie',
  etf: 'ETF',
  etp: 'ETP',
  anleihe: 'Anleihe',
  rohstoff: 'Rohstoff',
  cash: 'Cash',
};
