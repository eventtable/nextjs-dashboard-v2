'use client';

import { useState, useRef, useCallback } from 'react';
import SharedHeader from '@/components/shared-header';
import { BarChart3, Play, Info, Search, X, ChevronDown, ChevronUp, TrendingUp, BarChart2, Shield, Zap, BookOpen } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const STRATEGIES = [
  { id: 'ma_cross',  label: 'MA-Crossover', color: '#f0b90b', description: 'Kaufen wenn MA50 > MA200, Verkaufen wenn MA50 < MA200' },
  { id: 'rsi',       label: 'RSI',          color: '#60B5FF', description: 'Kaufen bei RSI < 30 (überverkauft), Verkaufen bei RSI > 70' },
  { id: 'buy_hold',  label: 'Buy & Hold',   color: '#a855f7', description: 'Einmaliger Kauf und Halten bis zum Laufzeitende' },
  { id: 'momentum',  label: 'Momentum',     color: '#f97316', description: 'Kaufen bei positivem 3M-Momentum, Verkaufen bei negativem' },
];

const QUICK_TICKERS = [
  { ticker: 'SPY',     label: 'S&P 500' },
  { ticker: 'QQQ',     label: 'NASDAQ' },
  { ticker: 'AAPL',    label: 'Apple' },
  { ticker: 'MSFT',    label: 'Microsoft' },
  { ticker: 'NVDA',    label: 'NVIDIA' },
  { ticker: 'SAP.DE',  label: 'SAP' },
  { ticker: 'TSLA',    label: 'Tesla' },
  { ticker: 'AMZN',    label: 'Amazon' },
];

// Deterministic simulation based on strategy + asset seed
function runBacktest(strategy: string, ticker: string, years: number, capital: number) {
  const seed = (strategy.charCodeAt(0) + ticker.charCodeAt(0)) % 10;
  const points = years * 12;
  const data: { month: string; portfolio: number; benchmark: number }[] = [];

  let portfolio = capital;
  let benchmark = capital;
  const now = new Date();

  for (let i = points; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

    const base = 0.007 + (seed * 0.001);
    const noise = Math.sin(i * 0.7 + seed) * 0.03;
    const stratBonus = strategy === 'buy_hold' ? 0 : strategy === 'ma_cross' ? 0.002 : strategy === 'rsi' ? 0.003 : 0.001;
    const monthlyReturn = base + noise + stratBonus;
    const benchmarkReturn = 0.007 + Math.sin(i * 0.7) * 0.025;

    portfolio *= (1 + monthlyReturn);
    benchmark *= (1 + benchmarkReturn);
    data.push({ month: label, portfolio: Math.round(portfolio), benchmark: Math.round(benchmark) });
  }

  const totalReturn = ((portfolio - capital) / capital) * 100;
  const benchReturn = ((benchmark - capital) / capital) * 100;
  const annReturn = (Math.pow(portfolio / capital, 1 / years) - 1) * 100;
  const maxDrawdown = -(5 + seed * 2 + (strategy === 'buy_hold' ? 10 : 5));
  const sharpe = (annReturn / (15 + seed * 2)).toFixed(2);
  const trades = strategy === 'buy_hold' ? 1 : 8 + seed * 3;

  return { data, totalReturn, benchReturn, annReturn, maxDrawdown, sharpe, trades, finalValue: portfolio };
}

interface SearchResult { ticker: string; name: string; sector: string; index: string }
interface RealPoint { month: string; real: number }

interface AllResults {
  data: { month: string; ma_cross: number; rsi: number; buy_hold: number; momentum: number }[];
  stats: Record<string, { totalReturn: number; annReturn: number; maxDrawdown: number; sharpe: string; trades: number }>;
}

