'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Save, X, Package } from 'lucide-react';

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

  useEffect(() => {
    fetch('/api/user/depot')
      .then(r => r.json())
      .then(d => { setPositions(d.positions ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

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
    if (!form.name || !form.ticker || form.stueck <= 0) return;
    let updated: UserPosition[];
    if (editId) {
      updated = positions.map(p => p.id === editId ? { ...form, id: editId } : p);
    } else {
      const newPos: UserPosition = { ...form, id: Date.now().toString() };
      updated = [...positions, newPos];
    }
    setPositions(updated);
    await save(updated);
    setShowForm(false);
    setEditId(null);
    setForm(EMPTY);
  };

  const handleEdit = (p: UserPosition) => {
    setForm({ ...p });
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          <Package className="w-4 h-4 text-[#f0b90b]" />
          Meine Positionen {positions.length > 0 && <span className="text-xs text-gray-500">({positions.length})</span>}
        </h3>
        <button
          onClick={() => { setShowForm(true); setEditId(null); setForm(EMPTY); }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f0b90b] text-black rounded-lg text-sm font-semibold hover:bg-[#f0b90b]/90 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          Position hinzufügen
        </button>
      </div>

      {showForm && (
        <div className="bg-[#0d1220] border border-[#f0b90b]/30 rounded-xl p-4 space-y-3">
          <h4 className="text-sm font-semibold text-[#f0b90b]">
            {editId ? 'Position bearbeiten' : 'Neue Position'}
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Name *</label>
              <input value={form.name} onChange={e => f('name', e.target.value)}
                placeholder="z.B. Apple Inc."
                className="w-full bg-[#1a1f37] border border-[#2a2f47] rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#f0b90b] text-sm" />
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Kurzname</label>
              <input value={form.shortName} onChange={e => f('shortName', e.target.value)}
                placeholder="z.B. Apple"
                className="w-full bg-[#1a1f37] border border-[#2a2f47] rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#f0b90b] text-sm" />
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Ticker *</label>
              <input value={form.ticker} onChange={e => f('ticker', e.target.value.toUpperCase())}
                placeholder="z.B. AAPL"
                className="w-full bg-[#1a1f37] border border-[#2a2f47] rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#f0b90b] text-sm font-mono" />
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">ISIN</label>
              <input value={form.isin} onChange={e => f('isin', e.target.value.toUpperCase())}
                placeholder="z.B. US0378331005"
                className="w-full bg-[#1a1f37] border border-[#2a2f47] rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#f0b90b] text-sm font-mono" />
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Stück *</label>
              <input type="number" min="0" step="0.001" value={form.stueck || ''}
                onChange={e => f('stueck', parseFloat(e.target.value) || 0)}
                className="w-full bg-[#1a1f37] border border-[#2a2f47] rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#f0b90b] text-sm" />
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Kaufkurs (€) *</label>
              <input type="number" min="0" step="0.01" value={form.einstandKurs || ''}
                onChange={e => f('einstandKurs', parseFloat(e.target.value) || 0)}
                className="w-full bg-[#1a1f37] border border-[#2a2f47] rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#f0b90b] text-sm" />
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Akt. Referenzkurs (€)</label>
              <input type="number" min="0" step="0.01" value={form.kursProStueck || ''}
                onChange={e => f('kursProStueck', parseFloat(e.target.value) || 0)}
                placeholder="Letzter bekannter Kurs"
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
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Strategie</label>
              <select value={form.strategy} onChange={e => f('strategy', e.target.value)}
                className="w-full bg-[#1a1f37] border border-[#2a2f47] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#f0b90b] text-sm">
                <option value="dividende">Dividende</option>
                <option value="wachstum">Wachstum</option>
                <option value="value">Value</option>
                <option value="etf">ETF</option>
                <option value="anleihe">Anleihe</option>
                <option value="rohstoff">Rohstoff</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button onClick={handleSubmit} disabled={saving || !form.name || !form.ticker || form.stueck <= 0}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#f0b90b] text-black rounded-lg text-sm font-semibold hover:bg-[#f0b90b]/90 disabled:opacity-50 transition-all">
              <Save className="w-3.5 h-3.5" />
              {saving ? 'Speichern...' : 'Speichern'}
            </button>
            <button onClick={() => { setShowForm(false); setEditId(null); setForm(EMPTY); }}
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
                <span className="text-xs text-gray-500 bg-[#1a1f37] px-2 py-0.5 rounded">{p.typ}</span>
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
