'use client';

import { BarChart3, DollarSign, TrendingUp, Percent, Landmark } from 'lucide-react';
import type { StockData } from '@/lib/types';
import { formatNumber, formatMarketCap } from '@/lib/stock-utils';
import FundamentalTabs from './fundamental-tabs';

export default function FundamentalAnalysis({ data }: { data: StockData }) {
  const kgvStatus = (() => {
    const k = data?.kgv;
    if (k === null || k === undefined) return { label: 'N/A', color: 'text-gray-400' };
    if (k < 15) return { label: 'Günstig', color: 'text-green-400' };
    if (k <= 25) return { label: 'Fair', color: 'text-yellow-400' };
    if (k <= 35) return { label: 'Teuer', color: 'text-orange-400' };
    return { label: 'Sehr teuer', color: 'text-red-400' };
  })();

  const items = [
    {
      label: 'KGV (Trailing)',
      value: data?.kgv !== null ? formatNumber(data.kgv, 1) : 'N/A',
      status: kgvStatus.label,
      statusColor: kgvStatus.color,
      icon: BarChart3,
    },
    {
      label: 'Forward KGV',
      value: data?.forwardKgv !== null ? formatNumber(data.forwardKgv, 1) : 'N/A',
      status: '',
      statusColor: '',
      icon: BarChart3,
    },
    {
      label: 'Free Cash Flow',
      value: formatMarketCap(data?.freeCashflow),
      status: (data?.freeCashflow ?? 0) > 0 ? 'Positiv' : 'Negativ',
      statusColor: (data?.freeCashflow ?? 0) > 0 ? 'text-green-400' : 'text-red-400',
      icon: DollarSign,
    },
    {
      label: 'Dividendenrendite',
      value: `${formatNumber(data?.dividendenRendite ?? 0)}%`,
      status: (data?.dividendenRendite ?? 0) >= 3 ? 'Attraktiv' : (data?.dividendenRendite ?? 0) >= 1 ? 'Moderat' : 'Gering',
      statusColor: (data?.dividendenRendite ?? 0) >= 3 ? 'text-green-400' : (data?.dividendenRendite ?? 0) >= 1 ? 'text-yellow-400' : 'text-gray-400',
      icon: Percent,
    },
    {
      label: 'Umsatzwachstum',
      value: data?.revenueGrowth !== null ? `${formatNumber(data.revenueGrowth)}%` : 'N/A',
      status: (data?.revenueGrowth ?? 0) > 10 ? 'Stark' : (data?.revenueGrowth ?? 0) > 0 ? 'Moderat' : 'Schwach',
      statusColor: (data?.revenueGrowth ?? 0) > 10 ? 'text-green-400' : (data?.revenueGrowth ?? 0) > 0 ? 'text-yellow-400' : 'text-red-400',
      icon: TrendingUp,
    },
    {
      label: 'Verschuldungsgrad',
      value: data?.verschuldungsgrad !== null ? formatNumber(data.verschuldungsgrad, 2) : 'N/A',
      status: (data?.verschuldungsgrad ?? 999) < 0.5 ? 'Niedrig' : (data?.verschuldungsgrad ?? 999) < 1.5 ? 'Moderat' : 'Hoch',
      statusColor: (data?.verschuldungsgrad ?? 999) < 0.5 ? 'text-green-400' : (data?.verschuldungsgrad ?? 999) < 1.5 ? 'text-yellow-400' : 'text-red-400',
      icon: Landmark,
    },
    {
      label: 'Gewinnmarge',
      value: data?.profitMargin !== null ? `${formatNumber(data.profitMargin)}%` : 'N/A',
      status: '',
      statusColor: '',
      icon: DollarSign,
    },
    {
      label: 'Eigenkapitalrendite',
      value: data?.returnOnEquity !== null ? `${formatNumber(data.returnOnEquity)}%` : 'N/A',
      status: '',
      statusColor: '',
      icon: TrendingUp,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Original Fundamentalanalyse Übersicht */}
      <div className="glass-card rounded-xl p-5">
        <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <span className="text-lg">{String.fromCodePoint(0x1F52C)}</span> Fundamentalübersicht
        </h3>
        <div className="space-y-3">
          {items.map((item: any, i: number) => {
            const Icon = item?.icon ?? BarChart3;
            return (
              <div key={i} className="flex items-center justify-between py-2 border-b border-[#1a1f37] last:border-0">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-[#f0b90b]" />
                  <span className="text-sm text-gray-400">{item?.label ?? ''}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">{item?.value ?? 'N/A'}</span>
                  {item?.status && (
                    <span className={`text-xs px-2 py-0.5 rounded ${item?.statusColor ?? 'text-gray-400'} bg-white/5`}>
                      {item.status}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Neue Detail-Tabs mit 16 Kennzahlen */}
      {data?.ticker && <FundamentalTabs ticker={data.ticker} />}
    </div>
  );
}