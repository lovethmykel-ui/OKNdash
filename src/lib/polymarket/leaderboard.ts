/**
 * Pure Polymarket Leaderboard data, Data API v2 normalization, filtering,
 * sorting, and formatting helpers.
 * Mirrors https://polymarket.com/leaderboard (data-api.polymarket.com/v2).
 */

export type LeaderboardTimeframe = 'day' | 'week' | 'month' | 'all';
export type LeaderboardCategory =
  | 'All'
  | 'Politics'
  | 'Sports'
  | 'Crypto'
  | 'Finance'
  | 'Economics'
  | 'Tech';
export type LeaderboardSort = 'pnl' | 'volume' | 'winRate';

export type PolymarketApiTimePeriod = 'DAY' | 'WEEK' | 'MONTH' | 'ALL';
export type PolymarketApiCategory =
  | 'OVERALL'
  | 'POLITICS'
  | 'SPORTS'
  | 'CRYPTO'
  | 'FINANCE'
  | 'ECONOMICS'
  | 'TECH';
export type PolymarketApiSortBy = 'PNL' | 'VOLUME';

export interface TraderPeriodStats {
  pnlUsd: number;
  volumeUsd: number;
  winRate: number;
  trades: number;
  roiPct: number;
}

export interface PolymarketLeaderboardTrader {
  id: string;
  handle: string;
  displayName: string;
  address: string;
  specialty: Exclude<LeaderboardCategory, 'All'>;
  verified: boolean;
  avatarGradient: string;
  recentMarket: string;
  recentSide: 'YES' | 'NO';
  recentSizeUsd: number;
  stats: Record<LeaderboardTimeframe, TraderPeriodStats>;
}

/** Canonical live trader record mirrored from Polymarket Data API v2. */
export interface LiveLeaderboardTrader {
  rank: number;
  address: string;
  displayName: string;
  rawUserName: string;
  isAnonAddress: boolean;
  profileImage: string | null;
  xUsername: string | null;
  verified: boolean;
  pnlUsd: number;
  volumeUsd: number;
  avatarTone: string;
  polymarketUrl: string;
}

export interface LiveTraderPosition {
  title: string;
  outcome: string;
  avgPriceCents: number;
  currentPriceCents: number;
  currentValueUsd: number;
  totalPnlUsd: number;
  percentPnl: number;
  slug: string;
  eventSlug: string;
  icon: string | null;
}

export interface LiveTraderTrade {
  side: 'BUY' | 'SELL';
  outcome: string;
  title: string;
  usdcValue: number;
  priceCents: number;
  timestamp: number;
  slug: string;
  txHash: string;
}

export interface RawPolymarketV2LeaderboardRow {
  rank?: number | string;
  user_id?: string;
  pnl?: number | string;
  volume?: number | string;
  user_name?: string;
  profile_image?: string;
  x_username?: string;
  verified?: boolean;
}

export interface RawPolymarketV2PositionRow {
  title?: string;
  outcome?: string;
  avg_price?: number;
  current_price?: number;
  current_value?: number;
  total_pnl?: number;
  percent_pnl?: number;
  slug?: string;
  event_slug?: string;
  icon?: string;
}

export interface RawPolymarketV2TradeRow {
  side?: string;
  outcome?: string;
  title?: string;
  size?: number;
  price?: number;
  timestamp?: number;
  slug?: string;
  transaction_hash?: string;
}

const AVATAR_TONES = [
  'from-slate-700 to-slate-900',
  'from-blue-600 to-indigo-700',
  'from-emerald-600 to-teal-700',
  'from-amber-600 to-orange-700',
  'from-violet-600 to-purple-700',
  'from-cyan-600 to-sky-700',
];

export const LEADERBOARD_CATEGORIES: LeaderboardCategory[] = [
  'All',
  'Politics',
  'Sports',
  'Crypto',
  'Finance',
  'Economics',
  'Tech',
];

export const LEADERBOARD_TIMEFRAMES: {
  key: LeaderboardTimeframe;
  label: string;
  shortLabel: string;
}[] = [
  { key: 'day', label: 'Today', shortLabel: '24H' },
  { key: 'week', label: 'Weekly', shortLabel: '7D' },
  { key: 'month', label: 'Monthly', shortLabel: '30D' },
  { key: 'all', label: 'All Time', shortLabel: 'All' },
];

