'use client';

import { DollarSign, Calendar, TrendingUp, Percent, PieChart, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { StockData } from '@/lib/types';
import { formatNumber } from '@/lib/stock-utils';

export default function DividendAnalysis({ data }: { data: StockData }) {
  const hasDividend = (data?.dividendenRendite ?? 0) > 0 || (data?.forwardDividendAmount ?? 0) > 0;

  // Dividend quality score
  const getDividendScore = () => {
    let score = 0;
    const maxScore = 5;
    if ((data?.dividendenRendite ?? 0) >= 2) score++;
    if ((data?.dividendenRendite ?? 0) >= 4) score++;
    if ((data?.payoutRatio ?? 0) > 0 && (data?.payoutRatio ?? 100) < 75) score++;
    if ((data?.fiveYearAvgDividendYield ?? 0) > 0) score++;
    if ((data?.freeCashflow ?? 0) > 0) score++;
    return { score, maxScore };
  };

  const { score: divScore, maxScore } = getDividendScore();

  const getScoreColor = (s: number) => {
    if (s >= 4) return 'text-green-400';
    if (s >= 3) return 'text-yellow-400';
    if (s >= 2) return 'text-orange-400';
    return 'text-red-400';
  };

  const getScoreLabel = (s: number) => {
    if (s >= 4) return 'Exzellent';
    if (s >= 3) return 'Gut';
    if (s >= 2) return 'Ausreichend';
    return 'Schwach';
  };

  // Quarterly estimate
  const quarterlyDiv = data?.forwardDividendAmount ? data.forwardDividendAmount / 4 : null;

  if (!hasDividend) {
    return (
      <div className="glass-card rounded-xl p-6">
        <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-[#f0b90b]" />
          Dividenden-Analyse
        </h3>
        <div className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="w-12 h-12 text-gray-600 mb-3" />
          <p className="text-gray-400 text-lg font-medium">{data?.name ?? data?.ticker} zahlt keine Dividende</p>
          <p className="text-gray-500 text-sm mt-1">Dieser Titel ist ein reiner Wachstumswert ohne Aussch\u00fcttung.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dividend Quality Score */}
      <div className="glass-card rounded-xl p-6">
        <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-[#f0b90b]" />
          Dividenden-Analyse \u2013 {data?.name ?? data?.ticker}
        </h3>

        {/* Quality Score Bar */}
        <div className="mb-6 bg-[#1a1f37] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Dividenden-Qualit\u00e4t</span>
            <span className={`text-sm font-bold ${getScoreColor(divScore)}`}>
              {divScore}/{maxScore} \u2013 {getScoreLabel(divScore)}
            </span>
          </div>
          <div className="w-full bg-[#0a0e1a] rounded-full h-3">
            <div
              className="h-3 rounded-full transition-all duration-500"
              style={{
                width: `${(divScore / maxScore) * 100}%`,
                background: divScore >= 4 ? '#22c55e' : divScore >= 3 ? '#eab308' : divScore >= 2 ? '#f97316' : '#ef4444',
              }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-gray-600">Schwach</span>
            <span className="text-xs text-gray-600">Exzellent</span>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Forward Dividend Yield */}
          <div className="bg-[#1a1f37] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Percent className="w-4 h-4 text-[#f0b90b]" />
              <span className="text-xs text-gray-400">Forward-Rendite</span>
            </div>
            <p className="text-xl font-bold text-white">{formatNumber(data?.dividendenRendite ?? 0)}%</p>
            <p className="text-xs text-gray-500 mt-1">
              {(data?.dividendenRendite ?? 0) >= 4 ? '\ud83d\udfe2 Sehr attraktiv' :
                (data?.dividendenRendite ?? 0) >= 2 ? '\ud83d\udfe1 Solide' :
                (data?.dividendenRendite ?? 0) >= 1 ? '\ud83d\udfe0 Moderat' : '\ud83d\udd34 Gering'}
            </p>
          </div>

          {/* Annual Dividend Amount */}
          <div className="bg-[#1a1f37] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-[#22c55e]" />
              <span className="text-xs text-gray-400">J\u00e4hrliche Dividende</span>
            </div>
            <p className="text-xl font-bold text-white">
              {data?.forwardDividendAmount ? `${formatNumber(data.forwardDividendAmount)} ${data?.currency ?? '$'}` : 'N/A'}
            </p>
            {quarterlyDiv && (
              <p className="text-xs text-gray-500 mt-1">
                \u2248 {formatNumber(quarterlyDiv)} {data?.currency ?? '$'} / Quartal
              </p>
            )}
          </div>

          {/* Trailing Dividend */}
          <div className="bg-[#1a1f37] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-[#3b82f6]" />
              <span className="text-xs text-gray-400">Trailing-Dividende (12M)</span>
            </div>
            <p className="text-xl font-bold text-white">
              {data?.trailingDividendRate ? `${formatNumber(data.trailingDividendRate)} ${data?.currency ?? '$'}` : 'N/A'}
            </p>
            {data?.trailingDividendYield !== null && data?.trailingDividendYield !== undefined && (
              <p className="text-xs text-gray-500 mt-1">Rendite: {formatNumber(data.trailingDividendYield)}%</p>
            )}
          </div>

          {/* Payout Ratio */}
          <div className="bg-[#1a1f37] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <PieChart className="w-4 h-4 text-[#a855f7]" />
              <span className="text-xs text-gray-400">Aussch\u00fcttungsquote</span>
            </div>
            <p className="text-xl font-bold text-white">
              {data?.payoutRatio !== null && data?.payoutRatio !== undefined ? `${formatNumber(data.payoutRatio)}%` : 'N/A'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {(data?.payoutRatio ?? 0) < 50 ? '\ud83d\udfe2 Nachhaltig' :
                (data?.payoutRatio ?? 0) < 75 ? '\ud83d\udfe1 Akzeptabel' :
                (data?.payoutRatio ?? 0) > 0 ? '\ud83d\udd34 Hoch \u2013 Risiko!' : ''}
            </p>
          </div>

          {/* 5-Year Average */}
          <div className="bg-[#1a1f37] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-[#f97316]" />
              <span className="text-xs text-gray-400">5-Jahres-Durchschnitt</span>
            </div>
            <p className="text-xl font-bold text-white">
              {data?.fiveYearAvgDividendYield ? `${formatNumber(data.fiveYearAvgDividendYield)}%` : 'N/A'}
            </p>
            {data?.fiveYearAvgDividendYield && data?.dividendenRendite ? (
              <p className="text-xs mt-1">
                {data.dividendenRendite > data.fiveYearAvgDividendYield ? (
                  <span className="text-green-400">\u2191 \u00dcber Durchschnitt \u2013 Einstiegschance</span>
                ) : (
                  <span className="text-orange-400">\u2193 Unter Durchschnitt</span>
                )}
              </p>
            ) : null}
          </div>

          {/* Ex-Dividend Date */}
          <div className="bg-[#1a1f37] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-[#ec4899]" />
              <span className="text-xs text-gray-400">Ex-Dividenden-Datum</span>
            </div>
            <p className="text-xl font-bold text-white">{data?.exDividendDate ?? 'N/A'}</p>
            <p className="text-xs text-gray-500 mt-1">Stichtag f\u00fcr Dividenden-Berechtigung</p>
          </div>
        </div>
      </div>

      {/* Investment Calculation */}
      <div className="glass-card rounded-xl p-6">
        <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-[#f0b90b]" />
          Dividenden-Rechner
        </h4>
        <div className="bg-[#1a1f37] rounded-xl p-4">
          <p className="text-sm text-gray-400 mb-3">Bei einer Investition von:</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[500, 1000, 5000].map(amount => {
              const annualDiv = data?.dividendenRendite ? (amount * data.dividendenRendite / 100) : 0;
              const monthlyDiv = annualDiv / 12;
              return (
                <div key={amount} className="bg-[#0f1629] rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">Investition</p>
                  <p className="text-lg font-bold text-[#f0b90b]">{amount.toLocaleString('de-DE')} {data?.currency ?? '$'}</p>
                  <div className="border-t border-[#1a1f37] my-2" />
                  <p className="text-xs text-gray-500">J\u00e4hrlich</p>
                  <p className="text-sm font-semibold text-green-400">+{formatNumber(annualDiv)} {data?.currency ?? '$'}</p>
                  <p className="text-xs text-gray-500 mt-1">Monatlich</p>
                  <p className="text-sm font-semibold text-green-400">+{formatNumber(monthlyDiv)} {data?.currency ?? '$'}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Earnings Date */}
      {data?.earningsDate && (
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#f0b90b]" />
            <span className="text-sm text-gray-400">N\u00e4chster Earnings-Termin:</span>
            <span className="text-sm font-semibold text-white">{data.earningsDate}</span>
          </div>
        </div>
      )}

      {/* Dividend Checklist */}
      <div className="glass-card rounded-xl p-6">
        <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#f0b90b]" />
          Dividenden-Checkliste
        </h4>
        <div className="space-y-2">
          {[
            { check: (data?.dividendenRendite ?? 0) >= 2, label: 'Rendite \u2265 2%', detail: `${formatNumber(data?.dividendenRendite ?? 0)}%` },
            { check: (data?.dividendenRendite ?? 0) >= 4, label: 'Rendite \u2265 4% (Hochdividende)', detail: `${formatNumber(data?.dividendenRendite ?? 0)}%` },
            { check: (data?.payoutRatio ?? 0) > 0 && (data?.payoutRatio ?? 100) < 75, label: 'Aussch\u00fcttungsquote < 75% (nachhaltig)', detail: data?.payoutRatio ? `${formatNumber(data.payoutRatio)}%` : 'N/A' },
            { check: (data?.payoutRatio ?? 0) > 0 && (data?.payoutRatio ?? 100) < 50, label: 'Aussch\u00fcttungsquote < 50% (stark)', detail: data?.payoutRatio ? `${formatNumber(data.payoutRatio)}%` : 'N/A' },
            { check: (data?.freeCashflow ?? 0) > 0, label: 'Positiver Free Cash Flow', detail: (data?.freeCashflow ?? 0) > 0 ? 'Ja' : 'Nein' },
            { check: data?.fiveYearAvgDividendYield != null && data?.dividendenRendite >= (data?.fiveYearAvgDividendYield ?? 0), label: 'Rendite \u00fcber 5-Jahres-Schnitt', detail: data?.fiveYearAvgDividendYield ? `Schnitt: ${formatNumber(data.fiveYearAvgDividendYield)}%` : 'N/A' },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-[#1a1f37] last:border-0">
              <div className="flex items-center gap-2">
                <span className={`text-sm ${item.check ? 'text-green-400' : 'text-gray-600'}`}>{item.check ? '\u2611' : '\u2610'}</span>
                <span className={`text-sm ${item.check ? 'text-white' : 'text-gray-500'}`}>{item.label}</span>
              </div>
              <span className="text-xs text-gray-400">{item.detail}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}