'use client';

/**
 * polymarket-agent/copier-panel.tsx — the Copy tab content.
 *
 * Clean, single-elevation Polymarket Leaderboard mirror modeled after
 * polymarket.com/leaderboard with timeframe/category/sort/search controls,
 * 1-click inline mirror configuration, custom 0x subscriptions, and executions.
 */
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  Check,
  Copy,
  Crown,
  KeyRound,
  Landmark,
  PauseCircle,
  PlayCircle,
  Plus,
  Search,
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
  POLYMARKET_LEADERBOARD_TRADERS,
  canEngageLiveCopy,
  filterAndSortLeaderboard,
  formatCompactUsd,
  shortenEvmAddress,
  type LeaderboardCategory,
  type LeaderboardSort,
  type LeaderboardTimeframe,
  type PolymarketLeaderboardTrader,
} from '@/lib/polymarket/leaderboard';
import type { AgentTab } from './tab-param';
import { TwoFaChallenge } from './two-fa-challenge';
import { UpgradeDialog } from './upgrade-dialog';
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

const TIMEFRAME_OPTIONS: { key: LeaderboardTimeframe; label: string }[] = [
  { key: 'day', label: 'Today' },
  { key: 'week', label: 'Weekly' },
  { key: 'month', label: 'Monthly' },
  { key: 'all', label: 'All Time' },
];

const CATEGORY_OPTIONS: LeaderboardCategory[] = ['All', 'Politics', 'Crypto', 'Economics', 'Sports'];

