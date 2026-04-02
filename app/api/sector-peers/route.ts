import { NextRequest, NextResponse } from 'next/server';
import { PEERS as peers } from '@/data/peers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get('symbol') || '';

  // Find peers for the given symbol
  const sectorData = Object.values(peers).find((group: any) =>
    group.members?.some((m: any) => m.ticker === symbol)
  );

  if (sectorData) {
    return NextResponse.json(sectorData);
  }

  // Try Yahoo Finance for sector peers
  try {
    const url = `https://query1.finance.yahoo.com/v1/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=summaryProfile`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
    });

    if (!res.ok) throw new Error('Yahoo error');

    const data = await res.json();
    const profile = data?.quoteSummary?.result?.[0]?.summaryProfile;

    return NextResponse.json({
      symbol,
      sector: profile?.sector || 'Unknown',
      industry: profile?.industry || 'Unknown',
      peers: [],
    });
  } catch {
    return NextResponse.json({ symbol, sector: 'Unknown', industry: 'Unknown', peers: [] });
  }
}
