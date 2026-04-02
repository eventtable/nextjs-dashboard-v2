'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  ArrowLeft,
  Wallet,
  Target,
  PieChart,
  Flame,
  Shield,
  Activity,
  BarChart3,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import SharedHeader from '@/components/shared-header';
import { depotPositionen } from '@/data/depot';
import {
  berechneNachkaufEmpfehlungen,
  berechneRiskHeatmap,
  berechneZusammenfassung,
  dividendenDaten
} from '@/data/empfehlungen';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine
} from 'recharts';

export default function EmpfehlungenPage() {
  const nachkaufEmpfehlungen = berechneNachkaufEmpfehlungen(depotPositionen);
  const riskHeatmap = berechneRiskHeatmap(depotPositionen);
  const zusammenfassung = berechneZusammenfassung();

  const starkNachkaufen = nachkaufEmpfehlungen.filter(e => e.empfehlung === 'stark-nachkaufen');
  const nachkaufen = nachkaufEmpfehlungen.filter(e => e.empfehlung === 'nachkaufen');
  const beobachten = nachkaufEmpfehlungen.filter(e => e.empfehlung === 'beobachten');
  const halten = nachkaufEmpfehlungen.filter(e => e.empfehlung === 'halten');
  const verkaufen = nachkaufEmpfehlungen.filter(e => e.empfehlung === 'verkaufen');

  const getEmpfehlungIcon = (empfehlung: string) => {
    switch (empfehlung) {
      case 'stark-nachkaufen':
        return <Flame className="w-5 h-5 text-red-400" />;
      case 'nachkaufen':
        return <ShoppingCart className="w-5 h-5 text-emerald-400" />;
      case 'beobachten':
        return <Target className="w-5 h-5 text-yellow-400" />;
      case 'verkaufen':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      default:
        return <Shield className="w-5 h-5 text-blue-400" />;
    }
  };

  // Border-only colors — keeps cards readable without heavy background tint
  const getEmpfehlungColor = (empfehlung: string) => {
    switch (empfehlung) {
      case 'stark-nachkaufen':
        return 'border-l-4 border-l-red-500 border border-[#1a1f37]';
      case 'nachkaufen':
        return 'border-l-4 border-l-emerald-500 border border-[#1a1f37]';
      case 'beobachten':
        return 'border-l-4 border-l-yellow-500 border border-[#1a1f37]';
      case 'verkaufen':
        return 'border-l-4 border-l-orange-500 border border-[#1a1f37]';
      default:
        return 'border-l-4 border-l-blue-500 border border-[#1a1f37]';
    }
  };

  const getEmpfehlungBadgeColor = (empfehlung: string) => {
    switch (empfehlung) {
      case 'stark-nachkaufen': return 'bg-red-500/15 border-red-500/40 text-red-400';
      case 'nachkaufen': return 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400';
      case 'beobachten': return 'bg-yellow-500/15 border-yellow-500/40 text-yellow-400';
      case 'verkaufen': return 'bg-orange-500/15 border-orange-500/40 text-orange-400';
      default: return 'bg-blue-500/15 border-blue-500/40 text-blue-400';
    }
  };

  const getEmpfehlungLabel = (empfehlung: string) => {
    switch (empfehlung) {
      case 'stark-nachkaufen': return 'Stark Nachkaufen';
      case 'nachkaufen': return 'Nachkaufen';
      case 'beobachten': return 'Beobachten';
      case 'verkaufen': return 'Verkaufen';
      default: return 'Halten';
    }
  };

  const getRisikoBadge = (level: string) => {
    const colors: Record<string, string> = {
      'niedrig': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      'moderat': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      'hoch': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      'sehr-hoch': 'bg-red-500/20 text-red-400 border-red-500/30'
    };
    return colors[level] || colors['moderat'];
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-emerald-400';
    if (score >= 50) return 'text-yellow-400';
    if (score >= 30) return 'text-orange-400';
    return 'text-red-400';
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 70) return 'bg-emerald-500';
    if (score >= 50) return 'bg-yellow-500';
    if (score >= 30) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white">
      <SharedHeader />

      <main className="pt-24 pb-12 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span>Zurück</span>
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Target className="w-8 h-8 text-[#f0b90b]" />
            Matrix 2.0 Nachkauf-Empfehlungen
          </h1>
          <p className="text-gray-400">
            Bewertung nach Chancen-Risiko, Fundamental, Technisch &amp; Makro
          </p>
          <div className="mt-2 text-sm text-gray-500">
            Letzte Aktualisierung: {zusammenfassung.letzteAktualisierung}
          </div>
        </div>

        {/* Score Übersicht */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <Flame className="w-5 h-5 text-red-400" />
              <span className="text-red-400">Stark Kaufen</span>
            </div>
            <p className="text-2xl font-bold">{starkNachkaufen.length}</p>
            <p className="text-xs text-gray-500">Score ≥75 + Abstand &lt;-20% + Risiko niedrig/moderat</p>
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <ShoppingCart className="w-5 h-5 text-emerald-400" />
              <span className="text-emerald-400">Nachkaufen</span>
            </div>
            <p className="text-2xl font-bold">{nachkaufen.length}</p>
            <p className="text-xs text-gray-500">Score ≥55 + Abstand &lt;-10% (unter Buy-In)</p>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <Target className="w-5 h-5 text-yellow-400" />
              <span className="text-yellow-400">Beobachten</span>
            </div>
            <p className="text-2xl font-bold">{beobachten.length}</p>
            <p className="text-xs text-gray-500">Score 45-65 ODER tiefer Abstand aber schwacher Score</p>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-5 h-5 text-blue-400" />
              <span className="text-blue-400">Halten</span>
            </div>
            <p className="text-2xl font-bold">{halten.length}</p>
            <p className="text-xs text-gray-500">Über Buy-In ODER Score &lt;45 bei moderatem Abstand</p>
          </div>

          <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
              <span className="text-orange-400">Verkaufen</span>
            </div>
            <p className="text-2xl font-bold">{verkaufen.length}</p>
            <p className="text-xs text-gray-500">Strukturelle Probleme (z.B. Junk-Bonds)</p>
          </div>
        </div>

        {/* Hauptempfehlungen */}
        <div className="glass-card rounded-xl p-6 mb-8 border border-[#f0b90b]/30">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Activity className="w-6 h-6 text-[#f0b90b]" />
            Aktuelle Empfehlungen
          </h2>

          <div className="space-y-4">
            {nachkaufEmpfehlungen
              .filter((e: any) => e.empfehlung !== 'halten' || e.typ === 'Anleihe')
              .map((empf: any, index: number) => (
              <motion.div
                key={empf.ticker}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-[#0d1220] rounded-xl p-4 ${getEmpfehlungColor(empf.empfehlung)}`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3 min-w-0">
                    {getEmpfehlungIcon(empf.empfehlung)}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-lg text-white">{empf.ticker}</span>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${getEmpfehlungBadgeColor(empf.empfehlung)}`}>
                          {getEmpfehlungLabel(empf.empfehlung)}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-[#1a1f37] text-gray-400">{empf.typ}</span>
                      </div>
                      <p className="text-sm text-gray-300 mt-0.5">{empf.name}</p>
                      <p className="text-xs mt-1 text-gray-400">{empf.begruendung}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 ml-4 flex flex-col items-end gap-1">
                    {/* Aktueller Kurs — prominent */}
                    <div className="text-xl font-bold text-white">{empf.aktuellerKurs.toFixed(2)} €</div>
                    <div className={`text-sm font-semibold ${empf.abstandProzent < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {empf.abstandProzent > 0 ? '+' : ''}{empf.abstandProzent.toFixed(1)}% vs Buy-In
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <span className={`text-2xl font-bold ${getScoreColor(empf.gesamtScore)}`}>{empf.gesamtScore}</span>
                      <span className="text-xs text-gray-500">Score</span>
                    </div>
                  </div>
                </div>

                {/* Scores */}
                <div className="grid grid-cols-4 gap-4 mb-3 pt-3 border-t border-[#1a1f37]">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Fundamental</div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-[#1a1f37] rounded-full overflow-hidden">
                        <div className={`h-full ${getScoreBarColor(empf.fundamentalScore)}`} style={{width: `${empf.fundamentalScore}%`}} />
                      </div>
                      <span className={`text-sm font-medium ${getScoreColor(empf.fundamentalScore)}`}>{empf.fundamentalScore}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Technisch</div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-[#1a1f37] rounded-full overflow-hidden">
                        <div className={`h-full ${getScoreBarColor(empf.technischerScore)}`} style={{width: `${empf.technischerScore}%`}} />
                      </div>
                      <span className={`text-sm font-medium ${getScoreColor(empf.technischerScore)}`}>{empf.technischerScore}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Makro</div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-[#1a1f37] rounded-full overflow-hidden">
                        <div className={`h-full ${getScoreBarColor(empf.makroScore)}`} style={{width: `${empf.makroScore}%`}} />
                      </div>
                      <span className={`text-sm font-medium ${getScoreColor(empf.makroScore)}`}>{empf.makroScore}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Risiko</div>
                    <span className={`text-xs px-2 py-0.5 rounded border ${getRisikoBadge(empf.risikoLevel)}`}>
                      {empf.risikoLevel}
                    </span>
                  </div>
                </div>

                {/* FCF Yield */}
                {empf.fcfYield && empf.fcfYield.yield >= 4 && (
                  <div className="pt-2 border-t border-[#1a1f37]/50">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                      empf.fcfYield.yield >= 8 ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400' :
                      empf.fcfYield.yield >= 6 ? 'bg-yellow-500/20 border border-yellow-500/30 text-yellow-400' :
                      'bg-blue-500/20 border border-blue-500/30 text-blue-400'
                    }`}>
                      <DollarSign className="w-4 h-4" />
                      <span className="font-medium">FCF Yield: {empf.fcfYield.yield.toFixed(1)}%</span>
                      {empf.fcfYield.yield >= 8 && <span className="text-xs">🚀 KAUF-Signal</span>}
                      {empf.fcfYield.yield >= 6 && empf.fcfYield.yield < 8 && <span className="text-xs">⭐ Attraktiv</span>}
                    </div>
                  </div>
                )}

                {/* Fibonacci Levels */}
                {empf.fibonacci && (
                  <div className="pt-3 border-t border-[#1a1f37]">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-[#f0b90b]" />
                      <span className="text-sm font-medium text-[#f0b90b]">Fibonacci Levels</span>
                      <span className="text-xs text-gray-500">({empf.fibonacci.zone})</span>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <div className="bg-[#0a0e1a] px-2 py-1 rounded border border-[#1a1f37]">
                        <span className="text-gray-500">38.2%: </span>
                        <span className="text-white">{empf.fibonacci.level382.toFixed(2)}€</span>
                      </div>
                      <div className="bg-[#0a0e1a] px-2 py-1 rounded border border-[#1a1f37]">
                        <span className="text-gray-500">61.8%: </span>
                        <span className="text-emerald-400 font-medium">{empf.fibonacci.level618.toFixed(2)}€</span>
                      </div>
                      <div className="bg-[#0a0e1a] px-2 py-1 rounded border border-[#1a1f37]">
                        <span className="text-gray-500">Support: </span>
                        <span className="text-emerald-400">{empf.fibonacci.naechsteUnterstuetzung.toFixed(2)}€</span>
                      </div>
                      <div className="bg-[#0a0e1a] px-2 py-1 rounded border border-[#1a1f37]">
                        <span className="text-gray-500">Widerstand: </span>
                        <span className="text-red-400">{empf.fibonacci.naechsterWiderstand.toFixed(2)}€</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Kurse & Levels */}
                <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm pt-3 border-t border-[#1a1f37]">
                  <span className="text-gray-500">
                    Buy-In: <span className="text-white font-semibold">{empf.buyIn.toFixed(2)} €</span>
                  </span>
                  {empf.nachkaufZone && empf.nachkaufZone !== 'Keine Zone' && (
                    <span className="text-gray-500">
                      Kaufzone: <span className="text-emerald-400 font-medium">{empf.nachkaufZone}</span>
                    </span>
                  )}
                  <span className="text-gray-500">
                    Stop-Loss: <span className="text-red-400 font-medium">{empf.stopLoss}</span>
                  </span>
                  <span className="text-gray-500">
                    Kursziel: <span className="text-emerald-400 font-medium">{empf.zielKurs}</span>
                  </span>
                </div>

                {/* Chance/Risiko Faktoren */}
                {(empf.chanceFaktoren?.length > 0 || empf.risikoFaktoren?.length > 0) && (
                  <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-[#1a1f37]">
                    {empf.chanceFaktoren?.length > 0 && (
                      <div className="flex items-start gap-2">
                        <ThumbsUp className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                        <div className="flex flex-wrap gap-1">
                          {empf.chanceFaktoren.map((f: string, i: number) => (
                            <span key={i} className="text-xs text-emerald-400">{f}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {empf.risikoFaktoren?.length > 0 && (
                      <div className="flex items-start gap-2">
                        <ThumbsDown className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                        <div className="flex flex-wrap gap-1">
                          {empf.risikoFaktoren.map((f: string, i: number) => (
                            <span key={i} className="text-xs text-red-400">{f}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Risk Heatmap */}
          <div className="glass-card rounded-xl p-6 border border-[#1a1f37]">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-red-400" />
              Matrix Risk-Heatmap
            </h2>

            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={riskHeatmap}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1f37" horizontal={false} />
                  <XAxis
                    type="number"
                    stroke="#4B5563"
                    tick={{ fill: '#9CA3AF', fontSize: 11 }}
                    tickFormatter={(value: number) => `${value}%`}
                  />
                  <YAxis
                    dataKey="ticker"
                    type="category"
                    stroke="#4B5563"
                    tick={{ fill: '#9CA3AF', fontSize: 11 }}
                    width={70}
                  />
                  <Tooltip
                    content={({ active, payload }: any) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-[#0d1220] border border-[#1a1f37] rounded-lg p-3 shadow-xl">
                            <p className="font-semibold text-white">{data.name}</p>
                            <p className={data.performanceProzent >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                              {data.performanceProzent >= 0 ? '+' : ''}{data.performanceProzent.toFixed(1)}%
                            </p>
                            <p className="text-gray-400 text-sm">{data.gewinnEur?.toLocaleString('de-DE')} €</p>
                            <p className="text-xs text-gray-500 mt-1">Matrix Score: {data.matrixScore}/100</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <ReferenceLine x={0} stroke="#9CA3AF" />
                  <Bar dataKey="performanceProzent" radius={[0, 4, 4, 0]}>
                    {riskHeatmap.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.farbe} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-red-500" />
                <span className="text-gray-400">Hoch-Risiko</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-yellow-500" />
                <span className="text-gray-400">Mittel-Risiko</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-emerald-500" />
                <span className="text-gray-400">Niedrig-Risiko</span>
              </div>
            </div>
          </div>

          {/* Dividenden-Tracker */}
          <div className="glass-card rounded-xl p-6 border border-[#1a1f37]">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-emerald-400" />
              Dividenden-Tracker
            </h2>

            <div className="space-y-3">
              {dividendenDaten.map((div: any, index: number) => (
                <motion.div
                  key={div.ticker}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-[#0d1220] rounded-lg p-3 border border-[#1a1f37]"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{div.name}</p>
                      <p className="text-sm text-gray-400">{div.ticker}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-400">{div.dividendenrendite}%</p>
                      <p className="text-sm text-gray-400">{div.frequenz}</p>
                    </div>
                  </div>

                  <div className="mt-2 pt-2 border-t border-[#1a1f37] flex justify-between text-sm">
                    <span className="text-gray-400">
                      {div.ausschuettungProAktie.toFixed(2)} €/Aktie
                    </span>
                    <span className="text-gray-500">
                      Nächste: {div.naechsteAusschuettung}
                    </span>
                  </div>
                  {div.wachstum5Jahre && (
                    <div className="mt-1 text-xs text-emerald-400">
                      📈 {div.wachstum5Jahre}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            <div className="mt-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Geschätzte Jahresdividende:</span>
                <span className="font-bold text-emerald-400">
                  {zusammenfassung.geschaetzteDividendeJaehrlich.toFixed(2)} €
                </span>
              </div>
              <div className="mt-1 text-xs text-gray-500">
                ≈ {(zusammenfassung.geschaetzteDividendeJaehrlich / 8388 * 100).toFixed(2)}% Depotrendite
              </div>
            </div>
          </div>
        </div>

        {/* Matrix Legende */}
        <div className="glass-card rounded-xl p-6 border border-[#1a1f37] mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-[#f0b90b]" />
            Matrix 2.0 Entscheidungslogik
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-[#0d1220] rounded-lg p-4 border border-[#1a1f37]">
              <div className="font-semibold text-emerald-400 mb-3">Wann wird empfohlen?</div>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><span className="text-red-400 font-medium">Stark Kaufen:</span> Score ≥75 + Abstand &lt;-20% + Risiko niedrig/moderat</li>
                <li><span className="text-emerald-400 font-medium">Nachkaufen:</span> Score ≥55 + Abstand &lt;-10% (immer unter Buy-In!)</li>
                <li><span className="text-yellow-400 font-medium">Beobachten:</span> Score 45-65 ODER tiefer Abstand aber schwacher Score</li>
                <li><span className="text-blue-400 font-medium">Halten:</span> Über Buy-In ODER Score &lt;45 bei moderatem Abstand</li>
              </ul>
            </div>
            <div className="bg-[#0d1220] rounded-lg p-4 border border-[#1a1f37]">
              <div className="font-semibold text-yellow-400 mb-3">Wichtige Regeln</div>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><span className="text-red-400">⚠️ KEIN Nachkauf</span> wenn Kurs über Buy-In!</li>
                <li><span className="text-yellow-400">⚠️ WARNUNG:</span> Tief unter Buy-In aber schwacher Score = Fundamentale Probleme?</li>
                <li><span className="text-emerald-400">✅ FCF Yield &gt;8%</span> = Starkes Kaufsignal (z.B. Allianz)</li>
                <li><span className="text-blue-400">💡 Fibonacci:</span> 61.8% = ideale Nachkaufzone</li>
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div className="bg-[#0d1220] rounded-lg p-4 border border-[#1a1f37]">
              <div className="font-semibold text-emerald-400 mb-2">Fundamental (40%)</div>
              <ul className="space-y-1 text-gray-400">
                <li>• KGV vs. 5J Durchschnitt</li>
                <li>• KGV vs. Peers</li>
                <li>• Dividendenrendite</li>
                <li>• Free Cashflow</li>
                <li>• ROE &amp; Verschuldung</li>
              </ul>
            </div>
            <div className="bg-[#0d1220] rounded-lg p-4 border border-[#1a1f37]">
              <div className="font-semibold text-yellow-400 mb-2">Technisch (35%)</div>
              <ul className="space-y-1 text-gray-400">
                <li>• Abstand zu Buy-In</li>
                <li>• 52W Performance</li>
                <li>• Fibonacci Levels (38.2%, 61.8%)</li>
                <li>• Support/Widerstand</li>
              </ul>
            </div>
            <div className="bg-[#0d1220] rounded-lg p-4 border border-[#1a1f37]">
              <div className="font-semibold text-blue-400 mb-2">Makro (25%)</div>
              <ul className="space-y-1 text-gray-400">
                <li>• Branchenzyklus</li>
                <li>• Diversifikation</li>
                <li>• Asset-Typ (Aktie/ETF)</li>
                <li>• Depotgewichtung</li>
              </ul>
            </div>
            <div className="bg-[#0d1220] rounded-lg p-4 border border-[#1a1f37]">
              <div className="font-semibold text-red-400 mb-2">Risiko-Levels</div>
              <ul className="space-y-1 text-gray-400">
                <li>• Niedrig: Blue Chips</li>
                <li>• Moderat: Normale Volatilität</li>
                <li>• Hoch: Starke Verluste</li>
                <li>• Sehr Hoch: Hebel/Anleihen</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Fibonacci Erklärung */}
        <div className="glass-card rounded-xl p-6 border border-[#1a1f37] mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-[#f0b90b]" />
            Fibonacci Retracement
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-[#0d1220] rounded-lg p-4 border border-[#1a1f37]">
              <div className="font-semibold text-emerald-400 mb-2">61.8% — Goldene Zone</div>
              <p className="text-gray-400">Das "goldene Verhältnis". Starke Unterstützung, ideal für Nachkäufe wenn Kurs hier abprallt.</p>
            </div>
            <div className="bg-[#0d1220] rounded-lg p-4 border border-[#1a1f37]">
              <div className="font-semibold text-yellow-400 mb-2">38.2% — Widerstand</div>
              <p className="text-gray-400">Oft erste Unterstützung bei Korrekturen. Wird zum Widerstand beim Wiederanstieg.</p>
            </div>
            <div className="bg-[#0d1220] rounded-lg p-4 border border-[#1a1f37]">
              <div className="font-semibold text-blue-400 mb-2">50% — Psychologisch</div>
              <p className="text-gray-400">Kein echtes Fibonacci, aber wichtig. Oft Bereich der Konsolidierung.</p>
            </div>
          </div>
        </div>

        {/* Zusammenfassung */}
        <div className="glass-card rounded-xl p-6 border border-[#1a1f37] mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-[#f0b90b]" />
            Zusammenfassung
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-3 text-red-400">Höchstes Risiko</h3>
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <p className="font-semibold">{zusammenfassung.hoechstesRisiko}</p>
                <p className="text-sm text-gray-400 mt-2">
                  Air Baltic Anleihe hat 75% verloren. Entscheidung: Realisieren oder auf Restrukturierung warten.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-3 text-emerald-400">Beste Chance</h3>
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
                <p className="font-semibold">{zusammenfassung.besteChance}</p>
                <p className="text-sm text-gray-400 mt-2">
                  SAP &amp; Novo Nordisk stark unterbewertet. Gute Fundamentaldaten bei hohem Abschlag.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex gap-4">
          <Link
            href="/analyse"
            className="flex-1 bg-[#0d1220] border border-[#1a1f37] hover:border-[#f0b90b]/50 rounded-xl p-4 text-center transition-all"
          >
            <PieChart className="w-6 h-6 mx-auto mb-2 text-[#f0b90b]" />
            <p className="font-semibold">Analyse</p>
            <p className="text-sm text-gray-400">Sektoren &amp; Balance</p>
          </Link>
          <Link
            href="/depot"
            className="flex-1 bg-[#0d1220] border border-[#1a1f37] hover:border-[#f0b90b]/50 rounded-xl p-4 text-center transition-all"
          >
            <Wallet className="w-6 h-6 mx-auto mb-2 text-[#f0b90b]" />
            <p className="font-semibold">Depot</p>
            <p className="text-sm text-gray-400">Alle Positionen</p>
          </Link>
        </div>
      </main>
    </div>
  );
}
