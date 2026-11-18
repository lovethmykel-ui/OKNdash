'use client';

/**
 * polymarket-agent/funds-panel.tsx — the Fund tab content.
 *
 * Unified Treasury & Funding Desk for the Polymarket Copy Agent:
 *   - Left: Spendable USDC.e + Gas (POL) wallet overview + Polygon Deposit QR & Address
 *   - Right: Interactive Asset Switcher (USDC.e / POL), Presets, & Fund Agent CTA
 *   - Below: PRO Membership + Copier Fees + Allowlisted Withdrawals
 */
import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  ArrowDownToLine,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  KeyRound,
  Landmark,
  Plus,
  QrCode,
  RotateCw,
  TriangleAlert,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { cn } from '@/lib/utils';
import type { AgentTab } from './tab-param';
import { TwoFaChallenge } from './two-fa-challenge';
import { UpgradeDialog } from './upgrade-dialog';
import { FeeCard } from './fee-card';
import {
  addAllowlistAddress,
  exportWalletKey,
  fetchAllowlist,
  fetchBalances,
  fetchBilling,
  fetchFees,
  fetchWallet,
  fetchWithdrawals,
  fundAgentWallet,
  getInitialCopierSnapshot,
  requestWithdrawal,
  useCopierStoreVersion,
  type AllowlistAddress,
  type CopierBalances,
  type CopierEntitlement,
  type CopierWallet,
  type Withdrawal,
} from './copier-hooks';

type LoadState = 'loading' | 'unconfigured' | 'active' | 'error';

interface FundsPanelProps {
  onNavigateTab?: (tab: AgentTab) => void;
}

