/**
 * Pure Polymarket Leaderboard data, filtering, sorting, and formatting helpers.
 * Mirrors https://polymarket.com/leaderboard structure for the Copy tab.
 */

export type LeaderboardTimeframe = 'day' | 'week' | 'month' | 'all';
export type LeaderboardCategory = 'All' | 'Politics' | 'Crypto' | 'Economics' | 'Sports';
export type LeaderboardSort = 'pnl' | 'volume' | 'winRate';

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

export const POLYMARKET_LEADERBOARD_TRADERS: PolymarketLeaderboardTrader[] = [
  {
    id: 'pm-theo4',
    handle: '@Theo4',
    displayName: 'Theo4',
    address: '0x7b3291a4c8d1e0f23456789abcdef012345691a4',
    specialty: 'Politics',
    verified: true,
    avatarGradient: 'from-[#7A12F5] to-[#09B4FF]',
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
    avatarGradient: 'from-[#0066FF] to-[#10B981]',
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
    avatarGradient: 'from-[#F59E0B] to-[#EF4444]',
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
    avatarGradient: 'from-[#EC4899] to-[#8B5CF6]',
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
    avatarGradient: 'from-[#10B981] to-[#0EA5E9]',
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
    avatarGradient: 'from-[#6366F1] to-[#14B8A6]',
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
    avatarGradient: 'from-[#F97316] to-[#FACC15]',
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
    avatarGradient: 'from-[#06B6D4] to-[#3B82F6]',
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
    id: 'pm-defiarb',
    handle: '@DeFiArb_0x',
    displayName: 'DeFiArb_0x',
    address: '0xa4c8e20f1b3d5e79802468ace13579bdf024e20f',
    specialty: 'Crypto',
    verified: false,
    avatarGradient: 'from-[#8B5CF6] to-[#EC4899]',
    recentMarket: 'ETH staking ratio crosses 32% Q4',
    recentSide: 'YES',
    recentSizeUsd: 6900,
    stats: {
      day: { pnlUsd: 39800, volumeUsd: 315000, winRate: 80.0, trades: 15, roiPct: 15.2 },
      week: { pnlUsd: 192000, volumeUsd: 1390000, winRate: 77.5, trades: 52, roiPct: 19.3 },
      month: { pnlUsd: 618000, volumeUsd: 4280000, winRate: 75.8, trades: 149, roiPct: 22.9 },
      all: { pnlUsd: 1840500, volumeUsd: 11200000, winRate: 74.1, trades: 415, roiPct: 27.0 },
    },
  },
  {
    id: 'pm-oddsengine',
    handle: '@OddsEngine',
    displayName: 'OddsEngine',
    address: '0xe19c3b7a5d4f208192a3b4c5d6e7f8091a2b3b7a',
    specialty: 'Sports',
    verified: true,
    avatarGradient: 'from-[#22C55E] to-[#16A34A]',
    recentMarket: 'NBA Eastern Conference Finals series length > 5',
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
