import { NextRequest, NextResponse } from 'next/server';
import {
  TOP_LEADERS_LIMIT,
  enforceTopLeaders,
  filterLiveLeaderboardTraders,
  isValidEvmAddress,
  normalizePolymarketV2Row,
  normalizePolymarketV2Rows,
  toPolymarketCategory,
  toPolymarketSortBy,
  toPolymarketTimePeriod,
  type LeaderboardCategory,
  type LeaderboardPagination,
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
  'Culture',
]);
const VALID_SORTS = new Set<LeaderboardSort>(['pnl', 'volume']);

const POLYMARKET_LEADERBOARD_ENDPOINT = 'https://data-api.polymarket.com/v2/leaderboard';

async function safeParseJson<T>(res: Response): Promise<T | null> {
  try {
    const raw = await res.text();
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const rawTf = (sp.get('time_period') ?? sp.get('timeframe')) as LeaderboardTimeframe | null;
  const rawCat = sp.get('category') as LeaderboardCategory | null;
  const rawSortParam = sp.get('sort_by') ?? sp.get('sortBy');
  const rawSort = rawSortParam ? (rawSortParam.toLowerCase() as LeaderboardSort) : null;
  const search = (sp.get('search') ?? sp.get('user') ?? '').trim().slice(0, 120);
  const rawLimit = Number(sp.get('limit') ?? String(TOP_LEADERS_LIMIT));

  // Default strictly to All-Time top 3 leaders per category
  const timeframe: LeaderboardTimeframe =
    rawTf && VALID_TIMEFRAMES.has(rawTf) ? rawTf : 'all';
  const category: LeaderboardCategory =
    rawCat && VALID_CATEGORIES.has(rawCat) ? rawCat : 'All';
  const sortBy: LeaderboardSort = rawSort && VALID_SORTS.has(rawSort) ? rawSort : 'pnl';
  const limit = Number.isFinite(rawLimit)
    ? Math.min(Math.max(Math.trunc(rawLimit), 1), TOP_LEADERS_LIMIT)
    : TOP_LEADERS_LIMIT;

  const apiPeriod = toPolymarketTimePeriod(timeframe);
  const apiCategory = toPolymarketCategory(category);
  const apiSortBy = toPolymarketSortBy(sortBy);

  const upstreamUrl = new URL(POLYMARKET_LEADERBOARD_ENDPOINT);
  upstreamUrl.searchParams.set('time_period', apiPeriod);
  upstreamUrl.searchParams.set('sort_by', apiSortBy);
  upstreamUrl.searchParams.set('limit', String(limit));
  if (apiCategory !== 'overall') {
    upstreamUrl.searchParams.set('category', apiCategory);
  }

  try {
    const isExactAddress = isValidEvmAddress(search);

    const requests: Promise<Response>[] = [
      fetch(upstreamUrl.toString(), {
        headers: { Accept: 'application/json' },
        next: { revalidate: 60 },
        signal: AbortSignal.timeout(8000),
      }),
    ];

    if (isExactAddress) {
      const userUrl = new URL(POLYMARKET_LEADERBOARD_ENDPOINT);
      userUrl.searchParams.set('time_period', apiPeriod);
      userUrl.searchParams.set('sort_by', apiSortBy);
      if (apiCategory !== 'overall') {
        userUrl.searchParams.set('category', apiCategory);
      }
      userUrl.searchParams.set('user', search);
      requests.push(
        fetch(userUrl.toString(), {
          headers: { Accept: 'application/json' },
          next: { revalidate: 60 },
          signal: AbortSignal.timeout(8000),
        }),
      );
    }

    const [listRes, userRes] = await Promise.all(requests);
    if (!listRes || !listRes.ok) {
      return NextResponse.json(
        {
          error: `Polymarket leaderboard returned HTTP ${listRes?.status ?? 502}`,
          traders: [],
        },
        { status: 502 },
      );
    }

    const payload = await safeParseJson<{
      data?: RawPolymarketV2LeaderboardRow[];
    }>(listRes);

    if (!payload || !Array.isArray(payload.data)) {
      return NextResponse.json(
        {
          error: 'Malformed leaderboard response from Polymarket Data API v2',
          traders: [],
        },
        { status: 502 },
      );
    }

    let traders: LiveLeaderboardTrader[] = enforceTopLeaders(
      normalizePolymarketV2Rows(payload.data),
      limit,
    );

    if (isExactAddress && userRes?.ok) {
      const userPayload = await safeParseJson<{
        data?: RawPolymarketV2LeaderboardRow & { rank_pnl?: number; rank_volume?: number };
      }>(userRes);
      if (userPayload?.data) {
        const directRow = normalizePolymarketV2Row({
          ...userPayload.data,
          rank:
            apiSortBy === 'VOLUME'
              ? userPayload.data.rank_volume ?? userPayload.data.rank
              : userPayload.data.rank_pnl ?? userPayload.data.rank,
        });
        if (
          directRow &&
          !traders.some((t) => t.address.toLowerCase() === directRow.address.toLowerCase())
        ) {
          traders = [directRow];
        }
      }
    }

    const filtered = search ? filterLiveLeaderboardTraders(traders, search) : traders;
    const pagination: LeaderboardPagination = {
      limit,
      offset: 0,
      hasMore: false,
      nextCursor: null,
    };

    return NextResponse.json(
      {
        source: 'live',
        timeframe,
        category,
        sortBy,
        syncedAt: new Date().toISOString(),
        traders: filtered,
        pagination,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=90',
        },
      },
    );
  } catch {
    return NextResponse.json(
      {
        error: 'Unable to reach Polymarket Data API v2. Please retry in a moment.',
        traders: [],
      },
      { status: 503 },
    );
  }
}
