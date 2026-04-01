'use client';

import { Crown, TrendingUp, TrendingDown, ArrowRight, Wallet } from 'lucide-react';

interface Investor {
  name: string;
  firm: string;
  portfolioValue: string;
  topHoldings: string[];
  performance: number;
  recentActivity: 'buying' | 'selling' | 'holding';
}

const topInvestors: Investor[] = [
  {
    name: 'Warren Buffett',
    firm: 'Berkshire Hathaway',
    portfolioValue: '364.2 Mrd $',
    topHoldings: ['AAPL', 'BAC', 'KO', 'AXP'],
    performance: 18.5,
    recentActivity: 'buying',
  },
  {
    name: 'Ray Dalio',
    firm: 'Bridgewater Associates',
    portfolioValue: '15.8 Mrd $',
    topHoldings: ['PG', 'JNJ', 'KO', 'PEP'],
    performance: 12.3,
    recentActivity: 'selling',
  },
  {
    name: 'Ken Griffin',
    firm: 'Citadel',
    portfolioValue: '58.4 Mrd $',
    topHoldings: ['NVDA', 'MSFT', 'AAPL', 'META'],
    performance: 24.1,
    recentActivity: 'buying',
  },
  {
    name: 'David Tepper',
    firm: 'Appaloosa Management',
    portfolioValue: '8.2 Mrd $',
    topHoldings: ['META', 'AMZN', 'NVDA', 'GOOGL'],
    performance: 31.2,
    recentActivity: 'buying',
  },
  {
    name: 'Cathie Wood',
    firm: 'ARK Invest',
    portfolioValue: '12.6 Mrd $',
    topHoldings: ['TSLA', 'RBLX', 'CRSP', 'SQ'],
    performance: -8.4,
    recentActivity: 'holding',
  },
  {
    name: 'Bill Ackman',
    firm: 'Pershing Square',
    portfolioValue: '18.9 Mrd $',
    topHoldings: ['Hilton', 'Chipotle', 'Lowes', 'Google'],
    performance: 15.7,
    recentActivity: 'holding',
  },
];

export function TopInvestors() {
  return (
    <div className="space-y-6">
      <div className="bg-[#0d1220] border border-[#1a1f37] rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Crown className="w-5 h-5 text-[#f0b90b]" />
              🏆 Smart Money Champions
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              Top-Performende Investoren & ihre aktuellen Positionen
            </p>
          </div>
          <div className="text-xs text-gray-500">
            Q4 2025 • 13F Filings
          </div>
        </div>

        <div className="grid gap-4">
          {topInvestors.map((investor, index) => (
            <div
              key={investor.name}
              className="group bg-[#1a1f37] border border-[#252a3d] rounded-lg p-4 hover:border-[#f0b90b]/30 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#0d1220] flex items-center justify-center text-lg font-bold text-[#f0b90b] border border-[#1a1f37]">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-semibold">{investor.name}</div>
                    <div className="text-sm text-gray-400">{investor.firm}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-emerald-400">
                    <Wallet className="w-4 h-4" />
                    <span>{investor.portfolioValue}</span>
                  </div>
                  <div className={`text-sm ${investor.performance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {investor.performance >= 0 ? '+' : ''}{investor.performance}% YTD
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="flex gap-2">
                  {investor.topHoldings.map((holding) => (
                    <span
                      key={holding}
                      className="px-2 py-1 text-xs bg-[#0d1220] text-gray-300 rounded border border-[#252a3d]"
                    >
                      {holding}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">Aktivität:</span>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded ${
                    investor.recentActivity === 'buying'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : investor.recentActivity === 'selling'
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {investor.recentActivity === 'buying' && <TrendingUp className="w-3 h-3" />}
                    {investor.recentActivity === 'selling' && <TrendingDown className="w-3 h-3" />}
                    {investor.recentActivity === 'buying' && 'Kauft'}
                    {investor.recentActivity === 'selling' && 'Verkauft'}
                    {investor.recentActivity === 'holding' && 'Hält'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-4 bg-[#1a1f37] rounded-lg border border-[#252a3d]">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#f0b90b]/20 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-4 h-4 text-[#f0b90b]" />
            </div>
            <div>
              <div className="font-medium text-sm">💡 Smart Money Tipp</div>
              <p className="text-sm text-gray-400 mt-1">
                Buffett & Tepper haben in Q4 verstärkt Tech-Aktien aufgestockt. 
                Beobachte besonders AI-Positionen in ihren nächsten 13F-Filings.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
