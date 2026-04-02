'use client';

import { AlertCircle, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import type { StockData } from '@/lib/types';
import { berechneAmpel } from '@/lib/stock-utils';
import { getFundamentalData, hasFundamentalData, getKennzahlBewertung, berechneTabBewertung, berechneGesamtBewertung } from '@/data/fundamentalData';

// Map the fundamental Gesamtbewertung to an Ampel result
function fundamentalToAmpel(ticker: string) {
  if (!hasFundamentalData(ticker)) return null;
  try {
    const fd = getFundamentalData(ticker);

    const bew  = berechneTabBewertung([
      getKennzahlBewertung('pegRatio',    fd.bewertung.pegRatio,    'bewertung'),
      getKennzahlBewertung('evEbitda',    fd.bewertung.evEbitda,    'bewertung'),
      getKennzahlBewertung('priceToBook', fd.bewertung.priceToBook, 'bewertung'),
      getKennzahlBewertung('priceToSales',fd.bewertung.priceToSales,'bewertung'),
      getKennzahlBewertung('evToSales',   fd.bewertung.evToSales,   'bewertung'),
      getKennzahlBewertung('epsTrailing', fd.bewertung.epsTrailing, 'bewertung'),
      getKennzahlBewertung('epsForward',  fd.bewertung.epsForward,  'bewertung'),
    ]);
    const prof = berechneTabBewertung([
      getKennzahlBewertung('ebitdaMargin',   fd.profitabilitaet.ebitdaMargin,   'profitabilitaet'),
      getKennzahlBewertung('grossMargin',    fd.profitabilitaet.grossMargin,    'profitabilitaet'),
      getKennzahlBewertung('operatingMargin',fd.profitabilitaet.operatingMargin,'profitabilitaet'),
      getKennzahlBewertung('earningsGrowth', fd.profitabilitaet.earningsGrowth, 'profitabilitaet'),
    ]);
    const bil  = berechneTabBewertung([
      getKennzahlBewertung('currentRatio', fd.bilanz.currentRatio, 'bilanz'),
      getKennzahlBewertung('quickRatio',   fd.bilanz.quickRatio,   'bilanz'),
      getKennzahlBewertung('netCash',      fd.bilanz.netCash,      'bilanz'),
      getKennzahlBewertung('shortRatio',   fd.bilanz.shortRatio,   'bilanz'),
      getKennzahlBewertung('perf52W',      fd.bilanz.perf52W,      'bilanz'),
    ]);
    const gesamt = berechneGesamtBewertung(bew, prof, bil);

    if (gesamt.empfehlung === 'STARK') {
      return { status: 'gruen' as const,  label: 'Kaufen',    beschreibung: 'Starke Fundamentaldaten – gutes Chance-Risiko-Verhältnis', score: 90, color: '#22c55e', emoji: '🟢' };
    } else if (gesamt.empfehlung === 'SOLIDE') {
      return { status: 'gelb' as const,   label: 'Beobachten', beschreibung: 'Solide Basis, aber einige Kriterien noch nicht erfüllt', score: 60, color: '#eab308', emoji: '🟡' };
    } else {
      return { status: 'rot' as const,    label: 'Meiden',    beschreibung: 'Schwache Fundamentaldaten – hohe Risikoposition', score: 25, color: '#ef4444', emoji: '🔴' };
    }
  } catch { return null; }
}

export default function MatrixAmpel({ data }: { data: StockData }) {
  // Prefer fundamental-data-based rating for consistency with Fundamental tab
  const ticker = data?.ticker ?? '';
  const tickerBase = ticker.replace(/\.(DE|PA|CO|L|AS|MI|MC|SW)$/i, '');
  const ampel = fundamentalToAmpel(ticker) ?? fundamentalToAmpel(tickerBase) ?? berechneAmpel({
    kgv: data?.kgv ?? null,
    rsi: data?.rsi ?? 50,
    fcfPositiv: (data?.freeCashflow ?? 0) > 0,
    dividendenRendite: data?.dividendenRendite ?? 0,
    umsatzWachstum: data?.revenueGrowth ?? null,
    verschuldungsgrad: data?.verschuldungsgrad ?? null,
  });

  const iconMap: Record<string, any> = {
    gruen: CheckCircle,
    gelb: AlertCircle,
    orange: AlertTriangle,
    rot: XCircle,
  };
  const Icon = iconMap[ampel?.status ?? 'gelb'] ?? AlertCircle;

  const bgMap: Record<string, string> = {
    gruen: 'from-green-500/10 to-green-500/5 border-green-500/30',
    gelb: 'from-yellow-500/10 to-yellow-500/5 border-yellow-500/30',
    orange: 'from-orange-500/10 to-orange-500/5 border-orange-500/30',
    rot: 'from-red-500/10 to-red-500/5 border-red-500/30',
  };

  return (
    <div className={`glass-card rounded-xl p-6 bg-gradient-to-r ${bgMap[ampel?.status ?? 'gelb'] ?? bgMap.gelb} border`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-5xl">{ampel?.emoji ?? '🟡'}</div>
          <div>
            <h3 className="text-lg font-bold text-white">Matrix-Ampel: {ampel?.label ?? ''}</h3>
            <p className="text-sm text-gray-400 mt-1">{ampel?.beschreibung ?? ''}</p>
          </div>
        </div>
        <Icon className="w-10 h-10" style={{ color: ampel?.color ?? '#eab308' }} />
      </div>
    </div>
  );
}
