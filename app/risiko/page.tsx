'use client';

import SharedHeader from '@/components/shared-header';
import RiskHeatmap from '@/components/risk-heatmap';
import ScenarioSimulator from '@/components/scenario-simulator';
import { depotPositionen } from '@/data/depot';

export default function RisikoPage() {
  const totalValue = depotPositionen.reduce((sum, p) => sum + p.wertEur, 0);

  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      <SharedHeader />
      <main className="lg:ml-64 p-4 lg:p-6 pt-20 lg:pt-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Risiko-Analyse</h1>
          <p className="text-gray-400 text-sm mt-1">Portfolio-Risiken · Szenarien · Heatmap</p>
        </div>
        <div className="space-y-6">
          <RiskHeatmap positions={depotPositionen} totalValue={totalValue} />
          <ScenarioSimulator positions={depotPositionen} totalValue={totalValue} />
        </div>
      </main>
    </div>
  );
}
