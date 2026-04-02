'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Info, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { Position } from '@/data/depot';
import { riskScenarios, berechneScenarioImpact } from '@/data/riskScenarios';

interface RiskHeatmapProps {
  positions: Position[];
  totalValue: number;
}

interface PositionRisk {
  position: Position;
  riskScore: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'severe';
  exposureSectors: string[];
  affectedScenarios: number;
  beta: number;
  volatility: number;
}

// Risiko-Scoring für einzelne Positionen
const calculatePositionRisk = (position: Position, totalValue: number = 8659): PositionRisk => {
  const affectedScenarios = riskScenarios.filter(s => 
    s.affectedTickers.includes(position.ticker) || 
    (position.sektor && s.affectedSectors.includes(position.sektor))
  );
  
  // Beta-Werte (geschätzt basierend auf Sektor)
  const sectorBetas: Record<string, number> = {
    'Technology': 1.3,
    'Software': 1.2,
    'Automotive': 1.1,
    'Pharma': 0.9,
    'Insurance': 0.8,
    'Consulting': 1.0,
    'Mining': 1.2,
    'ETF': 1.0,
    'Anleihe': 0.3
  };
  
  // Volatilität (geschätzt)
  const sectorVol: Record<string, number> = {
    'Technology': 25,
    'Software': 22,
    'Automotive': 28,
    'Pharma': 20,
    'Insurance': 18,
    'Consulting': 24,
    'Mining': 30,
    'ETF': 15,
    'Anleihe': 5
  };
  
  const beta = position.typ === 'ETF' ? 1.0 : position.typ === 'Anleihe' ? 0.3 : (sectorBetas[position.sektor || ''] || 1.0);
  const volatility = position.typ === 'ETF' ? 15 : position.typ === 'Anleihe' ? 5 : (sectorVol[position.sektor || ''] || 20);
  
  // Risk Score Berechnung (0-100)
  let riskScore = 0;
  
  // Exposure zu Szenarien (40%)
  riskScore += Math.min(affectedScenarios.length * 8, 40);
  
  // Beta-Faktor (25%)
  riskScore += (beta - 0.5) * 25;
  
  // Volatilität (25%)
  riskScore += (volatility / 30) * 25;
  
  // Gewicht im Depot (10%)
  const weight = position.wertEur / (totalValue || 8659);
  riskScore += weight * 100 * 0.1;
  
  riskScore = Math.min(100, Math.max(0, riskScore));
  
  let riskLevel: 'low' | 'medium' | 'high' | 'severe' = 'low';
  if (riskScore >= 70) riskLevel = 'severe';
  else if (riskScore >= 50) riskLevel = 'high';
  else if (riskScore >= 30) riskLevel = 'medium';
  
  const exposureSectors = [...new Set(affectedScenarios.flatMap(s => s.affectedSectors))];
  
  return {
    position,
    riskScore,
    riskLevel,
    exposureSectors,
    affectedScenarios: affectedScenarios.length,
    beta,
    volatility
  };
};

const riskColors = {
  low: { bg: 'bg-green-500/20', border: 'border-green-500/40', text: 'text-green-400', glow: 'shadow-green-500/20' },
  medium: { bg: 'bg-yellow-500/20', border: 'border-yellow-500/40', text: 'text-yellow-400', glow: 'shadow-yellow-500/20' },
  high: { bg: 'bg-orange-500/20', border: 'border-orange-500/40', text: 'text-orange-400', glow: 'shadow-orange-500/20' },
  severe: { bg: 'bg-red-500/20', border: 'border-red-500/40', text: 'text-red-400', glow: 'shadow-red-500/20' }
};

