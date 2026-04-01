'use client';

import { AlertTriangle, TrendingDown, TrendingUp, Zap } from 'lucide-react';
import type { StockData } from '@/lib/types';

export default function EarlyWarnings({ data }: { data: StockData }) {
  const warnings: { text: string; type: 'danger' | 'warning' | 'success'; icon: any }[] = [];
  const rsi = data?.rsi ?? 50;

  if (rsi > 80) {
    warnings.push({ text: `RSI bei ${rsi?.toFixed?.(1) ?? '?'} – Überkauft! Short-Kandidat.`, type: 'danger', icon: TrendingDown });
  } else if (rsi > 70) {
    warnings.push({ text: `RSI bei ${rsi?.toFixed?.(1) ?? '?'} – Im oberen Bereich. Vorsicht geboten.`, type: 'warning', icon: AlertTriangle });
  } else if (rsi < 30) {
    warnings.push({ text: `RSI bei ${rsi?.toFixed?.(1) ?? '?'} – Überverkauft! Nachkauf-Kandidat.`, type: 'success', icon: TrendingUp });
  }

  if ((data?.kgv ?? 0) > 40) {
    warnings.push({ text: `KGV von ${data?.kgv?.toFixed?.(1) ?? '?'} – Extreme Bewertung!`, type: 'danger', icon: AlertTriangle });
  }

  if ((data?.verschuldungsgrad ?? 0) > 2) {
    warnings.push({ text: `Verschuldungsgrad ${data?.verschuldungsgrad?.toFixed?.(2) ?? '?'} – Hohe Verschuldung!`, type: 'warning', icon: AlertTriangle });
  }

  if (data?.trend === 'Abwärtstrend') {
    warnings.push({ text: 'Aktie im Abwärtstrend (unter MA50 & MA200)', type: 'warning', icon: TrendingDown });
  }

  if (warnings.length === 0) {
    warnings.push({ text: 'Keine Frühwarnsignale aktiv. Situation stabil.', type: 'success', icon: Zap });
  }

  const colorMap = {
    danger: 'border-red-500/30 bg-red-500/5 text-red-400',
    warning: 'border-orange-500/30 bg-orange-500/5 text-orange-400',
    success: 'border-green-500/30 bg-green-500/5 text-green-400',
  };

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-gray-400 flex items-center gap-2">
        <Zap className="w-4 h-4 text-[#f0b90b]" />
        Frühwarnsignale
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {warnings.map((w: any, i: number) => {
          const WIcon = w?.icon ?? AlertTriangle;
          return (
            <div key={i} className={`glass-card rounded-lg p-3 border ${colorMap[w?.type as keyof typeof colorMap] ?? colorMap.warning} flex items-center gap-3`}>
              <WIcon className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{w?.text ?? ''}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}