const SORT_OPTIONS: { key: LeaderboardSort; label: string }[] = [
  { key: 'pnl', label: 'Profit / PnL' },
  { key: 'volume', label: 'Volume' },
  { key: 'winRate', label: 'Win Rate' },
];

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
  const [subscriptions, setSubscriptions] = useState<CopierSubscription[]>(initial.subscriptions);
  const [executions, setExecutions] = useState<CopierExecution[]>(initial.executions);
  const [entitlement, setEntitlement] = useState<CopierEntitlement | null>(initial.entitlement);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

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
      const [subsRes, execRes] = await Promise.all([fetchSubscriptions(), fetchExecutions()]);
      if (cancelled) return;
      if (subsRes.ok) setSubscriptions(subsRes.data ?? []);
      if (execRes.ok) setExecutions(execRes.data ?? []);
      setState('active');
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadKey, storeVersion]);

  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);

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
  const liveCount = subscriptions.filter((s) => s.status === 'live').length;

  return (
    <div className="space-y-6">
      {/* Slim Readiness Status Bar */}
      <div
        className={cn(
          'rounded-2xl border px-4 py-3.5 sm:px-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
          funding.ready
            ? 'border-[var(--line)] bg-[var(--s1)]'
            : 'border-[#F59E0B]/40 bg-[#F59E0B]/[0.07]',
        )}
      >
        <div className="flex items-center gap-3 min-w-0">
          <Landmark
            className={cn(
              'size-5 shrink-0',
              funding.ready ? 'text-[#10B981]' : 'text-[#D97706] dark:text-[#FBBF24]',
            )}
          />
          <div className="min-w-0">
            <div className="text-sm font-extrabold text-[var(--tx)]">
              {funding.ready
                ? `Agent Funded: $${usdcBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC.e`
                : 'Fund Your Agent Before Engaging Live Copy Trades'}
            </div>
            <p className="text-xs text-[var(--mut)] mt-0.5 tabular-nums">
              {funding.ready
                ? `${polBalance.toFixed(2)} POL gas available · ${liveCount} live trader ${liveCount === 1 ? 'mirror' : 'mirrors'} active`
                : 'Queue traders in preview mode now, or deposit USDC.e & POL on the Fund tab to go live.'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onNavigateTab?.('fund')}
          className={cn(
            'h-9 px-3.5 rounded-xl text-xs font-extrabold cursor-pointer shrink-0 inline-flex items-center gap-1.5 transition-colors whitespace-nowrap self-start sm:self-auto',
            funding.ready
              ? 'border border-[var(--line)] bg-[var(--s2)] text-[var(--tx)] hover:bg-[var(--line)]/50'
              : 'bg-[#2E5CFF] text-white hover:bg-[#1E4DF0]',
          )}
        >
          <span>{funding.ready ? 'Manage Funds' : 'Fund Agent'}</span>
          <ArrowRight className="size-3.5" />
        </button>
      </div>

      {!wallet && <ActivationCard onActivated={refresh} />}

      {/* Polymarket Leaderboard Mirror */}
      <PolymarketLeaderboardSection
        subscriptions={subscriptions}
        agentFunded={funding.ready}
        onCopied={refresh}
        onGoFund={() => onNavigateTab?.('fund')}
      />

      {wallet && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7">
            <SubscriptionsCard
              subscriptions={subscriptions}
              agentFunded={funding.ready}
              onChanged={refresh}
              onGoFund={() => onNavigateTab?.('fund')}
              entitlement={entitlement}
              onUpgrade={() => setUpgradeOpen(true)}
            />
          </div>
          <div className="lg:col-span-5">
            <ExecutionsCard executions={executions} />
          </div>
        </div>
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

function PolymarketLeaderboardSection({
  subscriptions,
  agentFunded,
  onCopied,
  onGoFund,
}: {
  subscriptions: CopierSubscription[];
  agentFunded: boolean;
  onCopied: () => void;
  onGoFund: () => void;
}) {
  const [timeframe, setTimeframe] = useState<LeaderboardTimeframe>('month');
  const [category, setCategory] = useState<LeaderboardCategory>('All');
  const [sortBy, setSortBy] = useState<LeaderboardSort>('pnl');
  const [search, setSearch] = useState('');
  const [configuringId, setConfiguringId] = useState<string | null>(null);
  const [copyPct, setCopyPct] = useState<number>(10);
  const [maxUsd, setMaxUsd] = useState<number>(250);
  const [userLiveChoice, setUserLiveChoice] = useState<boolean | null>(null);
  const startLive = agentFunded ? (userLiveChoice ?? true) : false;
  const setStartLive = (v: boolean) => setUserLiveChoice(v);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [copiedAddr, setCopiedAddr] = useState<string | null>(null);

  const rankedTraders = useMemo(
    () =>
      filterAndSortLeaderboard(POLYMARKET_LEADERBOARD_TRADERS, {
        timeframe,
        category,
        sortBy,
        search,
      }),
    [timeframe, category, sortBy, search],
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
      toast.success('Trader address copied');
      setTimeout(() => setCopiedAddr(null), 1600);
    } catch {
      toast.info(shortenEvmAddress(address));
    }
  };

  const handleConfirmCopy = async (trader: PolymarketLeaderboardTrader) => {
    setBusyId(trader.id);
    const mode = startLive && agentFunded ? 'live' : 'preview';
    const res = await createSubscription({
      traderAddress: trader.address,
      traderHandle: trader.handle,
      specialty: trader.specialty,
      initialStatus: mode,
      strategyConfig: {
        strategy: 'PERCENTAGE',
        copySize: copyPct,
        maxOrderSizeUsd: maxUsd,
        minOrderSizeUsd: 10,
      },
    });
    setBusyId(null);
    if (res.ok) {
      setConfiguringId(null);
      toast.success(
        mode === 'live'
          ? `Now copying ${trader.handle} (${copyPct}% · max $${maxUsd} Live)`
          : `Added ${trader.handle} in Preview mode. Fund your agent to go live.`,
      );
      onCopied();
    } else {
      toast.error('Could not add trader');
    }
  };

  return (
    <section
      aria-label="Polymarket Leaderboard"
      className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--s1)]"
    >
      {/* Integrated Leaderboard Toolbar */}
      <div className="p-4 sm:p-5 border-b border-[var(--line)] space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Trophy className="size-5 text-[#F59E0B] shrink-0" />
            <div>
              <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-[var(--tx)]">
                Polymarket Leaderboard
              </h2>
              <p className="text-xs text-[var(--mut)]">
                Mirror top-ranked Polymarket wallets by realized PnL, trading volume, and win rate.
              </p>
            </div>
          </div>

          <div
            role="tablist"
            aria-label="Leaderboard timeframe"
            className="inline-grid grid-cols-4 gap-1 rounded-xl border border-[var(--line)] bg-[var(--s2)] p-1 self-start md:self-auto"
          >
            {TIMEFRAME_OPTIONS.map((tf) => (
              <button
                key={tf.key}
                type="button"
                role="tab"
                aria-selected={timeframe === tf.key}
                onClick={() => setTimeframe(tf.key)}
                className={cn(
                  'h-7 px-2.5 sm:px-3 rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer whitespace-nowrap',
                  timeframe === tf.key
                    ? 'bg-[var(--s1)] text-[var(--tx)] shadow-xs'
                    : 'text-[var(--mut)] hover:text-[var(--tx)]',
                )}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-1 rounded-xl bg-[var(--s2)] p-1 border border-[var(--line)] self-start">
            {CATEGORY_OPTIONS.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={cn(
                  'h-7 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap',
                  category === cat
                    ? 'bg-[var(--s1)] text-[#2E5CFF] shadow-xs'
                    : 'text-[var(--mut)] hover:text-[var(--tx)]',
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1 sm:w-60">
              <Search className="size-3.5 text-[var(--mut)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search @trader or 0x..."
                aria-label="Search Polymarket leaderboard traders"
                className="h-9 w-full rounded-xl border border-[var(--line)] bg-[var(--s2)] pl-8 pr-3 text-xs font-medium text-[var(--tx)] placeholder:text-[var(--mut)] outline-none focus:border-[#2E5CFF]"
              />
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as LeaderboardSort)}
              aria-label="Sort leaderboard by"
              className="h-9 rounded-xl border border-[var(--line)] bg-[var(--s2)] px-3 text-xs font-bold text-[var(--tx)] outline-none focus:border-[#2E5CFF] cursor-pointer"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  Sort: {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Leaderboard Body */}
      {rankedTraders.length === 0 ? (
        <div className="p-10 text-center space-y-2">
          <p className="text-sm font-bold text-[var(--tx)]">No traders matched your filter</p>
          <p className="text-xs text-[var(--mut)]">
            Try clearing your search query or switching back to All categories.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="cursor-pointer mt-1"
            onClick={() => {
              setSearch('');
              setCategory('All');
            }}
          >
            Reset Filters
          </Button>
        </div>
      ) : (
        <>
          {/* Flush Desktop Data Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--line)] bg-[var(--s2)]/50 text-[11px] font-bold uppercase tracking-wider text-[var(--mut)]">
                  <th className="py-3 pl-5 pr-2 w-14">Rank</th>
                  <th className="py-3 px-3">Trader</th>
                  <th className="py-3 px-3">Recent Position</th>
                  <th className="py-3 px-3 text-right">Profit / PnL</th>
                  <th className="py-3 px-3 text-right">Volume</th>
                  <th className="py-3 px-3 text-right">Win Rate</th>
                  <th className="py-3 pl-3 pr-5 text-right w-32">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)] text-sm">
                {rankedTraders.map(({ rank, trader, periodStats }) => {
                  const existingSub = subByAddress.get(trader.address.toLowerCase());
                  const isEditing = configuringId === trader.id;
                  return (
                    <Fragment key={trader.id}>
                      <tr className="hover:bg-[var(--s2)]/50 transition-colors">
                        <td className="py-3.5 pl-5 pr-2 font-mono text-xs font-extrabold tabular-nums">
                          <RankMedal rank={rank} />
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <span
                              className={cn(
                                'size-9 rounded-full bg-gradient-to-br flex items-center justify-center text-xs font-extrabold text-white shrink-0',
                                trader.avatarGradient,
                              )}
                            >
                              {trader.displayName.slice(0, 2).toUpperCase()}
                            </span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-extrabold text-sm text-[var(--tx)] truncate">
                                  {trader.handle}
                                </span>
                                {trader.verified && (
                                  <BadgeCheck className="size-3.5 text-[#2E5CFF] shrink-0" />
                                )}
                                <span className="text-[11px] font-medium text-[var(--mut)] whitespace-nowrap">
                                  · {trader.specialty}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => void handleCopyAddress(trader.address)}
                                className="inline-flex items-center gap-1 font-mono text-[11px] text-[var(--mut)] hover:text-[var(--tx)] cursor-pointer"
                              >
                                <span>{shortenEvmAddress(trader.address)}</span>
                                {copiedAddr === trader.address ? (
                                  <Check className="size-3 text-[#10B981]" />
                                ) : (
                                  <Copy className="size-3" />
                                )}
                              </button>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-3 max-w-[240px]">
                          <div className="text-xs font-semibold text-[var(--tx)] truncate">
                            {trader.recentMarket}
                          </div>
                          <div className="text-[11px] text-[var(--mut)] font-mono tabular-nums mt-0.5">
                            <span
                              className={cn(
                                'font-extrabold',
                                trader.recentSide === 'YES' ? 'text-[#10B981]' : 'text-[#F43F5E]',
                              )}
                            >
                              {trader.recentSide}
                            </span>{' '}
                            · {formatCompactUsd(trader.recentSizeUsd)}
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono font-extrabold text-[#10B981] tabular-nums whitespace-nowrap">
                          {formatCompactUsd(periodStats.pnlUsd, true)}
                          <div className="text-[10.5px] font-semibold text-[var(--mut)]">
                            +{periodStats.roiPct.toFixed(1)}% ROI
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono font-bold text-[var(--tx)] tabular-nums whitespace-nowrap">
                          {formatCompactUsd(periodStats.volumeUsd)}
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono font-bold text-[var(--tx)] tabular-nums whitespace-nowrap">
                          {periodStats.winRate.toFixed(1)}%
                          <div className="text-[10.5px] font-medium text-[var(--mut)]">
                            {periodStats.trades} trades
                          </div>
                        </td>
                        <td className="py-3.5 pl-3 pr-5 text-right">
                          {existingSub ? (
                            <button
                              type="button"
                              onClick={() => setConfiguringId(isEditing ? null : trader.id)}
                              className="h-8 px-3 rounded-lg bg-[#10B981]/12 text-[#10B981] text-xs font-extrabold hover:bg-[#10B981]/20 transition-colors cursor-pointer whitespace-nowrap inline-flex items-center gap-1"
                            >
                              <Check className="size-3.5" />
                              <span>{existingSub.status === 'live' ? 'Copying' : 'Preview'}</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfiguringId(isEditing ? null : trader.id)}
                              className="h-8 px-3.5 rounded-lg bg-[#2E5CFF] text-white text-xs font-extrabold hover:bg-[#1E4DF0] active:scale-[0.97] transition-all cursor-pointer whitespace-nowrap inline-flex items-center gap-1.5"
                            >
                              <Copy className="size-3.5" />
                              <span>Copy</span>
                            </button>
                          )}
                        </td>
                      </tr>

                      {isEditing && (
                        <tr className="bg-[var(--s2)]/65">
                          <td colSpan={7} className="px-5 py-4">
                            <InlineCopyConfigurator
                              trader={trader}
                              copyPct={copyPct}
                              setCopyPct={setCopyPct}
                              maxUsd={maxUsd}
                              setMaxUsd={setMaxUsd}
                              startLive={startLive}
                              setStartLive={setStartLive}
                              agentFunded={agentFunded}
                              busy={busyId === trader.id}
                              onCancel={() => setConfiguringId(null)}
                              onConfirm={() => void handleConfirmCopy(trader)}
                              onGoFund={onGoFund}
                            />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Leaderboard Rows (Flush Hairline List) */}
          <div className="divide-y divide-[var(--line)] md:hidden">
            {rankedTraders.map(({ rank, trader, periodStats }) => {
              const existingSub = subByAddress.get(trader.address.toLowerCase());
              const isEditing = configuringId === trader.id;
              return (
                <div key={trader.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <RankMedal rank={rank} />
                      <span
                        className={cn(
                          'size-9 rounded-full bg-gradient-to-br flex items-center justify-center text-xs font-extrabold text-white shrink-0',
                          trader.avatarGradient,
                        )}
                      >
                        {trader.displayName.slice(0, 2).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="font-extrabold text-sm text-[var(--tx)] truncate">
                            {trader.handle}
                          </span>
                          {trader.verified && (
                            <BadgeCheck className="size-3.5 text-[#2E5CFF] shrink-0" />
                          )}
                        </div>
                        <div className="text-[11px] font-mono text-[var(--mut)] truncate">
                          {shortenEvmAddress(trader.address)} · {trader.specialty}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setConfiguringId(isEditing ? null : trader.id)}
                      className={cn(
                        'h-8 px-3 rounded-lg text-xs font-extrabold cursor-pointer shrink-0 whitespace-nowrap inline-flex items-center gap-1',
                        existingSub
                          ? 'bg-[#10B981]/12 text-[#10B981]'
                          : 'bg-[#2E5CFF] text-white',
                      )}
                    >
                      {existingSub ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                      <span>{existingSub ? (existingSub.status === 'live' ? 'Copying' : 'Preview') : 'Copy'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 text-xs">
                    <div>
                      <div className="text-[10px] font-semibold text-[var(--mut)]">Profit</div>
                      <div className="font-mono font-extrabold text-[#10B981] tabular-nums">
                        {formatCompactUsd(periodStats.pnlUsd, true)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold text-[var(--mut)]">Volume</div>
                      <div className="font-mono font-bold text-[var(--tx)] tabular-nums">
                        {formatCompactUsd(periodStats.volumeUsd)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-semibold text-[var(--mut)]">Win Rate</div>
                      <div className="font-mono font-bold text-[var(--tx)] tabular-nums">
                        {periodStats.winRate.toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  {isEditing && (
                    <div className="pt-3 border-t border-[var(--line)]">
                      <InlineCopyConfigurator
                        trader={trader}
                        copyPct={copyPct}
                        setCopyPct={setCopyPct}
                        maxUsd={maxUsd}
                        setMaxUsd={setMaxUsd}
                        startLive={startLive}
                        setStartLive={setStartLive}
                        agentFunded={agentFunded}
                        busy={busyId === trader.id}
                        onCancel={() => setConfiguringId(null)}
                        onConfirm={() => void handleConfirmCopy(trader)}
                        onGoFund={onGoFund}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}

function RankMedal({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span className="inline-flex size-6 items-center justify-center rounded-md bg-[#F59E0B]/18 text-[#D97706] dark:text-[#FBBF24] font-mono text-xs font-extrabold">
        1
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span className="inline-flex size-6 items-center justify-center rounded-md bg-slate-400/18 text-slate-600 dark:text-slate-300 font-mono text-xs font-extrabold">
        2
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span className="inline-flex size-6 items-center justify-center rounded-md bg-[#B45309]/18 text-[#B45309] dark:text-[#F59E0B] font-mono text-xs font-extrabold">
        3
      </span>
    );
  }
  return <span className="inline-flex size-6 items-center justify-center text-[var(--mut)] font-mono text-xs font-bold">#{rank}</span>;
}

function InlineCopyConfigurator({
  trader,
  copyPct,
  setCopyPct,
  maxUsd,
  setMaxUsd,
  startLive,
  setStartLive,
  agentFunded,
  busy,
  onCancel,
  onConfirm,
  onGoFund,
}: {
  trader: PolymarketLeaderboardTrader;
  copyPct: number;
  setCopyPct: (v: number) => void;
  maxUsd: number;
  setMaxUsd: (v: number) => void;
  startLive: boolean;
  setStartLive: (v: boolean) => void;
  agentFunded: boolean;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  onGoFund: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="space-y-0.5">
        <div className="text-xs font-extrabold text-[var(--tx)]">
          Configure Mirror for {trader.handle}
        </div>
        <p className="text-[11px] text-[var(--mut)]">
          Set proportional sizing and max order cap before mirroring positions.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-[var(--mut)]">Size %:</span>
          {[5, 10, 15, 25].map((pct) => (
            <button
              key={pct}
              type="button"
              onClick={() => setCopyPct(pct)}
              className={cn(
                'h-7 px-2.5 rounded-lg border text-xs font-extrabold cursor-pointer tabular-nums transition-colors',
                copyPct === pct
                  ? 'border-[#2E5CFF] bg-[#2E5CFF] text-white'
                  : 'border-[var(--line)] bg-[var(--s1)] text-[var(--tx)]',
              )}
            >
              {pct}%
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-[var(--mut)]">Max Cap:</span>
          {[100, 250, 500].map((cap) => (
            <button
              key={cap}
              type="button"
              onClick={() => setMaxUsd(cap)}
              className={cn(
                'h-7 px-2.5 rounded-lg border text-xs font-extrabold cursor-pointer tabular-nums transition-colors',
                maxUsd === cap
                  ? 'border-[#2E5CFF] bg-[#2E5CFF] text-white'
                  : 'border-[var(--line)] bg-[var(--s1)] text-[var(--tx)]',
              )}
            >
              ${cap}
            </button>
          ))}
        </div>

        {agentFunded ? (
          <label className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--tx)] cursor-pointer">
            <input
              type="checkbox"
              checked={startLive}
              onChange={(e) => setStartLive(e.target.checked)}
              className="size-4 accent-[#2E5CFF] cursor-pointer"
            />
            <span>Go Live immediately</span>
          </label>
        ) : (
          <button
            type="button"
            onClick={onGoFund}
            className="text-xs font-bold text-[#D97706] dark:text-[#FBBF24] hover:underline cursor-pointer"
          >
            Fund Agent to enable Live →
          </button>
        )}

        <div className="flex items-center gap-2 ml-auto">
          <Button type="button" variant="outline" size="sm" onClick={onCancel} className="cursor-pointer">
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={busy}
            onClick={onConfirm}
            className="cursor-pointer bg-[#2E5CFF] text-white hover:bg-[#1E4DF0]"
          >
            {busy ? 'Saving...' : startLive && agentFunded ? 'Confirm Live Copy' : 'Add in Preview'}
          </Button>
        </div>
      </div>
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
          ? { origin: 'import_safe_owner' as const, privateKey: privateKey.trim(), proxyWallet: proxyWallet.trim() }
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
      (!privateKey.trim().startsWith('0x') || /^0x[0-9a-fA-F]{40}$/.test(proxyWallet.trim())));

  return (
    <section className="rounded-2xl border border-[var(--line)] bg-[var(--s1)] p-5 md:p-6 space-y-4">
      <div className="flex items-start gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#2E5CFF]/12 text-[#2E5CFF]">
          <Users className="size-5" />
        </span>
        <div className="space-y-1">
          <p className="font-display text-lg font-bold text-[var(--tx)]">{t('headline')}</p>
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
        <Button type="button" onClick={submit} disabled={busy || !valid} className="cursor-pointer">
          {busy ? t('activating') : t('activateCta')}
        </Button>
        <p className="text-xs text-[var(--mut)]">{t('activateHint')}</p>
      </div>
    </section>
  );
}

function SubscriptionsCard({
  subscriptions,
  agentFunded,
  onChanged,
  onGoFund,
  entitlement,
  onUpgrade,
}: {
  subscriptions: CopierSubscription[];
  agentFunded: boolean;
  onChanged: () => void;
  onGoFund: () => void;
  entitlement: CopierEntitlement | null;
  onUpgrade: () => void;
}) {
  const t = useTranslations('dashboard.polymarketAgent.copier');
  const tb = useTranslations('dashboard.polymarketAgent.copier.billing');
  const isPro = entitlement?.tier === 'pro';
  const slots = entitlement?.slots;
  const liveCount = subscriptions.filter((s) => s.status === 'live').length;
  const [traderAddress, setTraderAddress] = useState('');
  const [copySize, setCopySize] = useState('10');
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
        copySize: Number(copySize) || 10,
        maxOrderSizeUsd: 100,
        minOrderSizeUsd: 1,
      },
    });
    setBusy(false);
    if (res.ok) {
      setTraderAddress('');
      toast.success('Custom Polymarket wallet added');
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
    <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--s1)]">
      <div className="p-5 border-b border-[var(--line)] flex items-center justify-between gap-2">
        <h2 className="text-sm font-extrabold tracking-tight text-[var(--tx)]">
          {t('tradersTitle')}
        </h2>
        <div className="flex items-center gap-2 text-xs text-[var(--mut)] tabular-nums">
          <span>{t('traderCount', { count: subscriptions.length })}</span>
          {entitlement?.billingEnabled && slots !== undefined ? (
            isPro ? (
              <span className="inline-flex items-center gap-1 font-bold text-[#D97706] dark:text-[#FBBF24]">
                <Crown className="size-3.5" aria-hidden="true" />
                PRO
              </span>
            ) : (
              <button
                type="button"
                className="cursor-pointer font-bold text-[#2E5CFF] hover:underline"
                onClick={onUpgrade}
                aria-label={tb('upgradeCta')}
              >
                FREE · {liveCount}/{slots}
              </button>
            )
          ) : null}
        </div>
      </div>

      <div className="p-5 border-b border-[var(--line)] bg-[var(--s2)]/40 space-y-3">
        <div className="grid gap-2.5 sm:grid-cols-[1fr_auto_auto] sm:items-end">
          <div className="space-y-1">
            <Label htmlFor="copier-trader-address" className="text-xs font-semibold">
              Custom Polymarket wallet address
            </Label>
            <Input
              id="copier-trader-address"
              value={traderAddress}
              onChange={(e) => setTraderAddress(e.target.value)}
              placeholder="0x..."
              aria-invalid={!validAddress && traderAddress.length > 0}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="copier-copy-size" className="text-xs font-semibold">
              {t('copySizeLabel')}
            </Label>
            <Input
              id="copier-copy-size"
              type="number"
              min={1}
              max={100}
              value={copySize}
              onChange={(e) => setCopySize(e.target.value)}
              className="w-24 tabular-nums"
            />
          </div>
          <Button type="button" onClick={add} disabled={busy || !validAddress} className="cursor-pointer">
            <Plus data-icon="inline-start" />
            {t('addTrader')}
          </Button>
        </div>
        {error && (
          <p role="alert" className="text-sm text-ios-red">
            {error}
          </p>
        )}
      </div>

      {subscriptions.length === 0 ? (
        <p className="p-6 text-center text-xs text-[var(--mut)]">{t('noTraders')}</p>
      ) : (
        <ul className="divide-y divide-[var(--line)]">
          {subscriptions.map((sub) => (
            <li
              key={sub.id}
              className="flex flex-col gap-2.5 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between hover:bg-[var(--s2)]/40 transition-colors"
            >
              <div className="min-w-0 space-y-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-extrabold text-[var(--tx)]">
                    {sub.traderHandle ?? shortenEvmAddress(sub.traderAddress)}
                  </span>
                  {sub.specialty && (
                    <span className="text-[11px] text-[var(--mut)]">· {sub.specialty}</span>
                  )}
                  <StatusText status={sub.status} />
                </div>
                <p className="truncate font-mono text-xs text-[var(--mut)] tabular-nums">
                  {shortenEvmAddress(sub.traderAddress)} · {sub.strategyConfig.copySize}% size · max ${sub.strategyConfig.maxOrderSizeUsd}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {sub.status !== 'live' && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="cursor-pointer h-8 text-xs"
                    onClick={() => void setStatus(sub.id, 'live')}
                  >
                    <PlayCircle data-icon="inline-start" />
                    {t('goLive')}
                  </Button>
                )}
                {sub.status === 'live' && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="cursor-pointer h-8 text-xs"
                    onClick={() => void setStatus(sub.id, 'paused')}
                  >
                    <PauseCircle data-icon="inline-start" />
                    {t('pause')}
                  </Button>
                )}
                {sub.status !== 'stopped' && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="cursor-pointer h-8 text-xs text-[#F43F5E] hover:text-[#F43F5E]"
                    onClick={() => void setStatus(sub.id, 'stopped')}
                  >
                    <StopCircle data-icon="inline-start" />
                    {t('stop')}
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function StatusText({ status }: { status: CopierSubscription['status'] }) {
  const t = useTranslations('dashboard.polymarketAgent.copier');
  const tone =
    status === 'live'
      ? 'text-[#10B981]'
      : status === 'preview'
        ? 'text-[#2E5CFF]'
        : status === 'paused'
          ? 'text-[#D97706] dark:text-[#FBBF24]'
          : 'text-[var(--mut)]';
  return (
    <span className={cn('text-[11px] font-extrabold uppercase tracking-wide', tone)}>
      · {t(`status.${status}`)}
    </span>
  );
}

function ExecutionsCard({ executions }: { executions: CopierExecution[] }) {
  const t = useTranslations('dashboard.polymarketAgent.copier');
  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--s1)]">
      <div className="p-5 border-b border-[var(--line)] flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-extrabold tracking-tight text-[var(--tx)]">
          <Activity className="size-4 text-[#2E5CFF]" />
          <span>{t('executionsTitle')}</span>
        </h2>
        <span className="font-mono text-xs text-[var(--mut)] tabular-nums">
          {executions.length} fills
        </span>
      </div>

      {executions.length === 0 ? (
        <p className="p-6 text-center text-xs text-[var(--mut)]">{t('noExecutions')}</p>
      ) : (
        <ul className="divide-y divide-[var(--line)]">
          {executions.map((e) => (
            <li
              key={e.id}
              className="flex flex-col gap-1 px-5 py-3.5 text-xs sm:flex-row sm:items-center sm:justify-between hover:bg-[var(--s2)]/40 transition-colors"
            >
              <div className="min-w-0 space-y-0.5">
                <p className="font-mono font-bold text-[var(--tx)] truncate">
                  {e.market.slug ?? e.market.asset ?? e.id}
                </p>
                <p className="text-[var(--mut)] tabular-nums">
                  {t('executionTraderSize', {
                    size: Number(e.traderUsdcSize).toFixed(2),
                    side: e.market.side ?? '',
                  })}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {e.sizing?.finalAmount !== undefined && e.sizing.finalAmount > 0 && (
                  <span className="font-mono font-extrabold text-[var(--tx)] tabular-nums">
                    ${e.sizing.finalAmount.toFixed(2)}
                  </span>
                )}
                <span className="text-[11px] font-bold uppercase text-[#10B981]">
                  · {e.status}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
