'use client';

/**
 * polymarket-agent/leaderboard-table.tsx — Minimalist live Polymarket Leaderboard mirror.
 *
 * Fetches directly from /api/polymarket/leaderboard (proxying data-api.polymarket.com/v2/leaderboard)
 * and fetches real trader open positions & recent trades on expand (/api/polymarket/trader/[address]).
 *
 * Design discipline:
 *   - Single-elevation surface with hairline 1px dividers
 *   - Zero static metadata pills, zero synthetic win-rate guesses
 *   - Tabular numerals (`font-mono tabular-nums`) on all ranks, volumes, and PnL values
 *   - Responsive desktop table & clean mobile rows
 */
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUpRight,
  BadgeCheck,
  Check,
  ChevronDown,
  Copy,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  LEADERBOARD_CATEGORIES,
  LEADERBOARD_TIMEFRAMES,
  fallbackToLiveEntries,
  formatCompactUsd,
  formatRelativeTime,
  formatTradeUsd,
  shortenEvmAddress,
  type LeaderboardCategory,
  type LeaderboardSort,
  type LeaderboardTimeframe,
  type LiveLeaderboardTrader,
  type LiveTraderPosition,
  type LiveTraderTrade,
} from '@/lib/polymarket/leaderboard';
import { createSubscription, type CopierSubscription } from './copier-hooks';

interface TraderDetailPayload {
  positions: LiveTraderPosition[];
  trades: LiveTraderTrade[];
  fetchedAt: string;
}

interface LeaderboardTableProps {
  subscriptions: CopierSubscription[];
  agentFunded: boolean;
  onCopied: () => void;
  onGoFund: () => void;
}

