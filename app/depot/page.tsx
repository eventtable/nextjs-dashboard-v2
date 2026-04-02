import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import SharedHeader from '@/components/shared-header';
import DepotOverview from '@/components/depot-overview';
import PositionManager from '@/components/position-manager';

export default async function DepotPage() {
  const session = await getServerSession(authOptions);
  const isAdmin = (session?.user as any)?.isAdmin === true;

  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      <SharedHeader />
      <main className="pt-24 pb-12 px-4 sm:px-6 max-w-7xl mx-auto">
        {isAdmin ? (
          // Admin sieht das volle Depot-Dashboard
          <DepotOverview />
        ) : (
          // Normale User: eigene Positionen verwalten + Übersicht
          <div className="space-y-6">
            <div className="mb-2">
              <h1 className="text-2xl font-bold text-white">Mein Depot</h1>
              <p className="text-gray-400 text-sm mt-1">Verwalte deine eigenen Positionen · Live-Kurse via Yahoo Finance</p>
            </div>

            {/* Position Manager — Hinzufügen/Bearbeiten */}
            <div className="bg-[#0d1220] border border-[#1a1f37] rounded-xl p-5">
              <PositionManager />
            </div>

            {/* Depot-Übersicht mit eigenen Daten */}
            <DepotOverview />
          </div>
        )}
      </main>
    </div>
  );
}
