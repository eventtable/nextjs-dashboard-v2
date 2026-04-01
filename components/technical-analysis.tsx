'use client';

import { Activity, TrendingUp, ArrowUp, ArrowDown, Target } from 'lucide-react';
import type { StockData } from '@/lib/types';
import { formatNumber } from '@/lib/stock-utils';

export default function TechnicalAnalysis({ data }: { data: StockData }) {
  const rsi = data?.rsi ?? 50;
  const rsiColor = rsi > 70 ? '#ef4444' : rsi < 30 ? '#22c55e' : '#f0b90b';
  const rsiLabel = rsi > 80 ? 'Überkauft (Short!)' : rsi > 70 ? 'Überkauft' : rsi < 30 ? 'Überverkauft (Nachkauf!)' : rsi < 40 ? 'Leicht überverkauft' : 'Neutral';

  const rsiPercent = Math.min(Math.max(rsi, 0), 100);

  return (
    <div className="glass-card rounded-xl p-5">
      <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
        <span className="text-lg">{String.fromCodePoint(0x1F4C8)}</span> Technische Analyse
      </h3>

      {/* RSI Gauge */}
      <div className="mb-5">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-400">RSI (14-Tage)</span>
          <span className="text-sm font-bold" style={{ color: rsiColor }}>{formatNumber(rsi, 1)} – {rsiLabel}</span>
        </div>
        <div className="relative h-3 bg-[#1a1f37] rounded-full overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full rounded-full transition-all duration-700"
            style={{ width: `${rsiPercent}%`, backgroundColor: rsiColor }}
          />
          {/* Zone markers */}
          <div className="absolute left-[30%] top-0 h-full w-px bg-green-500/30" />
          <div className="absolute left-[70%] top-0 h-full w-px bg-red-500/30" />
        </div>
        <div className="flex justify-between text-[10px] text-gray-600 mt-1">
          <span>0 (Überverkauft)</span>
          <span>30</span>
          <span>50</span>
          <span>70</span>
          <span>100 (Überkauft)</span>
        </div>
      </div>

      {/* Trend Info */}
      <div className="space-y-3">
        <div className="flex items-center justify-between py-2 border-b border-[#1a1f37]">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#f0b90b]" />
            <span className="text-sm text-gray-400">Trendrichtung</span>
          </div>
          <span className={`text-sm font-semibold ${
            data?.trend === 'Aufwärtstrend' ? 'text-green-400' :
            data?.trend === 'Abwärtstrend' ? 'text-red-400' : 'text-yellow-400'
          }`}>{data?.trend ?? 'N/A'}</span>
        </div>

        <div className="flex items-center justify-between py-2 border-b border-[#1a1f37]">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#60B5FF]" />
            <span className="text-sm text-gray-400">MA50</span>
          </div>
          <span className="text-sm font-semibold text-white">{data?.ma50 ? formatNumber(data.ma50) : 'N/A'}</span>
        </div>

        <div className="flex items-center justify-between py-2 border-b border-[#1a1f37]">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#FF9149]" />
            <span className="text-sm text-gray-400">MA200</span>
          </div>
          <span className="text-sm font-semibold text-white">{data?.ma200 ? formatNumber(data.ma200) : 'N/A'}</span>
        </div>

        <div className="flex items-center justify-between py-2 border-b border-[#1a1f37]">
          <div className="flex items-center gap-2">
            <ArrowDown className="w-4 h-4 text-green-400" />
            <span className="text-sm text-gray-400">Unterstützung (52W Tief)</span>
          </div>
          <span className="text-sm font-semibold text-green-400">{data?.support ? formatNumber(data.support) : 'N/A'}</span>
        </div>

        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            <ArrowUp className="w-4 h-4 text-red-400" />
            <span className="text-sm text-gray-400">Widerstand (52W Hoch)</span>
          </div>
          <span className="text-sm font-semibold text-red-400">{data?.resistance ? formatNumber(data.resistance) : 'N/A'}</span>
        </div>

        {data?.targetMeanPrice !== null && data?.targetMeanPrice !== undefined && (
          <div className="flex items-center justify-between py-2 border-t border-[#1a1f37]">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-[#f0b90b]" />
              <span className="text-sm text-gray-400">Analysten-Kursziel</span>
            </div>
            <span className="text-sm font-semibold text-[#f0b90b]">{formatNumber(data.targetMeanPrice)} {data?.currency ?? ''}</span>
          </div>
        )}
      </div>
    </div>
  );
}