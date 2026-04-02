'use client';

import { useState, useRef, useCallback, useMemo } from 'react';
import { BarChart2, TrendingUp } from 'lucide-react';
import type { StockData } from '@/lib/types';

type ChartPoint = { date: string; open?: number | null; high?: number | null; low?: number | null; close: number; volume?: number };

function calcEMA(prices: number[], period: number): (number | null)[] {
  const k = 2 / (period + 1);
  const result: (number | null)[] = new Array(prices.length).fill(null);
  let first = -1;
  for (let i = 0; i < prices.length; i++) {
    if (prices[i] > 0) { first = i; break; }
  }
  if (first === -1) return result;
  result[first] = prices[first];
  for (let i = first + 1; i < prices.length; i++) {
    if (!prices[i]) continue;
    result[i] = prices[i] * k + (result[i - 1] ?? prices[i]) * (1 - k);
  }
  return result;
}

const EMA_CONFIG = [
  { period: 20,  color: '#60B5FF', label: 'EMA 20'  },
  { period: 50,  color: '#f0b90b', label: 'EMA 50'  },
  { period: 100, color: '#f97316', label: 'EMA 100' },
  { period: 200, color: '#ef4444', label: 'EMA 200' },
];

interface Props {
  data: StockData;
  range: '1y' | '5y';
  onRangeChange: (r: '1y' | '5y') => void;
}

const W = 900, H = 380, VOL_H = 60;
const PAD = { top: 16, right: 68, bottom: 28, left: 8 };

