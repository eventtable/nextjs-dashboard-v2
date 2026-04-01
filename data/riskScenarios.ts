// Risiko-Szenarien für die Depot-Analyse
// Realistische Bedrohungen mit quantifiziertem Impact

export interface RiskScenario {
  id: string;
  name: string;
  description: string;
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high' | 'severe';
  affectedSectors: string[];
  affectedTickers: string[];
  estimatedImpact: number; // -30% bis +20%
  triggers: string[];
  mitigation: string[];
  timeframe: string;
  category: 'macro' | 'geopolitical' | 'sector' | 'monetary' | 'market';
}

export const riskScenarios: RiskScenario[] = [
  {
    id: 'iran-conflict-2026',
    name: 'Iran-Konflikt / Hormuz-Blockade',
    description: 'Militärische Eskalation zwischen Israel und Iran. Blockade der Straße von Hormuz (20% des globalen Öltransports). Ölpreise explodieren auf 150 USD/Barrel. Regionale Destabilisierung, Cyberangriffe, Versicherungskosten explodieren.',
    probability: 'medium',
    impact: 'severe',
    affectedSectors: ['Energy', 'Insurance', 'Shipping', 'Chemicals', 'Automotive', 'Aviation'],
    affectedTickers: ['ALV.DE', 'MUV2.DE', 'BYD6.DE', 'GOLD', 'EUN3.DE'],
    estimatedImpact: -18.0,
    triggers: ['Israelischer Angriff auf iranische Nuklearanlagen', 'Iran blockiert Hormuz', 'Hamas/Hezbollah Eskalation', 'US-Militäreinsatz'],
    mitigation: ['Versicherungen reduzieren (Allianz, Munich Re)', 'Gold-Positionen erhöhen als Krisenschutz', 'Öl-Abhängige (BYD) reduzieren', 'Cash-Quote erhöhen'],
    timeframe: 'Sofort - 3 Monate',
    category: 'geopolitical'
  },
  {
    id: 'oil-shock-2026',
    name: 'Ölpreis-Schock +50%',
    description: 'Geopolitische Eskalation im Nahen Osten oder massive Produktionskürzungen treiben Ölpreise auf über 120 USD/Barrel. Inflationsdruck steigt, Transportkosten explodieren.',
    probability: 'medium',
    impact: 'high',
    affectedSectors: ['Automotive', 'Transportation', 'Airlines', 'Chemicals', 'Manufacturing'],
    affectedTickers: ['BYD6.DE', 'ALV.DE', 'SAP.DE'],
    estimatedImpact: -12.5,
    triggers: ['Konflikt Iran/Israel', 'OPEC+ Produktionskürzungen', 'Hurrikan-Saison Golf von Mexiko'],
    mitigation: ['Gold-Positionen (Schutz) erhöhen', 'Energie-ETF reduzieren', 'Rebalancing in defensiven Konsum'],
    timeframe: '1-3 Monate',
    category: 'geopolitical'
  },
  {
    id: 'recession-2026',
    name: 'Rezession 2026',
    description: 'US- und EU-Wirtschaft rutschen in eine moderate Rezession. Unternehmensgewinne brechen um 15-20% ein, Arbeitslosenquote steigt auf 6%.',
    probability: 'medium',
    impact: 'severe',
    affectedSectors: ['Technology', 'Consulting', 'Automotive', 'Cyclicals', 'Discretionary'],
    affectedTickers: ['MSFT', 'MBBK.DE', 'BYD6.DE', 'EXS1.DE', 'SXRG.DE'],
    estimatedImpact: -22.0,
    triggers: ['Fed bleibt zu lange hawkish', 'Credit-Spreads >400bp', 'PMI <45 über 3 Monate'],
    mitigation: ['Anleihen-Quote auf 25% erhöhen', 'Defensive Positionen: Munich Re, Allianz', 'Dollar-Exposure erhalten'],
    timeframe: '6-12 Monate',
    category: 'macro'
  },
  {
    id: 'china-crisis',
    name: 'China-Krise / Taiwan-Konflikt',
    description: 'Militärische Eskalation zwischen China und Taiwan oder harter wirtschaftlicher Abschwung. Globale Lieferketten kollabieren, Halbleiter-Knappheit.',
    probability: 'low',
    impact: 'severe',
    affectedSectors: ['Technology', 'Automotive', 'Software', 'Semiconductors'],
    affectedTickers: ['SAP.DE', 'BYD6.DE', 'EUNL.DE', 'EXS1.DE'],
    estimatedImpact: -18.5,
    triggers: ['Wahl Taiwan 2026', 'US-Sanktionen gegen chinesische Tech', 'Immobilienblase platzt'],
    mitigation: ['Emerging Markets ETF reduzieren', 'SAP-Exposure begrenzen', 'Gold und Schweizer Franken'],
    timeframe: '1-6 Monate',
    category: 'geopolitical'
  },
  {
    id: 'rate-shock-200bp',
    name: 'Zinsschock +200bp',
    description: 'EZB und Fed müssen Zinsen schneller anheben als erwartet. Langfristige Staatsanleihen brechen ein, Growth-Aktien stürzen ab.',
    probability: 'medium',
    impact: 'high',
    affectedSectors: ['Technology', 'Growth', 'Real Estate', 'Utilities'],
    affectedTickers: ['MSFT', 'SAP.DE', 'NOVO-B.CO', 'EUN3.DE'],
    estimatedImpact: -15.0,
    triggers: ['Inflation steigt auf >4%', 'Fed-Forward-Guidance hawkish', 'Staatsanleihen werden abgestoßen'],
    mitigation: ['Anleihen verkürzen (<3 Jahre Duration)', 'Value-Rotation', 'Floating-Rate-Instruments'],
    timeframe: '3-6 Monate',
    category: 'monetary'
  },
  {
    id: 'euro-crisis',
    name: 'Euro-Krise / Südstaaten',
    description: 'Politische Instabilität in Italien/Spanien oder Bankenkrise löst Vertrauensverlust in Euro aus. Spreads brechen aus.',
    probability: 'low',
    impact: 'high',
    affectedSectors: ['Banking', 'Insurance', 'Eurozone-Assets'],
    affectedTickers: ['ALV.DE', 'MUV2.DE', 'EXS0.DE', 'EUN3.DE'],
    estimatedImpact: -14.0,
    triggers: ['Italiens Haushaltsdefizit >6%', 'Bankenstresstest-Failures', 'AfD-Wahlerfolg Deutschland'],
    mitigation: ['DAX-ETF reduzieren', 'Gold und USD-Assets erhöhen', 'Euro-Hedge aktivieren'],
    timeframe: '3-12 Monate',
    category: 'geopolitical'
  },
  {
    id: 'russia-escalation',
    name: 'Russland-Eskalation',
    description: 'Neue Eskalation im Ukraine-Konflikt, Energieembargo oder Cyberangriffe auf kritische Infrastruktur.',
    probability: 'medium',
    impact: 'medium',
    affectedSectors: ['Energy', 'Utilities', 'Commodities', 'Chemicals'],
    affectedTickers: ['GOLD', 'IGLN.L', 'SSLV.L', 'EUN3.DE'],
    estimatedImpact: -8.0,
    triggers: ['NATO-Truppenverlegung', 'Critical Infrastructure Angriff', 'Gaslieferungen stoppen'],
    mitigation: ['Gold/Silber als Hedge', 'Europäische Versorger reduzieren', 'Dollar-Assets'],
    timeframe: '1-3 Monate',
    category: 'geopolitical'
  },
  {
    id: 'ai-bubble-burst',
    name: 'KI-Blase platzt',
    description: 'Übertriebene Erwartungen an KI-Technologie führen zu Korrektur. Tech-Aktien verlieren 30-50%. SAP und Microsoft betroffen.',
    probability: 'medium',
    impact: 'high',
    affectedSectors: ['Technology', 'Software', 'Semiconductors'],
    affectedTickers: ['SAP.DE', 'MSFT', 'SXRG.DE'],
    estimatedImpact: -20.0,
    triggers: ['KI-Umsatz-Zahlen enttäuschen', 'Regulierungen verschärfen', 'GPU-Nachfrage sinkt'],
    mitigation: ['Tech-Gewichtung reduzieren', 'Value-Investments stärken', 'Dividenden-Aristokraten'],
    timeframe: '3-6 Monate',
    category: 'market'
  },
  {
    id: 'pharma-regulation',
    name: 'Pharma-Regulierung (Ozempic)',
    description: 'Verschärfte Regulierungen für Gewichtsverlust-Medikamente oder Patentklagen treffen Novo Nordisk.',
    probability: 'medium',
    impact: 'medium',
    affectedSectors: ['Pharma', 'Biotech'],
    affectedTickers: ['NOVO-B.CO'],
    estimatedImpact: -18.0,
    triggers: ['FDA-Warnungen', 'Patent-Urteil negativ', 'Generika-Wettbewerb'],
    mitigation: ['Novo Nordisk reduzieren', 'Pharma-Diversifikation', 'Defensive Sektoren'],
    timeframe: '1-6 Monate',
    category: 'sector'
  },
  {
    id: 'gold-rally',
    name: 'Gold-Rally +30%',
    description: 'Zentralbanken erhöhen Gold-Käufe, geopolitische Unsicherheit treibt Flucht in sichere Häfen. Gold erreicht 3.000 USD.',
    probability: 'low',
    impact: 'low',
    affectedSectors: ['Mining', 'Precious Metals'],
    affectedTickers: ['GOLD', 'IGLN.L', 'SSLV.L'],
    estimatedImpact: +18.0,
    triggers: ['Zentralbank-Käufe steigen', 'USD-Vertrauen schwindet', 'Geopolitische Krise'],
    mitigation: ['Gold-Positionen halten/ausbauen', 'Barrick Mining profitiert', 'Silber als Beta-Play'],
    timeframe: '6-12 Monate',
    category: 'market'
  },
  {
    id: 'em-crisis',
    name: 'Emerging Markets Krise',
    description: 'Starke Dollar-Entwicklung und steigende US-Zinsen führen zu Kapitalflucht aus EM. Dollar-Schuldenproblem.',
    probability: 'medium',
    impact: 'medium',
    affectedSectors: ['Emerging Markets', 'Commodities'],
    affectedTickers: ['EXS1.DE', 'BYD6.DE', 'EUNL.DE'],
    estimatedImpact: -10.0,
    triggers: ['DXY >110', 'Fed bleibt hawkish', 'Dollar-Schulden-Krise in EM'],
    mitigation: ['EM-ETF reduzieren/hedgen', 'Lokale Währungen', 'Qualitäts-EM'],
    timeframe: '3-6 Monate',
    category: 'macro'
  }
];