export function FundsPanel({ onNavigateTab }: FundsPanelProps) {
  const t = useTranslations('dashboard.polymarketAgent.copier.funds');
  const storeVersion = useCopierStoreVersion();
  const initial = getInitialCopierSnapshot();
  const [state, setState] = useState<LoadState>('active');
  const [wallet, setWallet] = useState<CopierWallet | null>(initial.wallet);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const walletRes = await fetchWallet();
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
        <CardContent className="p-6 text-sm text-[var(--mut)]">{t('unconfiguredBody')}</CardContent>
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

  if (!wallet) {
    return (
      <Card className="rounded-2xl border-[var(--line)] bg-[var(--s1)]">
        <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
          <span className="flex size-12 items-center justify-center rounded-xl bg-[#2E5CFF]/10 text-[#2E5CFF]">
            <Landmark className="size-6" />
          </span>
          <p className="text-sm font-medium">{t('activateFirstTitle')}</p>
          <p className="max-w-prose text-xs text-[var(--mut)]">{t('activateFirstBody')}</p>
          <Button size="sm" className="cursor-pointer" onClick={() => onNavigateTab?.('copy')}>
            Go to Copy Tab
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <TreasuryAndFundingDesk
        wallet={wallet}
        onChanged={refresh}
        onGoCopy={() => onNavigateTab?.('copy')}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <BillingCard />
        <FeeCard />
      </div>

      <WithdrawCard onChanged={refresh} />
    </div>
  );
}

/**
 * Unified Treasury & Funding Desk: merges Spendable Balance, Polygon Wallet Address,
 * QR Code, and Interactive Deposit Controls into one crisp 12-column single-elevation unit.
 */
function TreasuryAndFundingDesk({
  wallet,
  onChanged,
  onGoCopy,
}: {
  wallet: CopierWallet;
  onChanged: () => void;
  onGoCopy: () => void;
}) {
  const t = useTranslations('dashboard.polymarketAgent.copier');
  const tw = useTranslations('dashboard.polymarketAgent.copier.wallet');
  const storeVersion = useCopierStoreVersion();

  const [exportOpen, setExportOpen] = useState(false);
  const [balances, setBalances] = useState<CopierBalances | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [nowMs, setNowMs] = useState<number | null>(null);
  const [copiedWallet, setCopiedWallet] = useState(false);

  const [asset, setAsset] = useState<'USDC' | 'POL'>('USDC');
  const [amount, setAmount] = useState('250');
  const [busy, setBusy] = useState(false);
  const [lastFundedMsg, setLastFundedMsg] = useState<string | null>(null);

  const presets = asset === 'USDC' ? ['50', '100', '250', '500', '1000'] : ['5', '10', '25', '50'];

  const loadBalances = useCallback(async () => {
    setRefreshing(true);
    const res = await fetchBalances();
    setRefreshing(false);
    if (res.ok) setBalances(res.data ?? null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await fetchBalances();
      if (!cancelled && res.ok) setBalances(res.data ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [storeVersion]);

  useEffect(() => {
    setNowMs(Date.now());
    const timer = setInterval(() => setNowMs(Date.now()), 5000);
    return () => clearInterval(timer);
  }, []);

  const updatedAt = balances ? new Date(balances.updatedAt).getTime() : null;
  const agoSeconds =
    updatedAt != null && nowMs != null ? Math.max(0, Math.round((nowMs - updatedAt) / 1000)) : null;
  const spendableNum = balances ? Number(balances.usdc) : 0;

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(wallet.address);
      setCopiedWallet(true);
      toast.success('Agent wallet address copied');
      setTimeout(() => setCopiedWallet(false), 1800);
    } catch {
      toast.info(wallet.address);
    }
  };

  const handleSelectAsset = (next: 'USDC' | 'POL') => {
    setAsset(next);
    setAmount(next === 'USDC' ? '250' : '10');
    setLastFundedMsg(null);
  };

  const handleDeposit = async () => {
    const num = Number.parseFloat(amount);
    if (!Number.isFinite(num) || num <= 0) {
      toast.error('Enter a valid deposit amount');
      return;
    }
    setBusy(true);
    const res = await fundAgentWallet({ asset, amount: num });
    setBusy(false);
    if (res.ok) {
      const label = asset === 'USDC' ? `$${num.toFixed(2)} USDC.e` : `${num.toFixed(2)} POL`;
      setLastFundedMsg(`Deposited ${label} into your Polymarket Agent wallet.`);
      toast.success(`Funded Agent with ${label}`);
      await loadBalances();
      onChanged();
    } else {
      toast.error(res.error.message);
    }
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--s1)]">
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[var(--line)] items-stretch">
        {/* Left: Spendable Balance + Deposit Address + QR */}
        <div className="lg:col-span-5 flex flex-col justify-between divide-y divide-[var(--line)]">
          <div className="p-5 sm:p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#2E5CFF]/12 text-[#2E5CFF]">
                  <Wallet className="size-5" />
                </span>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--mut)]">
                    {tw('spendable')}
                  </p>
                  <p className="text-xs text-[var(--mut)] tabular-nums">
                    {t(`origin.${wallet.origin}`)}
                    {balances?.allowance ? (
                      <>
                        {' · '}
                        <span
                          className={
                            balances.allowance.usdcApproved ? 'text-[#10B981] font-semibold' : 'text-[#D97706]'
                          }
                        >
                          {balances.allowance.usdcApproved ? tw('allowanceApproved') : tw('allowanceNeeded')}
                        </span>
                      </>
                    ) : null}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label={tw('refreshAria')}
                  className="size-8 cursor-pointer"
                  disabled={refreshing}
                  onClick={() => void loadBalances()}
                >
                  <RotateCw className={refreshing ? 'size-3.5 animate-spin' : 'size-3.5'} />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 cursor-pointer text-xs"
                  onClick={() => setExportOpen(true)}
                >
                  <KeyRound data-icon="inline-start" />
                  {t('export.exportKey')}
                </Button>
              </div>
            </div>

            <div>
              <p className="font-display text-3xl sm:text-4xl font-extrabold tabular-nums text-[var(--tx)]" aria-live="polite">
                {balances ? (
                  <>
                    <AnimatedCounter
                      target={spendableNum}
                      decimals={2}
                      durationMs={650}
                      className="tabular-nums"
                    />{' '}
                    <span className="text-base sm:text-lg font-bold text-[var(--mut)]">USDC.e</span>
                  </>
                ) : (
                  '—'
                )}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--mut)] tabular-nums">
                <span>
                  {tw('gasLabel')}:{' '}
                  <span className="font-mono font-bold text-[var(--tx)]">
                    {balances ? `${Number(balances.pol).toFixed(3)} POL` : '—'}
                  </span>
                </span>
                {agoSeconds !== null && (
                  <span>· {tw('updatedAgo', { seconds: agoSeconds })}</span>
                )}
              </div>
            </div>

            {spendableNum >= 10 && (
              <div>
                <button
                  type="button"
                  onClick={onGoCopy}
                  className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#2E5CFF] hover:underline cursor-pointer"
                >
                  <span>Copy Top Leaderboard Traders</span>
                  <ArrowRight className="size-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Flush Polygon Deposit Address + QR */}
          <div className="p-5 sm:p-6 bg-[var(--s2)]/40 space-y-3.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[var(--mut)]">Polygon PoS Deposit</span>
              <span className="font-mono font-bold text-[var(--tx)]">Chain 137 · {asset === 'USDC' ? 'USDC.e' : 'POL'}</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="shrink-0 rounded-xl bg-white p-2.5 border border-[var(--line)]">
                <QrCode className="size-16 text-[#0A0A0C]" strokeWidth={1.75} />
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <div className="text-[11px] font-semibold text-[var(--mut)]">
                  Agent Deposit Address
                </div>
                <p className="font-mono text-xs font-bold text-[var(--tx)] break-all leading-relaxed">
                  {wallet.address}
                </p>
                <button
                  type="button"
                  aria-label={tw('copyAddress')}
                  onClick={() => void copyAddress()}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--line)] bg-[var(--s1)] px-2.5 py-1 text-xs font-bold text-[var(--tx)] hover:bg-[var(--s2)] cursor-pointer"
                >
                  {copiedWallet ? <Check className="size-3 text-[#10B981]" /> : <Copy className="size-3" />}
                  <span>{copiedWallet ? 'Copied' : 'Copy Address'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Fund Agent Controls */}
        <div className="lg:col-span-7 p-5 sm:p-6 flex flex-col justify-between gap-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-[var(--tx)]">
                Fund Agent Before Trading
              </h2>
              <p className="text-xs text-[var(--mut)] mt-0.5">
                Deposit Polygon USDC.e trading capital and POL gas into your dedicated Agent wallet.
              </p>
            </div>

            <div
              role="tablist"
              aria-label="Funding asset"
              className="inline-flex items-center gap-1 rounded-xl border border-[var(--line)] bg-[var(--s2)] p-1 self-start sm:self-auto"
            >
              <button
                type="button"
                role="tab"
                aria-selected={asset === 'USDC'}
                onClick={() => handleSelectAsset('USDC')}
                className={cn(
                  'h-8 px-3.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap',
                  asset === 'USDC' ? 'bg-[var(--s1)] text-[var(--tx)] shadow-xs' : 'text-[var(--mut)] hover:text-[var(--tx)]',
                )}
              >
                USDC.e (Capital)
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={asset === 'POL'}
                onClick={() => handleSelectAsset('POL')}
                className={cn(
                  'h-8 px-3.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap',
                  asset === 'POL' ? 'bg-[var(--s1)] text-[var(--tx)] shadow-xs' : 'text-[var(--mut)] hover:text-[var(--tx)]',
                )}
              >
                POL (Gas)
              </button>
            </div>
          </div>

          <div className="space-y-3.5">
            <div className="flex items-center justify-between text-xs font-semibold text-[var(--mut)]">
              <span>Deposit Amount ({asset === 'USDC' ? 'USDC.e' : 'POL'})</span>
              <span className="font-mono text-[11px]">Min recommended: {asset === 'USDC' ? '$50' : '2 POL'}</span>
            </div>

            <div className="flex items-center rounded-xl border border-[var(--line)] bg-[var(--s2)]/60 px-4 py-3 focus-within:border-[#2E5CFF] transition-colors">
              {asset === 'USDC' && (
                <span className="text-2xl font-extrabold text-[var(--mut)] mr-1.5">$</span>
              )}
              <input
                type="number"
                min={asset === 'USDC' ? 10 : 1}
                step={asset === 'USDC' ? 10 : 1}
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setLastFundedMsg(null);
                }}
                aria-label="Agent deposit amount"
                className="w-full bg-transparent text-2xl sm:text-3xl font-extrabold text-[var(--tx)] tabular-nums outline-none"
              />
              <span className="shrink-0 font-mono text-xs font-extrabold text-[#2E5CFF] ml-2">
                {asset === 'USDC' ? 'USDC.e' : 'POL'}
              </span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
              {presets.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => {
                    setAmount(val);
                    setLastFundedMsg(null);
                  }}
                  className={cn(
                    'h-9 rounded-xl border text-xs font-extrabold transition-all cursor-pointer tabular-nums',
                    amount === val
                      ? 'border-[#2E5CFF] bg-[#2E5CFF] text-white'
                      : 'border-[var(--line)] bg-[var(--s2)] text-[var(--tx)]/80 hover:text-[var(--tx)]',
                  )}
                >
                  {asset === 'USDC' ? `$${val}` : `${val} POL`}
                </button>
              ))}
            </div>
          </div>

          {lastFundedMsg && (
            <div className="rounded-xl border border-[#10B981]/35 bg-[#10B981]/10 px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs">
              <span className="flex items-center gap-2 font-bold text-[#10B981]">
                <CheckCircle2 className="size-4 shrink-0" />
                {lastFundedMsg}
              </span>
              <button
                type="button"
                onClick={onGoCopy}
                className="font-extrabold text-[#2E5CFF] hover:underline shrink-0 cursor-pointer inline-flex items-center gap-1"
              >
                <span>Copy Traders</span>
                <ArrowRight className="size-3" />
              </button>
            </div>
          )}

          <button
            type="button"
            disabled={busy}
            onClick={() => void handleDeposit()}
            className="w-full h-11 rounded-xl bg-[#2E5CFF] text-white text-sm font-extrabold hover:bg-[#1E4DF0] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <Plus className="size-4.5" />
            <span>
              {busy
                ? 'Crediting Agent Wallet...'
                : `Fund Agent (${asset === 'USDC' ? `$${amount || '0'} USDC.e` : `${amount || '0'} POL`})`}
            </span>
          </button>
        </div>
      </div>

      <ExportKeyDialog
        open={exportOpen}
        onOpenChange={(o) => {
          setExportOpen(o);
          if (!o) onChanged();
        }}
      />
    </section>
  );
}

