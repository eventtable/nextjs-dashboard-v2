'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import MatrixDashboard from '@/components/matrix-dashboard';

function MatrixContent() {
  const searchParams = useSearchParams();
  const ticker = searchParams.get('ticker') ?? '';
  return <MatrixDashboard initialTicker={ticker} />;
}

export default function MatrixPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0e1a]" />}>
      <MatrixContent />
    </Suspense>
  );
}
