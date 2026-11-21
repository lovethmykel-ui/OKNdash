'use client';

/**
 * WhaleDetailView — Dedicated Whale Detail & Auto-Copy view modeled directly
 * on the reference detail screen:
 *   1. Top Action Card (avatar, name, full-width Connect & Auto-Copy CTA,
 *      Favorite & Share buttons) + Signature High-Contrast Dark Inset Metrics Block
 *   2. Performance Breakdown Card (Total PnL, Volume, Win Rate, Win/Loss bar,
 *      dotted-leader rows with 1-click copy & Polymarket profile link)
 *   3. Lazy-loaded Live Positions & Recent Trades Feed from Polymarket v2 API
 */
import { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  ArrowLeft,
  BadgeCheck,
  Check,
  Coins,
  Copy,
  ExternalLink,
  Layers,
  Link2,
  RefreshCw,
  Share2,
  Star,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  formatCompactUsd,
  formatRelativeTime,
  formatSignedPct,
  formatTradeUsd,
  shortenEvmAddress,
  type LeaderboardTimeframe,
  type LiveLeaderboardTrader,
  type LiveTraderPosition,
  type LiveTraderTrade,
  type WhalePerformanceSummary,
} from '@/lib/polymarket/leaderboard';
import type { CopierSubscription } from './copier-hooks';
import { WhaleAvatar } from './whale-card';
import { CopyConfigModal } from './copy-config-modal';

interface TraderDetailPayload {
  address: string;
  positions: LiveTraderPosition[];
  trades: LiveTraderTrade[];
  performance: WhalePerformanceSummary;
  fetchedAt: number;
}

interface WhaleDetailViewProps {
  trader: LiveLeaderboardTrader;
  timeframeLabel: string;
  timeframe: LeaderboardTimeframe;
  subscription?: CopierSubscription;
  isFavorite: boolean;
  agentFunded: boolean;
  agentUsdcBalance: number;
  onToggleFavorite: (address: string) => void;
  onBack: () => void;
  onCopied: () => void;
  onGoFund: () => void;
}

const TRADER_DETAIL_CACHE_TTL_MS = 60_000;
const traderDetailCache = new Map<
  string,
  { payload: TraderDetailPayload; expiresAt: number }
>();

