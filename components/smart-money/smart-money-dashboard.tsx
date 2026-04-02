'use client';

import { useState } from 'react';
import { TopInvestors } from './top-investors';
import { Form13FTable } from './form-13f-table';
import { InsiderTransactions } from './insider-transactions';
import { SentimentIndicators } from './sentiment-indicators';
import { Trophy, Building2, Users, BarChart3, Search } from 'lucide-react';

export function SmartMoneyDashboard() {
  const [activeTab, setActiveTab] = useState<'top-investors' | 'form13f' | 'insider' | 'sentiment'>('top-investors');
  const [ticker, setTicker] = useState('AAPL');
  const [inputValue, setInputValue] = useState('AAPL');

  const tabs = [
    { id: 'top-investors', label: 'Top-Investoren', icon: Trophy },
    { id: 'form13f', label: '13F Filings', icon: Building2 },
    { id: 'insider', label: 'Insider', icon: Users },
    { id: 'sentiment', label: 'Sentiment', icon: BarChart3 },
  ] as const;

  const handleSearch = () => {
    const trimmed = inputValue.trim().toUpperCase();
    if (trimmed) setTicker(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="space-y-6">
      {/* Ticker Search */}
      <div className="flex gap-2 items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value.toUpperCase())}
            onKeyDown={handleKeyDown}
            placeholder="Ticker (z.B. AAPL, MSFT)"
            className="w-full bg-[#1a1f37] border border-[#2a2f47] rounded-lg pl-9 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#f0b90b] focus:ring-1 focus:ring-[#f0b90b] transition-all text-sm"
          />
        </div>
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-[#f0b90b] text-black rounded-lg text-sm font-medium hover:bg-[#f0b90b]/90 transition-all"
        >
          Suchen
        </button>
      </div>

      {/* Sub-Navigation */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-[#f0b90b] text-black'
                  : 'bg-[#0d1220] text-gray-400 hover:text-white hover:bg-[#1a1f37]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {activeTab === 'top-investors' && <TopInvestors ticker={ticker} />}
        {activeTab === 'form13f' && <Form13FTable ticker={ticker} />}
        {activeTab === 'insider' && <InsiderTransactions ticker={ticker} />}
        {activeTab === 'sentiment' && <SentimentIndicators />}
      </div>
    </div>
  );
}
