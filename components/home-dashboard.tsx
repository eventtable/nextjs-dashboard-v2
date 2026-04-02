'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Search, TrendingUp, BarChart3, Shield, Wallet, Zap,
  AlertTriangle, Activity, ArrowUpRight, ArrowDownRight,
  ChevronRight, LineChart, Users
} from 'lucide-react';
import SharedHeader from '@/components/shared-header';
import { usePortfolio } from '@/hooks/use-portfolio';

interface SearchResult {
  ticker: string;
  name: string;
  sector: string;
  index: string;
}

const quickTickers = [
  { ticker: 'AAPL', label: 'Apple' },
  { ticker: 'NVDA', label: 'NVIDIA' },
  { ticker: 'MSFT', label: 'Microsoft' },
  { ticker: 'SAP.DE', label: 'SAP' },
  { ticker: 'RHM.DE', label: 'Rheinmetall' },
  { ticker: 'NVO', label: 'Novo Nordisk' },
  { ticker: 'TSLA', label: 'Tesla' },
  { ticker: 'AMZN', label: 'Amazon' },
];

const quickNavCards = [
  {
    href: '/depot',
    label: 'Depot',
    description: 'Portfolio & Positionen',
    icon: Wallet,
    color: '#22c55e',
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
  },
  {
    href: '/risiko',
    label: 'Risiko',
    description: 'Heatmap & Szenarien',
    icon: Shield,
    color: '#f0b90b',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/20',
  },
  {
    href: '/empfehlungen',
    label: 'Empfehlungen',
    description: 'Nachkauf-Analyse',
    icon: TrendingUp,
    color: '#60B5FF',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
  },
  {
    href: '/smartmoney',
    label: 'Smart Money',
    description: 'Institutionelle Daten',
    icon: Users,
    color: '#a855f7',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
  },
];