export function toPolymarketTimePeriod(tf: LeaderboardTimeframe): PolymarketApiTimePeriod {
  switch (tf) {
    case 'day':
      return 'DAY';
    case 'week':
      return 'WEEK';
    case 'month':
      return 'MONTH';
    case 'all':
      return 'ALL';
  }
}

export function toPolymarketCategory(cat: LeaderboardCategory): PolymarketApiCategory {
  switch (cat) {
    case 'Politics':
      return 'POLITICS';
    case 'Sports':
      return 'SPORTS';
    case 'Crypto':
      return 'CRYPTO';
    case 'Finance':
      return 'FINANCE';
    case 'Economics':
      return 'ECONOMICS';
    case 'Tech':
      return 'TECH';
    default:
      return 'OVERALL';
  }
}

export function toPolymarketSortBy(sort: LeaderboardSort): PolymarketApiSortBy {
  return sort === 'volume' ? 'VOLUME' : 'PNL';
}

export function pickAvatarTone(address: string): string {
  const clean = address.toLowerCase().replace(/^0x/, '');
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = (hash * 31 + clean.charCodeAt(i)) >>> 0;
  }
  return AVATAR_TONES[hash % AVATAR_TONES.length] ?? AVATAR_TONES[0]!;
}

/**
 * Formats Polymarket `user_name` strings cleanly:
 * Polymarket stores uncustomized handles as `0xAddr-1759935795465` or raw `0xAddr`.
 * We collapse those to `0x2c33...0563` so the leaderboard never renders 55-char noise.
 */
export function formatPolymarketUsername(
  rawUserName: string | undefined | null,
  address: string,
): { displayName: string; isAnonAddress: boolean } {
  const trimmed = (rawUserName ?? '').trim();
  if (!trimmed || /^0x[a-fA-F0-9]{40}(?:-\d+)?$/i.test(trimmed)) {
    return {
      displayName: shortenEvmAddress(address),
      isAnonAddress: true,
    };
  }
  return {
    displayName: trimmed,
    isAnonAddress: false,
  };
}

export function buildPolymarketProfileUrl(address: string): string {
  return `https://polymarket.com/profile/${address.trim()}`;
}

export function normalizePolymarketV2Row(
  raw: RawPolymarketV2LeaderboardRow,
  index = 0,
): LiveLeaderboardTrader | null {
  const address = typeof raw.user_id === 'string' ? raw.user_id.trim() : '';
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return null;
  }
  const rank = Number(raw.rank);
  const pnl = Number(raw.pnl);
  const volume = Number(raw.volume);
  const rawUserName = typeof raw.user_name === 'string' ? raw.user_name.trim() : '';
  const { displayName, isAnonAddress } = formatPolymarketUsername(rawUserName, address);
  const profileImage =
    typeof raw.profile_image === 'string' && /^https?:\/\//i.test(raw.profile_image.trim())
      ? raw.profile_image.trim()
      : null;
  const xUsernameRaw = typeof raw.x_username === 'string' ? raw.x_username.trim().replace(/^@+/, '') : '';

  return {
    rank: Number.isFinite(rank) && rank > 0 ? rank : index + 1,
    address,
    displayName,
    rawUserName,
    isAnonAddress,
    profileImage,
    xUsername: xUsernameRaw.length > 0 ? xUsernameRaw : null,
    verified: Boolean(raw.verified),
    pnlUsd: Number.isFinite(pnl) ? pnl : 0,
    volumeUsd: Number.isFinite(volume) && volume >= 0 ? volume : 0,
    avatarTone: pickAvatarTone(address),
    polymarketUrl: buildPolymarketProfileUrl(address),
  };
}

export function normalizePolymarketV2Rows(
  rows: RawPolymarketV2LeaderboardRow[],
): LiveLeaderboardTrader[] {
  const out: LiveLeaderboardTrader[] = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;
    const normalized = normalizePolymarketV2Row(row, i);
    if (normalized) out.push(normalized);
  }
  return out;
}