function BillingCard() {
  const t = useTranslations('dashboard.polymarketAgent.copier.billing');
  const storeVersion = useCopierStoreVersion();
  const [entitlement, setEntitlement] = useState<CopierEntitlement | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const load = useCallback(async () => {
    const res = await fetchBilling();
    if (res.ok && res.data?.pricing) setEntitlement(res.data);
  }, []);

  useEffect(() => {
    void load();
  }, [load, storeVersion]);

  if (!entitlement) return null;

  const isPro = entitlement.tier === 'pro';

  return (
    <section className="rounded-2xl border border-[var(--line)] bg-[var(--s1)] p-5 sm:p-6 flex flex-col justify-between gap-4">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-extrabold text-[var(--tx)]">{t('title')}</p>
          {isPro && (
            <span className="text-xs font-extrabold text-[#D97706] dark:text-[#FBBF24]">
              {t('proActive')}
            </span>
          )}
        </div>
        {isPro && entitlement.periodEnd ? (
          <p className="text-xs text-[var(--mut)]">
            {t('expiresOn', {
              date: new Date(entitlement.periodEnd).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                timeZone: 'UTC',
              }),
            })}
          </p>
        ) : entitlement.billingEnabled ? (
          <p className="text-xs text-[var(--mut)] leading-relaxed">
            {t('priceLabel', {
              price: `$${Number(entitlement.pricing.proPriceUsdc).toFixed(0)}`,
              days: entitlement.pricing.proPeriodDays,
            })}
            {' · '}
            {t('feeNow', { rate: entitlement.pricing.feeBpsPro / 100 })}
          </p>
        ) : (
          <p className="text-xs text-[var(--mut)] leading-relaxed">{t('comingSoon')}</p>
        )}
      </div>

      {entitlement.billingEnabled ? (
        <div>
          <Button
            type="button"
            size="sm"
            variant={isPro ? 'outline' : 'default'}
            className="cursor-pointer"
            onClick={() => setUpgradeOpen(true)}
          >
            {isPro ? t('renew') : t('upgradeCta')}
          </Button>
        </div>
      ) : null}

      <UpgradeDialog
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        entitlement={entitlement}
        onSubscribed={() => void load()}
      />
    </section>
  );
}

function ExportKeyDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations('dashboard.polymarketAgent.copier.export');
  const [stage, setStage] = useState<'confirm' | 'revealed'>('confirm');
  const [key, setKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [need2fa, setNeed2fa] = useState(false);

  const reveal = async () => {
    setBusy(true);
    setError(null);
    const res = await exportWalletKey();
    setBusy(false);
    if (res.ok && res.data) {
      setKey(res.data.privateKey);
      setStage('revealed');
      setNeed2fa(false);
    } else if (res.error?.code === '2fa_required') {
      setNeed2fa(true);
    } else {
      setError(res.error?.message ?? t('failed'));
    }
  };

  const close = (openNext: boolean) => {
    if (!openNext) {
      setStage('confirm');
      setKey(null);
      setCopied(false);
      setError(null);
    }
    onOpenChange(openNext);
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-md">
        {stage === 'confirm' ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <TriangleAlert className="size-5 text-ios-orange" />
                {t('confirmTitle')}
              </DialogTitle>
              <DialogDescription>{t('confirmBody')}</DialogDescription>
            </DialogHeader>
            {need2fa && <TwoFaChallenge onVerified={() => void reveal()} />}
            {error && (
              <p role="alert" className="text-sm text-ios-red">
                {error}
              </p>
            )}
            <DialogFooter>
              <Button variant="outline" className="cursor-pointer" onClick={() => close(false)}>
                {t('cancel')}
              </Button>
              <Button
                variant="destructive"
                className="cursor-pointer"
                disabled={busy}
                onClick={() => void reveal()}
              >
                <KeyRound data-icon="inline-start" />
                {busy ? t('revealing') : t('reveal')}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{t('revealedTitle')}</DialogTitle>
              <DialogDescription>{t('revealedBody')}</DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <p className="break-all rounded-lg border border-border bg-muted/40 p-3 font-mono text-xs">
                {key}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="cursor-pointer"
                onClick={async () => {
                  if (key) await navigator.clipboard.writeText(key);
                  setCopied(true);
                }}
              >
                <Copy data-icon="inline-start" />
                {copied ? t('copied') : t('copy')}
              </Button>
            </div>
            <DialogFooter>
              <Button className="cursor-pointer" onClick={() => close(false)}>
                {t('done')}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function cooldownActive(effectiveAfter: string, nowMs: number | null): boolean {
  if (nowMs === null) return false;
  return new Date(effectiveAfter).getTime() > nowMs;
}

function WithdrawCard({ onChanged }: { onChanged: () => void }) {
  const t = useTranslations('dashboard.polymarketAgent.copier.withdraw');
  const storeVersion = useCopierStoreVersion();
  const [allowlist, setAllowlist] = useState<AllowlistAddress[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [reloadKey, setReloadKey] = useState(0);
  const [nowMs, setNowMs] = useState<number | null>(null);

  useEffect(() => {
    setNowMs(Date.now());
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [allowRes, wdRes] = await Promise.all([fetchAllowlist(), fetchWithdrawals()]);
      if (cancelled) return;
      if (allowRes.ok) setAllowlist(allowRes.data ?? []);
      if (wdRes.ok) setWithdrawals(wdRes.data ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadKey, storeVersion]);

  const refresh = useCallback(() => {
    setReloadKey((k) => k + 1);
    onChanged();
  }, [onChanged]);

  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--s1)]">
      <div className="p-5 sm:px-6 border-b border-[var(--line)]">
        <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--mut)]">
          <Landmark className="size-3.5" />
          <span>{t('title')}</span>
        </h2>
      </div>

      <div className="divide-y divide-[var(--line)]">
        <section className="p-5 sm:px-6 space-y-2.5">
          <p className="text-sm font-semibold text-[var(--tx)]">{t('allowlistTitle')}</p>
          <AddAllowlistRow onAdded={refresh} />
          {allowlist.length === 0 ? (
            <p className="pt-1 text-xs text-[var(--mut)]">{t('allowlistEmpty')}</p>
          ) : (
            <ul className="divide-y divide-[var(--line)] border-t border-[var(--line)] mt-2">
              {allowlist.map((a) => {
                const cooling = cooldownActive(a.effectiveAfter, nowMs);
                return (
                  <li
                    key={a.id}
                    className="flex flex-col gap-1 py-2.5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-mono text-xs text-[var(--tx)]">{a.address}</p>
                      {a.label && <p className="text-xs text-[var(--mut)]">{a.label}</p>}
                    </div>
                    {cooling ? (
                      <span className="text-xs font-semibold text-[#D97706] dark:text-[#FBBF24]">
                        {t('cooldownUntil', {
                          time: new Date(a.effectiveAfter).toLocaleString('en-US', {
                            timeZone: 'UTC',
                          }),
                        })}
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-[#10B981]">
                        {t('allowlistActive')}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="p-5 sm:px-6">
          <RequestWithdrawalRow
            allowlist={allowlist.filter((a) => !cooldownActive(a.effectiveAfter, nowMs))}
            onRequested={refresh}
          />
        </section>

        <section aria-label={t('historyTitle')} className="p-5 sm:px-6 space-y-2">
          <p className="text-sm font-semibold text-[var(--tx)]">{t('historyTitle')}</p>
          {withdrawals.length === 0 ? (
            <p className="text-xs text-[var(--mut)]">{t('historyEmpty')}</p>
          ) : (
            <ul className="divide-y divide-[var(--line)] border-t border-[var(--line)]">
              {withdrawals.map((w) => (
                <li
                  key={w.id}
                  className="flex flex-col gap-1 py-2.5 text-xs sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate font-mono text-[var(--tx)]">{w.address}</p>
                    {w.txHash && <p className="truncate text-[var(--mut)]">tx: {w.txHash}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono tabular-nums font-bold text-[var(--tx)]">
                      ${Number(w.amountUsdc).toFixed(2)}
                    </span>
                    <WithdrawalStatusBadge status={w.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </section>
  );
}

function AddAllowlistRow({ onAdded }: { onAdded: () => void }) {
  const t = useTranslations('dashboard.polymarketAgent.copier.withdraw');
  const [address, setAddress] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const valid = /^0x[0-9a-fA-F]{40}$/.test(address.trim());

  const add = async () => {
    setBusy(true);
    setError(null);
    const res = await addAllowlistAddress({ address: address.trim() });
    setBusy(false);
    if (res.ok) {
      setAddress('');
      onAdded();
    } else {
      setError(res.error?.message ?? t('addFailed'));
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
        <Input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="0x..."
          aria-label={t('addressLabel')}
          aria-invalid={!valid && address.length > 0}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="cursor-pointer"
          disabled={busy || !valid}
          onClick={() => void add()}
        >
          <Plus data-icon="inline-start" />
          {t('addAddress')}
        </Button>
      </div>
      <p className="text-xs text-[var(--mut)]">{t('allowlistHelp')}</p>
      {error && (
        <p role="alert" className="text-sm text-ios-red">
          {error}
        </p>
      )}
    </div>
  );
}

function RequestWithdrawalRow({
  allowlist,
  onRequested,
}: {
  allowlist: AllowlistAddress[];
  onRequested: () => void;
}) {
  const t = useTranslations('dashboard.polymarketAgent.copier.withdraw');
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [need2fa, setNeed2fa] = useState(false);

  const amountNum = Number(amount);
  const valid = address !== '' && Number.isFinite(amountNum) && amountNum > 0;

  const [netEstimate, setNetEstimate] = useState<string | null>(null);
  useEffect(() => {
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      setNetEstimate(null);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      void (async () => {
        const res = await fetchFees(amountNum);
        if (!cancelled && res.ok && res.data) {
          setNetEstimate(res.data.nextWithdrawalNetUsdc);
        }
      })();
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [amountNum]);

  const submit = async () => {
    setBusy(true);
    setError(null);
    setSuccess(false);
    const res = await requestWithdrawal({ address, amountUsdc: amountNum });
    setBusy(false);
    if (res.ok) {
      setSuccess(true);
      setNeed2fa(false);
      setAmount('');
      toast.success(`Withdrawal of $${amountNum.toFixed(2)} processed`);
      onRequested();
    } else if (res.error?.code === '2fa_required') {
      setNeed2fa(true);
    } else {
      setError(res.error?.message ?? t('requestFailed'));
    }
  };

  return (
    <section aria-label={t('requestTitle')} className="space-y-2">
      <p className="text-sm font-semibold text-[var(--tx)]">{t('requestTitle')}</p>
      {allowlist.length === 0 ? (
        <p className="text-xs text-[var(--mut)]">{t('requestNoAddress')}</p>
      ) : (
        <div className="space-y-2">
          <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto] sm:items-center">
            <div>
              <Label htmlFor="withdraw-address" className="sr-only">
                {t('addressLabel')}
              </Label>
              <select
                id="withdraw-address"
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  setSuccess(false);
                }}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">{t('selectAddress')}</option>
                {allowlist.map((a) => (
                  <option key={a.id} value={a.address}>
                    {a.address}
                    {a.label ? ` (${a.label})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="withdraw-amount" className="sr-only">
                {t('amountLabel')}
              </Label>
              <Input
                id="withdraw-amount"
                type="number"
                min={0}
                step="0.01"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setSuccess(false);
                }}
                placeholder={t('amountLabel')}
                className="w-32"
              />
            </div>
            <Button
              type="button"
              className="cursor-pointer"
              disabled={busy || !valid}
              onClick={() => void submit()}
            >
              <ArrowDownToLine data-icon="inline-start" />
              {busy ? t('requesting') : t('request')}
            </Button>
          </div>
          {netEstimate !== null && (
            <p role="status" className="text-xs text-[var(--mut)]">
              {t('netEstimate', { net: `$${Number(netEstimate).toFixed(2)}` })}
            </p>
          )}
          {need2fa && <TwoFaChallenge onVerified={() => void submit()} />}
          {success && (
            <p role="status" className="text-sm text-[#10B981]">
              {t('requestQueued')}
            </p>
          )}
          {error && (
            <p role="alert" className="text-sm text-ios-red">
              {error}
            </p>
          )}
        </div>
      )}
    </section>
  );
}

function WithdrawalStatusBadge({ status }: { status: Withdrawal['status'] }) {
  const t = useTranslations('dashboard.polymarketAgent.copier.withdraw');
  const tone =
    status === 'done'
      ? 'bg-ios-green/10 text-ios-green'
      : status === 'failed'
        ? 'bg-ios-red/10 text-ios-red'
        : status === 'canceled'
          ? 'bg-muted text-muted-foreground'
          : 'bg-ios-blue/10 text-ios-blue';
  return (
    <Badge variant="secondary" className={tone}>
      {t(`status.${status}`)}
    </Badge>
  );
}
