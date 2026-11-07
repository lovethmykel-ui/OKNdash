/**
 * api/client.ts — Interactive Client-Side Demo Data Layer
 *
 * Replaces backend /api/* calls with an in-memory interactive demo store so
 * every screen, tab, action, and form in the OKN User Dashboard works out of
 * the box without any backend server.
 */
import type {
  Task,
  TaskCompletion,
  TaskCompletionStatus,
  TaskType,
  Purchase,
  SaleConfig,
  ClaimProofResponse,
  AdminRole,
  StreakInfo,
  CheckInResult,
  RewardConfig,
  LeaderboardResponse,
  LeaderboardWinner,
  LeaderboardPeriod,
  LeaderboardCategory,
  Mission,
  MissionWithProgress,
  CommunityMetric,
  CreateMissionInput,
  UpdateProfileInput,
} from '@okn/shared';
import { DEFAULT_DAILY_SCHEDULE, DEFAULT_LEADERBOARD_PRIZES, DEFAULT_PRESALE_MULTIPLIER } from '@okn/shared';

export type { StreakInfo, CheckInResult, RewardConfig };
export type {
  LeaderboardResponse,
  LeaderboardWinner,
  LeaderboardPeriod,
  LeaderboardCategory,
};
export type {
  Mission,
  MissionWithProgress,
  CommunityMetric,
  CreateMissionInput,
};

export interface AdminMission extends Mission {
  currentValue: string;
  eligibleUsers: number;
  projectedPayout: number;
}

export interface Portfolio {
  totalBought: string;
  totalClaimed: string;
  totalEarned: number;
  earnedBySource: { task: number; referral: number; bonus: number; admin: number };
  referralLevels: { l1: number; l2: number; l3: number };
  saleRate: string;
}

export class ApiError extends Error {
  details?: unknown;
  constructor(public status: number, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.details = details;
  }
}

const STATUS_MESSAGES: Record<number, string> = {
  400: 'Invalid request',
  401: 'You need to sign in',
  403: 'You do not have permission to do that',
  404: 'Not found',
  409: 'That action conflicts with existing data',
  422: 'Some of the details were invalid',
  429: 'Too many requests, please try again shortly',
  500: 'Something went wrong on our end',
  502: 'Service is temporarily unavailable',
  503: 'Service is temporarily unavailable',
  504: 'The request timed out',
};

export async function extractError(res: Response): Promise<[string, unknown?]> {
  const text = await res.text().catch(() => '');
  if (text) {
    try {
      const body = JSON.parse(text) as unknown;
      if (body && typeof body === 'object') {
        const obj = body as Record<string, unknown>;
        if (typeof obj.error === 'string' && obj.error.trim()) {
          return [obj.error, obj.details];
        }
      }
    } catch {
      // ignore
    }
  }
  return [STATUS_MESSAGES[res.status] ?? res.statusText ?? `Request failed (${res.status})`];
}

export type AdminRoleName = AdminRole;

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type ReferralStatus = 'pending' | 'eligible' | 'paid';

export type TaskWithStatus = Task & { completionStatus: TaskCompletionStatus | null };

export interface MeUser {
  id: string;
  telegramId: string | null;
  signupMethod?: 'telegram' | 'wallet';
  walletRewardClaimed?: boolean;
  telegramRewardClaimed?: boolean;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  photoUrl: string | null;
  email: string | null;
  emailVerifiedAt: string | null;
  walletAddress: string | null;
  walletBoundAt: string | null;
  adminRole: AdminRoleName | null;
  twoFactorEnabled: boolean;
  createdAt: string;
}

export interface ReferralLevelSummary {
  level: 1 | 2 | 3;
  count: number;
  pointsEarned: number;
}

export interface ReferralEntry {
  id: string;
  level: number;
  status: ReferralStatus;
  rewardPoints: number | null;
  createdAt: string;
  referredUsername: string | null;
  referredFirstName: string | null;
}

export interface ReferralInfo {
  link: string;
  count: number;
  pointsEarned: number;
  levels: [ReferralLevelSummary, ReferralLevelSummary, ReferralLevelSummary];
  recent: ReferralEntry[];
}

export interface AdminStats {
  users: number;
  bnbRaised: string;
  oknSold: string;
  purchaseCount: number;
  oknClaimed: string;
  claimCount: number;
  circulating: string | null;
  communityMinted: string | null;
  saleMinted: string | null;
}

export interface AdminUser {
  id: string;
  telegramId: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  photoUrl: string | null;
  email: string | null;
  emailVerifiedAt: string | null;
  walletAddress: string | null;
  walletBoundAt: string | null;
  adminRole: AdminRoleName | null;
  status: 'active' | 'suspended' | 'banned';
  createdAt: string;
  updatedAt: string;
  tokenVersion: number;
  bannedAt: string | null;
  bannedBy: string | null;
  banReason: string | null;
  deletedAt: string | null;
  twoFactorEnabled: boolean;
  lastLoginAt: string | null;
  lastLoginIp: string | null;
  points: number;
  referralCount: number;
  referredBy: { userId: string; label: string | null } | null;
}

export interface AdminClaimItem {
  id: string;
  userId: string;
  rootVersion: number;
  cumulativeEntitlement: string;
  amountClaimed: string;
  feePaid: string;
  txHash: string | null;
  claimedAt: string;
  username: string | null;
  firstName: string | null;
}

export interface AdminClaimsResponse {
  summary: {
    totalClaimed: string;
    claimCount: number;
    uncommittedPoints: number;
    pendingCompletions: number;
  };
  claims: Page<AdminClaimItem>;
}

export interface AdminCompletion {
  id: string;
  userId: string;
  taskId: string;
  status: TaskCompletionStatus;
  proofData: Record<string, unknown> | null;
  completedAt: string;
  verifiedAt: string | null;
  taskTitle: string;
  rewardPoints: number;
  username: string | null;
  firstName: string | null;
}

export type AdminTask = Task & { completionCount: number };

export interface CreateTaskInput {
  title: string;
  description?: string | null;
  type: TaskType;
  rewardPoints: number;
  config: {
    url?: string;
    verificationMethod: 'manual' | 'api' | 'url_click' | 'quiz_pass';
    platform?: string;
    action?: string;
    targetRef?: { keyword?: string; chatId?: string };
  };
  isActive?: boolean;
}

export type UpdateTaskInput = Partial<CreateTaskInput>;

export interface AuditLogEntry {
  id: string;
  adminId: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  txHash: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  adminUsername: string | null;
  adminFirstName: string | null;
}

export type MerkleRootStatus =
  | 'broadcasting'
  | 'pending_confirmation'
  | 'committed'
  | 'pending_safe'
  | 'failed';

export interface MerkleRootHistoryItem {
  id: string;
  rootVersion: number;
  rootHash: string;
  leafCount: number;
  totalLifetimePoints: string;
  txHash: string | null;
  committedBy: string | null;
  createdAt: string;
  status: MerkleRootStatus;
  confirmedAt: string | null;
  failureReason: string | null;
  adminUsername: string | null;
  adminFirstName: string | null;
}

