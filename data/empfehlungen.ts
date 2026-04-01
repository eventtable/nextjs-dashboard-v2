// Matrix 2.0 Nachkauf-Empfehlungen - Echte Bewertung mit allen Daten
// Nicht nur %-Abstand, sondern: Chancen-Risiko + Fundamental + Technisch

import { depotPositionen, Position } from './depot';
import { PEERS } from './peers';

export interface NachkaufEmpfehlung {
  ticker: string;
  name: string;
  typ: 'Aktie' | 'ETF' | 'Anleihe';
  aktuellerKurs: number;
  buyIn: number;
  abstandProzent: number;
  // Matrix 2.0 Bewertung
  chancenRisikoScore: number; // 0-100
  fundamentalScore: number; // 0-100 (KGV, Dividende, Cashflow)
  technischerScore: number; // 0-100 (Trend, RSI, Fibonacci)
  makroScore: number; // 0-100 (Branche, Zyklus)
  gesamtScore: number; // 0-100 gewichtet
  // Empfehlung
  empfehlung: 'stark-nachkaufen' | 'nachkaufen' | 'beobachten' | 'halten' | 'verkaufen';
  empfehlungGewichtung: 'KAUFEN' | 'HALTEN' | 'VERKAUFEN';
  // Details
  begruendung: string;
  nachkaufZone: string;
  stopLoss: string;
  zielKurs: string;
  prioritaet: 1 | 2 | 3 | 4 | 5;
  // Risk-Metriken
  risikoLevel: 'niedrig' | 'moderat' | 'hoch' | 'sehr-hoch' | 'mittel';
  risikoFaktoren: string[];
  chanceFaktoren: string[];
  // Fibonacci Levels
  fibonacci: {
    level618: number;
    level382: number;
    naechsteUnterstuetzung: number;
    naechsterWiderstand: number;
    zone: string;
    fibScore: number;
  } | null;
  // FCF Yield
  fcfYield: {
    yield: number;
    bewertung: string;
  } | null;
}

// 52W High/Low Daten für Fibonacci-Berechnungen
const W52_DATEN: Record<string, { high52w: number; low52w: number }> = {
  'SAP': { high52w: 198, low52w: 115 },
  'ALV': { high52w: 375, low52w: 280 },
  'MUV2': { high52w: 560, low52w: 450 },
  'MSFT': { high52w: 468, low52w: 380 },
  'GOLD': { high52w: 44, low52w: 28 },
  'BYD6.DE': { high52w: 45, low52w: 10 },
  'NOVO-B.CO': { high52w: 145, low52w: 45 },
  'NATO': { high52w: 22, low52w: 14 },
  'IGLN.L': { high52w: 82, low52w: 68 },
  '3DES': { high52w: 0.45, low52w: 0.18 },
  'XAI': { high52w: 185, low52w: 120 },
  'VHYD': { high52w: 85, low52w: 70 },
  'XDWC': { high52w: 68, low52w: 42 },
  'COMO': { high52w: 11.5, low52w: 8.5 },
  'AMEM': { high52w: 8.5, low52w: 5.5 },
  'XS2800678224': { high52w: 99.5, low52w: 20 }, // Air Baltic
};

// Statische Fundamental-Daten (werden regelmäßig aktualisiert)
// Marktkapitalisierung in Mrd € für FCF-Yield-Berechnung
const FUNDAMENTALDATEN: Record<string, {
  kgv: number;
  kgv5Jahre: number;
  dividendYield: number;
  payoutRatio: number;
  freeCashflow: number; // Mrd
  marketCap: number; // Mrd €
  debtToEquity: number;
  roe: number;
  branche: string;
}> = {
  'SAP': { kgv: 22.5, kgv5Jahre: 28.0, dividendYield: 1.8, payoutRatio: 45, freeCashflow: 4.2, marketCap: 175, debtToEquity: 35, roe: 12, branche: 'Software' },
  'ALV': { kgv: 10.2, kgv5Jahre: 11.5, dividendYield: 5.8, payoutRatio: 55, freeCashflow: 12.0, marketCap: 140, debtToEquity: 25, roe: 8, branche: 'Versicherung' },
  'MUV2': { kgv: 11.8, kgv5Jahre: 13.0, dividendYield: 2.9, payoutRatio: 60, freeCashflow: 5.5, marketCap: 85, debtToEquity: 20, roe: 10, branche: 'Versicherung' },
  'MSFT': { kgv: 28.5, kgv5Jahre: 32.0, dividendYield: 0.7, payoutRatio: 25, freeCashflow: 65.0, marketCap: 2300, debtToEquity: 40, roe: 38, branche: 'Technology' },
  'GOLD': { kgv: 14.2, kgv5Jahre: 16.0, dividendYield: 2.4, payoutRatio: 35, freeCashflow: 2.8, marketCap: 58, debtToEquity: 15, roe: 8, branche: 'Mining' },
  'BYD6.DE': { kgv: 18.5, kgv5Jahre: 45.0, dividendYield: 0, payoutRatio: 0, freeCashflow: 3.2, marketCap: 95, debtToEquity: 55, roe: 15, branche: 'Automotive' },
  'NOVO-B.CO': { kgv: 24.0, kgv5Jahre: 35.0, dividendYield: 1.5, payoutRatio: 50, freeCashflow: 8.5, marketCap: 480, debtToEquity: 30, roe: 55, branche: 'Pharma' },
};