export default function StockChart({ data, range, onRangeChange }: Props) {
  const [chartType, setChartType] = useState<'candle' | 'line'>('candle');
  const [activeEMAs, setActiveEMAs] = useState<Record<number, boolean>>({ 20: false, 50: true, 100: false, 200: true });
  const [tooltip, setTooltip] = useState<{ i: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const raw = (data?.chartData ?? []) as ChartPoint[];

  const pts = useMemo(() => {
    if (raw.length <= 300) return raw;
    const step = Math.ceil(raw.length / 260);
    return raw.filter((_, i) => i % step === 0);
  }, [raw]);

  const closes = pts.map(p => p.close);

  const emas = useMemo(() =>
    EMA_CONFIG.map(cfg => ({ ...cfg, values: calcEMA(closes, cfg.period) })),
    [closes]  // eslint-disable-line react-hooks/exhaustive-deps
  );

  const allPrices = pts.flatMap(p => [p.close, p.high ?? p.close, p.low ?? p.close]).filter(Boolean);
  const allEMAValues = emas.flatMap(e => activeEMAs[e.period] ? e.values.filter(v => v != null) as number[] : []);
  const allDomain = [...allPrices, ...allEMAValues];
  const priceMin = Math.min(...allDomain) * 0.998;
  const priceMax = Math.max(...allDomain) * 1.002;

  const vols = pts.map(p => p.volume ?? 0);
  const maxVol = Math.max(...vols, 1);

  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const totalH = H + VOL_H + 10;

  const xOf = (i: number) => PAD.left + (i + 0.5) * (plotW / Math.max(pts.length, 1));
  const yOf = (price: number) => PAD.top + plotH - ((price - priceMin) / (priceMax - priceMin)) * plotH;
  const yVol = (vol: number) => H + 10 + VOL_H - (vol / maxVol) * VOL_H;
  const candleW = Math.max(1.5, Math.min(10, (plotW / Math.max(pts.length, 1)) * 0.7));

  const hoveredPt = tooltip !== null ? pts[tooltip.i] : null;

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg || pts.length === 0) return;
    const rect = svg.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * W;
    const cellW = plotW / pts.length;
    const rawI = (svgX - PAD.left) / cellW - 0.5;
    setTooltip({ i: Math.max(0, Math.min(pts.length - 1, Math.round(rawI))) });
  }, [pts.length, plotW]);

  if (pts.length === 0) {
    return (
      <div className="glass-card rounded-xl p-5 text-center text-gray-500 text-sm py-10">
        Keine Chart-Daten verfügbar
      </div>
    );
  }

  const yTicks = Array.from({ length: 5 }, (_, i) => priceMin + ((priceMax - priceMin) * i) / 4);
  const xLabelStep = Math.max(1, Math.floor(pts.length / 6));
  const isOverallPositive = closes.length >= 2 && closes[closes.length - 1] >= closes[0];
  const lineColor = isOverallPositive ? '#22c55e' : '#ef4444';
  const currency = data?.currency ?? '';

  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${xOf(i)},${yOf(p.close)}`).join(' ');
  const areaPath = linePath + ` L${xOf(pts.length - 1)},${yOf(priceMin)} L${xOf(0)},${yOf(priceMin)} Z`;
  const emaPath = (values: (number | null)[]) =>
    values.reduce<string>((d, v, i) => {
      if (v == null) return d;
      return d + `${d === '' ? 'M' : 'L'}${xOf(i)},${yOf(v)}`;
    }, '');

  return (
    <div className="glass-card rounded-xl p-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-[#f0b90b]" />
          Kursverlauf {data?.ticker ?? ''}
        </h3>
        <div className="flex flex-wrap gap-2 items-center">
          {(['1y', '5y'] as const).map(r => (
            <button key={r} onClick={() => onRangeChange(r)}
              className={`px-3 py-1 text-xs rounded-lg font-semibold transition-all ${range === r ? 'bg-[#f0b90b] text-black' : 'bg-[#1a1f37] text-gray-400 hover:text-white'}`}>
              {r === '1y' ? '1J' : '5J'}
            </button>
          ))}
          <div className="flex rounded-lg overflow-hidden border border-[#2a2f47]">
            {(['candle', 'line'] as const).map(t => (
              <button key={t} onClick={() => setChartType(t)}
                className={`px-3 py-1 text-xs font-semibold transition-all ${chartType === t ? 'bg-[#f0b90b] text-black' : 'bg-[#1a1f37] text-gray-400 hover:text-white'}`}>
                {t === 'candle' ? 'Kerzen' : 'Linie'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* EMA toggles */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {EMA_CONFIG.map(cfg => (
          <button key={cfg.period}
            onClick={() => setActiveEMAs(prev => ({ ...prev, [cfg.period]: !prev[cfg.period] }))}
            className={`flex items-center gap-1 px-2.5 py-0.5 text-xs rounded-full border transition-all font-semibold ${
              activeEMAs[cfg.period] ? 'border-transparent text-black' : 'border-[#2a2f47] text-gray-500 hover:border-gray-400 bg-transparent'
            }`}
            style={activeEMAs[cfg.period] ? { backgroundColor: cfg.color } : {}}>
            <TrendingUp className="w-3 h-3" /> {cfg.label}
          </button>
        ))}
      </div>

      {/* Chart SVG */}
      <div className="relative">
        <svg ref={svgRef} viewBox={`0 0 ${W} ${totalH}`} className="w-full" style={{ height: '320px' }}
          onMouseMove={handleMouseMove} onMouseLeave={() => setTooltip(null)}>
          <defs>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={lineColor} stopOpacity={0.2} />
              <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
            </linearGradient>
            <clipPath id="pc"><rect x={PAD.left} y={PAD.top} width={plotW} height={plotH} /></clipPath>
          </defs>

          {/* Grid */}
          {yTicks.map((v, i) => (
            <line key={i} x1={PAD.left} x2={PAD.left + plotW} y1={yOf(v)} y2={yOf(v)} stroke="#1e2540" strokeWidth={1} />
          ))}

          {/* Y labels */}
          {yTicks.map((v, i) => (
            <text key={i} x={PAD.left + plotW + 5} y={yOf(v) + 4} fontSize={9} fill="#6b7280" textAnchor="start">
              {v >= 1000 ? v.toFixed(0) : v.toFixed(2)}
            </text>
          ))}

          {/* X labels */}
          {pts.map((p, i) => i % xLabelStep === 0 && (
            <text key={i} x={xOf(i)} y={H - 6} fontSize={9} fill="#6b7280" textAnchor="middle">
              {new Date(p.date).toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })}
            </text>
          ))}

          {/* Line chart */}
          {chartType === 'line' && (
            <g clipPath="url(#pc)">
              <path d={areaPath} fill="url(#lineGrad)" />
              <path d={linePath} fill="none" stroke={lineColor} strokeWidth={1.5} />
            </g>
          )}

          {/* Candlestick chart */}
          {chartType === 'candle' && (
            <g clipPath="url(#pc)">
              {pts.map((p, i) => {
                const o = p.open ?? p.close;
                const h = p.high ?? p.close;
                const l = p.low ?? p.close;
                const c = p.close;
                const isGreen = c >= o;
                const col = isGreen ? '#22c55e' : '#ef4444';
                const x = xOf(i);
                const bTop = yOf(Math.max(o, c));
                const bBot = yOf(Math.min(o, c));
                const bH   = Math.max(1, bBot - bTop);
                return (
                  <g key={p.date}>
                    <line x1={x} y1={yOf(h)} x2={x} y2={yOf(l)} stroke={col} strokeWidth={1} />
                    <rect x={x - candleW / 2} y={bTop} width={candleW} height={bH} fill={col} />
                  </g>
                );
              })}
            </g>
          )}

          {/* EMA lines */}
          {EMA_CONFIG.map(cfg => {
            if (!activeEMAs[cfg.period]) return null;
            const ema = emas.find(e => e.period === cfg.period);
            return ema ? (
              <path key={cfg.period} d={emaPath(ema.values)} fill="none"
                stroke={cfg.color} strokeWidth={1.5} clipPath="url(#pc)" />
            ) : null;
          })}

          {/* Crosshair */}
          {tooltip !== null && (
            <line x1={xOf(tooltip.i)} y1={PAD.top} x2={xOf(tooltip.i)} y2={H}
              stroke="#f0b90b" strokeWidth={1} strokeDasharray="3,3" opacity={0.5} />
          )}

          {/* Volume separator */}
          <line x1={PAD.left} x2={PAD.left + plotW} y1={H + 8} y2={H + 8} stroke="#1e2540" strokeWidth={1} />

          {/* Volume bars */}
          {pts.map((p, i) => {
            const vol = p.volume ?? 0;
            if (!vol) return null;
            const isGreen = p.close >= (p.open ?? p.close);
            return (
              <rect key={p.date + 'v'} x={xOf(i) - candleW / 2} y={yVol(vol)}
                width={candleW} height={H + 10 + VOL_H - yVol(vol)}
                fill={isGreen ? '#22c55e33' : '#ef444433'} />
            );
          })}
        </svg>

        {/* Tooltip */}
        {tooltip !== null && hoveredPt && (
          <div className="absolute pointer-events-none z-20 bg-[#12172a] border border-[#2a2f47] rounded-lg p-2.5 text-xs shadow-2xl"
            style={{
              left: `${(xOf(tooltip.i) / W * 100).toFixed(1)}%`,
              top: '8px',
              transform: tooltip.i > pts.length * 0.6 ? 'translateX(-108%)' : 'translateX(4%)',
              minWidth: '148px',
            }}>
            <p className="text-gray-400 font-medium mb-1.5">
              {new Date(hoveredPt.date).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: '2-digit' })}
            </p>
            {hoveredPt.open != null && <>
              <div className="flex justify-between gap-3"><span className="text-gray-500">Open</span><span className="font-mono text-white">{hoveredPt.open.toFixed(2)}</span></div>
              <div className="flex justify-between gap-3"><span className="text-gray-500">High</span><span className="font-mono text-green-400">{(hoveredPt.high ?? hoveredPt.close).toFixed(2)}</span></div>
              <div className="flex justify-between gap-3"><span className="text-gray-500">Low</span><span className="font-mono text-red-400">{(hoveredPt.low ?? hoveredPt.close).toFixed(2)}</span></div>
            </>}
            <div className="flex justify-between gap-3 font-bold">
              <span className="text-gray-400">Close</span>
              <span className="font-mono text-white">{hoveredPt.close.toFixed(2)} {currency}</span>
            </div>
            {EMA_CONFIG.filter(cfg => activeEMAs[cfg.period]).map(cfg => {
              const val = emas.find(e => e.period === cfg.period)?.values[tooltip.i];
              return val != null ? (
                <div key={cfg.period} className="flex justify-between gap-3 mt-0.5">
                  <span style={{ color: cfg.color }}>{cfg.label}</span>
                  <span className="font-mono" style={{ color: cfg.color }}>{val.toFixed(2)}</span>
                </div>
              ) : null;
            })}
          </div>
        )}
      </div>
      <p className="text-[10px] text-gray-600 mt-2">Yahoo Finance · OHLC-Daten · EMA = Exponentieller Gleitender Durchschnitt</p>
    </div>
  );
}
