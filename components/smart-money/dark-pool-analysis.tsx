'use client';

import { Activity } from 'lucide-react';

export function DarkPoolAnalysis({ ticker }: { ticker?: string }) {
  return (
    <div className="glass-card rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-[#f0b90b]" />
        <h3 className="text-lg font-semibold text-white">Dark Pool Analyse</h3>
      </div>
      <p className="text-gray-400 text-sm">
        Dark Pool Daten für {ticker ?? 'diese Aktie'} werden geladen...
      </p>
    </div>
  );
}
