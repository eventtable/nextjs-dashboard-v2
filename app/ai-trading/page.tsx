import SharedHeader from '@/components/shared-header';
import MLPerformanceWidget from '@/components/ml-performance-widget';
import { Brain, TrendingUp, Activity, Zap } from 'lucide-react';

export default function AITradingPage() {
  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      <SharedHeader />
      <main className="lg:ml-64 p-4 lg:p-6 pt-20 lg:pt-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Brain className="w-7 h-7 text-[#f0b90b]" />
            AI Trading Hub
          </h1>
          <p className="text-gray-400 text-sm mt-1">KI-gestützte Handelssignale · ML-Modell-Performance</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {[
            { icon: Activity, label: 'Aktive Signale', value: '12', sub: 'heute generiert', color: 'text-[#f0b90b]' },
            { icon: TrendingUp, label: 'Win-Rate', value: '68%', sub: 'letzte 30 Tage', color: 'text-green-400' },
            { icon: Zap, label: 'Modell-Score', value: 'A+', sub: 'aktuell', color: 'text-blue-400' },
          ].map((stat) => (
            <div key={stat.label} className="glass-card rounded-xl p-5 border border-[#1a1f37]">
              <div className="flex items-center gap-3 mb-2">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                <span className="text-gray-400 text-sm">{stat.label}</span>
              </div>
              <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-gray-500 mt-1">{stat.sub}</div>
            </div>
          ))}
        </div>

        <MLPerformanceWidget />
      </main>
    </div>
  );
}
