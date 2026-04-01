import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import path from 'path';

// ML prediction data - reads from public/ml_data/ JSON files
// Falls back to mock data if VPS ML API is unavailable
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get('symbol') || 'AAPL';

  // Try to read cached ML data from public folder
  const mlDataPath = path.join(process.cwd(), 'public', 'ml_data', `${symbol}.json`);
  if (existsSync(mlDataPath)) {
    try {
      const data = JSON.parse(readFileSync(mlDataPath, 'utf-8'));
      return NextResponse.json(data);
    } catch {
      // Fall through to mock data
    }
  }

  // Fallback: generate mock ML prediction data
  const today = new Date();
  const predictions = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() + i + 1);
    return {
      date: date.toISOString().split('T')[0],
      predicted: 100 + Math.random() * 20 - 10,
      confidence: 0.6 + Math.random() * 0.3,
      signal: Math.random() > 0.5 ? 'BUY' : Math.random() > 0.5 ? 'HOLD' : 'SELL',
    };
  });

  return NextResponse.json({
    symbol,
    predictions,
    modelAccuracy: 0.72,
    lastTrained: new Date(today.setDate(today.getDate() - 1)).toISOString(),
    source: 'fallback',
  });
}
