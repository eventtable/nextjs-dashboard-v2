'use client';

import { useEffect, useState } from 'react';
import { Users, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';

interface InsiderTx {
  name: string;
  relation: string;
  type: string;
  shares: number | null;
  value: number | null;
  date: string | null;
}

export function InsiderTransactions({ ticker }: { ticker: string }) {
  const [transactions, setTransactions] = useState<InsiderTx[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ticker) return;
    setLoading(true);
    setTransactions([]);
    fetch(`/api/smart-money/holders?ticker=${encodeURIComponent(ticker)}`)
      .then(r => r.json())
      .then(d => { setTransactions(d.insiderTransactions ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [ticker]);

  const isBuy = (type: string) => /buy|purchase|kauf/i.test(type);
  const isSell = (type: string) => /sell|sale|verkauf/i.test(type);

  const fmt = (n: number | null) =>
    n == null ? '—' : n >= 1e6 ? `$${(n / 1e6).toFixed(1)} Mio` : `$${n.toLocaleString('de-DE')}`;

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-[#1a1f37] rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  const buys = transactions.filter(t => isBuy(t.type));
  const sells = transactions.filter(t => isSell(t.type));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Users className="w-5 h-5 text-[#f0b90b]" />
        <h3 className="font-semibold">Insider-Transaktionen — {ticker}</h3>
      </div>

      {transactions.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-emerald-400">{buys.length}</div>
            <div className="text-xs text-gray-400 mt-1">Käufe</div>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-red-400">{sells.length}</div>
            <div className="text-xs text-gray-400 mt-1">Verkäufe</div>
          </div>
        </div>
      )}

      {transactions.length === 0 ? (
        <div className="text-gray-400 text-sm p-4 bg-[#1a1f37] rounded-lg">
          Keine Insider-Transaktionen für {ticker} gefunden.
        </div>
      ) : (
        <div className="space-y-2">
          {transactions.slice(0, 15).map((tx, i) => {
            const buy = isBuy(tx.type);
            const sell = isSell(tx.type);
            return (
              <div
                key={i}
                className={`rounded-lg px-4 py-3 border flex items-center justify-between gap-4 ${
                  buy ? 'bg-emerald-500/5 border-emerald-500/20' :
                  sell ? 'bg-red-500/5 border-red-500/20' :
                  'bg-[#1a1f37] border-[#252a3d]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                    buy ? 'bg-emerald-500/20' : sell ? 'bg-red-500/20' : 'bg-gray-500/20'
                  }`}>
                    {buy ? <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> :
                     sell ? <TrendingDown className="w-3.5 h-3.5 text-red-400" /> :
                     <ArrowRight className="w-3.5 h-3.5 text-gray-400" />}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-white truncate">{tx.name}</div>
                    <div className="text-xs text-gray-500">{tx.relation}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0 text-right text-sm">
                  <div>
                    <div className={`font-semibold ${buy ? 'text-emerald-400' : sell ? 'text-red-400' : 'text-gray-400'}`}>
                      {tx.type}
                    </div>
                    <div className="text-xs text-gray-500">{tx.shares?.toLocaleString('de-DE') ?? '—'} Aktien</div>
                  </div>
                  <div>
                    <div className="text-gray-300">{fmt(tx.value)}</div>
                    <div className="text-xs text-gray-500">{tx.date ?? '—'}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <p className="text-xs text-gray-500">Quelle: Yahoo Finance · SEC Form 4 Einreichungen</p>
    </div>
  );
}