export default function RiskHeatmap({ positions, totalValue }: RiskHeatmapProps) {
  const [selectedPosition, setSelectedPosition] = useState<PositionRisk | null>(null);
  const [hoveredPosition, setHoveredPosition] = useState<string | null>(null);
  
  const positionRisks = positions.map(p => calculatePositionRisk(p, totalValue)).sort((a, b) => b.riskScore - a.riskScore);
  
  const highRiskCount = positionRisks.filter(p => p.riskLevel === 'high' || p.riskLevel === 'severe').length;
  const avgRiskScore = positionRisks.reduce((sum, p) => sum + p.riskScore, 0) / positionRisks.length;
  
  return (
    <div className="space-y-4">
      {/* Heatmap Card with inline stats */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#f0b90b]" />
            Depot-Risiko Heatmap
          </h3>
          <div className="flex items-center gap-2 text-[11px] text-gray-400">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>Niedrig</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500 inline-block"></span>Mittel</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500 inline-block"></span>Hoch</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span>Kritisch</span>
          </div>
        </div>

        {/* Mini stat bar */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          <div className="bg-[#0d1117] rounded-lg px-2 py-1.5 text-center">
            <p className="text-[10px] text-gray-500">Ø Score</p>
            <p className={`text-sm font-bold ${avgRiskScore >= 50 ? 'text-red-400' : avgRiskScore >= 35 ? 'text-orange-400' : avgRiskScore >= 20 ? 'text-yellow-400' : 'text-green-400'}`}>
              {avgRiskScore.toFixed(1)}
            </p>
          </div>
          <div className="bg-[#0d1117] rounded-lg px-2 py-1.5 text-center">
            <p className="text-[10px] text-gray-500">High Risk</p>
            <p className={`text-sm font-bold ${highRiskCount > 5 ? 'text-red-400' : 'text-orange-400'}`}>
              {highRiskCount}<span className="text-gray-500 font-normal text-[10px]">/{positions.length}</span>
            </p>
          </div>
          <div className="bg-[#0d1117] rounded-lg px-2 py-1.5 text-center">
            <p className="text-[10px] text-gray-500">Höchstes</p>
            <p className="text-sm font-bold text-red-400 truncate">
              {positionRisks[0]?.position.ticker.replace('.DE','').replace('.PA','').replace('.L','')}
            </p>
          </div>
          <div className="bg-[#0d1117] rounded-lg px-2 py-1.5 text-center">
            <p className="text-[10px] text-gray-500">Szenarien</p>
            <p className="text-sm font-bold text-[#f0b90b]">{riskScenarios.length}</p>
          </div>
        </div>

        {/* Compact heatmap grid */}
        <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-1.5">
          {positionRisks.map((risk, index) => {
            const colors = riskColors[risk.riskLevel];
            const isSelected = selectedPosition?.position.id === risk.position.id;
            const shortTicker = risk.position.ticker.replace(/\.(DE|PA|CO|L|US)$/, '');

            return (
              <motion.button
                key={risk.position.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => setSelectedPosition(isSelected ? null : risk)}
                onMouseEnter={() => setHoveredPosition(risk.position.id)}
                onMouseLeave={() => setHoveredPosition(null)}
                title={`${risk.position.name} — Score ${risk.riskScore.toFixed(0)}`}
                className={`
                  relative h-11 rounded-md border transition-all duration-150 flex flex-col items-center justify-center gap-0.5
                  ${colors.bg} ${isSelected ? colors.border.replace('/40','') : colors.border}
                  ${isSelected ? 'ring-1 ring-white/40 scale-105' : 'hover:scale-105 hover:brightness-125'}
                `}
              >
                <span className="text-[9px] font-bold text-white leading-none truncate px-0.5 max-w-full">
                  {shortTicker}
                </span>
                <span className={`text-[9px] font-semibold ${colors.text} leading-none`}>
                  {risk.riskScore.toFixed(0)}
                </span>
                {risk.riskLevel === 'severe' && (
                  <div className="absolute top-0.5 right-0.5">
                    <AlertTriangle className="w-2 h-2 text-red-400" />
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
        <p className="text-[10px] text-gray-500 mt-2">Klick auf Kachel = Details</p>
      </div>
      
      {/* Selected Position Details */}
      {selectedPosition && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-xl p-4 border border-[#f0b90b]/30"
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <h4 className="text-white font-semibold flex items-center gap-2">
                {selectedPosition.position.name}
                <span className="text-xs text-gray-400">({selectedPosition.position.ticker})</span>
              </h4>
              <p className="text-xs text-gray-400 mt-0.5">
                {selectedPosition.position.typ} • {selectedPosition.position.sektor || 'Diversifiziert'}
              </p>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${riskColors[selectedPosition.riskLevel].bg} ${riskColors[selectedPosition.riskLevel].text}`}>
              Risiko: {selectedPosition.riskScore.toFixed(0)}/100
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="bg-[#0d1117] rounded-lg p-2">
              <p className="text-[10px] text-gray-500">Beta (vs DAX)</p>
              <p className="text-sm font-semibold text-white">{selectedPosition.beta.toFixed(2)}</p>
            </div>
            <div className="bg-[#0d1117] rounded-lg p-2">
              <p className="text-[10px] text-gray-500">Volatilität</p>
              <p className="text-sm font-semibold text-white">{selectedPosition.volatility}%</p>
            </div>
            <div className="bg-[#0d1117] rounded-lg p-2">
              <p className="text-[10px] text-gray-500">Szenarien</p>
              <p className="text-sm font-semibold text-white">{selectedPosition.affectedScenarios}</p>
            </div>
          </div>
          
          {selectedPosition.exposureSectors.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 mb-2">Risiko-Exposition:</p>
              <div className="flex flex-wrap gap-1.5">
                {selectedPosition.exposureSectors.map(sector => (
                  <span key={sector} className="px-2 py-0.5 rounded bg-[#f0b90b]/10 text-[#f0b90b] text-xs">
                    {sector}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Betroffene Szenarien */}
          <div className="mt-3 pt-3 border-t border-white/10">
            <p className="text-xs text-gray-400 mb-2">Relevante Risiko-Szenarien:</p>
            <div className="space-y-1.5">
              {riskScenarios
                .filter(s => s.affectedTickers.includes(selectedPosition.position.ticker) || 
                  (selectedPosition.position.sektor && s.affectedSectors.includes(selectedPosition.position.sektor)))
                .slice(0, 3)
                .map(scenario => (
                  <div key={scenario.id} className="flex items-center justify-between text-xs">
                    <span className="text-gray-300">{scenario.name}</span>
                    <span className={`${scenario.impact === 'severe' ? 'text-red-400' : scenario.impact === 'high' ? 'text-orange-400' : 'text-yellow-400'}`}>
                      {scenario.estimatedImpact > 0 ? '+' : ''}{scenario.estimatedImpact}%
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
