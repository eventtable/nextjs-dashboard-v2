'use client';

import { BarChart3, Gauge, TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';

interface SentimentGauge {
  name: string;
  value: number; // 0-100
  signal: 'bullish' | 'bearish' | 'neutral';
  change: string;
}

const sentimentData: SentimentGauge[] = [
  { name: 'Fear & Greed', value: 72, signal: 'bullish', change: '+5% vs gestern' },
  { name: 'Put/Call Ratio', value: 45, signal: 'bullish', change: '-0.12' },
  { name: 'VIX', value: 28, signal: 'neutral', change: '+0.8%' },
  { name: 'AAII Sentiment', value: 65, signal: 'bullish', change: '+8% bullish' },
];

export function SentimentIndicators() {
  const getColor = (value: number, signal: string) => {
    if (signal === 'bullish') return 'bg-emerald-500';
    if (signal === 'bearish') return 'bg-red-500';
    return 'bg-gray-500';
  };

  const getSignalIcon = (signal: string) => {
    if (signal === 'bullish') return <TrendingUp className="w-4 h-4 text-emerald-400" />;
    if (signal === 'bearish') return <TrendingDown className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#0d1220] border border-[#1a1f37] rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#f0b90b]" />
              📊 Markt-Sentiment Indikatoren
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              Aggregierte Stimmungsindikatoren & Konträre Signale
            </p>
          </div>
          <div className="px-3 py-1 bg-[#f0b90b]/20 text-[#f0b90b] rounded-full text-sm">
            Bullish
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {sentimentData.map((indicator) => (
            <div key={indicator.name} className="bg-[#1a1f37] border border-[#252a3d] rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium">{indicator.name}</span>
                <div className="flex items-center gap-2">
                  {getSignalIcon(indicator.signal)}
                  <span className={`text-sm ${
                    indicator.signal === 'bullish'
                      ? 'text-emerald-400'
                      : indicator.signal === 'bearish'
                      ? 'text-red-400'
                      : 'text-gray-400'
                  }`}>
                    {indicator.signal === 'bullish' ? 'Bullish' : indicator.signal === 'bearish' ? 'Bearish' : 'Neutral'}
                  </span>
                </div>
              </div>
              
              <div className="mb-2">
                <div className="h-3 bg-[#0d1220] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${getColor(indicator.value, indicator.signal)}`}
                    style={{ width: `${indicator.value}%` }}
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">0</span>
                <span className="font-medium">{indicator.value}/100</span>
                <span className="text-gray-500">100</span>
              </div>
              
              <div className="mt-2 text-xs text-gray-400">{indicator.change}</div>
            </div>
          ))}
        </div>

        <div className="bg-[#1a1f37] border border-[#252a3d] rounded-lg p-4 mb-6">
          <h4 className="font-medium mb-4 flex items-center gap-2">
            <Gauge className="w-4 h-4 text-[#f0b90b]" />
            🎯 Smart Money Sentiment Score
          </h4>
          
          <div className="flex items-center justify-center mb-4">
            <div className="relative w-48 h-48">
              <svg viewBox="0 0 100 50" className="w-full h-full">
                {/* Background arc */}
                <path
                  d="M 10 50 A 40 40 0 0 1 90 50"
                  fill="none"
                  stroke="#1a1f37"
                  strokeWidth="10"
                  strokeLinecap="round"
                />
                {/* Colored arc segments */}
                <path
                  d="M 10 50 A 40 40 0 0 1 30 15"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="10"
                  strokeLinecap="round"
                />
                <path
                  d="M 32 14 A 40 40 0 0 1 50 10"
                  fill="none"
                  stroke="#f0b90b"
                  strokeWidth="10"
                  strokeLinecap="round"
                />
                <path
                  d="M 50 10 A 40 40 0 0 1 68 14"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="10"
                  strokeLinecap="round"
                />
                <path
                  d="M 70 15 A 40 40 0 0 1 90 50"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="10"
                  strokeLinecap="round"
                />
                {/* Needle */}
                <line
                  x1="50"
                  y1="50"
                  x2="70"
                  y2="30"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <circle cx="50" cy="50" r="5" fill="white" />
              </svg>
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-center">
                <div className="text-3xl font-bold text-emerald-400">68</div>
                <div className="text-xs text-gray-400">Greed</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-red-400">12</div>
              <div className="text-xs text-gray-400">Extreme Fear</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-[#f0b90b]">50</div>
              <div className="text-xs text-gray-400">Neutral</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-400">88</div>
              <div className="text-xs text-gray-400">Extreme Greed</div>
            </div>
          </div>
        </div>

        <div className="bg-[#1a1f37] border border-[#252a3d] rounded-lg p-4">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#f0b90b]" />
            💡 Konträre Signale
          </h4>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <div className="font-medium text-sm">Smart Money ist bullish</div>
                <p className="text-sm text-gray-400">
                  Institutionen kaufen im Dark Pool, Insider halten Positionen
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <TrendingDown className="w-4 h-4 text-red-400" />
              </div>
              <div>
                <div className="font-medium text-sm">Retail ist euphorisch</div>
                <p className="text-sm text-gray-400">
                  Fear & Greed bei 68 - mögliches Warnsignal für Korrektur
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#f0b90b]/20 flex items-center justify-center flex-shrink-0">
                <Gauge className="w-4 h-4 text-[#f0b90b]" />
              </div>
              <div>
                <div className="font-medium text-sm">Konklusion</div>
                <p className="text-sm text-gray-400">
                  🔶 Vorsichtig bullish - Smart Money akkumuliert, aber Sentiment überhitzt
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}