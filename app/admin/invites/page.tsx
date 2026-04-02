'use client';

import { useEffect, useState } from 'react';
import SharedHeader from '@/components/shared-header';
import { Key, ArrowLeft, Plus, Copy, Check, XCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function AdminInvitesPage() {
  const [invites, setInvites]   = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [creating, setCreating] = useState(false);
  const [maxUses, setMaxUses]   = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [newLink, setNewLink]   = useState<string | null>(null);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  async function load() {
    setLoading(true);
    try {
      const r = await fetch('/api/admin/invites');
      const d = await r.json();
      setInvites(d.invites ?? []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function createInvite() {
    setCreating(true);
    setNewLink(null);
    try {
      const r = await fetch('/api/admin/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maxUses }),
      });
      const d = await r.json();
      if (d.invite?.code) {
        const link = `${baseUrl}/register?invite=${d.invite.code}`;
        setNewLink(link);
        setShowForm(false);
        await load();
      }
    } catch { /* ignore */ }
    finally { setCreating(false); }
  }

  async function deactivate(id: string) {
    await fetch(`/api/admin/invites?id=${id}`, { method: 'DELETE' });
    await load();
  }

  function copyLink(code: string, id: string) {
    navigator.clipboard.writeText(`${baseUrl}/register?invite=${code}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      <SharedHeader />
      <main className="lg:ml-64 p-4 lg:p-6 pt-20 lg:pt-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Key className="w-6 h-6 text-[#f0b90b]" /> Einladungen
              </h1>
              <p className="text-gray-400 text-sm mt-1">Invite-Links erstellen und verwalten</p>
            </div>
          </div>
          <button
            onClick={() => { setShowForm(v => !v); setNewLink(null); }}
            className="flex items-center gap-2 bg-[#f0b90b] hover:bg-[#d4a017] text-black font-semibold px-4 py-2 rounded-lg text-sm transition-all"
          >
            <Plus className="w-4 h-4" /> Neuen Link erstellen
          </button>
        </div>

        {/* Create form */}
        {showForm && (
          <div className="glass-card rounded-xl p-5 mb-5 border border-[#f0b90b]/20">
            <h3 className="text-white font-semibold mb-4">Neuen Einladungslink erstellen</h3>
            <div className="flex items-end gap-4">
              <div>
                <label className="text-gray-400 text-xs block mb-1">Max. Verwendungen</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={maxUses}
                  onChange={e => setMaxUses(Number(e.target.value))}
                  className="bg-[#1a1f37] border border-[#2a2f47] text-white rounded-lg px-3 py-2 w-28 focus:outline-none focus:border-[#f0b90b]"
                />
              </div>
              <button
                onClick={createInvite}
                disabled={creating}
                className="flex items-center gap-2 bg-[#f0b90b] hover:bg-[#d4a017] disabled:bg-gray-600 text-black font-semibold px-5 py-2 rounded-lg text-sm transition-all"
              >
                {creating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Erstellen
              </button>
            </div>
          </div>
        )}

        {/* Newly created link */}
        {newLink && (
          <div className="glass-card rounded-xl p-4 mb-5 border border-green-500/30 bg-green-500/5">
            <p className="text-green-400 text-sm font-semibold mb-2">✓ Einladungslink erstellt – jetzt kopieren:</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-[#0a0e1a] text-[#f0b90b] px-3 py-2 rounded-lg text-sm font-mono overflow-x-auto">
                {newLink}
              </code>
              <button
                onClick={() => { navigator.clipboard.writeText(newLink); }}
                className="p-2 bg-[#f0b90b]/10 hover:bg-[#f0b90b]/20 text-[#f0b90b] rounded-lg transition-all flex-shrink-0"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="glass-card rounded-xl border border-[#1a1f37] overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Lade...</div>
          ) : invites.length === 0 ? (
            <div className="p-8 text-center text-gray-400">Noch keine Invite-Codes erstellt</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-[#1a1f37] text-gray-400">
                <tr>
                  {['Code', 'Link kopieren', 'Verwendet', 'Max.', 'Aktiv', 'Erstellt', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a1f37]">
                {invites.map((inv: any) => (
                  <tr key={inv.id} className="hover:bg-[#1a1f37]/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-[#f0b90b] text-xs">{inv.code}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => copyLink(inv.code, inv.id)}
                        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#f0b90b] transition-colors"
                      >
                        {copiedId === inv.id
                          ? <><Check className="w-3.5 h-3.5 text-green-400" /><span className="text-green-400">Kopiert!</span></>
                          : <><Copy className="w-3.5 h-3.5" />Link kopieren</>
                        }
                      </button>
                    </td>
                    <td className="px-4 py-3 text-gray-300">{inv.usedCount}</td>
                    <td className="px-4 py-3 text-gray-300">{inv.maxUses}</td>
                    <td className="px-4 py-3">
                      {inv.isActive
                        ? <span className="text-green-400 text-xs font-medium">Aktiv</span>
                        : <span className="text-red-400 text-xs font-medium">Inaktiv</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(inv.createdAt).toLocaleDateString('de-DE')}
                    </td>
                    <td className="px-4 py-3">
                      {inv.isActive && (
                        <button
                          onClick={() => deactivate(inv.id)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                          title="Deaktivieren"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
