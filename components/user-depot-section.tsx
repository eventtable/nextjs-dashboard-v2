'use client';

import { useState } from 'react';
import PositionManager from './position-manager';
import DepotOverview from './depot-overview';

export default function UserDepotSection() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-6">
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-white">Mein Depot</h1>
        <p className="text-gray-400 text-sm mt-1">Verwalte deine eigenen Positionen · Live-Kurse via Yahoo Finance</p>
      </div>

      <div className="bg-[#0d1220] border border-[#1a1f37] rounded-xl p-5">
        <PositionManager onSaved={() => setRefreshKey(k => k + 1)} />
      </div>

      <DepotOverview key={refreshKey} />
    </div>
  );
}