export default function HomeDashboard() {
  const router = useRouter();
  const { data: session } = useSession();
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const { totalValue, totalChange, totalChangePercent, isLoading } = usePortfolio();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchStocks = useCallback(async (q: string) => {
    if (q.trim().length < 1) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setSearchResults(data?.results ?? []);
      setShowDropdown((data?.results ?? []).length > 0);
    } catch {
      setSearchResults([]);
    }
  }, []);

  const handleInputChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchStocks(value), 200);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && query.trim()) {
      setShowDropdown(false);
      router.push(`/matrix?ticker=${encodeURIComponent(query.trim())}`);
    }
    if (e.key === 'Escape') setShowDropdown(false);
  };

  const selectResult = (result: SearchResult) => {
    setShowDropdown(false);
    router.push(`/matrix?ticker=${encodeURIComponent(result.ticker)}`);
  };

  const isPositive = totalChange >= 0;

  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      <SharedHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-12 space-y-8">

        {/* Welcome + Portfolio Summary */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">
              Aktien-Börsenprofi <span className="text-[#f0b90b]">Matrix 2.0</span>
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              Professionelle Aktienanalyse · Live-Marktdaten · KI-gestützte Signale
            </p>
          </div>
          {session && (
            <div className="glass-card rounded-xl px-5 py-3 flex items-center gap-4">
              <div>
                <p className="text-xs text-gray-500">Portfolio-Wert</p>
                <p className="text-xl font-bold text-white">
                  {isLoading ? '...' : `€${totalValue.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                </p>
              </div>
              {!isLoading && (
                <div className={`flex items-center gap-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                  {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  <span className="text-sm font-semibold">
                    {isPositive ? '+' : ''}{totalChangePercent.toFixed(2)}%
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Search */}
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
            <Search className="w-4 h-4 text-[#f0b90b]" />
            Schnellanalyse
          </h3>
          <div className="flex gap-3 items-center">
            <div className="relative flex-1" ref={searchRef}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
              <input
                type="text"
                value={query}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => { if (searchResults.length > 0) setShowDropdown(true); }}
                placeholder="Aktie suchen – Name oder Ticker (Apple, SAP, NVDA, RHM.DE)..."
                className="w-full bg-[#1a1f37] border border-[#2a2f47] rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#f0b90b] focus:ring-1 focus:ring-[#f0b90b] transition-all"
              />
              {showDropdown && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#0f1629] border border-[#2a2f47] rounded-lg shadow-xl z-50 max-h-72 overflow-y-auto">
                  {searchResults.map((r, i) => (
                    <button
                      key={`${r.ticker}-${i}`}
                      onClick={() => selectResult(r)}
                      className="w-full text-left px-4 py-2.5 hover:bg-[#1a1f37] transition-colors flex items-center justify-between group border-b border-[#1a1f37] last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs text-[#f0b90b] bg-[#f0b90b]/10 px-2 py-0.5 rounded font-bold min-w-[70px] text-center">{r.ticker}</span>
                        <span className="text-sm text-white group-hover:text-[#f0b90b]">{r.name}</span>
                      </div>
                      <span className="text-xs text-gray-500">{r.sector}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => { if (query.trim()) router.push(`/matrix?ticker=${encodeURIComponent(query.trim())}`); }}
              disabled={!query.trim()}
              className="bg-[#f0b90b] hover:bg-[#d4a017] disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-semibold px-6 py-3 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap"
            >
              <Activity className="w-4 h-4" />
              Analysieren
            </button>
          </div>

          {/* Quick Ticker Chips */}
          <div className="flex gap-2 mt-3 flex-wrap items-center">
            <span className="text-gray-500 text-xs">Schnellauswahl:</span>
            {quickTickers.map((t) => (
              <button
                key={t.ticker}
                onClick={() => router.push(`/matrix?ticker=${encodeURIComponent(t.ticker)}`)}
                className="text-xs px-3 py-1 rounded-full bg-[#1a1f37] hover:bg-[#2a2f47] text-gray-300 hover:text-[#f0b90b] border border-[#2a2f47] transition-all"
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Nav Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickNavCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.href}
                href={card.href}
                className={`glass-card rounded-xl p-5 border ${card.border} hover:scale-[1.02] transition-all duration-200 group`}
              >
                <div className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center mb-3`}>
                  <Icon className="w-5 h-5" style={{ color: card.color }} />
                </div>
                <h4 className="font-semibold text-white group-hover:text-[#f0b90b] transition-colors">
                  {card.label}
                </h4>
                <p className="text-xs text-gray-500 mt-1">{card.description}</p>
                <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-[#f0b90b] mt-2 transition-colors" />
              </Link>
            );
          })}
        </div>

        {/* Depot Übersicht + Weitere Links */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Depot Stats */}
          <div className="lg:col-span-2 glass-card rounded-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Wallet className="w-5 h-5 text-[#f0b90b]" />
                Depot-Übersicht
              </h3>
              {session && (
                <Link href="/depot" className="text-xs text-[#f0b90b] hover:underline flex items-center gap-1">
                  Vollansicht <ChevronRight className="w-3 h-3" />
                </Link>
              )}
            </div>
            {session ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="bg-[#1a1f37] rounded-lg p-3">
                    <p className="text-xs text-gray-500">Gesamtwert</p>
                    <p className="text-lg font-bold text-white mt-1">
                      {isLoading ? '...' : `€${totalValue.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
                    </p>
                  </div>
                  <div className="bg-[#1a1f37] rounded-lg p-3">
                    <p className="text-xs text-gray-500">Tagesveränderung</p>
                    <p className={`text-lg font-bold mt-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                      {isLoading ? '...' : `${isPositive ? '+' : ''}${totalChangePercent.toFixed(2)}%`}
                    </p>
                  </div>
                  <div className="bg-[#1a1f37] rounded-lg p-3">
                    <p className="text-xs text-gray-500">Strategie</p>
                    <p className="text-lg font-bold text-[#f0b90b] mt-1">7 aktiv</p>
                  </div>
                </div>
                <div className="mt-4 flex gap-3 flex-wrap">
                  <Link href="/depot" className="text-xs px-4 py-2 bg-[#f0b90b]/10 border border-[#f0b90b]/20 text-[#f0b90b] rounded-lg hover:bg-[#f0b90b]/20 transition-all">
                    Positionen ansehen
                  </Link>
                  <Link href="/empfehlungen" className="text-xs px-4 py-2 bg-[#1a1f37] border border-[#2a2f47] text-gray-300 rounded-lg hover:bg-[#2a2f47] transition-all">
                    Nachkauf-Empfehlungen
                  </Link>
                  <Link href="/risiko" className="text-xs px-4 py-2 bg-[#1a1f37] border border-[#2a2f47] text-gray-300 rounded-lg hover:bg-[#2a2f47] transition-all">
                    Risiko-Analyse
                  </Link>
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-500 text-sm mb-3">Melde dich an, um dein Depot zu sehen</p>
                <Link href="/login" className="text-xs px-4 py-2 bg-[#f0b90b]/10 border border-[#f0b90b]/20 text-[#f0b90b] rounded-lg hover:bg-[#f0b90b]/20 transition-all">
                  Zum Login
                </Link>
              </div>
            )}
          </div>

          {/* Further Links */}
          <div className="space-y-3">
            <Link href="/ai-trading" className="glass-card rounded-xl p-4 flex items-center gap-4 hover:border-[#f0b90b]/30 border border-transparent transition-all group">
              <div className="w-10 h-10 rounded-lg bg-[#f0b90b]/10 flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 text-[#f0b90b]" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-white text-sm group-hover:text-[#f0b90b] transition-colors">KI-Trading</p>
                <p className="text-xs text-gray-500 truncate">ML-Signale & Prognosen</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-[#f0b90b] ml-auto transition-colors" />
            </Link>

            <Link href="/backtest" className="glass-card rounded-xl p-4 flex items-center gap-4 hover:border-blue-500/30 border border-transparent transition-all group">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-5 h-5 text-blue-400" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-white text-sm group-hover:text-blue-400 transition-colors">Backtest</p>
                <p className="text-xs text-gray-500 truncate">Strategie-Simulation</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-blue-400 ml-auto transition-colors" />
            </Link>

            <Link href="/paper-trading" className="glass-card rounded-xl p-4 flex items-center gap-4 hover:border-purple-500/30 border border-transparent transition-all group">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                <LineChart className="w-5 h-5 text-purple-400" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-white text-sm group-hover:text-purple-400 transition-colors">Paper Trading</p>
                <p className="text-xs text-gray-500 truncate">Virtuelles Portfolio</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-purple-400 ml-auto transition-colors" />
            </Link>

            <Link href="/matrix" className="glass-card rounded-xl p-4 flex items-center gap-4 hover:border-green-500/30 border border-transparent transition-all group">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                <Activity className="w-5 h-5 text-green-400" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-white text-sm group-hover:text-green-400 transition-colors">Matrix Analyse</p>
                <p className="text-xs text-gray-500 truncate">Fundamentaldaten & Charts</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-green-400 ml-auto transition-colors" />
            </Link>
          </div>
        </div>

      </main>
    </div>
  );
}