export function LeaderboardTable({
  subscriptions,
  agentFunded,
  onCopied,
  onGoFund,
}: LeaderboardTableProps) {
  const [timeframe, setTimeframe] = useState<LeaderboardTimeframe>('month');
  const [category, setCategory] = useState<LeaderboardCategory>('All');
  const [sortBy, setSortBy] = useState<LeaderboardSort>('pnl');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [limit, setLimit] = useState<25 | 50>(25);

  const [traders, setTraders] = useState<LiveLeaderboardTrader[]>(() =>
    fallbackToLiveEntries({
      timeframe: 'month',
      category: 'All',
      sortBy: 'pnl',
      search: '',
    }),
  );
  const [source, setSource] = useState<'live' | 'fallback'>('live');
  const [syncedAt, setSyncedAt] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const requestKey = `${timeframe}|${category}|${sortBy}|${debouncedSearch}|${limit}|${refreshTick}`;
  const [loadedKey, setLoadedKey] = useState<string>('');
  const loading = loadedKey !== requestKey;

  const [expandedAddress, setExpandedAddress] = useState<string | null>(null);
  const [copyPct, setCopyPct] = useState<number>(10);
  const [maxUsd, setMaxUsd] = useState<number>(250);
  const [userLiveChoice, setUserLiveChoice] = useState<boolean | null>(null);
  const [busyAddress, setBusyAddress] = useState<string | null>(null);
  const [copiedAddr, setCopiedAddr] = useState<string | null>(null);

  const [traderDetails, setTraderDetails] = useState<Record<string, TraderDetailPayload>>({});
  const [detailLoadingAddr, setDetailLoadingAddr] = useState<string | null>(null);
  const detailCacheRef = useRef<Set<string>>(new Set());

  const startLive = agentFunded ? (userLiveChoice ?? true) : false;

  // Debounce search input so typing stays responsive
  useEffect(() => {
    const id = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 240);
    return () => window.clearTimeout(id);
  }, [searchInput]);

  // Fetch live leaderboard mirror from our server proxy
  useEffect(() => {
    const controller = new AbortController();

    const params = new URLSearchParams({
      timeframe,
      category,
      sortBy: sortBy === 'volume' ? 'volume' : 'pnl',
      limit: String(limit),
    });
    if (debouncedSearch) {
      params.set('search', debouncedSearch);
    }

    void fetch(`/api/polymarket/leaderboard?${params.toString()}`, {
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return (await res.json()) as {
          source: 'live' | 'fallback';
          syncedAt?: string;
          traders?: LiveLeaderboardTrader[];
        };
      })
      .then((data) => {
        if (controller.signal.aborted) return;
        if (Array.isArray(data.traders)) {
          setTraders(data.traders);
        }
        setSource(data.source === 'fallback' ? 'fallback' : 'live');
        setSyncedAt(data.syncedAt ?? new Date().toISOString());
        setLoadedKey(requestKey);
      })
      .catch((err) => {
        if (controller.signal.aborted || err?.name === 'AbortError') return;
        setTraders(
          fallbackToLiveEntries({
            timeframe,
            category,
            sortBy,
            search: debouncedSearch,
          }),
        );
        setSource('fallback');
        setLoadedKey(requestKey);
      });

    return () => controller.abort();
  }, [timeframe, category, sortBy, debouncedSearch, limit, refreshTick, requestKey]);

  // Fetch trader positions & recent trades on expand
  const loadTraderDetails = useCallback(async (address: string) => {
    const key = address.toLowerCase();
    if (detailCacheRef.current.has(key)) return;
    setDetailLoadingAddr(key);
    try {
      const res = await fetch(`/api/polymarket/trader/${encodeURIComponent(address)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as TraderDetailPayload;
      detailCacheRef.current.add(key);
      setTraderDetails((prev) => ({ ...prev, [key]: json }));
    } catch {
      detailCacheRef.current.add(key);
      setTraderDetails((prev) => ({
        ...prev,
        [key]: { positions: [], trades: [], fetchedAt: new Date().toISOString() },
      }));
    } finally {
      setDetailLoadingAddr((curr) => (curr === key ? null : curr));
    }
  }, []);

  const toggleExpand = useCallback(
    (address: string) => {
      setExpandedAddress((curr) => {
        const next = curr?.toLowerCase() === address.toLowerCase() ? null : address;
        if (next) {
          void loadTraderDetails(next);
        }
        return next;
      });
    },
    [loadTraderDetails],
  );

  const subByAddress = useMemo(() => {
    const map = new Map<string, CopierSubscription>();
    for (const sub of subscriptions) {
      if (sub.status !== 'stopped') {
        map.set(sub.traderAddress.toLowerCase(), sub);
      }
    }
    return map;
  }, [subscriptions]);

  const handleCopyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddr(address);
      toast.success('Wallet address copied');
      window.setTimeout(() => setCopiedAddr(null), 1600);
    } catch {
      toast.info(shortenEvmAddress(address));
    }
  };

  const handleConfirmCopy = async (trader: LiveLeaderboardTrader) => {
    setBusyAddress(trader.address);
    const mode = startLive && agentFunded ? 'live' : 'preview';
    const handleLabel = trader.isAnonAddress
      ? trader.displayName
      : trader.displayName.startsWith('@')
        ? trader.displayName
        : `@${trader.displayName}`;

    const res = await createSubscription({
      traderAddress: trader.address,
      traderHandle: handleLabel,
      specialty: category === 'All' ? 'Polymarket' : category,
      initialStatus: mode,
      strategyConfig: {
        strategy: 'PERCENTAGE',
        copySize: copyPct,
        maxOrderSizeUsd: maxUsd,
        minOrderSizeUsd: 10,
      },
    });
    setBusyAddress(null);
    if (res.ok) {
      setExpandedAddress(null);
      toast.success(
        mode === 'live'
          ? `Copying ${trader.displayName} (${copyPct}% · max $${maxUsd} Live)`
          : `Queued ${trader.displayName} in Preview. Fund your agent to go live.`,
      );
      onCopied();
    } else {
      toast.error('Could not configure trader copy');
    }
  };

  const syncedLabel = useMemo(() => {
    if (!syncedAt) return null;
    try {
      return new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(syncedAt));
    } catch {
      return null;
    }
  }, [syncedAt]);

  return (
    <section
      aria-label="Polymarket Leaderboard"
      className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--s1)]"
    >
      {/* Top Editorial Bar */}
      <div className="px-5 pt-5 pb-4 sm:px-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[var(--tx)]">
              Leaderboard
            </h2>
            <a
              href="https://polymarket.com/leaderboard"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-[var(--mut)] hover:text-[var(--tx)] transition-colors whitespace-nowrap"
            >
              <span>polymarket.com/leaderboard</span>
              <ArrowUpRight className="size-3" />
            </a>
          </div>
          <p className="mt-0.5 text-xs text-[var(--mut)] tabular-nums">
            {source === 'live'
              ? `Live mirror${syncedLabel ? ` · Synced ${syncedLabel}` : ''}`
              : 'Cached leaderboard snapshot'}
            {' · '}
            Click any trader to inspect open positions or copy their trades.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <div
            role="tablist"
            aria-label="Leaderboard timeframe"
            className="inline-flex items-center gap-0.5 rounded-lg bg-[var(--s2)] p-0.5 border border-[var(--line)]"
          >
            {LEADERBOARD_TIMEFRAMES.map((tf) => (
              <button
                key={tf.key}
                type="button"
                role="tab"
                aria-selected={timeframe === tf.key}
                onClick={() => setTimeframe(tf.key)}
                className={cn(
                  'h-7 px-2.5 sm:px-3 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0',
                  timeframe === tf.key
                    ? 'bg-[var(--s1)] text-[var(--tx)] shadow-2xs'
                    : 'text-[var(--mut)] hover:text-[var(--tx)]',
                )}
              >
                <span className="sm:hidden">{tf.shortLabel}</span>
                <span className="hidden sm:inline">{tf.label}</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setRefreshTick((t) => t + 1)}
            disabled={loading}
            aria-label="Refresh leaderboard"
            title="Refresh live Polymarket leaderboard"
            className="size-8 inline-flex items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--s1)] text-[var(--mut)] hover:text-[var(--tx)] hover:bg-[var(--s2)] transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={cn('size-3.5', loading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* Category Underline Tabs + Search / Sort Controls */}
      <div className="px-5 sm:px-6 border-b border-[var(--line)] flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <nav
          aria-label="Leaderboard categories"
          className="flex items-center gap-5 overflow-x-auto no-scrollbar -mb-px"
        >
          {LEADERBOARD_CATEGORIES.map((cat) => {
            const active = category === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={cn(
                  'relative py-3 text-xs sm:text-[13px] font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 border-b-2',
                  active
                    ? 'border-[#2E5CFF] text-[var(--tx)]'
                    : 'border-transparent text-[var(--mut)] hover:text-[var(--tx)]',
                )}
              >
                {cat}
              </button>
            );
          })}
        </nav>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 pb-3 lg:pb-2.5">
          <div className="relative flex-1 sm:w-56">
            <Search className="size-3.5 text-[var(--mut)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search trader or 0x..."
              aria-label="Search Polymarket leaderboard traders"
              className="h-8 w-full rounded-lg border border-[var(--line)] bg-[var(--s2)]/60 pl-8 pr-7 text-xs text-[var(--tx)] placeholder:text-[var(--mut)] outline-none focus:border-[#2E5CFF] focus:bg-[var(--s1)] transition-colors"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--mut)] hover:text-[var(--tx)] cursor-pointer"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          <div
            role="group"
            aria-label="Sort leaderboard by"
            className="inline-flex items-center rounded-lg border border-[var(--line)] bg-[var(--s2)]/60 p-0.5 shrink-0"
          >
            <button
              type="button"
              onClick={() => setSortBy('pnl')}
              className={cn(
                'h-7 px-2.5 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap',
                sortBy !== 'volume'
                  ? 'bg-[var(--s1)] text-[var(--tx)] shadow-2xs'
                  : 'text-[var(--mut)] hover:text-[var(--tx)]',
              )}
            >
              Profit / Loss
            </button>
            <button
              type="button"
              onClick={() => setSortBy('volume')}
              className={cn(
                'h-7 px-2.5 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap',
                sortBy === 'volume'
                  ? 'bg-[var(--s1)] text-[var(--tx)] shadow-2xs'
                  : 'text-[var(--mut)] hover:text-[var(--tx)]',
              )}
            >
              Volume
            </button>
          </div>
        </div>
      </div>

      {/* Body States: Loading Skeleton, Empty State, or Clean Table */}
      {loading && traders.length === 0 ? (
        <LeaderboardSkeleton />
      ) : traders.length === 0 ? (
        <div className="px-6 py-12 text-center space-y-2.5">
          <p className="text-sm font-semibold text-[var(--tx)]">
            No traders matched your filter
          </p>
          <p className="text-xs text-[var(--mut)] max-w-sm mx-auto">
            Try pasting a full <span className="font-mono">0x...</span> Polymarket wallet address or resetting filters.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="cursor-pointer mt-1"
            onClick={() => {
              setSearchInput('');
              setDebouncedSearch('');
              setCategory('All');
            }}
          >
            Reset Filters
          </Button>
        </div>
      ) : (
        <>
          {/* Desktop Minimalist Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--line)] text-[11px] font-semibold uppercase tracking-wider text-[var(--mut)]">
                  <th className="py-3 pl-6 pr-2 w-16">Rank</th>
                  <th className="py-3 px-3">Trader</th>
                  <th className="py-3 px-3 text-right">Volume</th>
                  <th className="py-3 px-3 text-right">Profit / Loss</th>
                  <th className="py-3 pl-3 pr-6 text-right w-40">Copy</th>
                </tr>
              </thead>
              <tbody
                className={cn(
                  'divide-y divide-[var(--line)] text-sm transition-opacity duration-200',
                  loading && 'opacity-55',
                )}
              >
                {traders.map((trader) => {
                  const existingSub = subByAddress.get(trader.address.toLowerCase());
                  const isExpanded =
                    expandedAddress?.toLowerCase() === trader.address.toLowerCase();
                  const detail = traderDetails[trader.address.toLowerCase()];
                  const isDetailLoading = detailLoadingAddr === trader.address.toLowerCase();

                  return (
                    <Fragment key={`${trader.address}-${trader.rank}`}>
                      <tr
                        className={cn(
                          'group transition-colors',
                          isExpanded ? 'bg-[var(--s2)]/45' : 'hover:bg-[var(--s2)]/35',
                        )}
                      >
                        <td className="py-4 pl-6 pr-2 font-mono text-xs font-semibold tabular-nums">
                          <RankNumeral rank={trader.rank} />
                        </td>

                        <td className="py-4 px-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <TraderAvatar trader={trader} />

                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <button
                                  type="button"
                                  onClick={() => toggleExpand(trader.address)}
                                  className="font-semibold text-sm text-[var(--tx)] hover:text-[#2E5CFF] transition-colors truncate cursor-pointer text-left"
                                >
                                  {trader.displayName}
                                </button>
                                {trader.verified && (
                                  <BadgeCheck
                                    aria-label="Verified trader"
                                    className="size-3.5 text-[#2E5CFF] shrink-0"
                                  />
                                )}
                                <a
                                  href={trader.polymarketUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  aria-label={`View ${trader.displayName} on Polymarket`}
                                  className="text-[var(--mut)] hover:text-[var(--tx)] opacity-70 group-hover:opacity-100 transition-opacity shrink-0"
                                >
                                  <ArrowUpRight className="size-3.5" />
                                </a>
                              </div>

                              <div className="flex items-center gap-2 text-[11px] text-[var(--mut)] mt-0.5">
                                <button
                                  type="button"
                                  onClick={() => void handleCopyAddress(trader.address)}
                                  className="inline-flex items-center gap-1 hover:text-[var(--tx)] cursor-pointer transition-colors"
                                  title={trader.address}
                                >
                                  <span className={trader.isAnonAddress ? 'font-sans' : 'font-mono'}>
                                    {trader.isAnonAddress
                                      ? copiedAddr === trader.address
                                        ? 'Copied'
                                        : 'Copy address'
                                      : shortenEvmAddress(trader.address)}
                                  </span>
                                  {copiedAddr === trader.address ? (
                                    <Check className="size-2.5 text-[#10B981]" />
                                  ) : (
                                    <Copy className="size-2.5 opacity-60" />
                                  )}
                                </button>
                                {trader.xUsername && (
                                  <>
                                    <span aria-hidden="true">·</span>
                                    <a
                                      href={`https://x.com/${trader.xUsername}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="hover:text-[var(--tx)] transition-colors truncate"
                                    >
                                      @{trader.xUsername}
                                    </a>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-3 text-right font-mono text-sm font-medium text-[var(--tx)] tabular-nums whitespace-nowrap">
                          {formatCompactUsd(trader.volumeUsd)}
                        </td>

                        <td
                          className={cn(
                            'py-4 px-3 text-right font-mono text-sm font-bold tabular-nums whitespace-nowrap',
                            trader.pnlUsd >= 0
                              ? 'text-[#10B981]'
                              : 'text-[#F43F5E]',
                          )}
                        >
                          {formatCompactUsd(trader.pnlUsd, true)}
                        </td>

                        <td className="py-4 pl-3 pr-6 text-right">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => toggleExpand(trader.address)}
                              aria-expanded={isExpanded}
                              aria-label={`Inspect ${trader.displayName} positions`}
                              className="size-8 inline-flex items-center justify-center rounded-lg text-[var(--mut)] hover:text-[var(--tx)] hover:bg-[var(--s2)] transition-colors cursor-pointer"
                            >
                              <ChevronDown
                                className={cn(
                                  'size-4 transition-transform duration-200',
                                  isExpanded && 'rotate-180',
                                )}
                              />
                            </button>

                            {existingSub ? (
                              <button
                                type="button"
                                onClick={() => toggleExpand(trader.address)}
                                className="h-8 px-3 rounded-lg border border-[#10B981]/30 bg-[#10B981]/10 text-[#10B981] text-xs font-semibold hover:bg-[#10B981]/18 transition-colors cursor-pointer whitespace-nowrap inline-flex items-center gap-1.5"
                              >
                                <Check className="size-3.5" />
                                <span>{existingSub.status === 'live' ? 'Copying' : 'Preview'}</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => toggleExpand(trader.address)}
                                className="h-8 px-3.5 rounded-lg bg-[#2E5CFF] text-white text-xs font-semibold hover:bg-[#1E4DF0] active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap inline-flex items-center gap-1.5"
                              >
                                <span>Copy</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <tr className="bg-[var(--s2)]/45">
                            <td colSpan={5} className="p-0">
                              <motion.div
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                                className="px-6 py-5"
                              >
                                <TraderInspectAndCopy
                                  trader={trader}
                                  detail={detail}
                                  detailLoading={isDetailLoading}
                                  copyPct={copyPct}
                                  setCopyPct={setCopyPct}
                                  maxUsd={maxUsd}
                                  setMaxUsd={setMaxUsd}
                                  startLive={startLive}
                                  setStartLive={setUserLiveChoice}
                                  agentFunded={agentFunded}
                                  busy={busyAddress === trader.address}
                                  existingSub={existingSub}
                                  onCancel={() => setExpandedAddress(null)}
                                  onConfirm={() => void handleConfirmCopy(trader)}
                                  onGoFund={onGoFund}
                                />
                              </motion.div>
                            </td>
                          </tr>
                        )}
                      </AnimatePresence>
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Hairline List */}
          <div
            className={cn(
              'divide-y divide-[var(--line)] md:hidden transition-opacity duration-200',
              loading && 'opacity-55',
            )}
          >
            {traders.map((trader) => {
              const existingSub = subByAddress.get(trader.address.toLowerCase());
              const isExpanded =
                expandedAddress?.toLowerCase() === trader.address.toLowerCase();
              const detail = traderDetails[trader.address.toLowerCase()];
              const isDetailLoading = detailLoadingAddr === trader.address.toLowerCase();

              return (
                <div key={`${trader.address}-${trader.rank}`} className="p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <RankNumeral rank={trader.rank} />
                      <TraderAvatar trader={trader} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => toggleExpand(trader.address)}
                            className="font-semibold text-sm text-[var(--tx)] truncate cursor-pointer text-left"
                          >
                            {trader.displayName}
                          </button>
                          {trader.verified && (
                            <BadgeCheck className="size-3.5 text-[#2E5CFF] shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-[var(--mut)] truncate">
                          <span className={trader.isAnonAddress ? 'font-sans' : 'font-mono'}>
                            {trader.isAnonAddress ? 'Polygon wallet' : shortenEvmAddress(trader.address)}
                          </span>
                          {trader.xUsername && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-sans">@{trader.xUsername}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleExpand(trader.address)}
                      className={cn(
                        'h-8 px-3 rounded-lg text-xs font-semibold cursor-pointer shrink-0 whitespace-nowrap inline-flex items-center gap-1',
                        existingSub
                          ? 'border border-[#10B981]/30 bg-[#10B981]/10 text-[#10B981]'
                          : 'bg-[#2E5CFF] text-white',
                      )}
                    >
                      {existingSub && <Check className="size-3.5" />}
                      <span>
                        {existingSub ? (existingSub.status === 'live' ? 'Copying' : 'Preview') : 'Copy'}
                      </span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-0.5">
                    <div>
                      <span className="text-[var(--mut)] mr-1.5">Volume</span>
                      <span className="font-mono font-semibold text-[var(--tx)] tabular-nums">
                        {formatCompactUsd(trader.volumeUsd)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[var(--mut)] mr-1.5">PnL</span>
                      <span
                        className={cn(
                          'font-mono font-bold tabular-nums',
                          trader.pnlUsd >= 0 ? 'text-[#10B981]' : 'text-[#F43F5E]',
                        )}
                      >
                        {formatCompactUsd(trader.pnlUsd, true)}
                      </span>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="pt-3 border-t border-[var(--line)]">
                      <TraderInspectAndCopy
                        trader={trader}
                        detail={detail}
                        detailLoading={isDetailLoading}
                        copyPct={copyPct}
                        setCopyPct={setCopyPct}
                        maxUsd={maxUsd}
                        setMaxUsd={setMaxUsd}
                        startLive={startLive}
                        setStartLive={setUserLiveChoice}
                        agentFunded={agentFunded}
                        busy={busyAddress === trader.address}
                        existingSub={existingSub}
                        onCancel={() => setExpandedAddress(null)}
                        onConfirm={() => void handleConfirmCopy(trader)}
                        onGoFund={onGoFund}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Quiet Footer & Show Top 50 Toggle */}
          <div className="px-5 py-3 sm:px-6 border-t border-[var(--line)] flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--mut)]">
            <span className="tabular-nums">
              Showing {traders.length} ranked Polymarket {traders.length === 1 ? 'trader' : 'traders'}
            </span>
            {!debouncedSearch && (
              <button
                type="button"
                onClick={() => setLimit((l) => (l === 25 ? 50 : 25))}
                className="font-semibold text-[var(--tx)] hover:text-[#2E5CFF] transition-colors cursor-pointer"
              >
                {limit === 25 ? 'Show Top 50' : 'Show Top 25'}
              </button>
            )}
          </div>
        </>
      )}
    </section>
  );
}

function RankNumeral({ rank }: { rank: number }) {
  const formatted = String(rank).padStart(2, '0');
  if (rank === 1) {
    return <span className="text-[#D97706] dark:text-[#FBBF24] font-bold">{formatted}</span>;
  }
  if (rank === 2) {
    return <span className="text-slate-600 dark:text-slate-300 font-bold">{formatted}</span>;
  }
  if (rank === 3) {
    return <span className="text-[#B45309] dark:text-[#F59E0B] font-bold">{formatted}</span>;
  }
  return <span className="text-[var(--mut)] font-medium">{formatted}</span>;
}

function TraderAvatar({ trader }: { trader: LiveLeaderboardTrader }) {
  const [imgFailed, setImgFailed] = useState(false);
  const initials = trader.isAnonAddress
    ? trader.address.slice(2, 4).toUpperCase()
    : trader.displayName.slice(0, 2).toUpperCase();

  if (trader.profileImage && !imgFailed) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={trader.profileImage}
        alt={trader.displayName}
        referrerPolicy="no-referrer"
        onError={() => setImgFailed(true)}
        className="size-9 rounded-full object-cover border border-[var(--line)] shrink-0 bg-[var(--s2)]"
      />
    );
  }

  return (
    <span
      className={cn(
        'size-9 rounded-full bg-gradient-to-br flex items-center justify-center text-[11px] font-bold text-white shrink-0',
        trader.avatarTone,
      )}
    >
      {initials}
    </span>
  );
}

function TraderInspectAndCopy({
  trader,
  detail,
  detailLoading,
  copyPct,
  setCopyPct,
  maxUsd,
  setMaxUsd,
  startLive,
  setStartLive,
  agentFunded,
  busy,
  existingSub,
  onCancel,
  onConfirm,
  onGoFund,
}: {
  trader: LiveLeaderboardTrader;
  detail?: TraderDetailPayload;
  detailLoading: boolean;
  copyPct: number;
  setCopyPct: (v: number) => void;
  maxUsd: number;
  setMaxUsd: (v: number) => void;
  startLive: boolean;
  setStartLive: (v: boolean) => void;
  agentFunded: boolean;
  busy: boolean;
  existingSub?: CopierSubscription;
  onCancel: () => void;
  onConfirm: () => void;
  onGoFund: () => void;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Live Open Positions & Recent Activity */}
      <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5 lg:pr-6 lg:border-r lg:border-[var(--line)]">
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-[var(--tx)]">Top Open Positions</h3>
            <a
              href={trader.polymarketUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-[var(--mut)] hover:text-[#2E5CFF] inline-flex items-center gap-0.5"
            >
              <span>Polymarket</span>
              <ArrowUpRight className="size-3" />
            </a>
          </div>

          {detailLoading ? (
            <div className="space-y-2">
              <div className="h-9 rounded-lg bg-[var(--line)]/50 animate-pulse" />
              <div className="h-9 rounded-lg bg-[var(--line)]/50 animate-pulse" />
            </div>
          ) : !detail || detail.positions.length === 0 ? (
            <p className="text-xs text-[var(--mut)] py-2">
              No active open positions returned for this wallet.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--line)]">
              {detail.positions.slice(0, 3).map((pos, idx) => (
                <li key={`${pos.slug}-${idx}`} className="py-2 first:pt-0 last:pb-0 space-y-0.5">
                  <p className="text-xs font-medium text-[var(--tx)] truncate" title={pos.title}>
                    {pos.title}
                  </p>
                  <div className="flex items-center justify-between text-[11px] font-mono tabular-nums text-[var(--mut)]">
                    <span>
                      <strong
                        className={
                          pos.outcome.toLowerCase() === 'yes'
                            ? 'text-[#10B981]'
                            : pos.outcome.toLowerCase() === 'no'
                              ? 'text-[#F43F5E]'
                              : 'text-[var(--tx)]'
                        }
                      >
                        {pos.outcome}
                      </strong>{' '}
                      @ {pos.currentPriceCents}¢
                    </span>
                    <span className="text-[var(--tx)] font-semibold">
                      {formatCompactUsd(pos.currentValueUsd)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-2.5">
          <h3 className="text-xs font-semibold text-[var(--tx)]">Recent Trades</h3>
          {detailLoading ? (
            <div className="space-y-2">
              <div className="h-9 rounded-lg bg-[var(--line)]/50 animate-pulse" />
              <div className="h-9 rounded-lg bg-[var(--line)]/50 animate-pulse" />
            </div>
          ) : !detail || detail.trades.length === 0 ? (
            <p className="text-xs text-[var(--mut)] py-2">
              No recent fills returned for this wallet.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--line)]">
              {detail.trades.slice(0, 3).map((trd, idx) => (
                <li key={`${trd.txHash}-${idx}`} className="py-2 first:pt-0 last:pb-0 space-y-0.5">
                  <p className="text-xs font-medium text-[var(--tx)] truncate" title={trd.title}>
                    {trd.title}
                  </p>
                  <div className="flex items-center justify-between text-[11px] font-mono tabular-nums text-[var(--mut)]">
                    <span>
                      <strong
                        className={trd.side === 'BUY' ? 'text-[#10B981]' : 'text-[#F43F5E]'}
                      >
                        {trd.side} {trd.outcome}
                      </strong>{' '}
                      @ {trd.priceCents}¢
                    </span>
                    <span>
                      {formatTradeUsd(trd.usdcValue)} · {formatRelativeTime(trd.timestamp)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Minimalist Copy Trade Configuration */}
      <div className="lg:col-span-5 space-y-4">
        <div>
          <h3 className="text-xs font-semibold text-[var(--tx)]">
            {existingSub ? `Update Mirror · ${trader.displayName}` : `Mirror ${trader.displayName}`}
          </h3>
          <p className="text-[11px] text-[var(--mut)] mt-0.5">
            Automatically scale new fills inside your agent wallet caps.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <span className="text-[11px] font-medium text-[var(--mut)]">Copy Ratio</span>
            <div className="grid grid-cols-4 gap-1">
              {[5, 10, 15, 25].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setCopyPct(pct)}
                  className={cn(
                    'h-8 rounded-lg border text-xs font-semibold cursor-pointer tabular-nums transition-colors',
                    copyPct === pct
                      ? 'border-[#2E5CFF] bg-[#2E5CFF] text-white'
                      : 'border-[var(--line)] bg-[var(--s1)] text-[var(--tx)] hover:bg-[var(--s2)]',
                  )}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="text-[11px] font-medium text-[var(--mut)]">Max Trade USD</span>
            <div className="grid grid-cols-3 gap-1">
              {[100, 250, 500].map((cap) => (
                <button
                  key={cap}
                  type="button"
                  onClick={() => setMaxUsd(cap)}
                  className={cn(
                    'h-8 rounded-lg border text-xs font-semibold cursor-pointer tabular-nums transition-colors',
                    maxUsd === cap
                      ? 'border-[#2E5CFF] bg-[#2E5CFF] text-white'
                      : 'border-[var(--line)] bg-[var(--s1)] text-[var(--tx)] hover:bg-[var(--s2)]',
                  )}
                >
                  ${cap}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          {agentFunded ? (
            <label className="inline-flex items-center gap-2 text-xs font-medium text-[var(--tx)] cursor-pointer">
              <input
                type="checkbox"
                checked={startLive}
                onChange={(e) => setStartLive(e.target.checked)}
                className="size-4 accent-[#2E5CFF] cursor-pointer"
              />
              <span>Execute Live trades</span>
            </label>
          ) : (
            <button
              type="button"
              onClick={onGoFund}
              className="text-xs font-semibold text-[#D97706] dark:text-[#FBBF24] hover:underline cursor-pointer"
            >
              Fund Agent to enable Live →
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <Button type="button" variant="ghost" size="sm" onClick={onCancel} className="cursor-pointer h-8">
              Close
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={busy}
              onClick={onConfirm}
              className="cursor-pointer h-8 bg-[#2E5CFF] text-white hover:bg-[#1E4DF0]"
            >
              {busy
                ? 'Saving...'
                : existingSub
                  ? 'Save Settings'
                  : startLive && agentFunded
                    ? 'Start Copying'
                    : 'Queue Preview'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LeaderboardSkeleton() {
  return (
    <div className="divide-y divide-[var(--line)]">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="px-5 py-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-4 w-5 rounded bg-[var(--line)]/60 animate-pulse" />
            <div className="size-9 rounded-full bg-[var(--line)]/60 animate-pulse shrink-0" />
            <div className="space-y-1.5">
              <div className="h-3.5 w-28 rounded bg-[var(--line)]/60 animate-pulse" />
              <div className="h-3 w-20 rounded bg-[var(--line)]/45 animate-pulse" />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden sm:block h-3.5 w-16 rounded bg-[var(--line)]/60 animate-pulse" />
            <div className="h-3.5 w-16 rounded bg-[var(--line)]/60 animate-pulse" />
            <div className="h-8 w-16 rounded-lg bg-[var(--line)]/60 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
