// Curated list of major stocks for instant search
// Format: { ticker, name, exchange, sector }
export const STOCK_LIST = [
  // === DEUTSCHE AKTIEN (DAX / MDAX) ===
  { ticker: 'ALV.DE',  name: 'Allianz SE',                exchange: 'XETRA',  sector: 'Versicherungen' },
  { ticker: 'SAP.DE',  name: 'SAP SE',                    exchange: 'XETRA',  sector: 'Software' },
  { ticker: 'SIE.DE',  name: 'Siemens AG',                exchange: 'XETRA',  sector: 'Industrie' },
  { ticker: 'MBG.DE',  name: 'Mercedes-Benz Group AG',    exchange: 'XETRA',  sector: 'Automobil' },
  { ticker: 'BMW.DE',  name: 'BMW AG',                    exchange: 'XETRA',  sector: 'Automobil' },
  { ticker: 'VOW3.DE', name: 'Volkswagen AG Vz.',         exchange: 'XETRA',  sector: 'Automobil' },
  { ticker: 'BAS.DE',  name: 'BASF SE',                   exchange: 'XETRA',  sector: 'Chemie' },
  { ticker: 'BAYN.DE', name: 'Bayer AG',                  exchange: 'XETRA',  sector: 'Pharma' },
  { ticker: 'DTE.DE',  name: 'Deutsche Telekom AG',       exchange: 'XETRA',  sector: 'Telekommunikation' },
  { ticker: 'DBK.DE',  name: 'Deutsche Bank AG',          exchange: 'XETRA',  sector: 'Banken' },
  { ticker: 'RWE.DE',  name: 'RWE AG',                    exchange: 'XETRA',  sector: 'Energie' },
  { ticker: 'ENR.DE',  name: 'Siemens Energy AG',         exchange: 'XETRA',  sector: 'Energie' },
  { ticker: 'ADS.DE',  name: 'Adidas AG',                 exchange: 'XETRA',  sector: 'Bekleidung' },
  { ticker: 'HNR1.DE', name: 'Hannover Rück SE',          exchange: 'XETRA',  sector: 'Versicherungen' },
  { ticker: 'MUV2.DE', name: 'Münchener Rück AG',         exchange: 'XETRA',  sector: 'Versicherungen' },
  { ticker: 'EOAN.DE', name: 'E.ON SE',                   exchange: 'XETRA',  sector: 'Energie' },
  { ticker: 'HEI.DE',  name: 'HeidelbergCement AG',       exchange: 'XETRA',  sector: 'Baustoffe' },
  { ticker: 'FRE.DE',  name: 'Fresenius SE & Co. KGaA',   exchange: 'XETRA',  sector: 'Gesundheit' },
  { ticker: 'FME.DE',  name: 'Fresenius Medical Care AG', exchange: 'XETRA',  sector: 'Gesundheit' },
  { ticker: 'CON.DE',  name: 'Continental AG',            exchange: 'XETRA',  sector: 'Automobil' },
  { ticker: 'DTG.DE',  name: 'Daimler Truck Holding AG',  exchange: 'XETRA',  sector: 'Automobil' },
  { ticker: 'BEI.DE',  name: 'Beiersdorf AG',             exchange: 'XETRA',  sector: 'Konsumgüter' },
  { ticker: 'SHL.DE',  name: 'Siemens Healthineers AG',   exchange: 'XETRA',  sector: 'Medizintechnik' },
  { ticker: 'MRK.DE',  name: 'Merck KGaA',                exchange: 'XETRA',  sector: 'Pharma' },
  { ticker: 'DHL.DE',  name: 'Deutsche Post DHL Group',   exchange: 'XETRA',  sector: 'Logistik' },
  { ticker: 'LIN.DE',  name: 'Linde plc',                 exchange: 'XETRA',  sector: 'Chemie' },
  { ticker: 'ZAL.DE',  name: 'Zalando SE',                exchange: 'XETRA',  sector: 'E-Commerce' },
  { ticker: 'VNA.DE',  name: 'Vonovia SE',                exchange: 'XETRA',  sector: 'Immobilien' },
  { ticker: 'PUM.DE',  name: 'PUMA SE',                   exchange: 'XETRA',  sector: 'Bekleidung' },
  { ticker: 'RHM.DE',  name: 'Rheinmetall AG',            exchange: 'XETRA',  sector: 'Rüstung' },
  { ticker: 'HFG.DE',  name: 'HelloFresh SE',             exchange: 'XETRA',  sector: 'Lebensmittel' },
  { ticker: 'SRT3.DE', name: 'Sartorius AG Vz.',          exchange: 'XETRA',  sector: 'Life Science' },
  { ticker: 'IFX.DE',  name: 'Infineon Technologies AG',  exchange: 'XETRA',  sector: 'Halbleiter' },
  { ticker: 'QIA.DE',  name: 'Qiagen N.V.',               exchange: 'XETRA',  sector: 'Biotech' },
  { ticker: 'MTX.DE',  name: 'MTU Aero Engines AG',       exchange: 'XETRA',  sector: 'Luftfahrt' },
  { ticker: 'DB1.DE',  name: 'Deutsche Börse AG',         exchange: 'XETRA',  sector: 'Finanzdienstleistungen' },
  { ticker: 'LEG.DE',  name: 'LEG Immobilien SE',         exchange: 'XETRA',  sector: 'Immobilien' },
  { ticker: 'AIR.PA',  name: 'Airbus SE',                 exchange: 'EURONEXT', sector: 'Luftfahrt' },

  // === EUROPÄISCHE AKTIEN ===
  { ticker: 'ASML',    name: 'ASML Holding N.V.',         exchange: 'NASDAQ', sector: 'Halbleiter' },
  { ticker: 'NESN.SW', name: 'Nestlé S.A.',               exchange: 'SIX',    sector: 'Lebensmittel' },
  { ticker: 'NOVN.SW', name: 'Novartis AG',               exchange: 'SIX',    sector: 'Pharma' },
  { ticker: 'ROG.SW',  name: 'Roche Holding AG',          exchange: 'SIX',    sector: 'Pharma' },
  { ticker: 'UBSG.SW', name: 'UBS Group AG',              exchange: 'SIX',    sector: 'Banken' },
  { ticker: 'SREN.SW', name: 'Swiss Re AG',               exchange: 'SIX',    sector: 'Versicherungen' },
  { ticker: 'ZURN.SW', name: 'Zurich Insurance Group',    exchange: 'SIX',    sector: 'Versicherungen' },
  { ticker: 'LONN.SW', name: 'Lonza Group AG',            exchange: 'SIX',    sector: 'Pharma' },
  { ticker: 'MC.PA',   name: 'LVMH Moët Hennessy',        exchange: 'EURONEXT', sector: 'Luxusgüter' },
  { ticker: 'OR.PA',   name: "L'Oréal S.A.",              exchange: 'EURONEXT', sector: 'Kosmetik' },
  { ticker: 'SAN.PA',  name: 'Sanofi S.A.',               exchange: 'EURONEXT', sector: 'Pharma' },
  { ticker: 'BNP.PA',  name: 'BNP Paribas S.A.',          exchange: 'EURONEXT', sector: 'Banken' },
  { ticker: 'TTE.PA',  name: 'TotalEnergies SE',          exchange: 'EURONEXT', sector: 'Energie' },
  { ticker: 'SU.PA',   name: 'Schneider Electric SE',     exchange: 'EURONEXT', sector: 'Industrie' },
  { ticker: 'KER.PA',  name: 'Kering S.A.',               exchange: 'EURONEXT', sector: 'Luxusgüter' },
  { ticker: 'CS.PA',   name: 'AXA S.A.',                  exchange: 'EURONEXT', sector: 'Versicherungen' },
  { ticker: 'SHL.SW',  name: 'Schindler Holding AG',      exchange: 'SIX',    sector: 'Industrie' },
  { ticker: 'INGA.AS', name: 'ING Groep N.V.',            exchange: 'AEX',    sector: 'Banken' },
  { ticker: 'PHIA.AS', name: 'Philips N.V.',              exchange: 'AEX',    sector: 'Medizintechnik' },
  { ticker: 'HEIA.AS', name: 'Heineken N.V.',             exchange: 'AEX',    sector: 'Getränke' },
  { ticker: 'RIO',     name: 'Rio Tinto plc',             exchange: 'NYSE',   sector: 'Rohstoffe' },
  { ticker: 'BP',      name: 'BP plc',                    exchange: 'NYSE',   sector: 'Energie' },
  { ticker: 'SHEL',    name: 'Shell plc',                 exchange: 'NYSE',   sector: 'Energie' },
  { ticker: 'AZN',     name: 'AstraZeneca plc',           exchange: 'NASDAQ', sector: 'Pharma' },
  { ticker: 'GSK',     name: 'GSK plc',                   exchange: 'NYSE',   sector: 'Pharma' },
  { ticker: 'NVS',     name: 'Novartis AG (ADR)',         exchange: 'NYSE',   sector: 'Pharma' },

  // === US MEGA-CAP ===
  { ticker: 'AAPL',  name: 'Apple Inc.',                  exchange: 'NASDAQ', sector: 'Technologie' },
  { ticker: 'MSFT',  name: 'Microsoft Corporation',       exchange: 'NASDAQ', sector: 'Technologie' },
  { ticker: 'NVDA',  name: 'NVIDIA Corporation',          exchange: 'NASDAQ', sector: 'Halbleiter' },
  { ticker: 'GOOGL', name: 'Alphabet Inc. (Class A)',     exchange: 'NASDAQ', sector: 'Technologie' },
  { ticker: 'GOOG',  name: 'Alphabet Inc. (Class C)',     exchange: 'NASDAQ', sector: 'Technologie' },
  { ticker: 'AMZN',  name: 'Amazon.com Inc.',             exchange: 'NASDAQ', sector: 'E-Commerce' },
  { ticker: 'META',  name: 'Meta Platforms Inc.',         exchange: 'NASDAQ', sector: 'Social Media' },
  { ticker: 'TSLA',  name: 'Tesla Inc.',                  exchange: 'NASDAQ', sector: 'Automobil' },
  { ticker: 'BRK.B', name: 'Berkshire Hathaway (B)',      exchange: 'NYSE',   sector: 'Finanzen' },
  { ticker: 'V',     name: 'Visa Inc.',                   exchange: 'NYSE',   sector: 'Finanzen' },
  { ticker: 'JPM',   name: 'JPMorgan Chase & Co.',        exchange: 'NYSE',   sector: 'Banken' },
  { ticker: 'WMT',   name: 'Walmart Inc.',                exchange: 'NYSE',   sector: 'Einzelhandel' },
  { ticker: 'MA',    name: 'Mastercard Inc.',             exchange: 'NYSE',   sector: 'Finanzen' },
  { ticker: 'LLY',   name: 'Eli Lilly and Company',       exchange: 'NYSE',   sector: 'Pharma' },
  { ticker: 'AVGO',  name: 'Broadcom Inc.',               exchange: 'NASDAQ', sector: 'Halbleiter' },
  { ticker: 'XOM',   name: 'Exxon Mobil Corporation',     exchange: 'NYSE',   sector: 'Energie' },
  { ticker: 'ORCL',  name: 'Oracle Corporation',          exchange: 'NYSE',   sector: 'Software' },
  { ticker: 'COST',  name: 'Costco Wholesale Corporation', exchange: 'NASDAQ', sector: 'Einzelhandel' },
  { ticker: 'PG',    name: 'Procter & Gamble Company',    exchange: 'NYSE',   sector: 'Konsumgüter' },
  { ticker: 'JNJ',   name: 'Johnson & Johnson',           exchange: 'NYSE',   sector: 'Pharma' },
  { ticker: 'HD',    name: 'The Home Depot Inc.',         exchange: 'NYSE',   sector: 'Einzelhandel' },
  { ticker: 'ABBV',  name: 'AbbVie Inc.',                 exchange: 'NYSE',   sector: 'Pharma' },
  { ticker: 'BAC',   name: 'Bank of America Corporation', exchange: 'NYSE',   sector: 'Banken' },
  { ticker: 'KO',    name: 'The Coca-Cola Company',       exchange: 'NYSE',   sector: 'Getränke' },
  { ticker: 'MCD',   name: "McDonald's Corporation",      exchange: 'NYSE',   sector: 'Gastronomie' },
  { ticker: 'CSCO',  name: 'Cisco Systems Inc.',          exchange: 'NASDAQ', sector: 'Netzwerke' },
  { ticker: 'CRM',   name: 'Salesforce Inc.',             exchange: 'NYSE',   sector: 'Software' },
  { ticker: 'AMD',   name: 'Advanced Micro Devices Inc.', exchange: 'NASDAQ', sector: 'Halbleiter' },
  { ticker: 'INTC',  name: 'Intel Corporation',           exchange: 'NASDAQ', sector: 'Halbleiter' },
  { ticker: 'QCOM',  name: 'Qualcomm Incorporated',       exchange: 'NASDAQ', sector: 'Halbleiter' },
  { ticker: 'TXN',   name: 'Texas Instruments Inc.',      exchange: 'NASDAQ', sector: 'Halbleiter' },
  { ticker: 'ADBE',  name: 'Adobe Inc.',                  exchange: 'NASDAQ', sector: 'Software' },
  { ticker: 'NFLX',  name: 'Netflix Inc.',                exchange: 'NASDAQ', sector: 'Streaming' },
  { ticker: 'PYPL',  name: 'PayPal Holdings Inc.',        exchange: 'NASDAQ', sector: 'Finanzen' },
  { ticker: 'NOW',   name: 'ServiceNow Inc.',             exchange: 'NYSE',   sector: 'Software' },
  { ticker: 'PANW',  name: 'Palo Alto Networks Inc.',     exchange: 'NASDAQ', sector: 'Cybersecurity' },
  { ticker: 'NVO',   name: 'Novo Nordisk A/S (ADR)',      exchange: 'NYSE',   sector: 'Pharma' },
  { ticker: 'TSM',   name: 'Taiwan Semiconductor (ADR)',  exchange: 'NYSE',   sector: 'Halbleiter' },
  { ticker: 'SHOP',  name: 'Shopify Inc.',                exchange: 'NYSE',   sector: 'E-Commerce' },
  { ticker: 'PLTR',  name: 'Palantir Technologies Inc.',  exchange: 'NASDAQ', sector: 'Datenwissenschaft' },
  { ticker: 'SOFI',  name: 'SoFi Technologies Inc.',      exchange: 'NASDAQ', sector: 'Fintech' },
];

/**
 * Search the curated stock list by name or ticker (case-insensitive).
 * Returns up to `limit` matches sorted by relevance.
 */
export function searchLocal(query: string, limit = 8) {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const scored = STOCK_LIST.map((s) => {
    const tickerLower = s.ticker.toLowerCase();
    const nameLower   = s.name.toLowerCase();

    // Exact ticker match → highest priority
    if (tickerLower === q) return { ...s, score: 100 };
    // Ticker starts with query
    if (tickerLower.startsWith(q)) return { ...s, score: 90 };
    // Name starts with query
    if (nameLower.startsWith(q)) return { ...s, score: 80 };
    // Ticker contains query
    if (tickerLower.includes(q)) return { ...s, score: 60 };
    // Name word starts with query
    if (nameLower.split(/\s+/).some((w) => w.startsWith(q))) return { ...s, score: 50 };
    // Name contains query
    if (nameLower.includes(q)) return { ...s, score: 40 };

    return null;
  })
  .filter(Boolean) as (typeof STOCK_LIST[0] & { score: number })[];

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ score: _score, ...s }) => s);
}
