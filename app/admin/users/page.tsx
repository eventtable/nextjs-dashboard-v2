'use client';

import { useEffect, useState } from 'react';
import SharedHeader from '@/components/shared-header';
import { Users, ArrowLeft, ToggleLeft, ToggleRight, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function AdminUsersPage() {
  const [users, setUsers]     = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch('/api/admin/users');
      const d = await r.json();
      setUsers(d.users ?? []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function toggle(id: string, field: 'isActive' | 'isAdmin', current: boolean) {
    setToggling(id + field);
    try {
      await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, [field]: !current }),
      });
      await load();
    } catch { /* ignore */ }
    finally { setToggling(null); }
  }

  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      <SharedHeader />
      <main className="p-4 lg:p-6 pt-20">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Users className="w-6 h-6 text-blue-400" /> Benutzer
              </h1>
              <p className="text-gray-400 text-sm mt-1">Alle registrierten Konten</p>
            </div>
          </div>
          <button onClick={load} className="text-gray-400 hover:text-white p-2 transition-colors" title="Aktualisieren">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="glass-card rounded-xl border border-[#1a1f37] overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Lade Benutzer...</div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-gray-400">Keine Benutzer gefunden</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-[#1a1f37] text-gray-400">
                <tr>
                  {['E-Mail', 'Name', 'Erstellt', 'Admin', 'Aktiv'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a1f37]">
                {users.map((u: any) => (
                  <tr key={u.id} className="hover:bg-[#1a1f37]/50 transition-colors">
                    <td className="px-4 py-3 text-white">{u.email}</td>
                    <td className="px-4 py-3 text-gray-300">{u.name || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString('de-DE') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggle(u.id, 'isAdmin', u.isAdmin)}
                        disabled={toggling === u.id + 'isAdmin'}
                        className="flex items-center gap-1.5 text-xs transition-colors disabled:opacity-50"
                        title={u.isAdmin ? 'Admin entfernen' : 'Zum Admin machen'}
                      >
                        {u.isAdmin
                          ? <ToggleRight className="w-5 h-5 text-[#f0b90b]" />
                          : <ToggleLeft className="w-5 h-5 text-gray-500" />}
                        <span className={u.isAdmin ? 'text-[#f0b90b] font-bold' : 'text-gray-500'}>
                          {u.isAdmin ? 'Admin' : '—'}
                        </span>
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggle(u.id, 'isActive', u.isActive)}
                        disabled={toggling === u.id + 'isActive'}
                        className="flex items-center gap-1.5 text-xs transition-colors disabled:opacity-50"
                        title={u.isActive ? 'Deaktivieren' : 'Aktivieren'}
                      >
                        {u.isActive
                          ? <ToggleRight className="w-5 h-5 text-green-400" />
                          : <ToggleLeft className="w-5 h-5 text-gray-500" />}
                        <span className={u.isActive ? 'text-green-400' : 'text-gray-500'}>
                          {u.isActive ? 'Aktiv' : 'Inaktiv'}
                        </span>
                      </button>
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