// ETF-Kategorien für Risikobewertung
const ETF_KATEGORIEN: Record<string, { risiko: 'niedrig' | 'mittel' | 'hoch' | 'sehr-hoch'; diversifikation: number }> = {
  'VHYD': { risiko: 'niedrig', diversifikation: 95 }, // World High Div = breit gestreut
  'IGLN.L': { risiko: 'mittel', diversifikation: 40 }, // Gold = Einzelasset
  'NATO': { risiko: 'hoch', diversifikation: 60 },      // Defense = Sektor
  'XDWC': { risiko: 'mittel', diversifikation: 70 },  // Energy = Sektor
  'XAI': { risiko: 'mittel', diversifikation: 65 },    // AI = Sektor
  'AMEM': { risiko: 'mittel', diversifikation: 85 },  // EM = breit, aber volatil
  'COMO': { risiko: 'hoch', diversifikation: 50 },     // Commodities = volatil
  '3DES': { risiko: 'sehr-hoch', diversifikation: 10 }, // 3x Short = Hebel!
};

// Peer-Vergleich KGVs (Branchenschnitte)
const BRANCHEN_KGV: Record<string, { durchschnitt: number; premium: number }> = {
  'Software': { durchschnitt: 25.0, premium: 30.0 },
  'Versicherung': { durchschnitt: 11.0, premium: 13.0 },
  'Technology': { durchschnitt: 28.0, premium: 35.0 },
  'Mining': { durchschnitt: 12.0, premium: 15.0 },
  'Automotive': { durchschnitt: 8.0, premium: 12.0 },
  'Pharma': { durchschnitt: 18.0, premium: 25.0 },
};

// ============================================
// FIBONACCI RETRACEMENT
// ============================================

interface FibonacciLevels {
  level0: number;   // 0% - Hoch
  level236: number; // 23.6%
  level382: number; // 38.2%
  level500: number; // 50%
  level618: number; // 61.8% (Golden Ratio)
  level786: number; // 78.6%
  level100: number; // 100% - Tief
}

function berechneFibonacciLevels(high52w: number, low52w: number): FibonacciLevels {
  const range = high52w - low52w;
  return {
    level0: high52w,
    level236: high52w - (range * 0.236),
    level382: high52w - (range * 0.382),
    level500: high52w - (range * 0.5),
    level618: high52w - (range * 0.618),
    level786: high52w - (range * 0.786),
    level100: low52w
  };
}

