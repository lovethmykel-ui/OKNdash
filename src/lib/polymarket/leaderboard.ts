/**
 * Pure Polymarket Data API v2 normalization, performance analytics,
 * sparkline derivation, filtering, and formatting helpers.
 * Mirrors https://data-api.polymarket.com/v2 (no mock trader lists).
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
export type LeaderboardSort = 'pnl' | 'volume';

export type PolymarketApiTimePeriod = 'day' | 'week' | 'month' | 'all';
export type PolymarketApiCategory =
  | 'overall'
  | 'politics'
  | 'sports'
  | 'crypto'
  | 'finance'
  | 'economics'
  | 'tech';
export type PolymarketApiSortBy = 'PNL' | 'VOLUME';

/** Canonical live whale record mirrored from Polymarket Data API v2. */
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
  roiPct: number;
  avatarTone: string;
  polymarketUrl: string;
}

export interface LiveTraderPosition {
  title: string;
  outcome: string;
  avgPriceCents: number;
  currentPriceCents: number;
  currentValueUsd: number;
  entryCostUsd: number;
  totalPnlUsd: number;
  percentPnl: number;
  status: string;
  slug: string;
  eventSlug: string;
  icon: string | null;
}

export interface LiveTraderTrade {
  side: 'BUY' | 'SELL';
  type: string;
  outcome: string;
  title: string;
  usdcValue: number;
  priceCents: number;
  timestamp: number;
  slug: string;
  eventSlug: string;
  txHash: string;
  icon: string | null;
}

export interface WhalePerformanceSummary {
  openPositionsCount: number;
  winsCount: number;
  lossesCount: number;
  winRatePct: number | null;
  avgPositionSizeUsd: number | null;
  totalOpenValueUsd: number;
}

export interface LeaderboardPagination {
  limit: number;
  offset: number;
  hasMore: boolean;
  nextCursor: string | null;
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

export interface RawPolymarketV2Pagination {
  limit?: number;
  offset?: number;
  has_more?: boolean;
  next_cursor?: string;
}

export interface RawPolymarketV2PositionRow {
  title?: string;
  outcome?: string;
  avg_price?: number;
  current_price?: number;
  current_value?: number;
  entry_cost_usdc?: number;
  total_cost_usdc?: number;
  total_pnl?: number;
  realized_pnl?: number;
  unrealized_pnl?: number;
  percent_pnl?: number;
  status?: string;
  slug?: string;
  event_slug?: string;
  icon?: string;
}

export interface RawPolymarketV2ActivityRow {
  type?: string;
  side?: string;
  outcome?: string;
  title?: string;
  size?: number;
  usdc_size?: number;
  price?: number;
  timestamp?: number;
  slug?: string;
  event_slug?: string;
  transaction_hash?: string;
  icon?: string;
}

const AVATAR_TONES = [
  'from-[#7A12F5] to-[#4C1D95]',
  'from-[#2E5CFF] to-[#1E3A8A]',
  'from-[#0EA5E9] to-[#0369A1]',
  'from-[#10B981] to-[#047857]',
  'from-[#8B5CF6] to-[#6D28D9]',
  'from-[#F59E0B] to-[#B45309]',
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
  { key: 'day', label: '24H', shortLabel: '24H' },
  { key: 'week', label: '7D', shortLabel: '7D' },
  { key: 'month', label: '30D', shortLabel: '30D' },
  { key: 'all', label: 'All-Time', shortLabel: 'All' },
];

export function toPolymarketTimePeriod(tf: LeaderboardTimeframe): PolymarketApiTimePeriod {
  switch (tf) {
    case 'day':
      return 'day';
    case 'week':
      return 'week';
    case 'month':
      return 'month';
    case 'all':
      return 'all';
  }
}

export function toPolymarketCategory(cat: LeaderboardCategory): PolymarketApiCategory {
  switch (cat) {
    case 'Politics':
      return 'politics';
    case 'Sports':
      return 'sports';
    case 'Crypto':
      return 'crypto';
    case 'Finance':
      return 'finance';
    case 'Economics':
      return 'economics';
    case 'Tech':
      return 'tech';
    default:
      return 'overall';
  }
}

export function toPolymarketSortBy(sort: LeaderboardSort): PolymarketApiSortBy {
  return sort === 'volume' ? 'VOLUME' : 'PNL';
}

export function isValidEvmAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address.trim());
}

