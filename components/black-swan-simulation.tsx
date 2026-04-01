'use client';

import { useState } from 'react';
import { Shield, AlertTriangle, TrendingDown, DollarSign } from 'lucide-react';
import type { StockData } from '@/lib/types';
import { formatNumber, formatMarketCap } from '@/lib/stock-utils';

export default function BlackSwanSimulation({ data }: { data: StockData }) {
  const [positionSize, setPositionSize] = useState(5000);
  const [showResult, setShowResult] = useState(false);
  const [dropPercent, setDropPercent] = useState(20);

  const currentPrice = data?.currentPrice ?? 0;
  const shares = currentPrice > 0 ? positionSize / currentPrice : 0;
  const newPrice = currentPrice * (1 - dropPercent / 100);
  const newValue = shares * newPrice;
  const loss = positionSize - newValue;
  const lossPercent = positionSize > 0 ? (loss / positionSize) * 100 : 0;

  return (
    <div className="glass-card rounded-xl p-5">
      <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
        <Shield className="w-5 h-5 text-[#f0b90b]" />
        Black-Swan Szenario Simulation
      </h3>

      <p className="text-sm text-gray-400 mb-4">
        Simulieren Sie einen plötzlichen Kurseinbruch und sehen Sie die Auswirkung auf Ihre Position.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Positionsgröße (€)</label>
          <input
            type="number"
            value={positionSize}
            onChange={(e) => setPositionSize(parseFloat(e.target.value) || 0)}
            className="w-full bg-[#1a1f37] border border-[#2a2f47] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#f0b90b]"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Kurseinbruch (%)</label>
          <input
            type="number"
            value={dropPercent}
            onChange={(e) => setDropPercent(parseFloat(e.target.value) || 20)}
            className="w-full bg-[#1a1f37] border border-[#2a2f47] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#f0b90b]"
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={() => setShowResult(true)}
            className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2"
          >
            <TrendingDown className="w-4 h-4" />
            –{dropPercent}% Simulieren
          </button>
        </div>
      </div>

      {showResult && (
        <div className="border border-red-500/20 rounded-lg p-4 bg-red-500/5">
          <h4 className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Ergebnis: –{dropPercent}% Einbruch bei {data?.ticker ?? ''}
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-[#0f1629] rounded-lg p-3">
              <p className="text-[10px] text-gray-500">Aktueller Kurs</p>
              <p className="text-sm font-bold text-white">{formatNumber(currentPrice)} {data?.currency ?? ''}</p>
            </div>
            <div className="bg-[#0f1629] rounded-lg p-3">
              <p className="text-[10px] text-gray-500">Kurs nach Einbruch</p>
              <p className="text-sm font-bold text-red-400">{formatNumber(newPrice)} {data?.currency ?? ''}</p>
            </div>
            <div className="bg-[#0f1629] rounded-lg p-3">
              <p className="text-[10px] text-gray-500">Verlust</p>
              <p className="text-sm font-bold text-red-400">–{formatNumber(loss)} €</p>
            </div>
            <div className="bg-[#0f1629] rounded-lg p-3">
              <p className="text-[10px] text-gray-500">Neuer Positionswert</p>
              <p className="text-sm font-bold text-orange-400">{formatNumber(newValue)} €</p>
            </div>
          </div>
          <div className="mt-3 p-3 bg-[#0f1629] rounded-lg">
            <p className="text-xs text-gray-400">
              <span className="text-[#f0b90b] font-semibold">Matrix 2.0 Tipp:</span> Bei einem Einbruch von –{dropPercent}% 
              und positivem FCF könnte dies ein Nachkauf-Signal sein. Prüfen Sie die Fundamentaldaten und den RSI. 
              Cash-Reserve aus dem Sparplan (100€/Monat) für solche Gelegenheiten nutzen.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}