'use client';

import { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';

interface InstitutionalHolder {
  name: string;
  pctHeld: number | null;
  shares: number | null;
  value: number | null;
  reportDate: string | null;
}

export function Form13FTable({ ticker }: { ticker: string }) {
  const [holders, setHolders] = useState<InstitutionalHolder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ticker) return;
    setLoading(true);
    setHolders([]);
    fetch(`/api/smart-money/holders?ticker=${encodeURIComponent(ticker)}`)
      .then(r => r.json())
      .then(d => { setHolders(d.institutionalHolders ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [ticker]);

  const fmt = (n: number | null) =>
    n == null ? '—' : n >= 1e9 ? `$${(n / 1e9).toFixed(2)} Mrd` : n >= 1e6 ? `$${(n / 1e6).toFixed(1)} Mio` : `$${n.toLocaleString('de-DE')}`;

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-12 bg-[#1a1f37] rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#f0b90b]" />
          <h3 className="font-semibold">13F Filings — {ticker}</h3>
        </div>
        {holders.length > 0 && (
          <span className="text-xs text-gray-500 bg-[#1a1f37] px-2 py-1 rounded">
            {holders.length} Institutionen
          </span>
        )}
      </div>

      {holders.length === 0 ? (
        <div className="text-gray-400 text-sm p-4 bg-[#1a1f37] rounded-lg">
          Keine 13F-Daten für {ticker} gefunden.
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {holders.slice(0, 15).map((h, i) => (
              <div key={i} className="bg-[#1a1f37] rounded-lg px-4 py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs text-gray-500 w-5 shrink-0">{i + 1}</span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-white truncate">{h.name}</div>
                    {h.reportDate && <div className="text-xs text-gray-500">{h.reportDate}</div>}
                  </div>
                </div>
                <div className="flex items-center gap-6 shrink-0 text-right text-sm">
                  <div>
                    <div className="text-[#f0b90b] font-semibold">{h.pctHeld?.toFixed(2) ?? '—'}%</div>
                    <div className="text-xs text-gray-500">Anteil</div>
                  </div>
                  <div>
                    <div className="text-gray-300">{fmt(h.value)}</div>
                    <div className="text-xs text-gray-500">Wert</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500">Quelle: Yahoo Finance · Basierend auf 13F Einreichungen bei der SEC</p>
        </>
      )}
    </div>
  );
}