function bewerteFibonacciPosition(currentPrice: number, buyIn: number, fibLevels: FibonacciLevels): {
  zone: 'stark-ueberkauft' | 'ueberkauft' | 'neutral' | 'unterstuetzung' | 'starke-unterstuetzung';
  naechsteUnterstuetzung: number;
  naechsterWiderstand: number;
  fibScore: number; // 0-100
  begruendung: string;
} {
  let zone: 'stark-ueberkauft' | 'ueberkauft' | 'neutral' | 'unterstuetzung' | 'starke-unterstuetzung' = 'neutral';
  let naechsteUnterstuetzung = fibLevels.level618;
  let naechsterWiderstand = fibLevels.level382;
  let fibScore = 50;
  let begruendung = '';

  // Zone bestimmen
  if (currentPrice >= fibLevels.level236) {
    zone = 'stark-ueberkauft';
    naechsteUnterstuetzung = fibLevels.level236;
    naechsterWiderstand = fibLevels.level0;
    fibScore = 20;
    begruendung = 'Nahe 52W Hoch - überkauft';
  } else if (currentPrice >= fibLevels.level382) {
    zone = 'ueberkauft';
    naechsteUnterstuetzung = fibLevels.level382;
    naechsterWiderstand = fibLevels.level236;
    fibScore = 35;
    begruendung = 'Über 38.2% - limitierter Nachkauf';
  } else if (currentPrice >= fibLevels.level500) {
    zone = 'neutral';
    naechsteUnterstuetzung = fibLevels.level500;
    naechsterWiderstand = fibLevels.level382;
    fibScore = 50;
    begruendung = 'Im 50% Bereich - neutral';
  } else if (currentPrice >= fibLevels.level618) {
    zone = 'unterstuetzung';
    naechsteUnterstuetzung = fibLevels.level618;
    naechsterWiderstand = fibLevels.level500;
    fibScore = 70;
    begruendung = 'Goldene Zone (61.8%) - gute Nachkaufzone';
  } else if (currentPrice >= fibLevels.level786) {
    zone = 'starke-unterstuetzung';
    naechsteUnterstuetzung = fibLevels.level786;
    naechsterWiderstand = fibLevels.level618;
    fibScore = 85;
    begruendung = '78.6% - starke Unterstützung';
  } else {
    zone = 'starke-unterstuetzung';
    naechsteUnterstuetzung = fibLevels.level100;
    naechsterWiderstand = fibLevels.level786;
    fibScore = 90;
    begruendung = 'Nahe 52W Tief - maximale Nachkaufzone';
  }

  // Bonus wenn aktueller Kurs unter Buy-In UND in Fibonacci-Unterstützung
  if (currentPrice < buyIn) {
    if (zone === 'unterstuetzung' || zone === 'starke-unterstuetzung') {
      fibScore += 10;
      begruendung += ' + unter Buy-In';
    }
  }

  return {
    zone,
    naechsteUnterstuetzung,
    naechsterWiderstand,
    fibScore: Math.min(100, fibScore),
    begruendung
  };
}

// ============================================
// MATRIX 2.0 SCORING
// ============================================

function berechneFundamentalScore(ticker: string, pos: Position): number {
  const data = FUNDAMENTALDATEN[ticker.replace('.DE', '').replace('.CO', '')];
  if (!data) {
    // ETF: Neutraler Score
    return 50;
  }

  let score = 50;

  // KGV vs. 5-Jahres-Durchschnitt
  const kgvDiscount = (data.kgv5Jahre - data.kgv) / data.kgv5Jahre;
  if (kgvDiscount > 0.3) score += 20;
  else if (kgvDiscount > 0.15) score += 10;
  else if (kgvDiscount < -0.1) score -= 10;

  // KGV vs. Branchenschnitt
  const branche = BRANCHEN_KGV[data.branche];
  if (branche) {
    const kgvVsBranche = (branche.durchschnitt - data.kgv) / branche.durchschnitt;
    if (kgvVsBranche > 0.2) score += 15;
    else if (kgvVsBranche > 0) score += 5;
    else if (kgvVsBranche < -0.2) score -= 10;
  }

  // Dividendenrendite (nur bei positiver Rendite)
  if (data.dividendYield > 3) score += 10;
  if (data.dividendYield > 5) score += 5;

  // Payout Ratio (nicht zu hoch = nachhaltig)
  if (data.payoutRatio < 50) score += 5;
  if (data.payoutRatio > 80) score -= 10;

  // Free Cashflow positiv
  if (data.freeCashflow > 0) score += 5;

  // Verschuldung
  if (data.debtToEquity < 30) score += 5;
  if (data.debtToEquity > 60) score -= 5;

  // ROE
  if (data.roe > 15) score += 10;
  if (data.roe > 25) score += 5;
  if (data.roe < 5) score -= 10;

  // FCF Yield = Free Cashflow / Market Cap (in %)
  // Ein starker Kaufindikator! >8% = sehr stark unterbewertet
  const fcfYield = (data.freeCashflow / data.marketCap) * 100;
  if (fcfYield >= 8) {
    score += 20; // Sehr starkes Signal
  } else if (fcfYield >= 6) {
    score += 12;
  } else if (fcfYield >= 4) {
    score += 6;
  } else if (fcfYield >= 2) {
    score += 2;
  }

  return Math.max(0, Math.min(100, score));
}

