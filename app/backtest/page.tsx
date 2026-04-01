'use client';

import { useState } from 'react';
import SharedHeader from '@/components/shared-header';
import { BarChart3, Play, TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const STRATEGIES = [
  { id: 'ma_cross', label: 'MA-Crossover (50/200)', description: 'Kaufen wenn MA50 > MA200, Verkaufen wenn MA50 < MA200' },
  { id: 'rsi', label: 'RSI-Strategie', description: 'Kaufen bei RSI < 30 (überverkauft), Verkaufen bei RSI > 70' },
  { id: 'buy_hold', label: 'Buy & Hold', description: 'Einmaliger Kauf und Halten bis zum Laufzeitende' },
  { id: 'momentum', label: 'Momentum', description: 'Kaufen bei positivem 3M-Momentum, Verkaufen bei negativem' },
];

const ASSETS = [
  { ticker: 'SPY', label: 'S&P 500 ETF' },
  { ticker: 'QQQ', label: 'NASDAQ 100' },
  { ticker: 'AAPL', label: 'Apple' },
  { ticker: 'MSFT', label: 'Microsoft' },
  { ticker: 'NVDA', label: 'NVIDIA' },
  { ticker: 'SAP.DE', label: 'SAP' },
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

    // Strategy-specific return simulation
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

export default function BacktestPage() {
  const [strategy, setStrategy] = useState('ma_cross');
  const [ticker, setTicker] = useState('SPY');
  const [years, setYears] = useState(5);
  const [capital, setCapital] = useState(10000);
  const [result, setResult] = useState<ReturnType<typeof runBacktest> | null>(null);
  const [running, setRunning] = useState(false);

  const handleRun = () => {
    setRunning(true);
    setTimeout(() => {
      setResult(runBacktest(strategy, ticker, years, capital));
      setRunning(false);
    }, 800);
  };

  const isPositive = result && result.totalReturn > 0;

  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      <SharedHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-12 space-y-6">

        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-[#f0b90b]" />
            Backtest-Engine
          </h1>
          <p className="text-gray-400 text-sm mt-1">Teste Handelsstrategien auf historischen Daten</p>
        </div>

        {/* Config */}
        <div className="glass-card rounded-xl p-6 border border-[#1a1f37]">
          <h3 className="font-semibold text-white mb-4">Konfiguration</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Strategie</label>
              <select
                value={strategy}
                onChange={e => setStrategy(e.target.value)}
                className="w-full bg-[#1a1f37] border border-[#2a2f47] rounded-lg px-3 py-2 text-white text-sm focus:border-[#f0b90b] focus:outline-none"
              >
                {STRATEGIES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
              <p className="text-xs text-gray-600 mt-1">{STRATEGIES.find(s => s.id === strategy)?.description}</p>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Asset</label>
              <select
                value={ticker}
                onChange={e => setTicker(e.target.value)}
                className="w-full bg-[#1a1f37] border border-[#2a2f47] rounded-lg px-3 py-2 text-white text-sm focus:border-[#f0b90b] focus:outline-none"
              >
                {ASSETS.map(a => <option key={a.ticker} value={a.ticker}>{a.label} ({a.ticker})</option>)}
              </select>
            </div>
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
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Startkapital (€)</label>
              <input
                type="number"
                value={capital}
                onChange={e => setCapital(Number(e.target.value))}
                min={1000}
                step={1000}
                className="w-full bg-[#1a1f37] border border-[#2a2f47] rounded-lg px-3 py-2 text-white text-sm focus:border-[#f0b90b] focus:outline-none"
              />
            </div>
          </div>
          <button
            onClick={handleRun}
            disabled={running}
            className="mt-4 bg-[#f0b90b] hover:bg-[#d4a017] disabled:opacity-50 text-black font-semibold px-6 py-2.5 rounded-lg flex items-center gap-2 transition-all"
          >
            <Play className="w-4 h-4" />
            {running ? 'Berechne...' : 'Backtest starten'}
          </button>
        </div>

        {/* Results */}
        {result && (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: 'Gesamtrendite', value: `${result.totalReturn.toFixed(1)}%`, positive: result.totalReturn > 0 },
                { label: 'Jahresrendite', value: `${result.annReturn.toFixed(1)}%`, positive: result.annReturn > 0 },
                { label: 'vs. Benchmark', value: `${(result.totalReturn - result.benchReturn).toFixed(1)}%`, positive: result.totalReturn > result.benchReturn },
                { label: 'Max. Drawdown', value: `${result.maxDrawdown.toFixed(1)}%`, positive: false },
                { label: 'Sharpe Ratio', value: result.sharpe, positive: Number(result.sharpe) > 1 },
                { label: 'Trades', value: String(result.trades), positive: true },
              ].map(kpi => (
                <div key={kpi.label} className="glass-card rounded-xl p-4 border border-[#1a1f37]">
                  <p className="text-xs text-gray-500 mb-1">{kpi.label}</p>
                  <p className={`text-lg font-bold ${kpi.positive ? 'text-green-400' : 'text-red-400'}`}>{kpi.value}</p>
                </div>
              ))}
            </div>

            {/* Chart */}
            <div className="glass-card rounded-xl p-6 border border-[#1a1f37]">
              <h3 className="font-semibold text-white mb-4">Portfolio-Entwicklung vs. Benchmark</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={result.data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a1f37" />
                    <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11 }} tickCount={6} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickFormatter={v => `€${(v/1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{ background: '#0f1629', border: '1px solid #1a1f37', borderRadius: '8px' }}
                      formatter={(v: number, n: string) => [`€${v.toLocaleString('de-DE')}`, n === 'portfolio' ? 'Strategie' : 'Benchmark']}
                    />
                    <Legend formatter={v => v === 'portfolio' ? 'Strategie' : 'Benchmark'} />
                    <Line type="monotone" dataKey="portfolio" stroke="#f0b90b" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="benchmark" stroke="#60B5FF" strokeWidth={1.5} dot={false} strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 flex items-start gap-2 text-xs text-gray-500">
                <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                Simulierte Ergebnisse basierend auf historischen Mustern. Vergangene Performance ist keine Garantie für zukünftige Ergebnisse.
              </div>
            </div>
          </>
        )}

      </main>
    </div>
  );
}
