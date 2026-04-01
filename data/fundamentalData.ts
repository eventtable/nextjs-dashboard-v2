import {
  BewertungsKennzahlen,
  ProfitabilitaetsKennzahlen,
  BilanzKennzahlen,
  FundamentalData,
  KennzahlBewertung,
  KennzahlStatus,
  TabBewertung,
  GesamtBewertung
} from '@/lib/fundamental-types';

// Hardcoded Daten für Demo - kann später durch API ersetzt werden
// Realistische Beispieldaten basierend auf echten Marktdaten

const FUNDAMENTAL_DATABASE: Record<string, FundamentalData> = {
  // NVIDIA
  'NVDA': {
    bewertung: {
      pegRatio: 1.2,
      evEbitda: 38.5,
      priceToBook: 18.2,
      priceToSales: 26.8,
      evToSales: 27.2,
      epsTrailing: 2.94,
      epsForward: 4.12,
      enterpriseValue: 3200000000000
    },
    profitabilitaet: {
      ebitdaMargin: 62.5,
      grossMargin: 74.2,
      operatingMargin: 58.3,
      earningsGrowth: 145.2
    },
    bilanz: {
      currentRatio: 3.2,
      quickRatio: 2.8,
      netCash: 12500000000,
      shortRatio: 1.2,
      perf52W: 82.5
    }
  },
  // Apple
  'AAPL': {
    bewertung: {
      pegRatio: 2.8,
      evEbitda: 18.5,
      priceToBook: 32.4,
      priceToSales: 7.8,
      evToSales: 8.1,
      epsTrailing: 6.75,
      epsForward: 7.42,
      enterpriseValue: 3200000000000
    },
    profitabilitaet: {
      ebitdaMargin: 32.1,
      grossMargin: 45.8,
      operatingMargin: 30.2,
      earningsGrowth: 8.5
    },
    bilanz: {
      currentRatio: 1.8,
      quickRatio: 1.5,
      netCash: -45000000000, // Negativ = mehr Schulden als Cash
      shortRatio: 1.8,
      perf52W: 12.3
    }
  },
  // Microsoft
  'MSFT': {
    bewertung: {
      pegRatio: 2.1,
      evEbitda: 22.3,
      priceToBook: 12.8,
      priceToSales: 11.2,
      evToSales: 11.5,
      epsTrailing: 11.80,
      epsForward: 13.45,
      enterpriseValue: 3100000000000
    },
    profitabilitaet: {
      ebitdaMargin: 48.5,
      grossMargin: 69.2,
      operatingMargin: 44.1,
      earningsGrowth: 18.2
    },
    bilanz: {
      currentRatio: 1.9,
      quickRatio: 1.6,
      netCash: 48000000000,
      shortRatio: 1.5,
      perf52W: 8.7
    }
  },
  // Tesla
  'TSLA': {
    bewertung: {
      pegRatio: 4.5,
      evEbitda: 28.2,
      priceToBook: 8.2,
      priceToSales: 6.8,
      evToSales: 7.2,
      epsTrailing: 3.85,
      epsForward: 4.25,
      enterpriseValue: 780000000000
    },
    profitabilitaet: {
      ebitdaMargin: 12.5,
      grossMargin: 17.8,
      operatingMargin: 6.2,
      earningsGrowth: -15.2
    },
    bilanz: {
      currentRatio: 1.4,
      quickRatio: 0.9,
      netCash: -5200000000,
      shortRatio: 2.8,
      perf52W: -42.5
    }
  },
  // Meta
  'META': {
    bewertung: {
      pegRatio: 1.1,
      evEbitda: 14.2,
      priceToBook: 6.8,
      priceToSales: 8.5,
      evToSales: 8.8,
      epsTrailing: 19.75,
      epsForward: 23.45,
      enterpriseValue: 1250000000000
    },
    profitabilitaet: {
      ebitdaMargin: 52.8,
      grossMargin: 80.2,
      operatingMargin: 41.5,
      earningsGrowth: 65.2
    },
    bilanz: {
      currentRatio: 2.8,
      quickRatio: 2.5,
      netCash: 48000000000,
      shortRatio: 0.8,
      perf52W: 45.2
    }
  },
  // Alphabet/Google
  'GOOGL': {
    bewertung: {
      pegRatio: 1.3,
      evEbitda: 12.8,
      priceToBook: 5.2,
      priceToSales: 5.8,
      evToSales: 6.1,
      epsTrailing: 6.85,
      epsForward: 8.42,
      enterpriseValue: 2100000000000
    },
    profitabilitaet: {
      ebitdaMargin: 38.2,
      grossMargin: 56.8,
      operatingMargin: 28.5,
      earningsGrowth: 28.5
    },
    bilanz: {
      currentRatio: 2.2,
      quickRatio: 1.9,
      netCash: 95000000000,
      shortRatio: 1.1,
      perf52W: 18.5
    }
  },
  // Amazon
  'AMZN': {
    bewertung: {
      pegRatio: 1.8,
      evEbitda: 18.5,
      priceToBook: 7.2,
      priceToSales: 2.8,
      evToSales: 3.1,
      epsTrailing: 4.15,
      epsForward: 5.82,
      enterpriseValue: 1850000000000
    },
    profitabilitaet: {
      ebitdaMargin: 18.2,
      grossMargin: 32.5,
      operatingMargin: 8.2,
      earningsGrowth: 185.2
    },
    bilanz: {
      currentRatio: 1.6,
      quickRatio: 1.2,
      netCash: -42000000000,
      shortRatio: 1.4,
      perf52W: 32.5
    }
  },
  // AMD
  'AMD': {
    bewertung: {
      pegRatio: 1.5,
      evEbitda: 25.2,
      priceToBook: 4.2,
      priceToSales: 8.5,
      evToSales: 8.8,
      epsTrailing: 2.45,
      epsForward: 3.85,
      enterpriseValue: 280000000000
    },
    profitabilitaet: {
      ebitdaMargin: 22.5,
      grossMargin: 45.2,
      operatingMargin: 12.8,
      earningsGrowth: 42.5
    },
    bilanz: {
      currentRatio: 2.5,
      quickRatio: 2.1,
      netCash: 2800000000,
      shortRatio: 2.2,
      perf52W: -8.5
    }
  },
  // Netflix
  'NFLX': {
    bewertung: {
      pegRatio: 1.4,
      evEbitda: 8.2,
      priceToBook: 12.5,
      priceToSales: 6.8,
      evToSales: 7.2,
      epsTrailing: 18.42,
      epsForward: 24.85,
      enterpriseValue: 320000000000
    },
    profitabilitaet: {
      ebitdaMargin: 22.8,
      grossMargin: 42.5,
      operatingMargin: 22.1,
      earningsGrowth: 32.5
    },
    bilanz: {
      currentRatio: 1.4,
      quickRatio: 1.1,
      netCash: 6500000000,
      shortRatio: 2.5,
      perf52W: 65.2
    }
  },
  // Salesforce
  'CRM': {
    bewertung: {
      pegRatio: 1.8,
      evEbitda: 18.5,
      priceToBook: 3.2,
      priceToSales: 7.8,
      evToSales: 8.1,
      epsTrailing: 6.85,
      epsForward: 10.42,
      enterpriseValue: 320000000000
    },
    profitabilitaet: {
      ebitdaMargin: 28.5,
      grossMargin: 72.5,
      operatingMargin: 18.2,
      earningsGrowth: 22.5
    },
    bilanz: {
      currentRatio: 1.2,
      quickRatio: 1.1,
      netCash: -2800000000,
      shortRatio: 1.8,
      perf52W: -12.5
    }
  }
};

