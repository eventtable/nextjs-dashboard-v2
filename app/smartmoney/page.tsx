import SharedHeader from '@/components/shared-header';
import { SmartMoneyDashboard } from '@/components/smart-money';

export default function SmartMoneyPage() {
  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      <SharedHeader />
      <main className="lg:ml-64 p-4 lg:p-6 pt-20 lg:pt-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Smart Money</h1>
          <p className="text-gray-400 text-sm mt-1">Institutionelle Investoren · Insider · Dark Pool</p>
        </div>
        <SmartMoneyDashboard />
      </main>
    </div>
  );
}
