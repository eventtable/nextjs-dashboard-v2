'use client';

import { Trophy } from 'lucide-react';
import SharedHeader from '@/components/shared-header';
import { SmartMoneyDashboard } from '@/components/smart-money';

export default function SmartMoneyPage() {
  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white">
      <SharedHeader />

      <main className="pt-24 pb-12 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="w-6 h-6 text-[#f0b90b]" />
            Smart Money
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Top-Investoren, 13F Filings, Insider-Transaktionen und Dark Pool Analysen
          </p>
        </div>

        <div className="bg-[#0d1220] border border-[#1a1f37] rounded-xl p-6">
          <SmartMoneyDashboard />
        </div>
      </main>
    </div>
  );
}
