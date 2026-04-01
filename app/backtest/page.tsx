import SharedHeader from '@/components/shared-header';
import { BarChart3, Clock, TrendingUp } from 'lucide-react';

export default function BacktestPage() {
  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      <SharedHeader />
      <main className="lg:ml-64 p-4 lg:p-6 pt-20 lg:pt-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Clock className="w-7 h-7 text-[#f0b90b]" />
            Backtest
          </h1>
          <p className="text-gray-400 text-sm mt-1">Strategietests auf historischen Daten</p>
        </div>

        <div className="glass-card rounded-xl p-8 border border-[#1a1f37] text-center">
          <BarChart3 className="w-12 h-12 text-[#f0b90b] mx-auto mb-4 opacity-50" />
          <p className="text-gray-400">Backtest-Engine wird geladen...</p>
          <p className="text-gray-600 text-sm mt-1">Historische Daten via Yahoo Finance</p>
        </div>
      </main>
    </div>
  );
}