// Fallback-Daten für unbekannte Tickers
const FALLBACK_DATA: FundamentalData = {
  bewertung: {
    pegRatio: 1.8,
    evEbitda: 15.5,
    priceToBook: 3.2,
    priceToSales: 4.8,
    evToSales: 5.2,
    epsTrailing: 5.25,
    epsForward: 6.15,
    enterpriseValue: 150000000000
  },
  profitabilitaet: {
    ebitdaMargin: 25.5,
    grossMargin: 42.8,
    operatingMargin: 18.2,
    earningsGrowth: 12.5
  },
  bilanz: {
    currentRatio: 2.1,
    quickRatio: 1.8,
    netCash: 15000000000,
    shortRatio: 1.5,
    perf52W: 5.2
  }
};

// ============ BEWERTUNGS-LOGIK ============

export function bewerteKennzahl(
  value: number | null,
  key: string
): KennzahlStatus {
  if (value === null || value === undefined) return 'neutral';

  switch (key) {
    // === TAB 1: BEWERTUNG ===
    case 'pegRatio':
      if (value < 1) return 'gut';
      if (value <= 2) return 'mittel';
      return 'schlecht';
    
    case 'evEbitda':
      if (value < 10) return 'gut';
      if (value <= 15) return 'mittel';
      return 'schlecht';
    
    case 'priceToBook':
      if (value < 1) return 'gut';
      if (value <= 3) return 'mittel';
      return 'schlecht';
    
    case 'priceToSales':
      if (value < 1) return 'gut';
      if (value <= 5) return 'mittel';
      return 'schlecht';
    
    case 'evToSales':
      if (value < 1) return 'gut';
      if (value <= 3) return 'mittel';
      return 'schlecht';
    
    case 'epsForward':
      // EPS Growth implizit
      if (value === null) return 'neutral';
      const epsGrowth = value; // Simplifiziert
      if (epsGrowth > 20) return 'gut';
      if (epsGrowth >= 5) return 'mittel';
      return 'schlecht';
    
    // === TAB 2: PROFITABILITÄT ===
    case 'ebitdaMargin':
      if (value > 20) return 'gut';
      if (value >= 10) return 'mittel';
      return 'schlecht';
    
    case 'grossMargin':
      if (value > 40) return 'gut';
      if (value >= 20) return 'mittel';
      return 'schlecht';
    
    case 'operatingMargin':
      if (value > 15) return 'gut';
      if (value >= 5) return 'mittel';
      return 'schlecht';
    
    case 'earningsGrowth':
      if (value > 15) return 'gut';
      if (value >= 5) return 'mittel';
      return 'schlecht';
    
    // === TAB 3: BILANZSTÄRKE ===
    case 'currentRatio':
      if (value > 2) return 'gut';
      if (value >= 1.5) return 'mittel';
      return 'schlecht';
    
    case 'quickRatio':
      if (value > 1.5) return 'gut';
      if (value >= 1) return 'mittel';
      return 'schlecht';
    
    case 'netCash':
      if (value > 0) return 'gut';
      if (value > -10000000000) return 'mittel'; // > -10 Mrd
      return 'schlecht';
    
    case 'shortRatio':
      if (value < 2) return 'gut';
      if (value <= 5) return 'mittel';
      return 'schlecht';
    
    case 'perf52W':
      // Relativ zum Markt (Markt = ~10%)
      if (value > 15) return 'gut';
      if (value >= -5) return 'mittel';
      return 'schlecht';
    
    default:
      return 'neutral';
  }
}

