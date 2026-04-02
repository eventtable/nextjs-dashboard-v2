'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, RotateCcw, TrendingDown, TrendingUp, AlertTriangle, 
  Shield, Zap, Globe, DollarSign, Activity 
} from 'lucide-react';
import { Position } from '@/data/depot';
import { riskScenarios, berechneScenarioImpact, RiskScenario } from '@/data/riskScenarios';

interface ScenarioSimulatorProps {
  positions: Position[];
  totalValue: number;
}

interface SimulationResult {
  scenario: RiskScenario;
  depotImpact: number;
  totalValueAfter: number;
  affectedPositions: {
    ticker: string;
    name: string;
    wertEur: number;
    impact: number;
    newValue: number;
    typ: string;
  }[];
}

// Impact-Icon basierend auf Szenario-Kategorie
const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'geopolitical': return <Globe className="w-4 h-4" />;
    case 'macro': return <Activity className="w-4 h-4" />;
    case 'monetary': return <DollarSign className="w-4 h-4" />;
    case 'market': return <TrendingDown className="w-4 h-4" />;
    case 'sector': return <Zap className="w-4 h-4" />;
    default: return <AlertTriangle className="w-4 h-4" />;
  }
};

const probabilityColors = {
  low: 'text-green-400 bg-green-500/20 border-green-500/30',
  medium: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30',
  high: 'text-red-400 bg-red-500/20 border-red-500/30'
};

const impactColors = {
  low: 'text-green-400',
  medium: 'text-yellow-400',
  high: 'text-orange-400',
  severe: 'text-red-400'
};

