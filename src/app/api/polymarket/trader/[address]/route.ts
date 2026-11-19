import { NextRequest, NextResponse } from 'next/server';
import {
  normalizeTraderPosition,
  normalizeTraderTrade,
  type RawPolymarketV2PositionRow,
  type RawPolymarketV2TradeRow,
} from '@/lib/polymarket/leaderboard';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ address: string }> },
) {
  const { address } = await context.params;
  const cleanAddress = (address ?? '').trim();

  if (!/^0x[a-fA-F0-9]{40}$/.test(cleanAddress)) {
    return NextResponse.json({ error: 'Invalid Polymarket wallet address' }, { status: 400 });
  }

  const posUrl = new URL('https://data-api.polymarket.com/v2/positions');
  posUrl.searchParams.set('user', cleanAddress);
  posUrl.searchParams.set('limit', '4');

  const tradeUrl = new URL('https://data-api.polymarket.com/v2/trades');
  tradeUrl.searchParams.set('user', cleanAddress);
  tradeUrl.searchParams.set('limit', '4');

  const [posRes, tradeRes] = await Promise.allSettled([
    fetch(posUrl.toString(), {
      headers: { Accept: 'application/json' },
      next: { revalidate: 30 },
      signal: AbortSignal.timeout(5000),
    }),
    fetch(tradeUrl.toString(), {
      headers: { Accept: 'application/json' },
      next: { revalidate: 30 },
      signal: AbortSignal.timeout(5000),
    }),
  ]);

  let positions = [];
  let trades = [];

  if (posRes.status === 'fulfilled' && posRes.value.ok) {
    try {
      const json = (await posRes.value.json()) as { data?: RawPolymarketV2PositionRow[] };
      const rows = Array.isArray(json.data) ? json.data : [];
      positions = rows
        .map(normalizeTraderPosition)
        .filter((item): item is NonNullable<typeof item> => item !== null)
        .slice(0, 4);
    } catch {
      // Ignore parse errors gracefully
    }
  }

  if (tradeRes.status === 'fulfilled' && tradeRes.value.ok) {
    try {
      const json = (await tradeRes.value.json()) as { data?: RawPolymarketV2TradeRow[] };
      const rows = Array.isArray(json.data) ? json.data : [];
      trades = rows
        .map(normalizeTraderTrade)
        .filter((item): item is NonNullable<typeof item> => item !== null)
        .slice(0, 4);
    } catch {
      // Ignore parse errors gracefully
    }
  }

  return NextResponse.json(
    {
      address: cleanAddress,
      positions,
      trades,
      fetchedAt: new Date().toISOString(),
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    },
  );
}