export interface AdminActivityItem {
  id: string;
  userId: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  details: Record<string, unknown> | null;
  createdAt: string;
  username: string | null;
  firstName: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface AdminEmailLogItem {
  id: string;
  userId: string | null;
  toAddress: string;
  template: string;
  providerMessageId: string | null;
  status: string;
  sentAt: string;
  username: string | null;
  firstName: string | null;
}

export interface AdminPurchaseItem {
  id: string;
  userId: string | null;
  buyerWallet: string;
  bnbAmount: string;
  oknAmount: string;
  rate: string;
  txHash: string;
  blockNumber: string | null;
  createdAt: string;
  username: string | null;
  firstName: string | null;
}

export interface AdminTopBuyer {
  buyerWallet: string;
  username: string | null;
  totalBnb: string;
  totalOkn: string;
  buyCount: number;
}

export interface AdminPurchasesResponse {
  summary: { topBuyers: AdminTopBuyer[] };
  purchases: Page<AdminPurchaseItem>;
}

export interface AdminUserOverview {
  user: AdminUser;
  points: { committed: number; uncommitted: number };
  purchases: {
    totalBnb: string;
    totalOkn: string;
    count: number;
    recent: Array<{
      id: string;
      buyerWallet: string;
      bnbAmount: string;
      oknAmount: string;
      txHash: string | null;
      createdAt: string;
    }>;
  };
  claims: {
    totalClaimed: string;
    count: number;
    recent: Array<{
      id: string;
      amountClaimed: string;
      txHash: string | null;
      claimedAt: string;
    }>;
  };
  streak: { currentStreak: number; longestStreak: number; totalLogins: number } | null;
  referrals: { directCount: number; downlineCount: number; points: number };
  completions: Record<string, number>;
  latestActivity: AdminActivityItem[];
}

export interface AdminReferralTop {
  userId: string;
  username: string | null;
  firstName: string | null;
  directCount: number;
  downlineCount: number;
  points: number;
}

export interface AdminReferralEdge {
  id: string;
  referrerId: string;
  referredId: string;
  level: number;
  status: ReferralStatus;
  rewardPoints: number | null;
  createdAt: string;
  referrerUsername: string | null;
  referredUsername: string | null;
}

export interface AdminReferralFlagged {
  referrerId: string;
  referredId: string;
  referrerUsername: string | null;
  referredUsername: string | null;
  sharedIps: string[];
}

export interface AdminReferralsResponse {
  topReferrers: AdminReferralTop[];
  edges: Page<AdminReferralEdge>;
  flagged: AdminReferralFlagged[];
}

export interface AdminSystemHealth {
  indexer: {
    indexedBlockNumber: string | null;
    headBlockNumber: string | null;
    lagBlocks: number | null;
    latestEventAt: string | null;
  };
  rateSyncKeeper: { action: string; createdAt: string; newValue: unknown } | null;
  merkleRoots: {
    counts: {
      broadcasting: number;
      pending_confirmation: number;
      pending_safe: number;
      committed: number;
      failed: number;
    };
    inFlightPastGrace: number;
  };
  verificationJobs: {
    queued: number;
    running: number;
    retry: number;
    failed: number;
    oldestQueuedAgeMinutes: number | null;
  };
  saleConfig: {
    rate: string;
    priceUsd: string | null;
    minPurchase: string;
    capPerWallet: string;
    isPaused: boolean;
    updatedAt: string;
  } | null;
}

export interface SaleConfigUpdate {
  rate?: string;
  capPerWallet?: string;
  minPurchase?: string;
  bnbHardCap?: string;
  saleStart?: string | null;
  saleEnd?: string | null;
  isPaused?: boolean;
  saleMode?: 'draft' | 'public';
  priceUsd?: number;
  minPurchaseUsd?: number;
}

export interface PreparedSafeCall {
  fn: string;
  label: string;
  propose: Record<string, string | number> | null;
}

export interface SaleConfigResult {
  ok?: boolean;
  mode: string;
  message?: string;
  txHashes?: string[];
  calls?: PreparedSafeCall[];
  safeAppUrl?: string;
}

export interface CommitRootResult {
  pendingUsers: number;
  rootVersion: number | null;
  txHash: string | null;
  status: 'committed' | 'pending_confirmation' | 'pending_safe' | 'failed';
  message?: string;
  committedBy: string;
}

export interface BnbWithdrawBalance {
  tokenSale: { address: string | null; bnbBalance: string | null };
  distributor: {
    address: string | null;
    bnbBalance: string | null;
    treasury: string | null;
  };
  treasuryHint: string;
}

export interface BnbWithdrawInput {
  reason: 'token_sale' | 'distributor_fees';
  destination?: string;
  amount?: string;
}

export interface BnbWithdrawResult {
  ok?: boolean;
  mode: string;
  txHash?: string;
  description?: string;
  message?: string;
  target?: string;
  calldata?: string;
  value?: string;
}

export interface WalletRebindRequest {
  id: string;
  userId: string;
  oldWallet: string;
  newWallet: string;
  reason: 'lost_key' | 'compromised' | 'upgrade' | 'admin_fix' | null;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy: string | null;
  proofData: Record<string, unknown> | null;
  createdAt: string;
  resolvedAt: string | null;
  username: string | null;
  firstName: string | null;
  currentWallet: string | null;
  approverUsername: string | null;
  approverFirstName: string | null;
}

export interface RebindRequestInput {
  newWallet: `0x${string}`;
  signature: `0x${string}`;
  message: string;
  reason: 'lost_key' | 'compromised' | 'upgrade' | 'admin_fix';
}

export interface UnbindRequestInput {
  message: string;
  signature: `0x${string}`;
}

export interface SalePriceResponse extends SaleConfig {
  bnbUsd8?: string;
  bnbUsdUpdatedAt?: number;
  bnbUsdStale?: boolean;
  masked?: boolean;
}

// ============================================================================
// In-Memory Demo Store
// ============================================================================

const demoState = {
  user: {
    id: '00000000-0000-0000-0000-000000000000',
    telegramId: '1234567890',
    signupMethod: 'telegram' as const,
    walletRewardClaimed: true,
    telegramRewardClaimed: true,
    username: 'okndev',
    firstName: 'Dan',
    lastName: 'Evans',
    photoUrl: null,
    email: 'dan.evans@okntoken.com',
    emailVerifiedAt: '2026-02-15T10:00:00.000Z',
    walletAddress: '0xBF6B0312f52fa8390Ec9393A9375BF05c8E40377',
    walletBoundAt: '2026-01-14T09:32:00.000Z',
    adminRole: 'super_admin' as AdminRoleName | null,
    twoFactorEnabled: false,
    createdAt: '2025-11-03T14:20:00.000Z',
  } satisfies MeUser,
  points: 135,
  oknBalanceWei: 693_333n * 10n ** 18n,
  purchasedBnbWei: 1_500_000_000_000_000_000n,
  claimedOknWei: 250_000n * 10n ** 18n,
  claimedRoots: new Set<number>(),
  purchases: [
    {
      id: '44444444-4444-4444-8444-444444444401',
      userId: '00000000-0000-0000-0000-000000000000',
      buyerWallet: '0xBF6B0312f52fa8390Ec9393A9375BF05c8E40377',
      bnbAmount: 1000000000000000000n,
      oknAmount: 1000000000000000000000000n,
      rate: 1000000000000000000000000n,
      txHash: '0x3a4b881928019a7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a9f12',
      blockNumber: 41892104n,
      createdAt: new Date(Date.now() - 3600 * 1000 * 4),
    },
    {
      id: '44444444-4444-4444-8444-444444444402',
      userId: '00000000-0000-0000-0000-000000000000',
      buyerWallet: '0xBF6B0312f52fa8390Ec9393A9375BF05c8E40377',
      bnbAmount: 500000000000000000n,
      oknAmount: 500000000000000000000000n,
      rate: 1000000000000000000000000n,
      txHash: '0x88f1c9a0b2d4e6f813579bdf02468ace13579bdf02468ace13579bdf024611a2',
      blockNumber: 41850219n,
      createdAt: new Date(Date.now() - 3600 * 1000 * 48),
    },
  ] satisfies Purchase[],
  streak: {
    currentStreak: 6,
    longestStreak: 12,
    lastLoginDate: new Date(Date.now() - 86400 * 1000).toISOString().slice(0, 10),
    totalLogins: 24,
    checkedInToday: true,
    nextReward: 100,
    nextDay: 7,
  } satisfies StreakInfo,
  tasks: [
    {
      id: '11111111-1111-4111-8111-111111111101',
      title: 'Join OKN Official Telegram',
      description: 'Join our main Telegram community for daily announcements and ecosystem drops.',
      type: 'social_follow' as TaskType,
      rewardPoints: 50,
      config: {
        platform: 'telegram',
        action: 'join_group',
        url: 'https://t.me/okntest001_bot',
        verificationMethod: 'url_click' as const,
      },
      isActive: true,
      createdAt: new Date('2026-01-10T12:00:00Z'),
      completionStatus: 'verified' as TaskCompletionStatus | null,
    },
    {
      id: '11111111-1111-4111-8111-111111111102',
      title: 'Follow @OKNToken on X',
      description: 'Follow our official X account and turn on notifications for presale milestones.',
      type: 'social_follow' as TaskType,
      rewardPoints: 70,
      config: {
        platform: 'twitter',
        action: 'follow',
        url: 'https://x.com/okntoken',
        verificationMethod: 'url_click' as const,
      },
      isActive: true,
      createdAt: new Date('2026-01-11T12:00:00Z'),
      completionStatus: null as TaskCompletionStatus | null,
    },
    {
      id: '11111111-1111-4111-8111-111111111103',
      title: 'Join OKN Discord Server',
      description: 'Connect with fellow holders, trading agent testers, and core contributors.',
      type: 'social_follow' as TaskType,
      rewardPoints: 40,
      config: {
        platform: 'discord',
        action: 'join_server',
        url: 'https://discord.com',
        verificationMethod: 'url_click' as const,
      },
      isActive: true,
      createdAt: new Date('2026-01-12T12:00:00Z'),
      completionStatus: null as TaskCompletionStatus | null,
    },
    {
      id: '11111111-1111-4111-8111-111111111104',
      title: 'Retweet Presale Stage 2 Announcement',
      description: 'Share the Stage 2 fixed-rate presale announcement with your followers.',
      type: 'social_post' as TaskType,
      rewardPoints: 65,
      config: {
        platform: 'twitter',
        action: 'retweet',
        url: 'https://x.com/okntoken',
        verificationMethod: 'url_click' as const,
      },
      isActive: true,
      createdAt: new Date('2026-01-13T12:00:00Z'),
      completionStatus: 'verified' as TaskCompletionStatus | null,
    },
  ] satisfies TaskWithStatus[],
  missions: [
    {
      id: '22222222-2222-4222-8222-222222222201',
      metric: 'total_bnb' as CommunityMetric,
      threshold: '500000000000000000000',
      rewardPerUser: 500,
      title: 'Community Presale Softcap (500 BNB)',
      description: 'When total community presale contributions reach 500 BNB, every verified participant earns +500 OK Points.',
      status: 'active' as const,
      eligibilityCutoff: null,
      achievedAt: null,
      distributedAt: null,
      createdAt: '2026-01-15T00:00:00.000Z',
      currentValue: '342500000000000000000',
      progressPct: 68.5,
      eligible: true,
      received: false,
    },
    {
      id: '22222222-2222-4222-8222-222222222202',
      metric: 'telegram_members' as CommunityMetric,
      threshold: '25000',
      rewardPerUser: 250,
      title: '25,000 Telegram Community Members',
      description: 'Grow the global OKN Telegram community to 25,000 members to unlock a 250 OK Points drop.',
      status: 'active' as const,
      eligibilityCutoff: null,
      achievedAt: null,
      distributedAt: null,
      createdAt: '2026-01-20T00:00:00.000Z',
      currentValue: '19420',
      progressPct: 77.7,
      eligible: true,
      received: false,
    },
    {
      id: '22222222-2222-4222-8222-222222222203',
      metric: 'user_count' as CommunityMetric,
      threshold: '10000',
      rewardPerUser: 150,
      title: '10,000 Verified Dashboard Users',
      description: 'Milestone achieved! 10,000 early adopters onboarded to the OKN ecosystem.',
      status: 'distributed' as const,
      eligibilityCutoff: '2026-02-01T00:00:00.000Z',
      achievedAt: '2026-02-01T14:20:00.000Z',
      distributedAt: '2026-02-01T15:00:00.000Z',
      createdAt: '2026-01-05T00:00:00.000Z',
      currentValue: '12840',
      progressPct: 100,
      eligible: true,
      received: true,
    },
  ] satisfies MissionWithProgress[],
  notifications: [
    {
      id: 'notif-1',
      type: 'presale',
      title: 'Presale Stage 2 Live',
      body: 'Fixed-rate allocation (1 BNB = 1,000,000 $OKN) is active with a 5% whale bonus on 1+ BNB.',
      link: '/app/buy',
      read: false,
      createdAt: new Date(Date.now() - 3600 * 1000 * 3).toISOString(),
    },
    {
      id: 'notif-2',
      type: 'reward',
      title: '+50 OK Points Credited',
      body: 'Your Telegram community verification task was confirmed.',
      link: '/app/tasks',
      read: true,
      createdAt: new Date(Date.now() - 3600 * 1000 * 26).toISOString(),
    },
  ],
};

export function getDemoOknBalanceWei(): bigint {
  return demoState.oknBalanceWei;
}

export function getDemoPurchasedBnbWei(): bigint {
  return demoState.purchasedBnbWei;
}

export function getDemoWalletAddress(): `0x${string}` {
  return (demoState.user.walletAddress ?? '0xBF6B0312f52fa8390Ec9393A9375BF05c8E40377') as `0x${string}`;
}

function buildLeaderboardEntries(category: LeaderboardCategory, period: LeaderboardPeriod) {
  const multiplier = period === 'all_time' ? 1 : period === 'monthly' ? 0.6 : 0.25;
  const raw = [
    { id: '33333333-3333-4333-8333-333333333301', username: 'satoshi_whale', firstName: 'Satoshi', refs: 142, tasks: 12500, bnb: 42.5 },
    { id: '33333333-3333-4333-8333-333333333302', username: 'alpha_capital', firstName: 'Elena', refs: 98, tasks: 9800, bnb: 31.0 },
    { id: '33333333-3333-4333-8333-333333333303', username: 'bsc_degen', firstName: 'Marcus', refs: 76, tasks: 8400, bnb: 24.8 },
    { id: '33333333-3333-4333-8333-333333333304', username: 'quant_ninja', firstName: 'Kenji', refs: 64, tasks: 7150, bnb: 19.2 },
    { id: '33333333-3333-4333-8333-333333333305', username: 'defi_architect', firstName: 'aria', refs: 51, tasks: 6300, bnb: 15.0 },
    { id: '00000000-0000-0000-0000-000000000000', username: demoState.user.username, firstName: demoState.user.firstName, refs: 14, tasks: demoState.points * 35, bnb: 12.4 },
    { id: '33333333-3333-4333-8333-333333333307', username: 'poly_copier', firstName: 'Liam', refs: 29, tasks: 4100, bnb: 9.5 },
    { id: '33333333-3333-4333-8333-333333333308', username: 'bnb_maximalist', firstName: 'Chloe', refs: 22, tasks: 3450, bnb: 7.2 },
  ];

  const entries = raw.map((row, idx) => {
    let score = '0';
    if (category === 'referrals') {
      score = String(Math.max(1, Math.round(row.refs * multiplier)));
    } else if (category === 'tasks') {
      score = String(Math.max(50, Math.round(row.tasks * multiplier)));
    } else {
      const wei = BigInt(Math.max(1, Math.round(row.bnb * multiplier * 100))) * 10_000_000_000_000_000n;
      score = wei.toString();
    }
    return {
      rank: idx + 1,
      userId: row.id,
      username: row.username,
      firstName: row.firstName,
      score,
      isMe: row.id === demoState.user.id,
    };
  });

  const myRank = entries.find((e) => e.isMe) ?? null;
  return { entries, myRank };
}

export const api = {
  // Auth & Binding
  loginWithWallet: async (input: { address: string; message: string; signature: string }) => {
    demoState.user = {
      ...demoState.user,
      walletAddress: input.address,
      walletBoundAt: new Date().toISOString(),
    };
    return { ok: true as const, user: { ...demoState.user } };
  },
  bindTelegram: async (_input: { authData: Record<string, string | number> }) => ({
    ok: true as const,
    telegramId: demoState.user.telegramId ?? '1234567890',
    rewardAwarded: true,
    points: 50,
  }),
  getTelegramBindToken: async () => ({
    ok: true as const,
    token: 'demo_bind_token_okn',
    botUsername: 'okntest001_bot',
    deepLink: 'https://t.me/okntest001_bot?start=bind_demo_token',
    expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  }),

  // Session user
  getMe: async () => ({ user: { ...demoState.user } }),
  updateProfile: async (input: UpdateProfileInput) => {
    demoState.user = {
      ...demoState.user,
      ...(input.firstName !== undefined ? { firstName: input.firstName } : {}),
      ...(input.lastName !== undefined ? { lastName: input.lastName } : {}),
      ...(input.email !== undefined
        ? {
            email: input.email,
            emailVerifiedAt: input.email ? demoState.user.emailVerifiedAt : null,
          }
        : {}),
    };
    return { user: { ...demoState.user } };
  },
  sendEmailVerification: async () => ({ ok: true as const, devCode: '482910' }),
  verifyEmail: async (_code: string) => {
    demoState.user = {
      ...demoState.user,
      emailVerifiedAt: new Date().toISOString(),
    };
    return { user: { ...demoState.user } };
  },

  // Two-factor auth
  setup2fa: async () => ({
    secret: 'JBSWY3DPEHPK3PXP',
    otpauth: 'otpauth://totp/OKN:dan.evans@okntoken.com?secret=JBSWY3DPEHPK3PXP&issuer=OKN',
    qrDataUrl:
      'https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=otpauth://totp/OKN:dan.evans@okntoken.com?secret=JBSWY3DPEHPK3PXP',
  }),
  enable2fa: async (_code: string) => {
    demoState.user = { ...demoState.user, twoFactorEnabled: true };
    return {
      ok: true as const,
      backupCodes: ['OKN-8492-1102', 'OKN-3910-4481', 'OKN-7721-9034', 'OKN-5519-2840'],
    };
  },
  disable2fa: async (_code: string) => {
    demoState.user = { ...demoState.user, twoFactorEnabled: false };
    return { ok: true as const };
  },

  // Referrals
  getReferralInfo: async (): Promise<ReferralInfo> => ({
    link: 'https://t.me/okntest001_bot?start=ref_dev',
    count: 14,
    pointsEarned: 1420,
    levels: [
      { level: 1, count: 8, pointsEarned: 980 },
      { level: 2, count: 4, pointsEarned: 320 },
      { level: 3, count: 2, pointsEarned: 120 },
    ],
    recent: [
      {
        id: 'ref-1',
        level: 1,
        status: 'paid',
        rewardPoints: 180,
        createdAt: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
        referredUsername: 'alex_web3',
        referredFirstName: 'Alex Carter',
      },
      {
        id: 'ref-2',
        level: 1,
        status: 'paid',
        rewardPoints: 150,
        createdAt: new Date(Date.now() - 3600 * 1000 * 7).toISOString(),
        referredUsername: 'nina_eth',
        referredFirstName: 'Nina Vance',
      },
      {
        id: 'ref-3',
        level: 1,
        status: 'paid',
        rewardPoints: 140,
        createdAt: new Date(Date.now() - 3600 * 1000 * 19).toISOString(),
        referredUsername: 'marco_bsc',
        referredFirstName: 'Marco Silva',
      },
      {
        id: 'ref-4',
        level: 2,
        status: 'paid',
        rewardPoints: 95,
        createdAt: new Date(Date.now() - 3600 * 1000 * 28).toISOString(),
        referredUsername: 'elena_defi',
        referredFirstName: 'Elena Rostova',
      },
      {
        id: 'ref-5',
        level: 1,
        status: 'paid',
        rewardPoints: 125,
        createdAt: new Date(Date.now() - 3600 * 1000 * 41).toISOString(),
        referredUsername: 'liam_sol',
        referredFirstName: 'Liam K.',
      },
      {
        id: 'ref-6',
        level: 1,
        status: 'eligible',
        rewardPoints: 110,
        createdAt: new Date(Date.now() - 3600 * 1000 * 54).toISOString(),
        referredUsername: 'zara_quant',
        referredFirstName: 'Zara Al-Mansoor',
      },
      {
        id: 'ref-7',
        level: 2,
        status: 'paid',
        rewardPoints: 85,
        createdAt: new Date(Date.now() - 3600 * 1000 * 72).toISOString(),
        referredUsername: 'kenji_trades',
        referredFirstName: 'Kenji Sato',
      },
      {
        id: 'ref-8',
        level: 1,
        status: 'paid',
        rewardPoints: 115,
        createdAt: new Date(Date.now() - 3600 * 1000 * 96).toISOString(),
        referredUsername: 'david_okn',
        referredFirstName: 'David Okafor',
      },
      {
        id: 'ref-9',
        level: 3,
        status: 'paid',
        rewardPoints: 65,
        createdAt: new Date(Date.now() - 3600 * 1000 * 118).toISOString(),
        referredUsername: 'sophia_vault',
        referredFirstName: 'Sophia Chen',
      },
      {
        id: 'ref-10',
        level: 1,
        status: 'paid',
        rewardPoints: 95,
        createdAt: new Date(Date.now() - 3600 * 1000 * 140).toISOString(),
        referredUsername: 'lucas_nodes',
        referredFirstName: 'Lucas Meyer',
      },
      {
        id: 'ref-11',
        level: 2,
        status: 'eligible',
        rewardPoints: 75,
        createdAt: new Date(Date.now() - 3600 * 1000 * 168).toISOString(),
        referredUsername: 'maya_chain',
        referredFirstName: 'Maya Patel',
      },
      {
        id: 'ref-12',
        level: 1,
        status: 'pending',
        rewardPoints: 65,
        createdAt: new Date(Date.now() - 3600 * 1000 * 192).toISOString(),
        referredUsername: 'omar_whale',
        referredFirstName: 'Omar Haddad',
      },
      {
        id: 'ref-13',
        level: 2,
        status: 'paid',
        rewardPoints: 65,
        createdAt: new Date(Date.now() - 3600 * 1000 * 216).toISOString(),
        referredUsername: 'chloe_dex',
        referredFirstName: 'Chloe Laurent',
      },
      {
        id: 'ref-14',
        level: 3,
        status: 'pending',
        rewardPoints: 55,
        createdAt: new Date(Date.now() - 3600 * 1000 * 240).toISOString(),
        referredUsername: 'ryan_alpha',
        referredFirstName: 'Ryan Brooks',
      },
    ],
  }),

  // Tasks
  getTasks: async (): Promise<TaskWithStatus[]> => demoState.tasks.map((t) => ({ ...t })),
  completeTask: async (taskId: string, proofData?: Record<string, unknown>): Promise<TaskCompletion> => {
    const task = demoState.tasks.find((t) => t.id === taskId);
    if (task && !task.completionStatus) {
      task.completionStatus = 'verified';
      demoState.points += task.rewardPoints;
    }
    return {
      id: `comp-${Date.now()}`,
      userId: demoState.user.id,
      taskId,
      status: 'verified',
      proofData: proofData ?? null,
      completedAt: new Date(),
      verifiedAt: new Date(),
      rejectionReason: null,
    };
  },

  // Claims
  getClaimEligibility: async () => ({
    points: demoState.points,
    latestRootVersion: 3,
  }),
  getClaimProof: async (_rootVersion: number): Promise<ClaimProofResponse> => ({
    account: demoState.user.walletAddress ?? '0xBF6B0312f52fa8390Ec9393A9375BF05c8E40377',
    cumulativeEntitlement: 250000000000000000000000n,
    proof: [
      '0x8a35acfbc15ff81a39ae7d344fd709f28e8600b4aa8c65c6b64bfe7fe36bd19b',
      '0x4e07408562bedb8b60ce05c1decfe3ad16b72230967de01f640b7e4729b49fce',
    ],
  }),

  // Sale
  getSalePrice: async (): Promise<SalePriceResponse | null> => ({
    id: 1,
    rate: '1000000000000000000000000', // 1,000,000 OKN per 1 BNB
    capPerWallet: '50000000000000000000', // 50 BNB
    minPurchase: '10000000000000000', // 0.01 BNB
    bnbHardCap: '500000000000000000000', // 500 BNB
    treasury: '0x46fC09a84C23c94Ea6853450253C050be44dB751',
    saleStart: new Date(Date.now() - 86400 * 1000 * 7),
    saleEnd: new Date(Date.now() + 86400 * 1000 * 30),
    isPaused: false,
    priceUsd: '60000', // $0.00060 in 8 decimals
    minPurchaseUsd: '1000000000', // $10
    saleMode: 'public',
    updatedAt: new Date(),
    bnbUsd8: '60000000000', // $600.00
    bnbUsdUpdatedAt: Math.floor(Date.now() / 1000) - 30,
    bnbUsdStale: false,
    masked: false,
  }),
  getPurchaseHistory: async (): Promise<Purchase[]> =>
    demoState.purchases.map((p) => ({ ...p })),

  // Rewards (daily login)
  getStreak: async (): Promise<StreakInfo> => ({ ...demoState.streak }),
  checkIn: async (): Promise<CheckInResult> => {
    if (demoState.streak.checkedInToday) {
      return {
        awarded: false,
        day: demoState.streak.currentStreak,
        points: 0,
        currentStreak: demoState.streak.currentStreak,
        longestStreak: demoState.streak.longestStreak,
      };
    }
    const reward = demoState.streak.nextReward ?? 30;
    const nextStreak = demoState.streak.currentStreak + 1;
    const longest = Math.max(demoState.streak.longestStreak, nextStreak);
    demoState.streak = {
      ...demoState.streak,
      currentStreak: nextStreak,
      longestStreak: longest,
      lastLoginDate: new Date().toISOString().slice(0, 10),
      totalLogins: demoState.streak.totalLogins + 1,
      checkedInToday: true,
      nextReward: null,
      nextDay: nextStreak + 1,
    };
    demoState.points += reward;
    return {
      awarded: true,
      day: nextStreak,
      points: reward,
      currentStreak: nextStreak,
      longestStreak: longest,
    };
  },

  // Portfolio
  getPortfolio: async (): Promise<Portfolio> => ({
    totalBought: demoState.oknBalanceWei.toString(),
    totalClaimed: demoState.claimedOknWei.toString(),
    totalEarned: demoState.points,
    earnedBySource: {
      task: Math.max(80, demoState.points - 55),
      referral: 35,
      bonus: 20,
      admin: 0,
    },
    referralLevels: { l1: 8, l2: 4, l3: 2 },
    saleRate: '1000000000000000000000000',
  }),

  // Leaderboard
  getLeaderboard: async (params: {
    category: LeaderboardCategory;
    period: LeaderboardPeriod;
    limit?: number;
  }): Promise<LeaderboardResponse> => {
    const { entries, myRank } = buildLeaderboardEntries(params.category, params.period);
    return {
      period: params.period,
      category: params.category,
      periodKey: params.period === 'all_time' ? null : params.period === 'weekly' ? '2026-W45' : '2026-11',
      entries: entries.slice(0, params.limit ?? 50),
      myRank,
    };
  },
  getLeaderboardWinners: async (
    params: { period?: LeaderboardPeriod; category?: LeaderboardCategory; limit?: number } = {},
  ): Promise<{ winners: LeaderboardWinner[] }> => {
    const winners: LeaderboardWinner[] = [
      {
        period: params.period ?? 'weekly',
        periodKey: '2026-W44',
        category: params.category ?? 'referrals',
        rank: 1,
        userId: '33333333-3333-4333-8333-333333333301',
        username: 'satoshi_whale',
        firstName: 'Satoshi',
        score: '48',
        pointsAwarded: 500,
        snapshotAt: '2026-11-01T00:00:00.000Z',
      },
      {
        period: params.period ?? 'weekly',
        periodKey: '2026-W44',
        category: params.category ?? 'referrals',
        rank: 2,
        userId: '33333333-3333-4333-8333-333333333302',
        username: 'alpha_capital',
        firstName: 'Elena',
        score: '34',
        pointsAwarded: 300,
        snapshotAt: '2026-11-01T00:00:00.000Z',
      },
      {
        period: params.period ?? 'weekly',
        periodKey: '2026-W44',
        category: params.category ?? 'referrals',
        rank: 3,
        userId: '33333333-3333-4333-8333-333333333303',
        username: 'bsc_degen',
        firstName: 'Marcus',
        score: '27',
        pointsAwarded: 200,
        snapshotAt: '2026-11-01T00:00:00.000Z',
      },
    ];
    return { winners };
  },

  // Missions
  getMissions: async (): Promise<{ missions: MissionWithProgress[] }> => ({
    missions: demoState.missions.map((m) => ({ ...m })),
  }),
  getAdminMissions: async () => ({
    missions: demoState.missions.map((m) => ({
      ...m,
      eligibleUsers: 1420,
      projectedPayout: m.rewardPerUser * 1420,
    })),
    eligibleUsers: 1420,
  }),
  createMission: async (input: CreateMissionInput): Promise<Mission> => {
    const newMission: MissionWithProgress = {
      id: `22222222-2222-4222-8222-${String(Date.now()).slice(-12)}`,
      metric: input.metric,
      threshold: String(input.threshold),
      rewardPerUser: input.rewardPerUser,
      title: input.title,
      description: input.description ?? null,
      status: 'active',
      eligibilityCutoff: null,
      achievedAt: null,
      distributedAt: null,
      createdAt: new Date().toISOString(),
      currentValue: '0',
      progressPct: 0,
      eligible: true,
      received: false,
    };
    demoState.missions.unshift(newMission);
    return newMission;
  },
  updateMission: async (
    id: string,
    input: Partial<{ threshold: string; rewardPerUser: number; title: string; description: string }>,
  ): Promise<Mission> => {
    const existing = demoState.missions.find((m) => m.id === id) ?? demoState.missions[0]!;
    Object.assign(existing, input);
    return { ...existing };
  },
  deleteMission: async (id: string) => {
    demoState.missions = demoState.missions.filter((m) => m.id !== id);
    return { ok: true as const };
  },
  triggerMission: async (id: string) => ({
    id,
    status: 'distributed',
    achieved: true,
    distributedTo: 1420,
  }),

  // Auth
  telegramLogin: async (_authData: string) => ({ ok: true as const }),
  telegramInitData: async (_initData: string) => ({ ok: true as const }),

  // Admin
  getAdminStats: async (): Promise<AdminStats> => ({
    users: 12840,
    bnbRaised: '342500000000000000000',
    oknSold: '342500000000000000000000000',
    purchaseCount: 842,
    oknClaimed: '48200000000000000000000000',
    claimCount: 319,
    circulating: '390700000000000000000000000',
    communityMinted: '48200000000000000000000000',
    saleMinted: '342500000000000000000000000',
  }),
  getAdminUsers: async (opts?: { page?: number; pageSize?: number; q?: string }): Promise<Page<AdminUser>> => ({
    items: [
      {
        ...demoState.user,
        telegramId: demoState.user.telegramId ?? '1234567890',
        status: 'active',
        updatedAt: new Date().toISOString(),
        tokenVersion: 1,
        bannedAt: null,
        bannedBy: null,
        banReason: null,
        deletedAt: null,
        lastLoginAt: new Date().toISOString(),
        lastLoginIp: '127.0.0.1',
        points: demoState.points,
        referralCount: 14,
        referredBy: null,
      },
    ],
    total: 1,
    page: opts?.page ?? 1,
    pageSize: opts?.pageSize ?? 25,
  }),
  getAdminClaims: async (opts?: { page?: number; pageSize?: number }): Promise<AdminClaimsResponse> => ({
    summary: {
      totalClaimed: '48200000000000000000000000',
      claimCount: 319,
      uncommittedPoints: 14500,
      pendingCompletions: 0,
    },
    claims: {
      items: [],
      total: 0,
      page: opts?.page ?? 1,
      pageSize: opts?.pageSize ?? 25,
    },
  }),
  getAdminLeaderboardWinners: async () => [],
  triggerLeaderboardSnapshot: async (period: 'weekly' | 'monthly') => ({
    ok: true as const,
    period,
    periodKey: period === 'weekly' ? '2026-W45' : '2026-11',
  }),
  getAdminCompletions: async (
    _status: TaskCompletionStatus | 'all' = 'pending',
    opts?: { page?: number; pageSize?: number; q?: string },
  ): Promise<Page<AdminCompletion>> => ({
    items: [],
    total: 0,
    page: opts?.page ?? 1,
    pageSize: opts?.pageSize ?? 25,
  }),
  moderateCompletion: async (id: string, action: 'verify' | 'reject', reason?: string): Promise<TaskCompletion> => ({
    id,
    userId: demoState.user.id,
    taskId: demoState.tasks[0]!.id,
    status: action === 'verify' ? 'verified' : 'rejected',
    proofData: null,
    completedAt: new Date(),
    verifiedAt: new Date(),
    rejectionReason: reason ?? null,
  }),
  getPendingCompletionsCount: async () => ({ pending: 0 }),
  getAdminTasks: async (opts?: { page?: number; pageSize?: number; q?: string }): Promise<Page<AdminTask>> => ({
    items: demoState.tasks.map((t) => ({ ...t, completionCount: 412 })),
    total: demoState.tasks.length,
    page: opts?.page ?? 1,
    pageSize: opts?.pageSize ?? 25,
  }),
  createTask: async (input: CreateTaskInput): Promise<Task> => {
    const created: TaskWithStatus = {
      id: `11111111-1111-4111-8111-${String(Date.now()).slice(-12)}`,
      title: input.title,
      description: input.description ?? null,
      type: input.type,
      rewardPoints: input.rewardPoints,
      config: input.config,
      isActive: input.isActive ?? true,
      createdAt: new Date(),
      completionStatus: null,
    };
    demoState.tasks.push(created);
    return created;
  },
  toggleTask: async (id: string, isActive: boolean): Promise<Task> => {
    const task = demoState.tasks.find((t) => t.id === id) ?? demoState.tasks[0]!;
    task.isActive = isActive;
    return { ...task };
  },
  updateTask: async (id: string, input: UpdateTaskInput): Promise<Task> => {
    const task = demoState.tasks.find((t) => t.id === id) ?? demoState.tasks[0]!;
    Object.assign(task, input);
    return { ...task };
  },
  deleteTask: async (id: string) => {
    demoState.tasks = demoState.tasks.filter((t) => t.id !== id);
    return { ok: true as const };
  },
  getAuditLogs: async (opts?: { page?: number; pageSize?: number; q?: string }): Promise<Page<AuditLogEntry>> => ({
    items: [],
    total: 0,
    page: opts?.page ?? 1,
    pageSize: opts?.pageSize ?? 25,
  }),
  getAdminMerkleRoots: async (
    _status: MerkleRootStatus | 'all' = 'all',
    opts?: { page?: number; pageSize?: number },
  ): Promise<Page<MerkleRootHistoryItem>> => ({
    items: [
      {
        id: 'root-3',
        rootVersion: 3,
        rootHash: '0x8a35acfbc15ff81a39ae7d344fd709f28e8600b4aa8c65c6b64bfe7fe36bd19b',
        leafCount: 4120,
        totalLifetimePoints: '1850000',
        txHash: '0x99a1b2c3d4e5f60123456789abcdef0123456789abcdef0123456789abcdef01',
        committedBy: demoState.user.id,
        createdAt: new Date(Date.now() - 86400 * 1000 * 2).toISOString(),
        status: 'committed',
        confirmedAt: new Date(Date.now() - 86400 * 1000 * 2).toISOString(),
        failureReason: null,
        adminUsername: 'okndev',
        adminFirstName: 'Dan',
      },
    ],
    total: 1,
    page: opts?.page ?? 1,
    pageSize: opts?.pageSize ?? 25,
  }),
  updateSaleConfig: async (_input: SaleConfigUpdate): Promise<SaleConfigResult> => ({
    ok: true,
    mode: 'demo',
    message: 'Sale configuration updated in demo mode.',
  }),
  getRewardConfig: async (): Promise<RewardConfig> => ({
    id: 1,
    referralLevels: { level1Pct: 10, level2Pct: 5, level3Pct: 2 },
    dailySchedule: DEFAULT_DAILY_SCHEDULE,
    leaderboardPrizes: DEFAULT_LEADERBOARD_PRIZES,
    missionDefaults: null,
    presaleMultiplier: DEFAULT_PRESALE_MULTIPLIER,
    updatedAt: new Date().toISOString(),
  }),
  updateRewardConfig: async (_input: Partial<RewardConfig>): Promise<RewardConfig> => ({
    id: 1,
    referralLevels: { level1Pct: 10, level2Pct: 5, level3Pct: 2 },
    dailySchedule: DEFAULT_DAILY_SCHEDULE,
    leaderboardPrizes: DEFAULT_LEADERBOARD_PRIZES,
    missionDefaults: null,
    presaleMultiplier: DEFAULT_PRESALE_MULTIPLIER,
    updatedAt: new Date().toISOString(),
  }),
  commitRoot: async (): Promise<CommitRootResult> => ({
    pendingUsers: 0,
    rootVersion: 4,
    txHash: '0x77b1c2d3e4f5061728394a5b6c7d8e9f0123456789abcdef0123456789abcdef',
    status: 'committed',
    committedBy: demoState.user.id,
  }),
  setUserRole: async (userId: string, role: AdminRoleName) => ({
    ok: true as const,
    userId,
    oldRole: 'admin',
    newRole: role,
  }),
  createAdmin: async (input: {
    telegramId: string;
    username?: string;
    firstName?: string;
    role: AdminRoleName;
  }) => ({
    ok: true,
    mode: 'created' as const,
    userId: '55555555-5555-4555-8555-555555555555',
    telegramId: input.telegramId,
    role: input.role,
  }),
  removeAdmin: async (userId: string) => ({
    ok: true,
    mode: 'removed' as const,
    userId,
    removedRole: 'admin' as AdminRoleName | null,
  }),
  moderateUser: async (_userId: string, _status: 'active' | 'suspended' | 'banned', _reason?: string) => ({
    ok: true as const,
  }),
  getBnbWithdrawBalance: async (): Promise<BnbWithdrawBalance> => ({
    tokenSale: {
      address: '0x46fC09a84C23c94Ea6853450253C050be44dB751',
      bnbBalance: '42500000000000000000',
    },
    distributor: {
      address: '0xC0e7a1cEB339B7a35Af81D2AE7705f7d8456C4a9',
      bnbBalance: '3800000000000000000',
      treasury: '0x46fC09a84C23c94Ea6853450253C050be44dB751',
    },
    treasuryHint: '0x46fC09a84C23c94Ea6853450253C050be44dB751',
  }),
  withdrawBnb: async (_input: BnbWithdrawInput): Promise<BnbWithdrawResult> => ({
    ok: true,
    mode: 'demo',
    txHash: '0x66a1b2c3d4e5f60123456789abcdef0123456789abcdef0123456789abcdef02',
    message: 'Withdrawal simulated in demo mode.',
  }),
  getClaimFee: async () => ({
    feeUsd: '150000000',
    feeUsdDisplay: 1.5,
    requiredBnb: '2500000000000000',
  }),
  updateClaimFee: async (_input: { feeUsd: number }) => ({
    ok: true,
    mode: 'demo',
    message: 'Claim fee updated in demo mode.',
  }),
  getBnbPrice: async () => ({
    price8: '60000000000',
    priceUsd: 600,
    updatedAt: Math.floor(Date.now() / 1000) - 20,
    stale: false,
  }),
  triggerRateSync: async () => ({
    ok: true,
    action: 'noop' as const,
    driftBps: 12,
    txHash: null,
    safeTxHash: null,
  }),
  getRebindRequests: async (
    _status: 'pending' | 'approved' | 'rejected' | 'all' = 'pending',
    opts?: { page?: number; pageSize?: number; q?: string },
  ): Promise<Page<WalletRebindRequest>> => ({
    items: [],
    total: 0,
    page: opts?.page ?? 1,
    pageSize: opts?.pageSize ?? 25,
  }),
  decideRebind: async (id: string, action: 'approve' | 'reject') => ({
    ok: true,
    status: action === 'approve' ? 'approved' : 'rejected',
    userId: id,
  }),
  submitRebindRequest: async (input: RebindRequestInput) => {
    demoState.user = {
      ...demoState.user,
      walletAddress: input.newWallet,
      walletBoundAt: new Date().toISOString(),
    };
    return {
      ok: true as const,
      id: `rebind-${Date.now()}`,
      status: 'pending',
      message: 'Wallet rebind request submitted in demo mode.',
    };
  },
  unbindWallet: async (_input: UnbindRequestInput) => {
    demoState.user = {
      ...demoState.user,
      walletAddress: null,
      walletBoundAt: null,
    };
    return { ok: true as const };
  },
  safeGetPending: async () => ({ proposals: [], safeInfo: null }),
  safeGetHistory: async (opts?: { page?: number; pageSize?: number }) => ({
    proposals: [],
    total: 0,
    page: opts?.page ?? 1,
    pageSize: opts?.pageSize ?? 25,
  }),
  safePropose: async (_input: Record<string, unknown>) => ({
    ok: true,
    safeTxHash: '0x55a1b2c3d4e5f60123456789abcdef0123456789abcdef0123456789abcdef03',
    action: 'proposed',
  }),
  safeSign: async (_input: { safeTxHash: string; signature: string }) => ({ ok: true }),
  safeReject: async (_input: { proposalId: string; reason: string }) => ({ ok: true }),
  safeExecute: async (_input: { proposalId: string }) => ({
    ok: true,
    txHash: '0x44a1b2c3d4e5f60123456789abcdef0123456789abcdef0123456789abcdef04',
  }),
  getAdminActivity: async (opts?: { page?: number; pageSize?: number; q?: string; action?: string }): Promise<Page<AdminActivityItem>> => ({
    items: [],
    total: 0,
    page: opts?.page ?? 1,
    pageSize: opts?.pageSize ?? 25,
  }),
  getAdminUserActivity: async (_userId: string, opts?: { page?: number; pageSize?: number }): Promise<Page<AdminActivityItem>> => ({
    items: [],
    total: 0,
    page: opts?.page ?? 1,
    pageSize: opts?.pageSize ?? 25,
  }),
  getAdminEmailLog: async (opts?: {
    page?: number;
    pageSize?: number;
    q?: string;
    status?: string;
    userId?: string;
  }): Promise<Page<AdminEmailLogItem>> => ({
    items: [],
    total: 0,
    page: opts?.page ?? 1,
    pageSize: opts?.pageSize ?? 25,
  }),
  getAdminPurchases: async (opts?: { page?: number; pageSize?: number; q?: string }): Promise<AdminPurchasesResponse> => ({
    summary: { topBuyers: [] },
    purchases: {
      items: [],
      total: 0,
      page: opts?.page ?? 1,
      pageSize: opts?.pageSize ?? 25,
    },
  }),
  getAdminUserOverview: async (_userId: string): Promise<AdminUserOverview> => ({
    user: {
      ...demoState.user,
      telegramId: demoState.user.telegramId ?? '1234567890',
      status: 'active',
      updatedAt: new Date().toISOString(),
      tokenVersion: 1,
      bannedAt: null,
      bannedBy: null,
      banReason: null,
      deletedAt: null,
      lastLoginAt: new Date().toISOString(),
      lastLoginIp: '127.0.0.1',
      points: demoState.points,
      referralCount: 14,
      referredBy: null,
    },
    points: { committed: 100, uncommitted: demoState.points - 100 },
    purchases: { totalBnb: '1500000000000000000', totalOkn: '1500000000000000000000000', count: 2, recent: [] },
    claims: { totalClaimed: '250000000000000000000000', count: 1, recent: [] },
    streak: {
      currentStreak: demoState.streak.currentStreak,
      longestStreak: demoState.streak.longestStreak,
      totalLogins: demoState.streak.totalLogins,
    },
    referrals: { directCount: 8, downlineCount: 14, points: 680 },
    completions: { verified: 2, pending: 0, rejected: 0 },
    latestActivity: [],
  }),
  getAdminReferrals: async (opts?: { page?: number; pageSize?: number }): Promise<AdminReferralsResponse> => ({
    topReferrers: [],
    edges: {
      items: [],
      total: 0,
      page: opts?.page ?? 1,
      pageSize: opts?.pageSize ?? 25,
    },
    flagged: [],
  }),
  getAdminSystem: async (): Promise<AdminSystemHealth> => ({
    indexer: {
      indexedBlockNumber: '41892500',
      headBlockNumber: '41892502',
      lagBlocks: 2,
      latestEventAt: new Date().toISOString(),
    },
    rateSyncKeeper: { action: 'noop', createdAt: new Date().toISOString(), newValue: null },
    merkleRoots: {
      counts: {
        broadcasting: 0,
        pending_confirmation: 0,
        pending_safe: 0,
        committed: 3,
        failed: 0,
      },
      inFlightPastGrace: 0,
    },
    verificationJobs: {
      queued: 0,
      running: 0,
      retry: 0,
      failed: 0,
      oldestQueuedAgeMinutes: null,
    },
    saleConfig: {
      rate: '1000000000000000000000000',
      priceUsd: '60000',
      minPurchase: '10000000000000000',
      capPerWallet: '50000000000000000000',
      isPaused: false,
      updatedAt: new Date().toISOString(),
    },
  }),

  // Notifications
  getNotifications: async () => ({
    notifications: demoState.notifications.map((n) => ({ ...n })),
    unreadCount: demoState.notifications.filter((n) => !n.read).length,
  }),
  markNotificationRead: async (id: string) => {
    const item = demoState.notifications.find((n) => n.id === id);
    if (item) item.read = true;
    return { ok: true as const };
  },

  // Demo simulation helpers
  recordDemoPurchase: async (bnbAmountWei: bigint, oknAmountWei: bigint) => {
    const txHash = (`0x${Array.from({ length: 64 }, (_, i) => ((Date.now() + i * 7) % 16).toString(16)).join('')}`) as `0x${string}`;
    demoState.oknBalanceWei += oknAmountWei;
    demoState.purchasedBnbWei += bnbAmountWei;
    const purchase: Purchase = {
      id: `44444444-4444-4444-8444-${String(Date.now()).slice(-12)}`,
      userId: demoState.user.id,
      buyerWallet: demoState.user.walletAddress ?? '0xBF6B0312f52fa8390Ec9393A9375BF05c8E40377',
      bnbAmount: bnbAmountWei,
      oknAmount: oknAmountWei,
      rate: 1000000000000000000000000n,
      txHash,
      blockNumber: 41895000n,
      createdAt: new Date(),
    };
    demoState.purchases.unshift(purchase);
    demoState.notifications.unshift({
      id: `notif-${Date.now()}`,
      type: 'presale',
      title: 'Presale Purchase Confirmed',
      body: `Allocated ${(Number(oknAmountWei / 10n ** 18n)).toLocaleString()} $OKN to your wallet.`,
      link: '/app/portfolio',
      read: false,
      createdAt: new Date().toISOString(),
    });
    return { txHash, purchase };
  },
  recordDemoClaim: async (entitlementWei: bigint) => {
    const txHash = (`0x${Array.from({ length: 64 }, (_, i) => ((Date.now() + i * 11) % 16).toString(16)).join('')}`) as `0x${string}`;
    demoState.oknBalanceWei += entitlementWei;
    demoState.claimedOknWei += entitlementWei;
    demoState.notifications.unshift({
      id: `notif-${Date.now()}`,
      type: 'claim',
      title: '$OKN Claim Confirmed',
      body: `Claimed ${(Number(entitlementWei / 10n ** 18n)).toLocaleString()} $OKN on BNB Smart Chain.`,
      link: '/app/wallet',
      read: false,
      createdAt: new Date().toISOString(),
    });
    return { txHash };
  },
  addDemoPoints: async (points: number, reason?: string) => {
    demoState.points += points;
    if (reason) {
      demoState.notifications.unshift({
        id: `notif-${Date.now()}`,
        type: 'reward',
        title: `+${points} OK Points Earned`,
        body: reason,
        link: '/app/claim',
        read: false,
        createdAt: new Date().toISOString(),
      });
    }
    return { points: demoState.points };
  },
  cycleDemoWallet: async () => {
    const wallets = [
      '0xBF6B0312f52fa8390Ec9393A9375BF05c8E40377',
      '0x71C94820d829E1A29D649b278148b1A29D649b22',
      '0x892aF21b76A93F424e75A0Bf9689874D14c9B231',
    ];
    const currentIdx = wallets.indexOf(demoState.user.walletAddress ?? wallets[0]!);
    const nextWallet = wallets[(currentIdx + 1) % wallets.length]!;
    demoState.user = {
      ...demoState.user,
      walletAddress: nextWallet,
      walletBoundAt: new Date().toISOString(),
    };
    return { walletAddress: nextWallet };
  },
};

