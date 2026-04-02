'use client';

import { useState, useEffect, useCallback } from 'react';
import SharedHeader from '@/components/shared-header';
import { BarChart2, TrendingUp, TrendingDown, Minus, RefreshCw, Clock } from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, Tooltip as ReTooltip, ReferenceLine, YAxis,
} from 'recharts';

interface IndexData {
  symbol: string;
  name: string;
  region: string;
  currency: string;
  price: number | null;
  changeDay: number;
  change1M: number;
  change3M: number;
  changeYTD: number;
  trend: 'bullish' | 'bearish' | 'neutral';
  trendLabel: string;
  ma20: number;
  ma50: number;
  high52w: number;
  low52w: number;
  sparkline: { t: number; v: number }[];
}

const FIB_LEVELS = [
  { level: 0,     label: '0%',    color: '#9ca3af' },
  { level: 0.236, label: '23.6%', color: '#60B5FF' },
  { level: 0.382, label: '38.2%', color: '#a855f7' },
  { level: 0.5,   label: '50%',   color: '#f0b90b' },
  { level: 0.618, label: '61.8%', color: '#22c55e' },
  { level: 0.786, label: '78.6%', color: '#f97316' },
  { level: 1,     label: '100%',  color: '#9ca3af' },
];

const REGION_ORDER = ['Deutschland', 'Europa', 'UK', 'USA', 'Japan', 'HK', 'Rohstoff', 'Währung', 'Volatilität'];

