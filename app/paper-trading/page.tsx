import SharedHeader from '@/components/shared-header';
import { Layers, TrendingUp, DollarSign } from 'lucide-react';

export default function PaperTradingPage() {
  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      <SharedHeader />
      <main className="lg:ml-64 p-4 lg:p-6 pt-20 lg:pt-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Layers className="w-7 h-7 text-[#f0b90b]" />
            Paper Trading
          </h1>
          <p className="text-gray-400 text-sm mt-1">Simuliertes Handeln ohne echtes Kapital</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Virtuelles Kapital', value: '€10.000', icon: DollarSign, color: 'text-[#f0b90b]' },
            { label: 'Offene Positionen', value: '0', icon: Layers, color: 'text-blue-400' },
            { label: 'Gesamtrendite', value: '+0,00%', icon: TrendingUp, color: 'text-green-400' },
          ].map((s) => (
            <div key={s.label} className="glass-card rounded-xl p-5 border border-[#1a1f37]">
              <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                <s.icon className={`w-4 h-4 ${s.color}`} />
                {s.label}
              </div>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>

        <div className="glass-card rounded-xl p-8 border border-[#1a1f37] text-center">
          <p className="text-gray-400">Paper-Trading-Modul wird initialisiert...</p>
        </div>
      </main>
    </div>
  );
}
