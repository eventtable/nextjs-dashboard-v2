'use client';

import React, { useState, useEffect, useCallback } from 'react';
import SharedHeader from '@/components/shared-header';
import {
  Brain, TrendingUp, Activity, Zap, RefreshCw, Play, RotateCcw,
  AlertTriangle, ChevronDown, ChevronUp, Target, Shield, BarChart2, Cpu,
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

const PROFILE_INFO: Record<Profile, { title: string; horizon: string; desc: string; indicators: string; action: string }> = {
  momentum: {
    title: 'Momentum-Trading',
    horizon: '1–5 Tage',
    desc: 'Nutzt kurzfristige Kursdynamik. Du handelst die Kraft einer Bewegung — wenn etwas stark steigt, steigt es oft weiter.',
    indicators: 'RSI (Überkauft/Überverkauft) · MACD-Histogramm · Volumen-Spike · Bollinger Bänder · Stochastik',
    action: 'Ziel 1 erreicht → Hälfte verkaufen, Rest mit Trailing-Stop laufen lassen. Ziel 2 → Vollständig aussteigen. Stop-Loss wird IMMER gesetzt — kein Trade ohne Absicherung.',
  },
  swing: {
    title: 'Swing-Trading',
    horizon: '1–8 Wochen',
    desc: 'Handelt Kursschwingungen zwischen Unterstützung und Widerstand. Ideal für Berufstätige — kein tägliches Monitoring nötig.',
    indicators: 'EMA9/EMA21 Crossover · Fibonacci-Retracement · Supertrend · CCI · 52-Wochen-Hochs/Tiefs',
    action: 'Ziel 1 erreicht → ⅓ Gewinn mitnehmen, Stop-Loss auf Einstieg ziehen (Break-Even). Ziel 2 → ⅓ weitere Gewinne. Rest läuft mit engem Trailing-Stop.',
  },
  position: {
    title: 'Positionstrading',
    horizon: '3–12 Monate',
    desc: 'Setzt auf den übergeordneten Trend. Wenige, qualitativ hochwertige Signale. Ideal für Buy-and-Hold mit technischem Timing.',
    indicators: 'EMA50/EMA200 (Golden/Death Cross) · Supertrend · ADX (Trendstärke) · Wöchentliche MACD',
    action: 'Ziel 1 erreicht → Position halten, Stop-Loss nachziehen. Erst verkaufen wenn EMA50 unter EMA200 fällt (Death Cross) oder Supertrend dreht.',
  },
};

const SIGNAL_GUIDE = [
  { signal: 'long', label: 'LONG', color: 'text-green-400', bg: 'bg-green-400/10 border-green-400/30', desc: 'Starkes Kaufsignal — Score > +4. Alle Indikatoren bullisch ausgerichtet.' },
  { signal: 'watch', label: 'BEOBACHTEN', color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/30', desc: 'Schwaches Signal — Score ±1.5 bis ±4. Warten auf Bestätigung, noch nicht handeln.' },
  { signal: 'hold', label: 'HALTEN', color: 'text-gray-400', bg: 'bg-gray-400/10 border-gray-400/30', desc: 'Neutral — Score < ±1.5. Kein klares Signal. Offene Positionen halten, keine neuen eingehen.' },
  { signal: 'short', label: 'SHORT', color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/30', desc: 'Verkaufs-/Leerverkaufssignal — Score < −4. Bestehende Positionen reduzieren oder absichern.' },
];

const SIGNAL_COLORS: Record<string, string> = {
  long: 'text-green-400', STRONG_BUY: 'text-green-300', BUY: 'text-green-400',
  short: 'text-red-400', STRONG_SELL: 'text-red-300', SELL: 'text-red-400',
  hold: 'text-gray-400', watch: 'text-yellow-400', NEUTRAL: 'text-gray-400',
};

const SIGNAL_BG: Record<string, string> = {
  long: 'bg-green-400/10 border-green-400/30', STRONG_BUY: 'bg-green-400/10 border-green-400/30', BUY: 'bg-green-400/10 border-green-400/30',
  short: 'bg-red-400/10 border-red-400/30', STRONG_SELL: 'bg-red-400/10 border-red-400/30', SELL: 'bg-red-400/10 border-red-400/30',
  hold: 'bg-gray-400/10 border-gray-400/30', watch: 'bg-yellow-400/10 border-yellow-400/30', NEUTRAL: 'bg-gray-400/10 border-gray-400/30',
};

function fmt(n: number, dec = 2) {
  return n?.toFixed(dec) ?? '—';
}

// ── Reusable components ────────────────────────────────────────────────────────

function InfoBox({ children, color = 'blue' }: { children: React.ReactNode; color?: 'blue' | 'yellow' | 'green' | 'red' }) {
  const colors = {
    blue:   'bg-blue-400/8 border-blue-400/20 text-blue-200',
    yellow: 'bg-[#f0b90b]/8 border-[#f0b90b]/20 text-[#f0b90b]/90',
    green:  'bg-green-400/8 border-green-400/20 text-green-200',
    red:    'bg-red-400/8 border-red-400/20 text-red-200',
  };
  return (
    <div className={`rounded-xl border p-4 text-xs leading-relaxed ${colors[color]}`}>
      {children}
    </div>
  );
}

function Collapsible({ title, icon, children, defaultOpen = false }: {
  title: string; icon?: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="glass-card rounded-xl border border-[#1a1f37] overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[#1a1f37]/40 transition-colors"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-gray-300">
          {icon}{title}
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

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

function TickerSearch({ onAdd }: { onAdd: (symbol: string) => void }) {
  const { searchTicker } = useTrading();
  const [q, setQ] = useState('');
  const [suggestions, setSuggestions] = useState<{ symbol: string; name: string; exchange: string }[]>([]);
  const [open, setOpen] = useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQ(val);
    if (timer.current) clearTimeout(timer.current);
    if (val.length < 2) { setSuggestions([]); setOpen(false); return; }
    timer.current = setTimeout(async () => {
      try {
        const res = await searchTicker(val);
        setSuggestions(res);
        setOpen(res.length > 0);
      } catch (_e) { /* ignore */ }
    }, 350);
  };

  const pick = (symbol: string) => {
    onAdd(symbol);
    setQ('');
    setSuggestions([]);
    setOpen(false);
  };

  return (
    <div className="relative">
      <input
        value={q}
        onChange={handleChange}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        placeholder="Firma oder Ticker suchen…"
        className="w-full bg-[#0d1220] border border-[#1a1f37] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#f0b90b]/50"
      />
      {open && (
        <div className="absolute z-50 top-full mt-1 w-full bg-[#0d1220] border border-[#1a1f37] rounded-lg overflow-hidden shadow-xl">
          {suggestions.map(s => (
            <button key={s.symbol} onMouseDown={() => pick(s.symbol)}
              className="w-full flex items-center justify-between px-3 py-2 hover:bg-[#1a1f37] transition-colors text-left">
              <span className="text-xs font-bold text-[#f0b90b]">{s.symbol}</span>
              <span className="text-xs text-gray-300 flex-1 ml-2 truncate">{s.name}</span>
              <span className="text-[10px] text-gray-500 ml-2">{s.exchange}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ScannerTab() {
  const { scan } = useTrading();
  const [tickers, setTickers] = useState('AAPL,MSFT,NVDA,SPY,QQQ,TSLA,AMZN,GOOGL');
  const [profile, setProfile] = useState<Profile>('momentum');
  const [results, setResults] = useState<ScanResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tickerWarnings, setTickerWarnings] = useState<string[]>([]);

  const addTicker = (symbol: string) => {
    const list = tickers.split(',').map(t => t.trim()).filter(Boolean);
    if (!list.includes(symbol)) setTickers([...list, symbol].join(','));
  };

  const runScan = async () => {
    setLoading(true);
    setError('');
    const list = tickers.split(',').map(t => t.trim()).filter(Boolean);
    const warnings = list.filter(t => t.includes(' ') || t.length > 7);
    setTickerWarnings(warnings);
    try {
      const data = await scan(list, profile);
      setResults(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Scan');
    } finally {
      setLoading(false);
    }
  };

  const info = PROFILE_INFO[profile];

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="glass-card rounded-xl p-4 border border-[#1a1f37]">
        <div className="flex flex-col gap-3">
          {/* Ticker search */}
          <TickerSearch onAdd={addTicker} />
          {/* Ticker list + profile + scan */}
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
      </div>

      {/* Profile info card — changes with selection */}
      <div className="glass-card rounded-xl border border-[#f0b90b]/20 bg-[#f0b90b]/5 p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[#f0b90b] font-semibold text-sm">{info.title}</span>
              <span className="text-xs bg-[#f0b90b]/20 text-[#f0b90b] px-2 py-0.5 rounded-full">{info.horizon}</span>
            </div>
            <p className="text-gray-300 text-xs mb-2">{info.desc}</p>
            <p className="text-gray-500 text-xs"><span className="text-gray-400">Indikatoren:</span> {info.indicators}</p>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-[#f0b90b]/10">
          <p className="text-xs text-gray-400"><span className="text-[#f0b90b] font-medium">Ziel erreicht — was tun? </span>{info.action}</p>
        </div>
      </div>

      {/* Ticker validation warnings */}
      {tickerWarnings.length > 0 && (
        <div className="flex items-start gap-2 p-3 bg-yellow-400/10 border border-yellow-400/30 rounded-lg text-yellow-300 text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Kein Aktienname — Ticker-Symbol verwenden!</span>
            <span className="text-yellow-400/70 ml-1">
              {tickerWarnings.map(w => `"${w}"`).join(', ')} {tickerWarnings.length === 1 ? 'ist' : 'sind'} kein gültiges Ticker-Symbol.
            </span>
            <div className="mt-1 text-yellow-400/60">
              Beispiele: Siemens Energy → <span className="font-mono text-yellow-300">ENR.DE</span> · Apple → <span className="font-mono text-yellow-300">AAPL</span> · SAP → <span className="font-mono text-yellow-300">SAP.DE</span> · BMW → <span className="font-mono text-yellow-300">BMW.DE</span>
            </div>
          </div>
        </div>
      )}

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
                  <th className="text-right px-4 py-3">Kurs</th>
                  <th className="text-right px-4 py-3">Score</th>
                  <th className="text-center px-4 py-3">Signal</th>
                  <th className="text-right px-4 py-3">RSI</th>
                  <th className="text-right px-4 py-3">Stop-Loss</th>
                  <th className="text-right px-4 py-3">Ziel 1</th>
                </tr>
              </thead>
              <tbody>
                {results.map(r => {
                  const price = r.indicators?.price as number | undefined;
                  return (
                  <tr key={r.ticker} className="border-b border-[#1a1f37]/50 hover:bg-[#1a1f37]/30 transition-colors">
                    <td className="px-4 py-3 font-bold text-white">{r.ticker}</td>
                    <td className="px-4 py-3 text-right font-mono text-white font-semibold">
                      {price != null && price > 0 ? `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                    </td>
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
                      {r.recommendation?.stop_loss != null && r.recommendation.stop_loss > 0
                        ? `$${fmt(r.recommendation.stop_loss, 2)}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-green-400 font-mono">
                      {r.recommendation?.target_1 != null && r.recommendation.target_1 > 0
                        ? `$${fmt(r.recommendation.target_1, 2)}` : '—'}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Signal legend — always visible */}
      <Collapsible title="Signal-Legende & Handlungsanleitung" icon={<Shield className="w-4 h-4 text-[#f0b90b]" />}>
        <div className="space-y-3 pt-1">
          {SIGNAL_GUIDE.map(g => (
            <div key={g.signal} className={`flex items-start gap-3 p-3 rounded-lg border ${g.bg}`}>
              <span className={`text-xs font-bold min-w-[90px] pt-0.5 ${g.color}`}>{g.label}</span>
              <span className="text-xs text-gray-300">{g.desc}</span>
            </div>
          ))}
          <InfoBox color="yellow">
            <strong>Score-Skala −10 bis +10:</strong> Jeder Indikator liefert einen Teilscore, gewichtet nach Profil.
            Über +4 = bullisches Gesamtbild. Unter −4 = bärisch. Dazwischen: abwarten.<br />
            <strong className="block mt-1.5">Stop-Loss ist Pflicht.</strong> Setze den Stop-Loss immer sofort nach dem Kauf.
            Wenn der Kurs den Stop-Loss berührt → verkaufen, kein Hoffen. Discipline schlägt Hoffnung.
          </InfoBox>
        </div>
      </Collapsible>

      {!loading && results.length === 0 && (
        <div className="text-center py-12 text-gray-500 text-sm">
          Tickers eingeben und Scan starten
        </div>
      )}
    </div>
  );
}

// ────────────────────── AGENT TAB ─────────────────────────────────────────────

type TrainingProgress = {
  window: number; total: number; pct: number; updated_at: string;
  total_trades: number; total_wins: number; win_rate: number;
  errors: number; last_window: string;
};

function TrainingPanel() {
  const { startTraining, getTrainingStatus } = useTrading();
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<TrainingProgress | null>(null);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const poll = useCallback(async () => {
    try {
      const s = await getTrainingStatus();
      setRunning(s.running);
      if (s.progress) setProgress(s.progress);
      if (s.error) setError(s.error);
      return s.running;
    } catch (_e) { return false; }
  }, [getTrainingStatus]);

  useEffect(() => { poll(); }, [poll]);

  // Poll while running; after stop do 3 extra polls to catch final error/progress
  useEffect(() => {
    if (!running) return;
    let extraPolls = 0;
    const id = setInterval(async () => {
      const stillRunning = await poll();
      if (!stillRunning) {
        extraPolls++;
        if (extraPolls >= 3) clearInterval(id);
      }
    }, 4000);
    return () => clearInterval(id);
  }, [running, poll]);

  const handleStart = async () => {
    setError(''); setMsg('');
    try {
      const r = await startTraining();
      if (r.already_running) {
        setMsg('Training läuft bereits…');
      } else {
        setMsg('Training gestartet — Fortschritt wird alle 4s aktualisiert.');
        setRunning(true);
        setTimeout(poll, 1500);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Starten');
    }
  };

  const barWidth = progress ? Math.min(100, progress.pct) : 0;

  return (
    <div className="glass-card rounded-xl p-4 border border-[#1a1f37] space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-[#f0b90b]" />
          <h3 className="text-sm font-semibold text-white">Historisches Volltraining (2002–2026)</h3>
        </div>
        <button
          onClick={handleStart}
          disabled={running}
          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
            running
              ? 'border-[#f0b90b]/30 text-[#f0b90b]/50 bg-[#f0b90b]/5 cursor-not-allowed'
              : 'border-[#f0b90b]/50 text-[#f0b90b] bg-[#f0b90b]/10 hover:bg-[#f0b90b]/20'
          }`}>
          {running ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
          {running ? 'Läuft…' : 'Training starten'}
        </button>
      </div>

      <p className="text-xs text-gray-400">
        Trainiert den Agenten auf 98 Zeitfenstern (je 6 Monate, Schritt 3 Monate) über alle Ticker.
        Läuft als Hintergrundprozess — du kannst die Seite verlassen.
      </p>

      {(msg || error) && (
        <div className={`text-xs px-3 py-2 rounded-lg border ${error
          ? 'bg-red-400/10 border-red-400/30 text-red-400'
          : 'bg-blue-400/8 border-blue-400/20 text-blue-300'}`}>
          {error || msg}
        </div>
      )}

      {progress && (
        <div className="space-y-2">
          {/* Progress bar */}
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Fenster {progress.window}/{progress.total}</span>
            <span className="font-semibold text-white">{progress.pct.toFixed(1)}%</span>
          </div>
          <div className="h-2 bg-[#0d1220] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${barWidth}%`, background: 'linear-gradient(90deg, #f0b90b, #f59e0b)' }}
            />
          </div>
          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            {[
              { label: 'Trades', value: progress.total_trades.toLocaleString('de-DE') },
              { label: 'Win-Rate', value: `${progress.win_rate.toFixed(1)}%` },
              { label: 'Fehler', value: String(progress.errors) },
              { label: 'Letztes Fenster', value: progress.last_window.split(' → ')[0] },
            ].map(item => (
              <div key={item.label} className="bg-[#0d1220] rounded-lg px-3 py-2">
                <div className="text-[10px] text-gray-500 mb-0.5">{item.label}</div>
                <div className="text-xs font-semibold text-white tabular-nums">{item.value}</div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-gray-500">
            Zuletzt aktualisiert: {new Date(progress.updated_at).toLocaleTimeString('de-DE')}
          </p>
        </div>
      )}
    </div>
  );
}

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

      {/* Training panel */}
      <TrainingPanel />

      {/* How the agent learns */}
      <Collapsible title="Wie lernt der Agent?" icon={<Brain className="w-4 h-4 text-[#f0b90b]" />}>
        <div className="space-y-3 pt-1 text-xs text-gray-300 leading-relaxed">
          <p>Der Agent startet mit vordefinierten Gewichten für jeden Indikator (RSI: 20%, MACD: 15%, EMA: 20% usw.) und passt diese nach jedem abgeschlossenen Trade an.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { step: '1', title: 'Vorhersage', desc: 'Scanner bewertet eine Aktie und erzeugt ein Signal (Long/Short) mit Confidence-Score.' },
              { step: '2', title: 'Trade', desc: 'Du handelst paper (oder real) und trägst das Ergebnis ein — Gewinn oder Verlust.' },
              { step: '3', title: 'Lernupdate', desc: 'Agent erhöht Gewichte der Indikatoren die richtig lagen, reduziert die die falsch lagen.' },
            ].map(s => (
              <div key={s.step} className="bg-[#0d1220] rounded-lg p-3">
                <div className="w-5 h-5 rounded-full bg-[#f0b90b] text-black text-xs font-bold flex items-center justify-center mb-2">{s.step}</div>
                <div className="font-semibold text-white text-xs mb-1">{s.title}</div>
                <div className="text-gray-400">{s.desc}</div>
              </div>
            ))}
          </div>
          <InfoBox color="blue">
            <strong>Paper-Trading zuerst.</strong> Teste die Strategie mindestens 4–6 Wochen mit virtuellem Geld bevor du echtes Kapital einsetzt.
            Eine Win-Rate unter 50% bedeutet nicht unbedingt eine schlechte Strategie — entscheidend ist das Risk/Reward-Verhältnis.
            1 gewinnender Trade von 3:1 deckt 3 Verluste.
          </InfoBox>
        </div>
      </Collapsible>
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
      if (r.metrics?.error) {
        setBtError(r.metrics.error);
      } else {
        setBtResult(r);
      }
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
      if (r.metrics?.error) {
        setCrisisError(r.metrics.error);
      } else {
        setCrisisResult(r);
      }
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

      {/* Backtest & metrics explanation */}
      <Collapsible title="Was bedeuten die Kennzahlen?" icon={<BarChart2 className="w-4 h-4 text-[#f0b90b]" />}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {[
            { term: 'Gesamtrendite', desc: 'Prozentualer Gewinn/Verlust auf das Startkapital über den gesamten Testzeitraum.' },
            { term: 'Win-Rate', desc: 'Anteil profitabler Trades. 50% = Break-Even, aber erst ab ~55% mit gutem RRR wirklich profitabel.' },
            { term: 'Max. Drawdown', desc: 'Größter Rückgang vom Hoch zum Tief. Je kleiner, desto stabiler die Strategie. Über 25% = hohes Risiko.' },
            { term: 'Sharpe Ratio', desc: 'Rendite pro Risikoeinheit. Unter 0.5 = schwach. 1.0+ = gut. 2.0+ = exzellent.' },
            { term: 'Risk/Reward (RRR)', desc: 'Verhältnis von Ø-Gewinn zu Ø-Verlust. Bei 2:1 reicht eine 35% Win-Rate zum Gewinnen.' },
            { term: 'Walk-Forward', desc: 'Testet die Strategie sequenziell in zeitlichen Abschnitten — realistischer als klassisches Backtesting.' },
          ].map(m => (
            <div key={m.term} className="bg-[#0d1220] rounded-lg p-3">
              <div className="text-[#f0b90b] text-xs font-semibold mb-1">{m.term}</div>
              <div className="text-gray-400 text-xs">{m.desc}</div>
            </div>
          ))}
        </div>
        <div className="mt-3">
          <InfoBox color="green">
            <strong>Krisentraining-Tipp:</strong> Teste deine Strategie immer gegen den COVID-Crash (2020) und den Zinsschock (2022).
            Eine Strategie die nur in Bullenmärkten funktioniert, ist keine Strategie — es ist Glück.
            Ziel: Im Crash Verluste unter 15% halten, in der Erholung überproportional profitieren.
          </InfoBox>
        </div>
      </Collapsible>
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

function BackendBanner() {
  const [status, setStatus] = useState<{ connected: boolean; reason?: string } | null>(null);

  useEffect(() => {
    fetch('/api/trading/connection-status')
      .then(r => r.json())
      .then(setStatus)
      .catch(() => setStatus({ connected: false, reason: 'Statusabfrage fehlgeschlagen' }));
  }, []);

  if (!status || status.connected) return null;

  return (
    <div className="flex items-start gap-3 p-3 mb-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-300 text-xs">
      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
      <div>
        <span className="font-semibold">Backend nicht verbunden</span>
        <span className="text-yellow-400/70 ml-1">— {status.reason}.</span>
        <p className="mt-1 text-yellow-400/60">
          Alle Daten auf dieser Seite sind <strong className="text-yellow-300">Demo-/Simulationsdaten</strong>.
          Für echte Analysen muss die Umgebungsvariable <code className="bg-yellow-400/10 px-1 rounded">ML_API_URL</code> in Vercel gesetzt und das Railway-Backend gestartet sein.
        </p>
      </div>
    </div>
  );
}

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

        <BackendBanner />

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