// FCF Yield für Chance-Faktoren berechnen
function getFCFYield(ticker: string): { yield: number; bewertung: string } | null {
  const data = FUNDAMENTALDATEN[ticker.replace('.DE', '').replace('-B.CO', '')];
  if (!data) return null;
  
  const fcfYield = (data.freeCashflow / data.marketCap) * 100;
  let bewertung = '';
  
  if (fcfYield >= 8) bewertung = '🚀 Stark unterbewertet (FCF Yield >8%)';
  else if (fcfYield >= 6) bewertung = '⭐ Sehr attraktiv (FCF Yield >6%)';
  else if (fcfYield >= 4) bewertung = '👍 Solide (FCF Yield >4%)';
  else if (fcfYield >= 2) bewertung = '✓ Positiv (FCF Yield >2%)';
  else bewertung = `FCF Yield: ${fcfYield.toFixed(1)}%`;
  
  return { yield: fcfYield, bewertung };
}

function berechneTechnischerScore(pos: Position): number {
  let score = 50;
  const perf = pos.performanceProzent;

  // 52W-Range Position (wenn stark gefallen = potenzielle Umkehr)
  // Unter -20% = gut für Nachkauf, unter -30% = sehr gut
  if (perf < -30) score += 25;
  else if (perf < -20) score += 15;
  else if (perf < -10) score += 5;
  else if (perf > 10) score -= 10; // Schon gestiegen

  // Rendite seit Buy-In (je tiefer, desto mehr Potenzial)
  const abstand = ((pos.kursProStueck - pos.einstandKurs) / pos.einstandKurs) * 100;
  if (abstand < -25) score += 15;
  else if (abstand < -15) score += 10;
  else if (abstand < -5) score += 5;
  else if (abstand > 10) score -= 5;

  return Math.max(0, Math.min(100, score));
}

function berechneRisikoLevel(pos: Position, fundamentalScore: number): { level: NachkaufEmpfehlung['risikoLevel'], faktoren: string[] } {
  const faktoren: string[] = [];
  let risikoPunkte = 0;

  // Performance-Risiko
  if (pos.performanceProzent < -25) {
    risikoPunkte += 2;
    faktoren.push(`Starke Verluste (${pos.performanceProzent.toFixed(1)}%)`);
  }

  // Fundamental-Risiko
  if (fundamentalScore < 40) {
    risikoPunkte += 2;
    faktoren.push('Schwache Fundamentaldaten');
  }

  // Einzelposition Risiko
  const gewicht = (pos.wertEur / 8388) * 100; // ~8.4k Depotwert
  if (gewicht > 10) {
    risikoPunkte += 1;
    faktoren.push(`Hohe Depotgewichtung (${gewicht.toFixed(1)}%)`);
  }

  // Asset-Typ Risiko
  if (pos.typ === 'Anleihe') {
    if (pos.ticker.includes('Air Baltic')) {
      risikoPunkte += 4;
      faktoren.push('Junk-Bond, Insolvenzrisiko');
    }
  }

  // ETF-Spezifisch
  if (pos.typ === 'ETF') {
    const etfKat = ETF_KATEGORIEN[pos.ticker];
    if (etfKat?.risiko === 'sehr-hoch') {
      risikoPunkte += 3;
      faktoren.push('Hebel-ETF (3x Short)');
    } else if (etfKat?.risiko === 'hoch') {
      risikoPunkte += 1;
    }
  }

  // Stabilität
  if (pos.typ === 'Aktie') {
    const stableTickers = ['ALV', 'MUV2', 'MSFT'];
    const ticker = pos.ticker.replace('.DE', '');
    if (stableTickers.includes(ticker)) {
      risikoPunkte -= 1;
      faktoren.push('Blue-Chap Stabilität');
    }
  }

  let level: NachkaufEmpfehlung['risikoLevel'] = 'niedrig';
  if (risikoPunkte >= 6) level = 'sehr-hoch';
  else if (risikoPunkte >= 4) level = 'hoch';
  else if (risikoPunkte >= 2) level = 'moderat';

  return { level, faktoren };
}

