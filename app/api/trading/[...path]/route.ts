import { NextRequest, NextResponse } from 'next/server';

const ML_API_URL = process.env.ML_API_URL || '';

type RouteContext = { params: { path: string[] } };

async function proxyRequest(req: NextRequest, context: RouteContext): Promise<NextResponse> {
  const { path } = context.params;
  const pathStr = path.join('/');
  const { searchParams } = new URL(req.url);
  const queryStr = searchParams.toString();
  const targetUrl = `${ML_API_URL}/api/${pathStr}${queryStr ? `?${queryStr}` : ''}`;

  if (ML_API_URL) {
    try {
      const init: RequestInit = {
        method: req.method,
        headers: { 'Content-Type': 'application/json' },
      };

      if (req.method !== 'GET' && req.method !== 'HEAD') {
        const body = await req.text();
        if (body) init.body = body;
      }

      const res = await fetch(targetUrl, {
        ...init,
        signal: AbortSignal.timeout(55_000),
      });
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    } catch (err) {
      console.error('Trading API proxy error:', err);
      // Fall through to mock responses
    }
  }

  // ── Mock responses when backend is not available ──────────────────────────
  const endpoint = pathStr;

  if (endpoint === 'health') {
    return NextResponse.json({ status: 'mock', version: '1.0.0' });
  }

  if (endpoint === 'search') {
    const q = (searchParams.get('q') || '').toLowerCase();
    const all = [
      { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ' },
      { symbol: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ' },
      { symbol: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ' },
      { symbol: 'GOOGL', name: 'Alphabet Inc.', exchange: 'NASDAQ' },
      { symbol: 'AMZN', name: 'Amazon.com Inc.', exchange: 'NASDAQ' },
      { symbol: 'META', name: 'Meta Platforms Inc.', exchange: 'NASDAQ' },
      { symbol: 'TSLA', name: 'Tesla Inc.', exchange: 'NASDAQ' },
      { symbol: 'SPY', name: 'SPDR S&P 500 ETF', exchange: 'NYSE' },
      { symbol: 'SAP.DE', name: 'SAP SE', exchange: 'XETRA' },
      { symbol: 'BMW.DE', name: 'BMW AG', exchange: 'XETRA' },
      { symbol: 'SIE.DE', name: 'Siemens AG', exchange: 'XETRA' },
      { symbol: 'ENR.DE', name: 'Siemens Energy AG', exchange: 'XETRA' },
      { symbol: 'VOW3.DE', name: 'Volkswagen AG', exchange: 'XETRA' },
    ];
    return NextResponse.json(all.filter(s =>
      s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
    ).slice(0, 6));
  }

  if (endpoint === 'crisis') {
    return NextResponse.json([
      { id: 'dot_com', name: 'Dot-Com Crash', start: '2000-03-01', end: '2002-10-09', severity: 'extreme', description: 'Platzen der Technologieblase' },
      { id: 'financial_crisis', name: 'Finanzkrise 2008', start: '2007-10-09', end: '2009-03-09', severity: 'extreme', description: 'Subprime-Krise' },
      { id: 'flash_crash', name: 'Flash Crash 2010', start: '2010-05-06', end: '2010-07-02', severity: 'high', description: 'Blitzcrash im US-Aktienmarkt' },
      { id: 'euro_debt', name: 'Eurokrise', start: '2011-07-22', end: '2011-10-04', severity: 'high', description: 'Europäische Schuldenkrise' },
      { id: 'oil_crash', name: 'Ölpreiscrash', start: '2014-06-20', end: '2016-02-11', severity: 'medium', description: 'Ölpreis fiel stark' },
      { id: 'covid', name: 'COVID-19 Crash', start: '2020-02-19', end: '2020-03-23', severity: 'extreme', description: 'Pandemiebedingter Markteinbruch' },
      { id: 'inflation_shock', name: 'Inflationsschock', start: '2022-01-03', end: '2022-10-13', severity: 'high', description: 'Aggressive Zinserhöhungen' },
      { id: 'svb_crisis', name: 'SVB-Bankenkrise', start: '2023-03-08', end: '2023-03-17', severity: 'medium', description: 'Zusammenbruch der Silicon Valley Bank' },
    ]);
  }

  if (endpoint === 'scanner') {
    const tickers = (searchParams.get('tickers') || 'AAPL,MSFT').split(',');
    const profile = searchParams.get('profile') || 'momentum';
    const signals = ['long', 'short', 'watch', 'long', 'hold', 'short', 'long', 'watch'];
    const signalLabels: Record<string, string> = { long: 'STRONG_BUY', short: 'SELL', watch: 'NEUTRAL', hold: 'NEUTRAL' };
    return NextResponse.json(
      tickers.map((ticker, i) => {
        const score = parseFloat(((Math.random() * 16) - 8).toFixed(2));
        const sig = score > 4 ? 'long' : score < -4 ? 'short' : Math.abs(score) < 1.5 ? 'hold' : 'watch';
        const price = 100 + Math.random() * 400;
        const atr = price * 0.018;
        return {
          ticker: ticker.trim().toUpperCase(),
          score,
          signal: sig,
          profile,
          indicators: {
            price: parseFloat(price.toFixed(2)),
            rsi: parseFloat((30 + Math.random() * 50).toFixed(1)),
            macd_hist: parseFloat(((Math.random() - 0.5) * 0.4).toFixed(4)),
            adx: parseFloat((15 + Math.random() * 35).toFixed(1)),
            supertrend_direction: score > 0 ? 1 : -1,
          },
          recommendation: {
            signal: signalLabels[sig] ?? 'NEUTRAL',
            score,
            stop_loss: parseFloat((price - 1.5 * atr).toFixed(2)),
            target_1: parseFloat((price + 2.0 * atr).toFixed(2)),
            target_2: parseFloat((price + 4.0 * atr).toFixed(2)),
            reasons: ['Demo-Modus: Backend nicht verbunden'],
            profile,
          },
        };
      })
    );
  }

  if (endpoint === 'predict') {
    const ticker = (searchParams.get('ticker') || 'AAPL').toUpperCase();
    const profile = searchParams.get('profile') || 'momentum';
    return NextResponse.json({
      id: `mock-${Date.now()}`,
      ticker,
      profile,
      score: 55 + Math.random() * 20,
      signal: 'NEUTRAL',
      confidence: 0.5,
      timestamp: new Date().toISOString(),
      indicators: { rsi: 55, macd_hist: 0.1, ema50: 180, ema200: 175, adx: 25, price: 185 },
      recommendation: { signal: 'NEUTRAL', score: 55, reasons: ['Mock-Daten: Backend nicht verbunden'], profile },
    });
  }

  if (endpoint === 'agent/state') {
    return NextResponse.json({
      stats: {
        total: 47, wins: 28, losses: 19,
        win_rate: 59.6, avg_win: 2.34, avg_loss: -1.87,
        best: 8.12, worst: -4.53,
        total_pnl: 1840.50, capital: 101840.50,
        profile_breakdown: {
          momentum: { trades: 22, win_rate: 63.6 },
          swing:    { trades: 18, win_rate: 55.6 },
          position: { trades:  7, win_rate: 57.1 },
        },
      },
      weights: { rsi: 0.23, macd: 0.18, ema: 0.21, supertrend: 0.16, fib: 0.10, volume: 0.08, bb: 0.04 },
      recent_predictions: [
        { id: 'mock-1', ticker: 'AAPL', profile: 'momentum', score: 5.2, signal: 'long', confidence: 0.72, timestamp: new Date(Date.now() - 3600000).toISOString() },
        { id: 'mock-2', ticker: 'NVDA', profile: 'swing', score: -3.1, signal: 'short', confidence: 0.54, timestamp: new Date(Date.now() - 7200000).toISOString() },
        { id: 'mock-3', ticker: 'SPY', profile: 'position', score: 1.8, signal: 'watch', confidence: 0.38, timestamp: new Date(Date.now() - 10800000).toISOString() },
      ],
      open_trades: [
        { id: 'trade-1', ticker: 'AAPL', action: 'buy', shares: 10, price: 182.50, profile: 'momentum', timestamp: new Date(Date.now() - 86400000).toISOString() },
      ],
      created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  if (endpoint === 'agent/reset') {
    return NextResponse.json({ success: true, message: 'Agent zurückgesetzt (Demo)' });
  }

  if (endpoint === 'agent/train') {
    return NextResponse.json({ started: true, message: 'Training gestartet (Demo)' });
  }

  if (endpoint === 'agent/train/status') {
    return NextResponse.json({
      running: false,
      error: null,
      progress: null,
    });
  }

  if (endpoint === 'backtest' || endpoint === 'crisis/backtest') {
    const now = new Date();
    let capital = 10000;
    const equity_curve = Array.from({ length: 60 }, (_, i) => {
      capital *= (1 + (Math.random() - 0.42) * 0.025);
      return {
        date: new Date(now.getTime() - (59 - i) * 86400000).toISOString().split('T')[0],
        value: parseFloat(capital.toFixed(2)),
      };
    });
    const finalCapital = equity_curve[equity_curve.length - 1].value;
    const totalReturn = parseFloat(((finalCapital - 10000) / 10000 * 100).toFixed(2));
    const wins = 8 + Math.floor(Math.random() * 6);
    const losses = 4 + Math.floor(Math.random() * 4);
    const trades = Array.from({ length: wins + losses }, (_, i) => {
      const isWin = i < wins;
      const pnl = isWin ? parseFloat((1 + Math.random() * 4).toFixed(2)) : parseFloat((-0.5 - Math.random() * 2.5).toFixed(2));
      const entryDate = new Date(now.getTime() - (wins + losses - i) * 3 * 86400000).toISOString().split('T')[0];
      const exitDate = new Date(new Date(entryDate).getTime() + (2 + Math.floor(Math.random() * 10)) * 86400000).toISOString().split('T')[0];
      return { entry_date: entryDate, exit_date: exitDate, direction: Math.random() > 0.3 ? 'long' : 'short', entry_price: 150 + Math.random() * 100, exit_price: 150 + Math.random() * 100, pnl_pct: pnl, profit: isWin, hold_days: 2 + Math.floor(Math.random() * 10) };
    });
    return NextResponse.json({
      equity_curve,
      trades,
      metrics: {
        total_return_pct: totalReturn,
        final_capital: finalCapital,
        initial_capital: 10000,
        win_rate: parseFloat((wins / (wins + losses) * 100).toFixed(1)),
        total_trades: wins + losses,
        wins,
        losses,
        avg_win_pct: parseFloat((1.5 + Math.random() * 2).toFixed(2)),
        avg_loss_pct: parseFloat((-0.8 - Math.random() * 1.5).toFixed(2)),
        risk_reward: parseFloat((1.2 + Math.random() * 1.5).toFixed(2)),
        max_drawdown_pct: parseFloat((3 + Math.random() * 12).toFixed(2)),
        sharpe_approx: parseFloat((0.4 + Math.random() * 1.2).toFixed(3)),
        weights_final: {},
      },
      config: {},
    });
  }

  if (endpoint === 'claude-analysis') {
    const body = await req.json().catch(() => ({}));
    return NextResponse.json({
      ticker: body.ticker || 'AAPL',
      signal: 'HALTEN',
      summary: 'Backend nicht verbunden. Dies ist eine Mock-Analyse.',
      reasons: ['Keine Live-Daten verfügbar', 'Backend-Server starten für echte Analyse', 'Technische Indikatoren konnten nicht abgerufen werden'],
      risk_level: 'mittel',
      confidence: 0.3,
      profile: body.profile || 'momentum',
      indicators: {},
    });
  }

  // Default fallback
  return NextResponse.json({ status: 'mock', message: 'Backend not connected', endpoint }, { status: 200 });
}

export async function GET(req: NextRequest, context: RouteContext) {
  return proxyRequest(req, context);
}

export async function POST(req: NextRequest, context: RouteContext) {
  return proxyRequest(req, context);
}

export async function PUT(req: NextRequest, context: RouteContext) {
  return proxyRequest(req, context);
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  return proxyRequest(req, context);
}
