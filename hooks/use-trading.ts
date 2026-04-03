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

export interface ScanResult {
  ticker: string;
  score: number;
  signal: string;
  profile: string;
  indicators: Record<string, number | string | boolean | Record<string, number>>;
  recommendation: {
    signal: string;
    score: number;
    stop_loss?: number;
    target_1?: number;
    target_2?: number;
    reasons: string[];
    profile: string;
  };
}

export interface EquityPoint {
  date: string;
  value: number;
}

export interface BacktestTrade {
  entry_date?: string;
  exit_date?: string;
  direction?: string;
  entry_price?: number;
  exit_price?: number;
  pnl_pct?: number;
  profit?: boolean;
  hold_days?: number;
  [key: string]: unknown;
}

export interface BacktestMetrics {
  total_return_pct: number;
  final_capital: number;
  initial_capital: number;
  win_rate: number;
  total_trades: number;
  wins: number;
  losses: number;
  avg_win_pct: number;
  avg_loss_pct: number;
  risk_reward: number;
  max_drawdown_pct: number;
  sharpe_approx: number;
  weights_final?: Record<string, number>;
  error?: string;
}

export interface BacktestResult {
  equity_curve: EquityPoint[];
  trades: BacktestTrade[];
  metrics: BacktestMetrics;
  config: {
    ticker?: string;
    profile?: string;
    start_date?: string;
    end_date?: string;
    initial_capital?: number;
    crisis_epoch?: string;
  };
  crisis?: Record<string, unknown>;
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
  profile_breakdown?: Record<string, { trades: number; win_rate: number }>;
}

export interface AgentState {
  stats: AgentStats;
  weights: Record<string, number>;
  recent_predictions: Array<{
    id: string;
    ticker: string;
    profile: string;
    score: number;
    signal: string;
    confidence: number;
    timestamp: string;
    outcome?: number;
  }>;
  open_trades: Array<{
    id: string;
    ticker: string;
    action: string;
    shares: number;
    price: number;
    profile: string;
    timestamp: string;
  }>;
  created_at: string;
  updated_at: string;
}

export interface CrisisEpisode {
  name: string;
  start: string;
  end: string;
  type: string;
  drawdown: number;
  desc: string;
}

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useTrading() {
  const scan = async (tickers: string[], profile: string): Promise<ScanResult[]> =>
    apiGet<ScanResult[]>('scanner', { tickers: tickers.join(','), profile });

  const runBacktest = async (
    ticker: string,
    profile: string,
    startDate: string,
    endDate: string,
    capital: number,
  ): Promise<BacktestResult> =>
    apiPost<BacktestResult>('backtest', {
      ticker,
      profile,
      start_date: startDate,
      end_date: endDate,
      initial_capital: capital,
    });

  const getAgentState = async (): Promise<AgentState> => apiGet('agent/state');

  const getCrises = async (): Promise<CrisisEpisode[]> => apiGet('crisis');

  const runCrisisBacktest = async (
    ticker: string,
    crisisId: string,
    profile: string,
    capital: number,
  ): Promise<BacktestResult> =>
    apiPost<BacktestResult>('crisis/backtest', {
      ticker,
      crisis_id: crisisId,
      profile,
      capital,
    });

  const claudeAnalysis = async (
    ticker: string,
    profile: string,
    context?: string,
  ): Promise<{ ticker: string; profile: string; analysis: string; stop_loss: number; target_1: number; target_2: number }> =>
    apiPost('claude-analysis', { ticker, profile, context: context || '' });

  const resetAgent = async (): Promise<void> => {
    await apiPost('agent/reset', {});
  };

  const startTraining = async (opts?: {
    fromDate?: string;
    toDate?: string;
    windowMonths?: number;
    stepMonths?: number;
  }): Promise<{ started: boolean; already_running?: boolean; message?: string }> =>
    apiPost('agent/train', {
      from_date: opts?.fromDate ?? '2002-01-01',
      to_date: opts?.toDate ?? '2026-03-01',
      window_months: opts?.windowMonths ?? 6,
      step_months: opts?.stepMonths ?? 3,
    });

  const getTrainingStatus = async (): Promise<{
    running: boolean;
    error: string | null;
    progress: {
      window: number;
      total: number;
      pct: number;
      updated_at: string;
      total_trades: number;
      total_wins: number;
      win_rate: number;
      errors: number;
      last_window: string;
    } | null;
  }> => apiGet('agent/train/status');

  return {
    scan,
    runBacktest,
    getAgentState,
    getCrises,
    runCrisisBacktest,
    claudeAnalysis,
    resetAgent,
    startTraining,
    getTrainingStatus,
  };
}