// Impact-Berechnung für Depot
export interface ScenarioImpact {
  scenario: RiskScenario;
  depotImpact: number;
  affectedPositions: {
    ticker: string;
    name: string;
    wertEur: number;
    impact: number;
    newValue: number;
  }[];
  totalValueBefore: number;
  totalValueAfter: number;
}

export const berechneScenarioImpact = (
  scenario: RiskScenario,
  positionen: { ticker: string; name: string; wertEur: number; typ: string; sektor?: string }[]
): ScenarioImpact => {
  const affectedPositions = positionen
    .filter(pos => 
      scenario.affectedTickers.includes(pos.ticker) || 
      (pos.sektor && scenario.affectedSectors.includes(pos.sektor))
    )
    .map(pos => {
      const isDirect = scenario.affectedTickers.includes(pos.ticker);
      const impactFactor = isDirect ? 1.0 : 0.6; // Direkte Betroffenheit = voller Impact
      const impact = scenario.estimatedImpact * impactFactor;
      const newValue = pos.wertEur * (1 + impact / 100);
      
      return {
        ticker: pos.ticker,
        name: pos.name,
        wertEur: pos.wertEur,
        impact,
        newValue
      };
    });

  const totalValueBefore = positionen.reduce((sum, pos) => sum + pos.wertEur, 0);
  
  const nichtBetroffeneWert = positionen
    .filter(pos => 
      !scenario.affectedTickers.includes(pos.ticker) && 
      (!pos.sektor || !scenario.affectedSectors.includes(pos.sektor))
    )
    .reduce((sum, pos) => sum + pos.wertEur, 0);
  
  const totalValueAfter = nichtBetroffeneWert + affectedPositions.reduce((sum, pos) => sum + pos.newValue, 0);
  const depotImpact = ((totalValueAfter - totalValueBefore) / totalValueBefore) * 100;

  return {
    scenario,
    depotImpact,
    affectedPositions,
    totalValueBefore,
    totalValueAfter
  };
};

