'use client';

import { Activity } from 'lucide-react';

export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="relative">
        <div className="w-16 h-16 border-2 border-[#1a1f37] rounded-full animate-spin border-t-[#f0b90b]"></div>
        <Activity className="w-6 h-6 text-[#f0b90b] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      </div>
      <p className="text-gray-400 mt-4 text-sm">Marktdaten werden geladen...</p>
    </div>
  );
}