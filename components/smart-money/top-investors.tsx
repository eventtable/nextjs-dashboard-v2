'use client';

import { useEffect, useState } from 'react';
import { Building2 } from 'lucide-react';

interface InstitutionalHolder {
  name: string;
  pctHeld: number | null;
  shares: number | null;
  value: number | null;
  reportDate: string | null;
}

interface MajorHolders {
  insidersPercent: number | null;
  institutionsPercent: number | null;
}

interface HoldersData {
  institutionalHolders: InstitutionalHolder[];
  majorHolders: MajorHolders | null;
}

export function TopInvestors({ ticker }: { ticker: string }) {
  const [data, setData] = useState<HoldersData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ticker) return;
    setLoading(true);
    setData(null);
    fetch(`/api/smart-money/holders?ticker=${encodeURIComponent(ticker)}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [ticker]);

  const fmt = (n: number | null) =>
    n == null ? '—' : n >= 1e9 ? `$${(n / 1e9).toFixed(1)} Mrd` : n >= 1e6 ? `$${(n / 1e6).toFixed(0)} Mio` : `$${n.toLocaleString('de-DE')}`;

  const fmtShares = (n: number | null) =>
    n == null ? '—' : n >= 1e6 ? `${(n / 1e6).toFixed(1)} Mio` : n.toLocaleString('de-DE');

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-14 bg-[#1a1f37] rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  const holders = data?.institutionalHolders ?? [];
  const major = data?.majorHolders;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Building2 className="w-5 h-5 text-[#f0b90b]" />
        <h3 className="font-semibold">Institutionelle Investoren — {ticker}</h3>
      </div>

      {major && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#1a1f37] rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-[#f0b90b]">{major.institutionsPercent?.toFixed(1) ?? '—'}%</div>
            <div className="text-xs text-gray-400 mt-1">Institutionen</div>
          </div>
          <div className="bg-[#1a1f37] rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-400">{major.insidersPercent?.toFixed(2) ?? '—'}%</div>
            <div className="text-xs text-gray-400 mt-1">Insider</div>
          </div>
        </div>
      )}

      {holders.length === 0 ? (
        <div className="text-gray-400 text-sm p-4 bg-[#1a1f37] rounded-lg">
          Keine institutionellen Daten für {ticker} gefunden.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 text-xs border-b border-[#1a1f37]">
                <th className="text-left py-2 pr-3">Institution</th>
                <th className="text-right py-2 px-2">% Anteil</th>
                <th className="text-right py-2 px-2">Aktien</th>
                <th className="text-right py-2 px-2">Wert</th>
                <th className="text-right py-2 pl-2">Datum</th>
              </tr>
            </thead>
            <tbody>
              {holders.slice(0, 10).map((h, i) => (
                <tr key={i} className="border-b border-[#1a1f37]/50 hover:bg-[#1a1f37]/30">
                  <td className="py-2.5 pr-3 font-medium text-white">{h.name}</td>
                  <td className="text-right py-2.5 px-2 text-[#f0b90b] font-medium">{h.pctHeld?.toFixed(2) ?? '—'}%</td>
                  <td className="text-right py-2.5 px-2 text-gray-300">{fmtShares(h.shares)}</td>
                  <td className="text-right py-2.5 px-2 text-gray-300">{fmt(h.value)}</td>
                  <td className="text-right py-2.5 pl-2 text-gray-500 text-xs">{h.reportDate ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-gray-500">Quelle: Yahoo Finance · 13F Einreichungen bei der SEC</p>
    </div>
  );
}
