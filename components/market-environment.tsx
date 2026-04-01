'use client';

import { Globe, TrendingUp, AlertTriangle, Percent } from 'lucide-react';
import type { StockData } from '@/lib/types';
import { formatNumber } from '@/lib/stock-utils';

export default function MarketEnvironment({ data }: { data: StockData }) {
  // Simple macro score based on available data
  let macroScore = 5;
  const rsi = data?.rsi ?? 50;
  if (rsi > 70) macroScore -= 1;
  if (rsi < 30) macroScore += 1;
  if (data?.trend === 'Aufwärtstrend') macroScore += 1;
  if (data?.trend === 'Abwärtstrend') macroScore -= 1;
  if ((data?.revenueGrowth ?? 0) > 10) macroScore += 1;
  if ((data?.revenueGrowth ?? 0) < 0) macroScore -= 1;
  macroScore = Math.max(1, Math.min(10, macroScore));

  const macroColor = macroScore >= 7 ? 'text-green-400' : macroScore >= 4 ? 'text-yellow-400' : 'text-red-400';

  return (
    <div className="glass-card rounded-xl p-5">
      <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
        <span className="text-lg">{String.fromCodePoint(0x2696, 0xFE0F)}</span> Marktumfeld & Makro
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#0f1629] rounded-lg p-4 border border-[#1a1f37]">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-4 h-4 text-[#f0b90b]" />
            <span className="text-xs text-gray-500">Makro-Score</span>
          </div>
          <p className={`text-3xl font-bold ${macroColor}`}>{macroScore}<span className="text-sm text-gray-500">/10</span></p>
          <p className="text-xs text-gray-500 mt-1">
            {macroScore >= 7 ? 'Positives Umfeld' : macroScore >= 4 ? 'Gemischtes Umfeld' : 'Schwieriges Umfeld'}
          </p>
        </div>

        <div className="bg-[#0f1629] rounded-lg p-4 border border-[#1a1f37]">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-[#60B5FF]" />
            <span className="text-xs text-gray-500">Branchentrend</span>
          </div>
          <p className={`text-lg font-bold ${
            data?.trend === 'Aufwärtstrend' ? 'text-green-400' :
            data?.trend === 'Abwärtstrend' ? 'text-red-400' : 'text-yellow-400'
          }`}>{data?.trend ?? 'N/A'}</p>
          <p className="text-xs text-gray-500 mt-1">Basierend auf MA50/MA200</p>
        </div>

        <div className="bg-[#0f1629] rounded-lg p-4 border border-[#1a1f37]">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-[#FF9149]" />
            <span className="text-xs text-gray-500">Volatilät (Beta)</span>
          </div>
          <p className="text-lg font-bold text-white">{data?.beta ? formatNumber(data.beta, 2) : 'N/A'}</p>
          <p className="text-xs text-gray-500 mt-1">
            {(data?.beta ?? 1) > 1.3 ? 'Hoch volatil' : (data?.beta ?? 1) > 0.8 ? 'Normal' : 'Defensiv'}
          </p>
        </div>
      </div>

      <div className="mt-4 p-3 bg-[#0f1629] rounded-lg border border-[#1a1f37]">
        <p className="text-xs text-gray-500 mb-1">Hinweis zum Buffett-Indikator</p>
        <p className="text-xs text-gray-400">
          Der Buffett-Indikator (Marktkapitalisierung/BIP) liegt historisch über dem Durchschnitt. 
          Generelle Vorsicht bei neuen Positionen empfohlen. Qualitätsaktien mit stabilem FCF bevorzugen.
        </p>
      </div>
    </div>
  );
}