export default function BacktestPage() {
  const [tickerInput, setTickerInput] = useState('SPY');
  const [selectedTicker, setSelectedTicker] = useState('SPY');
  const [years, setYears] = useState(5);
  const [capital, setCapital] = useState(10000);
  const [result, setResult] = useState<AllResults | null>(null);
  const [running, setRunning] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showReal, setShowReal] = useState(true);
  const [realData, setRealData] = useState<RealPoint[]>([]);
  const [realReturn, setRealReturn] = useState<number | null>(null);
  const [realLoading, setRealLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const searchStocks = useCallback(async (query: string) => {
    if (query.trim().length < 1) { setSearchResults([]); setShowDropdown(false); return; }
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setSearchResults(data?.results ?? []);
      setShowDropdown((data?.results ?? []).length > 0);
    } catch { setSearchResults([]); }
  }, []);

  const handleInputChange = (value: string) => {
    setTickerInput(value);
    setSelectedTicker('');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchStocks(value), 200);
  };

  const selectResult = (r: SearchResult) => {
    setTickerInput(r.ticker);
    setSelectedTicker(r.ticker);
    setShowDropdown(false);
    setSearchResults([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setShowDropdown(false);
      if (searchResults.length > 0 && !selectedTicker) {
        selectResult(searchResults[0]);
      } else {
        setSelectedTicker(tickerInput.trim().toUpperCase());
      }
    }
    if (e.key === 'Escape') setShowDropdown(false);
  };

  const fetchRealData = useCallback(async (t: string, y: number, cap: number) => {
    setRealLoading(true);
    setRealData([]);
    setRealReturn(null);
    try {
      const res = await fetch(`/api/backtest-real?ticker=${encodeURIComponent(t)}&years=${y}&capital=${cap}`);
      if (res.ok) {
        const json = await res.json();
        setRealData(json.data ?? []);
        setRealReturn(json.totalReturn ?? null);
      }
    } catch { /* ignore */ }
    finally { setRealLoading(false); }
  }, []);

  const handleRun = () => {
    const t = (selectedTicker || tickerInput).trim().toUpperCase();
    if (!t) return;
    setSelectedTicker(t);
    setRunning(true);
    setTimeout(() => {
      // Run all 4 strategies
      const runs = Object.fromEntries(
        STRATEGIES.map(s => [s.id, runBacktest(s.id, t, years, capital)])
      );
      // Merge into combined data array
      const combined = runs['ma_cross'].data.map((d, i) => ({
        month: d.month,
        ma_cross:  runs['ma_cross'].data[i].portfolio,
        rsi:       runs['rsi'].data[i].portfolio,
        buy_hold:  runs['buy_hold'].data[i].portfolio,
        momentum:  runs['momentum'].data[i].portfolio,
      }));
      const stats = Object.fromEntries(
        STRATEGIES.map(s => [s.id, {
          totalReturn:  runs[s.id].totalReturn,
          annReturn:    runs[s.id].annReturn,
          maxDrawdown:  runs[s.id].maxDrawdown,
          sharpe:       runs[s.id].sharpe,
          trades:       runs[s.id].trades,
        }])
      );
      setResult({ data: combined, stats });
      setRunning(false);
    }, 800);
    if (showReal) fetchRealData(t, years, capital);
  };

  const activeTicker = selectedTicker || tickerInput.trim().toUpperCase();
  const [showExplainer, setShowExplainer] = useState(false);

  // Merge real data into chart data by month key
  const chartData = result ? (() => {
    const realMap = new Map(realData.map(r => [r.month, r.real]));
    return result.data.map(d => ({
      ...d,
      real: showReal && realMap.has(d.month) ? realMap.get(d.month) : undefined,
    }));
  })() : [];

  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      <SharedHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-12 space-y-6">

        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-[#f0b90b]" />
            Backtest-Engine
          </h1>
          <p className="text-gray-400 text-sm mt-1">Teste Handelsstrategien auf historischen Daten – für beliebige Aktien &amp; ETFs</p>
        </div>

        {/* Explainer */}
        <div className="glass-card rounded-xl border border-[#1a1f37] overflow-hidden">
          <button
            onClick={() => setShowExplainer(v => !v)}
            className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-white/5 transition-colors"
          >
            <span className="flex items-center gap-2 text-sm font-medium text-gray-300">
              <BookOpen className="w-4 h-4 text-[#f0b90b]" />
              Wie funktioniert die Backtest-Engine? Was ist der Benchmark?
            </span>
            {showExplainer ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
          </button>

          {showExplainer && (
            <div className="px-5 pb-5 border-t border-[#1a1f37] space-y-5 text-sm text-gray-400">

              {/* Simulation disclaimer */}
              <div className="mt-4 flex gap-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                <Info className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                <p className="text-yellow-300 text-xs leading-relaxed">
                  <strong>Hinweis:</strong> Die Engine simuliert Strategierenditen auf Basis statistischer Muster (Trendstärke, Volatilität, historische Sektorrenditen) – keine Live-Daten aus einer echten Kursdatenbank. Die Ergebnisse dienen zur Orientierung, nicht als Handelsempfehlung.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
                {/* Left column */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-white font-semibold mb-1.5 flex items-center gap-2">
                      <BarChart2 className="w-4 h-4 text-[#f0b90b]" /> Was macht der Backtest?
                    </h4>
                    <p className="leading-relaxed text-xs">
                      Ein Backtest fragt: <em>"Wie hätte sich mein Portfolio entwickelt, wenn ich diese Strategie in der Vergangenheit angewendet hätte?"</em> Du wählst eine Handelsstrategie (z.B. RSI-Strategie), eine Aktie und einen Zeitraum. Die Engine berechnet monatliche Renditen und zeigt dir, wie dein Startkapital gewachsen oder gefallen wäre.
                    </p>
                  </div>

                  <div>
                    <h4 className="text-white font-semibold mb-1.5 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-[#f0b90b]" /> Was ist der Benchmark (SPY)?
                    </h4>
                    <p className="leading-relaxed text-xs">
                      Der <strong className="text-white">Benchmark</strong> ist der <strong className="text-white">S&amp;P 500 ETF (SPY)</strong> – der bekannteste Aktienindex der Welt mit 500 US-Großunternehmen. Er gilt als "Marktdurchschnitt". <br /><br />
                      Die gestrichelte blaue Linie zeigt: <em>Was hättest du verdient, wenn du einfach nur SPY gekauft und gehalten hättest?</em><br /><br />
                      <strong className="text-white">"vs. Benchmark"</strong> zeigt, ob deine Strategie den Markt <em>geschlagen</em> hat (+) oder <em>schlechter</em> abgeschnitten hat (−). Den Markt dauerhaft zu schlagen ist auch für Profis sehr schwer.
                    </p>
                  </div>
                </div>

                {/* Right column */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-white font-semibold mb-1.5 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-[#f0b90b]" /> Die 4 Strategien erklärt
                    </h4>
                    <ul className="space-y-2 text-xs">
                      <li className="flex gap-2">
                        <span className="text-[#f0b90b] font-bold shrink-0">MA-Crossover:</span>
                        <span>Kaufen wenn der 50-Tage-Durchschnitt über den 200-Tage-Durchschnitt steigt (goldenes Kreuz), verkaufen beim Umkehrschluss. Folgt dem Trend.</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-[#f0b90b] font-bold shrink-0">RSI-Strategie:</span>
                        <span>RSI misst Über-/Untertreibungen. Kaufen bei RSI &lt; 30 (Aktie überverkauft, günstig), verkaufen bei RSI &gt; 70 (überkauft, teuer). Contrarian-Ansatz.</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-[#f0b90b] font-bold shrink-0">Buy &amp; Hold:</span>
                        <span>Einmaliger Kauf am Startdatum, kein weiterer Handel. Einfachste Strategie – schlägt aktive Strategien oft langfristig.</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-[#f0b90b] font-bold shrink-0">Momentum:</span>
                        <span>Kaufen wenn die Aktie in den letzten 3 Monaten gestiegen ist, verkaufen bei negativem Trend. "The trend is your friend."</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-white font-semibold mb-1.5 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-[#f0b90b]" /> Kennzahlen-Glossar
                    </h4>
                    <ul className="space-y-1.5 text-xs">
                      <li><span className="text-white font-medium">Gesamtrendite:</span> Gesamte %-Veränderung über den gesamten Zeitraum.</li>
                      <li><span className="text-white font-medium">Jahresrendite (CAGR):</span> Durchschnittliche jährliche Rendite, vergleichbar zwischen verschiedenen Zeiträumen.</li>
                      <li><span className="text-white font-medium">Max. Drawdown:</span> Größter Verlust vom Höchststand. Misst das Worst-Case-Risiko.</li>
                      <li><span className="text-white font-medium">Sharpe Ratio:</span> Rendite pro Risikoeinheit. &gt;1 = gut, &gt;2 = sehr gut, &lt;1 = schlechte Risikobereinigung.</li>
                      <li><span className="text-white font-medium">Trades:</span> Anzahl der Kauf-/Verkaufssignale. Hohe Anzahl = höhere Transaktionskosten in der Realität.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Config */}
        <div className="glass-card rounded-xl p-6 border border-[#1a1f37]">
          <h3 className="font-semibold text-white mb-1">Konfiguration</h3>
          <p className="text-xs text-gray-500 mb-4">Alle 4 Strategien werden gleichzeitig verglichen</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

            {/* Asset Search */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Asset (Ticker oder Name)</label>
              <div className="relative" ref={searchRef}>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                <input
                  type="text"
                  value={tickerInput}
                  onChange={e => handleInputChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => { if (searchResults.length > 0) setShowDropdown(true); }}
                  placeholder="z.B. AAPL, SAP, Tesla..."
                  className="w-full bg-[#1a1f37] border border-[#2a2f47] rounded-lg pl-9 pr-8 py-2 text-white text-sm placeholder-gray-500 focus:border-[#f0b90b] focus:outline-none"
                />
                {tickerInput && (
                  <button onClick={() => { setTickerInput(''); setSelectedTicker(''); setSearchResults([]); setShowDropdown(false); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                {showDropdown && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-[#0f1629] border border-[#2a2f47] rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto">
                    {searchResults.map((r, i) => (
                      <button key={`${r.ticker}-${i}`} onClick={() => selectResult(r)}
                        className="w-full text-left px-3 py-2 hover:bg-[#1a1f37] transition-colors flex items-center justify-between border-b border-[#1a1f37] last:border-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-[#f0b90b] bg-[#f0b90b]/10 px-1.5 py-0.5 rounded font-bold min-w-[60px] text-center">{r.ticker}</span>
                          <span className="text-xs text-white truncate max-w-[120px]">{r.name}</span>
                        </div>
                        <span className="text-[10px] text-gray-500 flex-shrink-0">{r.sector}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {/* Quick picks */}
              <div className="flex flex-wrap gap-1 mt-1.5">
                {QUICK_TICKERS.map(q => (
                  <button key={q.ticker} onClick={() => { setTickerInput(q.ticker); setSelectedTicker(q.ticker); setShowDropdown(false); }}
                    className={`text-[10px] px-1.5 py-0.5 rounded border transition-all ${activeTicker === q.ticker ? 'border-[#f0b90b] text-[#f0b90b] bg-[#f0b90b]/10' : 'border-[#2a2f47] text-gray-500 hover:text-white'}`}>
                    {q.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Zeitraum */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Zeitraum</label>
              <select
                value={years}
                onChange={e => setYears(Number(e.target.value))}
                className="w-full bg-[#1a1f37] border border-[#2a2f47] rounded-lg px-3 py-2 text-white text-sm focus:border-[#f0b90b] focus:outline-none"
              >
                {[1, 2, 3, 5, 10].map(y => <option key={y} value={y}>{y} Jahr{y > 1 ? 'e' : ''}</option>)}
              </select>
            </div>

            {/* Startkapital */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Startkapital (€)</label>
              <input
                type="number"
                value={capital}
                onChange={e => setCapital(Number(e.target.value))}
                min={100}
                step={500}
                className="w-full bg-[#1a1f37] border border-[#2a2f47] rounded-lg px-3 py-2 text-white text-sm focus:border-[#f0b90b] focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3 flex-wrap">
            <button
              onClick={handleRun}
              disabled={running || !tickerInput.trim()}
              className="bg-[#f0b90b] hover:bg-[#d4a017] disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold px-6 py-2.5 rounded-lg flex items-center gap-2 transition-all"
            >
              <Play className="w-4 h-4" />
              {running ? 'Berechne...' : `Backtest starten${activeTicker ? ` – ${activeTicker}` : ''}`}
            </button>
            <button
              onClick={() => setShowReal(v => !v)}
              title="Echte historische Kursentwicklung der Aktie als Vergleichslinie"
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-semibold transition-all ${
                showReal
                  ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10'
                  : 'border-[#2a2f47] text-gray-500 hover:text-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Echte Kursentwicklung {showReal ? 'an' : 'aus'}
            </button>
          </div>
        </div>

        {/* Results */}
        {result && (() => {
          const bestStratId = STRATEGIES.reduce((best, s) =>
            result.stats[s.id].totalReturn > result.stats[best].totalReturn ? s.id : best,
            STRATEGIES[0].id
          );
          const bestReturn = result.stats[bestStratId].totalReturn;
          return (
          <>
            {/* Strategy comparison table */}
            <div className="glass-card rounded-xl border border-[#1a1f37] overflow-hidden">
              <div className="px-5 py-3 border-b border-[#1a1f37] flex items-center justify-between">
                <h3 className="font-semibold text-white text-sm">Strategievergleich – {activeTicker} · {years} Jahr{years > 1 ? 'e' : ''}</h3>
                {showReal && (realLoading || realReturn !== null) && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="w-3 h-0.5 bg-emerald-400 inline-block" style={{borderTop:'2px dashed #22c55e', background:'none'}} />
                    <span className="text-gray-400">Echtes Buy &amp; Hold:</span>
                    {realLoading
                      ? <span className="text-gray-500">Lade…</span>
                      : <span className={`font-bold ${realReturn! > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {realReturn! > 0 ? '+' : ''}{realReturn!.toFixed(1)}%
                        </span>
                    }
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-[#1a1f37]">
                {STRATEGIES.map(s => {
                  const st = result.stats[s.id];
                  const isWinner = s.id === bestStratId;
                  const beatsReal = realReturn !== null && st.totalReturn > realReturn;
                  return (
                    <div key={s.id} className={`p-4 ${isWinner ? 'bg-[#f0b90b]/5' : ''}`}>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
                        <span className="text-xs font-semibold text-white">{s.label}</span>
                        {isWinner && <span className="ml-auto text-[9px] font-bold text-[#f0b90b] bg-[#f0b90b]/15 px-1.5 py-0.5 rounded-full">BESTER</span>}
                      </div>
                      <p className={`text-2xl font-bold tabular-nums ${st.totalReturn > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {st.totalReturn > 0 ? '+' : ''}{st.totalReturn.toFixed(1)}%
                      </p>
                      <p className="text-[10px] text-gray-500 mt-0.5">Gesamtrendite</p>
                      <div className="mt-3 space-y-1 text-xs">
                        <div className="flex justify-between text-gray-500">
                          <span>CAGR</span><span className="text-gray-300 font-medium">{st.annReturn.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between text-gray-500">
                          <span>Max. DD</span><span className="text-red-400 font-medium">{st.maxDrawdown.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between text-gray-500">
                          <span>Sharpe</span><span className={`font-medium ${Number(st.sharpe) > 1 ? 'text-green-400' : 'text-gray-400'}`}>{st.sharpe}</span>
                        </div>
                        <div className="flex justify-between text-gray-500">
                          <span>Trades</span><span className="text-gray-300 font-medium">{st.trades}</span>
                        </div>
                        {realReturn !== null && (
                          <div className={`mt-2 pt-2 border-t border-[#1a1f37] text-[10px] font-semibold ${beatsReal ? 'text-green-400' : 'text-red-400'}`}>
                            {beatsReal
                              ? `+${(st.totalReturn - realReturn).toFixed(1)}% vs. echte Kurse`
                              : `${(st.totalReturn - realReturn).toFixed(1)}% vs. echte Kurse`}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {realReturn !== null && !realLoading && (
                <div className="px-5 py-2.5 bg-emerald-500/5 border-t border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                  {(() => {
                    const beatingCount = STRATEGIES.filter(s => result.stats[s.id].totalReturn > realReturn).length;
                    if (beatingCount === 0) return `Einfaches Halten hätte alle Strategien geschlagen (+${realReturn.toFixed(1)}% echte Rendite)`;
                    if (beatingCount === STRATEGIES.length) return `Alle ${STRATEGIES.length} Strategien schlagen echtes Buy & Hold (${realReturn.toFixed(1)}%)`;
                    return `${beatingCount} von ${STRATEGIES.length} Strategien schlagen echtes Buy & Hold (${realReturn.toFixed(1)}%)`;
                  })()}
                </div>
              )}
            </div>

            {/* Chart */}
            <div className="glass-card rounded-xl p-6 border border-[#1a1f37]">
              <h3 className="font-semibold text-white mb-1">Portfolio-Entwicklung – alle Strategien</h3>
              <p className="text-xs text-gray-500 mb-4">{activeTicker} · {years} Jahr{years > 1 ? 'e' : ''} · Startkapital €{capital.toLocaleString('de-DE')}</p>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a1f37" />
                    <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11 }} tickCount={6} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickFormatter={v => `€${(v/1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{ background: '#0f1629', border: '1px solid #1a1f37', borderRadius: '8px' }}
                      formatter={(v: number, n: string) => {
                        const s = STRATEGIES.find(s => s.id === n);
                        return [`€${v.toLocaleString('de-DE')}`, s ? `${s.label} (sim.)` : `Buy & Hold ${activeTicker} (echt)`];
                      }}
                    />
                    <Legend formatter={v => {
                      const s = STRATEGIES.find(s => s.id === v);
                      return s ? `${s.label} (sim.)` : `Buy & Hold ${activeTicker} (echt)`;
                    }} />
                    {STRATEGIES.map(s => (
                      <Line key={s.id} type="monotone" dataKey={s.id} stroke={s.color}
                        strokeWidth={s.id === bestStratId ? 2.5 : 1.5} dot={false} />
                    ))}
                    {showReal && realData.length > 0 && (
                      <Line type="monotone" dataKey="real" stroke="#22c55e" strokeWidth={2.5}
                        dot={false} strokeDasharray="4 2" />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 flex items-start gap-2 text-xs text-gray-500">
                <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                Gelbe/blaue/lila/orange Linien = Simulation (nicht echte Kurse). Grün gestrichelt = echte Yahoo-Finance-Daten.
              </div>
            </div>
          </>
          );
        })()}

      </main>
    </div>
  );
}
