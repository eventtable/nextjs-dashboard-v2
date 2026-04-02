'use client';

import { useState, useEffect, useCallback } from 'react';
import SharedHeader from '@/components/shared-header';
import { BarChart2, TrendingUp, TrendingDown, Minus, RefreshCw, Clock } from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, Tooltip as ReTooltip, ReferenceLine,
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
  trend: 'bullish' | 'bearish' | 'neutral';
  trendLabel: string;
  ma20: number;
  ma50: number;
  sparkline: { t: number; v: number }[];
}

const REGION_ORDER = ['Deutschland', 'Europa', 'UK', 'USA', 'Japan', 'HK', 'Rohstoff', 'Währung', 'Volatilität'];

function Sparkline({ data, trend }: { data: { t: number; v: number }[]; trend: string }) {
  if (!data.length) return <div className="h-12 flex items-center justify-center text-gray-600 text-xs">Keine Daten</div>;
  const color = trend === 'bullish' ? '#22c55e' : trend === 'bearish' ? '#ef4444' : '#6b7280';
  const fillId = `fill-${trend}`;
  return (
    <ResponsiveContainer width="100%" height={52}>
      <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.25} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5}
          fill={`url(#${fillId})`} dot={false} isAnimationActive={false} />
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
    <span className="flex items-center gap-1 text-xs font-semibold text-green-400 bg-green-500/15 border border-green-500/25 px-2 py-0.5 rounded-full">
      <TrendingUp className="w-3 h-3" />{label}
    </span>
  );
  if (trend === 'bearish') return (
    <span className="flex items-center gap-1 text-xs font-semibold text-red-400 bg-red-500/15 border border-red-500/25 px-2 py-0.5 rounded-full">
      <TrendingDown className="w-3 h-3" />{label}
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-xs font-semibold text-gray-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
      <Minus className="w-3 h-3" />{label}
    </span>
  );
}

function ChangeCell({ value }: { value: number }) {
  const col = value > 0.5 ? 'text-green-400' : value < -0.5 ? 'text-red-400' : 'text-gray-400';
  return <span className={`text-xs font-semibold tabular-nums ${col}`}>{value > 0 ? '+' : ''}{value.toFixed(2)}%</span>;
}

function IndexCard({ idx }: { idx: IndexData }) {
  const priceStr = idx.price != null
    ? idx.price.toLocaleString('de-DE', { maximumFractionDigits: idx.price > 1000 ? 0 : 2 })
    : '—';

  return (
    <div className="glass-card rounded-xl p-4 border border-[#1a1f37] flex flex-col gap-3 hover:border-[#2a2f47] transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-bold text-white text-sm truncate">{idx.name}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">{idx.region} · {idx.symbol}</p>
        </div>
        <TrendBadge trend={idx.trend} label={idx.trendLabel} />
      </div>

      {/* Sparkline */}
      <Sparkline data={idx.sparkline} trend={idx.trend} />

      {/* Price */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-lg font-bold text-white tabular-nums">{priceStr}</p>
          <p className="text-[10px] text-gray-500">{idx.currency || 'Punkte'}</p>
        </div>
        <div className="text-right space-y-0.5">
          <div className="flex items-center justify-end gap-1.5">
            <span className="text-[10px] text-gray-600">Heute</span>
            <ChangeCell value={idx.changeDay} />
          </div>
          <div className="flex items-center justify-end gap-1.5">
            <span className="text-[10px] text-gray-600">1M</span>
            <ChangeCell value={idx.change1M} />
          </div>
          <div className="flex items-center justify-end gap-1.5">
            <span className="text-[10px] text-gray-600">3M</span>
            <ChangeCell value={idx.change3M} />
          </div>
        </div>
      </div>

      {/* MA indicator */}
      {idx.price != null && (
        <div className="flex items-center gap-3 pt-2 border-t border-[#1a1f37] text-[10px] text-gray-500">
          <span className={idx.price > idx.ma20 ? 'text-green-400' : 'text-red-400'}>
            MA20 {idx.price > idx.ma20 ? '▲' : '▼'} {idx.ma20.toLocaleString('de-DE', { maximumFractionDigits: 0 })}
          </span>
          <span className={idx.price > idx.ma50 ? 'text-green-400' : 'text-red-400'}>
            MA50 {idx.price > idx.ma50 ? '▲' : '▼'} {idx.ma50.toLocaleString('de-DE', { maximumFractionDigits: 0 })}
          </span>
        </div>
      )}
    </div>
  );
}

// Summarize overall market mood
function MarketMood({ indices }: { indices: IndexData[] }) {
  const major = indices.filter(i => ['S&P 500', 'DAX', 'NASDAQ', 'Euro Stoxx 50'].includes(i.name));
  const bulls = major.filter(i => i.trend === 'bullish').length;
  const bears = major.filter(i => i.trend === 'bearish').length;
  const avgDay = major.reduce((s, i) => s + i.changeDay, 0) / (major.length || 1);

  let mood: string; let moodColor: string; let moodIcon: React.ReactNode;
  if (bulls >= 3) { mood = 'Risk-On — Märkte im Aufwärtstrend'; moodColor = 'text-green-400'; moodIcon = <TrendingUp className="w-5 h-5 text-green-400" />; }
  else if (bears >= 3) { mood = 'Risk-Off — Breiter Abverkauf'; moodColor = 'text-red-400'; moodIcon = <TrendingDown className="w-5 h-5 text-red-400" />; }
  else { mood = 'Gemischt — kein klarer Trend'; moodColor = 'text-yellow-400'; moodIcon = <Minus className="w-5 h-5 text-yellow-400" />; }

  return (
    <div className="glass-card rounded-xl p-4 border border-[#1a1f37] flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-2">
        {moodIcon}
        <span className={`font-semibold text-sm ${moodColor}`}>{mood}</span>
      </div>
      <div className="flex items-center gap-4 text-xs text-gray-400 ml-auto">
        <span>Major-Indizes: <span className="text-green-400 font-semibold">{bulls} ↑</span> / <span className="text-red-400 font-semibold">{bears} ↓</span></span>
        <span>Ø Tagesveränderung: <ChangeCell value={avgDay} /></span>
      </div>
    </div>
  );
}

export default function IndizesPage() {
  const [indices, setIndices] = useState<IndexData[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

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

  // Group by region order
  const grouped: Record<string, IndexData[]> = {};
  for (const idx of indices) {
    if (!grouped[idx.region]) grouped[idx.region] = [];
    grouped[idx.region].push(idx);
  }
  const orderedGroups = REGION_ORDER.filter(r => grouped[r]);

  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      <SharedHeader />
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 pt-24 pb-12 space-y-6">

        {/* Title */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <BarChart2 className="w-7 h-7 text-[#f0b90b]" />
              Markt-Indizes
            </h1>
            <p className="text-gray-400 text-sm mt-1">Weltweite Indizes, Rohstoffe &amp; Währungen mit Trendanalyse</p>
          </div>
          <div className="flex items-center gap-3">
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="glass-card rounded-xl p-4 border border-[#1a1f37] h-48 animate-pulse bg-[#1a1f37]/30" />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Market mood summary */}
            {indices.length > 0 && <MarketMood indices={indices} />}

            {/* Grouped grids */}
            {orderedGroups.map(region => (
              <div key={region}>
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{region}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {grouped[region].map(idx => (
                    <IndexCard key={idx.symbol} idx={idx} />
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
