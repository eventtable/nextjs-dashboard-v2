export interface StockData {
  ticker: string;
  name: string;
  currency: string;
  exchange: string;
  sector?: string;
  industry?: string;
  description?: string;
  website?: string;
  country?: string;
  employees?: number;

  // Price
  currentPrice: number;
  previousClose: number;
  change: number;
  changePercent: number;
  open?: number;
  dayHigh?: number;
  dayLow?: number;
  volume?: number;
  avgVolume?: number;
  marketCap?: number;

  // Valuation
  kgv: number | null;               // P/E trailing
  forwardKgv: number | null;        // Forward P/E
  pegRatio?: number | null;
  priceToBook?: number | null;
  priceToSales?: number | null;
  evEbitda?: number | null;
  enterpriseValue?: number | null;

  // Earnings
  eps?: number | null;
  epsForward?: number | null;
  earningsDate?: string | null;
  revenueGrowth?: number | null;    // YoY revenue growth %
  earningsGrowth?: number | null;

  // Profitability
  grossMargin?: number | null;
  operatingMargin?: number | null;
  profitMargin?: number | null;
  returnOnEquity?: number | null;
  returnOnAssets?: number | null;
  ebitda?: number | null;
  freeCashflow?: number | null;

  // Balance sheet
  verschuldungsgrad?: number | null; // Debt/Equity
  currentRatio?: number | null;
  totalDebt?: number | null;
  totalCash?: number | null;

  // Dividends
  dividendenRendite: number;
  forwardDividendYield?: number | null;
  trailingDividendYield?: number | null;
  trailingDividendRate?: number | null;
  forwardDividendAmount?: number | null;
  payoutRatio?: number | null;
  fiveYearAvgDividendYield?: number | null;
  exDividendDate?: string | null;
  dividendDate?: string | null;

  // Technical
  rsi: number;
  beta?: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
  fiftyDayAverage?: number | null;
  twoHundredDayAverage?: number | null;
  trend?: 'up' | 'down' | 'neutral' | 'Aufwärtstrend' | 'Abwärtstrend' | 'Seitwärts';
  ma50?: number | null;
  ma200?: number | null;
  support?: number | null;
  resistance?: number | null;

  // Analyst
  targetMeanPrice?: number | null;
  targetHighPrice?: number | null;
  targetLowPrice?: number | null;
  recommendationKey?: string | null;
  numberOfAnalystOpinions?: number | null;

  // Chart
  chartData?: { date: string; close: number; volume?: number }[];
}
