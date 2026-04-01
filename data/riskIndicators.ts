// Makro-Risiko-Indikatoren und Schwellenwerte
// Bank-Style Risk Management Thresholds

export interface RiskIndicator {
  id: string;
  name: string;
  description: string;
  currentValue: number;
  previousValue: number;
  unit: string;
  thresholds: {
    low: number;      // Grün - Normal
    medium: number;   // Gelb - Beachten
    high: number;     // Orange - Warnung
    severe: number;   // Rot - Kritisch
  };
  trend: 'up' | 'down' | 'stable';
  trendDescription: string;
  source: string;
  lastUpdated: string;
  category: 'volatility' | 'yield' | 'credit' | 'economic' | 'sentiment';
}

// Aktuelle Marktdaten (Mock - sollten täglich aktualisiert werden)
export const riskIndicators: RiskIndicator[] = [
  {
    id: 'vix',
    name: 'VIX Index',
    description: 'Volatilitätsindex der S&P 500 Optionen. Misst Marktunsicherheit und Angst.',
    currentValue: 18.5,
    previousValue: 17.2,
    unit: 'Punkte',
    thresholds: {
      low: 15,
      medium: 20,
      high: 30,
      severe: 40
    },
    trend: 'up',
    trendDescription: '+7.6% vs Vortag',
    source: 'CBOE',
    lastUpdated: '2026-03-27',
    category: 'volatility'
  },
  {
    id: 'gvz',
    name: 'GVZ (Gold VIX)',
    description: 'Gold-Volatilität. Hohe Werte signalisieren Unsicherheit bei Gold.',
    currentValue: 16.2,
    previousValue: 15.8,
    unit: 'Punkte',
    thresholds: {
      low: 15,
      medium: 20,
      high: 25,
      severe: 35
    },
    trend: 'stable',
    trendDescription: '+2.5% vs Vortag',
    source: 'CBOE',
    lastUpdated: '2026-03-27',
    category: 'volatility'
  },
  {
    id: 'yield-curve-10y-2y',
    name: 'Yield Curve (10Y-2Y)',
    description: 'Differenz zwischen 10- und 2-jährigen US-Treasury-Renditen. Negativ = Inversions-Warnung.',
    currentValue: -0.12,
    previousValue: -0.08,
    unit: '%',
    thresholds: {
      low: 0.5,
      medium: 0,
      high: -0.25,
      severe: -0.5
    },
    trend: 'down',
    trendDescription: 'Stärkere Inversion',
    source: 'US Treasury',
    lastUpdated: '2026-03-27',
    category: 'yield'
  },
  {
    id: 'credit-spread-bbb',
    name: 'Credit Spread (BBB vs 10Y)',
    description: 'Renditeaufschlag für BBB-Rated Unternehmensanleihen. Misst Kreditrisiko.',
    currentValue: 145,
    previousValue: 138,
    unit: 'bp',
    thresholds: {
      low: 100,
      medium: 150,
      high: 250,
      severe: 400
    },
    trend: 'up',
    trendDescription: '+5.1% vs Vortag',
    source: 'ICE BofA',
    lastUpdated: '2026-03-27',
    category: 'credit'
  },
  {
    id: 'hy-spread',
    name: 'High Yield Spread',
    description: 'Renditeaufschlag für High-Yield (Junk) Bonds. Risikoappetit im Kreditmarkt.',
    currentValue: 320,
    previousValue: 295,
    unit: 'bp',
    thresholds: {
      low: 300,
      medium: 400,
      high: 600,
      severe: 900
    },
    trend: 'up',
    trendDescription: '+8.5% vs Vortag',
    source: 'ICE BofA',
    lastUpdated: '2026-03-27',
    category: 'credit'
  },
  {
    id: 'dxy',
    name: 'US Dollar Index (DXY)',
    description: 'Stärke des US-Dollar gegenüber anderen Währungen. Hoher DXY belastet EM.',
    currentValue: 103.2,
    previousValue: 104.1,
    unit: 'Punkte',
    thresholds: {
      low: 95,
      medium: 100,
      high: 110,
      severe: 115
    },
    trend: 'down',
    trendDescription: '-0.9% vs Vortag',
    source: 'ICE',
    lastUpdated: '2026-03-27',
    category: 'sentiment'
  },
  {
    id: 'pmi-eu',
    name: 'EU Manufacturing PMI',
    description: 'Einkaufsmanagerindex für die EU-Fertigung. <50 = Kontraktion.',
    currentValue: 46.8,
    previousValue: 47.2,
    unit: 'Punkte',
    thresholds: {
      low: 55,
      medium: 50,
      high: 47,
      severe: 45
    },
    trend: 'down',
    trendDescription: '-0.9% vs Vortag',
    source: 'S&P Global',
    lastUpdated: '2026-03-27',
    category: 'economic'
  },
  {
    id: 'pmi-us',
    name: 'US Manufacturing PMI',
    description: 'Einkaufsmanagerindex für die US-Fertigung. Frühindikator für Konjunktur.',
    currentValue: 51.2,
    previousValue: 50.8,
    unit: 'Punkte',
    thresholds: {
      low: 55,
      medium: 50,
      high: 47,
      severe: 45
    },
    trend: 'up',
    trendDescription: '+0.8% vs Vortag',
    source: 'S&P Global',
    lastUpdated: '2026-03-27',
    category: 'economic'
  },
  {
    id: 'ted-spread',
    name: 'TED Spread',
    description: 'Differenz zwischen 3-Monats-LIBOR und T-Bills. Banken-Stress-Indikator.',
    currentValue: 18,
    previousValue: 16,
    unit: 'bp',
    thresholds: {
      low: 20,
      medium: 30,
      high: 50,
      severe: 100
    },
    trend: 'up',
    trendDescription: '+12.5% vs Vortag',
    source: 'Bloomberg',
    lastUpdated: '2026-03-27',
    category: 'credit'
  },
  {
    id: 'fear-greed',
    name: 'Fear & Greed Index',
    description: 'CNN Sentiment-Indikator. 0=Extreme Fear, 100=Extreme Greed.',
    currentValue: 58,
    previousValue: 62,
    unit: 'Punkte',
    thresholds: {
      low: 75,      // Umgekehrt: <25 = Fear
      medium: 50,
      high: 25,
      severe: 15
    },
    trend: 'down',
    trendDescription: 'Greed → Neutral',
    source: 'CNN',
    lastUpdated: '2026-03-27',
    category: 'sentiment'
  }
];

