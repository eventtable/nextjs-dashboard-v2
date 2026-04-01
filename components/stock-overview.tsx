'use client';

import { TrendingUp, TrendingDown, DollarSign, BarChart3, Target, Activity, ArrowUpRight, ArrowDownRight, Calculator } from 'lucide-react';
import type { StockData } from '@/lib/types';
import { formatNumber, formatMarketCap, formatPercent } from '@/lib/stock-utils';
import NewsTicker from './news-ticker';
import FibonacciLevels from './fibonacci-levels';

export default function StockOverview({ data }: { data: StockData }) {
  const isPositive = (data?.change ?? 0) >= 0;

  const metrics = [
    { label: 'Marktkapitalisierung', value: formatMarketCap(data?.marketCap), icon: DollarSign },
    { label: 'KGV (P/E)', value: data?.kgv !== null ? formatNumber(data.kgv, 1) : 'N/A', icon: BarChart3 },
    { label: 'Forward KGV', value: data?.forwardKgv !== null ? formatNumber(data.forwardKgv, 1) : 'N/A', icon: Target },
    { label: 'Dividendenrendite', value: data?.dividendenRendite ? `${formatNumber(data.dividendenRendite)}%` : '0%', icon: DollarSign },
    { label: '52W Hoch', value: data?.fiftyTwoWeekHigh !== null ? `${formatNumber(data.fiftyTwoWeekHigh)} ${data?.currency ?? ''}` : 'N/A', icon: TrendingUp },
    { label: '52W Tief', value: data?.fiftyTwoWeekLow !== null ? `${formatNumber(data.fiftyTwoWeekLow)} ${data?.currency ?? ''}` : 'N/A', icon: TrendingDown },
    { label: 'RSI (14)', value: formatNumber(data?.rsi, 1), icon: Activity },
    { label: 'Beta', value: data?.beta !== null ? formatNumber(data.beta, 2) : 'N/A', icon: BarChart3 },
    ...(data?.targetMeanPrice ? [{ label: 'Kursziel (Analysten)', value: `${formatNumber(data.targetMeanPrice)} ${data?.currency ?? ''}`, icon: Target }] : []),
    ...(data?.exDividendDate ? [{ label: 'Ex-Dividende', value: data.exDividendDate, icon: DollarSign }] : []),
  ];

  return (
    <div className="space-y-6">
      {/* Haupt-Übersicht */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-white">{data?.name ?? data?.ticker ?? ''}</h2>
              <span className="px-2 py-0.5 bg-[#1a1f37] rounded text-xs text-gray-400 font-mono">{data?.ticker ?? ''}</span>
            </div>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-3xl font-bold text-white">
                {data?.currentPrice !== null ? formatNumber(data.currentPrice) : 'N/A'}
                <span className="text-base text-gray-400 ml-1">{data?.currency ?? 'USD'}</span>
              </span>
              <div className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-semibold ${isPositive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                {data?.change !== null ? formatNumber(Math.abs(data.change)) : '0'}
                <span className="ml-1">({data?.changePercent !== null ? formatPercent(data.changePercent) : 'N/A'})</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Trend</p>
            <p className={`text-sm font-semibold ${
              data?.trend === 'Aufwärtstrend' ? 'text-green-400' :
              data?.trend === 'Abwärtstrend' ? 'text-red-400' : 'text-yellow-400'
            }`}>{data?.trend ?? 'N/A'}</p>
            {data?.recommendationKey && (
              <p className="text-xs text-gray-500 mt-1">Analysten: <span className={`font-medium ${
                data.recommendationKey === 'strong_buy' ? 'text-green-400' :
                data.recommendationKey === 'buy' ? 'text-green-300' :
                data.recommendationKey === 'hold' ? 'text-yellow-400' :
                data.recommendationKey === 'sell' ? 'text-orange-400' :
                data.recommendationKey === 'strong_sell' ? 'text-red-400' : 'text-gray-300'
              }`}>
                {
                data.recommendationKey === 'strong_buy' ? 'Starker Kauf' :
                data.recommendationKey === 'buy' ? 'Kaufen' :
                data.recommendationKey === 'hold' ? 'Halten' :
                data.recommendationKey === 'sell' ? 'Verkaufen' :
                data.recommendationKey === 'strong_sell' ? 'Stark Verkaufen' :
                data.recommendationKey
              }</span></p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {metrics.map((m: any, i: number) => {
            const Icon = m?.icon ?? BarChart3;
            return (
              <div key={i} className="bg-[#0f1629] rounded-lg p-3 border border-[#1a1f37] hover:border-[#f0b90b]/20 transition-all">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-3.5 h-3.5 text-[#f0b90b]" />
                  <span className="text-[11px] text-gray-500">{m?.label ?? ''}</span>
                </div>
                <p className="text-sm font-semibold text-white">{m?.value ?? 'N/A'}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Fibonacci Levels */}
      {data?.fiftyTwoWeekHigh && data?.fiftyTwoWeekLow && data?.currentPrice && (
        <FibonacciLevels
          high52w={data.fiftyTwoWeekHigh}
          low52w={data.fiftyTwoWeekLow}
          currentPrice={data.currentPrice}
          currency={data.currency}
        />
      )}

      {/* Aktien-spezifische News */}
      {data?.ticker && (
        <NewsTicker 
          ticker={data.ticker} 
        />
      )}
    </div>
  );
}