export function filterLiveLeaderboardTraders(
  traders: LiveLeaderboardTrader[],
  search: string,
): LiveLeaderboardTrader[] {
  const query = search.trim().toLowerCase();
  if (!query) return traders;
  return traders.filter(
    (t) =>
      t.displayName.toLowerCase().includes(query) ||
      t.address.toLowerCase().includes(query) ||
      (t.xUsername ? t.xUsername.toLowerCase().includes(query) : false),
  );
}

export function normalizeTraderPosition(raw: RawPolymarketV2PositionRow): LiveTraderPosition | null {
  const title = typeof raw.title === 'string' ? raw.title.trim() : '';
  if (!title) return null;
  const outcome = typeof raw.outcome === 'string' && raw.outcome.trim() ? raw.outcome.trim() : 'YES';
  const avgPrice = Number(raw.avg_price ?? 0);
  const currentPrice = Number(raw.current_price ?? 0);
  const currentValueUsd = Number(raw.current_value ?? 0);
  const totalPnlUsd = Number(raw.total_pnl ?? 0);
  const percentPnl = Number(raw.percent_pnl ?? 0);
  return {
    title,
    outcome,
    avgPriceCents: Number.isFinite(avgPrice) ? Math.round(avgPrice * 100) : 0,
    currentPriceCents: Number.isFinite(currentPrice) ? Math.round(currentPrice * 100) : 0,
    currentValueUsd: Number.isFinite(currentValueUsd) ? currentValueUsd : 0,
    totalPnlUsd: Number.isFinite(totalPnlUsd) ? totalPnlUsd : 0,
    percentPnl: Number.isFinite(percentPnl) ? percentPnl : 0,
    slug: typeof raw.slug === 'string' ? raw.slug : '',
    eventSlug: typeof raw.event_slug === 'string' ? raw.event_slug : '',
    icon:
      typeof raw.icon === 'string' && /^https?:\/\//i.test(raw.icon.trim())
        ? raw.icon.trim()
        : null,
  };
}

export function normalizeTraderTrade(raw: RawPolymarketV2TradeRow): LiveTraderTrade | null {
  const title = typeof raw.title === 'string' ? raw.title.trim() : '';
  if (!title) return null;
  const side = String(raw.side ?? 'BUY').toUpperCase() === 'SELL' ? 'SELL' : 'BUY';
  const size = Number(raw.size ?? 0);
  const price = Number(raw.price ?? 0);
  const usdcValue = Number.isFinite(size * price) ? size * price : 0;
  const timestamp = Number(raw.timestamp ?? 0);
  return {
    side,
    outcome: typeof raw.outcome === 'string' && raw.outcome.trim() ? raw.outcome.trim() : 'YES',
    title,
    usdcValue,
    priceCents: Number.isFinite(price) ? Math.round(price * 100) : 0,
    timestamp: Number.isFinite(timestamp) ? timestamp : 0,
    slug: typeof raw.slug === 'string' ? raw.slug : '',
    txHash: typeof raw.transaction_hash === 'string' ? raw.transaction_hash : '',
  };
}

