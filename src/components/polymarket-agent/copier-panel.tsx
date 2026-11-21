'use client';

/**
 * polymarket-agent/copier-panel.tsx — Minimalist Copy Trading Dashboard.
 * Strictly mirrors Polymarket's live Top 3 All-Time Leaders per Category & Overall.
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
  PauseCircle,
  PlayCircle,
  Plus,
  RefreshCw,
  Star,
  StopCircle,
  Trophy,
  Users,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  LEADERBOARD_CATEGORIES,
  TOP_LEADERS_LIMIT,
  canEngageLiveCopy,
  enforceTopLeaders,
  formatCompactUsd,
  pickAvatarTone,
  shortenEvmAddress,
  summarizeLeaderboardHero,
  type LeaderboardCategory,
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
const CATEGORY_CACHE_TTL_MS = 60_000;
const categoryLeaderCache = new Map<
  LeaderboardCategory,
  { traders: LiveLeaderboardTrader[]; expiresAt: number }
>();

interface LeaderboardApiResponse {
  traders: LiveLeaderboardTrader[];
  category?: string;
  error?: string;
}

interface CopierPanelProps {
  onNavigateTab?: (tab: AgentTab) => void;
}

function categoryDisplayName(cat: LeaderboardCategory): string {
  return cat === 'All' ? 'All-Time' : cat;
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

  // Navigation & Top-3 All-Time Category state
  const [navTab, setNavTab] = useState<CopyNavTab>('browse');
  const [category, setCategory] = useState<LeaderboardCategory>('All');
  const [watchlistOnly, setWatchlistOnly] = useState(false);

  const [traders, setTraders] = useState<LiveLeaderboardTrader[]>([]);
  const [boardLoading, setBoardLoading] = useState(true);
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

  const fetchTopThree = useCallback(
    async (targetCategory: LeaderboardCategory, force = false) => {
      if (!force) {
        const hit = categoryLeaderCache.get(targetCategory);
        if (hit && hit.expiresAt > Date.now()) {
          setTraders(hit.traders);
          setBoardLoading(false);
          setBoardError(null);
          return;
        }
      }

      setBoardLoading(true);
      setBoardError(null);

      try {
        const params = new URLSearchParams({
          time_period: 'all',
          sort_by: 'PNL',
          category: targetCategory,
          limit: String(TOP_LEADERS_LIMIT),
        });
        const res = await fetch(`/api/polymarket/leaderboard?${params.toString()}`, {
          cache: 'no-store',
        });
        const json = (await res.json()) as LeaderboardApiResponse;

        if (!res.ok) {
          throw new Error(json.error ?? `HTTP ${res.status}`);
        }

        const incoming = enforceTopLeaders(
          Array.isArray(json.traders) ? json.traders : [],
          TOP_LEADERS_LIMIT,
        );
        categoryLeaderCache.set(targetCategory, {
          traders: incoming,
          expiresAt: Date.now() + CATEGORY_CACHE_TTL_MS,
        });
        setTraders(incoming);
      } catch {
        setBoardError('Unable to sync live Polymarket leaders right now.');
        setTraders([]);
      } finally {
        setBoardLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void fetchTopThree(category, false);
  }, [category, fetchTopThree]);

  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);

  const handleOpenWhaleDetails = useCallback((whale: LiveLeaderboardTrader) => {
    setSelectedWhale(whale);
    setNavTab('browse');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

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
    if (!watchlistOnly) return traders;
    const favSet = new Set(favorites);
    return traders.filter((item) => favSet.has(item.address.toLowerCase()));
  }, [traders, watchlistOnly, favorites]);

  const heroStats = useMemo(() => summarizeLeaderboardHero(traders), [traders]);
  const currentCategoryLabel = categoryDisplayName(category);

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
    <div className="space-y-4">
      {/* Slim Workspace Bar: Section Switch + Live Capital & Top-3 PnL */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <nav
          aria-label="Copy trading sections"
          className="grid grid-cols-3 sm:inline-flex items-center gap-1 rounded-xl border border-[var(--line)] bg-[var(--s1)] p-1 w-full sm:w-auto"
        >
          <button
            type="button"
            onClick={() => {
              setNavTab('browse');
              setSelectedWhale(null);
            }}
            data-testid="copy-nav-browse"
            className={cn(
              'h-8 px-3 rounded-lg text-xs font-bold transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 whitespace-nowrap',
              navTab === 'browse'
                ? 'bg-[#7A12F5] text-white'
                : 'text-[var(--mut)] hover:text-[var(--tx)]',
            )}
          >
            <Trophy className="size-3.5 shrink-0" aria-hidden="true" />
            <span>Top 3</span>
          </button>

          <button
            type="button"
            onClick={() => setNavTab('copied')}
            data-testid="copy-nav-copied"
            className={cn(
              'h-8 px-3 rounded-lg text-xs font-bold transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 whitespace-nowrap',
              navTab === 'copied'
                ? 'bg-[#7A12F5] text-white'
                : 'text-[var(--mut)] hover:text-[var(--tx)]',
            )}
          >
            <Users className="size-3.5 shrink-0" aria-hidden="true" />
            <span>Copied</span>
            <span className="font-mono text-[11px] opacity-80 tabular-nums">
              ({activeCopiedCount})
            </span>
          </button>

          <button
            type="button"
            onClick={() => setNavTab('log')}
            data-testid="copy-nav-log"
            className={cn(
              'h-8 px-3 rounded-lg text-xs font-bold transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 whitespace-nowrap',
              navTab === 'log'
                ? 'bg-[#7A12F5] text-white'
                : 'text-[var(--mut)] hover:text-[var(--tx)]',
            )}
          >
            <Activity className="size-3.5 shrink-0" aria-hidden="true" />
            <span>Log</span>
          </button>
        </nav>

        <div className="flex items-center justify-between sm:justify-end gap-3">
          {!boardLoading && traders.length > 0 && (
            <p className="text-xs text-[var(--mut)] tabular-nums truncate">
              <span className="font-mono font-bold text-[#059669] dark:text-[#10B981]">
                {formatCompactUsd(heroStats.combinedPnlUsd, true)}
              </span>{' '}
              <span>{currentCategoryLabel} Top 3</span>
            </p>
          )}

          <button
            type="button"
            onClick={() => onNavigateTab?.('fund')}
            className={cn(
              'h-9 px-3 rounded-xl border text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-2 shrink-0 whitespace-nowrap',
              funding.ready
                ? 'border-[var(--line)] bg-[var(--s1)] text-[var(--tx)] hover:border-[#7A12F5]/45'
                : 'border-[#F59E0B]/40 bg-[#F59E0B]/[0.08] text-[#B45309] dark:text-[#FBBF24]',
            )}
          >
            <Landmark
              className={cn(
                'size-3.5',
                funding.ready ? 'text-[#10B981]' : 'text-[#D97706] dark:text-[#FBBF24]',
              )}
              aria-hidden="true"
            />
            <span className="font-mono tabular-nums">
              {funding.ready
                ? `$${usdcBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : 'Fund'}
            </span>
          </button>
        </div>
      </div>

      {!wallet && <ActivationCard onActivated={refresh} />}

      {/* TAB 1: TOP 3 ALL-TIME LEADERS PER CATEGORY */}
      {navTab === 'browse' && (
        <AnimatePresence mode="wait" initial={false}>
          {selectedWhale ? (
            <motion.div
              key={`detail-${selectedWhale.address}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
            >
              <WhaleDetailView
                trader={selectedWhale}
                timeframe="all"
                timeframeLabel={`${currentCategoryLabel} All-Time`}
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
              key="browse-top-3"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="space-y-4"
            >
              {/* Minimalist Category Selector Bar */}
              <div className="flex items-center justify-between gap-2 border-b border-[var(--line)] pb-3">
                <div
                  role="tablist"
                  aria-label="Polymarket leaderboard categories"
                  className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5"
                >
                  {LEADERBOARD_CATEGORIES.map((cat) => {
                    const active = category === cat && !watchlistOnly;
                    return (
                      <button
                        key={cat}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        data-testid={`category-tab-${cat.toLowerCase()}`}
                        onClick={() => {
                          setCategory(cat);
                          setWatchlistOnly(false);
                        }}
                        className={cn(
                          'h-8 px-3 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0',
                          active
                            ? 'bg-[var(--tx)] text-[var(--bg)]'
                            : 'text-[var(--mut)] hover:text-[var(--tx)] hover:bg-[var(--s2)]',
                        )}
                      >
                        {categoryDisplayName(cat)}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setWatchlistOnly((prev) => !prev)}
                    aria-pressed={watchlistOnly}
                    aria-label="Filter saved leaders"
                    className={cn(
                      'h-8 px-2.5 rounded-lg border text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap',
                      watchlistOnly
                        ? 'border-[#F59E0B]/50 bg-[#F59E0B]/12 text-[#B45309] dark:text-[#FBBF24]'
                        : 'border-[var(--line)] bg-[var(--s1)] text-[var(--mut)] hover:text-[var(--tx)]',
                    )}
                  >
                    <Star
                      className={cn('size-3.5', watchlistOnly && 'fill-current')}
                      aria-hidden="true"
                    />
                    <span className="hidden sm:inline">Saved</span>
                    {favorites.length > 0 && (
                      <span className="font-mono tabular-nums">{favorites.length}</span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => void fetchTopThree(category, true)}
                    disabled={boardLoading}
                    aria-label="Refresh top 3 leaders"
                    className="size-8 rounded-lg border border-[var(--line)] bg-[var(--s1)] text-[var(--mut)] hover:text-[var(--tx)] flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw
                      className={cn('size-3.5', boardLoading && 'animate-spin')}
                      aria-hidden="true"
                    />
                  </button>
                </div>
              </div>

              {/* Strictly 3 Podium Whale Leader Cards */}
              {boardLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <WhaleCardSkeleton />
                  <WhaleCardSkeleton />
                  <WhaleCardSkeleton />
                </div>
              ) : boardError ? (
                <section className="rounded-2xl border border-[var(--line)] bg-[var(--s1)] p-8 text-center space-y-3">
                  <p className="text-sm font-bold text-[var(--tx)]">{boardError}</p>
                  <button
                    type="button"
                    onClick={() => void fetchTopThree(category, true)}
                    className="h-9 px-4 rounded-xl bg-[#7A12F5] hover:bg-[#690CD9] text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <RefreshCw className="size-3.5" />
                    <span>Retry</span>
                  </button>
                </section>
              ) : visibleTraders.length === 0 ? (
                <section className="rounded-2xl border border-[var(--line)] bg-[var(--s1)] p-8 text-center space-y-3">
                  <p className="text-sm font-bold text-[var(--tx)]">
                    No saved leaders in {currentCategoryLabel}
                  </p>
                  <button
                    type="button"
                    onClick={() => setWatchlistOnly(false)}
                    className="h-9 px-4 rounded-xl border border-[var(--line)] bg-[var(--s2)] text-xs font-bold text-[var(--tx)] cursor-pointer"
                  >
                    Show Top 3
                  </button>
                </section>
              ) : (
                <div
                  data-testid="whale-cards-grid"
                  className="grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                  {visibleTraders.slice(0, TOP_LEADERS_LIMIT).map((trader) => (
                    <WhaleCard
                      key={`${category}-${trader.address}`}
                      trader={trader}
                      categoryLabel={currentCategoryLabel}
                      subscription={subscriptionByAddress.get(
                        trader.address.toLowerCase(),
                      )}
                      isFavorite={favorites.includes(trader.address.toLowerCase())}
                      onToggleFavorite={toggleFavorite}
                      onOpenDetails={handleOpenWhaleDetails}
                    />
                  ))}
                </div>
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
    <section className="rounded-2xl border border-[var(--line)] bg-[var(--s1)] p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-[var(--tx)]">{t('headline')}</p>
        <div className="flex gap-1.5">
          <Button
            type="button"
            variant={mode === 'create' ? 'default' : 'outline'}
            size="sm"
            className="cursor-pointer h-8 text-xs"
            onClick={() => setMode('create')}
          >
            <Wallet data-icon="inline-start" />
            {t('createWallet')}
          </Button>
          <Button
            type="button"
            variant={mode === 'import' ? 'default' : 'outline'}
            size="sm"
            className="cursor-pointer h-8 text-xs"
            onClick={() => setMode('import')}
          >
            <KeyRound data-icon="inline-start" />
            {t('importWallet')}
          </Button>
        </div>
      </div>

      {mode === 'import' && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="copier-private-key" className="text-xs">
              {t('privateKeyLabel')}
            </Label>
            <Input
              id="copier-private-key"
              type="password"
              autoComplete="off"
              value={privateKey}
              onChange={(e) => setPrivateKey(e.target.value)}
              placeholder={t('privateKeyPlaceholder')}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="copier-proxy-wallet" className="text-xs">
              {t('proxyWalletLabel')}
            </Label>
            <Input
              id="copier-proxy-wallet"
              value={proxyWallet}
              onChange={(e) => setProxyWallet(e.target.value)}
              placeholder={t('proxyWalletPlaceholder')}
            />
          </div>
        </div>
      )}

      {need2fa && <TwoFaChallenge onVerified={() => void submit()} />}
      {error && (
        <p role="alert" className="text-xs text-[#E11D48]">
          {error}
        </p>
      )}

      <Button
        type="button"
        onClick={submit}
        disabled={busy || !valid}
        className="cursor-pointer"
      >
        {busy ? t('activating') : t('activateCta')}
      </Button>
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
      toast.success('Wallet connected');
      onChanged();
    } else {
      setError(res.error?.message ?? t('addTraderFailed'));
    }
  };

  const setStatus = async (id: string, status: CopierSubscription['status']) => {
    if (status === 'live' && !agentFunded) {
      toast.error('Fund your Agent wallet before going live');
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
      className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--s1)]"
    >
      <div className="px-5 py-3.5 border-b border-[var(--line)] flex items-center justify-between gap-2">
        <h2 className="text-sm font-extrabold text-[var(--tx)]">Copied Leaders</h2>
        <div className="flex items-center gap-2 text-xs text-[var(--mut)] tabular-nums">
          <span>{activeSubs.length} active</span>
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
                · {liveCount}/{slots} slots
              </button>
            )
          ) : null}
        </div>
      </div>

      {/* Custom 0x Attach Bar */}
      <div className="px-5 py-3.5 border-b border-[var(--line)] bg-[var(--s2)]/30 space-y-2">
        <div className="grid gap-2 sm:grid-cols-[1fr_84px_auto] sm:items-center">
          <Input
            id="copier-trader-address"
            aria-label="Wallet address"
            value={traderAddress}
            onChange={(e) => setTraderAddress(e.target.value)}
            placeholder="Attach custom 0x wallet..."
            aria-invalid={!validAddress && traderAddress.length > 0}
            className="h-9 rounded-lg text-xs font-mono"
          />
          <Input
            id="copier-copy-size"
            aria-label="Copy percentage"
            type="number"
            min={1}
            max={100}
            value={copySize}
            onChange={(e) => setCopySize(e.target.value)}
            className="h-9 rounded-lg text-xs font-mono tabular-nums"
          />
          <Button
            type="button"
            size="sm"
            onClick={() => void add()}
            disabled={busy || !validAddress}
            className="h-9 rounded-lg bg-[#7A12F5] hover:bg-[#690CD9] text-white cursor-pointer text-xs"
          >
            <Plus className="size-3.5" />
            <span>Connect</span>
          </Button>
        </div>
        {error && (
          <p role="alert" className="text-xs text-[#E11D48]">
            {error}
          </p>
        )}
      </div>

      {activeSubs.length === 0 ? (
        <div className="p-8 text-center space-y-3">
          <p className="text-sm font-bold text-[var(--tx)]">No connected leaders</p>
          <button
            type="button"
            onClick={onBrowse}
            className="h-9 px-4 rounded-xl bg-[#7A12F5] hover:bg-[#690CD9] text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1.5"
          >
            <span>Browse Top 3</span>
            <ArrowRight className="size-3.5" />
          </button>
        </div>
      ) : (
        <ul className="divide-y divide-[var(--line)]">
          {activeSubs.map((sub) => {
            const matched = traders.find(
              (item) => item.address.toLowerCase() === sub.traderAddress.toLowerCase(),
            );
            const displayName =
              matched?.displayName ?? sub.traderName ?? shortenEvmAddress(sub.traderAddress);
            return (
              <li
                key={sub.id}
                className="flex flex-col gap-3 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between hover:bg-[var(--s2)]/30 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <WhaleAvatar
                    name={displayName}
                    imageUrl={matched?.profileImage ?? null}
                    toneClass={matched?.avatarTone ?? pickAvatarTone(sub.traderAddress)}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          onInspectWhale(
                            matched ?? {
                              rank: 1,
                              address: sub.traderAddress,
                              displayName,
                              rawUserName: displayName,
                              isAnonAddress: !sub.traderName,
                              profileImage: null,
                              xUsername: null,
                              verified: false,
                              pnlUsd: 0,
                              volumeUsd: 0,
                              roiPct: 0,
                              avatarTone: pickAvatarTone(sub.traderAddress),
                              polymarketUrl: `https://polymarket.com/profile/${sub.traderAddress}`,
                            },
                          )
                        }
                        className="truncate text-sm font-bold text-[var(--tx)] hover:text-[#7A12F5] dark:hover:text-[#C084FC] cursor-pointer text-left"
                      >
                        {displayName}
                      </button>
                      <StatusText status={sub.status} />
                    </div>
                    <p className="text-xs font-mono text-[var(--mut)] tabular-nums">
                      {sub.strategyConfig.strategy === 'FIXED'
                        ? `$${sub.strategyConfig.copySize} fixed`
                        : `${sub.strategyConfig.copySize}%`}
                      {' · '}Cap ${sub.strategyConfig.maxOrderSizeUsd}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {(sub.status === 'preview' || sub.status === 'paused') && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="cursor-pointer h-8 rounded-lg text-xs"
                      onClick={() => void setStatus(sub.id, 'live')}
                    >
                      <PlayCircle className="size-3.5 text-[#10B981]" />
                      {sub.status === 'preview' ? t('goLive') : t('resume')}
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
      ? 'text-[#059669] dark:text-[#34D399]'
      : status === 'preview'
        ? 'text-[#7A12F5] dark:text-[#C084FC]'
        : status === 'paused'
          ? 'text-[#B45309] dark:text-[#FBBF24]'
          : 'text-[var(--mut)]';
  return (
    <span className={cn('text-[11px] font-bold', tone)}>
      · {t(`status.${status}`)}
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
      className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--s1)]"
    >
      <div className="px-5 py-3.5 border-b border-[var(--line)] flex items-center justify-between">
        <h2 className="text-sm font-extrabold text-[var(--tx)]">Execution Log</h2>
        <span className="font-mono text-xs text-[var(--mut)] tabular-nums">
          {executions.length}
        </span>
      </div>

      {executions.length === 0 ? (
        <div className="p-8 text-center space-y-3">
          <p className="text-sm font-bold text-[var(--tx)]">No executions yet</p>
          <button
            type="button"
            onClick={onBrowse}
            className="h-9 px-4 rounded-xl bg-[#7A12F5] hover:bg-[#690CD9] text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1.5"
          >
            <span>Browse Top 3</span>
            <ArrowRight className="size-3.5" />
          </button>
        </div>
      ) : (
        <ul className="divide-y divide-[var(--line)]">
          {executions.map((e) => (
            <li
              key={e.id}
              className="flex flex-col gap-1 px-5 py-3.5 text-xs sm:flex-row sm:items-center sm:justify-between hover:bg-[var(--s2)]/30 transition-colors"
            >
              <div className="min-w-0">
                <p className="text-sm font-bold text-[var(--tx)] truncate">
                  {e.market.slug ?? e.market.asset ?? e.id}
                </p>
                <p className="text-xs text-[var(--mut)] tabular-nums">
                  {e.sizing?.reasoning ??
                    `${e.market.side ?? 'TRADE'} · $${Number(e.traderUsdcSize).toFixed(2)}`}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0 font-mono tabular-nums">
                {e.sizing?.finalAmount !== undefined && e.sizing.finalAmount > 0 && (
                  <span className="text-xs font-bold text-[var(--tx)]">
                    ${e.sizing.finalAmount.toFixed(0)}
                  </span>
                )}
                <span className="text-[11px] font-bold uppercase text-[#059669] dark:text-[#34D399]">
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
