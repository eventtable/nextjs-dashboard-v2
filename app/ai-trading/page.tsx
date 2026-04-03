'use client';

import React, { useState, useEffect, useCallback } from 'react';
import SharedHeader from '@/components/shared-header';
import {
  Brain, TrendingUp, Activity, Zap, RefreshCw, Play, RotateCcw,
  AlertTriangle, ChevronDown, ChevronUp, Target, Shield, BarChart2,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import {
  useTrading, ScanResult, AgentState, BacktestResult, CrisisEpisode,
} from '@/hooks/use-trading';

// ── Helpers ────────────────────────────────────────────────────────────────────

const PROFILES = ['momentum', 'swing', 'position'] as const;
type Profile = (typeof PROFILES)[number];

const PROFILE_LABELS: Record<Profile, string> = {
  momentum: 'Momentum',
  swing: 'Swing',
  position: 'Position',
};

const SIGNAL_COLORS: Record<string, string> = {
  long: 'text-green-400',
  STRONG_BUY: 'text-green-300',
  BUY: 'text-green-400',
  short: 'text-red-400',
  STRONG_SELL: 'text-red-300',
  SELL: 'text-red-400',
  hold: 'text-yellow-400',
  watch: 'text-yellow-400',
  NEUTRAL: 'text-gray-400',
};

const SIGNAL_BG: Record<string, string> = {
  long: 'bg-green-400/10 border-green-400/30',
  STRONG_BUY: 'bg-green-400/10 border-green-400/30',
  BUY: 'bg-green-400/10 border-green-400/30',
  short: 'bg-red-400/10 border-red-400/30',
  STRONG_SELL: 'bg-red-400/10 border-red-400/30',
  SELL: 'bg-red-400/10 border-red-400/30',
  hold: 'bg-yellow-400/10 border-yellow-400/30',
  watch: 'bg-yellow-400/10 border-yellow-400/30',
  NEUTRAL: 'bg-gray-400/10 border-gray-400/30',
};

function fmt(n: number, dec = 2) {
  return n?.toFixed(dec) ?? '—';
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, color = 'text-[#f0b90b]', icon: Icon,
}: { label: string; value: string; sub?: string; color?: string; icon: React.ElementType }) {
  return (
    <div className="glass-card rounded-xl p-4 border border-[#1a1f37]">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-gray-400 text-xs">{label}</span>
      </div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-0.5">{sub}</div>}
    </div>
  );
}

function WeightBar({ label, value, max = 0.4 }: { label: string; value: number; max?: number }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="flex items-center gap-2 mb-1.5">
      <span className="text-xs text-gray-400 w-20 shrink-0 uppercase">{label}</span>
      <div className="flex-1 bg-[#1a1f37] rounded-full h-2">
        <div
          className="h-2 rounded-full bg-[#f0b90b] transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-gray-300 w-10 text-right">{(value * 100).toFixed(1)}%</span>
    </div>
  );
}

function EquityCurve({ data }: { data: Array<{ date: string; value: number }> }) {
  if (!data || data.length < 2) return (
    <div className="flex items-center justify-center h-40 text-gray-500 text-sm">Keine Daten</div>
  );
  const start = data[0]?.value ?? 0;
  const end = data[data.length - 1]?.value ?? 0;
  const gain = end - start;
  const gainColor = gain >= 0 ? '#22c55e' : '#ef4444';
  return (
    <ResponsiveContainer width="100%" height={160}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1a1f37" />
        <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false}
          tickFormatter={(v: string) => v?.slice(5)} />
        <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} width={60}
          tickFormatter={(v: number) => `€${(v / 1000).toFixed(1)}k`} />
        <Tooltip
          contentStyle={{ background: '#0d1220', border: '1px solid #1a1f37', borderRadius: 8 }}
          labelStyle={{ color: '#9ca3af', fontSize: 11 }}
          formatter={(v: number) => [`€${v.toLocaleString('de-DE', { maximumFractionDigits: 0 })}`, 'Kapital']}
        />
        <Line type="monotone" dataKey="value" stroke={gainColor} dot={false} strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── Tabs ───────────────────────────────────────────────────────────────────────

type Tab = 'scanner' | 'agent' | 'backtest' | 'stats';

// ────────────────────── SCANNER TAB ───────────────────────────────────────────

