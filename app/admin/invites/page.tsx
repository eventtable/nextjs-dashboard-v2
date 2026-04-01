'use client';

import { useEffect, useState } from 'react';
import SharedHeader from '@/components/shared-header';
import { Key, ArrowLeft, Plus, Copy } from 'lucide-react';
import Link from 'next/link';

export default function AdminInvitesPage() {
  const [invites, setInvites] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/admin/invites').then(r => r.json()).then(d => setInvites(d.invites ?? [])).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      <SharedHeader />
      <main className="lg:ml-64 p-4 lg:p-6 pt-20 lg:pt-6">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/admin" className="text-gray-400 hover:text-white transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Key className="w-6 h-6 text-[#f0b90b]" /> Einladungen</h1>
            <p className="text-gray-400 text-sm mt-1">Invite-Codes verwalten</p>
          </div>
        </div>
        <div className="glass-card rounded-xl border border-[#1a1f37] overflow-hidden">
          {invites.length === 0 ? (
            <div className="p-8 text-center text-gray-400">Keine Invite-Codes vorhanden</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-[#1a1f37] text-gray-400">
                <tr>{['Code', 'Verwendet', 'Max.', 'Aktiv'].map(h => <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-[#1a1f37]">
                {invites.map((inv: any) => (
                  <tr key={inv.id} className="hover:bg-[#1a1f37]/50">
                    <td className="px-4 py-3 font-mono text-[#f0b90b]">{inv.code}</td>
                    <td className="px-4 py-3 text-gray-300">{inv.usedCount}</td>
                    <td className="px-4 py-3 text-gray-300">{inv.maxUses}</td>
                    <td className="px-4 py-3">{inv.isActive ? <span className="text-green-400">✓</span> : <span className="text-red-400">✗</span>}</td>
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
