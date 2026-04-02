'use client';

import { CheckSquare, Square, CheckCircle } from 'lucide-react';
import type { StockData } from '@/lib/types';

export default function MatrixChecklist({ data }: { data: StockData }) {
  const checks = [
    {
      label: 'KGV unter 25 (faire Bewertung)',
      passed: data?.kgv !== null && data?.kgv !== undefined && data.kgv > 0 && data.kgv < 25,
      detail: data?.kgv !== null ? `KGV: ${data.kgv?.toFixed?.(1) ?? 'N/A'}` : 'Kein KGV verfügbar',
    },
    {
      label: 'RSI zwischen 30–70 (kein Extrem)',
      passed: (data?.rsi ?? 50) >= 30 && (data?.rsi ?? 50) <= 70,
      detail: `RSI: ${data?.rsi?.toFixed?.(1) ?? 'N/A'}`,
    },
    {
      label: 'Positiver Free Cash Flow',
      passed: (data?.freeCashflow ?? 0) > 0,
      detail: data?.freeCashflow ? `FCF: ${(data.freeCashflow / 1e9)?.toFixed?.(2) ?? '0'} Mrd. $` : 'Kein FCF verfügbar',
    },
    {
      label: 'Dividendenrendite ≥ 1%',
      passed: (data?.dividendenRendite ?? 0) >= 1,
      detail: `Dividende: ${data?.dividendenRendite?.toFixed?.(2) ?? '0'}%`,
    },
    {
      label: 'Verschuldungsgrad < 1,5',
      passed: data?.verschuldungsgrad !== null && data?.verschuldungsgrad !== undefined && data.verschuldungsgrad < 1.5,
      detail: data?.verschuldungsgrad !== null ? `D/E: ${data.verschuldungsgrad?.toFixed?.(2) ?? 'N/A'}` : 'Kein Verschuldungsgrad',
    },
    {
      label: 'Positives Umsatzwachstum',
      passed: (data?.revenueGrowth ?? 0) > 0,
      detail: data?.revenueGrowth !== null ? `Wachstum: ${data.revenueGrowth?.toFixed?.(1) ?? '0'}%` : 'Kein Wachstumsdaten',
    },
    {
      label: 'Trend nicht im Abwärtstrend',
      passed: data?.trend !== 'down',
      detail: `Trend: ${data?.trend === 'up' ? 'Aufwärtstrend' : data?.trend === 'down' ? 'Abwärtstrend' : 'Seitwärts'}`,
    },
  ];

  const passedCount = checks.filter((c: any) => c?.passed).length;
  const total = checks.length;
  const percent = Math.round((passedCount / total) * 100);

  return (
    <div className="glass-card rounded-xl p-5">
      <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
        <span className="text-lg">{String.fromCodePoint(0x2705)}</span> Matrix 2.0 Checkliste
      </h3>

      {/* Progress */}
      <div className="mb-5">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-400">{passedCount} von {total} Kriterien erfüllt</span>
          <span className={`text-sm font-bold ${
            percent >= 70 ? 'text-green-400' : percent >= 40 ? 'text-yellow-400' : 'text-red-400'
          }`}>{percent}%</span>
        </div>
        <div className="h-2 bg-[#1a1f37] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${percent}%`,
              backgroundColor: percent >= 70 ? '#22c55e' : percent >= 40 ? '#eab308' : '#ef4444',
            }}
          />
        </div>
      </div>

      {/* Checklist Items */}
      <div className="space-y-3">
        {checks.map((check: any, i: number) => (
          <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
            check?.passed
              ? 'bg-green-500/5 border-green-500/20'
              : 'bg-red-500/5 border-red-500/20'
          }`}>
            {check?.passed ? (
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            ) : (
              <Square className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p className={`text-sm font-medium ${check?.passed ? 'text-green-300' : 'text-red-300'}`}>
                {check?.label ?? ''}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{check?.detail ?? ''}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}