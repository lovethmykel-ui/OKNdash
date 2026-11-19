'use client';

/**
 * polymarket-agent/copier-panel.tsx — the Copy tab content.
 *
 * Minimalist workspace combining:
 *   - Slim inline Agent capital readiness strip
 *   - Live Polymarket Leaderboard mirror (LeaderboardTable)
 *   - Active Mirrors (SubscriptionsCard) & Execution Feed (ExecutionsCard)
 */
import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Activity,
  ArrowRight,
  Crown,
  KeyRound,
  Landmark,
  PauseCircle,
  PlayCircle,
  Plus,
  StopCircle,
  Users,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { canEngageLiveCopy, shortenEvmAddress } from '@/lib/polymarket/leaderboard';
import type { AgentTab } from './tab-param';
import { LeaderboardTable } from './leaderboard-table';
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
      {/* Minimalist Agent Capital Bar */}
      <div
        className={cn(
          'rounded-2xl border px-5 py-3.5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
          funding.ready
            ? 'border-[var(--line)] bg-[var(--s1)]'
            : 'border-[#F59E0B]/40 bg-[#F59E0B]/[0.06]',
        )}
      >
        <div className="flex items-center gap-3 min-w-0">
          <Landmark
            className={cn(
              'size-4 shrink-0',
              funding.ready ? 'text-[#10B981]' : 'text-[#D97706] dark:text-[#FBBF24]',
            )}
          />
          <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5 text-xs sm:text-sm min-w-0">
            <span className="font-semibold text-[var(--tx)] tabular-nums">
              {funding.ready
                ? `$${usdcBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC.e`
                : 'Fund Agent Wallet to Copy Live'}
            </span>
            <span className="text-xs text-[var(--mut)] tabular-nums">
              {funding.ready
                ? `${polBalance.toFixed(2)} POL · ${liveCount} active ${liveCount === 1 ? 'mirror' : 'mirrors'}`
                : 'Queue traders in Preview now, or deposit USDC.e & POL first.'}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigateTab?.('fund')}
          className={cn(
            'h-8 px-3.5 rounded-lg text-xs font-semibold cursor-pointer shrink-0 inline-flex items-center gap-1.5 transition-colors whitespace-nowrap self-start sm:self-auto',
            funding.ready
              ? 'border border-[var(--line)] bg-[var(--s2)]/60 text-[var(--tx)] hover:bg-[var(--s2)]'
              : 'bg-[#2E5CFF] text-white hover:bg-[#1E4DF0]',
          )}
        >
          <span>{funding.ready ? 'Manage Funds' : 'Fund Agent'}</span>
          <ArrowRight className="size-3.5" />
        </button>
      </div>

      {!wallet && <ActivationCard onActivated={refresh} />}

      {/* Live Polymarket Leaderboard Mirror */}
      <LeaderboardTable
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
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#2E5CFF]/10 text-[#2E5CFF]">
          <Users className="size-5" />
        </span>
        <div className="space-y-1">
          <p className="font-display text-base font-bold text-[var(--tx)]">{t('headline')}</p>
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
      <div className="px-5 py-4 border-b border-[var(--line)] flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold tracking-tight text-[var(--tx)]">
          {t('tradersTitle')}
        </h2>
        <div className="flex items-center gap-2 text-xs text-[var(--mut)] tabular-nums">
          <span>{t('traderCount', { count: subscriptions.length })}</span>
          {entitlement?.billingEnabled && slots !== undefined ? (
            isPro ? (
              <span className="inline-flex items-center gap-1 font-semibold text-[#D97706] dark:text-[#FBBF24]">
                <Crown className="size-3.5" aria-hidden="true" />
                Pro
              </span>
            ) : (
              <button
                type="button"
                className="cursor-pointer font-semibold text-[#2E5CFF] hover:underline"
                onClick={onUpgrade}
                aria-label={tb('upgradeCta')}
              >
                · Free {liveCount}/{slots}
              </button>
            )
          ) : null}
        </div>
      </div>

      <div className="px-5 py-4 border-b border-[var(--line)] bg-[var(--s2)]/30 space-y-3">
        <div className="grid gap-2.5 sm:grid-cols-[1fr_auto_auto] sm:items-end">
          <div className="space-y-1">
            <Label htmlFor="copier-trader-address" className="text-xs font-medium text-[var(--mut)]">
              Add custom wallet address
            </Label>
            <Input
              id="copier-trader-address"
              value={traderAddress}
              onChange={(e) => setTraderAddress(e.target.value)}
              placeholder="0x..."
              aria-invalid={!validAddress && traderAddress.length > 0}
              className="h-9 text-xs font-mono"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="copier-copy-size" className="text-xs font-medium text-[var(--mut)]">
              {t('copySizeLabel')}
            </Label>
            <Input
              id="copier-copy-size"
              type="number"
              min={1}
              max={100}
              value={copySize}
              onChange={(e) => setCopySize(e.target.value)}
              className="h-9 w-20 text-xs font-mono tabular-nums"
            />
          </div>
          <Button type="button" size="sm" onClick={add} disabled={busy || !validAddress} className="h-9 cursor-pointer">
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
              className="flex flex-col gap-2.5 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between hover:bg-[var(--s2)]/35 transition-colors"
            >
              <div className="min-w-0 space-y-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-[var(--tx)]">
                    {sub.traderHandle ?? shortenEvmAddress(sub.traderAddress)}
                  </span>
                  {sub.specialty && (
                    <span className="text-xs text-[var(--mut)]">· {sub.specialty}</span>
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
    <span className={cn('text-xs font-semibold', tone)}>
      · {t(`status.${status}`)}
    </span>
  );
}

function ExecutionsCard({ executions }: { executions: CopierExecution[] }) {
  const t = useTranslations('dashboard.polymarketAgent.copier');
  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--s1)]">
      <div className="px-5 py-4 border-b border-[var(--line)] flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-bold tracking-tight text-[var(--tx)]">
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
              className="flex flex-col gap-1 px-5 py-3.5 text-xs sm:flex-row sm:items-center sm:justify-between hover:bg-[var(--s2)]/35 transition-colors"
            >
              <div className="min-w-0 space-y-0.5">
                <p className="font-mono font-semibold text-[var(--tx)] truncate">
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
                  <span className="font-mono font-bold text-[var(--tx)] tabular-nums">
                    ${e.sizing.finalAmount.toFixed(2)}
                  </span>
                )}
                <span className="text-xs font-semibold text-[#10B981]">
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
