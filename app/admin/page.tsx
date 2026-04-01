import SharedHeader from '@/components/shared-header';
import { Users, UserPlus, Key, Activity } from 'lucide-react';
import Link from 'next/link';

export default function AdminPage() {
  const cards = [
    { href: '/admin/users', icon: Users, label: 'Benutzer', desc: 'Alle registrierten Konten verwalten', color: 'text-blue-400' },
    { href: '/admin/friends', icon: UserPlus, label: 'Freunde', desc: 'Freund-Accounts und Berechtigungen', color: 'text-green-400' },
    { href: '/admin/invites', icon: Key, label: 'Einladungen', desc: 'Invite-Codes erstellen und verwalten', color: 'text-[#f0b90b]' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      <SharedHeader />
      <main className="lg:ml-64 p-4 lg:p-6 pt-20 lg:pt-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="w-7 h-7 text-[#f0b90b]" />
            Admin Panel
          </h1>
          <p className="text-gray-400 text-sm mt-1">Benutzer- und Systemverwaltung</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {cards.map((card) => (
            <Link key={card.href} href={card.href}>
              <div className="glass-card rounded-xl p-6 border border-[#1a1f37] hover:border-[#2a2f47] transition-all cursor-pointer group">
                <card.icon className={`w-8 h-8 ${card.color} mb-3 group-hover:scale-110 transition-transform`} />
                <h3 className="text-white font-semibold mb-1">{card.label}</h3>
                <p className="text-gray-400 text-sm">{card.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
