'use client';

import { useState } from 'react';
import { TopInvestors } from './top-investors';
import { Form13FTable } from './form-13f-table';
import { InsiderTransactions } from './insider-transactions';
import { DarkPoolAnalysis } from './dark-pool-analysis';
import { SentimentIndicators } from './sentiment-indicators';
import { Trophy, Building2, Users, Eye, BarChart3 } from 'lucide-react';

export function SmartMoneyDashboard() {
  const [activeTab, setActiveTab] = useState<'top-investors' | 'form13f' | 'insider' | 'darkpool' | 'sentiment'>('top-investors');

  const tabs = [
    { id: 'top-investors', label: 'Top-Investoren', icon: Trophy },
    { id: 'form13f', label: '13F Filings', icon: Building2 },
    { id: 'insider', label: 'Insider', icon: Users },
    { id: 'darkpool', label: 'Dark Pool', icon: Eye },
    { id: 'sentiment', label: 'Sentiment', icon: BarChart3 },
  ] as const;

  return (
    <div className="space-y-6">
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
        {activeTab === 'top-investors' && <TopInvestors />}
        {activeTab === 'form13f' && <Form13FTable />}
        {activeTab === 'insider' && <InsiderTransactions />}
        {activeTab === 'darkpool' && <DarkPoolAnalysis />}
        {activeTab === 'sentiment' && <SentimentIndicators />}
      </div>
    </div>
  );
}