export default function ScenarioSimulator({ positions, totalValue }: ScenarioSimulatorProps) {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const [customImpact, setCustomImpact] = useState<number>(-15);
  const [activeTab, setActiveTab] = useState<'preset' | 'custom'>('preset');
  const [isSimulating, setIsSimulating] = useState(false);
  
  const selectedScenario = useMemo(() => 
    riskScenarios.find(s => s.id === selectedScenarioId),
    [selectedScenarioId]
  );
  
  const simulationResult: SimulationResult | null = useMemo(() => {
    if (!selectedScenario && activeTab === 'preset') return null;
    
    let scenario: RiskScenario;
    
    if (activeTab === 'custom') {
      // Custom Szenario
      scenario = {
        id: 'custom',
        name: 'Benutzerdefiniertes Szenario',
        description: 'Manuell konfiguriertes Risiko-Szenario',
        probability: 'medium',
        impact: customImpact <= -20 ? 'severe' : customImpact <= -10 ? 'high' : customImpact <= -5 ? 'medium' : 'low',
        affectedSectors: ['Technology', 'Cyclicals'],
        affectedTickers: positions.slice(0, 8).map(p => p.ticker),
        estimatedImpact: customImpact,
        triggers: ['Benutzerdefiniert'],
        mitigation: ['Positionen anpassen'],
        timeframe: 'N/A',
        category: 'market'
      };
    } else {
      scenario = selectedScenario!;
    }
    
    const impact = berechneScenarioImpact(scenario, positions);
    
    return {
      scenario,
      depotImpact: impact.depotImpact,
      totalValueAfter: impact.totalValueAfter,
      affectedPositions: impact.affectedPositions.map(p => ({
        ...p,
        typ: positions.find(pos => pos.ticker === p.ticker)?.typ || 'Aktie'
      }))
    };
  }, [selectedScenario, customImpact, activeTab, positions]);
  
  const runSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => setIsSimulating(false), 500);
  };
  
  return (
    <div className="glass-card rounded-xl p-4 space-y-3">
      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
        <Shield className="w-4 h-4 text-[#f0b90b]" />
        Szenario-Simulator
      </h3>

      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setActiveTab('preset')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-all ${activeTab === 'preset' ? 'bg-[#f0b90b] text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
          Vordefinierte Szenarien
        </button>
        <button onClick={() => setActiveTab('custom')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-all ${activeTab === 'custom' ? 'bg-[#f0b90b] text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
          Eigenes Szenario
        </button>
      </div>

      {/* Side-by-side: scenario list + simulation result */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">

        {/* LEFT: Scenario list or custom controls */}
        <div>
          {activeTab === 'preset' && (
            <div className="space-y-1">
              {riskScenarios.map((scenario) => {
                const isSelected = selectedScenarioId === scenario.id;
                return (
                  <motion.button
                    key={scenario.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { setSelectedScenarioId(scenario.id); runSimulation(); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all ${
                      isSelected ? 'border-[#f0b90b] bg-[#f0b90b]/10' : 'border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/8'
                    }`}
                  >
                    <span className={`shrink-0 ${isSelected ? 'text-[#f0b90b]' : 'text-gray-500'}`}>
                      {getCategoryIcon(scenario.category)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white truncate">{scenario.name}</span>
                        <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded border ${probabilityColors[scenario.probability]}`}>
                          {scenario.probability === 'low' ? '↓ low' : scenario.probability === 'high' ? '↑ high' : '→ med'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-xs font-semibold ${impactColors[scenario.impact]}`}>
                          {scenario.estimatedImpact > 0 ? '+' : ''}{scenario.estimatedImpact}%
                        </span>
                        <span className="text-[10px] text-gray-500">{scenario.timeframe}</span>
                      </div>
                    </div>
                    {isSelected && <span className="shrink-0 text-[#f0b90b] text-xs">▶</span>}
                  </motion.button>
                );
              })}
            </div>
          )}

          {activeTab === 'custom' && (
            <div className="rounded-xl border border-white/10 p-4 space-y-4">
              <h4 className="text-sm font-medium text-white">Manueller Impact-Test</h4>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-gray-400">Markt-Impact</label>
                  <span className={`text-sm font-bold ${customImpact <= -20 ? 'text-red-400' : customImpact <= -10 ? 'text-orange-400' : customImpact <= -5 ? 'text-yellow-400' : 'text-green-400'}`}>
                    {customImpact > 0 ? '+' : ''}{customImpact}%
                  </span>
                </div>
                <input type="range" min="-30" max="20" value={customImpact}
                  onChange={(e) => { setCustomImpact(Number(e.target.value)); runSimulation(); }}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#f0b90b]"
                />
                <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                  <span>-30%</span><span>0%</span><span>+20%</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Korrektur -10%', val: -10, cls: 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20' },
                  { label: 'Crash -20%',     val: -20, cls: 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20' },
                  { label: 'Black Swan -30%',val: -30, cls: 'bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30' },
                  { label: 'Rally +15%',     val:  15, cls: 'bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20' },
                ].map(b => (
                  <button key={b.val} onClick={() => { setCustomImpact(b.val); runSimulation(); }}
                    className={`py-2 px-3 rounded-lg border text-xs transition-colors ${b.cls}`}>
                    {b.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Simulation result (always visible) */}
        <div>
          {simulationResult ? (
            <div className="rounded-xl p-4 border border-[#f0b90b]/30 bg-[#f0b90b]/5 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-white font-semibold text-sm flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#f0b90b]" />
                  Simulations-Ergebnis
                </h4>
                <button onClick={() => setSelectedScenarioId(null)} className="text-gray-500 hover:text-white transition-colors">
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* KPIs */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-[#0d1117] rounded-lg p-2.5">
                  <p className="text-[10px] text-gray-500">Depot-Impact</p>
                  <p className={`text-base font-bold ${simulationResult.depotImpact <= -15 ? 'text-red-400' : simulationResult.depotImpact <= -8 ? 'text-orange-400' : simulationResult.depotImpact <= 0 ? 'text-yellow-400' : 'text-green-400'}`}>
                    {simulationResult.depotImpact > 0 ? '+' : ''}{simulationResult.depotImpact.toFixed(2)}%
                  </p>
                </div>
                <div className="bg-[#0d1117] rounded-lg p-2.5">
                  <p className="text-[10px] text-gray-500">Neuer Wert</p>
                  <p className="text-base font-bold text-white">
                    {simulationResult.totalValueAfter.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div className="bg-[#0d1117] rounded-lg p-2.5">
                  <p className="text-[10px] text-gray-500">Änderung</p>
                  <p className={`text-base font-bold ${simulationResult.totalValueAfter - totalValue < 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {(simulationResult.totalValueAfter - totalValue).toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0, signDisplay: 'always' })}
                  </p>
                </div>
              </div>

              {/* Affected positions */}
              {simulationResult.affectedPositions.length > 0 && (
                <div>
                  <p className="text-[10px] text-gray-400 mb-1.5">Betroffene Positionen:</p>
                  <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                    {simulationResult.affectedPositions.map((pos) => (
                      <div key={pos.ticker} className="flex items-center justify-between py-1.5 px-2 rounded bg-[#0d1117]">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs font-medium text-white truncate">{pos.name}</span>
                          <span className="text-[10px] text-gray-500 shrink-0">{pos.ticker}</span>
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          <span className={`text-xs font-medium ${pos.impact < 0 ? 'text-red-400' : 'text-green-400'}`}>
                            {pos.impact > 0 ? '+' : ''}{pos.impact.toFixed(1)}%
                          </span>
                          <span className="text-[10px] text-gray-500 ml-1.5">→ {pos.newValue.toFixed(0)}€</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Triggers & Mitigation */}
              {activeTab === 'preset' && selectedScenario && (
                <div className="pt-3 border-t border-white/10 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] text-gray-400 mb-1.5 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Auslöser:
                    </p>
                    <ul className="space-y-1">
                      {selectedScenario.triggers.map((t, i) => (
                        <li key={i} className="text-[11px] text-gray-300 flex items-start gap-1">
                          <span className="text-[#f0b90b] mt-0.5 shrink-0">•</span>{t}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 mb-1.5 flex items-center gap-1">
                      <Shield className="w-3 h-3" /> Absicherung:
                    </p>
                    <ul className="space-y-1">
                      {selectedScenario.mitigation.map((m, i) => (
                        <li key={i} className="text-[11px] text-gray-300 flex items-start gap-1">
                          <span className="text-green-400 mt-0.5 shrink-0">✓</span>{m}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl p-8 text-center border border-white/10 h-full flex flex-col items-center justify-center gap-2">
              <AlertTriangle className="w-6 h-6 text-gray-600" />
              <p className="text-xs text-gray-500">Szenario wählen, um<br/>Depot-Auswirkungen zu simulieren.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}