'use client';

import { useState, useEffect } from 'react';
import SharedHeader from '@/components/shared-header';
import { Layers, TrendingUp, TrendingDown, DollarSign, Plus, Trash2, Search, RefreshCw } from 'lucide-react';

interface Position {
  ticker: string;
  name: string;
  qty: number;
  buyPrice: number;
  currentPrice: number;
  date: string;
}

const STORAGE_KEY = 'paper_trading_portfolio';
const INITIAL_CAPITAL = 10000;

const SAMPLE_PRICES: Record<string, { name: string; price: number }> = {
  'AAPL': { name: 'Apple', price: 189.50 },
  'MSFT': { name: 'Microsoft', price: 415.20 },
  'NVDA': { name: 'NVIDIA', price: 875.40 },
  'TSLA': { name: 'Tesla', price: 178.30 },
  'AMZN': { name: 'Amazon', price: 198.60 },
  'GOOGL': { name: 'Alphabet', price: 172.80 },
  'SAP.DE': { name: 'SAP', price: 210.40 },
  'RHM.DE': { name: 'Rheinmetall', price: 1240.00 },
  'BABA': { name: 'Alibaba', price: 84.20 },
  'NVO': { name: 'Novo Nordisk', price: 118.40 },
};

export default function PaperTradingPage() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [cashBalance, setCashBalance] = useState(INITIAL_CAPITAL);
  const [ticker, setTicker] = useState('');
  const [qty, setQty] = useState(1);
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy');
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      setPositions(data.positions ?? []);
      setCashBalance(data.cash ?? INITIAL_CAPITAL);
    }
  }, []);

  const save = (p: Position[], c: number) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ positions: p, cash: c }));
  };

  const showMsg = (text: string, type: 'success' | 'error') => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 3000);
  };

  const handleOrder = () => {
    const t = ticker.toUpperCase().trim();
    const info = SAMPLE_PRICES[t];
    if (!info) return showMsg(`Ticker ${t} nicht gefunden. Verfügbar: ${Object.keys(SAMPLE_PRICES).join(', ')}`, 'error');
    if (qty <= 0) return showMsg('Ungültige Menge', 'error');

    const price = info.price * (1 + (Math.random() * 0.004 - 0.002)); // ±0.2% slippage
    const cost = price * qty;

    if (orderType === 'buy') {
      if (cost > cashBalance) return showMsg(`Nicht genug Kapital (benötigt: €${cost.toFixed(2)})`, 'error');
      const existing = positions.find(p => p.ticker === t);
      let newPositions: Position[];
      if (existing) {
        newPositions = positions.map(p => p.ticker === t
          ? { ...p, qty: p.qty + qty, buyPrice: (p.buyPrice * p.qty + price * qty) / (p.qty + qty) }
          : p
        );
      } else {
        newPositions = [...positions, { ticker: t, name: info.name, qty, buyPrice: price, currentPrice: price, date: new Date().toLocaleDateString('de-DE') }];
      }
      const newCash = cashBalance - cost;
      setPositions(newPositions);
      setCashBalance(newCash);
      save(newPositions, newCash);
      showMsg(`✓ ${qty}x ${t} bei €${price.toFixed(2)} gekauft`, 'success');
    } else {
      const existing = positions.find(p => p.ticker === t);
      if (!existing) return showMsg(`Keine Position in ${t}`, 'error');
      if (qty > existing.qty) return showMsg(`Nur ${existing.qty} Stück verfügbar`, 'error');
      const proceeds = price * qty;
      let newPositions: Position[];
      if (qty === existing.qty) {
        newPositions = positions.filter(p => p.ticker !== t);
      } else {
        newPositions = positions.map(p => p.ticker === t ? { ...p, qty: p.qty - qty } : p);
      }
      const newCash = cashBalance + proceeds;
      setPositions(newPositions);
      setCashBalance(newCash);
      save(newPositions, newCash);
      showMsg(`✓ ${qty}x ${t} bei €${price.toFixed(2)} verkauft`, 'success');
    }
    setTicker('');
    setQty(1);
  };

  const reset = () => {
    if (!confirm('Portfolio zurücksetzen?')) return;
    localStorage.removeItem(STORAGE_KEY);
    setPositions([]);
    setCashBalance(INITIAL_CAPITAL);
  };

  const refreshPrices = () => {
    const updated = positions.map(p => {
      const info = SAMPLE_PRICES[p.ticker];
      if (!info) return p;
      const newPrice = info.price * (1 + (Math.random() * 0.04 - 0.02));
      return { ...p, currentPrice: newPrice };
    });
    setPositions(updated);
    save(updated, cashBalance);
    showMsg('Kurse aktualisiert', 'success');
  };

  const portfolioValue = positions.reduce((sum, p) => sum + p.currentPrice * p.qty, 0);
  const totalValue = cashBalance + portfolioValue;
  const totalReturn = ((totalValue - INITIAL_CAPITAL) / INITIAL_CAPITAL) * 100;
  const isPositive = totalReturn >= 0;

  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      <SharedHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-12 space-y-6">

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Layers className="w-7 h-7 text-[#f0b90b]" />
              Paper Trading
            </h1>
            <p className="text-gray-400 text-sm mt-1">Virtuelles Portfolio — Üben ohne echtes Kapital</p>
          </div>
          <button onClick={reset} className="text-xs text-gray-500 hover:text-red-400 flex items-center gap-1 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" /> Reset
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Gesamtwert', value: `€${totalValue.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: 'text-white' },
            { label: 'Kassenbestand', value: `€${cashBalance.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: 'text-blue-400' },
            { label: 'Positionen', value: `${positions.length}`, color: 'text-[#f0b90b]' },
            { label: 'Gesamtrendite', value: `${isPositive ? '+' : ''}${totalReturn.toFixed(2)}%`, color: isPositive ? 'text-green-400' : 'text-red-400' },
          ].map(s => (
            <div key={s.label} className="glass-card rounded-xl p-4 border border-[#1a1f37]">
              <p className="text-xs text-gray-500 mb-1">{s.label}</p>
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Order Form */}
        <div className="glass-card rounded-xl p-6 border border-[#1a1f37]">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-[#f0b90b]" />
            Order aufgeben
          </h3>
          {msg && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${msg.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
              {msg.text}
            </div>
          )}
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Typ</label>
              <div className="flex rounded-lg overflow-hidden border border-[#2a2f47]">
                <button onClick={() => setOrderType('buy')} className={`px-4 py-2 text-sm font-medium transition-colors ${orderType === 'buy' ? 'bg-green-500/20 text-green-400' : 'bg-[#1a1f37] text-gray-400 hover:text-white'}`}>Kaufen</button>
                <button onClick={() => setOrderType('sell')} className={`px-4 py-2 text-sm font-medium transition-colors ${orderType === 'sell' ? 'bg-red-500/20 text-red-400' : 'bg-[#1a1f37] text-gray-400 hover:text-white'}`}>Verkaufen</button>
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Ticker</label>
              <input
                value={ticker}
                onChange={e => setTicker(e.target.value.toUpperCase())}
                placeholder="z.B. AAPL"
                className="bg-[#1a1f37] border border-[#2a2f47] rounded-lg px-3 py-2 text-white text-sm w-32 focus:border-[#f0b90b] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Anzahl</label>
              <input
                type="number"
                value={qty}
                onChange={e => setQty(Number(e.target.value))}
                min={1}
                className="bg-[#1a1f37] border border-[#2a2f47] rounded-lg px-3 py-2 text-white text-sm w-24 focus:border-[#f0b90b] focus:outline-none"
              />
            </div>
            {ticker && SAMPLE_PRICES[ticker.toUpperCase()] && (
              <div className="text-xs text-gray-400">
                <span className="text-white font-medium">{SAMPLE_PRICES[ticker.toUpperCase()].name}</span>
                <br />≈ €{SAMPLE_PRICES[ticker.toUpperCase()].price.toLocaleString('de-DE')} / Stück
              </div>
            )}
            <button
              onClick={handleOrder}
              className={`px-5 py-2 rounded-lg font-semibold text-sm transition-all ${orderType === 'buy' ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}
            >
              {orderType === 'buy' ? 'Kaufen' : 'Verkaufen'}
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-3">Verfügbare Ticker: {Object.keys(SAMPLE_PRICES).join(', ')}</p>
        </div>

        {/* Positions Table */}
        <div className="glass-card rounded-xl p-6 border border-[#1a1f37]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Offene Positionen</h3>
            {positions.length > 0 && (
              <button onClick={refreshPrices} className="text-xs text-[#f0b90b] hover:underline flex items-center gap-1">
                <RefreshCw className="w-3 h-3" /> Kurse aktualisieren
              </button>
            )}
          </div>
          {positions.length === 0 ? (
            <div className="text-center py-10">
              <Layers className="w-10 h-10 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500">Keine offenen Positionen</p>
              <p className="text-gray-600 text-xs mt-1">Kaufe deine erste Aktie oben</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1a1f37] text-gray-400 text-xs">
                    <th className="text-left py-2">Aktie</th>
                    <th className="text-right py-2">Stück</th>
                    <th className="text-right py-2">Kaufkurs</th>
                    <th className="text-right py-2">Aktuell</th>
                    <th className="text-right py-2">Wert</th>
                    <th className="text-right py-2">G/V</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map(p => {
                    const pnl = (p.currentPrice - p.buyPrice) * p.qty;
                    const pnlPct = ((p.currentPrice - p.buyPrice) / p.buyPrice) * 100;
                    const pos = pnl >= 0;
                    return (
                      <tr key={p.ticker} className="border-b border-[#0f1629] hover:bg-[#1a1f37]/30">
                        <td className="py-3">
                          <span className="font-mono text-[#f0b90b] text-xs bg-[#f0b90b]/10 px-2 py-0.5 rounded mr-2">{p.ticker}</span>
                          <span className="text-gray-300 text-xs">{p.name}</span>
                        </td>
                        <td className="text-right text-white">{p.qty}</td>
                        <td className="text-right text-gray-400">€{p.buyPrice.toFixed(2)}</td>
                        <td className="text-right text-white">€{p.currentPrice.toFixed(2)}</td>
                        <td className="text-right text-white font-medium">€{(p.currentPrice * p.qty).toFixed(2)}</td>
                        <td className={`text-right font-semibold ${pos ? 'text-green-400' : 'text-red-400'}`}>
                          {pos ? '+' : ''}€{pnl.toFixed(2)}<br />
                          <span className="text-xs font-normal">{pos ? '+' : ''}{pnlPct.toFixed(2)}%</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