// Zähle Status für einen Tab
export function berechneTabBewertung(kennzahlen: KennzahlBewertung[]): TabBewertung {
  const total = kennzahlen.length;
  const gut = kennzahlen.filter(k => k.status === 'gut').length;
  const mittel = kennzahlen.filter(k => k.status === 'mittel').length;
  const schlecht = kennzahlen.filter(k => k.status === 'schlecht').length;
  const neutral = kennzahlen.filter(k => k.status === 'neutral').length;
  
  // Berechne Punkte
  const punkteGut = gut * 2;      // Gut = 2 Punkte
  const punkteMittel = mittel * 1; // Mittel = 1 Punkt
  const punkteSchlecht = schlecht * 0; // Schlecht = 0 Punkte
  const gesamtPunkte = punkteGut + punkteMittel + punkteSchlecht;
  const maxPunkte = (total - neutral) * 2; // Maximum = alle Gut
  
  // Score 0-2.0 Skala
  const score = maxPunkte > 0 ? (gesamtPunkte / maxPunkte) * 2 : 0;
  
  // Durchschnittspunkte pro Kennzahl (0-2.0)
  const durchschnittsPunkte = (total - neutral) > 0 ? gesamtPunkte / (total - neutral) : 0;
  
  let rating: 'GUT' | 'MITTEL' | 'SCHLECHT';
  let farbe: string;
  let empfehlung: string;
  
  // Bewertung basierend auf Durchschnittspunkten pro Kennzahl
  if (durchschnittsPunkte >= 1.5) {
    rating = 'GUT';
    farbe = '#22c55e';
    empfehlung = 'KAUFEN';
  } else if (durchschnittsPunkte >= 0.8) {
    rating = 'MITTEL';
    farbe = '#eab308';
    empfehlung = 'HALTEN';
  } else {
    rating = 'SCHLECHT';
    farbe = '#ef4444';
    empfehlung = 'VERKAUFEN';
  }
  
  return {
    gesamtScore: gesamtPunkte,  // Tatsächliche Punkte (z.B. 13)
    maxPunkte,                  // Maximale Punkte (z.B. 30)
    durchschnittsPunkte,        // Durchschnitt 0-2.0
    totalKennzahlen: total - neutral,
    gut,
    mittel,
    schlecht,
    rating,
    farbe,
    empfehlung,
    score
  };
}

