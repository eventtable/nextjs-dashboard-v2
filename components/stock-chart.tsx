'use client';

import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart, ReferenceLine } from 'recharts';
import { BarChart2 } from 'lucide-react';
import type { StockData } from '@/lib/types';

interface StockChartProps {
  data: StockData;
  range: '1y' | '5y';
  onRangeChange: (range: '1y' | '5y') => void;
}

export default function StockChart({ data, range, onRangeChange }: StockChartProps) {
  const chartData = (data?.chartData ?? []).map((p: any) => ({
    date: p?.date ?? '',
    close: p?.close ?? 0,
    label: (() => {
      const d = p?.date ?? '';
      if (!d) return '';
      const parts = d.split('-');
      return `${parts?.[2] ?? ''}.${parts?.[1] ?? ''}.${parts?.[0]?.slice?.(2) ?? ''}`;
    })(),
  }));

  const minPrice = Math.min(...(chartData?.map?.((d: any) => d?.close ?? 0) ?? [0]));
  const maxPrice = Math.max(...(chartData?.map?.((d: any) => d?.close ?? 0) ?? [0]));
  const padding = (maxPrice - minPrice) * 0.05;

  const isPositive = chartData.length >= 2 ? (chartData[chartData.length - 1]?.close ?? 0) >= (chartData[0]?.close ?? 0) : true;
  const lineColor = isPositive ? '#22c55e' : '#ef4444';

  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-[#f0b90b]" />
          Kursverlauf {data?.ticker ?? ''}
        </h3>
        <div className="flex gap-2">
          {(['1y', '5y'] as const).map((r: '1y' | '5y') => (
            <button
              key={r}
              onClick={() => onRangeChange(r)}
              className={`px-3 py-1 text-xs rounded-lg transition-all ${
                range === r
                  ? 'bg-[#f0b90b] text-black font-semibold'
                  : 'bg-[#1a1f37] text-gray-400 hover:text-white'
              }`}
            >
              {r === '1y' ? '1 Jahr' : '5 Jahre'}
            </button>
          ))}
        </div>
      </div>
      <div className="w-full" style={{ height: 350 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 25 }}>
            <defs>
              <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={lineColor} stopOpacity={0.3} />
                <stop offset="95%" stopColor={lineColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="label"
              tickLine={false}
              tick={{ fontSize: 10, fill: '#6b7280' }}
              interval="preserveStartEnd"
              angle={-45}
              textAnchor="end"
              height={50}
            />
            <YAxis
              domain={[minPrice - padding, maxPrice + padding]}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#6b7280' }}
              tickFormatter={(v: number) => v?.toFixed?.(0) ?? ''}
              width={60}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#0f1629', border: '1px solid #1a1f37', borderRadius: 8, fontSize: 11 }}
              labelStyle={{ color: '#9ca3af' }}
              itemStyle={{ color: lineColor }}
            />
            {data?.ma50 && (
              <ReferenceLine y={data.ma50} stroke="#60B5FF" strokeDasharray="5 5" strokeWidth={1} />
            )}
            {data?.ma200 && (
              <ReferenceLine y={data.ma200} stroke="#FF9149" strokeDasharray="5 5" strokeWidth={1} />
            )}
            <Area
              type="monotone"
              dataKey="close"
              stroke={lineColor}
              strokeWidth={2}
              fill="url(#colorClose)"
              dot={false}
              animationDuration={1000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="flex gap-4 mt-2 text-[10px] text-gray-500 justify-center">
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[#60B5FF] inline-block"></span> MA50</span>
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[#FF9149] inline-block"></span> MA200</span>
      </div>
    </div>
  );
}