function ScannerTab() {
  const { scan } = useTrading();
  const [tickers, setTickers] = useState('AAPL,MSFT,NVDA,SPY,QQQ,TSLA,AMZN,GOOGL');
  const [profile, setProfile] = useState<Profile>('momentum');
  const [results, setResults] = useState<ScanResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const runScan = async () => {
    setLoading(true);
    setError('');
    try {
      const list = tickers.split(',').map(t => t.trim()).filter(Boolean);
      const data = await scan(list, profile);
      setResults(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Scan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="glass-card rounded-xl p-4 border border-[#1a1f37]">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={tickers}
            onChange={e => setTickers(e.target.value)}
            placeholder="AAPL,MSFT,NVDA,..."
            className="flex-1 bg-[#0d1220] border border-[#1a1f37] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#f0b90b]/50"
          />
          <div className="flex gap-2">
            {PROFILES.map(p => (
              <button
                key={p}
                onClick={() => setProfile(p)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  profile === p
                    ? 'bg-[#f0b90b] text-black'
                    : 'bg-[#1a1f37] text-gray-400 hover:text-white'
                }`}
              >
                {PROFILE_LABELS[p]}
              </button>
            ))}
          </div>
          <button
            onClick={runScan}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-[#f0b90b] text-black rounded-lg text-sm font-semibold hover:bg-[#e0a900] transition-colors disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Scan
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-400/10 border border-red-400/30 rounded-lg text-red-400 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="glass-card rounded-xl border border-[#1a1f37] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1a1f37] text-gray-400 text-xs">
                  <th className="text-left px-4 py-3">Ticker</th>
                  <th className="text-right px-4 py-3">Score</th>
                  <th className="text-center px-4 py-3">Signal</th>
                  <th className="text-right px-4 py-3">RSI</th>
                  <th className="text-right px-4 py-3">Stop-Loss</th>
                  <th className="text-right px-4 py-3">Ziel 1</th>
                </tr>
              </thead>
              <tbody>
                {results.map(r => (
                  <tr key={r.ticker} className="border-b border-[#1a1f37]/50 hover:bg-[#1a1f37]/30 transition-colors">
                    <td className="px-4 py-3 font-bold text-white">{r.ticker}</td>
                    <td className={`px-4 py-3 text-right font-mono font-semibold ${r.score > 0 ? 'text-green-400' : r.score < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                      {r.score > 0 ? '+' : ''}{fmt(r.score, 1)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs border font-medium ${SIGNAL_BG[r.signal] ?? SIGNAL_BG.NEUTRAL} ${SIGNAL_COLORS[r.signal] ?? 'text-gray-400'}`}>
                        {r.signal}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-300 font-mono">
                      {typeof r.indicators?.rsi === 'number' ? fmt(r.indicators.rsi as number, 1) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-red-400 font-mono">
                      {r.recommendation?.stop_loss ? `$${fmt(r.recommendation.stop_loss, 2)}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-green-400 font-mono">
                      {r.recommendation?.target_1 ? `$${fmt(r.recommendation.target_1, 2)}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && results.length === 0 && (
        <div className="text-center py-12 text-gray-500 text-sm">
          Tickers eingeben und Scan starten
        </div>
      )}
    </div>
  );
}

// ────────────────────── AGENT TAB ─────────────────────────────────────────────

function AgentTab() {
  const { getAgentState, resetAgent } = useTrading();
  const [state, setState] = useState<AgentState | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAgentState();
      setState(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler');
    } finally {
      setLoading(false);
    }
  }, [getAgentState]);

  useEffect(() => { load(); }, [load]);

  const handleReset = async () => {
    if (!confirm('Agent zurücksetzen? Alle gelernten Gewichte gehen verloren.')) return;
    setResetting(true);
    try {
      await resetAgent();
      await load();
    } finally {
      setResetting(false);
    }
  };

  const s = state?.stats;

  return (
    <div className="space-y-4">
      {/* Header controls */}
      <div className="flex items-center justify-between">
        <p className="text-gray-400 text-sm">Gelernter Trading-Agent · Selbstoptimierend</p>
        <div className="flex gap-2">
          <button onClick={load} disabled={loading}
            className="p-2 rounded-lg bg-[#1a1f37] text-gray-400 hover:text-white transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={handleReset} disabled={resetting}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-400/10 border border-red-400/20 text-red-400 text-xs hover:bg-red-400/20 transition-colors">
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-400/10 border border-red-400/30 rounded-lg text-red-400 text-sm">
          <AlertTriangle className="w-4 h-4" /> {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={Activity} label="Trades gesamt" value={String(s?.total ?? 0)} color="text-blue-400" />
        <StatCard icon={TrendingUp} label="Win-Rate" value={`${fmt(s?.win_rate ?? 0, 1)}%`}
          color={(s?.win_rate ?? 0) >= 50 ? 'text-green-400' : 'text-red-400'} />
        <StatCard icon={Zap} label="Kapital" value={`€${((s?.capital ?? 100000) / 1000).toFixed(1)}k`}
          color="text-[#f0b90b]" />
        <StatCard icon={BarChart2} label="Gesamt P&L" value={`€${fmt(s?.total_pnl ?? 0, 0)}`}
          color={(s?.total_pnl ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}
          sub={`Ø Win: +${fmt(s?.avg_win ?? 0, 2)}%`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Weights */}
        <div className="glass-card rounded-xl p-4 border border-[#1a1f37]">
          <h3 className="text-sm font-semibold text-white mb-3">Indikator-Gewichte</h3>
          {state?.weights && Object.entries(state.weights).map(([k, v]) => (
            <WeightBar key={k} label={k} value={v} max={Math.max(...Object.values(state.weights)) * 1.1} />
          ))}
          {!state?.weights && <div className="text-gray-500 text-sm">Lädt…</div>}
        </div>

        {/* Recent predictions */}
        <div className="glass-card rounded-xl p-4 border border-[#1a1f37]">
          <h3 className="text-sm font-semibold text-white mb-3">Letzte Vorhersagen</h3>
          {state?.recent_predictions && state.recent_predictions.length > 0 ? (
            <div className="space-y-2 max-h-52 overflow-y-auto">
              {[...state.recent_predictions].reverse().map(p => (
                <div key={p.id} className="flex items-center justify-between text-xs py-1.5 border-b border-[#1a1f37]/50">
                  <span className="font-bold text-white">{p.ticker}</span>
                  <span className="text-gray-400">{p.profile}</span>
                  <span className={SIGNAL_COLORS[p.signal] ?? 'text-gray-400'}>{p.signal}</span>
                  <span className="text-gray-500">{p.timestamp?.slice(0, 10)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 text-sm">Noch keine Vorhersagen</div>
          )}
        </div>
      </div>

      {/* Open paper trades */}
      {state?.open_trades && state.open_trades.length > 0 && (
        <div className="glass-card rounded-xl p-4 border border-[#1a1f37]">
          <h3 className="text-sm font-semibold text-white mb-3">Offene Paper-Trades</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="text-gray-400 border-b border-[#1a1f37]">
                <th className="text-left py-2">Ticker</th>
                <th className="text-center py-2">Aktion</th>
                <th className="text-right py-2">Preis</th>
                <th className="text-right py-2">Stück</th>
                <th className="text-left py-2 pl-3">Profil</th>
              </tr></thead>
              <tbody>
                {state.open_trades.map(t => (
                  <tr key={t.id} className="border-b border-[#1a1f37]/40">
                    <td className="py-2 font-bold text-white">{t.ticker}</td>
                    <td className={`py-2 text-center font-medium ${t.action === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                      {t.action.toUpperCase()}
                    </td>
                    <td className="py-2 text-right text-gray-300">${fmt(t.price)}</td>
                    <td className="py-2 text-right text-gray-300">{t.shares}</td>
                    <td className="py-2 pl-3 text-gray-400">{t.profile}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ────────────────────── BACKTEST TAB ──────────────────────────────────────────

function BacktestTab() {
  const { runBacktest, getCrises, runCrisisBacktest } = useTrading();
  const [subTab, setSubTab] = useState<'backtest' | 'crisis'>('backtest');

  // Backtest state
  const [ticker, setTicker] = useState('AAPL');
  const [profile, setProfile] = useState<Profile>('momentum');
  const [startDate, setStartDate] = useState('2022-01-01');
  const [endDate, setEndDate] = useState('2023-12-31');
  const [capital, setCapital] = useState('10000');
  const [btResult, setBtResult] = useState<BacktestResult | null>(null);
  const [btLoading, setBtLoading] = useState(false);
  const [btError, setBtError] = useState('');

  // Crisis state
  const [crises, setCrises] = useState<CrisisEpisode[]>([]);
  const [crisisTicker, setCrisisTicker] = useState('SPY');
  const [crisisProfile, setCrisisProfile] = useState<Profile>('momentum');
  const [selectedCrisis, setSelectedCrisis] = useState('');
  const [crisisResult, setCrisisResult] = useState<BacktestResult | null>(null);
  const [crisisLoading, setCrisisLoading] = useState(false);
  const [crisisError, setCrisisError] = useState('');

  useEffect(() => {
    getCrises().then(data => {
      const list = Array.isArray(data) ? data : Object.entries(data as Record<string, CrisisEpisode>).map(([, v]) => v);
      setCrises(list);
    }).catch(() => {});
  }, [getCrises]);

  const runBt = async () => {
    setBtLoading(true); setBtError(''); setBtResult(null);
    try {
      const r = await runBacktest(ticker.toUpperCase(), profile, startDate, endDate, Number(capital));
      setBtResult(r);
    } catch (e) {
      setBtError(e instanceof Error ? e.message : 'Fehler');
    } finally {
      setBtLoading(false);
    }
  };

  const runCrisis = async () => {
    if (!selectedCrisis) { setCrisisError('Bitte eine Krisenperiode wählen'); return; }
    setCrisisLoading(true); setCrisisError(''); setCrisisResult(null);
    try {
      const r = await runCrisisBacktest(crisisTicker.toUpperCase(), selectedCrisis, crisisProfile, Number(capital));
      setCrisisResult(r);
    } catch (e) {
      setCrisisError(e instanceof Error ? e.message : 'Fehler');
    } finally {
      setCrisisLoading(false);
    }
  };

  const activeResult = subTab === 'backtest' ? btResult : crisisResult;

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex gap-2">
        {(['backtest', 'crisis'] as const).map(t => (
          <button key={t} onClick={() => setSubTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              subTab === t ? 'bg-[#f0b90b] text-black' : 'bg-[#1a1f37] text-gray-400 hover:text-white'
            }`}>
            {t === 'backtest' ? 'Walk-Forward' : 'Krisentraining'}
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="glass-card rounded-xl p-4 border border-[#1a1f37]">
        {subTab === 'backtest' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Ticker</label>
              <input value={ticker} onChange={e => setTicker(e.target.value)}
                className="w-full bg-[#0d1220] border border-[#1a1f37] rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-[#f0b90b]/50 uppercase" />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Profil</label>
              <select value={profile} onChange={e => setProfile(e.target.value as Profile)}
                className="w-full bg-[#0d1220] border border-[#1a1f37] rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none">
                {PROFILES.map(p => <option key={p} value={p}>{PROFILE_LABELS[p]}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Start</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                className="w-full bg-[#0d1220] border border-[#1a1f37] rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Ende</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                className="w-full bg-[#0d1220] border border-[#1a1f37] rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Kapital €</label>
              <input type="number" value={capital} onChange={e => setCapital(e.target.value)}
                className="w-full bg-[#0d1220] border border-[#1a1f37] rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none" />
            </div>
            <div className="flex items-end">
              <button onClick={runBt} disabled={btLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-1.5 bg-[#f0b90b] text-black rounded-lg text-sm font-semibold hover:bg-[#e0a900] disabled:opacity-50 transition-colors">
                {btLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Start
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Ticker</label>
              <input value={crisisTicker} onChange={e => setCrisisTicker(e.target.value)}
                className="w-full bg-[#0d1220] border border-[#1a1f37] rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none uppercase" />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Krisenperiode</label>
              <select value={selectedCrisis} onChange={e => setSelectedCrisis(e.target.value)}
                className="w-full bg-[#0d1220] border border-[#1a1f37] rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none">
                <option value="">— wählen —</option>
                {crises.map((c, i) => (
                  <option key={i} value={(c as unknown as Record<string, string>).id ?? c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Profil</label>
              <select value={crisisProfile} onChange={e => setCrisisProfile(e.target.value as Profile)}
                className="w-full bg-[#0d1220] border border-[#1a1f37] rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none">
                {PROFILES.map(p => <option key={p} value={p}>{PROFILE_LABELS[p]}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <button onClick={runCrisis} disabled={crisisLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-1.5 bg-[#f0b90b] text-black rounded-lg text-sm font-semibold hover:bg-[#e0a900] disabled:opacity-50 transition-colors">
                {crisisLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Training
              </button>
            </div>
          </div>
        )}
      </div>

      {(btError || crisisError) && (
        <div className="flex items-center gap-2 p-3 bg-red-400/10 border border-red-400/30 rounded-lg text-red-400 text-sm">
          <AlertTriangle className="w-4 h-4" /> {btError || crisisError}
        </div>
      )}

      {/* Results */}
      {activeResult && (
        <div className="space-y-4">
          {/* Metrics grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Gesamtrendite', value: `${activeResult.metrics.total_return_pct > 0 ? '+' : ''}${fmt(activeResult.metrics.total_return_pct)}%`, color: activeResult.metrics.total_return_pct >= 0 ? 'text-green-400' : 'text-red-400', icon: TrendingUp },
              { label: 'Win-Rate', value: `${fmt(activeResult.metrics.win_rate)}%`, color: activeResult.metrics.win_rate >= 50 ? 'text-green-400' : 'text-red-400', icon: Target },
              { label: 'Max Drawdown', value: `-${fmt(activeResult.metrics.max_drawdown_pct)}%`, color: 'text-red-400', icon: AlertTriangle },
              { label: 'Sharpe Ratio', value: fmt(activeResult.metrics.sharpe_approx), color: activeResult.metrics.sharpe_approx >= 1 ? 'text-green-400' : 'text-yellow-400', icon: Shield },
            ].map(m => (
              <StatCard key={m.label} {...m} sub={`${activeResult.metrics.wins}W / ${activeResult.metrics.losses}L`} />
            ))}
          </div>

          {/* Equity curve */}
          <div className="glass-card rounded-xl p-4 border border-[#1a1f37]">
            <h3 className="text-sm font-semibold text-white mb-3">Equity-Kurve</h3>
            <EquityCurve data={activeResult.equity_curve} />
          </div>

          {/* Trade list */}
          {activeResult.trades.length > 0 && (
            <div className="glass-card rounded-xl p-4 border border-[#1a1f37]">
              <h3 className="text-sm font-semibold text-white mb-3">
                Letzte Trades ({activeResult.trades.length})
              </h3>
              <div className="overflow-x-auto max-h-52 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead><tr className="text-gray-400 border-b border-[#1a1f37] sticky top-0 bg-[#0d1220]">
                    <th className="text-left py-2">Einstieg</th>
                    <th className="text-left py-2">Ausstieg</th>
                    <th className="text-center py-2">Dir.</th>
                    <th className="text-right py-2">P&L %</th>
                  </tr></thead>
                  <tbody>
                    {activeResult.trades.slice(-20).reverse().map((t, i) => (
                      <tr key={i} className="border-b border-[#1a1f37]/40">
                        <td className="py-1.5 text-gray-300">{t.entry_date?.slice(0, 10)}</td>
                        <td className="py-1.5 text-gray-300">{t.exit_date?.slice(0, 10)}</td>
                        <td className={`py-1.5 text-center font-medium ${t.direction === 'long' ? 'text-green-400' : 'text-red-400'}`}>
                          {t.direction?.toUpperCase()}
                        </td>
                        <td className={`py-1.5 text-right font-mono font-semibold ${(t.pnl_pct ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {(t.pnl_pct ?? 0) >= 0 ? '+' : ''}{fmt(t.pnl_pct ?? 0, 2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ────────────────────── STATS TAB ─────────────────────────────────────────────

function StatsTab() {
  const { getAgentState } = useTrading();
  const [state, setState] = useState<AgentState | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    getAgentState().then(setState).catch(() => {}).finally(() => setLoading(false));
  }, [getAgentState]);

  const winHistory = state?.stats
    ? [state.stats.win_rate] // simplified — real win_history comes from backend trades
    : [];

  const s = state?.stats;

  return (
    <div className="space-y-4">
      {loading && <div className="text-center py-8 text-gray-500 text-sm">Lädt…</div>}

      {s && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StatCard icon={Activity} label="Trades gesamt" value={String(s.total)} color="text-blue-400" />
            <StatCard icon={TrendingUp} label="Win-Rate" value={`${fmt(s.win_rate, 1)}%`}
              color={s.win_rate >= 50 ? 'text-green-400' : 'text-red-400'} />
            <StatCard icon={Zap} label="Kapital" value={`€${(s.capital / 1000).toFixed(1)}k`} color="text-[#f0b90b]" />
            <StatCard icon={Target} label="Ø Win" value={`+${fmt(s.avg_win, 2)}%`} color="text-green-400" />
            <StatCard icon={AlertTriangle} label="Ø Loss" value={`${fmt(s.avg_loss, 2)}%`} color="text-red-400" />
            <StatCard icon={BarChart2} label="Gesamt P&L" value={`€${fmt(s.total_pnl, 0)}`}
              color={s.total_pnl >= 0 ? 'text-green-400' : 'text-red-400'} />
          </div>

          {/* Profile breakdown */}
          {s.profile_breakdown && Object.keys(s.profile_breakdown).length > 0 && (
            <div className="glass-card rounded-xl p-4 border border-[#1a1f37]">
              <h3 className="text-sm font-semibold text-white mb-3">Profil-Analyse</h3>
              <div className="grid grid-cols-3 gap-3">
                {Object.entries(s.profile_breakdown).map(([p, d]) => (
                  <div key={p} className="bg-[#0d1220] rounded-lg p-3 text-center">
                    <div className="text-xs text-gray-400 uppercase mb-1">{p}</div>
                    <div className="text-lg font-bold text-[#f0b90b]">{fmt(d.win_rate, 1)}%</div>
                    <div className="text-xs text-gray-500">{d.trades} Trades</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Weights */}
          <div className="glass-card rounded-xl p-4 border border-[#1a1f37]">
            <h3 className="text-sm font-semibold text-white mb-3">Aktuelle Gewichte</h3>
            {state?.weights && Object.entries(state.weights).map(([k, v]) => (
              <WeightBar key={k} label={k} value={v} max={Math.max(...Object.values(state.weights)) * 1.1} />
            ))}
          </div>

          {/* Best/Worst */}
          <div className="grid grid-cols-2 gap-3">
            <div className="glass-card rounded-xl p-4 border border-[#1a1f37]">
              <div className="text-xs text-gray-400 mb-1">Bester Trade</div>
              <div className="text-2xl font-bold text-green-400">+{fmt(s.best, 2)}%</div>
            </div>
            <div className="glass-card rounded-xl p-4 border border-[#1a1f37]">
              <div className="text-xs text-gray-400 mb-1">Schlechtester Trade</div>
              <div className="text-2xl font-bold text-red-400">{fmt(s.worst, 2)}%</div>
            </div>
          </div>
        </>
      )}

      {!loading && !s && (
        <div className="text-center py-12 text-gray-500 text-sm">
          Noch keine Statistiken — Backtest oder Scanner starten
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'scanner', label: 'Scanner', icon: Activity },
  { id: 'agent',   label: 'Agent',   icon: Brain },
  { id: 'backtest', label: 'Backtest', icon: TrendingUp },
  { id: 'stats',  label: 'Statistik', icon: BarChart2 },
];

export default function AITradingPage() {
  const [tab, setTab] = useState<Tab>('scanner');

  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      <SharedHeader />
      <main className="lg:ml-64 p-4 lg:p-6 pt-20 lg:pt-6 max-w-6xl mx-auto">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Brain className="w-7 h-7 text-[#f0b90b]" />
            KI-Trading-Agent
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Selbstlernender Agent · Technische Analyse · Krisentraining · Walk-Forward-Backtest
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-[#0d1220] rounded-xl p-1 border border-[#1a1f37]">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  tab === t.id
                    ? 'bg-[#f0b90b] text-black'
                    : 'text-gray-400 hover:text-white hover:bg-[#1a1f37]/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        {tab === 'scanner'  && <ScannerTab />}
        {tab === 'agent'    && <AgentTab />}
        {tab === 'backtest' && <BacktestTab />}
        {tab === 'stats'    && <StatsTab />}
      </main>
    </div>
  );
}