// Berechne Gesamtbewertung über alle Tabs
export function berechneGesamtBewertung(
  bewertung: TabBewertung,
  profitabilitaet: TabBewertung,
  bilanz: TabBewertung
): GesamtBewertung {
  const totalGut = bewertung.gut + profitabilitaet.gut + bilanz.gut;
  const totalMittel = bewertung.mittel + profitabilitaet.mittel + bilanz.mittel;
  const totalSchlecht = bewertung.schlecht + profitabilitaet.schlecht + bilanz.schlecht;
  const totalKennzahlen = totalGut + totalMittel + totalSchlecht;
  
  // Gesamtpunkte über alle Tabs
  const gesamtPunkte = bewertung.gesamtScore + profitabilitaet.gesamtScore + bilanz.gesamtScore;
  const maxPunkte = bewertung.maxPunkte + profitabilitaet.maxPunkte + bilanz.maxPunkte;
  
  // Durchschnitt über alle Tabs (gewichtet)
  const durchschnittsPunkte = totalKennzahlen > 0 ? gesamtPunkte / totalKennzahlen : 0;
  const scoreProzent = maxPunkte > 0 ? (gesamtPunkte / maxPunkte) * 100 : 0;
  
  // Legacy score (0-2.0)
  const gewichteterScore = (
    bewertung.durchschnittsPunkte * 0.4 + 
    profitabilitaet.durchschnittsPunkte * 0.35 + 
    bilanz.durchschnittsPunkte * 0.25
  );
  
  let rating: 'GUT' | 'MITTEL' | 'SCHLECHT';
  let farbe: string;
  let empfehlung: 'KAUFEN' | 'HALTEN' | 'VERKAUFEN';
  
  if (gewichteterScore >= 1.4) {
    rating = 'GUT';
    farbe = '#22c55e';
    empfehlung = 'KAUFEN';
  } else if (gewichteterScore >= 0.9) {
    rating = 'MITTEL';
    farbe = '#eab308';
    empfehlung = 'HALTEN';
  } else {
    rating = 'SCHLECHT';
    farbe = '#ef4444';
    empfehlung = 'VERKAUFEN';
  }
  
  return {
    gesamtScore: gesamtPunkte,
    maxPunkte,
    durchschnittsPunkte,
    totalKennzahlen,
    gut: totalGut,
    mittel: totalMittel,
    schlecht: totalSchlecht,
    rating,
    farbe,
    empfehlung,
    score: gewichteterScore
  };
}

// ============ HILFSFUNKTIONEN ============

