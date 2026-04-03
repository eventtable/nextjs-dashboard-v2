import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import SharedHeader from '@/components/shared-header';
import DepotOverview from '@/components/depot-overview';
import UserDepotSection from '@/components/user-depot-section';

export default async function DepotPage() {
  const session = await getServerSession(authOptions);
  const isAdmin = (session?.user as any)?.isAdmin === true;

  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      <SharedHeader />
      <main className="pt-24 pb-12 px-4 sm:px-6 max-w-7xl mx-auto">
        {isAdmin ? (
          <DepotOverview />
        ) : (
          <UserDepotSection />
        )}
      </main>
    </div>
  );
}
