import SharedHeader from '@/components/shared-header';
import { berechneNachkaufEmpfehlungen } from '@/data/empfehlungen';
import { TrendingUp, TrendingDown, Minus, Target, Shield, BarChart3 } from 'lucide-react';

const signalConfig: Record<string, { label: string; color: string; bg: string }> = {
  'stark-nachkaufen': { label: '⬆⬆ Stark kaufen', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' },
  'nachkaufen': { label: '⬆ Kaufen', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/30' },
  'beobachten': { label: '👁 Beobachten', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30' },
  'halten': { label: '⏸ Halten', color: 'text-gray-400', bg: 'bg-gray-500/10 border-gray-500/20' },
  'verkaufen': { label: '⬇ Verkaufen', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30' },
};

export default function EmpfehlungenPage() {
  const empfehlungen = berechneNachkaufEmpfehlungen();
  const sorted = [...empfehlungen].sort((a, b) => (b.gesamtScore ?? 0) - (a.gesamtScore ?? 0));

  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      <SharedHeader />
      <main className="lg:ml-64 p-4 lg:p-6 pt-20 lg:pt-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Empfehlungen</h1>
          <p className="text-gray-400 text-sm mt-1">Kauf- und Verkaufsempfehlungen nach Matrix-Score</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {sorted.map((e: any) => {
            const cfg = signalConfig[e.empfehlung] ?? signalConfig['beobachten'];
            return (
              <div key={e.ticker} className={`glass-card rounded-xl p-5 border ${cfg.bg}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-[#f0b90b] bg-[#f0b90b]/10 px-2 py-0.5 rounded font-bold">{e.ticker}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                    </div>
                    <p className="text-white font-medium mt-1">{e.name}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-[#f0b90b]">{e.gesamtScore}</div>
                    <div className="text-xs text-gray-500">Score</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                  <div className="bg-[#1a1f37] rounded-lg p-2 text-center">
                    <div className="text-gray-400">Fundamental</div>
                    <div className="text-white font-bold">{e.fundamentalScore}</div>
                  </div>
                  <div className="bg-[#1a1f37] rounded-lg p-2 text-center">
                    <div className="text-gray-400">Technisch</div>
                    <div className="text-white font-bold">{e.technischerScore}</div>
                  </div>
                  <div className="bg-[#1a1f37] rounded-lg p-2 text-center">
                    <div className="text-gray-400">Makro</div>
                    <div className="text-white font-bold">{e.makroScore}</div>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-gray-400">
                  {e.nachkaufZone && (
                    <div className="flex justify-between">
                      <span className="flex items-center gap-1"><Target className="w-3 h-3 text-green-400" /> Kaufzone</span>
                      <span className="text-green-400 font-medium">{e.nachkaufZone}</span>
                    </div>
                  )}
                  {e.stopLoss && (
                    <div className="flex justify-between">
                      <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-red-400" /> Stop-Loss</span>
                      <span className="text-red-400 font-medium">{e.stopLoss}</span>
                    </div>
                  )}
                  {e.zielKurs && (
                    <div className="flex justify-between">
                      <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3 text-[#f0b90b]" /> Kursziel</span>
                      <span className="text-[#f0b90b] font-medium">{e.zielKurs}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