function berechneChancenFaktoren(pos: Position, fundamentalScore: number): string[] {
  const faktoren: string[] = [];
  const abstand = ((pos.kursProStueck - pos.einstandKurs) / pos.einstandKurs) * 100;

  if (abstand < -20) faktoren.push(`Kurs ${Math.abs(abstand).toFixed(1)}% unter Buy-In`);
  if (fundamentalScore > 70) faktoren.push('Stark unterbewertet fundamental');
  if (fundamentalScore > 60) faktoren.push('Gute Dividendenrendite');
  if (pos.performanceProzent < -25 && pos.typ === 'Aktie') faktoren.push('Potenzielle Umkehrchance');
  if (pos.typ === 'ETF') {
    const etfKat = ETF_KATEGORIEN[pos.ticker];
    if (etfKat?.diversifikation > 80) faktoren.push('Hohe Diversifikation');
  }
  
  // FCF Yield hinzufügen
  const fcfData = getFCFYield(pos.ticker);
  if (fcfData && fcfData.yield >= 8) {
    faktoren.push(fcfData.bewertung);
  }

  return faktoren;
}

function ermittleEmpfehlung(
  gesamtScore: number,
  risikoLevel: NachkaufEmpfehlung['risikoLevel'],
  pos: Position
): { empfehlung: NachkaufEmpfehlung['empfehlung'], gewichtung: NachkaufEmpfehlung['empfehlungGewichtung'], begruendung: string } {
  const abstand = ((pos.kursProStueck - pos.einstandKurs) / pos.einstandKurs) * 100;

  // Spezialfälle
  if (pos.ticker === 'XS2800678224') {
    return {
      empfehlung: 'verkaufen',
      gewichtung: 'VERKAUFEN',
      begruendung: 'Junk-Bond mit 75% Verlust. Entscheidung: Realisieren oder Warten auf mögliche Restituierung bei Restrukturierung.'
    };
  }

  if (pos.ticker === '3DES') {
    return {
      empfehlung: 'halten',
      gewichtung: 'HALTEN',
      begruendung: 'Hebel-ETF nur als Hedge. Kein Nachkauf, nur für aktive Strategie.'
    };
  }

  // KONSISTENTE MATRIX-LOGIK
  // Priorität: Score + Abstand + Risiko
  
  // KEIN Nachkauf wenn Kurs über Buy-In (außer Score ist extrem hoch für DCA)
  if (abstand >= 0) {
    return {
      empfehlung: 'halten',
      gewichtung: 'HALTEN',
      begruendung: `Kurs über Buy-In (+${abstand.toFixed(1)}%). Keine Nachkauf-Notwendigkeit.`
    };
  }

  // STARK NACHKAUFEN: Sehr hoher Score (>75), gutes Risiko-Profil, tiefer Abstand (<-20%)
  if (gesamtScore >= 75 && (risikoLevel === 'niedrig' || risikoLevel === 'moderat') && abstand < -20) {
    return {
      empfehlung: 'stark-nachkaufen',
      gewichtung: 'KAUFEN',
      begruendung: `Ausgezeichnetes Chancen-Risiko-Verhältnis. Score ${gesamtScore}/100, ${Math.abs(abstand).toFixed(1)}% unter Buy-In.`
    };
  }

  // NACHKAUFEN: Guter Score (>65) UND tiefer Abstand (<-15%)
  if (gesamtScore >= 65 && abstand < -15) {
    return {
      empfehlung: 'nachkaufen',
      gewichtung: 'KAUFEN',
      begruendung: `Gute Nachkaufzone. Score ${gesamtScore}/100, ${Math.abs(abstand).toFixed(1)}% unter Buy-In.`
    };
  }

  // NACHKAUFEN (limitiert): Solider Score (>55) UND moderater Abstand (-10% bis -15%)
  if (gesamtScore >= 55 && abstand < -10) {
    return {
      empfehlung: 'nachkaufen',
      gewichtung: 'KAUFEN',
      begruendung: `Mittlere Nachkaufzone. Score ${gesamtScore}/100, ${Math.abs(abstand).toFixed(1)}% unter Buy-In.`
    };
  }

  // BEOBACHTEN: Mittlerer Score (45-65) ODER kleiner Abstand (-5% bis -10%)
  if ((gesamtScore >= 45 && gesamtScore < 65) || (abstand >= -10 && abstand < -5)) {
    return {
      empfehlung: 'beobachten',
      gewichtung: 'HALTEN',
      begruendung: abstand < -10 
        ? `Score ${gesamtScore}/100 zu niedrig für Nachkauf trotz ${Math.abs(abstand).toFixed(1)}% Abstand.`
        : `Leichter Abschlag von ${Math.abs(abstand).toFixed(1)}%. Abwarten auf bessere Zone.`
    };
  }

  // REDUCE/PRÜFEN: Niedriger Score (<45) bei tiefem Abstand = Warnsignal
  if (gesamtScore < 45 && abstand < -20) {
    return {
      empfehlung: 'beobachten',
      gewichtung: 'HALTEN',
      begruendung: `⚠️ Tief unter Buy-In (${Math.abs(abstand).toFixed(1)}%) aber schwacher Score (${gesamtScore}/100). Fundamental prüfen!`
    };
  }

  // HALTEN: Alles andere
  return {
    empfehlung: 'halten',
    gewichtung: 'HALTEN',
    begruendung: `Score ${gesamtScore}/100 bei ${Math.abs(abstand).toFixed(1)}% Abstand. Keine klare Nachkauf-Empfehlung.`
  };
}