function YearChart({ data, trend, high52w, low52w, showFib }: {
  data: { t: number; v: number }[];
  trend: string;
  high52w: number;
  low52w: number;
  showFib: boolean;
}) {
  if (!data.length) return <div className="h-28 flex items-center justify-center text-gray-600 text-[10px]">Keine Daten</div>;
  const color = trend === 'bullish' ? '#22c55e' : trend === 'bearish' ? '#ef4444' : '#6b7280';
  const range = high52w - low52w;
  const yMin = low52w - range * 0.04;
  const yMax = high52w + range * 0.04;

  return (
    <ResponsiveContainer width="100%" height={110}>
      <AreaChart data={data} margin={{ top: 2, right: 36, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`g-${trend}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.2} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <YAxis domain={[yMin, yMax]} hide />
        {showFib && range > 0 && FIB_LEVELS.map(fib => {
          const fibPrice = high52w - range * fib.level;
          return (
            <ReferenceLine key={fib.level} y={fibPrice} stroke={fib.color}
              strokeWidth={1} strokeDasharray="3 3" strokeOpacity={0.7}
              label={{ value: fib.label, position: 'right', fill: fib.color, fontSize: 8 }}
            />
          );
        })}
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5}
          fill={`url(#g-${trend})`} dot={false} isAnimationActive={false} />
        <ReTooltip
          contentStyle={{ background: '#0f1629', border: '1px solid #1a1f37', borderRadius: '6px', fontSize: '11px', padding: '4px 8px' }}
          formatter={(v: number) => [v.toLocaleString('de-DE', { maximumFractionDigits: 2 }), '']}
          labelFormatter={() => ''}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function TrendBadge({ trend, label }: { trend: string; label: string }) {
  if (trend === 'bullish') return (
    <span className="flex items-center gap-1 text-[11px] font-semibold text-green-400 bg-green-500/15 border border-green-500/25 px-1.5 py-0.5 rounded-full whitespace-nowrap">
      <TrendingUp className="w-3 h-3" />{label}
    </span>
  );
  if (trend === 'bearish') return (
    <span className="flex items-center gap-1 text-[11px] font-semibold text-red-400 bg-red-500/15 border border-red-500/25 px-1.5 py-0.5 rounded-full whitespace-nowrap">
      <TrendingDown className="w-3 h-3" />{label}
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-[11px] font-semibold text-gray-400 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded-full whitespace-nowrap">
      <Minus className="w-3 h-3" />{label}
    </span>
  );
}

function Chg({ value }: { value: number }) {
  const col = value > 0.5 ? 'text-green-400' : value < -0.5 ? 'text-red-400' : 'text-gray-400';
  return <span className={`text-xs font-semibold tabular-nums ${col}`}>{value > 0 ? '+' : ''}{value.toFixed(2)}%</span>;
}

function IndexCard({ idx, showFib }: { idx: IndexData; showFib: boolean }) {
  const priceStr = idx.price != null
    ? idx.price.toLocaleString('de-DE', { maximumFractionDigits: idx.price > 1000 ? 0 : 2 })
    : '—';

  const fibProgress = idx.high52w > idx.low52w
    ? ((idx.price ?? idx.low52w) - idx.low52w) / (idx.high52w - idx.low52w)
    : 0.5;

  return (
    <div className="glass-card rounded-xl p-4 border border-[#1a1f37] flex flex-col gap-2 hover:border-[#2a2f47] transition-colors">
      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="font-bold text-white text-base leading-tight truncate">{idx.name}</p>
          <p className="text-[10px] text-gray-500">{idx.region} · {idx.symbol}</p>
        </div>
        <TrendBadge trend={idx.trend} label={idx.trendLabel} />
      </div>

      {/* Price + changes */}
      <div className="flex items-center justify-between">
        <p className="text-2xl font-bold text-white tabular-nums leading-none">{priceStr}
          <span className="text-[10px] text-gray-500 font-normal ml-1">{idx.currency || 'Pkt'}</span>
        </p>
        <div className="text-right space-y-0.5">
          <div className="flex items-center justify-end gap-1"><span className="text-[10px] text-gray-600">Heute</span><Chg value={idx.changeDay} /></div>
          <div className="flex items-center justify-end gap-1"><span className="text-[10px] text-gray-600">1M</span><Chg value={idx.change1M} /></div>
          <div className="flex items-center justify-end gap-1"><span className="text-[10px] text-gray-600">YTD</span><Chg value={idx.changeYTD} /></div>
        </div>
      </div>

      {/* Year chart */}
      <YearChart data={idx.sparkline} trend={idx.trend} high52w={idx.high52w} low52w={idx.low52w} showFib={showFib} />

      {/* 52w range bar */}
      {idx.high52w > idx.low52w && (
        <div>
          <div className="flex justify-between text-[9px] text-gray-600 mb-0.5">
            <span>{idx.low52w.toLocaleString('de-DE', { maximumFractionDigits: 0 })} 52W-T</span>
            <span>52W-H {idx.high52w.toLocaleString('de-DE', { maximumFractionDigits: 0 })}</span>
          </div>
          <div className="relative h-1.5 bg-[#1a1f37] rounded-full overflow-visible">
            <div className="absolute inset-y-0 left-0 rounded-full"
              style={{ width: `${Math.max(2, Math.min(98, fibProgress * 100))}%`, background: idx.trend === 'bullish' ? '#22c55e' : idx.trend === 'bearish' ? '#ef4444' : '#6b7280' }} />
            <div className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 border-[#0a0e1a]"
              style={{ left: `${Math.max(2, Math.min(96, fibProgress * 100))}%`, transform: 'translate(-50%, -50%)', background: idx.trend === 'bullish' ? '#22c55e' : idx.trend === 'bearish' ? '#ef4444' : '#6b7280' }} />
          </div>
        </div>
      )}

      {/* MA row */}
      <div className="flex items-center gap-3 text-[10px] text-gray-500 pt-1 border-t border-[#1a1f37]">
        <span className={idx.price != null && idx.price > idx.ma20 ? 'text-green-400' : 'text-red-400'}>
          MA20 {idx.price != null && idx.price > idx.ma20 ? '▲' : '▼'} {idx.ma20.toLocaleString('de-DE', { maximumFractionDigits: 0 })}
        </span>
        <span className={idx.price != null && idx.price > idx.ma50 ? 'text-green-400' : 'text-red-400'}>
          MA50 {idx.price != null && idx.price > idx.ma50 ? '▲' : '▼'} {idx.ma50.toLocaleString('de-DE', { maximumFractionDigits: 0 })}
        </span>
      </div>
    </div>
  );
}

function MarketMood({ indices }: { indices: IndexData[] }) {
  const major = indices.filter(i => ['S&P 500', 'DAX', 'NASDAQ', 'Euro Stoxx 50'].includes(i.name));
  const bulls = major.filter(i => i.trend === 'bullish').length;
  const bears = major.filter(i => i.trend === 'bearish').length;
  const avgDay = major.reduce((s, i) => s + i.changeDay, 0) / (major.length || 1);

  let mood: string; let moodColor: string; let icon: React.ReactNode;
  if (bulls >= 3) { mood = 'Risk-On — Märkte im Aufwärtstrend'; moodColor = 'text-green-400'; icon = <TrendingUp className="w-4 h-4 text-green-400" />; }
  else if (bears >= 3) { mood = 'Risk-Off — Breiter Abverkauf'; moodColor = 'text-red-400'; icon = <TrendingDown className="w-4 h-4 text-red-400" />; }
  else { mood = 'Gemischt — kein klarer Trend'; moodColor = 'text-yellow-400'; icon = <Minus className="w-4 h-4 text-yellow-400" />; }

  return (
    <div className="glass-card rounded-xl p-3 border border-[#1a1f37] flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-2">{icon}<span className={`font-semibold text-sm ${moodColor}`}>{mood}</span></div>
      <div className="flex items-center gap-4 text-xs text-gray-400 ml-auto">
        <span>Major: <span className="text-green-400 font-semibold">{bulls}↑</span> / <span className="text-red-400 font-semibold">{bears}↓</span></span>
        <span>Ø Tag: <Chg value={avgDay} /></span>
      </div>
    </div>
  );
}

export default function IndizesPage() {
  const [indices, setIndices] = useState<IndexData[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showFib, setShowFib] = useState(true);

  const load = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const res = await fetch('/api/indizes');
      const data = await res.json();
      setIndices(data.indices ?? []);
      setUpdatedAt(data.updatedAt ?? null);
    } catch { /* ignore */ }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const grouped: Record<string, IndexData[]> = {};
  for (const idx of indices) {
    if (!grouped[idx.region]) grouped[idx.region] = [];
    grouped[idx.region].push(idx);
  }
  const orderedGroups = REGION_ORDER.filter(r => grouped[r]);

  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      <SharedHeader />
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 pt-24 pb-12 space-y-5">

        {/* Title bar */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <BarChart2 className="w-7 h-7 text-[#f0b90b]" />
              Markt-Indizes
            </h1>
            <p className="text-gray-400 text-sm mt-0.5">Weltweite Indizes, Rohstoffe &amp; Währungen · Jahreschart mit Fibonacci</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowFib(v => !v)}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${showFib ? 'border-[#f0b90b]/50 text-[#f0b90b] bg-[#f0b90b]/10' : 'border-[#2a2f47] text-gray-500'}`}>
              〜 Fibonacci {showFib ? 'an' : 'aus'}
            </button>
            {updatedAt && (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                {new Date(updatedAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <button onClick={() => load(true)} disabled={refreshing}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white bg-[#1a1f37] border border-[#2a2f47] px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Aktualisieren
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="glass-card rounded-xl p-4 border border-[#1a1f37] h-64 animate-pulse bg-[#1a1f37]/30" />
            ))}
          </div>
        ) : (
          <div className="space-y-5">
            {indices.length > 0 && <MarketMood indices={indices} />}

            {/* All indices in one tight tile grid, with region labels inline */}
            {orderedGroups.map(region => (
              <div key={region}>
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-2">{region}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
                  {grouped[region].map(idx => (
                    <IndexCard key={idx.symbol} idx={idx} showFib={showFib} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
