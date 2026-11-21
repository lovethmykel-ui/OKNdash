'use client';

/**
 * CopyConfigModal — Auto-copy configuration drawer/dialog opened when a user
 * clicks "Connect & Auto-Copy" (or manages an active mirror) on a Whale Detail view.
 */
import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  Link2,
  PauseCircle,
  PlayCircle,
  ShieldCheck,
  StopCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  formatCompactUsd,
  shortenEvmAddress,
  type LiveLeaderboardTrader,
} from '@/lib/polymarket/leaderboard';
import {
  createSubscription,
  updateSubscription,
  type CopierSubscription,
} from './copier-hooks';
import { WhaleAvatar } from './whale-card';

interface CopyConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trader: LiveLeaderboardTrader;
  existingSubscription?: CopierSubscription;
  agentFunded: boolean;
  agentUsdcBalance: number;
  onSaved: () => void;
  onGoFund: () => void;
}

export function CopyConfigModal({
  open,
  onOpenChange,
  trader,
  existingSubscription,
  agentFunded,
  agentUsdcBalance,
  onSaved,
  onGoFund,
}: CopyConfigModalProps) {
  const isConnected = Boolean(
    existingSubscription && existingSubscription.status !== 'stopped',
  );

  const [strategy, setStrategy] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [allocationUsd, setAllocationUsd] = useState('250');
  const [copySize, setCopySize] = useState('15');
  const [maxPerMarketUsd, setMaxPerMarketUsd] = useState('100');
  const [slippagePct, setSlippagePct] = useState('1');
  const [startMode, setStartMode] = useState<'live' | 'preview'>(
    agentFunded ? 'live' : 'preview',
  );
  const [busy, setBusy] = useState(false);

  // Sync modal state when opened or switching whales
  useEffect(() => {
    if (!open) return;
    if (existingSubscription && existingSubscription.status !== 'stopped') {
      setStrategy(
        existingSubscription.strategyConfig.strategy === 'FIXED'
          ? 'FIXED'
          : 'PERCENTAGE',
      );
      setAllocationUsd(
        String(existingSubscription.strategyConfig.allocationUsd ?? 250),
      );
      setCopySize(String(existingSubscription.strategyConfig.copySize ?? 15));
      setMaxPerMarketUsd(
        String(existingSubscription.strategyConfig.maxOrderSizeUsd ?? 100),
      );
      setSlippagePct(
        String(existingSubscription.strategyConfig.slippagePct ?? 1),
      );
      setStartMode(
        existingSubscription.status === 'live' && agentFunded ? 'live' : 'preview',
      );
    } else {
      setStrategy('PERCENTAGE');
      setAllocationUsd('250');
      setCopySize('15');
      setMaxPerMarketUsd('100');
      setSlippagePct('1');
      setStartMode(agentFunded ? 'live' : 'preview');
    }
  }, [open, existingSubscription, agentFunded]);

  const parsedAllocation = Math.max(10, Number(allocationUsd) || 10);
  const parsedCopySize =
    strategy === 'PERCENTAGE'
      ? Math.min(100, Math.max(1, Number(copySize) || 10))
      : Math.max(5, Number(copySize) || 25);
  const parsedMaxPerMarket = Math.max(10, Number(maxPerMarketUsd) || 50);
  const parsedSlippage = Math.min(10, Math.max(0.1, Number(slippagePct) || 1));

  const handleSave = async () => {
    if (startMode === 'live' && !agentFunded) {
      toast.error('Fund your Agent wallet with USDC.e & POL before live auto-copy');
      onOpenChange(false);
      onGoFund();
      return;
    }

    setBusy(true);
    const strategyConfig: CopierSubscription['strategyConfig'] = {
      strategy,
      copySize: parsedCopySize,
      maxOrderSizeUsd: Math.min(parsedMaxPerMarket, parsedAllocation),
      minOrderSizeUsd: 10,
      allocationUsd: parsedAllocation,
      slippagePct: parsedSlippage,
    };

    const res = await createSubscription({
      traderAddress: trader.address,
      traderHandle: trader.displayName,
      traderAvatar: trader.profileImage,
      initialStatus: startMode,
      strategyConfig,
    });
    setBusy(false);

    if (res.ok) {
      toast.success(
        startMode === 'live'
          ? `Connected & auto-copying ${trader.displayName} live`
          : `Saved ${trader.displayName} in Preview mode`,
      );
      onSaved();
      onOpenChange(false);
    } else {
      toast.error('Could not save copy configuration');
    }
  };

  const handleQuickStatus = async (status: CopierSubscription['status']) => {
    if (!existingSubscription) return;
    if (status === 'live' && !agentFunded) {
      toast.error('Fund your Agent wallet before resuming live auto-copy');
      onOpenChange(false);
      onGoFund();
      return;
    }
    setBusy(true);
    const res = await updateSubscription(existingSubscription.id, { status });
    setBusy(false);
    if (res.ok) {
      toast.success(
        status === 'stopped'
          ? `Disconnected ${trader.displayName}`
          : status === 'paused'
            ? `Paused mirroring ${trader.displayName}`
            : `Resumed live mirroring for ${trader.displayName}`,
      );
      onSaved();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-3xl border-[var(--line)] bg-[var(--s1)] p-0 overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-[var(--line)] bg-gradient-to-r from-[#7A12F5]/[0.07] via-transparent to-transparent">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <WhaleAvatar
                name={trader.displayName}
                imageUrl={trader.profileImage}
                toneClass={trader.avatarTone}
              />
              <div className="min-w-0 text-left">
                <DialogTitle className="flex items-center gap-1.5 text-base sm:text-lg font-extrabold text-[var(--tx)]">
                  <span className="truncate">{trader.displayName}</span>
                  {trader.verified && (
                    <BadgeCheck className="size-4 shrink-0 text-[#7A12F5] dark:text-[#A855F7]" />
                  )}
                </DialogTitle>
                <DialogDescription className="mt-0.5 text-xs text-[var(--mut)] font-mono tabular-nums">
                  {shortenEvmAddress(trader.address)} · Rank #{trader.rank} ·{' '}
                  {formatCompactUsd(trader.pnlUsd, true)} PnL
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* 1. Total USDC Allocation Limit */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <Label htmlFor="copy-alloc-usd" className="font-bold text-[var(--tx)]">
                USDC Allocation Limit
              </Label>
              <span className="font-mono text-[var(--mut)] tabular-nums">
                Available: ${agentUsdcBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {[100, 250, 500, 1000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAllocationUsd(String(val))}
                  className={cn(
                    'h-9 rounded-xl border text-xs font-bold tabular-nums transition-colors cursor-pointer',
                    Number(allocationUsd) === val
                      ? 'border-[#7A12F5] bg-[#7A12F5]/10 text-[#7A12F5] dark:text-[#C084FC]'
                      : 'border-[var(--line)] bg-[var(--s2)]/50 text-[var(--mut)] hover:text-[var(--tx)]',
                  )}
                >
                  ${val}
                </button>
              ))}
            </div>
            <Input
              id="copy-alloc-usd"
              type="number"
              min={10}
              step={10}
              value={allocationUsd}
              onChange={(e) => setAllocationUsd(e.target.value)}
              className="h-10 rounded-xl font-mono text-sm tabular-nums"
            />
          </div>

          {/* 2. Sizing Mode: Proportional vs Fixed */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-[var(--tx)]">
              Trade Sizing Mode
            </Label>
            <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-[var(--s2)] p-1 border border-[var(--line)]">
              <button
                type="button"
                onClick={() => {
                  setStrategy('PERCENTAGE');
                  setCopySize('15');
                }}
                className={cn(
                  'h-9 rounded-lg text-xs font-bold transition-all cursor-pointer',
                  strategy === 'PERCENTAGE'
                    ? 'bg-[var(--s1)] text-[#7A12F5] dark:text-[#C084FC] shadow-xs'
                    : 'text-[var(--mut)] hover:text-[var(--tx)]',
                )}
              >
                Proportional (%)
              </button>
              <button
                type="button"
                onClick={() => {
                  setStrategy('FIXED');
                  setCopySize('25');
                }}
                className={cn(
                  'h-9 rounded-lg text-xs font-bold transition-all cursor-pointer',
                  strategy === 'FIXED'
                    ? 'bg-[var(--s1)] text-[#7A12F5] dark:text-[#C084FC] shadow-xs'
                    : 'text-[var(--mut)] hover:text-[var(--tx)]',
                )}
              >
                Fixed ($ USDC)
              </button>
            </div>

            <div className="grid grid-cols-4 gap-1.5 pt-1">
              {(strategy === 'PERCENTAGE' ? [5, 10, 15, 25] : [10, 25, 50, 100]).map(
                (val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setCopySize(String(val))}
                    className={cn(
                      'h-8 rounded-lg border text-xs font-bold tabular-nums transition-colors cursor-pointer',
                      Number(copySize) === val
                        ? 'border-[#7A12F5] bg-[#7A12F5]/10 text-[#7A12F5] dark:text-[#C084FC]'
                        : 'border-[var(--line)] bg-[var(--s2)]/40 text-[var(--mut)] hover:text-[var(--tx)]',
                    )}
                  >
                    {strategy === 'PERCENTAGE' ? `${val}%` : `$${val}`}
                  </button>
                ),
              )}
            </div>
            <Input
              aria-label={strategy === 'PERCENTAGE' ? 'Copy percentage' : 'Fixed USDC per trade'}
              type="number"
              min={strategy === 'PERCENTAGE' ? 1 : 5}
              max={strategy === 'PERCENTAGE' ? 100 : 10000}
              value={copySize}
              onChange={(e) => setCopySize(e.target.value)}
              className="h-10 rounded-xl font-mono text-sm tabular-nums"
            />
          </div>

          {/* 3. Max Per-Market Cap & Slippage Tolerance */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="copy-max-market" className="text-xs font-bold text-[var(--tx)]">
                Max Per-Market Cap ($)
              </Label>
              <Input
                id="copy-max-market"
                type="number"
                min={10}
                step={10}
                value={maxPerMarketUsd}
                onChange={(e) => setMaxPerMarketUsd(e.target.value)}
                className="h-10 rounded-xl font-mono text-sm tabular-nums"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[var(--tx)]">
                Slippage Tolerance
              </Label>
              <div className="grid grid-cols-4 gap-1">
                {[0.5, 1, 2, 3].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setSlippagePct(String(pct))}
                    className={cn(
                      'h-10 rounded-xl border text-xs font-bold tabular-nums transition-colors cursor-pointer',
                      Number(slippagePct) === pct
                        ? 'border-[#7A12F5] bg-[#7A12F5]/10 text-[#7A12F5] dark:text-[#C084FC]'
                        : 'border-[var(--line)] bg-[var(--s2)]/40 text-[var(--mut)] hover:text-[var(--tx)]',
                    )}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 4. Execution Mode & Safety Notice */}
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--s2)]/40 p-3.5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--tx)]">
                <ShieldCheck className="size-4 text-[#10B981]" />
                <span>Execution Mode</span>
              </div>
              <div className="inline-flex rounded-lg bg-[var(--s1)] p-0.5 border border-[var(--line)]">
                <button
                  type="button"
                  onClick={() => setStartMode('live')}
                  className={cn(
                    'px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-colors',
                    startMode === 'live'
                      ? 'bg-[#10B981] text-white'
                      : 'text-[var(--mut)] hover:text-[var(--tx)]',
                  )}
                >
                  Instant Live
                </button>
                <button
                  type="button"
                  onClick={() => setStartMode('preview')}
                  className={cn(
                    'px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-colors',
                    startMode === 'preview'
                      ? 'bg-[#7A12F5] text-white'
                      : 'text-[var(--mut)] hover:text-[var(--tx)]',
                  )}
                >
                  Preview
                </button>
              </div>
            </div>

            {!agentFunded && (
              <div className="flex items-start gap-2 rounded-xl border border-[#F59E0B]/35 bg-[#F59E0B]/10 p-2.5 text-xs text-[#B45309] dark:text-[#FBBF24]">
                <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold">
                    Agent wallet requires at least $10 USDC.e & 0.05 POL for live execution.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      onOpenChange(false);
                      onGoFund();
                    }}
                    className="underline font-bold cursor-pointer"
                  >
                    Fund Agent Wallet →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-1">
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleSave()}
              data-testid="confirm-auto-copy-btn"
              className="w-full h-12 rounded-xl bg-[#7A12F5] hover:bg-[#690CD9] disabled:opacity-60 text-white text-sm font-extrabold shadow-sm transition-all cursor-pointer inline-flex items-center justify-center gap-2 active:scale-[0.985]"
            >
              {isConnected ? (
                <CheckCircle2 className="size-4" />
              ) : (
                <Link2 className="size-4" />
              )}
              <span>
                {busy
                  ? 'Saving…'
                  : isConnected
                    ? 'Update Auto-Copy Rules'
                    : startMode === 'live'
                      ? 'Connect & Start Auto-Copy'
                      : 'Save in Preview Mode'}
              </span>
            </button>

            {isConnected && existingSubscription && (
              <div className="grid grid-cols-2 gap-2">
                {existingSubscription.status === 'live' ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void handleQuickStatus('paused')}
                    className="h-10 rounded-xl border border-[var(--line)] bg-[var(--s2)]/50 hover:bg-[var(--s2)] text-xs font-bold text-[var(--tx)] cursor-pointer inline-flex items-center justify-center gap-1.5"
                  >
                    <PauseCircle className="size-3.5" />
                    <span>Pause Mirror</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void handleQuickStatus('live')}
                    className="h-10 rounded-xl border border-[#10B981]/40 bg-[#10B981]/10 hover:bg-[#10B981]/20 text-xs font-bold text-[#059669] dark:text-[#34D399] cursor-pointer inline-flex items-center justify-center gap-1.5"
                  >
                    <PlayCircle className="size-3.5" />
                    <span>Resume Live</span>
                  </button>
                )}

                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void handleQuickStatus('stopped')}
                  className="h-10 rounded-xl border border-[#F43F5E]/30 bg-[#F43F5E]/10 hover:bg-[#F43F5E]/15 text-xs font-bold text-[#E11D48] dark:text-[#FB7185] cursor-pointer inline-flex items-center justify-center gap-1.5"
                >
                  <StopCircle className="size-3.5" />
                  <span>Disconnect</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