function berechneNachkaufZone(pos: Position): string {
  const abstand = ((pos.kursProStueck - pos.einstandKurs) / pos.einstandKurs) * 100;
  
  if (abstand < -30) return `Unter ${(pos.einstandKurs * 0.70).toFixed(2)}€`;
  if (abstand < -20) return `${(pos.einstandKurs * 0.70).toFixed(2)}€ - ${(pos.einstandKurs * 0.80).toFixed(2)}€`;
  if (abstand < -15) return `${(pos.einstandKurs * 0.75).toFixed(2)}€ - ${(pos.einstandKurs * 0.85).toFixed(2)}€`;
  if (abstand < -10) return `${(pos.einstandKurs * 0.85).toFixed(2)}€ - ${(pos.einstandKurs * 0.95).toFixed(2)}€`;
  if (abstand < -5) return `${(pos.einstandKurs * 0.90).toFixed(2)}€ - ${(pos.einstandKurs * 0.98).toFixed(2)}€`;
  return `Keine Zone (über ${pos.einstandKurs.toFixed(2)}€)`;
}

function berechneStopLoss(pos: Position): string {
  // 15% unter aktuellem Kurs, aber max 40% unter Buy-In
  const unterstuetzung = pos.kursProStueck * 0.85;
  const maxVerlust = pos.einstandKurs * 0.60;
  const stop = Math.max(unterstuetzung, maxVerlust);
  return `ca. ${stop.toFixed(2)}€`;
}

function berechneZielKurs(pos: Position): string {
  // Ziel: Buy-In zurückgewinnen + 10%
  const ziel = pos.einstandKurs * 1.10;
  return `ca. ${ziel.toFixed(2)}€`;
}

function berechnePrioritaet(empfehlung: NachkaufEmpfehlung['empfehlung'], score: number, pos: Position): 1 | 2 | 3 | 4 | 5 {
  if (empfehlung === 'stark-nachkaufen') return 1;
  if (empfehlung === 'nachkaufen' && score >= 65) return 2;
  if (empfehlung === 'nachkaufen') return 3;
  if (empfehlung === 'beobachten') return 4;
  return 5;
}

// ============================================
// HAUPTFUNKTION
// ============================================

