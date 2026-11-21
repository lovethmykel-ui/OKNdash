import { NextRequest, NextResponse } from 'next/server';
import {
  computeWhalePerformance,
  isValidEvmAddress,
  normalizeTraderActivity,
  normalizeTraderPosition,
  type LiveTraderPosition,
  type LiveTraderTrade,
  type RawPolymarketV2ActivityRow,
  type RawPolymarketV2PositionRow,
} from '@/lib/polymarket/leaderboard';

const POLYMARKET_POSITIONS_ENDPOINT = 'https://data-api.polymarket.com/v2/positions';
const POLYMARKET_ACTIVITY_ENDPOINT = 'https://data-api.polymarket.com/v2/activity';

async function safeParseJson<T>(res: Response): Promise<T | null> {
  try {
    const raw = await res.text();
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ address: string }> },
) {
  const { address } = await context.params;
  const cleanAddress = (address ?? '').trim();

  if (!isValidEvmAddress(cleanAddress)) {
    return NextResponse.json({ error: 'Invalid Polymarket wallet address' }, { status: 400 });
  }

  const posUrl = new URL(POLYMARKET_POSITIONS_ENDPOINT);
  posUrl.searchParams.set('user', cleanAddress);
  posUrl.searchParams.set('limit', '50');

  const activityUrl = new URL(POLYMARKET_ACTIVITY_ENDPOINT);
  activityUrl.searchParams.set('user', cleanAddress);
  activityUrl.searchParams.set('type', 'TRADE');
  activityUrl.searchParams.set('limit', '25');

  const [posRes, activityRes] = await Promise.allSettled([
    fetch(posUrl.toString(), {
      headers: { Accept: 'application/json' },
      next: { revalidate: 30 },
      signal: AbortSignal.timeout(7000),
    }),
    fetch(activityUrl.toString(), {
      headers: { Accept: 'application/json' },
      next: { revalidate: 30 },
      signal: AbortSignal.timeout(7000),
    }),
  ]);

  let positions: LiveTraderPosition[] = [];
  let trades: LiveTraderTrade[] = [];
  let positionsOk = false;
  let activityOk = false;

  if (posRes.status === 'fulfilled' && posRes.value.ok) {
    positionsOk = true;
    const json = await safeParseJson<{ data?: RawPolymarketV2PositionRow[] }>(posRes.value);
    const rows = Array.isArray(json?.data) ? json.data : [];
    positions = rows
      .map(normalizeTraderPosition)
      .filter((item): item is LiveTraderPosition => item !== null)
      .sort((a, b) => b.currentValueUsd - a.currentValueUsd);
  }

  if (activityRes.status === 'fulfilled' && activityRes.value.ok) {
    activityOk = true;
    const json = await safeParseJson<{ data?: RawPolymarketV2ActivityRow[] }>(activityRes.value);
    const rows = Array.isArray(json?.data) ? json.data : [];
    trades = rows
      .map(normalizeTraderActivity)
      .filter((item): item is LiveTraderTrade => item !== null)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  if (!positionsOk && !activityOk) {
    return NextResponse.json(
      { error: 'Unable to load live positions and activity from Polymarket Data API v2.' },
      { status: 503 },
    );
  }

  const performance = computeWhalePerformance(positions);

  return NextResponse.json(
    {
      address: cleanAddress,
      positions: positions.slice(0, 20),
      trades: trades.slice(0, 20),
      performance,
      fetchedAt: new Date().toISOString(),
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    },
  );
}