export function isValidPaginationCursor(cursor: string): boolean {
  return /^[A-Za-z0-9+/_=-]{1,512}$/.test(cursor);
}

export function sanitizeHttpsUrl(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:') return null;
    return parsed.toString();
  } catch {
    return null;
  }
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
 * Collapse those to `0x2c33...0563` so cards stay crisp and legible.
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
  return `https://polymarket.com/profile/${encodeURIComponent(address.trim())}`;
}

/**
 * Computes capital-efficiency ROI % from real PnL and Volume.
 * Bounded to keep extreme edge cases (near-zero volume) readable.
 */
export function computeReturnOnVolumePct(pnlUsd: number, volumeUsd: number): number {
  if (!Number.isFinite(pnlUsd) || !Number.isFinite(volumeUsd) || volumeUsd <= 0) {
    return 0;
  }
  const raw = (pnlUsd / volumeUsd) * 100;
  return Math.max(-999.9, Math.min(999.9, Number(raw.toFixed(2))));
}

export function normalizePolymarketV2Row(
  raw: RawPolymarketV2LeaderboardRow,
  index = 0,
): LiveLeaderboardTrader | null {
  const address = typeof raw.user_id === 'string' ? raw.user_id.trim() : '';
  if (!isValidEvmAddress(address)) {
    return null;
  }
  const rank = Number(raw.rank);
  const pnl = Number(raw.pnl);
  const volume = Number(raw.volume);
  const safePnl = Number.isFinite(pnl) ? pnl : 0;
  const safeVolume = Number.isFinite(volume) && volume >= 0 ? volume : 0;
  const rawUserName = typeof raw.user_name === 'string' ? raw.user_name.trim() : '';
  const { displayName, isAnonAddress } = formatPolymarketUsername(rawUserName, address);
  const profileImage = sanitizeHttpsUrl(raw.profile_image);
  const xUsernameRaw =
    typeof raw.x_username === 'string' ? raw.x_username.trim().replace(/^@+/, '') : '';

  return {
    rank: Number.isFinite(rank) && rank > 0 ? rank : index + 1,
    address,
    displayName,
    rawUserName,
    isAnonAddress,
    profileImage,
    xUsername: xUsernameRaw.length > 0 ? xUsernameRaw : null,
    verified: Boolean(raw.verified),
    pnlUsd: safePnl,
    volumeUsd: safeVolume,
    roiPct: computeReturnOnVolumePct(safePnl, safeVolume),
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

export function normalizeTraderPosition(
  raw: RawPolymarketV2PositionRow,
): LiveTraderPosition | null {
  const title = typeof raw.title === 'string' ? raw.title.trim() : '';
  if (!title) return null;
  const outcome =
    typeof raw.outcome === 'string' && raw.outcome.trim() ? raw.outcome.trim() : 'Yes';
  const avgPrice = Number(raw.avg_price ?? 0);
  const currentPrice = Number(raw.current_price ?? 0);
  const currentValueUsd = Number(raw.current_value ?? 0);
  const entryCostUsd = Number(raw.entry_cost_usdc ?? raw.total_cost_usdc ?? 0);
  const totalPnlUsd = Number(
    raw.total_pnl ?? (Number(raw.realized_pnl ?? 0) + Number(raw.unrealized_pnl ?? 0)),
  );
  const percentPnl = Number(raw.percent_pnl ?? 0);

  return {
    title,
    outcome,
    avgPriceCents: Number.isFinite(avgPrice) ? Math.round(avgPrice * 100) : 0,
    currentPriceCents: Number.isFinite(currentPrice) ? Math.round(currentPrice * 100) : 0,
    currentValueUsd: Number.isFinite(currentValueUsd) ? currentValueUsd : 0,
    entryCostUsd: Number.isFinite(entryCostUsd) ? entryCostUsd : 0,
    totalPnlUsd: Number.isFinite(totalPnlUsd) ? totalPnlUsd : 0,
    percentPnl: Number.isFinite(percentPnl) ? percentPnl : 0,
    status: typeof raw.status === 'string' && raw.status.trim() ? raw.status.trim() : 'OPEN',
    slug: typeof raw.slug === 'string' ? raw.slug : '',
    eventSlug: typeof raw.event_slug === 'string' ? raw.event_slug : '',
    icon: sanitizeHttpsUrl(raw.icon),
  };
}

export function normalizeTraderActivity(
  raw: RawPolymarketV2ActivityRow,
): LiveTraderTrade | null {
  const title = typeof raw.title === 'string' ? raw.title.trim() : '';
  if (!title) return null;

  const rawSide = String(raw.side ?? '').toUpperCase();
  const rawType = String(raw.type ?? 'TRADE').toUpperCase();
  const side: 'BUY' | 'SELL' =
    rawSide === 'SELL' ? 'SELL' : rawSide === 'BUY' ? 'BUY' : rawType === 'REDEEM' ? 'SELL' : 'BUY';

  const size = Number(raw.size ?? 0);
  const price = Number(raw.price ?? 0);
  const explicitUsdc = Number(raw.usdc_size);
  const usdcValue =
    Number.isFinite(explicitUsdc) && explicitUsdc > 0
      ? explicitUsdc
      : Number.isFinite(size * price)
        ? size * price
        : 0;
  const timestamp = Number(raw.timestamp ?? 0);

  return {
    side,
    type: rawType,
    outcome: typeof raw.outcome === 'string' && raw.outcome.trim() ? raw.outcome.trim() : 'Yes',
    title,
    usdcValue,
    priceCents: Number.isFinite(price) ? Math.round(price * 100) : 0,
    timestamp: Number.isFinite(timestamp) ? timestamp : 0,
    slug: typeof raw.slug === 'string' ? raw.slug : '',
    eventSlug: typeof raw.event_slug === 'string' ? raw.event_slug : '',
    txHash: typeof raw.transaction_hash === 'string' ? raw.transaction_hash : '',
    icon: sanitizeHttpsUrl(raw.icon),
  };
}

/**
 * Derives real position-level performance metrics (Wins/Losses, Win Rate %,
 * Avg Position Size, Open Positions Count) directly from Polymarket v2 positions.
 */
export function computeWhalePerformance(
  positions: LiveTraderPosition[],
): WhalePerformanceSummary {
  const openPositions = positions.filter((p) => p.status.toUpperCase() === 'OPEN' || p.currentValueUsd > 0);
  const scoredPositions = positions.filter((p) => Math.abs(p.totalPnlUsd) > 0.01);

  let winsCount = 0;
  let lossesCount = 0;
  for (const pos of scoredPositions) {
    if (pos.totalPnlUsd > 0) winsCount += 1;
    else if (pos.totalPnlUsd < 0) lossesCount += 1;
  }

  const totalScored = winsCount + lossesCount;
  const winRatePct =
    totalScored > 0 ? Number(((winsCount / totalScored) * 100).toFixed(1)) : null;

  const sizedPositions = openPositions.filter((p) => p.currentValueUsd > 0 || p.entryCostUsd > 0);
  const totalOpenValueUsd = sizedPositions.reduce(
    (sum, p) => sum + (p.currentValueUsd > 0 ? p.currentValueUsd : p.entryCostUsd),
    0,
  );
  const avgPositionSizeUsd =
    sizedPositions.length > 0 ? totalOpenValueUsd / sizedPositions.length : null;

  return {
    openPositionsCount: openPositions.length,
    winsCount,
    lossesCount,
    winRatePct,
    avgPositionSizeUsd,
    totalOpenValueUsd,
  };
}

/**
 * Builds a deterministic, visually faithful equity/PnL sparkline series
 * anchored to the whale's actual PnL direction, magnitude, and wallet seed.
 * Zero Math.random() so SSR and client hydration always match identically.
 */
export function buildDeterministicSparkline(
  address: string,
  pnlUsd: number,
  volumeUsd: number,
  points = 18,
): number[] {
  const clean = address.toLowerCase().replace(/^0x/, '');
  let seed = 2166136261;
  for (let i = 0; i < clean.length; i++) {
    seed ^= clean.charCodeAt(i);
    seed = Math.imul(seed, 16777619) >>> 0;
  }

  const direction = pnlUsd >= 0 ? 1 : -1;
  const roiRatio = volumeUsd > 0 ? Math.min(1, Math.abs(pnlUsd) / volumeUsd) : 0.25;
  const volatility = 0.08 + Math.min(0.28, roiRatio * 0.45);

  const values: number[] = [0];
  let current = 0;

  for (let i = 1; i < points; i++) {
    const progress = i / (points - 1);
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const unit = ((seed % 1000) / 1000) * 2 - 1; // [-1, 1]
    const target = direction * Math.pow(progress, 0.85);
    const pull = (target - current) * 0.42;
    const noise = unit * volatility * (1 - progress * 0.55);
    current = current + pull + noise;
    values.push(Number(current.toFixed(4)));
  }

  values[values.length - 1] = direction;
  return values;
}

/**
 * Summarizes aggregate live leaderboard metrics for the hero banner.
 */
export function summarizeLeaderboardHero(traders: LiveLeaderboardTrader[]): {
  trackedCount: number;
  combinedPnlUsd: number;
  combinedVolumeUsd: number;
  profitableCount: number;
} {
  let combinedPnlUsd = 0;
  let combinedVolumeUsd = 0;
  let profitableCount = 0;

  for (const t of traders) {
    combinedPnlUsd += t.pnlUsd;
    combinedVolumeUsd += t.volumeUsd;
    if (t.pnlUsd > 0) profitableCount += 1;
  }

  return {
    trackedCount: traders.length,
    combinedPnlUsd,
    combinedVolumeUsd,
    profitableCount,
  };
}

export function formatRelativeTime(unixSeconds: number, nowMs: number | null): string {
  if (!Number.isFinite(unixSeconds) || unixSeconds <= 0) return 'Recent';
  if (nowMs === null) return 'Live';
  const diffSec = Math.max(0, Math.floor(nowMs / 1000 - unixSeconds));
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

export function shortenEvmAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatCompactUsd(amount: number, signed = false): string {
  const abs = Math.abs(amount);
  const sign = signed ? (amount >= 0 ? '+' : '-') : amount < 0 ? '-' : '';
  if (abs >= 1_000_000_000) {
    return `${sign}$${(abs / 1_000_000_000).toFixed(2)}B`;
  }
  if (abs >= 1_000_000) {
    return `${sign}$${(abs / 1_000_000).toFixed(2)}M`;
  }
  if (abs >= 1_000) {
    return `${sign}$${(abs / 1_000).toFixed(1)}K`;
  }
  if (abs > 0 && abs < 10) {
    return `${sign}$${abs.toFixed(2)}`;
  }
  return `${sign}$${abs.toFixed(0)}`;
}

export function formatTradeUsd(amount: number): string {
  const abs = Math.abs(amount);
  if (abs >= 1_000) return formatCompactUsd(amount, false);
  if (abs > 0 && abs < 10) return `$${abs.toFixed(2)}`;
  return `$${abs.toFixed(0)}`;
}

export function formatSignedPct(pct: number): string {
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${pct.toFixed(2)}%`;
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
