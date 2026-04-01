'use client';

import { useState, useEffect } from 'react';
import { Users, TrendingUp, TrendingDown, Loader2, BarChart3, Shield, ArrowRight, Zap, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { PEER_GROUPS, findPeerGroup, formatNumber, formatMarketCap } from '@/lib/stock-utils';
import type { StockData } from '@/lib/types';

interface PeerData {
  ticker: string;
  name: string;
  currentPrice: number | null;
  changePercent: number | null;
  kgv: number | null;
  dividendenRendite: number;
  rsi: number;
  marketCap: number | null;
  revenueGrowth: number | null;
  freeCashflow: number | null;
}

interface SectorPeer {
  ticker: string;
  name: string;
  sector: string;
  index: string;
  sectorLabel: string;
}

interface HedgingPair {
  ticker: string;
  name: string;
  sector: string;
  index: string;
  sectorLabel: string;
  reason: string;
}

interface SectorData {
  sector: string | null;
  sectorLabel: string | null;
  peers: SectorPeer[];
  hedgingPairs: HedgingPair[];
}

export default function PeerComparison({ currentTicker, onAnalyze }: { currentTicker: string; onAnalyze: (ticker: string) => void }) {
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [peers, setPeers] = useState<PeerData[]>([]);
  const [loading, setLoading] = useState(false);
  const [sectorData, setSectorData] = useState<SectorData | null>(null);
  const [sectorPeers, setSectorPeers] = useState<PeerData[]>([]);
  const [sectorLoading, setSectorLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'sector' | 'predefined' | 'hedging'>('sector');

  // Auto-fetch sector peers when ticker changes
  useEffect(() => {
    if (!currentTicker) return;
    fetchSectorData();
  }, [currentTicker]);

  const fetchSectorData = async () => {
    setSectorLoading(true);
    try {
      const res = await fetch(`/api/sector-peers?ticker=${encodeURIComponent(currentTicker)}`);
      const data = await res.json();
      setSectorData(data);
      // Auto-load top 5 sector peers
      if (data?.peers?.length > 0) {
        const topPeers = data.peers.slice(0, 6);
        await loadPeerData(topPeers.map((p: SectorPeer) => p.ticker), setSectorPeers);
      }
    } catch { /* ignore */ } finally {
      setSectorLoading(false);
    }
  };

  const loadPeerData = async (tickers: string[], setter: (data: PeerData[]) => void) => {
    const results = await Promise.all(
      tickers.map(async (t: string) => {
        try {
          const res = await fetch(`/api/stock?ticker=${encodeURIComponent(t)}`);
          if (!res.ok) return null;
          const data = await res.json();
          return {
            ticker: data?.ticker ?? t,
            name: data?.name ?? t,
            currentPrice: data?.currentPrice ?? null,
            changePercent: data?.changePercent ?? null,
            kgv: data?.kgv ?? null,
            dividendenRendite: data?.dividendenRendite ?? 0,
            rsi: data?.rsi ?? 50,
            marketCap: data?.marketCap ?? null,
            revenueGrowth: data?.revenueGrowth ?? null,
            freeCashflow: data?.freeCashflow ?? null,
          } as PeerData;
        } catch {
          return null;
        }
      })
    );
    setter(results.filter((r): r is PeerData => r !== null));
  };

  const fetchPeers = async (groupKey: string) => {
    setSelectedGroup(groupKey);
    const group = PEER_GROUPS?.[groupKey];
    if (!group) return;
    setLoading(true);
    setPeers([]);
    await loadPeerData(group.peers, setPeers);
    setLoading(false);
  };

  const chartColors = ['#60B5FF', '#FF9149', '#FF90BB', '#22c55e', '#A19AD3', '#f0b90b'];

  const renderPeerTable = (data: PeerData[], showAnalyzeBtn: boolean = true) => {
    if (data.length === 0) return null;

    const kgvData = data.filter((p) => p?.kgv !== null).map((p, i) => ({
      name: p?.ticker ?? '',
      KGV: p?.kgv ?? 0,
      fill: chartColors[i % chartColors.length] ?? '#60B5FF',
    }));

    return (
      <>
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1a1f37]">
                <th className="text-left py-2 px-3 text-gray-500 font-medium text-xs">Ticker</th>
                <th className="text-left py-2 px-3 text-gray-500 font-medium text-xs">Name</th>
                <th className="text-right py-2 px-3 text-gray-500 font-medium text-xs">Kurs</th>
                <th className="text-right py-2 px-3 text-gray-500 font-medium text-xs">\u00c4nderung</th>
                <th className="text-right py-2 px-3 text-gray-500 font-medium text-xs">KGV</th>
                <th className="text-right py-2 px-3 text-gray-500 font-medium text-xs">Dividende</th>
                <th className="text-right py-2 px-3 text-gray-500 font-medium text-xs">RSI</th>
                <th className="text-right py-2 px-3 text-gray-500 font-medium text-xs">Mkt. Kap.</th>
                {showAnalyzeBtn && <th className="text-right py-2 px-3 text-gray-500 font-medium text-xs"></th>}
              </tr>
            </thead>
            <tbody>
              {data.map((p) => {
                const isCurrent = p?.ticker?.toUpperCase?.() === currentTicker?.toUpperCase?.();
                return (
                  <tr key={p?.ticker ?? ''} className={`border-b border-[#1a1f37] hover:bg-[#1a1f37]/50 transition-all ${isCurrent ? 'bg-[#f0b90b]/5' : ''}`}>
                    <td className="py-2.5 px-3">
                      <span className={`font-mono text-xs ${isCurrent ? 'text-[#f0b90b] font-bold' : 'text-white'}`}>{p?.ticker ?? ''}</span>
                    </td>
                    <td className="py-2.5 px-3 text-gray-300 text-xs">{p?.name ?? ''}</td>
                    <td className="py-2.5 px-3 text-right text-white font-medium">{p?.currentPrice ? formatNumber(p.currentPrice) : 'N/A'}</td>
                    <td className={`py-2.5 px-3 text-right font-medium ${(p?.changePercent ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {p?.changePercent !== null ? `${(p.changePercent >= 0 ? '+' : '')}${formatNumber(p.changePercent)}%` : 'N/A'}
                    </td>
                    <td className="py-2.5 px-3 text-right text-white">{p?.kgv ? formatNumber(p.kgv, 1) : 'N/A'}</td>
                    <td className="py-2.5 px-3 text-right text-white">{formatNumber(p?.dividendenRendite ?? 0)}%</td>
                    <td className={`py-2.5 px-3 text-right font-medium ${(p?.rsi ?? 50) > 70 ? 'text-red-400' : (p?.rsi ?? 50) < 30 ? 'text-green-400' : 'text-white'}`}>
                      {formatNumber(p?.rsi ?? 50, 1)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-gray-300 text-xs">{formatMarketCap(p?.marketCap)}</td>
                    {showAnalyzeBtn && (
                      <td className="py-2.5 px-3 text-right">
                        {!isCurrent && (
                          <button
                            onClick={() => onAnalyze(p.ticker)}
                            className="text-xs text-[#f0b90b] hover:text-white bg-[#f0b90b]/10 hover:bg-[#f0b90b]/20 px-2 py-1 rounded transition-all"
                          >
                            Analysieren
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {kgvData.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-400 mb-2 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#f0b90b]" />
              KGV-Vergleich
            </h4>
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={kgvData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <XAxis dataKey="name" tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                  <YAxis tickLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f1629', border: '1px solid #1a1f37', borderRadius: 8, fontSize: 11 }}
                    labelStyle={{ color: '#9ca3af' }}
                  />
                  <Bar dataKey="KGV" radius={[4, 4, 0, 0]} animationDuration={800}>
                    {kgvData.map((entry: any, index: number) => (
                      <Cell key={index} fill={entry?.fill ?? '#60B5FF'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="glass-card rounded-xl p-5">
        <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-[#f0b90b]" />
          Peer-Vergleich \u2013 {currentTicker}
        </h3>

        <div className="flex gap-2 mb-5">
          {[
            { key: 'sector', label: 'Branche', icon: Zap },
            { key: 'hedging', label: 'Hedging-Paare', icon: Shield },
            { key: 'predefined', label: 'Klassische Gruppen', icon: Users },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-all ${
                activeTab === tab.key
                  ? 'bg-[#f0b90b] text-black font-semibold'
                  : 'bg-[#1a1f37] text-gray-400 hover:text-white border border-[#2a2f47]'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Sector Tab */}
        {activeTab === 'sector' && (
          <div>
            {sectorData?.sectorLabel && (
              <div className="mb-4 bg-[#1a1f37] rounded-lg p-3">
                <p className="text-sm text-gray-400">
                  <span className="text-[#f0b90b] font-semibold">{currentTicker}</span> geh\u00f6rt zum Sektor{' '}
                  <span className="text-white font-semibold">{sectorData.sectorLabel}</span>.
                  Hier sind die wichtigsten Wettbewerber:
                </p>
              </div>
            )}
            {sectorLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-6 h-6 text-[#f0b90b] animate-spin" />
                <span className="text-gray-400 ml-2 text-sm">Branchenvergleich wird geladen...</span>
              </div>
            ) : sectorPeers.length > 0 ? (
              renderPeerTable(sectorPeers)
            ) : (
              <p className="text-gray-500 text-sm text-center py-8">Keine Branchen-Peers gefunden. Versuchen Sie eine andere Aktie.</p>
            )}
          </div>
        )}

        {/* Hedging Tab */}
        {activeTab === 'hedging' && (
          <div>
            <div className="mb-4 bg-[#1a1f37] rounded-lg p-3">
              <p className="text-sm text-gray-400">
                <Shield className="w-4 h-4 text-[#22c55e] inline mr-1" />
                <span className="text-white font-semibold">Hedging-Paare</span> \u2013 Aktien aus gegenl\u00e4ufigen Sektoren.
                Wenn <span className="text-[#f0b90b]">{currentTicker}</span> schw\u00e4chelt, k\u00f6nnen diese profitieren:
              </p>
            </div>
            {sectorData?.hedgingPairs && sectorData.hedgingPairs.length > 0 ? (
              <div className="space-y-3">
                {sectorData.hedgingPairs.map((pair, i) => (
                  <div key={`${pair.ticker}-${i}`} className="bg-[#1a1f37] rounded-lg p-4 flex items-center justify-between hover:bg-[#1a1f37]/80 transition-all">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-mono text-sm text-[#f0b90b] bg-[#f0b90b]/10 px-2 py-0.5 rounded font-bold">{pair.ticker}</span>
                        <span className="text-sm text-white font-medium">{pair.name}</span>
                        <span className="text-xs text-gray-500 bg-[#0a0e1a] px-2 py-0.5 rounded">{pair.sectorLabel}</span>
                      </div>
                      <p className="text-xs text-gray-400">{pair.reason}</p>
                    </div>
                    <button
                      onClick={() => onAnalyze(pair.ticker)}
                      className="flex items-center gap-1 text-xs text-[#f0b90b] hover:text-white bg-[#f0b90b]/10 hover:bg-[#f0b90b]/20 px-3 py-1.5 rounded-lg transition-all ml-3"
                    >
                      Analysieren <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm text-center py-8">Keine Hedging-Paare gefunden.</p>
            )}
          </div>
        )}

        {/* Predefined Groups Tab */}
        {activeTab === 'predefined' && (
          <div>
            <div className="flex flex-wrap gap-2 mb-5">
              {Object.entries(PEER_GROUPS ?? {}).map(([key, group]: [string, any]) => (
                <button
                  key={key}
                  onClick={() => fetchPeers(key)}
                  className={`px-4 py-2 text-sm rounded-lg transition-all ${
                    selectedGroup === key
                      ? 'bg-[#f0b90b] text-black font-semibold'
                      : 'bg-[#1a1f37] text-gray-400 hover:text-white border border-[#2a2f47]'
                  }`}
                >
                  {group?.name ?? key} ({(group?.tickers ?? []).join(', ')})
                </button>
              ))}
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-6 h-6 text-[#f0b90b] animate-spin" />
                <span className="text-gray-400 ml-2 text-sm">Peer-Daten werden geladen...</span>
              </div>
            ) : peers.length > 0 ? (
              renderPeerTable(peers)
            ) : (
              <p className="text-gray-500 text-sm text-center py-8">W\u00e4hlen Sie eine Peer-Gruppe aus.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}