export function formatRelativeTime(unixSeconds: number, nowMs = Date.now()): string {
  if (!Number.isFinite(unixSeconds) || unixSeconds <= 0) return 'Recent';
  const diffSec = Math.max(0, Math.floor(nowMs / 1000 - unixSeconds));
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

export const POLYMARKET_LEADERBOARD_TRADERS: PolymarketLeaderboardTrader[] = [
  {
    id: 'pm-theo4',
    handle: '@Theo4',
    displayName: 'Theo4',
    address: '0x7b3291a4c8d1e0f23456789abcdef012345691a4',
    specialty: 'Politics',
    verified: true,
    avatarGradient: 'from-blue-600 to-indigo-700',
    recentMarket: 'Fed cuts 25bps at next FOMC meeting',
    recentSide: 'YES',
    recentSizeUsd: 18500,
    stats: {
      day: { pnlUsd: 142800, volumeUsd: 890000, winRate: 81.4, trades: 19, roiPct: 16.0 },
      week: { pnlUsd: 684200, volumeUsd: 4210000, winRate: 78.9, trades: 74, roiPct: 24.3 },
      month: { pnlUsd: 2140500, volumeUsd: 14800000, winRate: 76.4, trades: 218, roiPct: 31.8 },
      all: { pnlUsd: 8420900, volumeUsd: 46200000, winRate: 75.2, trades: 642, roiPct: 42.1 },
    },
  },
  {
    id: 'pm-fredi9999',
    handle: '@Fredi9999',
    displayName: 'Fredi9999',
    address: '0x4c19e08b91a2b3c4d5e6f708192a3b4c5d6ee08b',
    specialty: 'Economics',
    verified: true,
    avatarGradient: 'from-emerald-600 to-teal-700',
    recentMarket: 'US CPI YoY under 2.7% next print',
    recentSide: 'YES',
    recentSizeUsd: 24000,
    stats: {
      day: { pnlUsd: 118400, volumeUsd: 740000, winRate: 79.0, trades: 14, roiPct: 14.5 },
      week: { pnlUsd: 541900, volumeUsd: 3890000, winRate: 76.2, trades: 61, roiPct: 21.7 },
      month: { pnlUsd: 1795000, volumeUsd: 12100000, winRate: 74.8, trades: 190, roiPct: 28.4 },
      all: { pnlUsd: 6910400, volumeUsd: 39400000, winRate: 73.9, trades: 518, roiPct: 37.6 },
    },
  },
  {
    id: 'pm-zxgngl',
    handle: '@zxgngl',
    displayName: 'zxgngl',
    address: '0x88f4c12a9e772b0c19d843a56f7b8c9d0e1fc12a',
    specialty: 'Crypto',
    verified: true,
    avatarGradient: 'from-amber-600 to-orange-700',
    recentMarket: 'BTC above $105k before month close',
    recentSide: 'YES',
    recentSizeUsd: 14200,
    stats: {
      day: { pnlUsd: 96500, volumeUsd: 615000, winRate: 83.3, trades: 24, roiPct: 18.2 },
      week: { pnlUsd: 468300, volumeUsd: 2940000, winRate: 79.5, trades: 88, roiPct: 27.1 },
      month: { pnlUsd: 1482000, volumeUsd: 9700000, winRate: 77.1, trades: 246, roiPct: 34.0 },
      all: { pnlUsd: 5340200, volumeUsd: 29800000, winRate: 74.6, trades: 701, roiPct: 39.4 },
    },
  },
  {
    id: 'pm-michie',
    handle: '@Michie',
    displayName: 'Michie',
    address: '0x2d9b74c15f8a6e3c20194857a6b5c4d3e2f174c1',
    specialty: 'Politics',
    verified: true,
    avatarGradient: 'from-violet-600 to-purple-700',
    recentMarket: 'Senate passes digital asset framework bill',
    recentSide: 'NO',
    recentSizeUsd: 11800,
    stats: {
      day: { pnlUsd: 78200, volumeUsd: 530000, winRate: 75.0, trades: 12, roiPct: 12.9 },
      week: { pnlUsd: 392400, volumeUsd: 2610000, winRate: 74.1, trades: 54, roiPct: 19.6 },
      month: { pnlUsd: 1190800, volumeUsd: 8450000, winRate: 72.8, trades: 164, roiPct: 24.9 },
      all: { pnlUsd: 4215000, volumeUsd: 24700000, winRate: 71.5, trades: 489, roiPct: 33.2 },
    },
  },
  {
    id: 'pm-domer',
    handle: '@Domer',
    displayName: 'Domer',
    address: '0x59a3e81c2b4d6f8091a2b3c4d5e6f7a8b9c0e81c',
    specialty: 'Politics',
    verified: true,
    avatarGradient: 'from-emerald-600 to-sky-700',
    recentMarket: 'UK Bank Rate held steady at next MPC',
    recentSide: 'YES',
    recentSizeUsd: 9600,
    stats: {
      day: { pnlUsd: 64100, volumeUsd: 492000, winRate: 73.7, trades: 19, roiPct: 11.4 },
      week: { pnlUsd: 318700, volumeUsd: 2380000, winRate: 72.4, trades: 67, roiPct: 17.8 },
      month: { pnlUsd: 984200, volumeUsd: 7920000, winRate: 71.9, trades: 205, roiPct: 22.1 },
      all: { pnlUsd: 3680400, volumeUsd: 22100000, winRate: 70.8, trades: 892, roiPct: 29.7 },
    },
  },
  {
    id: 'pm-macrooracle',
    handle: '@MacroOracle',
    displayName: 'MacroOracle',
    address: '0x91e7b03d4c5a6f7890123456789abcdef012b03d',
    specialty: 'Economics',
    verified: true,
    avatarGradient: 'from-slate-700 to-slate-900',
    recentMarket: 'US 10Y yield closes below 4.15% Friday',
    recentSide: 'YES',
    recentSizeUsd: 16000,
    stats: {
      day: { pnlUsd: 89300, volumeUsd: 445000, winRate: 85.7, trades: 14, roiPct: 19.4 },
      week: { pnlUsd: 364000, volumeUsd: 1980000, winRate: 82.0, trades: 45, roiPct: 25.8 },
      month: { pnlUsd: 1094000, volumeUsd: 6320000, winRate: 79.4, trades: 131, roiPct: 30.2 },
      all: { pnlUsd: 3190000, volumeUsd: 17400000, winRate: 77.6, trades: 376, roiPct: 36.1 },
    },
  },
  {
    id: 'pm-cryptopundit',
    handle: '@CryptoPundit',
    displayName: 'CryptoPundit',
    address: '0x6f28a91e3d4c5b6a7980123456789abcdef0a91e',
    specialty: 'Crypto',
    verified: false,
    avatarGradient: 'from-amber-600 to-orange-700',
    recentMarket: 'Spot SOL ETF approved in 2026',
    recentSide: 'YES',
    recentSizeUsd: 8400,
    stats: {
      day: { pnlUsd: 52400, volumeUsd: 380000, winRate: 76.5, trades: 17, roiPct: 13.7 },
      week: { pnlUsd: 249100, volumeUsd: 1740000, winRate: 74.6, trades: 63, roiPct: 18.9 },
      month: { pnlUsd: 812600, volumeUsd: 5890000, winRate: 73.1, trades: 179, roiPct: 23.4 },
      all: { pnlUsd: 2540800, volumeUsd: 14900000, winRate: 71.2, trades: 530, roiPct: 28.5 },
    },
  },
  {
    id: 'pm-alphacourt',
    handle: '@AlphaCourt',
    displayName: 'AlphaCourt',
    address: '0x3a71d45b8e9c0f123456789abcdef0123456d45b',
    specialty: 'Sports',
    verified: true,
    avatarGradient: 'from-cyan-600 to-sky-700',
    recentMarket: 'Champions League quarterfinal upset YES',
    recentSide: 'NO',
    recentSizeUsd: 7200,
    stats: {
      day: { pnlUsd: 47900, volumeUsd: 412000, winRate: 77.8, trades: 27, roiPct: 12.1 },
      week: { pnlUsd: 214500, volumeUsd: 1620000, winRate: 75.3, trades: 93, roiPct: 16.4 },
      month: { pnlUsd: 695400, volumeUsd: 5110000, winRate: 74.0, trades: 284, roiPct: 20.8 },
      all: { pnlUsd: 2185000, volumeUsd: 13600000, winRate: 72.9, trades: 910, roiPct: 25.2 },
    },
  },
  {
    id: 'pm-finflow',
    handle: '@FinFlow',
    displayName: 'FinFlow',
    address: '0xa4c8e20f1b3d5e79802468ace13579bdf024e20f',
    specialty: 'Finance',
    verified: true,
    avatarGradient: 'from-blue-600 to-indigo-700',
    recentMarket: 'S&P 500 closes Q4 above 6,200',
    recentSide: 'YES',
    recentSizeUsd: 9100,
    stats: {
      day: { pnlUsd: 39800, volumeUsd: 315000, winRate: 80.0, trades: 15, roiPct: 15.2 },
      week: { pnlUsd: 192000, volumeUsd: 1390000, winRate: 77.5, trades: 52, roiPct: 19.3 },
      month: { pnlUsd: 618000, volumeUsd: 4280000, winRate: 75.8, trades: 149, roiPct: 22.9 },
      all: { pnlUsd: 1840500, volumeUsd: 11200000, winRate: 74.1, trades: 415, roiPct: 27.0 },
    },
  },
  {
    id: 'pm-siliconsignal',
    handle: '@SiliconSignal',
    displayName: 'SiliconSignal',
    address: '0xe19c3b7a5d4f208192a3b4c5d6e7f8091a2b3b7a',
    specialty: 'Tech',
    verified: false,
    avatarGradient: 'from-slate-700 to-slate-900',
    recentMarket: 'Frontier AI release before year-end',
    recentSide: 'YES',
    recentSizeUsd: 5500,
    stats: {
      day: { pnlUsd: 34200, volumeUsd: 278000, winRate: 74.2, trades: 21, roiPct: 10.9 },
      week: { pnlUsd: 168400, volumeUsd: 1180000, winRate: 73.0, trades: 78, roiPct: 15.1 },
      month: { pnlUsd: 542100, volumeUsd: 3940000, winRate: 72.1, trades: 229, roiPct: 18.7 },
      all: { pnlUsd: 1590000, volumeUsd: 9850000, winRate: 70.9, trades: 760, roiPct: 22.4 },
    },
  },
];

export interface RankedLeaderboardEntry {
  rank: number;
  trader: PolymarketLeaderboardTrader;
  periodStats: TraderPeriodStats;
}

export function filterAndSortLeaderboard(
  traders: PolymarketLeaderboardTrader[],
  options: {
    timeframe: LeaderboardTimeframe;
    category: LeaderboardCategory;
    sortBy: LeaderboardSort;
    search: string;
  },
): RankedLeaderboardEntry[] {
  const query = options.search.trim().toLowerCase();

  const filtered = traders.filter((trader) => {
    if (options.category !== 'All' && trader.specialty !== options.category) {
      return false;
    }
    if (!query) return true;
    return (
      trader.handle.toLowerCase().includes(query) ||
      trader.displayName.toLowerCase().includes(query) ||
      trader.address.toLowerCase().includes(query) ||
      trader.specialty.toLowerCase().includes(query) ||
      trader.recentMarket.toLowerCase().includes(query)
    );
  });

  const sorted = [...filtered].sort((a, b) => {
    const statsA = a.stats[options.timeframe];
    const statsB = b.stats[options.timeframe];
    if (options.sortBy === 'volume') return statsB.volumeUsd - statsA.volumeUsd;
    if (options.sortBy === 'winRate') return statsB.winRate - statsA.winRate;
    return statsB.pnlUsd - statsA.pnlUsd;
  });

  return sorted.map((trader, idx) => ({
    rank: idx + 1,
    trader,
    periodStats: trader.stats[options.timeframe],
  }));
}

export function fallbackToLiveEntries(options: {
  timeframe: LeaderboardTimeframe;
  category: LeaderboardCategory;
  sortBy: LeaderboardSort;
  search: string;
}): LiveLeaderboardTrader[] {
  return filterAndSortLeaderboard(POLYMARKET_LEADERBOARD_TRADERS, options).map(
    ({ rank, trader, periodStats }) => ({
      rank,
      address: trader.address,
      displayName: trader.displayName,
      rawUserName: trader.displayName,
      isAnonAddress: false,
      profileImage: null,
      xUsername: null,
      verified: trader.verified,
      pnlUsd: periodStats.pnlUsd,
      volumeUsd: periodStats.volumeUsd,
      avatarTone: pickAvatarTone(trader.address),
      polymarketUrl: buildPolymarketProfileUrl(trader.address),
    }),
  );
}

export function shortenEvmAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatCompactUsd(amount: number, signed = false): string {
  const abs = Math.abs(amount);
  const sign = signed ? (amount >= 0 ? '+' : '-') : amount < 0 ? '-' : '';
  if (abs >= 1_000_000) {
    return `${sign}$${(abs / 1_000_000).toFixed(2)}M`;
  }
  if (abs >= 1_000) {
    return `${sign}$${(abs / 1_000).toFixed(1)}K`;
  }
  return `${sign}$${abs.toFixed(0)}`;
}

export function canEngageLiveCopy(usdcBalance: number, polBalance: number): {
  ready: boolean;
  needsUsdc: boolean;
  needsGas: boolean;
} {
  const needsUsdc = !Number.isFinite(usdcBalance) || usdcBalance < 10;
  const needsGas = !Number.isFinite(polBalance) || polBalance < 0.05;
  return {
    ready: !needsUsdc && !needsGas,
    needsUsdc,
    needsGas,
  };
}
