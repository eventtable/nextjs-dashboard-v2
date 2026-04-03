'use client';

const BASE = '/api/trading';

async function apiGet<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${BASE}/${path}`, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  const res = await fetch(url.toString());
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ── Types ──────────────────────────────────────────────────────────────────────

export interface StockScore {
  ticker: string;
  price: number;
  signal: 'long' | 'short' | 'hold' | 'watch';
  total_score: number;
  horizons: { momentum: number; swing: number; position: number };
  reasons: string[];
  stop_loss: number;
  target_1: number;
  target_2: number;
}

export interface BacktestResult {
  ticker: string;
  profile: string;
  start_date: string;
  end_date: string;
  initial_capital: number;
  final_capital: number;
  total_return_pct: number;
  win_rate: number;
  total_trades: number;
  wins: number;
  losses: number;
  max_drawdown: number;
  avg_win_pct: number;
  avg_loss_pct: number;
  risk_reward: number;
  sharpe_approx: number;
  equity_curve: number[];
  trades: Array<{
    date?: string;
    entry_date?: string;
    exit_date?: string;
    direction?: string;
    entry_price?: number;
    exit_price?: number;
    pnl?: number;
    pnl_pct?: number;
    [key: string]: unknown;
  }>;
}

export interface AgentStats {
  total: number;
  wins: number;
  losses: number;
  win_rate: number;
  avg_win: number;
  avg_loss: number;
  best: number;
  worst: number;
  total_pnl: number;
  capital: number;
}

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useTrading() {
  const scan = async (tickers: string[], profile: string): Promise<StockScore[]> =>
    apiGet<StockScore[]>('scanner', { tickers: tickers.join(','), profile });

  const runBacktest = async (
    ticker: string,
    profile: string,
    period: string,
    capital: number,
  ): Promise<BacktestResult> =>
    apiPost<BacktestResult>('backtest', { ticker, profile, period, capital });

  const getAgentState = async (): Promise<{
    stats: AgentStats;
    weights: Record<string, number>;
    win_history: number[];
    recent_trades: Array<Record<string, unknown>>;
  }> => apiGet('agent/state');

  const getCrises = async (): Promise<
    Record<
      string,
      {
        name: string;
        start: string;
        end: string;
        type: string;
        drawdown: number;
        description: string;
      }
    >
  > => apiGet('crisis');

  const runCrisisBacktest = async (
    ticker: string,
    crisisId: string,
    profile: string,
  ): Promise<BacktestResult> =>
    apiPost<BacktestResult>('crisis/backtest', { ticker, crisis_id: crisisId, profile });

  const claudeAnalysis = async (
    ticker: string,
    profile: string,
    apiKey?: string,
  ): Promise<string> => {
    const res = await fetch(`${BASE}/claude-analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticker, profile, api_key: apiKey }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as { analysis?: string; text?: string; result?: string; summary?: string };
    return data.analysis ?? data.text ?? data.result ?? data.summary ?? JSON.stringify(data);
  };

  const resetAgent = async (): Promise<void> => {
    await apiPost('agent/reset', {});
  };

  return {
    scan,
    runBacktest,
    getAgentState,
    getCrises,
    runCrisisBacktest,
    claudeAnalysis,
    resetAgent,
  };
}
