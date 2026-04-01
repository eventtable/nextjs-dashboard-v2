'use client';

import { useEffect, useState } from 'react';
import SharedHeader from '@/components/shared-header';
import { UserPlus, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminFriendsPage() {
  const [friends, setFriends] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/admin/friends').then(r => r.json()).then(d => setFriends(d.friends ?? [])).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      <SharedHeader />
      <main className="lg:ml-64 p-4 lg:p-6 pt-20 lg:pt-6">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/admin" className="text-gray-400 hover:text-white transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2"><UserPlus className="w-6 h-6 text-green-400" /> Freunde</h1>
            <p className="text-gray-400 text-sm mt-1">Freund-Accounts und Berechtigungen</p>
          </div>
        </div>
        <div className="glass-card rounded-xl p-6 border border-[#1a1f37]">
          {friends.length === 0 ? (
            <p className="text-gray-400 text-center py-4">Keine Freunde konfiguriert</p>
          ) : (
            <div className="space-y-3">
              {friends.map((f: any, i: number) => (
                <div key={i} className="flex items-center justify-between bg-[#1a1f37] rounded-lg p-3">
                  <div>
                    <div className="text-white font-medium">{f.name || f.email}</div>
                    <div className="text-gray-400 text-sm">{f.email}</div>
                  </div>
                  <div className="flex gap-2 text-xs">
                    {f.permissions?.canViewDepot && <span className="bg-green-500/10 text-green-400 px-2 py-0.5 rounded border border-green-500/30">Depot</span>}
                    {f.permissions?.canViewML && <span className="bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/30">ML</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
