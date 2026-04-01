import SharedHeader from '@/components/shared-header';
import MLPerformanceWidget from '@/components/ml-performance-widget';

export default function MLPerformancePage() {
  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      <SharedHeader />
      <main className="lg:ml-64 p-4 lg:p-6 pt-20 lg:pt-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">ML-Modell Performance</h1>
          <p className="text-gray-400 text-sm mt-1">Detaillierte Auswertung des Machine Learning Agenten</p>
        </div>
        <MLPerformanceWidget />
      </main>
    </div>
  );
}