export const berechneNachkaufEmpfehlungen = (positionen: Position[] = depotPositionen): NachkaufEmpfehlung[] => {
  const empfehlungen: NachkaufEmpfehlung[] = [];

  positionen.forEach(pos => {
    const fundamentalScore = berechneFundamentalScore(pos.ticker, pos);
    
    // Fibonacci Berechnung
    const w52Daten = W52_DATEN[pos.ticker.replace('.DE', '').replace('-B.CO', '')];
    let fibonacci: NachkaufEmpfehlung['fibonacci'] = null;
    let fibScore = 50;
    let fibBegruendung = '';
    
    if (w52Daten && pos.typ !== 'Anleihe') {
      const fibLevels = berechneFibonacciLevels(w52Daten.high52w, w52Daten.low52w);
      const fibBewertung = bewerteFibonacciPosition(
        pos.kursProStueck, 
        pos.einstandKurs, 
        fibLevels
      );
      fibScore = fibBewertung.fibScore;
      fibBegruendung = fibBewertung.begruendung;
      
      fibonacci = {
        level618: fibLevels.level618,
        level382: fibLevels.level382,
        naechsteUnterstuetzung: fibBewertung.naechsteUnterstuetzung,
        naechsterWiderstand: fibBewertung.naechsterWiderstand,
        zone: fibBewertung.zone,
        fibScore: fibBewertung.fibScore
      };
    }
    
    // Technischer Score mit Fibonacci (50% Gewicht)
    const basisTechnischerScore = berechneTechnischerScore(pos);
    const technischerScore = Math.round((basisTechnischerScore * 0.5) + (fibScore * 0.5));
    
    const makroScore = pos.typ === 'Aktie' ? 55 : 60; // ETFs etwas höher wegen Diversifikation

    // Gewichteter Gesamt-Score
    const gesamtScore = Math.round(
      fundamentalScore * 0.40 + 
      technischerScore * 0.35 + 
      makroScore * 0.25
    );

    const { level: risikoLevel, faktoren: risikoFaktoren } = berechneRisikoLevel(pos, fundamentalScore);
    const chanceFaktoren = berechneChancenFaktoren(pos, fundamentalScore);
    
    // Fibonacci zu Chance-Faktoren hinzufügen
    if (fibBegruendung) {
      chanceFaktoren.push(`Fibonacci: ${fibBegruendung}`);
    }
    
    // FCF Yield berechnen
    const fcfYieldData = getFCFYield(pos.ticker);
    
    const { empfehlung, gewichtung, begruendung } = ermittleEmpfehlung(gesamtScore, risikoLevel, pos);

    empfehlungen.push({
      ticker: pos.ticker,
      name: pos.name,
      typ: pos.typ,
      aktuellerKurs: pos.kursProStueck,
      buyIn: pos.einstandKurs,
      abstandProzent: ((pos.kursProStueck - pos.einstandKurs) / pos.einstandKurs) * 100,
      chancenRisikoScore: Math.round((technischerScore + (100 - risikoFaktoren.length * 15)) / 2),
      fundamentalScore,
      technischerScore,
      makroScore,
      gesamtScore,
      empfehlung,
      empfehlungGewichtung: gewichtung,
      begruendung: fibBegruendung ? `${begruendung} | ${fibBegruendung}` : begruendung,
      nachkaufZone: fibonacci 
        ? `${fibonacci.level618.toFixed(2)}€ (61.8%) - ${(fibonacci.level618 * 0.95).toFixed(2)}€` 
        : berechneNachkaufZone(pos),
      stopLoss: fibonacci
        ? `${fibonacci.naechsteUnterstuetzung.toFixed(2)}€`
        : berechneStopLoss(pos),
      zielKurs: fibonacci
        ? `${fibonacci.level382.toFixed(2)}€ (38.2%)`
        : berechneZielKurs(pos),
      prioritaet: berechnePrioritaet(empfehlung, gesamtScore, pos),
      risikoLevel,
      risikoFaktoren,
      chanceFaktoren,
      fibonacci,
      fcfYield: fcfYieldData
    });
  });

  // Sortieren: Priorität aufsteigend (1 = höchste), dann Score absteigend
  return empfehlungen.sort((a, b) => {
    if (a.prioritaet !== b.prioritaet) return a.prioritaet - b.prioritaet;
    return b.gesamtScore - a.gesamtScore;
  });
};

// ============================================
// RISK HEATMAP (Matrix 2.0 Style)
// ============================================

export interface RiskHeatmapItem {
  ticker: string;
  name: string;
  performanceProzent: number;
  gewinnEur: number;
  risikoLevel: 'hoch' | 'mittel' | 'niedrig' | 'sehr-hoch' | 'moderat';
  farbe: string;
  matrixScore: number;
}

export const berechneRiskHeatmap = (positionen: Position[] = depotPositionen): RiskHeatmapItem[] => {
  const empfehlungen = berechneNachkaufEmpfehlungen(positionen);
  
  return empfehlungen
    .filter(e => e.typ !== 'Anleihe') // Anleihe separat behandeln
    .map(empf => {
      const pos = positionen.find(p => p.ticker === empf.ticker)!;
      
      let risikoLevel: RiskHeatmapItem['risikoLevel'] = 'mittel';
      let farbe = '#eab308'; // Gelb

      if (empf.risikoLevel === 'sehr-hoch' || empf.risikoLevel === 'hoch') {
        risikoLevel = 'hoch';
        farbe = '#ef4444'; // Rot
      } else if (empf.risikoLevel === 'niedrig' && pos.performanceProzent > -5) {
        risikoLevel = 'niedrig';
        farbe = '#22c55e'; // Grün
      }

      return {
        ticker: empf.ticker,
        name: empf.name,
        performanceProzent: pos.performanceProzent,
        gewinnEur: pos.gewinnEur,
        risikoLevel,
        farbe,
        matrixScore: empf.gesamtScore
      };
    })
    .sort((a, b) => a.performanceProzent - b.performanceProzent);
};

