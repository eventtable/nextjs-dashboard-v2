'use client';

import { AlertCircle, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import type { StockData } from '@/lib/types';
import { berechneAmpel } from '@/lib/stock-utils';

export default function MatrixAmpel({ data }: { data: StockData }) {
  const ampel = berechneAmpel({
    kgv: data?.kgv ?? null,
    rsi: data?.rsi ?? 50,
    fcfPositiv: (data?.freeCashflow ?? 0) > 0,
    dividendenRendite: data?.dividendenRendite ?? 0,
    umsatzWachstum: data?.revenueGrowth ?? null,
    verschuldungsgrad: data?.verschuldungsgrad ?? null,
  });

  const iconMap: Record<string, any> = {
    gruen: CheckCircle,
    gelb: AlertCircle,
    orange: AlertTriangle,
    rot: XCircle,
  };
  const Icon = iconMap[ampel?.status ?? 'gelb'] ?? AlertCircle;

  const bgMap: Record<string, string> = {
    gruen: 'from-green-500/10 to-green-500/5 border-green-500/30',
    gelb: 'from-yellow-500/10 to-yellow-500/5 border-yellow-500/30',
    orange: 'from-orange-500/10 to-orange-500/5 border-orange-500/30',
    rot: 'from-red-500/10 to-red-500/5 border-red-500/30',
  };

  return (
    <div className={`glass-card rounded-xl p-6 bg-gradient-to-r ${bgMap[ampel?.status ?? 'gelb'] ?? bgMap.gelb} border`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-5xl">{ampel?.emoji ?? '\ud83d\udfe1'}</div>
          <div>
            <h3 className="text-lg font-bold text-white">Matrix-Ampel: {ampel?.label ?? ''}</h3>
            <p className="text-sm text-gray-400 mt-1">{ampel?.beschreibung ?? ''}</p>
          </div>
        </div>
        <Icon className="w-10 h-10" style={{ color: ampel?.color ?? '#eab308' }} />
      </div>
    </div>
  );
}