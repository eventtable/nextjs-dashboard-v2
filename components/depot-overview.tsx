'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area } from 'recharts';
import { Wallet, TrendingUp, TrendingDown, RefreshCw, AlertTriangle, CheckCircle, Info, Shield, Layers, BarChart3, LineChart as LineChartIcon } from 'lucide-react';
import { STRATEGY_CONFIG, CATEGORY_LABELS } from '@/lib/depot-data';
import type { StrategyType, AssetCategory } from '@/lib/depot-data';

interface PositionData {
  name: string;
  shortName: string;
  isin: string;
  ticker: string;
  stueck: number;
  kaufkurs: number;
  kaufwert: number;
  category: AssetCategory;
  strategy: StrategyType;
  currency: string;
  lagerland: string;
  livePrice: number | null;
  livePriceEur: number;
  liveCurrency: string;
  liveChangePercent: number | null;
  currentValue: number;
  gainLoss: number;
  gainLossPercent: number;
}

interface DepotData {
  positions: PositionData[];
  totalValue: number;
  totalReported: number;
  lastUpdate: string;
}

function formatEur(v: number): string {
  return v.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 });
}

function formatPercent(v: number): string {
  return v.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%';
}

export default function DepotOverview({ onAnalyze }: { onAnalyze?: (ticker: string) => void }) {
  const router = useRouter();
  const [data, setData] = useState<DepotData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'positionen' | 'allokation' | 'balancing' | 'verlauf'>('positionen');
  const [chartData, setChartData] = useState<{ date: string; value: number }[]>([]);
  const [chartLoading, setChartLoading] = useState(false);

  const goToMatrix = useCallback((ticker: string) => {
    if (!ticker) return;
    if (onAnalyze) { onAnalyze(ticker); return; }
    router.push(`/matrix?ticker=${encodeURIComponent(ticker)}`);
  }, [router, onAnalyze]);

  const loadChart = useCallback(async () => {
    if (chartData.length > 0) return;
    setChartLoading(true);
    try {
      const res = await fetch('/api/depot-chart');
      const json = await res.json();
      setChartData(json.chartData ?? []);
    } catch { /* ignore */ }
    finally { setChartLoading(false); }
  }, [chartData.length]);

  const fetchDepot = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/depot');
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? 'Fehler');
      setData(json);
    } catch (err: any) {
      setError(err?.message ?? 'Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDepot(); }, [fetchDepot]);

  if (loading) {
    return (
      <div className="glass-card rounded-xl p-8 text-center">
        <RefreshCw className="w-8 h-8 text-[#f0b90b] animate-spin mx-auto mb-3" />
        <p className="text-gray-400">Depot-Daten werden geladen...</p>
        <p className="text-gray-600 text-xs mt-1">Live-Kurse von Yahoo Finance</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="glass-card rounded-xl p-6 border-l-4 border-red-500">
        <div className="flex items-center gap-2 text-red-400">
          <AlertTriangle className="w-5 h-5" />
          <span>{error ?? 'Keine Daten'}</span>
        </div>
      </div>
    );
  }

  const { positions, totalValue } = data;
  const totalGainLoss = positions.reduce((s, p) => s + p.gainLoss, 0);
  const totalGainLossPercent = data.totalReported > 0 ? (totalGainLoss / data.totalReported) * 100 : 0;

  // Daily gain/loss: sum of (currentValue × changePercent / (100 + changePercent) × 100)
  const totalDailyChange = positions.reduce((s, p) => {
    if (p.liveChangePercent === null) return s;
    const prevValue = p.currentValue / (1 + p.liveChangePercent / 100);
    return s + (p.currentValue - prevValue);
  }, 0);
  const totalDailyChangePct = totalValue > 0 ? (totalDailyChange / (totalValue - totalDailyChange)) * 100 : 0;

  // Strategy allocation
  const strategyAllocation = Object.entries(STRATEGY_CONFIG).map(([key, config]) => {
    const stratPositions = positions.filter(p => p.strategy === key);
    const value = stratPositions.reduce((s, p) => s + p.currentValue, 0);
    const actualPercent = totalValue > 0 ? (value / totalValue) * 100 : 0;
    return {
      key: key as StrategyType,
      ...config,
      value,
      actualPercent,
      diff: actualPercent - config.targetPercent,
      positions: stratPositions,
    };
  }).filter(s => s.value > 0 || s.targetPercent > 0);

  // Category allocation
  const categoryAllocation = Object.entries(CATEGORY_LABELS).map(([key, label]) => {
    const catPositions = positions.filter(p => p.category === key);
    const value = catPositions.reduce((s, p) => s + p.currentValue, 0);
    return {
      key: key as AssetCategory,
      label,
      value,
      percent: totalValue > 0 ? (value / totalValue) * 100 : 0,
      count: catPositions.length,
    };
  }).filter(c => c.value > 0);

  const categoryColors: Record<string, string> = { aktie: '#60B5FF', etf: '#f0b90b', etp: '#f59e0b', anleihe: '#8b5cf6' };

  // Balancing hints
  const balancingHints: { type: 'warning' | 'success' | 'info'; text: string; detail: string }[] = [];

  strategyAllocation.forEach(s => {
    if (s.diff > 10) {
      balancingHints.push({
        type: 'warning',
        text: `${s.label} ist übergewichtet`,
        detail: `Ist: ${formatPercent(s.actualPercent)} | Soll: ${formatPercent(s.targetPercent)} | Differenz: +${formatPercent(s.diff)}. Ggf. Gewinne realisieren oder Sparplan reduzieren.`,
      });
    } else if (s.diff < -8) {
      balancingHints.push({
        type: 'warning',
        text: `${s.label} ist untergewichtet`,
        detail: `Ist: ${formatPercent(s.actualPercent)} | Soll: ${formatPercent(s.targetPercent)} | Differenz: ${formatPercent(s.diff)}. Nachkauf prüfen oder Sparplan erhöhen.`,
      });
    } else if (Math.abs(s.diff) <= 3) {
      balancingHints.push({
        type: 'success',
        text: `${s.label} ist gut ausbalanciert`,
        detail: `Ist: ${formatPercent(s.actualPercent)} | Soll: ${formatPercent(s.targetPercent)}`,
      });
    }
  });

  // Single position concentration
  const topPosition = [...positions].sort((a, b) => b.currentValue - a.currentValue)[0];
  if (topPosition && totalValue > 0) {
    const topPercent = (topPosition.currentValue / totalValue) * 100;
    if (topPercent > 15) {
      balancingHints.push({
        type: 'warning',
        text: `Klumpenrisiko: ${topPosition.shortName} = ${formatPercent(topPercent)}`,
        detail: `Eine Einzelposition sollte max. 10-15% des Depots ausmachen. Überlege, ob du die Position reduzieren oder das Depot vergrößern möchtest.`,
      });
    }
  }

  // Diversification check
  const countrySet = new Set(positions.map(p => p.lagerland));
  if (countrySet.size <= 3) {
    balancingHints.push({
      type: 'info',
      text: 'Geografische Diversifikation prüfen',
      detail: `Dein Depot deckt ${countrySet.size} Länder/Regionen ab. Für bessere Streuung könntest du Schwellenländer oder Asien-ETFs beimischen.`,
    });
  } else {
    balancingHints.push({
      type: 'success',
      text: `Gute geografische Streuung (${countrySet.size} Länder)`,
      detail: `Dein Depot ist über ${countrySet.size} verschiedene Länder/Regionen diversifiziert.`,
    });
  }

  // Hedging check
  const hasHedging = positions.some(p => p.strategy === 'absicherung');
  if (hasHedging) {
    balancingHints.push({
      type: 'success',
      text: 'Absicherungsposition vorhanden (DAX 3x Short)',
      detail: 'Du hast eine Hedging-Position im Depot. Beachte: Gehebelte Produkte verlieren durch den täglichen Reset langfristig an Wert (Pfadabhängigkeit).',
    });
  }

  // Gold check
  const goldValue = positions.filter(p => p.isin === 'IE00B4ND3602').reduce((s, p) => s + p.currentValue, 0);
  const goldPercent = totalValue > 0 ? (goldValue / totalValue) * 100 : 0;
  if (goldPercent >= 5 && goldPercent <= 15) {
    balancingHints.push({
      type: 'success',
      text: `Gold-Anteil optimal: ${formatPercent(goldPercent)}`,
      detail: 'Experten empfehlen 5-15% Gold als Inflationsschutz und Krisenwährung.',
    });
  }

  // Depot size hint
  if (totalValue < 10000) {
    balancingHints.push({
      type: 'info',
      text: 'Depot befindet sich im Aufbau',
      detail: `Aktueller Wert: ${formatEur(totalValue)}. Bei kleinen Depots (<10.000€) können einzelne Positionen stark gewichten. Fokussiere auf regelmäßige Sparpläne.`,
    });
  }

  const tabs = [
    { id: 'positionen' as const, label: 'Positionen', icon: Layers },
    { id: 'verlauf' as const,    label: 'Verlauf',    icon: LineChartIcon, onActivate: loadChart },
    { id: 'allokation' as const, label: 'Allokation', icon: BarChart3 },
    { id: 'balancing' as const,  label: 'Balancing',  icon: Shield },
  ];

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#f0b90b]/10 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-[#f0b90b]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Mein Depot</h2>
              <p className="text-xs text-gray-500">Trade Republic • {positions.length} Positionen</p>
            </div>
          </div>
          <button onClick={fetchDepot} className="text-gray-400 hover:text-[#f0b90b] transition-colors p-2">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#0a0e1a] rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Depotwert</p>
            <p className="text-lg font-bold text-white">{formatEur(totalValue)}</p>
          </div>
          <div className="bg-[#0a0e1a] rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Heute</p>
            <div className="flex items-center gap-1">
              {totalDailyChange >= 0 ? <TrendingUp className="w-4 h-4 text-green-400" /> : <TrendingDown className="w-4 h-4 text-red-400" />}
              <p className={`text-lg font-bold ${totalDailyChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {totalDailyChange >= 0 ? '+' : ''}{formatEur(totalDailyChange)}
              </p>
            </div>
            <p className={`text-xs font-mono mt-0.5 ${totalDailyChangePct >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {totalDailyChangePct >= 0 ? '+' : ''}{formatPercent(totalDailyChangePct)}
            </p>
          </div>
          <div className="bg-[#0a0e1a] rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Gesamt G/V</p>
            <div className="flex items-center gap-1">
              {totalGainLoss >= 0 ? <TrendingUp className="w-4 h-4 text-green-400" /> : <TrendingDown className="w-4 h-4 text-red-400" />}
              <p className={`text-lg font-bold ${totalGainLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {totalGainLoss >= 0 ? '+' : ''}{formatEur(totalGainLoss)}
              </p>
            </div>
            <p className={`text-xs font-mono mt-0.5 ${totalGainLossPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {totalGainLossPercent >= 0 ? '+' : ''}{formatPercent(totalGainLossPercent)}
            </p>
          </div>
          <div className="bg-[#0a0e1a] rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Positionen</p>
            <p className="text-lg font-bold text-white">{positions.length}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); (tab as any).onActivate?.(); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${
                activeTab === tab.id
                  ? 'bg-[#f0b90b]/10 text-[#f0b90b] border border-[#f0b90b]/20'
                  : 'text-gray-400 hover:text-white bg-[#0a0e1a] hover:bg-[#1a1f37]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab: Positionen */}
      {activeTab === 'positionen' && (
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1a1f37] text-gray-400 text-xs">
                  <th className="text-left px-4 py-3">Position</th>
                  <th className="text-right px-3 py-3">Stück</th>
                  <th className="text-right px-3 py-3">Kurs</th>
                  <th className="text-right px-3 py-3">Wert</th>
                  <th className="text-right px-3 py-3">G/V</th>
                  <th className="text-right px-3 py-3">Heute</th>
                  <th className="text-right px-3 py-3">Anteil</th>
                  <th className="text-center px-3 py-3">Typ</th>
                </tr>
              </thead>
              <tbody>
                {positions
                  .sort((a, b) => b.currentValue - a.currentValue)
                  .map((pos, i) => {
                    const percent = totalValue > 0 ? (pos.currentValue / totalValue) * 100 : 0;
                    const dailyEur = pos.liveChangePercent !== null
                      ? pos.currentValue - pos.currentValue / (1 + pos.liveChangePercent / 100)
                      : null;
                    const isClickable = !!pos.ticker && pos.ticker !== pos.isin;
                    return (
                      <tr
                        key={pos.isin}
                        onClick={() => isClickable && goToMatrix(pos.ticker)}
                        className={`border-b border-[#1a1f37]/50 transition-colors ${i % 2 === 0 ? 'bg-[#0a0e1a]/30' : ''} ${isClickable ? 'cursor-pointer hover:bg-[#f0b90b]/5 group' : ''}`}
                      >
                        <td className="px-4 py-3">
                          <p className={`text-white font-medium text-xs ${isClickable ? 'group-hover:text-[#f0b90b] transition-colors' : ''}`}>
                            {pos.shortName}
                          </p>
                          <p className="text-gray-500 text-[10px]">{pos.isin}</p>
                        </td>
                        <td className="text-right px-3 py-3 text-gray-300 text-xs font-mono">
                          {pos.stueck % 1 === 0 ? pos.stueck.toFixed(0) : pos.stueck.toFixed(2)}
                        </td>
                        <td className="text-right px-3 py-3">
                          <p className="text-white text-xs font-mono">{formatEur(pos.livePriceEur)}</p>
                          {pos.liveChangePercent !== null && (
                            <p className={`text-[10px] font-mono ${pos.liveChangePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {pos.liveChangePercent >= 0 ? '+' : ''}{pos.liveChangePercent.toFixed(1)}%
                            </p>
                          )}
                        </td>
                        <td className="text-right px-3 py-3 text-white text-xs font-mono font-bold">
                          {formatEur(pos.currentValue)}
                        </td>
                        <td className="text-right px-3 py-3">
                          <p className={`text-xs font-mono font-bold ${pos.gainLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {pos.gainLoss >= 0 ? '+' : ''}{formatEur(pos.gainLoss)}
                          </p>
                          <p className={`text-[10px] font-mono ${pos.gainLossPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {pos.gainLossPercent >= 0 ? '+' : ''}{formatPercent(pos.gainLossPercent)}
                          </p>
                        </td>
                        <td className="text-right px-3 py-3">
                          {dailyEur !== null ? (
                            <p className={`text-xs font-mono font-bold ${dailyEur >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {dailyEur >= 0 ? '+' : ''}{formatEur(dailyEur)}
                            </p>
                          ) : (
                            <span className="text-gray-600 text-xs">—</span>
                          )}
                        </td>
                        <td className="text-right px-3 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 bg-[#1a1f37] rounded-full h-1.5">
                              <div className="h-1.5 rounded-full bg-[#f0b90b]" style={{ width: `${Math.min(percent, 100)}%` }} />
                            </div>
                            <span className="text-gray-400 text-[10px] font-mono w-10 text-right">{formatPercent(percent)}</span>
                          </div>
                        </td>
                        <td className="text-center px-3 py-3">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                            pos.category === 'aktie' ? 'bg-[#60B5FF]/10 text-[#60B5FF]' :
                            pos.category === 'etf'   ? 'bg-[#f0b90b]/10 text-[#f0b90b]' :
                            pos.category === 'etp'   ? 'bg-[#f59e0b]/10 text-[#f59e0b]' :
                            'bg-[#8b5cf6]/10 text-[#8b5cf6]'
                          }`}>
                            {CATEGORY_LABELS[pos.category]}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-[#f0b90b]/20">
                  <td className="px-4 py-3 text-white font-bold text-sm" colSpan={3}>Gesamt</td>
                  <td className="text-right px-3 py-3 text-white font-bold text-sm font-mono">{formatEur(totalValue)}</td>
                  <td className="text-right px-3 py-3">
                    <span className={`font-bold text-sm font-mono ${totalGainLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {totalGainLoss >= 0 ? '+' : ''}{formatEur(totalGainLoss)}
                    </span>
                  </td>
                  <td className="text-right px-3 py-3">
                    <span className={`font-bold text-sm font-mono ${totalDailyChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {totalDailyChange >= 0 ? '+' : ''}{formatEur(totalDailyChange)}
                    </span>
                  </td>
                  <td className="text-right px-3 py-3 text-gray-400 text-xs">100%</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="px-4 py-2 border-t border-[#1a1f37] flex items-center justify-between">
            <p className="text-[10px] text-gray-600">Kurse: Yahoo Finance (Live) • Keine offizielle Trade Republic API verfügbar</p>
            <p className="text-[10px] text-gray-600">Aktualisiert: {new Date(data.lastUpdate).toLocaleString('de-DE')}</p>
          </div>
        </div>
      )}

      {/* Tab: Verlauf */}
      {activeTab === 'verlauf' && (
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <LineChartIcon className="w-4 h-4 text-[#f0b90b]" />
            Depot-Entwicklung (6 Monate)
          </h3>
          {chartLoading ? (
            <div className="h-72 flex items-center justify-center text-gray-400">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" /> Lade Kursdaten…
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-72 flex items-center justify-center text-gray-500 text-sm">Keine Verlaufsdaten verfügbar</div>
          ) : (
            <>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="depotGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f0b90b" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#f0b90b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a1f37" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: '#6b7280' }}
                      tickFormatter={(d) => new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })}
                      interval={Math.floor(chartData.length / 6)}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#6b7280' }}
                      tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`}
                      width={45}
                    />
                    <Tooltip
                      contentStyle={{ background: '#1a1f37', border: '1px solid #2a2f47', borderRadius: 8, fontSize: 12, color: '#fff' }}
                      formatter={(v: number) => [formatEur(v), 'Depotwert']}
                      labelFormatter={(d) => new Date(d).toLocaleDateString('de-DE')}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#f0b90b"
                      strokeWidth={2}
                      fill="url(#depotGrad)"
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[10px] text-gray-600 mt-3">
                Historische Kurse via Yahoo Finance · Näherungswerte basierend auf aktuellem EUR-Kurs
              </p>
            </>
          )}
        </div>
      )}

      {/* Tab: Allokation */}
      {activeTab === 'allokation' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Strategy Pie Chart */}
          <div className="glass-card rounded-xl p-5">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#f0b90b]" />
              Strategie-Allokation
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={strategyAllocation.filter(s => s.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    dataKey="value"
                    nameKey="label"
                    stroke="#0f1629"
                    strokeWidth={2}
                  >
                    {strategyAllocation.filter(s => s.value > 0).map((entry) => (
                      <Cell key={entry.key} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#1a1f37', border: '1px solid #2a2f47', borderRadius: 8, fontSize: 12, color: '#fff' }}
                    formatter={(value: number) => formatEur(value)}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-3">
              {strategyAllocation.filter(s => s.value > 0).map(s => (
                <div key={s.key} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: s.color }} />
                    <span className="text-gray-300">{s.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-white font-mono">{formatEur(s.value)}</span>
                    <span className="text-gray-400 font-mono w-12 text-right">{formatPercent(s.actualPercent)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Category Pie Chart */}
          <div className="glass-card rounded-xl p-5">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#60B5FF]" />
              Asset-Klassen
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryAllocation}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    dataKey="value"
                    nameKey="label"
                    stroke="#0f1629"
                    strokeWidth={2}
                  >
                    {categoryAllocation.map((entry) => (
                      <Cell key={entry.key} fill={categoryColors[entry.key] ?? '#888'} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#1a1f37', border: '1px solid #2a2f47', borderRadius: 8, fontSize: 12, color: '#fff' }}
                    formatter={(value: number) => formatEur(value)}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-3">
              {categoryAllocation.map(c => (
                <div key={c.key} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: categoryColors[c.key] }} />
                    <span className="text-gray-300">{c.label}</span>
                    <span className="text-gray-600">({c.count})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-white font-mono">{formatEur(c.value)}</span>
                    <span className="text-gray-400 font-mono w-12 text-right">{formatPercent(c.percent)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Soll vs Ist Bar Chart */}
          <div className="glass-card rounded-xl p-5 lg:col-span-2">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#f0b90b]" />
              Soll vs. Ist – Strategie-Verteilung
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={strategyAllocation.map(s => ({
                    name: s.label.split('/')[0].trim(),
                    Ist: Math.round(s.actualPercent * 10) / 10,
                    Soll: s.targetPercent,
                  }))}
                  margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1f37" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} unit="%" />
                  <Tooltip
                    contentStyle={{ background: '#1a1f37', border: '1px solid #2a2f47', borderRadius: 8, fontSize: 12, color: '#fff' }}
                    formatter={(value: number) => `${value}%`}
                  />
                  <Bar dataKey="Soll" fill="#2a2f47" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Ist" fill="#f0b90b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-6 mt-2 text-xs text-gray-400">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-[#2a2f47]" /> Soll</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-[#f0b90b]" /> Ist</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Balancing */}
      {activeTab === 'balancing' && (
        <div className="space-y-4">
          <div className="glass-card rounded-xl p-5">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#f0b90b]" />
              Depot-Balancing – Empfehlungen
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Basierend auf deiner aktuellen Depot-Struktur und empfohlenen Zielwerten.
            </p>
            <div className="space-y-3">
              {balancingHints.map((hint, i) => (
                <div key={i} className={`rounded-lg p-4 border-l-4 ${
                  hint.type === 'warning' ? 'bg-yellow-500/5 border-yellow-500' :
                  hint.type === 'success' ? 'bg-green-500/5 border-green-500' :
                  'bg-blue-500/5 border-blue-500'
                }`}>
                  <div className="flex items-start gap-3">
                    {hint.type === 'warning' && <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />}
                    {hint.type === 'success' && <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />}
                    {hint.type === 'info' && <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />}
                    <div>
                      <p className={`text-sm font-medium ${
                        hint.type === 'warning' ? 'text-yellow-400' :
                        hint.type === 'success' ? 'text-green-400' :
                        'text-blue-400'
                      }`}>
                        {hint.text}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{hint.detail}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rebalancing Rechner */}
          <div className="glass-card rounded-xl p-5">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-[#60B5FF]" />
              Rebalancing-Übersicht
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[#1a1f37] text-gray-500">
                    <th className="text-left px-3 py-2">Strategie</th>
                    <th className="text-right px-3 py-2">Soll</th>
                    <th className="text-right px-3 py-2">Ist</th>
                    <th className="text-right px-3 py-2">Differenz</th>
                    <th className="text-right px-3 py-2">Betrag</th>
                    <th className="text-center px-3 py-2">Aktion</th>
                  </tr>
                </thead>
                <tbody>
                  {strategyAllocation.map(s => {
                    const targetValue = (s.targetPercent / 100) * totalValue;
                    const diffValue = s.value - targetValue;
                    return (
                      <tr key={s.key} className="border-b border-[#1a1f37]/50">
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: s.color }} />
                            <span className="text-gray-300">{s.label}</span>
                          </div>
                        </td>
                        <td className="text-right px-3 py-2 text-gray-400 font-mono">{formatPercent(s.targetPercent)}</td>
                        <td className="text-right px-3 py-2 text-white font-mono font-medium">{formatPercent(s.actualPercent)}</td>
                        <td className={`text-right px-3 py-2 font-mono font-medium ${
                          Math.abs(s.diff) <= 3 ? 'text-green-400' :
                          Math.abs(s.diff) <= 8 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {s.diff >= 0 ? '+' : ''}{formatPercent(s.diff)}
                        </td>
                        <td className={`text-right px-3 py-2 font-mono ${
                          diffValue >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {diffValue >= 0 ? '+' : ''}{formatEur(diffValue)}
                        </td>
                        <td className="text-center px-3 py-2">
                          {Math.abs(s.diff) <= 3 ? (
                            <span className="text-green-400">✔ OK</span>
                          ) : s.diff > 0 ? (
                            <span className="text-yellow-400">Reduzieren</span>
                          ) : (
                            <span className="text-blue-400">Aufstocken</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="glass-card rounded-xl p-4">
            <p className="text-[10px] text-gray-600 leading-relaxed">
              <strong className="text-gray-500">Hinweis:</strong> Die Balancing-Empfehlungen basieren auf allgemeinen Anlageregeln und ersetzen keine professionelle Anlageberatung.
              Trade Republic bietet keine offizielle API an – Depot-Daten werden manuell gepflegt, Live-Kurse kommen von Yahoo Finance.
              Alle Angaben ohne Gewähr.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