// ============================================
// DIVIDENDEN-TRACKER
// ============================================

export interface DividendenInfo {
  ticker: string;
  name: string;
  dividendenrendite: number;
  ausschuettungProAktie: number;
  ausschuettungJaehrlich: number;
  frequenz: 'quartalsweise' | 'halbjaehrlich' | 'jaehrlich';
  naechsteAusschuettung?: string;
  wachstum5Jahre?: string;
}

export const dividendenDaten: DividendenInfo[] = [
  {
    ticker: 'ALV',
    name: 'Allianz',
    dividendenrendite: 5.8,
    ausschuettungProAktie: 20.20,
    ausschuettungJaehrlich: 20.20,
    frequenz: 'jaehrlich',
    naechsteAusschuettung: 'Mai 2026',
    wachstum5Jahre: '+5% p.a.'
  },
  {
    ticker: 'MUV2',
    name: 'Münchener Rück',
    dividendenrendite: 2.9,
    ausschuettungProAktie: 15.00,
    ausschuettungJaehrlich: 15.00,
    frequenz: 'jaehrlich',
    naechsteAusschuettung: 'April 2026',
    wachstum5Jahre: '+6% p.a.'
  },
  {
    ticker: 'MSFT',
    name: 'Microsoft',
    dividendenrendite: 0.7,
    ausschuettungProAktie: 2.18,
    ausschuettungJaehrlich: 2.18,
    frequenz: 'quartalsweise',
    naechsteAusschuettung: 'März 2026',
    wachstum5Jahre: '+10% p.a.'
  },
  {
    ticker: 'GOLD',
    name: 'Barrick Mining',
    dividendenrendite: 2.4,
    ausschuettungProAktie: 0.80,
    ausschuettungJaehrlich: 0.80,
    frequenz: 'quartalsweise',
    naechsteAusschuettung: 'März 2026',
    wachstum5Jahre: 'stabil'
  },
  {
    ticker: 'VHYD',
    name: 'Vanguard FTSE All-World High Dividend',
    dividendenrendite: 3.1,
    ausschuettungProAktie: 2.53,
    ausschuettungJaehrlich: 2.53,
    frequenz: 'quartalsweise',
    naechsteAusschuettung: 'März 2026',
    wachstum5Jahre: '+3% p.a.'
  },
  {
    ticker: 'SAP',
    name: 'SAP',
    dividendenrendite: 1.8,
    ausschuettungProAktie: 2.55,
    ausschuettungJaehrlich: 2.55,
    frequenz: 'jaehrlich',
    naechsteAusschuettung: 'Mai 2026',
    wachstum5Jahre: '+8% p.a.'
  },
];

// ============================================
// ZUSAMMENFASSUNG
// ============================================

export const EMPFEHLUNGEN_ZUSAMMENFASSUNG = {
  anzahlStarkNachkaufen: 0, // Wird dynamisch berechnet
  anzahlNachkaufen: 0,
  anzahlBeobachten: 0,
  anzahlHalten: 0,
  geschaetzteDividendeJaehrlich: 52.93,
  hoechstesRisiko: 'Air Baltic Bonds (Junk-Bond Status)',
  besteChance: 'SAP/Novo Nordisk (stark unterbewertet)',
  matrix20Aktiv: true,
  letzteAktualisierung: new Date().toISOString().split('T')[0]
};

// Dynamische Berechnung der Zusammenfassung
export const berechneZusammenfassung = () => {
  const empfehlungen = berechneNachkaufEmpfehlungen();
  return {
    ...EMPFEHLUNGEN_ZUSAMMENFASSUNG,
    anzahlStarkNachkaufen: empfehlungen.filter(e => e.empfehlung === 'stark-nachkaufen').length,
    anzahlNachkaufen: empfehlungen.filter(e => e.empfehlung === 'nachkaufen').length,
    anzahlBeobachten: empfehlungen.filter(e => e.empfehlung === 'beobachten').length,
    anzahlHalten: empfehlungen.filter(e => e.empfehlung === 'halten').length,
  };
};