// Risiko-Kategorien
export const riskCategories = [
  { id: 'macro', name: 'Makroökonomisch', color: '#ef4444' },
  { id: 'geopolitical', name: 'Geopolitisch', color: '#f97316' },
  { id: 'monetary', name: 'Geldpolitisch', color: '#eab308' },
  { id: 'sector', name: 'Sektorspezifisch', color: '#3b82f6' },
  { id: 'market', name: 'Marktbedingt', color: '#22c55e' }
];

// Wahrscheinlichkeits-Stufen
export const probabilityLevels = {
  low: { label: 'Niedrig', color: '#22c55e', bgColor: 'bg-green-500/20', borderColor: 'border-green-500/30' },
  medium: { label: 'Mittel', color: '#eab308', bgColor: 'bg-yellow-500/20', borderColor: 'border-yellow-500/30' },
  high: { label: 'Hoch', color: '#ef4444', bgColor: 'bg-red-500/20', borderColor: 'border-red-500/30' }
};

// Impact-Stufen
export const impactLevels = {
  low: { label: 'Gering', color: '#22c55e', description: '-5% bis 0%' },
  medium: { label: 'Mittel', color: '#eab308', description: '-10% bis -5%' },
  high: { label: 'Hoch', color: '#f97316', description: '-20% bis -10%' },
  severe: { label: 'Kritisch', color: '#ef4444', description: '< -20%' }
};
