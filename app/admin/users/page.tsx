'use client';

import { useEffect, useState } from 'react';
import SharedHeader from '@/components/shared-header';
import { Users, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/users').then(r => r.json()).then(d => { setUsers(d.users ?? []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      <SharedHeader />
      <main className="lg:ml-64 p-4 lg:p-6 pt-20 lg:pt-6">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/admin" className="text-gray-400 hover:text-white transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Users className="w-6 h-6 text-blue-400" /> Benutzer</h1>
            <p className="text-gray-400 text-sm mt-1">Alle registrierten Konten</p>
          </div>
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
                  {['E-Mail', 'Name', 'Admin', 'Aktiv', 'Erstellt'].map(h => <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a1f37]">
                {users.map((u: any) => (
                  <tr key={u.id} className="hover:bg-[#1a1f37]/50 transition-colors">
                    <td className="px-4 py-3 text-white">{u.email}</td>
                    <td className="px-4 py-3 text-gray-300">{u.name || '—'}</td>
                    <td className="px-4 py-3">{u.isAdmin ? <span className="text-[#f0b90b] text-xs font-bold">ADMIN</span> : <span className="text-gray-500">—</span>}</td>
                    <td className="px-4 py-3">{u.isActive ? <span className="text-green-400">✓</span> : <span className="text-red-400">✗</span>}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{u.createdAt ? new Date(u.createdAt).toLocaleDateString('de-DE') : '—'}</td>
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
