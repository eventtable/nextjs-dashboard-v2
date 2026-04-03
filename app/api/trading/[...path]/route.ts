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

      const res = await fetch(targetUrl, init);
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
    return NextResponse.json(
      tickers.map((ticker, i) => ({
        ticker: ticker.trim().toUpperCase(),
        score: 45 + Math.random() * 40,
        signal: ['NEUTRAL', 'BUY', 'STRONG_BUY', 'SELL'][i % 4],
        profile,
        indicators: { rsi: 50 + Math.random() * 20, macd_hist: (Math.random() - 0.5) * 0.5, adx: 20 + Math.random() * 20 },
        recommendation: { signal: 'NEUTRAL', score: 55, reasons: ['Keine Live-Daten verfügbar'], profile },
      }))
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
      stats: { win_rate: 0, prediction_win_rate: 0, total_return: 0, predictions_count: 0, open_trades: 0, closed_trades: 0, avg_win: 0, avg_loss: 0, learning_events: 0 },
      weights: { momentum: {}, swing: {}, position: {} },
      recent_predictions: [],
      open_trades: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  if (endpoint === 'backtest' || endpoint === 'crisis/backtest') {
    const now = new Date();
    const points = Array.from({ length: 30 }, (_, i) => ({
      date: new Date(now.getTime() - (29 - i) * 86400000).toISOString().split('T')[0],
      value: 10000 + (Math.random() - 0.4) * 500 * (i + 1),
    }));
    return NextResponse.json({
      equity_curve: points,
      trades: [],
      metrics: { total_return_pct: -5 + Math.random() * 20, max_drawdown_pct: 5 + Math.random() * 10, sharpe: 0.5 + Math.random(), win_rate: 0.4 + Math.random() * 0.3, trades_count: Math.floor(Math.random() * 20), error: 'Mock data - backend not connected' },
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