export function formatWert(value: number | null, typ: 'number' | 'percent' | 'currency' | 'mult'): string {
  if (value === null || value === undefined) return 'N/A';
  
  switch (typ) {
    case 'percent':
      return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
    case 'currency':
      if (value >= 1e12) return `${(value / 1e12).toFixed(2)} Bio. $`;
      if (value >= 1e9) return `${(value / 1e9).toFixed(2)} Mrd. $`;
      if (value >= 1e6) return `${(value / 1e6).toFixed(2)} Mio. $`;
      return `${value.toFixed(0)} $`;
    case 'mult':
      return `${value.toFixed(2)}x`;
    default:
      return value.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}

export function getHilfetext(key: string): string {
  const hilfetexte: Record<string, string> = {
    pegRatio: '📊 PEG Ratio = KGV / Gewinnwachstum.\n\n🟢 < 1.0: Unterbewertet (günstig)\n🟡 1.0-2.0: Fair bewertet\n🔴 > 2.0: Überbewertet\n\nWichtiger als KGV allein, da Wachstum berücksichtigt.',
    
    evEbitda: '💰 EV/EBITDA = Enterprise Value / EBITDA\n\n🟢 < 10: Sehr günstig\n🟡 10-15: Fair\n🔴 > 15: Teuer\n\nBesser als KGV bei verschuldeten Firmen, da Schulden mit einbezogen.',
    
    priceToBook: '📖 Kurs-Buchwert (P/B) = Marktkapitalisierung / Buchwert\n\n🟢 < 1.0: Unter Substanzwert (Rabatt!)\n🟡 1.0-3.0: Normal\n🔴 > 3.0: Überbewertet\n\nBuchwert = Vermögen minus Schulden. Wichtig für Banken/Industrie.',
    
    priceToSales: '📈 Kurs-Umsatz (P/S) = Marktwert / Umsatz\n\n🟢 < 1.0: Extrem günstig\n🟡 1.0-5.0: Normal (Wachstum)\n🔴 > 10: Teuer\n\nWichtig für Wachstumsaktien ohne Gewinn (z.B. Tech-Startups).',
    
    evToSales: '💵 EV/Umsatz = Enterprise Value / Umsatz\n\n🟢 < 1.0: Sehr günstig\n🟡 1.0-3.0: Normal\n🔴 > 5.0: Hoch bewertet\n\nÄhnlich P/S, aber inkl. Schulden. Gut für Übernahmen.',
    
    epsTrailing: '💵 EPS (Trailing) = Earnings Per Share\nGewinn pro Aktie der letzten 12 Monate.\n\nZeigt die aktuelle Profitabilität. Höher = besser.',
    
    epsForward: '🔮 EPS (Forward) = Erwarteter Gewinn/Aktie\nAnalysten-Prognose für nächstes Jahr.\n\nWichtig für die Zukunftsbewertung. Wachstum = positiv.',
    
    enterpriseValue: '🏢 Enterprise Value (EV) = Marktwert + Schulden - Cash\n\nDer "echte" Unternehmenswert bei einer Übernahme.\nWichtiger als Marktkapitalisierung allein.',
    
    ebitdaMargin: '📊 EBITDA-Marge = EBITDA / Umsatz\n\n🟢 > 25%: Exzellent\n🟡 15-25%: Gut\n🔴 < 10%: Schwach\n\nZeigt operative Profitabilität vor Abschreibungen.',
    
    grossMargin: '💹 Bruttomarge = (Umsatz - Herstellkosten) / Umsatz\n\n🟢 > 40%: Stark (Software, Pharma)\n🟡 20-40%: Normal (Industrie)\n🔴 < 20%: Niedrig (Einzelhandel)\n\nZeigt Preissetzungsmacht.',
    
    operatingMargin: '⚙️ Operating Margin = Operating Income / Umsatz\n\n🟢 > 20%: Sehr effizient\n🟡 10-20%: Gut\n🔴 < 5%: Wenig profitabel\n\nZeigt betriebliche Effizienz nach allen Kosten.',
    
    earningsGrowth: '📈 Gewinnwachstum (YoY) = (Gewinn aktuell / Gewinn Vorjahr) - 1\n\n🟢 > 20%: Starkes Wachstum\n🟡 5-20%: Stabiles Wachstum\n🔴 < 5%: Wenig Wachstum\n\nWichtig für Wachstumsinvestoren.',
    
    currentRatio: '💧 Current Ratio = Umlaufvermögen / kurzfristige Schulden\n\n🟢 > 2.0: Sehr solvent\n🟡 1.5-2.0: Gesund\n🔴 < 1.0: Liquiditätsprobleme!\n\nZeigt ob alle kurzfristigen Verbindlichkeiten gedeckt sind.',
    
    quickRatio: '⚡ Quick Ratio = (Cash + Forderungen) / kurzfr. Schulden\n\n🟢 > 1.5: Sehr liquide\n🟡 1.0-1.5: Normal\n🔴 < 1.0: Enger\n\nStrengerer Test als Current Ratio (ohne Lager).',
    
    netCash: '💰 Netto-Cash = Gesamter Cash - Finanzschulden\n\n🟢 > 0: Netto-Cash-Position (schuldenfrei!)\n🟡 -10% bis 0: Managebar\n🔴 < -10%: Hoch verschuldet\n\nPositiv = finanzielle Stärke für Übernahmen/Dividenden.',
    
    shortRatio: '📉 Short Ratio = Tage bis Leerverkäufer decken müssen\n\n🟢 < 2: Normal\n🟡 2-5: Erhöht\n🔴 > 5: Sehr hoch (Short-Squeeze-Risiko!)\n\nHoher Wert kann zu plötzlichen Kursrallys führen.',
    
    perf52W: '📆 52-Wochen-Performance = Kursänderung über 1 Jahr\n\nZeigt den langfristigen Trend.\nVergleiche mit Index (DAX/S\u0026P 500).\n\n🟢 > +20%: Outperformance\n🟡 ±20%: Marktperformance\n🔴 < -20%: Underperformance'
  };
  return hilfetexte[key] || '';
}

export function getLabel(key: string): string {
  const labels: Record<string, string> = {
    pegRatio: 'PEG Ratio',
    evEbitda: 'EV/EBITDA',
    priceToBook: 'Kurs-Buchwert',
    priceToSales: 'Kurs-Umsatz',
    evToSales: 'EV/Umsatz',
    epsTrailing: 'EPS (Trailing)',
    epsForward: 'EPS (Forward)',
    enterpriseValue: 'Enterprise Value',
    ebitdaMargin: 'EBITDA-Marge',
    grossMargin: 'Bruttomarge',
    operatingMargin: 'Operating Margin',
    earningsGrowth: 'Gewinnwachstum',
    currentRatio: 'Current Ratio',
    quickRatio: 'Quick Ratio',
    netCash: 'Netto-Cash',
    shortRatio: 'Short Ratio',
    perf52W: '52W Performance'
  };
  return labels[key] || key;
}

// Hauptfunktion zum Abrufen der Fundamentaldaten
export function getFundamentalData(ticker: string): FundamentalData {
  const upperTicker = ticker.toUpperCase();
  return FUNDAMENTAL_DATABASE[upperTicker] || FALLBACK_DATA;
}

// Hilfsfunktion um eine einzelne Kennzahl zu bewerten
export function getKennzahlBewertung(
  key: string,
  value: number | null,
  kategorie: 'bewertung' | 'profitabilitaet' | 'bilanz'
): KennzahlBewertung {
  const formatMap: Record<string, 'number' | 'percent' | 'currency' | 'mult'> = {
    pegRatio: 'mult',
    evEbitda: 'mult',
    priceToBook: 'mult',
    priceToSales: 'mult',
    evToSales: 'mult',
    epsTrailing: 'number',
    epsForward: 'number',
    enterpriseValue: 'currency',
    ebitdaMargin: 'percent',
    grossMargin: 'percent',
    operatingMargin: 'percent',
    earningsGrowth: 'percent',
    currentRatio: 'mult',
    quickRatio: 'mult',
    netCash: 'currency',
    shortRatio: 'mult',
    perf52W: 'percent'
  };

  const formatType = formatMap[key] || 'number';

  return {
    value,
    formatted: formatWert(value, formatType),
    status: bewerteKennzahl(value, key),
    label: getLabel(key),
    hilfetext: getHilfetext(key),
    einheit: formatType === 'percent' ? '%' : formatType === 'mult' ? 'x' : undefined
  };
}
