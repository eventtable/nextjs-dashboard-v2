'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Pencil, Trash2, Save, X, Package, Search } from 'lucide-react';

interface UserPosition {
  id: string;
  name: string;
  shortName: string;
  ticker: string;
  isin: string;
  stueck: number;
  kursProStueck: number;
  einstandKurs: number;
  typ: 'Aktie' | 'ETF' | 'Anleihe' | 'ETC';
  category: string;
  strategy: string;
  currency: string;
}

interface SearchResult { ticker: string; name: string; sector: string; index: string }

const EMPTY: Omit<UserPosition, 'id'> = {
  name: '', shortName: '', ticker: '', isin: '',
  stueck: 0, kursProStueck: 0, einstandKurs: 0,
  typ: 'Aktie', category: 'aktie', strategy: 'wachstum', currency: 'EUR',
};

export default function PositionManager({ onSaved }: { onSaved?: () => void }) {
  const [positions, setPositions] = useState<UserPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<UserPosition, 'id'>>(EMPTY);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [stockSelected, setStockSelected] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/user/depot')
      .then(r => r.json())
      .then(d => { setPositions(d.positions ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const searchStocks = useCallback(async (q: string) => {
    if (q.trim().length < 1) { setSearchResults([]); setShowDropdown(false); return; }
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      const results = data?.results ?? [];
      setSearchResults(results);
      setShowDropdown(results.length > 0);
    } catch { setSearchResults([]); }
  }, []);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setStockSelected(false);
    setForm(prev => ({ ...prev, ticker: value.toUpperCase(), name: '', shortName: '' }));
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchStocks(value), 200);
  };

  const selectStock = (r: SearchResult) => {
    setSearchQuery(r.ticker);
    setShowDropdown(false);
    setSearchResults([]);
    setStockSelected(true);
    setForm(prev => ({
      ...prev,
      ticker: r.ticker,
      name: r.name,
      shortName: r.name.split(' ')[0],
    }));
  };

  const save = async (list: UserPosition[]) => {
    setSaving(true);
    await fetch('/api/user/depot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ positions: list }),
    });
    setSaving(false);
    onSaved?.();
  };

  const handleSubmit = async () => {
    const ticker = form.ticker || searchQuery.trim().toUpperCase();
    if (!ticker || form.stueck <= 0 || form.einstandKurs <= 0) return;
    const finalForm = { ...form, ticker };
    if (!finalForm.name) finalForm.name = ticker;
    if (!finalForm.shortName) finalForm.shortName = ticker;

    let updated: UserPosition[];
    if (editId) {
      updated = positions.map(p => p.id === editId ? { ...finalForm, id: editId } : p);
    } else {
      updated = [...positions, { ...finalForm, id: Date.now().toString() }];
    }
    setPositions(updated);
    await save(updated);
    closeForm();
  };

  const closeForm = () => {
    setShowForm(false);
    setEditId(null);
    setForm(EMPTY);
    setSearchQuery('');
    setStockSelected(false);
    setSearchResults([]);
  };

  const handleEdit = (p: UserPosition) => {
    setForm({ ...p });
    setSearchQuery(p.ticker);
    setStockSelected(true);
    setEditId(p.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const updated = positions.filter(p => p.id !== id);
    setPositions(updated);
    await save(updated);
  };

  const f = (key: keyof Omit<UserPosition, 'id'>, val: string | number) =>
    setForm(prev => ({ ...prev, [key]: val }));

  const canSubmit = (form.ticker || searchQuery.trim()) && form.stueck > 0 && form.einstandKurs > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          <Package className="w-4 h-4 text-[#f0b90b]" />
          Meine Positionen {positions.length > 0 && <span className="text-xs text-gray-500">({positions.length})</span>}
        </h3>
        <button
          onClick={() => { setShowForm(true); setEditId(null); setForm(EMPTY); setSearchQuery(''); setStockSelected(false); }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f0b90b] text-black rounded-lg text-sm font-semibold hover:bg-[#f0b90b]/90 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          Position hinzufügen
        </button>
      </div>

      {showForm && (
        <div className="bg-[#0d1220] border border-[#f0b90b]/30 rounded-xl p-4 space-y-4">
          <h4 className="text-sm font-semibold text-[#f0b90b]">
            {editId ? 'Position bearbeiten' : 'Neue Position'}
          </h4>

          {/* Step 1: Stock search */}
          <div ref={searchRef} className="relative">
            <label className="text-gray-400 text-xs mb-1 block">Aktie / ETF suchen *</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => handleSearchChange(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && searchResults.length > 0 && !stockSelected) selectStock(searchResults[0]);
                  if (e.key === 'Escape') setShowDropdown(false);
                  if (e.key === 'Enter' && stockSelected) { /* do nothing, let submit handle */ }
                }}
                onFocus={() => { if (searchResults.length > 0) setShowDropdown(true); }}
                placeholder="z.B. AAPL, SAP, Tesla, MSCI World…"
                className="w-full bg-[#1a1f37] border border-[#2a2f47] rounded-lg pl-9 pr-8 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#f0b90b] text-sm"
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(''); setStockSelected(false); setForm(prev => ({ ...prev, ticker: '', name: '', shortName: '' })); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {showDropdown && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#0f1629] border border-[#2a2f47] rounded-lg shadow-xl z-50 max-h-56 overflow-y-auto">
                {searchResults.map((r, i) => (
                  <button key={`${r.ticker}-${i}`} onMouseDown={() => selectStock(r)}
                    className="w-full text-left px-3 py-2.5 hover:bg-[#1a1f37] transition-colors flex items-center justify-between border-b border-[#1a1f37] last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-[#f0b90b] bg-[#f0b90b]/10 px-1.5 py-0.5 rounded font-bold min-w-[60px] text-center">{r.ticker}</span>
                      <span className="text-xs text-white truncate max-w-[180px]">{r.name}</span>
                    </div>
                    <span className="text-[10px] text-gray-500 flex-shrink-0 ml-2">{r.sector}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Selected stock confirmation */}
            {stockSelected && form.name && (
              <p className="mt-1.5 text-xs text-emerald-400 flex items-center gap-1">
                <span className="font-mono font-bold">{form.ticker}</span>
                <span className="text-gray-500">·</span>
                <span className="truncate">{form.name}</span>
              </p>
            )}
          </div>

          {/* Step 2: Position details */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Stück *</label>
              <input type="number" min="0" step="0.001" value={form.stueck || ''}
                onChange={e => f('stueck', parseFloat(e.target.value) || 0)}
                placeholder="z.B. 10"
                className="w-full bg-[#1a1f37] border border-[#2a2f47] rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#f0b90b] text-sm" />
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Kaufkurs (€) *</label>
              <input type="number" min="0" step="0.01" value={form.einstandKurs || ''}
                onChange={e => f('einstandKurs', parseFloat(e.target.value) || 0)}
                placeholder="z.B. 185.50"
                className="w-full bg-[#1a1f37] border border-[#2a2f47] rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#f0b90b] text-sm" />
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Typ</label>
              <select value={form.typ} onChange={e => {
                  const t = e.target.value as UserPosition['typ'];
                  f('typ', t);
                  f('category', t === 'ETF' ? 'etf' : t === 'Anleihe' ? 'anleihe' : t === 'ETC' ? 'etp' : 'aktie');
                }}
                className="w-full bg-[#1a1f37] border border-[#2a2f47] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#f0b90b] text-sm">
                <option>Aktie</option>
                <option>ETF</option>
                <option>ETC</option>
                <option>Anleihe</option>
              </select>
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Währung</label>
              <select value={form.currency} onChange={e => f('currency', e.target.value)}
                className="w-full bg-[#1a1f37] border border-[#2a2f47] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#f0b90b] text-sm">
                <option>EUR</option>
                <option>USD</option>
                <option>GBP</option>
                <option>CHF</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button onClick={handleSubmit} disabled={saving || !canSubmit}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#f0b90b] text-black rounded-lg text-sm font-semibold hover:bg-[#f0b90b]/90 disabled:opacity-50 transition-all">
              <Save className="w-3.5 h-3.5" />
              {saving ? 'Speichern...' : 'Speichern'}
            </button>
            <button onClick={closeForm}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#1a1f37] text-gray-400 hover:text-white rounded-lg text-sm transition-all">
              <X className="w-3.5 h-3.5" />
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-[#1a1f37] rounded-lg animate-pulse" />)}
        </div>
      ) : positions.length === 0 ? (
        <div className="text-center py-12 bg-[#0d1220] border border-dashed border-[#1a1f37] rounded-xl">
          <Package className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">Noch keine Positionen</p>
          <p className="text-gray-500 text-sm mt-1">Füge deine erste Position hinzu um dein Depot zu tracken</p>
        </div>
      ) : (
        <div className="space-y-2">
          {positions.map(p => (
            <div key={p.id} className="bg-[#0d1220] border border-[#1a1f37] rounded-lg px-4 py-3 flex items-center justify-between gap-4 hover:border-[#2a2f47] transition-all">
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-mono text-xs text-[#f0b90b] bg-[#f0b90b]/10 px-2 py-0.5 rounded font-bold shrink-0">{p.ticker}</span>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-white truncate">{p.name}</div>
                  <div className="text-xs text-gray-500">{p.stueck} Stück · EK: {p.einstandKurs.toFixed(2)} €</div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-gray-500 bg-[#1a1f37] px-2 py-0.5 rounded hidden sm:inline">{p.typ}</span>
                <button onClick={() => handleEdit(p)}
                  className="p-1.5 text-gray-400 hover:text-[#f0b90b] hover:bg-[#f0b90b]/10 rounded transition-all">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleDelete(p.id)}
                  className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-all">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