export function WhaleDetailView({
  trader,
  timeframeLabel,
  subscription,
  isFavorite,
  agentFunded,
  agentUsdcBalance,
  onToggleFavorite,
  onBack,
  onCopied,
  onGoFund,
}: WhaleDetailViewProps) {
  const cachedEntry = traderDetailCache.get(trader.address.toLowerCase());
  const validInitial =
    cachedEntry && cachedEntry.expiresAt > Date.now() ? cachedEntry.payload : null;

  const [detail, setDetail] = useState<TraderDetailPayload | null>(validInitial);
  const [loading, setLoading] = useState(!validInitial);
  const [error, setError] = useState<string | null>(null);
  const [feedTab, setFeedTab] = useState<'positions' | 'trades'>('positions');
  const [configOpen, setConfigOpen] = useState(false);
  const [copiedAddr, setCopiedAddr] = useState(false);
  const [nowMs, setNowMs] = useState<number | null>(null);

  useEffect(() => {
    setNowMs(Date.now());
    const interval = window.setInterval(() => setNowMs(Date.now()), 30_000);
    return () => window.clearInterval(interval);
  }, []);

  const loadTraderDetail = useCallback(
    async (force = false) => {
      const cacheKey = trader.address.toLowerCase();
      if (!force) {
        const hit = traderDetailCache.get(cacheKey);
        if (hit && hit.expiresAt > Date.now()) {
          setDetail(hit.payload);
          setLoading(false);
          setError(null);
          return;
        }
      }
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/polymarket/trader/${encodeURIComponent(trader.address)}`,
          { cache: 'no-store' },
        );
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const json = (await res.json()) as TraderDetailPayload;
        traderDetailCache.set(cacheKey, {
          payload: json,
          expiresAt: Date.now() + TRADER_DETAIL_CACHE_TTL_MS,
        });
        setDetail(json);
      } catch {
        setError('Could not load live Polymarket positions and trade history.');
      } finally {
        setLoading(false);
      }
    },
    [trader.address],
  );

  useEffect(() => {
    void loadTraderDetail(false);
  }, [loadTraderDetail]);

  const isCopied = Boolean(subscription && subscription.status !== 'stopped');
  const isLive = subscription?.status === 'live';
  const positivePnl = trader.pnlUsd >= 0;

  const handleCopyWallet = async () => {
    try {
      await navigator.clipboard.writeText(trader.address);
      setCopiedAddr(true);
      toast.success('Wallet address copied');
      window.setTimeout(() => setCopiedAddr(false), 1800);
    } catch {
      toast.error('Unable to copy wallet address');
    }
  };

  const handleShare = async () => {
    try {
      const shareUrl = `${window.location.origin}${window.location.pathname}?tab=copy&whale=${encodeURIComponent(trader.address)}`;
      await navigator.clipboard.writeText(shareUrl);
      toast.success(`Copied profile link for ${trader.displayName}`);
    } catch {
      toast.error('Unable to copy share link');
    }
  };

  const perf = detail?.performance;
  const winsCount = perf?.winsCount ?? 0;
  const lossesCount = perf?.lossesCount ?? 0;
  const totalScored = winsCount + lossesCount;
  const winWidthPct = totalScored > 0 ? Math.max(4, Math.round((winsCount / totalScored) * 100)) : 0;
  const lossWidthPct = totalScored > 0 ? Math.max(4, 100 - winWidthPct) : 0;

  const activeCopiersDisplay = isLive ? '1 Active (You)' : isCopied ? '1 Preview' : 'Ready';
  const executionModeDisplay = isLive
    ? 'Instant Mirror'
    : subscription?.status === 'paused'
      ? 'Paused'
      : agentFunded
        ? 'Instant Mirror'
        : 'Preview Mode';

  return (
    <div className="space-y-5" data-testid="whale-detail-view">
      {/* Back navigation */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          data-testid="back-to-whales-btn"
          className="inline-flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--s1)] px-3.5 py-2 text-xs sm:text-sm font-bold text-[var(--tx)] hover:border-[#7A12F5]/50 hover:text-[#7A12F5] dark:hover:text-[#C084FC] transition-colors cursor-pointer"
        >
          <ArrowLeft className="size-4" />
          <span>Back to Whales</span>
        </button>

        <a
          href={trader.polymarketUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--mut)] hover:text-[var(--tx)] transition-colors"
        >
          <span>View on Polymarket</span>
          <ExternalLink className="size-3.5" />
        </a>
      </div>

      {/* Main Responsive Split: Left Action + Dark Inset Metrics | Right Performance + Live Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: Top Action Card + Signature High-Contrast Inset Metrics */}
        <section className="lg:col-span-5 rounded-3xl border border-[var(--line)] bg-[var(--s1)] p-5 sm:p-6 shadow-xs space-y-5">
          {/* Avatar + Whale Identity */}
          <div className="flex items-center gap-3.5">
            <WhaleAvatar
              name={trader.displayName}
              imageUrl={trader.profileImage}
              toneClass={trader.avatarTone}
              size="lg"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <h2 className="truncate text-xl sm:text-2xl font-extrabold tracking-tight text-[var(--tx)]">
                  {trader.displayName}
                </h2>
                {trader.verified && (
                  <BadgeCheck
                    className="size-5 shrink-0 text-[#7A12F5] dark:text-[#A855F7]"
                    aria-label="Verified Polymarket whale"
                  />
                )}
              </div>
              <p className="mt-0.5 text-xs font-mono text-[var(--mut)] truncate">
                {trader.xUsername ? `@${trader.xUsername} · ` : ''}
                {shortenEvmAddress(trader.address)}
              </p>
            </div>
          </div>

          {/* Primary CTA + Favorite & Share square icon buttons */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setConfigOpen(true)}
              data-testid="connect-auto-copy-btn"
              className={cn(
                'flex-1 h-12 rounded-xl px-4 text-sm font-extrabold transition-all cursor-pointer inline-flex items-center justify-center gap-2 shadow-xs active:scale-[0.985]',
                isLive
                  ? 'bg-[#10B981] hover:bg-[#059669] text-white'
                  : isCopied
                    ? 'bg-[#7A12F5]/15 border border-[#7A12F5]/40 text-[#7A12F5] dark:text-[#C084FC] hover:bg-[#7A12F5]/20'
                    : 'bg-[#7A12F5] hover:bg-[#690CD9] text-white',
              )}
            >
              {isLive ? (
                <Check className="size-4 stroke-[2.75]" />
              ) : (
                <Link2 className="size-4" />
              )}
              <span>
                {isLive
                  ? 'Connected / Active'
                  : subscription?.status === 'preview'
                    ? 'Connected / Preview'
                    : subscription?.status === 'paused'
                      ? 'Paused · Configure'
                      : 'Connect & Auto-Copy'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onToggleFavorite(trader.address)}
              aria-pressed={isFavorite}
              aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              className={cn(
                'size-12 shrink-0 rounded-xl border flex items-center justify-center transition-colors cursor-pointer',
                isFavorite
                  ? 'border-[#F59E0B]/40 bg-[#F59E0B]/10 text-[#D97706] dark:text-[#FBBF24]'
                  : 'border-[var(--line)] bg-[var(--s1)] text-[var(--mut)] hover:text-[var(--tx)]',
              )}
            >
              <Star className={cn('size-5', isFavorite && 'fill-current')} />
            </button>

            <button
              type="button"
              onClick={() => void handleShare()}
              aria-label="Share whale profile"
              className="size-12 shrink-0 rounded-xl border border-[var(--line)] bg-[var(--s1)] text-[var(--mut)] hover:text-[var(--tx)] flex items-center justify-center transition-colors cursor-pointer"
            >
              <Share2 className="size-5" />
            </button>
          </div>

          {/* Signature High-Contrast Dark Inset Metrics Block (4 dotted-leader rows) */}
          <div className="rounded-2xl bg-[#0B0B0F] text-white p-3.5 sm:p-5 border border-white/10 shadow-inner space-y-3 sm:space-y-3.5">
            <DarkInsetMetricRow
              icon={<Trophy className="size-4" />}
              label="Leaderboard Rank"
              value={`#${trader.rank}`}
            />
            <DarkInsetMetricRow
              icon={<Users className="size-4" />}
              label="Active Copiers"
              value={activeCopiersDisplay}
            />
            <DarkInsetMetricRow
              icon={<Zap className="size-4" />}
              label="Copy Execution Mode"
              value={executionModeDisplay}
            />
            <DarkInsetMetricRow
              icon={<Coins className="size-4" />}
              label="Min Copy Allocation"
              value="$10.00"
            />
          </div>

          {isCopied && subscription && (
            <div className="rounded-2xl border border-[#10B981]/30 bg-[#10B981]/[0.07] px-4 py-3 text-xs flex items-center justify-between gap-2">
              <span className="text-[var(--tx)] font-semibold tabular-nums">
                Rule:{' '}
                {subscription.strategyConfig.strategy === 'FIXED'
                  ? `$${subscription.strategyConfig.copySize} fixed`
                  : `${subscription.strategyConfig.copySize}% mirror`}{' '}
                · Max ${subscription.strategyConfig.maxOrderSizeUsd}
              </span>
              <button
                type="button"
                onClick={() => setConfigOpen(true)}
                className="font-bold text-[#7A12F5] dark:text-[#C084FC] hover:underline cursor-pointer shrink-0"
              >
                Edit Rules
              </button>
            </div>
          )}
        </section>

        {/* RIGHT COLUMN: Performance Breakdown Card + Live Positions & Trades Feed */}
        <div className="lg:col-span-7 space-y-5">
          {/* Performance Breakdown Card */}
          <section className="rounded-3xl border border-[var(--line)] bg-[var(--s1)] p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-lg font-extrabold tracking-tight text-[var(--tx)]">
                Performance
              </h3>
              <span className="rounded-lg border border-[var(--line)] bg-[var(--s2)]/70 px-2.5 py-1 text-[11px] font-bold text-[var(--mut)]">
                {timeframeLabel} Leaderboard
              </span>
            </div>

            {/* 2-Column / 3-Metric Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-5">
              <div>
                <p className="text-xs font-medium text-[var(--mut)]">Total PnL</p>
                <p
                  className={cn(
                    'mt-1 text-xl sm:text-2xl font-extrabold tracking-tight tabular-nums',
                    positivePnl
                      ? 'text-[#059669] dark:text-[#10B981]'
                      : 'text-[#E11D48] dark:text-[#F43F5E]',
                  )}
                >
                  {formatCompactUsd(trader.pnlUsd, true)}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-[var(--mut)]">Total Volume</p>
                <p className="mt-1 text-xl sm:text-2xl font-extrabold tracking-tight text-[var(--tx)] tabular-nums">
                  {formatCompactUsd(trader.volumeUsd)}
                </p>
              </div>

              <div className="col-span-2 sm:col-span-1">
                <p className="text-xs font-medium text-[var(--mut)]">Win Rate</p>
                {loading ? (
                  <div className="mt-2 h-6 w-20 rounded bg-[var(--s2)] animate-pulse" />
                ) : (
                  <p className="mt-1 text-xl sm:text-2xl font-extrabold tracking-tight text-[var(--tx)] tabular-nums">
                    {perf?.winRatePct !== null && perf?.winRatePct !== undefined
                      ? `${perf.winRatePct.toFixed(1)}%`
                      : '—'}
                  </p>
                )}
              </div>
            </div>

            <div className="border-t border-[var(--line)]/80" />

            {/* Horizontal Win / Loss Ratio Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs sm:text-sm tabular-nums">
                <span className="text-[var(--mut)]">
                  Wins{' '}
                  <strong className="font-extrabold text-[var(--tx)]">
                    {loading ? '…' : winsCount}
                  </strong>
                </span>
                <span className="text-[var(--mut)]">
                  Losses{' '}
                  <strong className="font-extrabold text-[var(--tx)]">
                    {loading ? '…' : lossesCount}
                  </strong>
                </span>
              </div>

              <div
                className="flex h-2.5 w-full overflow-hidden rounded-full bg-[var(--s2)] gap-1"
                role="img"
                aria-label={`Win loss ratio: ${winsCount} wins, ${lossesCount} losses`}
              >
                {totalScored > 0 ? (
                  <>
                    <div
                      className="h-full rounded-l-full bg-[#10B981] transition-all duration-300"
                      style={{ width: `${winWidthPct}%` }}
                    />
                    <div
                      className="h-full rounded-r-full bg-[#F43F5E] transition-all duration-300"
                      style={{ width: `${lossWidthPct}%` }}
                    />
                  </>
                ) : (
                  <div className="h-full w-full rounded-full bg-[var(--line)]/60" />
                )}
              </div>
            </div>

            {/* Dotted-Leader Detail Rows */}
            <div className="space-y-3 pt-1 text-xs sm:text-sm">
              <DottedPerformanceRow
                label="Avg Position Size"
                value={
                  loading
                    ? 'Loading…'
                    : perf?.avgPositionSizeUsd !== null &&
                        perf?.avgPositionSizeUsd !== undefined
                      ? formatCompactUsd(perf.avgPositionSizeUsd)
                      : '—'
                }
              />
              <DottedPerformanceRow
                label="Active Open Positions"
                value={loading ? 'Loading…' : String(perf?.openPositionsCount ?? 0)}
              />
              <div className="flex items-baseline gap-2">
                <span className="shrink-0 text-[var(--mut)]">Wallet Address</span>
                <span
                  aria-hidden="true"
                  className="flex-1 border-b border-dashed border-[var(--line)] mb-1"
                />
                <div className="shrink-0 flex items-center gap-1.5 font-mono font-bold text-[var(--tx)]">
                  <span>{shortenEvmAddress(trader.address)}</span>
                  <button
                    type="button"
                    onClick={() => void handleCopyWallet()}
                    aria-label="Copy wallet address"
                    className="p-1 rounded-md text-[var(--mut)] hover:text-[var(--tx)] hover:bg-[var(--s2)] transition-colors cursor-pointer"
                  >
                    {copiedAddr ? (
                      <Check className="size-3.5 text-[#10B981]" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                  </button>
                  <a
                    href={trader.polymarketUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Open Polymarket profile"
                    className="p-1 rounded-md text-[var(--mut)] hover:text-[#7A12F5] dark:hover:text-[#C084FC] hover:bg-[var(--s2)] transition-colors"
                  >
                    <ExternalLink className="size-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* Live Positions & Recent Trades Feed */}
          <section className="overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--s1)] shadow-xs">
            <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-[var(--line)] flex items-center justify-between gap-2">
              <div
                className="inline-flex flex-nowrap rounded-xl bg-[var(--s2)] p-1 border border-[var(--line)] min-w-0"
                role="tablist"
                aria-label="Whale activity feed"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={feedTab === 'positions'}
                  onClick={() => setFeedTab('positions')}
                  className={cn(
                    'px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap',
                    feedTab === 'positions'
                      ? 'bg-[var(--s1)] text-[var(--tx)] shadow-xs'
                      : 'text-[var(--mut)] hover:text-[var(--tx)]',
                  )}
                >
                  <Layers className="size-3.5 shrink-0 hidden sm:inline" />
                  <span>Positions</span>
                  {detail && (
                    <span className="font-mono text-[11px] text-[var(--mut)] tabular-nums">
                      ({detail.positions.length})
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={feedTab === 'trades'}
                  onClick={() => setFeedTab('trades')}
                  className={cn(
                    'px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap',
                    feedTab === 'trades'
                      ? 'bg-[var(--s1)] text-[var(--tx)] shadow-xs'
                      : 'text-[var(--mut)] hover:text-[var(--tx)]',
                  )}
                >
                  <Activity className="size-3.5 shrink-0 hidden sm:inline" />
                  <span>Recent Trades</span>
                  {detail && (
                    <span className="font-mono text-[11px] text-[var(--mut)] tabular-nums">
                      ({detail.trades.length})
                    </span>
                  )}
                </button>
              </div>

              <button
                type="button"
                onClick={() => void loadTraderDetail(true)}
                disabled={loading}
                aria-label="Refresh live whale feed"
                className="h-8 px-2.5 rounded-lg border border-[var(--line)] bg-[var(--s1)] text-xs font-semibold text-[var(--mut)] hover:text-[var(--tx)] transition-colors cursor-pointer inline-flex items-center gap-1.5 shrink-0 disabled:opacity-50"
              >
                <RefreshCw className={cn('size-3.5', loading && 'animate-spin')} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>

            {loading ? (
              <div className="divide-y divide-[var(--line)] p-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="p-3.5 flex items-center justify-between gap-4 animate-pulse">
                    <div className="space-y-2 flex-1">
                      <div className="h-4 w-3/4 rounded bg-[var(--s2)]" />
                      <div className="h-3 w-1/3 rounded bg-[var(--s2)]" />
                    </div>
                    <div className="space-y-2 w-20 text-right">
                      <div className="h-4 w-full rounded bg-[var(--s2)]" />
                      <div className="h-3 w-2/3 ml-auto rounded bg-[var(--s2)]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="p-8 text-center space-y-3">
                <p className="text-sm font-semibold text-[var(--tx)]">{error}</p>
                <button
                  type="button"
                  onClick={() => void loadTraderDetail()}
                  className="h-9 px-4 rounded-xl bg-[#7A12F5] text-white text-xs font-bold cursor-pointer hover:bg-[#690CD9]"
                >
                  Retry Live Fetch
                </button>
              </div>
            ) : feedTab === 'positions' ? (
              detail && detail.positions.length > 0 ? (
                <ul className="divide-y divide-[var(--line)] max-h-[420px] overflow-y-auto">
                  {detail.positions.slice(0, 15).map((pos, idx) => {
                    const posUp = pos.totalPnlUsd >= 0;
                    return (
                      <li
                        key={`${pos.slug}-${pos.outcome}-${idx}`}
                        className="px-5 py-3.5 flex items-center justify-between gap-4 hover:bg-[var(--s2)]/40 transition-colors"
                      >
                        <div className="min-w-0 space-y-1">
                          <p className="text-xs sm:text-sm font-bold text-[var(--tx)] truncate">
                            {pos.title}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-[var(--mut)] tabular-nums">
                            <span
                              className={cn(
                                'rounded-md px-1.5 py-0.5 font-bold',
                                pos.outcome.toLowerCase() === 'no'
                                  ? 'bg-[#F43F5E]/12 text-[#E11D48] dark:text-[#FB7185]'
                                  : 'bg-[#10B981]/12 text-[#059669] dark:text-[#34D399]',
                              )}
                            >
                              {pos.outcome}
                            </span>
                            <span>
                              Avg {pos.avgPriceCents}¢ → Now {pos.currentPriceCents}¢
                            </span>
                          </div>
                        </div>

                        <div className="shrink-0 text-right tabular-nums">
                          <p className="text-xs sm:text-sm font-extrabold text-[var(--tx)]">
                            {formatTradeUsd(pos.currentValueUsd)}
                          </p>
                          <p
                            className={cn(
                              'text-[11px] font-bold',
                              posUp
                                ? 'text-[#059669] dark:text-[#10B981]'
                                : 'text-[#E11D48] dark:text-[#F43F5E]',
                            )}
                          >
                            {formatCompactUsd(pos.totalPnlUsd, true)}
                            {pos.percentPnl !== 0
                              ? ` (${formatSignedPct(pos.percentPnl)})`
                              : ''}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="p-8 text-center text-xs sm:text-sm text-[var(--mut)]">
                  No open prediction positions currently reported on-chain for this wallet.
                </p>
              )
            ) : detail && detail.trades.length > 0 ? (
              <ul className="divide-y divide-[var(--line)] max-h-[420px] overflow-y-auto">
                {detail.trades.slice(0, 20).map((trade, idx) => {
                  const isBuy = trade.side === 'BUY';
                  return (
                    <li
                      key={`${trade.txHash || trade.slug}-${trade.timestamp}-${idx}`}
                      className="px-5 py-3.5 flex items-center justify-between gap-4 hover:bg-[var(--s2)]/40 transition-colors"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={cn(
                              'shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide',
                              isBuy
                                ? 'bg-[#10B981]/15 text-[#059669] dark:text-[#34D399]'
                                : 'bg-[#F43F5E]/15 text-[#E11D48] dark:text-[#FB7185]',
                            )}
                          >
                            {trade.side}
                          </span>
                          <p className="text-xs sm:text-sm font-bold text-[var(--tx)] truncate">
                            {trade.title}
                          </p>
                        </div>
                        <p className="text-[11px] text-[var(--mut)] tabular-nums">
                          {trade.outcome} @ {trade.priceCents}¢ ·{' '}
                          {formatRelativeTime(trade.timestamp, nowMs)}
                        </p>
                      </div>

                      <div className="shrink-0 text-right tabular-nums">
                        <p className="text-xs sm:text-sm font-extrabold text-[var(--tx)]">
                          {formatTradeUsd(trade.usdcValue)}
                        </p>
                        <p className="text-[11px] text-[var(--mut)]">USDC</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="p-8 text-center text-xs sm:text-sm text-[var(--mut)]">
                No recent Polymarket trades recorded for this wallet.
              </p>
            )}
          </section>
        </div>
      </div>

      <CopyConfigModal
        open={configOpen}
        onOpenChange={setConfigOpen}
        trader={trader}
        existingSubscription={subscription}
        agentFunded={agentFunded}
        agentUsdcBalance={agentUsdcBalance}
        onSaved={onCopied}
        onGoFund={onGoFund}
      />
    </div>
  );
}

function DarkInsetMetricRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2.5 sm:gap-3">
      <span className="size-9 sm:size-10 shrink-0 rounded-xl bg-[#7A12F5] text-white flex items-center justify-center shadow-[0_0_18px_rgba(122,18,245,0.55)]">
        {icon}
      </span>
      <div className="flex flex-1 items-baseline gap-1.5 sm:gap-2 min-w-0">
        <span className="shrink-0 text-[11px] sm:text-sm font-medium text-white/75">
          {label}
        </span>
        <span
          aria-hidden="true"
          className="flex-1 border-b border-dashed border-white/25 mb-1 min-w-[10px]"
        />
        <span className="shrink-0 font-mono text-[11px] sm:text-sm font-extrabold text-white tabular-nums">
          {value}
        </span>
      </div>
    </div>
  );
}

function DottedPerformanceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="shrink-0 text-[var(--mut)]">{label}</span>
      <span
        aria-hidden="true"
        className="flex-1 border-b border-dashed border-[var(--line)] mb-1"
      />
      <span className="shrink-0 font-mono font-bold text-[var(--tx)] tabular-nums">
        {value}
      </span>
    </div>
  );
}
