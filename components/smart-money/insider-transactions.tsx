'use client';

import { Users, TrendingUp, TrendingDown, ArrowRight, Building } from 'lucide-react';

interface InsiderTrade {
  company: string;
  ticker: string;
  insider: string;
  position: string;
  type: 'buy' | 'sell';
  shares: string;
  value: string;
  date: string;
  significance: 'high' | 'medium' | 'low';
}

const insiderTrades: InsiderTrade[] = [
  {
    company: 'NVIDIA',
    ticker: 'NVDA',
    insider: 'Jensen Huang',
    position: 'CEO',
    type: 'sell',
    shares: '50,000',
    value: '$4.2 Mio',
    date: '15.03.2026',
    significance: 'high',
  },
  {
    company: 'Microsoft',
    ticker: 'MSFT',
    insider: 'Satya Nadella',
    position: 'CEO',
    type: 'buy',
    shares: '10,000',
    value: '$3.8 Mio',
    date: '12.03.2026',
    significance: 'high',
  },
  {
    company: 'Apple',
    ticker: 'AAPL',
    insider: 'Tim Cook',
    position: 'CEO',
    type: 'sell',
    shares: '100,000',
    value: '$18.5 Mio',
    date: '10.03.2026',
    significance: 'high',
  },
  {
    company: 'Tesla',
    ticker: 'TSLA',
    insider: 'Elon Musk',
    position: 'CEO',
    type: 'sell',
    shares: '500,000',
    value: '$125 Mio',
    date: '08.03.2026',
    significance: 'high',
  },
  {
    company: 'Berkshire Hathaway',
    ticker: 'BRK.B',
    insider: 'Warren Buffett',
    position: 'CEO',
    type: 'buy',
    shares: '2,500,000',
    value: '$950 Mio',
    date: '05.03.2026',
    significance: 'high',
  },
];

export function InsiderTransactions() {
  return (
    <div className="space-y-6">
      <div className="bg-[#0d1220] border border-[#1a1f37] rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Users className="w-5 h-5 text-[#f0b90b]" />
              👥 Insider Transaktionen
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              Käufe & Verkäufe von Unternehmensinsidern
            </p>
          </div>
          <div className="flex gap-2">
            <div className="flex items-center gap-1 text-xs text-emerald-400">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              Kauf
            </div>
            <div className="flex items-center gap-1 text-xs text-red-400">
              <div className="w-2 h-2 rounded-full bg-red-400" />
              Verkauf
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {insiderTrades.map((trade) => (
            <div
              key={`${trade.ticker}-${trade.date}`}
              className="bg-[#1a1f37] border border-[#252a3d] rounded-lg p-4 hover:border-[#f0b90b]/30 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    trade.type === 'buy' ? 'bg-emerald-500/20' : 'bg-red-500/20'
                  }`}>
                    {trade.type === 'buy' ? (
                      <TrendingUp className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{trade.company}</span>
                      <span className="text-xs text-gray-400">({trade.ticker})</span>
                    </div>
                    <div className="text-sm text-gray-400">
                      {trade.insider} • {trade.position}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span className="text-gray-400">
                        Aktien: <span className="text-white">{trade.shares}</span>
                      </span>
                      <span className="text-gray-400">
                        Wert: <span className={trade.type === 'buy' ? 'text-emerald-400' : 'text-red-400'}>{trade.value}</span>
                      </span>
                      <span className="text-gray-400">
                        Datum: <span className="text-white">{trade.date}</span>
                      </span>
                    </div>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs rounded ${
                  trade.significance === 'high'
                    ? 'bg-[#f0b90b]/20 text-[#f0b90b]'
                    : trade.significance === 'medium'
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-gray-500/20 text-gray-400'
                }`}>
                  {trade.significance === 'high' ? '🔥 Hoch' : trade.significance === 'medium' ? 'Mittel' : 'Niedrig'}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#1a1f37] border border-[#252a3d] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-gray-400">Käufe (30d)</span>
            </div>
            <div className="text-2xl font-bold text-emerald-400">$2.1 Mrd</div>
            <div className="text-xs text-gray-500">+12% vs Vormonat</div>
          </div>
          <div className="bg-[#1a1f37] border border-[#252a3d] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-red-400" />
              <span className="text-sm text-gray-400">Verkäufe (30d)</span>
            </div>
            <div className="text-2xl font-bold text-red-400">$8.4 Mrd</div>
            <div className="text-xs text-gray-500">-5% vs Vormonat</div>
          </div>
          <div className="bg-[#1a1f37] border border-[#252a3d] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Building className="w-4 h-4 text-[#f0b90b]" />
              <span className="text-sm text-gray-400">Kauf/Verkauf Ratio</span>
            </div>
            <div className="text-2xl font-bold text-red-400">0.25</div>
            <div className="text-xs text-gray-500">🔴 Mehr Verkäufe</div>
          </div>
        </div>
      </div>
    </div>
  );
}
