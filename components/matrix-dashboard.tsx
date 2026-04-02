'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Search, TrendingUp, BarChart3, Shield, Users, Clock, RotateCcw, CheckSquare, AlertTriangle, Activity, Zap } from 'lucide-react';
import type { StockData } from '@/lib/types';
import SharedHeader from './shared-header';
import StockOverview from './stock-overview';
import MatrixAmpel from './matrix-ampel';
import FundamentalAnalysis from './fundamental-analysis';
import TechnicalAnalysis from './technical-analysis';
import PeerComparison from './peer-comparison';
import MarketEnvironment from './market-environment';
import MatrixChecklist from './matrix-checklist';
import BlackSwanSimulation from './black-swan-simulation';
import StockChart from './stock-chart';
import EarlyWarnings from './early-warnings';
import DividendAnalysis from './dividend-analysis';
import LoadingSpinner from './loading-spinner';

interface SearchResult {
  ticker: string;
  name: string;
  sector: string;
  index: string;
}

export default function MatrixDashboard({ initialTicker = '' }: { initialTicker?: string }) {
  const [ticker, setTicker] = useState(initialTicker);
  const [confirmedTicker, setConfirmedTicker] = useState(initialTicker); // actual exchange symbol
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState('uebersicht');
  const [chartRange, setChartRange] = useState<'1y' | '5y'>('1y');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchStocks = useCallback(async (query: string) => {
    if (query.trim().length < 1) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setSearchResults(data?.results ?? []);
      setShowDropdown((data?.results ?? []).length > 0);
    } catch {
      setSearchResults([]);
    }
  }, []);

  const handleInputChange = (value: string) => {
    setTicker(value);
    setConfirmedTicker(''); // reset confirmed ticker when user types
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchStocks(value), 200);
  };

  const selectResult = (result: SearchResult) => {
    setTicker(result.ticker);
    setConfirmedTicker(result.ticker);
    setShowDropdown(false);
    setSearchResults([]);
    fetchStock(result.ticker);
  };

  const fetchStock = useCallback(async (tickerInput?: string) => {
    // Priority: explicit arg > confirmed (dropdown) ticker > first search result > raw input uppercased
    const t = (
      tickerInput?.trim() ||
      confirmedTicker?.trim() ||
      searchResults[0]?.ticker?.trim() ||
      ticker?.trim()?.toUpperCase()
    ) ?? '';
    if (!t) return;
    setLoading(true);
    setError(null);
    setShowDropdown(false);
    try {
      const res = await fetch(`/api/stock?ticker=${encodeURIComponent(t)}&range=${chartRange}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? 'Fehler beim Abrufen der Daten');
        setStockData(null);
      } else {
        setStockData(data);
        setTicker(data?.ticker ?? t);
        setError(null);
      }
    } catch (err: any) {
      setError('Netzwerkfehler. Bitte versuchen Sie es erneut.');
      setStockData(null);
    } finally {
      setLoading(false);
    }
  }, [ticker, confirmedTicker, searchResults, chartRange]);

  const handleRangeChange = useCallback(async (newRange: '1y' | '5y') => {
    setChartRange(newRange);
    if (stockData?.ticker) {
      setLoading(true);
      try {
        const res = await fetch(`/api/stock?ticker=${encodeURIComponent(stockData.ticker)}&range=${newRange}`);
        const data = await res.json();
        if (res.ok) setStockData(data);
      } catch { /* ignore */ } finally {
        setLoading(false);
      }
    }
  }, [stockData?.ticker]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setShowDropdown(false);
      // If search results available, use first result as confirmed ticker
      if (searchResults.length > 0 && !confirmedTicker) {
        const first = searchResults[0];
        setConfirmedTicker(first.ticker);
        setTicker(first.ticker);
        setSearchResults([]);
        fetchStock(first.ticker);
      } else {
        fetchStock();
      }
    }
    if (e.key === 'Escape') setShowDropdown(false);
  };

  const quickTickers = [
    { ticker: 'AAPL', label: 'Apple' },
    { ticker: 'NVDA', label: 'NVIDIA' },
    { ticker: 'MSFT', label: 'Microsoft' },
    { ticker: 'SAP.DE', label: 'SAP' },
    { ticker: 'RHM.DE', label: 'Rheinmetall' },
    { ticker: 'NVO', label: 'Novo Nordisk' },
    { ticker: 'TSLA', label: 'Tesla' },
  ];

  // Auto-fetch if initialTicker is provided
  useEffect(() => {
    if (initialTicker) fetchStock(initialTicker);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTicker]);

  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      <SharedHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-12">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
            <Activity className="w-7 h-7 text-[#f0b90b]" />
            <span className="text-white">Aktien-Börsenprofi</span>
            <span className="text-[#f0b90b]">Matrix 2.0</span>
          </h1>
          <p className="text-gray-400 text-sm">Professionelle Aktienanalyse mit Live-Marktdaten</p>
        </div>

        {/* Search Bar with Autocomplete */}
        <div className="glass-card rounded-lg p-4 mb-6">
          <div className="flex gap-3 items-center">
            <div className="relative flex-1" ref={searchRef}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
              <input
                type="text"
                value={ticker}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => { if (searchResults.length > 0) setShowDropdown(true); }}
                placeholder="Aktie suchen – Name oder Ticker (z.B. Apple, SAP, Rheinmetall, NVDA)..."
                className="w-full bg-[#1a1f37] border border-[#2a2f47] rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#f0b90b] focus:ring-1 focus:ring-[#f0b90b] transition-all"
              />
              {/* Autocomplete Dropdown */}
              {showDropdown && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#0f1629] border border-[#2a2f47] rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto">
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
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 bg-[#1a1f37] px-2 py-0.5 rounded">{r.sector}</span>
                        <span className="text-xs text-gray-600">{r.index}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => fetchStock()}
              disabled={loading || !ticker?.trim?.()}
              className="bg-[#f0b90b] hover:bg-[#d4a017] disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-semibold px-6 py-3 rounded-lg transition-all flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              Analysieren
            </button>
          </div>
          <div className="flex gap-2 mt-3 flex-wrap">
            <span className="text-gray-500 text-xs mt-1">Schnellauswahl:</span>
            {quickTickers.map((t) => (
              <button
                key={t.ticker}
                onClick={() => { setTicker(t.ticker); fetchStock(t.ticker); }}
                className="text-xs px-3 py-1 rounded-full bg-[#1a1f37] hover:bg-[#2a2f47] text-gray-300 hover:text-[#f0b90b] border border-[#2a2f47] transition-all"
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="glass-card rounded-lg p-4 mb-6 border-l-4 border-red-500">
            <div className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && <LoadingSpinner />}

        {/* No data state */}
        {!stockData && !loading && !error && (
          <div className="flex flex-col items-center justify-center py-20">
            <Zap className="w-16 h-16 text-[#f0b90b] mb-4 opacity-30" />
            <p className="text-gray-500 text-lg">Aktie suchen, um die Analyse zu starten</p>
            <p className="text-gray-600 text-sm mt-1">Suche nach Name (Apple, Rheinmetall, SAP) oder Ticker (AAPL, RHM.DE)</p>
          </div>
        )}

        {/* Dashboard Content */}
        {stockData && !loading && (
          <div className="space-y-6">
            {activeSection === 'uebersicht' && (
              <>
                <StockOverview data={stockData} />
                <MatrixAmpel data={stockData} />
                <EarlyWarnings data={stockData} />
                <StockChart data={stockData} range={chartRange} onRangeChange={handleRangeChange} />
              </>
            )}
            {activeSection === 'analyse' && (
              <>
                <MatrixAmpel data={stockData} />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <FundamentalAnalysis data={stockData} />
                  <TechnicalAnalysis data={stockData} />
                </div>
                <MarketEnvironment data={stockData} />
              </>
            )}
            {activeSection === 'dividenden' && (
              <DividendAnalysis data={stockData} />
            )}
            {activeSection === 'peers' && (
              <PeerComparison currentTicker={stockData?.ticker ?? ''} onAnalyze={(t: string) => { setTicker(t); fetchStock(t); }} />
            )}
            {activeSection === 'blackswan' && (
              <BlackSwanSimulation data={stockData} />
            )}
            {activeSection === 'checkliste' && (
              <MatrixChecklist data={stockData} />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
