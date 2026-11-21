'use client';

/**
 * polymarket-agent/copier-panel.tsx — Redesigned Copy Trading & Whale Leaderboard
 * modeled on a clean card-based architecture powered 100% by live Polymarket Data API v2.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { AnimatePresence, motion } from 'motion/react';
import {
  Activity,
  ArrowRight,
  Crown,
  KeyRound,
  Landmark,
  Loader2,
  PauseCircle,
  PlayCircle,
  Plus,
  RefreshCw,
  Search,
  Star,
  StopCircle,
  TrendingUp,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  LEADERBOARD_TIMEFRAMES,
  canEngageLiveCopy,
  filterLiveLeaderboardTraders,
  formatCompactUsd,
  isValidEvmAddress,
  pickAvatarTone,
  shortenEvmAddress,
  summarizeLeaderboardHero,
  type LeaderboardPagination,
  type LeaderboardSort,
  type LeaderboardTimeframe,
  type LiveLeaderboardTrader,
} from '@/lib/polymarket/leaderboard';
import type { AgentTab } from './tab-param';
import { TwoFaChallenge } from './two-fa-challenge';
import { UpgradeDialog } from './upgrade-dialog';
import { WhaleAvatar, WhaleCard, WhaleCardSkeleton } from './whale-card';
import { WhaleDetailView } from './whale-detail-view';
import {
  activateWallet,
  beaconCopierViewed,
  createSubscription,
  fetchBalances,
  fetchBilling,
  fetchExecutions,
  fetchSubscriptions,
  fetchWallet,
  getInitialCopierSnapshot,
  updateSubscription,
  useCopierStoreVersion,
  type CopierBalances,
  type CopierEntitlement,
  type CopierExecution,
  type CopierSubscription,
  type CopierWallet,
} from './copier-hooks';

type LoadState = 'loading' | 'unconfigured' | 'active' | 'error';
type CopyNavTab = 'browse' | 'copied' | 'log';

const FAVORITES_STORAGE_KEY = 'okn_polymarket_whale_watchlist_v1';
const PAGE_LIMIT = 18;

interface LeaderboardApiResponse {
  traders: LiveLeaderboardTrader[];
  pagination: LeaderboardPagination;
  timePeriod: string;
  sortBy: string;
  fetchedAt: number;
  error?: string;
}

interface CopierPanelProps {
  onNavigateTab?: (tab: AgentTab) => void;
}

export function CopierPanel({ onNavigateTab }: CopierPanelProps) {
  const t = useTranslations('dashboard.polymarketAgent.copier');
  const storeVersion = useCopierStoreVersion();
  const initial = getInitialCopierSnapshot();

  const [state, setState] = useState<LoadState>('active');
  const [wallet, setWallet] = useState<CopierWallet | null>(initial.wallet);
  const [balances, setBalances] = useState<CopierBalances>(initial.balances);
  const [subscriptions, setSubscriptions] = useState<CopierSubscription[]>(
    initial.subscriptions,
  );
  const [executions, setExecutions] = useState<CopierExecution[]>(initial.executions);
  const [entitlement, setEntitlement] = useState<CopierEntitlement | null>(
    initial.entitlement,
  );
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // Segmented top navigation state
  const [navTab, setNavTab] = useState<CopyNavTab>('browse');

  // Live Polymarket Leaderboard state
  const [timeframe, setTimeframe] = useState<LeaderboardTimeframe>('month');
  const [sortBy, setSortBy] = useState<LeaderboardSort>('pnl');
  const [watchlistOnly, setWatchlistOnly] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');

  const [traders, setTraders] = useState<LiveLeaderboardTrader[]>([]);
  const [pagination, setPagination] = useState<LeaderboardPagination>({
    limit: PAGE_LIMIT,
    offset: 0,
    hasMore: false,
    nextCursor: null,
  });
  const [boardLoading, setBoardLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [boardError, setBoardError] = useState<string | null>(null);
  const [selectedWhale, setSelectedWhale] = useState<LiveLeaderboardTrader | null>(null);

  // Watchlist persisted safely in localStorage AFTER hydration
  const [favorites, setFavorites] = useState<string[]>([]);
  const hydratedFavoritesRef = useRef(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setFavorites(
            parsed.filter((v): v is string => typeof v === 'string' && v.startsWith('0x')),
          );
        }
      }
    } catch {
      // Ignore storage access errors
    } finally {
      hydratedFavoritesRef.current = true;
    }
  }, []);

  const toggleFavorite = useCallback((address: string) => {
    const normalized = address.toLowerCase();
    setFavorites((prev) => {
      const exists = prev.includes(normalized);
      const next = exists
        ? prev.filter((item) => item !== normalized)
        : [...prev, normalized];
      if (hydratedFavoritesRef.current) {
        try {
          window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(next));
        } catch {
          // Ignore storage quota errors
        }
      }
      return next;
    });
  }, []);

  useEffect(() => {
    beaconCopierViewed();
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [walletRes, billingRes, balRes] = await Promise.all([
        fetchWallet(),
        fetchBilling().catch(() => null),
        fetchBalances(),
      ]);
      if (cancelled) return;
      if (walletRes.status === 503) {
        setState('unconfigured');
        return;
      }
      if (!walletRes.ok && walletRes.status !== 404) {
        setState('error');
        return;
      }
      setWallet(walletRes.data ?? null);
      if (balRes.ok && balRes.data) setBalances(balRes.data);
      if (billingRes?.ok && billingRes.data?.pricing) setEntitlement(billingRes.data);
      const [subsRes, execRes] = await Promise.all([
        fetchSubscriptions(),
        fetchExecutions(25),
      ]);
      if (cancelled) return;
      if (subsRes.ok) setSubscriptions(subsRes.data ?? []);
      if (execRes.ok) setExecutions(execRes.data ?? []);
      setState('active');
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadKey, storeVersion]);

  const fetchLeaderboard = useCallback(
    async (opts?: { cursor?: string | null; append?: boolean; userLookup?: string }) => {
      const append = Boolean(opts?.append);
      if (append) {
        setLoadingMore(true);
      } else {
        setBoardLoading(true);
        setBoardError(null);
      }

      try {
        const params = new URLSearchParams({
          time_period: timeframe,
          sort_by: sortBy === 'volume' ? 'VOLUME' : 'PNL',
          limit: String(PAGE_LIMIT),
        });
        if (opts?.cursor) {
          params.set('cursor', opts.cursor);
        }
        if (opts?.userLookup && isValidEvmAddress(opts.userLookup)) {
          params.set('user', opts.userLookup.trim());
        }

        const res = await fetch(`/api/polymarket/leaderboard?${params.toString()}`, {
          cache: 'no-store',
        });
        const json = (await res.json()) as LeaderboardApiResponse;

        if (!res.ok) {
          throw new Error(json.error ?? `HTTP ${res.status}`);
        }

        const incoming = Array.isArray(json.traders) ? json.traders : [];
        if (append) {
          setTraders((prev) => {
            const seen = new Set(prev.map((item) => item.address.toLowerCase()));
            const merged = [...prev];
            for (const row of incoming) {
              if (!seen.has(row.address.toLowerCase())) {
                seen.add(row.address.toLowerCase());
                merged.push(row);
              }
            }
            return merged;
          });
        } else {
          setTraders(incoming);
        }

        setPagination(
          json.pagination ?? {
            limit: PAGE_LIMIT,
            offset: 0,
            hasMore: false,
            nextCursor: null,
          },
        );
      } catch {
        if (!append) {
          setBoardError(
            'Unable to reach Polymarket live leaderboard right now. Please try again.',
          );
          setTraders([]);
        } else {
          toast.error('Failed to load additional whales');
        }
      } finally {
        setBoardLoading(false);
        setLoadingMore(false);
      }
    },
    [timeframe, sortBy],
  );

  // Trigger live leaderboard load on filter/sort changes or exact 0x lookup
  useEffect(() => {
    const trimmed = submittedSearch.trim();
    if (trimmed && isValidEvmAddress(trimmed)) {
      void fetchLeaderboard({ userLookup: trimmed });
    } else {
      void fetchLeaderboard();
    }
  }, [fetchLeaderboard, submittedSearch]);

  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);

  const handleOpenWhaleDetails = useCallback((whale: LiveLeaderboardTrader) => {
    setSelectedWhale(whale);
    setNavTab('browse');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedSearch(searchInput.trim());
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSubmittedSearch('');
  };

  const subscriptionByAddress = useMemo(() => {
    const map = new Map<string, CopierSubscription>();
    for (const sub of subscriptions) {
      if (sub.status !== 'stopped') {
        map.set(sub.traderAddress.toLowerCase(), sub);
      }
    }
    return map;
  }, [subscriptions]);

  const visibleTraders = useMemo(() => {
    let list = filterLiveLeaderboardTraders(traders, searchInput);
    if (watchlistOnly) {
      const favSet = new Set(favorites);
      list = list.filter((item) => favSet.has(item.address.toLowerCase()));
    }
    return list;
  }, [traders, searchInput, watchlistOnly, favorites]);

  const heroStats = useMemo(() => summarizeLeaderboardHero(traders), [traders]);
  const timeframeLabel =
    LEADERBOARD_TIMEFRAMES.find((item) => item.key === timeframe)?.label ?? '30D';

  if (state === 'loading') {
    return (
      <Card className="rounded-2xl border-[var(--line)] bg-[var(--s1)]">
        <CardContent className="p-6 text-sm text-[var(--mut)]">{t('loading')}</CardContent>
      </Card>
    );
  }

  if (state === 'unconfigured') {
    return (
      <Card className="rounded-2xl border-[var(--line)] bg-[var(--s1)]">
        <CardContent className="space-y-2 p-6">
          <p className="font-display text-lg font-bold">{t('headline')}</p>
          <p className="max-w-prose text-sm text-[var(--mut)]">{t('unconfiguredBody')}</p>
        </CardContent>
      </Card>
    );
  }

  if (state === 'error') {
    return (
      <Card className="rounded-2xl border-[var(--line)] bg-[var(--s1)]">
        <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
          <p className="text-sm font-medium">{t('loadErrorTitle')}</p>
          <p className="text-xs text-[var(--mut)]">{t('loadErrorBody')}</p>
          <Button variant="outline" size="sm" className="cursor-pointer" onClick={refresh}>
            {t('retry')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const usdcBalance = Number(balances.usdc) || 0;
  const polBalance = Number(balances.pol) || 0;
  const funding = canEngageLiveCopy(usdcBalance, polBalance);
  const activeCopiedCount = subscriptions.filter((s) => s.status !== 'stopped').length;

  return (
    <div className="space-y-5">
      {/* Top Segmented Pill Navigation Bar + Slim Agent Wallet Strip */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <nav
          aria-label="Copy trading sections"
          className="grid grid-cols-3 sm:inline-flex items-center gap-1 rounded-2xl border border-[var(--line)] bg-[var(--s1)] p-1.5 shadow-xs w-full sm:w-auto"
        >
          <button
            type="button"
            onClick={() => {
              setNavTab('browse');
              setSelectedWhale(null);
            }}
            data-testid="copy-nav-browse"
            className={cn(
              'h-9 px-2.5 sm:px-3.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap',
              navTab === 'browse'
                ? 'bg-[#7A12F5] text-white shadow-xs'
                : 'text-[var(--mut)] hover:text-[var(--tx)] hover:bg-[var(--s2)]/70',
            )}
          >
            <Search className="size-3.5 sm:size-4 shrink-0" />
            <span>Browse</span>
          </button>

          <button
            type="button"
            onClick={() => setNavTab('copied')}
            data-testid="copy-nav-copied"
            className={cn(
              'h-9 px-2.5 sm:px-3.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap',
              navTab === 'copied'
                ? 'bg-[#7A12F5] text-white shadow-xs'
                : 'text-[var(--mut)] hover:text-[var(--tx)] hover:bg-[var(--s2)]/70',
            )}
          >
            <Users className="size-3.5 sm:size-4 shrink-0" />
            <span className="sm:hidden">Copied</span>
            <span className="hidden sm:inline">My Copied Whales</span>
            <span
              className={cn(
                'min-w-[18px] sm:min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-extrabold inline-flex items-center justify-center tabular-nums',
                navTab === 'copied'
                  ? 'bg-white/20 text-white'
                  : activeCopiedCount > 0
                    ? 'bg-[#7A12F5]/15 text-[#7A12F5] dark:text-[#C084FC]'
                    : 'bg-[var(--s2)] text-[var(--mut)]',
              )}
            >
              {activeCopiedCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setNavTab('log')}
            data-testid="copy-nav-log"
            className={cn(
              'h-9 px-2.5 sm:px-3.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap',
              navTab === 'log'
                ? 'bg-[#7A12F5] text-white shadow-xs'
                : 'text-[var(--mut)] hover:text-[var(--tx)] hover:bg-[var(--s2)]/70',
            )}
          >
            <Activity className="size-3.5 sm:size-4 shrink-0" />
            <span className="sm:hidden">Log</span>
            <span className="hidden sm:inline">Copy Execution Log</span>
          </button>
        </nav>

        {/* Slim Agent Wallet Capital Pill */}
        <button
          type="button"
          onClick={() => onNavigateTab?.('fund')}
          className={cn(
            'h-11 px-3.5 rounded-2xl border text-xs font-bold transition-colors cursor-pointer inline-flex items-center justify-between sm:justify-start gap-2.5 shrink-0',
            funding.ready
              ? 'border-[var(--line)] bg-[var(--s1)] text-[var(--tx)] hover:border-[#7A12F5]/45'
              : 'border-[#F59E0B]/40 bg-[#F59E0B]/[0.08] text-[#B45309] dark:text-[#FBBF24]',
          )}
        >
          <span className="inline-flex items-center gap-2">
            <Landmark
              className={cn(
                'size-4',
                funding.ready ? 'text-[#10B981]' : 'text-[#D97706] dark:text-[#FBBF24]',
              )}
            />
            <span className="font-mono tabular-nums">
              {funding.ready
                ? `$${usdcBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC.e`
                : 'Fund Agent Wallet'}
            </span>
          </span>
          <ArrowRight className="size-3.5 opacity-70" />
        </button>
      </div>

      {!wallet && <ActivationCard onActivated={refresh} />}

      {/* TAB 1: BROWSE POLYMARKET WHALES (GRID OR DETAIL VIEW) */}
      {navTab === 'browse' && (
        <AnimatePresence mode="wait" initial={false}>
          {selectedWhale ? (
            <motion.div
              key={`detail-${selectedWhale.address}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.16, ease: 'easeOut' }}
            >
              <WhaleDetailView
                trader={selectedWhale}
                timeframe={timeframe}
                timeframeLabel={timeframeLabel}
                subscription={subscriptionByAddress.get(
                  selectedWhale.address.toLowerCase(),
                )}
                isFavorite={favorites.includes(selectedWhale.address.toLowerCase())}
                agentFunded={funding.ready}
                agentUsdcBalance={usdcBalance}
                onToggleFavorite={toggleFavorite}
                onBack={() => setSelectedWhale(null)}
                onCopied={refresh}
                onGoFund={() => onNavigateTab?.('fund')}
              />
            </motion.div>
          ) : (
            <motion.div
              key="browse-grid"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.16, ease: 'easeOut' }}
              className="space-y-5"
            >
              {/* Hero Summary Card (Reference Layout adapted to OKN theme) */}
              <section className="overflow-hidden rounded-3xl border border-[#7A12F5]/20 dark:border-[#7A12F5]/30 bg-gradient-to-br from-[#7A12F5]/[0.11] via-[var(--s1)] to-[#7A12F5]/[0.04] dark:from-[#7A12F5]/[0.22] dark:via-[var(--s1)] dark:to-[#131316] p-5 sm:p-6 lg:p-7 shadow-xs">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
                  <div className="lg:col-span-7 space-y-2">
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--tx)] leading-tight">
                      Browse Polymarket Whales
                    </h1>
                    <p className="text-sm sm:text-[15px] text-[var(--mut)] max-w-xl leading-relaxed">
                      Auto-mirror trades from top-ranked prediction wallets
                    </p>
                  </div>

                  {/* High-Contrast Dark Inset Metric Container */}
                  <div className="lg:col-span-5 rounded-2xl bg-[#0B0B0F] text-white p-4 sm:p-5 border border-white/10 shadow-inner flex items-center gap-4">
                    <span className="size-12 shrink-0 rounded-2xl bg-[#7A12F5] text-white flex items-center justify-center shadow-[0_0_26px_rgba(122,18,245,0.65)]">
                      <TrendingUp className="size-6" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-white/65">
                        Combined {timeframeLabel} Whale PnL
                      </p>
                      {boardLoading && traders.length === 0 ? (
                        <div className="mt-1.5 h-8 w-36 rounded-lg bg-white/10 animate-pulse" />
                      ) : (
                        <p className="mt-0.5 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-white leading-none">
                          {formatCompactUsd(heroStats.combinedPnlUsd, true)}
                        </p>
                      )}
                      <p className="mt-1.5 text-xs text-white/65 tabular-nums">
                        {boardLoading && traders.length === 0
                          ? 'Syncing live Polymarket Data API v2…'
                          : `${heroStats.trackedCount} live whales · ${formatCompactUsd(heroStats.combinedVolumeUsd)} vol`}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Filter Pills & Search Row */}
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-1.5">
                  {/* All vs Watchlist scope pills */}
                  <button
                    type="button"
                    onClick={() => setWatchlistOnly(false)}
                    className={cn(
                      'h-9 px-3.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer',
                      !watchlistOnly
                        ? 'border-[#7A12F5] bg-[#7A12F5] text-white shadow-xs'
                        : 'border-[var(--line)] bg-[var(--s1)] text-[var(--mut)] hover:text-[var(--tx)]',
                    )}
                  >
                    All
                  </button>

                  {LEADERBOARD_TIMEFRAMES.map((tf) => (
                    <button
                      key={tf.key}
                      type="button"
                      onClick={() => {
                        setTimeframe(tf.key);
                        setWatchlistOnly(false);
                      }}
                      data-testid={`timeframe-pill-${tf.key}`}
                      className={cn(
                        'h-9 px-3 rounded-xl border text-xs font-bold transition-colors cursor-pointer',
                        timeframe === tf.key && !watchlistOnly
                          ? 'border-[#7A12F5]/50 bg-[#7A12F5]/12 text-[#7A12F5] dark:text-[#C084FC]'
                          : 'border-[var(--line)] bg-[var(--s1)] text-[var(--mut)] hover:text-[var(--tx)]',
                      )}
                    >
                      {tf.label}
                    </button>
                  ))}

                  <span
                    aria-hidden="true"
                    className="hidden sm:inline-block h-5 w-px bg-[var(--line)] mx-1"
                  />

                  <button
                    type="button"
                    onClick={() => setSortBy('pnl')}
                    data-testid="sort-pill-pnl"
                    className={cn(
                      'h-9 px-3 rounded-xl border text-xs font-bold transition-colors cursor-pointer',
                      sortBy === 'pnl'
                        ? 'border-[#10B981]/50 bg-[#10B981]/12 text-[#059669] dark:text-[#34D399]'
                        : 'border-[var(--line)] bg-[var(--s1)] text-[var(--mut)] hover:text-[var(--tx)]',
                    )}
                  >
                    Top PnL
                  </button>

                  <button
                    type="button"
                    onClick={() => setSortBy('volume')}
                    data-testid="sort-pill-volume"
                    className={cn(
                      'h-9 px-3 rounded-xl border text-xs font-bold transition-colors cursor-pointer',
                      sortBy === 'volume'
                        ? 'border-[#10B981]/50 bg-[#10B981]/12 text-[#059669] dark:text-[#34D399]'
                        : 'border-[var(--line)] bg-[var(--s1)] text-[var(--mut)] hover:text-[var(--tx)]',
                    )}
                  >
                    Top Volume
                  </button>

                  <button
                    type="button"
                    onClick={() => setWatchlistOnly((prev) => !prev)}
                    aria-pressed={watchlistOnly}
                    className={cn(
                      'h-9 px-3 rounded-xl border text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5',
                      watchlistOnly
                        ? 'border-[#F59E0B]/50 bg-[#F59E0B]/15 text-[#B45309] dark:text-[#FBBF24]'
                        : 'border-[var(--line)] bg-[var(--s1)] text-[var(--mut)] hover:text-[var(--tx)]',
                    )}
                  >
                    <Star
                      className={cn('size-3.5', watchlistOnly && 'fill-current')}
                    />
                    <span>Watchlist</span>
                    {favorites.length > 0 && (
                      <span className="font-mono tabular-nums">({favorites.length})</span>
                    )}
                  </button>
                </div>

                {/* Search Input + High-Contrast Square Search Button */}
                <form
                  onSubmit={handleSearchSubmit}
                  className="flex items-center gap-2 w-full lg:w-[340px]"
                >
                  <div className="relative flex-1">
                    <Input
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      placeholder="Search handle or 0x wallet..."
                      aria-label="Search Polymarket whales by username or wallet address"
                      data-testid="whale-search-input"
                      className="h-10 rounded-xl border-[var(--line)] bg-[var(--s1)] pr-8 text-xs sm:text-sm"
                    />
                    {searchInput && (
                      <button
                        type="button"
                        onClick={handleClearSearch}
                        aria-label="Clear search"
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--mut)] hover:text-[var(--tx)] cursor-pointer"
                      >
                        <X className="size-4" />
                      </button>
                    )}
                  </div>
                  <button
                    type="submit"
                    aria-label="Search whales"
                    data-testid="whale-search-submit"
                    className="size-10 shrink-0 rounded-xl bg-[#0B0B0F] dark:bg-[#7A12F5] hover:opacity-90 text-white flex items-center justify-center transition-opacity cursor-pointer shadow-xs"
                  >
                    <Search className="size-4" />
                  </button>
                </form>
              </div>

              {/* Whale Cards Grid / Skeleton / Error / Empty */}
              {boardLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <WhaleCardSkeleton key={idx} />
                  ))}
                </div>
              ) : boardError ? (
                <section className="rounded-3xl border border-[var(--line)] bg-[var(--s1)] p-8 text-center space-y-3">
                  <p className="text-sm font-bold text-[var(--tx)]">{boardError}</p>
                  <p className="text-xs text-[var(--mut)]">
                    Live rankings are fetched directly from Polymarket Data API v2.
                  </p>
                  <button
                    type="button"
                    onClick={() => void fetchLeaderboard()}
                    className="h-10 px-4 rounded-xl bg-[#7A12F5] hover:bg-[#690CD9] text-white text-xs font-bold cursor-pointer inline-flex items-center gap-2"
                  >
                    <RefreshCw className="size-3.5" />
                    <span>Retry Live Sync</span>
                  </button>
                </section>
              ) : visibleTraders.length === 0 ? (
                <section className="rounded-3xl border border-[var(--line)] bg-[var(--s1)] p-8 text-center space-y-3">
                  <p className="text-sm font-bold text-[var(--tx)]">
                    {watchlistOnly
                      ? 'No saved whales in your watchlist yet'
                      : 'No Polymarket whales match your search'}
                  </p>
                  <p className="text-xs text-[var(--mut)]">
                    {watchlistOnly
                      ? 'Click the star icon on any whale card to bookmark them here.'
                      : 'Try another username, paste a full 0x wallet address, or clear your filter.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setWatchlistOnly(false);
                      handleClearSearch();
                    }}
                    className="h-9 px-4 rounded-xl border border-[var(--line)] bg-[var(--s2)]/60 hover:bg-[var(--s2)] text-xs font-bold text-[var(--tx)] cursor-pointer"
                  >
                    Reset Filters
                  </button>
                </section>
              ) : (
                <>
                  <div
                    data-testid="whale-cards-grid"
                    className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5"
                  >
                    {visibleTraders.map((trader) => (
                      <WhaleCard
                        key={trader.address}
                        trader={trader}
                        subscription={subscriptionByAddress.get(
                          trader.address.toLowerCase(),
                        )}
                        isFavorite={favorites.includes(trader.address.toLowerCase())}
                        onToggleFavorite={toggleFavorite}
                        onOpenDetails={handleOpenWhaleDetails}
                      />
                    ))}
                  </div>

                  {/* Cursor-Based Load More Pagination */}
                  {!watchlistOnly && pagination.hasMore && pagination.nextCursor && (
                    <div className="flex justify-center pt-2">
                      <button
                        type="button"
                        disabled={loadingMore}
                        onClick={() =>
                          void fetchLeaderboard({
                            cursor: pagination.nextCursor,
                            append: true,
                          })
                        }
                        data-testid="load-more-whales-btn"
                        className="h-11 px-6 rounded-xl border border-[var(--line)] bg-[var(--s1)] hover:border-[#7A12F5]/50 text-sm font-bold text-[var(--tx)] transition-colors cursor-pointer inline-flex items-center gap-2 shadow-xs disabled:opacity-60"
                      >
                        {loadingMore ? (
                          <>
                            <Loader2 className="size-4 animate-spin" />
                            <span>Loading More Whales…</span>
                          </>
                        ) : (
                          <>
                            <span>Load More Whales</span>
                            <ArrowRight className="size-4" />
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* TAB 2: MY COPIED WHALES */}
      {navTab === 'copied' && wallet && (
        <SubscriptionsCard
          subscriptions={subscriptions}
          traders={traders}
          agentFunded={funding.ready}
          onChanged={refresh}
          onGoFund={() => onNavigateTab?.('fund')}
          onInspectWhale={handleOpenWhaleDetails}
          onBrowse={() => {
            setSelectedWhale(null);
            setNavTab('browse');
          }}
          entitlement={entitlement}
          onUpgrade={() => setUpgradeOpen(true)}
        />
      )}

      {/* TAB 3: COPY EXECUTION LOG */}
      {navTab === 'log' && wallet && (
        <ExecutionsCard
          executions={executions}
          onBrowse={() => {
            setSelectedWhale(null);
            setNavTab('browse');
          }}
        />
      )}

      {entitlement && (
        <UpgradeDialog
          open={upgradeOpen}
          onOpenChange={setUpgradeOpen}
          entitlement={entitlement}
          onSubscribed={refresh}
        />
      )}
    </div>
  );
}

function ActivationCard({ onActivated }: { onActivated: () => void }) {
  const t = useTranslations('dashboard.polymarketAgent.copier');
  const [mode, setMode] = useState<'create' | 'import'>('create');
  const [privateKey, setPrivateKey] = useState('');
  const [proxyWallet, setProxyWallet] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [need2fa, setNeed2fa] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError(null);
    const body =
      mode === 'create'
        ? { origin: 'create' as const }
        : privateKey.trim().startsWith('0x') && proxyWallet.trim()
          ? {
              origin: 'import_safe_owner' as const,
              privateKey: privateKey.trim(),
              proxyWallet: proxyWallet.trim(),
            }
          : { origin: 'import_eoa' as const, privateKey: privateKey.trim() };
    const res = await activateWallet(body);
    setBusy(false);
    if (res.ok) {
      onActivated();
      setNeed2fa(false);
    } else if (res.error?.code === '2fa_required') {
      setNeed2fa(true);
    } else {
      setError(res.error?.message ?? t('activateFailed'));
    }
  };

  const valid =
    mode === 'create' ||
    (/^(0x)?[0-9a-fA-F]{64}$/.test(privateKey.trim()) &&
      (!privateKey.trim().startsWith('0x') ||
        /^0x[0-9a-fA-F]{40}$/.test(proxyWallet.trim())));

  return (
    <section className="rounded-2xl border border-[var(--line)] bg-[var(--s1)] p-5 md:p-6 space-y-4">
      <div className="flex items-start gap-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#7A12F5]/10 text-[#7A12F5]">
          <Users className="size-5" />
        </span>
        <div className="space-y-1">
          <p className="font-display text-base font-bold text-[var(--tx)]">
            {t('headline')}
          </p>
          <p className="max-w-prose text-sm text-[var(--mut)]">{t('body')}</p>
        </div>
      </div>

      <div className="flex gap-2" role="tablist" aria-label={t('activateTitle')}>
        <Button
          type="button"
          variant={mode === 'create' ? 'default' : 'outline'}
          size="sm"
          className="cursor-pointer"
          onClick={() => setMode('create')}
          aria-pressed={mode === 'create'}
        >
          <Wallet data-icon="inline-start" />
          {t('createWallet')}
        </Button>
        <Button
          type="button"
          variant={mode === 'import' ? 'default' : 'outline'}
          size="sm"
          className="cursor-pointer"
          onClick={() => setMode('import')}
          aria-pressed={mode === 'import'}
        >
          <KeyRound data-icon="inline-start" />
          {t('importWallet')}
        </Button>
      </div>

      {mode === 'import' && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="copier-private-key">{t('privateKeyLabel')}</Label>
            <Input
              id="copier-private-key"
              type="password"
              autoComplete="off"
              value={privateKey}
              onChange={(e) => setPrivateKey(e.target.value)}
              placeholder={t('privateKeyPlaceholder')}
              aria-describedby="copier-private-key-help"
            />
            <p id="copier-private-key-help" className="text-xs text-[var(--mut)]">
              {t('privateKeyHelp')}
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="copier-proxy-wallet">{t('proxyWalletLabel')}</Label>
            <Input
              id="copier-proxy-wallet"
              value={proxyWallet}
              onChange={(e) => setProxyWallet(e.target.value)}
              placeholder={t('proxyWalletPlaceholder')}
              aria-describedby="copier-proxy-help"
            />
            <p id="copier-proxy-help" className="text-xs text-[var(--mut)]">
              {t('proxyWalletHelp')}
            </p>
          </div>
        </div>
      )}

      {need2fa && <TwoFaChallenge onVerified={() => void submit()} />}
      {error && (
        <p role="alert" className="text-sm text-ios-red">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <Button
          type="button"
          onClick={submit}
          disabled={busy || !valid}
          className="cursor-pointer"
        >
          {busy ? t('activating') : t('activateCta')}
        </Button>
        <p className="text-xs text-[var(--mut)]">{t('activateHint')}</p>
      </div>
    </section>
  );
}

function SubscriptionsCard({
  subscriptions,
  traders,
  agentFunded,
  onChanged,
  onGoFund,
  onInspectWhale,
  onBrowse,
  entitlement,
  onUpgrade,
}: {
  subscriptions: CopierSubscription[];
  traders: LiveLeaderboardTrader[];
  agentFunded: boolean;
  onChanged: () => void;
  onGoFund: () => void;
  onInspectWhale: (trader: LiveLeaderboardTrader) => void;
  onBrowse: () => void;
  entitlement: CopierEntitlement | null;
  onUpgrade: () => void;
}) {
  const t = useTranslations('dashboard.polymarketAgent.copier');
  const tb = useTranslations('dashboard.polymarketAgent.copier.billing');
  const isPro = entitlement?.tier === 'pro';
  const slots = entitlement?.slots;
  const activeSubs = subscriptions.filter((s) => s.status !== 'stopped');
  const liveCount = subscriptions.filter((s) => s.status === 'live').length;

  const [traderAddress, setTraderAddress] = useState('');
  const [copySize, setCopySize] = useState('15');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const add = async () => {
    setBusy(true);
    setError(null);
    const res = await createSubscription({
      traderAddress: traderAddress.trim(),
      initialStatus: agentFunded ? 'live' : 'preview',
      strategyConfig: {
        strategy: 'PERCENTAGE',
        copySize: Number(copySize) || 15,
        maxOrderSizeUsd: 100,
        minOrderSizeUsd: 10,
        allocationUsd: 250,
        slippagePct: 1,
      },
    });
    setBusy(false);
    if (res.ok) {
      setTraderAddress('');
      toast.success('Custom Polymarket wallet connected');
      onChanged();
    } else {
      setError(res.error?.message ?? t('addTraderFailed'));
    }
  };

  const setStatus = async (id: string, status: CopierSubscription['status']) => {
    if (status === 'live' && !agentFunded) {
      toast.error('Fund your Agent wallet with USDC.e & POL before going live');
      onGoFund();
      return;
    }
    await updateSubscription(id, { status });
    onChanged();
  };

  const validAddress = /^0x[0-9a-fA-F]{40}$/.test(traderAddress.trim());

  return (
    <section
      data-testid="my-copied-whales-panel"
      className="overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--s1)] shadow-xs"
    >
      <div className="px-5 sm:px-6 py-4 border-b border-[var(--line)] flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-extrabold tracking-tight text-[var(--tx)]">
            My Copied Whales
          </h2>
          <p className="text-xs text-[var(--mut)]">
            Manage active mirrors, sizing rules, or attach any Polymarket 0x wallet.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-[var(--mut)] tabular-nums">
          <span>{activeSubs.length} connected</span>
          {entitlement?.billingEnabled && slots !== undefined ? (
            isPro ? (
              <span className="inline-flex items-center gap-1 font-bold text-[#D97706] dark:text-[#FBBF24]">
                <Crown className="size-3.5" aria-hidden="true" />
                Pro
              </span>
            ) : (
              <button
                type="button"
                className="cursor-pointer font-bold text-[#7A12F5] dark:text-[#C084FC] hover:underline"
                onClick={onUpgrade}
                aria-label={tb('upgradeCta')}
              >
                · Free {liveCount}/{slots} slots
              </button>
            )
          ) : null}
        </div>
      </div>

      {/* Add Custom 0x Polymarket Wallet Row */}
      <div className="px-5 sm:px-6 py-4 border-b border-[var(--line)] bg-[var(--s2)]/30 space-y-3">
        <div className="grid gap-2.5 sm:grid-cols-[1fr_auto_auto] sm:items-end">
          <div className="space-y-1">
            <Label
              htmlFor="copier-trader-address"
              className="text-xs font-semibold text-[var(--mut)]"
            >
              Connect custom Polymarket wallet (0x)
            </Label>
            <Input
              id="copier-trader-address"
              value={traderAddress}
              onChange={(e) => setTraderAddress(e.target.value)}
              placeholder="0x..."
              aria-invalid={!validAddress && traderAddress.length > 0}
              className="h-10 rounded-xl text-xs font-mono"
            />
          </div>
          <div className="space-y-1">
            <Label
              htmlFor="copier-copy-size"
              className="text-xs font-semibold text-[var(--mut)]"
            >
              Copy %
            </Label>
            <Input
              id="copier-copy-size"
              type="number"
              min={1}
              max={100}
              value={copySize}
              onChange={(e) => setCopySize(e.target.value)}
              className="h-10 w-24 rounded-xl text-xs font-mono tabular-nums"
            />
          </div>
          <Button
            type="button"
            size="sm"
            onClick={() => void add()}
            disabled={busy || !validAddress}
            className="h-10 rounded-xl bg-[#7A12F5] hover:bg-[#690CD9] text-white cursor-pointer"
          >
            <Plus className="size-4" />
            <span>{t('addTrader')}</span>
          </Button>
        </div>
        {error && (
          <p role="alert" className="text-xs text-[#E11D48]">
            {error}
          </p>
        )}
      </div>

      {activeSubs.length === 0 ? (
        <div className="p-10 text-center space-y-3">
          <p className="text-sm font-bold text-[var(--tx)]">
            You aren&apos;t mirroring any Polymarket whales yet
          </p>
          <p className="text-xs text-[var(--mut)] max-w-md mx-auto">
            Browse top-ranked prediction wallets, inspect their live open positions, and
            connect auto-copy rules in one click.
          </p>
          <button
            type="button"
            onClick={onBrowse}
            className="h-10 px-4 rounded-xl bg-[#7A12F5] hover:bg-[#690CD9] text-white text-xs font-bold cursor-pointer inline-flex items-center gap-2"
          >
            <span>Browse Polymarket Whales</span>
            <ArrowRight className="size-3.5" />
          </button>
        </div>
      ) : (
        <ul className="divide-y divide-[var(--line)]">
          {activeSubs.map((sub) => {
            const matchedTrader = traders.find(
              (item) => item.address.toLowerCase() === sub.traderAddress.toLowerCase(),
            );
            const displayName = sub.traderHandle ?? shortenEvmAddress(sub.traderAddress);
            return (
              <li
                key={sub.id}
                className="flex flex-col gap-3 px-5 sm:px-6 py-4 sm:flex-row sm:items-center sm:justify-between hover:bg-[var(--s2)]/35 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <WhaleAvatar
                    name={displayName}
                    imageUrl={sub.traderAvatar ?? matchedTrader?.profileImage ?? null}
                    toneClass={matchedTrader?.avatarTone ?? pickAvatarTone(sub.traderAddress)}
                    size="sm"
                  />
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-extrabold text-[var(--tx)] truncate">
                        {displayName}
                      </span>
                      <StatusText status={sub.status} />
                    </div>
                    <p className="truncate font-mono text-xs text-[var(--mut)] tabular-nums">
                      {shortenEvmAddress(sub.traderAddress)} ·{' '}
                      {sub.strategyConfig.strategy === 'FIXED'
                        ? `$${sub.strategyConfig.copySize} fixed`
                        : `${sub.strategyConfig.copySize}% mirror`}{' '}
                      · Max ${sub.strategyConfig.maxOrderSizeUsd}
                      {sub.strategyConfig.allocationUsd
                        ? ` · Alloc $${sub.strategyConfig.allocationUsd}`
                        : ''}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap shrink-0 items-center gap-1.5">
                  {matchedTrader && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="cursor-pointer h-8 rounded-lg text-xs"
                      onClick={() => onInspectWhale(matchedTrader)}
                    >
                      Details
                    </Button>
                  )}
                  {sub.status !== 'live' && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="cursor-pointer h-8 rounded-lg text-xs"
                      onClick={() => void setStatus(sub.id, 'live')}
                    >
                      <PlayCircle className="size-3.5" />
                      {t('goLive')}
                    </Button>
                  )}
                  {sub.status === 'live' && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="cursor-pointer h-8 rounded-lg text-xs"
                      onClick={() => void setStatus(sub.id, 'paused')}
                    >
                      <PauseCircle className="size-3.5" />
                      {t('pause')}
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="cursor-pointer h-8 rounded-lg text-xs text-[#E11D48] hover:text-[#E11D48]"
                    onClick={() => void setStatus(sub.id, 'stopped')}
                  >
                    <StopCircle className="size-3.5" />
                    {t('stop')}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function StatusText({ status }: { status: CopierSubscription['status'] }) {
  const t = useTranslations('dashboard.polymarketAgent.copier');
  const tone =
    status === 'live'
      ? 'bg-[#10B981]/15 text-[#059669] dark:text-[#34D399]'
      : status === 'preview'
        ? 'bg-[#7A12F5]/12 text-[#7A12F5] dark:text-[#C084FC]'
        : status === 'paused'
          ? 'bg-[#F59E0B]/15 text-[#B45309] dark:text-[#FBBF24]'
          : 'bg-[var(--s2)] text-[var(--mut)]';
  return (
    <span className={cn('rounded-md px-1.5 py-0.5 text-[11px] font-bold', tone)}>
      {t(`status.${status}`)}
    </span>
  );
}

function ExecutionsCard({
  executions,
  onBrowse,
}: {
  executions: CopierExecution[];
  onBrowse: () => void;
}) {
  return (
    <section
      data-testid="copy-execution-log-panel"
      className="overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--s1)] shadow-xs"
    >
      <div className="px-5 sm:px-6 py-4 border-b border-[var(--line)] flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-base font-extrabold tracking-tight text-[var(--tx)]">
            <Activity className="size-4 text-[#7A12F5]" />
            <span>Copy Execution Log</span>
          </h2>
          <p className="text-xs text-[var(--mut)]">
            Real-time log of connected whale triggers and mirrored orders.
          </p>
        </div>
        <span className="font-mono text-xs text-[var(--mut)] tabular-nums">
          {executions.length} events
        </span>
      </div>

      {executions.length === 0 ? (
        <div className="p-10 text-center space-y-3">
          <p className="text-sm font-bold text-[var(--tx)]">
            No copy executions recorded yet
          </p>
          <p className="text-xs text-[var(--mut)] max-w-md mx-auto">
            Once you connect a Polymarket whale, every mirrored entry, exit, and sizing
            decision appears here automatically.
          </p>
          <button
            type="button"
            onClick={onBrowse}
            className="h-10 px-4 rounded-xl bg-[#7A12F5] hover:bg-[#690CD9] text-white text-xs font-bold cursor-pointer inline-flex items-center gap-2"
          >
            <span>Explore Top Whales</span>
            <ArrowRight className="size-3.5" />
          </button>
        </div>
      ) : (
        <ul className="divide-y divide-[var(--line)]">
          {executions.map((e) => (
            <li
              key={e.id}
              className="flex flex-col gap-1.5 px-5 sm:px-6 py-4 text-xs sm:flex-row sm:items-center sm:justify-between hover:bg-[var(--s2)]/35 transition-colors"
            >
              <div className="min-w-0 space-y-0.5">
                <p className="text-sm font-bold text-[var(--tx)] truncate">
                  {e.market.slug ?? e.market.asset ?? e.id}
                </p>
                <p className="text-xs text-[var(--mut)] tabular-nums">
                  {e.sizing?.reasoning ??
                    `${e.market.side ?? 'TRADE'} · $${Number(e.traderUsdcSize).toFixed(2)} USDC`}
                </p>
              </div>
              <div className="flex items-center gap-2.5 shrink-0">
                {e.sizing?.finalAmount !== undefined && e.sizing.finalAmount > 0 && (
                  <span className="font-mono text-sm font-extrabold text-[var(--tx)] tabular-nums">
                    Max ${e.sizing.finalAmount.toFixed(0)}
                  </span>
                )}
                <span className="rounded-md bg-[#10B981]/15 px-2 py-0.5 text-[11px] font-bold uppercase text-[#059669] dark:text-[#34D399]">
                  {e.status}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
