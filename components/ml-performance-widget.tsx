'use client';

import { useState, useEffect } from 'react';
import { Activity, TrendingUp, TrendingDown, Brain } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

interface MLPerformanceData {
  summary: {
    win_rate: number;
    total_predictions: number;
    correct_predictions: number;
    wrong_predictions: number;
    score_grade: string;
  };
}

export default function MLPerformanceWidget() {
  const [data, setData] = useState<MLPerformanceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/ml-predictions')
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <Card className="bg-[#1a1f37] border-[#2a2f47]">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-400" />
            ML Agent
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-gray-400">Lade Daten...</div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.summary.total_predictions === 0) {
    return (
      <Link href="/ai-trading/ml-performance">
        <Card className="bg-[#1a1f37] border-[#2a2f47] hover:border-purple-500/50 transition-colors cursor-pointer">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-400" />
              ML Agent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-2">
              <div className="text-3xl mb-2">📚</div>
              <div className="text-sm font-bold text-yellow-400">In Training</div>
              <div className="text-xs text-gray-400 mt-1">Sammelt Daten...</div>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  const { summary } = data;
  const isReady = summary.total_predictions >= 10 && summary.win_rate > 50;

  return (
    <Link href="/ai-trading/ml-performance">
      <Card className={`${isReady ? 'bg-gradient-to-br from-emerald-500/10 to-purple-500/10 border-emerald-500/30' : 'bg-[#1a1f37] border-[#2a2f47]'} hover:border-purple-500/50 transition-colors cursor-pointer`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-400" />
            ML Agent
            {isReady && <span className="ml-2 text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">AKTIV</span>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{summary.win_rate}%</div>
              <div className="text-xs text-gray-400">Win Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{summary.total_predictions}</div>
              <div className="text-xs text-gray-400">Vorhersagen</div>
            </div>
          </div>
          
          <div className="mt-3 flex justify-center gap-4 text-sm">
            <div className="flex items-center gap-1 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
              {summary.correct_predictions}
            </div>
            <div className="flex items-center gap-1 text-red-400">
              <TrendingDown className="w-4 h-4" />
              {summary.wrong_predictions}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
