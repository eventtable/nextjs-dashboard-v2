'use client';

import { Building2, Calendar, TrendingUp, TrendingDown, Minus, FileText } from 'lucide-react';

interface Form13F {
  manager: string;
  quarter: string;
  totalValue: string;
  newPositions: number;
  soldOut: number;
  topBuy: string;
  topSell: string;
  activity: 'bullish' | 'bearish' | 'neutral';
}

const recent13Fs: Form13F[] = [
  {
    manager: 'Berkshire Hathaway',
    quarter: 'Q4 2025',
    totalValue: '364.2 Mrd $',
    newPositions: 3,
    soldOut: 2,
    topBuy: 'Occidental Petroleum',
    topSell: 'HP Inc.',
    activity: 'bullish',
  },
  {
    manager: 'Bridgewater Associates',
    quarter: 'Q4 2025',
    totalValue: '15.8 Mrd $',
    newPositions: 12,
    soldOut: 8,
    topBuy: 'Consumer Staples ETF',
    topSell: 'Emerging Markets',
    activity: 'neutral',
  },
  {
    manager: 'Citadel',
    quarter: 'Q4 2025',
    totalValue: '58.4 Mrd $',
    newPositions: 28,
    soldOut: 15,
    topBuy: 'NVIDIA',
    topSell: 'Tesla',
    activity: 'bullish',
  },
  {
    manager: 'Appaloosa Management',
    quarter: 'Q4 2025',
    totalValue: '8.2 Mrd $',
    newPositions: 5,
    soldOut: 3,
    topBuy: 'Meta Platforms',
    topSell: 'Netflix',
    activity: 'bullish',
  },
  {
    manager: 'ARK Invest',
    quarter: 'Q4 2025',
    totalValue: '12.6 Mrd $',
    newPositions: 8,
    soldOut: 6,
    topBuy: 'Roku',
    topSell: 'Teladoc',
    activity: 'neutral',
  },
];

export function Form13FTable() {
  return (
    <div className="bg-[#0d1220] border border-[#1a1f37] rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#f0b90b]" />
            📊 Aktuelle 13F Filings
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            Quartalsberichte der größten Hedge Funds
          </p>
        </div>
        <div className="text-xs text-gray-500 flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          Letztes Update: 15.02.2026
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#1a1f37]">
              <th className="text-left py-3 px-2 text-sm text-gray-400 font-medium">Manager</th>
              <th className="text-left py-3 px-2 text-sm text-gray-400 font-medium">Quartal</th>
              <th className="text-right py-3 px-2 text-sm text-gray-400 font-medium">Portfolio</th>
              <th className="text-center py-3 px-2 text-sm text-gray-400 font-medium">Neu</th>
              <th className="text-center py-3 px-2 text-sm text-gray-400 font-medium">Verkauft</th>
              <th className="text-left py-3 px-2 text-sm text-gray-400 font-medium">Top Kauf</th>
              <th className="text-left py-3 px-2 text-sm text-gray-400 font-medium">Top Verkauf</th>
              <th className="text-center py-3 px-2 text-sm text-gray-400 font-medium">Stimmung</th>
            </tr>
          </thead>
          <tbody>
            {recent13Fs.map((filing) => (
              <tr
                key={filing.manager}
                className="border-b border-[#1a1f37] hover:bg-[#111827] transition-colors"
              >
                <td className="py-4 px-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{filing.manager}</span>
                  </div>
                </td>
                <td className="py-4 px-2 text-gray-400">{filing.quarter}</td>
                <td className="py-4 px-2 text-right font-medium">{filing.totalValue}</td>
                <td className="py-4 px-2 text-center">
                  <span className="inline-flex items-center gap-1 text-emerald-400">
                    <TrendingUp className="w-3 h-3" />
                    +{filing.newPositions}
                  </span>
                </td>
                <td className="py-4 px-2 text-center">
                  <span className="inline-flex items-center gap-1 text-red-400">
                    <TrendingDown className="w-3 h-3" />
                    -{filing.soldOut}
                  </span>
                </td>
                <td className="py-4 px-2">
                  <span className="px-2 py-1 text-xs bg-emerald-500/10 text-emerald-400 rounded">
                    {filing.topBuy}
                  </span>
                </td>
                <td className="py-4 px-2">
                  <span className="px-2 py-1 text-xs bg-red-500/10 text-red-400 rounded">
                    {filing.topSell}
                  </span>
                </td>
                <td className="py-4 px-2 text-center">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded ${
                    filing.activity === 'bullish'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : filing.activity === 'bearish'
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-gray-500/20 text-gray-400'
                  }`}
                  >
                    {filing.activity === 'bullish' && <TrendingUp className="w-3 h-3" />}
                    {filing.activity === 'bearish' && <TrendingDown className="w-3 h-3" />}
                    {filing.activity === 'neutral' && <Minus className="w-3 h-3" />}
                    {filing.activity === 'bullish' ? 'Bullish' : filing.activity === 'bearish' ? 'Bearish' : 'Neutral'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#1a1f37] border border-[#252a3d] rounded-lg p-4">
          <div className="text-sm text-gray-400 mb-1">Top Kategorie (Q4)</div>
          <div className="text-lg font-semibold text-emerald-400">Technology</div>
          <div className="text-xs text-gray-500">+15% vs Q3</div>
        </div>
        <div className="bg-[#1a1f37] border border-[#252a3d] rounded-lg p-4">
          <div className="text-sm text-gray-400 mb-1">Meist verkauft</div>
          <div className="text-lg font-semibold text-red-400">Financials</div>
          <div className="text-xs text-gray-500">-8% vs Q3</div>
        </div>
        <div className="bg-[#1a1f37] border border-[#252a3d] rounded-lg p-4">
          <div className="text-sm text-gray-400 mb-1">Sentiment</div>
          <div className="text-lg font-semibold text-[#f0b90b]">Vorsichtig Bullish</div>
          <div className="text-xs text-gray-500">Smart Money Index: 62</div>
        </div>
      </div>
    </div>
  );
}
