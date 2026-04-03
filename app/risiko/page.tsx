'use client';

import { useState, useEffect } from 'react';
import SharedHeader from '@/components/shared-header';
import RiskHeatmap from '@/components/risk-heatmap';
import ScenarioSimulator from '@/components/scenario-simulator';
import { Position } from '@/data/depot';
import { RefreshCw, AlertTriangle } from 'lucide-react';

function categoryToTyp(category: string): 'Aktie' | 'ETF' | 'Anleihe' {
  if (category === 'etf') return 'ETF';
  if (category === 'anleihe') return 'Anleihe';
  return 'Aktie';
}

export default function RisikoPage() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/depot')
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        // Map API response to Position[] format
        const mapped: Position[] = (data.positions ?? []).map((p: any, i: number) => ({
          id: p.isin || p.ticker || String(i),
          name: p.name,
          shortName: p.shortName ?? p.name,
          ticker: p.ticker,
          isin: p.isin ?? '',
          typ: categoryToTyp(p.category ?? 'aktie'),
          category: p.category ?? 'aktie',
          sektor: p.sektor ?? '',
          wertEur: p.currentValue ?? 0,
          stueck: p.stueck,
          kursProStueck: p.livePriceEur ?? p.kaufkurs,
          einstandKurs: p.kaufkurs,
          performanceProzent: p.gainLossPercent ?? 0,
          gewinnEur: p.gainLoss ?? 0,
          strategy: p.strategy ?? 'wachstum',
          currency: p.currency ?? 'EUR',
          lagerland: p.lagerland ?? '—',
        }));
        setPositions(mapped);
        setTotalValue(data.totalValue ?? 0);
        setLoading(false);
      })
      .catch(err => {
        setError(err?.message ?? 'Fehler beim Laden');
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      <SharedHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-12">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Risiko-Analyse</h1>
          <p className="text-gray-400 text-sm mt-1">Portfolio-Risiken · Szenarien · Heatmap</p>
        </div>

        {loading && (
          <div className="glass-card rounded-xl p-12 text-center">
            <RefreshCw className="w-8 h-8 text-[#f0b90b] animate-spin mx-auto mb-3" />
            <p className="text-gray-400">Depot-Daten werden geladen…</p>
          </div>
        )}

        {error && (
          <div className="glass-card rounded-xl p-8 text-center border border-red-500/20">
            <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {!loading && !error && positions.length === 0 && (
          <div className="glass-card rounded-xl p-12 text-center border border-dashed border-[#1a1f37]">
            <AlertTriangle className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">Keine Positionen vorhanden</p>
            <p className="text-gray-500 text-sm mt-1">
              Füge zuerst Positionen in deinem <a href="/depot" className="text-[#f0b90b] underline">Depot</a> hinzu.
            </p>
          </div>
        )}

        {!loading && !error && positions.length > 0 && (
          <div className="grid grid-cols-1 xl:grid-cols-[44%_56%] gap-6 items-start">
            <RiskHeatmap positions={positions} totalValue={totalValue} />
            <ScenarioSimulator positions={positions} totalValue={totalValue} />
          </div>
        )}
      </main>
    </div>
  );
}
