import { NextRequest, NextResponse } from 'next/server';
import {
  fallbackToLiveEntries,
  filterLiveLeaderboardTraders,
  normalizePolymarketV2Row,
  normalizePolymarketV2Rows,
  toPolymarketCategory,
  toPolymarketSortBy,
  toPolymarketTimePeriod,
  type LeaderboardCategory,
  type LeaderboardSort,
  type LeaderboardTimeframe,
  type LiveLeaderboardTrader,
  type RawPolymarketV2LeaderboardRow,
} from '@/lib/polymarket/leaderboard';

const VALID_TIMEFRAMES = new Set<LeaderboardTimeframe>(['day', 'week', 'month', 'all']);
const VALID_CATEGORIES = new Set<LeaderboardCategory>([
  'All',
  'Politics',
  'Sports',
  'Crypto',
  'Finance',
  'Economics',
  'Tech',
]);
const VALID_SORTS = new Set<LeaderboardSort>(['pnl', 'volume', 'winRate']);

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const rawTf = sp.get('timeframe') as LeaderboardTimeframe | null;
  const rawCat = sp.get('category') as LeaderboardCategory | null;
  const rawSort = sp.get('sortBy') as LeaderboardSort | null;
  const search = (sp.get('search') ?? '').trim();
  const rawLimit = Number(sp.get('limit') ?? '25');

  const timeframe: LeaderboardTimeframe = rawTf && VALID_TIMEFRAMES.has(rawTf) ? rawTf : 'month';
  const category: LeaderboardCategory = rawCat && VALID_CATEGORIES.has(rawCat) ? rawCat : 'All';
  const sortBy: LeaderboardSort = rawSort && VALID_SORTS.has(rawSort) ? rawSort : 'pnl';
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 5), 50) : 25;

  const apiPeriod = toPolymarketTimePeriod(timeframe);
  const apiCategory = toPolymarketCategory(category);
  const apiOrderBy = toPolymarketSortBy(sortBy);

  const upstreamUrl = new URL('https://data-api.polymarket.com/v2/leaderboard');
  upstreamUrl.searchParams.set('category', apiCategory);
  upstreamUrl.searchParams.set('timePeriod', apiPeriod);
  upstreamUrl.searchParams.set('orderBy', apiOrderBy);
  upstreamUrl.searchParams.set('limit', String(search ? 50 : limit));

  try {
    const isExactAddress = /^0x[a-fA-F0-9]{40}$/.test(search);

    const requests: Promise<Response>[] = [
      fetch(upstreamUrl.toString(), {
        headers: { Accept: 'application/json' },
        next: { revalidate: 30 },
        signal: AbortSignal.timeout(6000),
      }),
    ];

    if (isExactAddress) {
      const userUrl = new URL('https://data-api.polymarket.com/v2/leaderboard');
      userUrl.searchParams.set('category', apiCategory);
      userUrl.searchParams.set('timePeriod', apiPeriod);
      userUrl.searchParams.set('orderBy', apiOrderBy);
      userUrl.searchParams.set('user', search);
      requests.push(
        fetch(userUrl.toString(), {
          headers: { Accept: 'application/json' },
          next: { revalidate: 30 },
          signal: AbortSignal.timeout(6000),
        }),
      );
    }

    const [listRes, userRes] = await Promise.all(requests);
    if (!listRes || !listRes.ok) {
      throw new Error(`Upstream HTTP ${listRes?.status ?? 'unknown'}`);
    }

    const payload = (await listRes.json()) as { data?: RawPolymarketV2LeaderboardRow[] };
    let traders: LiveLeaderboardTrader[] = normalizePolymarketV2Rows(
      Array.isArray(payload.data) ? payload.data : [],
    );

    if (isExactAddress && userRes?.ok) {
      const userPayload = (await userRes.json()) as { data?: RawPolymarketV2LeaderboardRow & { rank_pnl?: number; rank_volume?: number } };
      if (userPayload?.data) {
        const directRow = normalizePolymarketV2Row({
          ...userPayload.data,
          rank:
            apiOrderBy === 'VOLUME'
              ? userPayload.data.rank_volume ?? userPayload.data.rank
              : userPayload.data.rank_pnl ?? userPayload.data.rank,
        });
        if (directRow && !traders.some((t) => t.address.toLowerCase() === directRow.address.toLowerCase())) {
          traders = [directRow, ...traders];
        }
      }
    }

    const filtered = search ? filterLiveLeaderboardTraders(traders, search) : traders.slice(0, limit);

    return NextResponse.json(
      {
        source: 'live',
        timeframe,
        category,
        sortBy: apiOrderBy === 'VOLUME' ? 'volume' : 'pnl',
        syncedAt: new Date().toISOString(),
        traders: filtered,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        },
      },
    );
  } catch {
    const fallback = fallbackToLiveEntries({ timeframe, category, sortBy, search }).slice(0, limit);
    return NextResponse.json({
      source: 'fallback',
      timeframe,
      category,
      sortBy,
      syncedAt: new Date().toISOString(),
      traders: fallback,
    });
  }
}