// Risiko-Level bestimmen
export const getRiskLevel = (indicator: RiskIndicator): 'low' | 'medium' | 'high' | 'severe' => {
  const value = indicator.currentValue;
  const { thresholds } = indicator;
  
  // Für Fear & Greed (umgekehrt)
  if (indicator.id === 'fear-greed') {
    if (value <= thresholds.severe) return 'severe';
    if (value <= thresholds.high) return 'high';
    if (value <= thresholds.medium) return 'medium';
    return 'low';
  }
  
  // Für Yield Curve (negativ ist schlecht)
  if (indicator.id === 'yield-curve-10y-2y') {
    if (value <= thresholds.severe) return 'severe';
    if (value <= thresholds.high) return 'high';
    if (value <= thresholds.medium) return 'medium';
    return 'low';
  }
  
  // Standard-Logik
  if (value >= thresholds.severe) return 'severe';
  if (value >= thresholds.high) return 'high';
  if (value >= thresholds.medium) return 'medium';
  return 'low';
};

// Risiko-Farben
export const riskLevelColors = {
  low: { 
    color: '#22c55e', 
    bg: 'bg-green-500/20', 
    border: 'border-green-500/30',
    text: 'text-green-400',
    label: 'Normal'
  },
  medium: { 
    color: '#eab308', 
    bg: 'bg-yellow-500/20', 
    border: 'border-yellow-500/30',
    text: 'text-yellow-400',
    label: 'Beobachten'
  },
  high: { 
    color: '#f97316', 
    bg: 'bg-orange-500/20', 
    border: 'border-orange-500/30',
    text: 'text-orange-400',
    label: 'Warnung'
  },
  severe: { 
    color: '#ef4444', 
    bg: 'bg-red-500/20', 
    border: 'border-red-500/30',
    text: 'text-red-400',
    label: 'Kritisch'
  }
};

// Composite Risk Score
export const calculateCompositeRisk = (indicators: RiskIndicator[]): {
  score: number;
  level: 'low' | 'medium' | 'high' | 'severe';
  description: string;
} => {
  const levels = indicators.map(getRiskLevel);
  const levelScores = { low: 1, medium: 2, high: 3, severe: 4 };
  const totalScore = levels.reduce((sum, level) => sum + levelScores[level], 0);
  const avgScore = totalScore / indicators.length;
  
  let level: 'low' | 'medium' | 'high' | 'severe' = 'low';
  let description = '';
  
  if (avgScore >= 3.5) {
    level = 'severe';
    description = 'Kritisches Risikoniveau - Defensive Positionierung empfohlen';
  } else if (avgScore >= 2.5) {
    level = 'high';
    description = 'Erhöhtes Risiko - Vorsichtige Vorgehensweise';
  } else if (avgScore >= 1.5) {
    level = 'medium';
    description = 'Mäßiges Risiko - Normale Vorsicht';
  } else {
    level = 'low';
    description = 'Niedriges Risiko - Günstiges Umfeld';
  }
  
  return {
    score: avgScore,
    level,
    description
  };
};

// Early Warning Signals
export const getEarlyWarnings = (indicators: RiskIndicator[]): string[] => {
  const warnings: string[] = [];
  
  indicators.forEach(ind => {
    const level = getRiskLevel(ind);
    const prevLevel = getRiskLevel({ ...ind, currentValue: ind.previousValue });
    
    if (level !== 'low' && prevLevel === 'low') {
      warnings.push(`${ind.name}: Risiko-Level gestiegen zu "${riskLevelColors[level].label}"`);
    }
    
    if (level === 'severe') {
      warnings.push(`${ind.name}: Kritischer Wert erreicht (${ind.currentValue}${ind.unit})`);
    }
    
    // Spezifische Warnungen
    if (ind.id === 'yield-curve-10y-2y' && ind.currentValue < -0.25) {
      warnings.push('⚠️ Starke Yield-Curve-Inversion - Historischer Rezessions-Indikator');
    }
    
    if (ind.id === 'credit-spread-bbb' && ind.currentValue > 200) {
      warnings.push('⚠️ Credit Spreads weiten sich aus - Kreditrisiko steigt');
    }
    
    if (ind.id === 'vix' && ind.currentValue > 25) {
      warnings.push('⚠️ VIX über 25 - Erhöhte Marktvolatilität');
    }
  });
  
  return warnings;
};
