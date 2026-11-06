'use client';

/**
 * /app/staking — Interactive $OKN Staking Vault Demo.
 *
 * Allows users to select a lock duration (30/90/180/365 days), preview APY
 * rewards, create simulated $OKN stakes, and claim accrued demo yield.
 */
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  CalendarClock,
  CheckCircle2,
  Coins,
  Lock,
  Percent,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { PageHeader } from '@/components/dashboard/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { triggerConfetti } from '@/lib/confetti';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface LockTier {
  days: number;
  label: string;
  apy: number;
  multiplier: string;
}

const LOCK_TIERS: LockTier[] = [
  { days: 30, label: '30 Days', apy: 14, multiplier: '1.0x' },
  { days: 90, label: '90 Days', apy: 28, multiplier: '1.5x' },
  { days: 180, label: '180 Days', apy: 46, multiplier: '2.2x' },
  { days: 365, label: '365 Days', apy: 84, multiplier: '3.5x' },
];

interface DemoStake {
  id: string;
  amountOkn: number;
  days: number;
  apy: number;
  earnedOkn: number;
  status: 'Locked' | 'Claimable';
}

export default function StakingPage() {
  const t = useTranslations('dashboard.staking');
  const [selectedTier, setSelectedTier] = useState<LockTier>(LOCK_TIERS[1]);
  const [amountInput, setAmountInput] = useState('50000');
  const [stakes, setStakes] = useState<DemoStake[]>([
    {
      id: 'st-1',
      amountOkn: 150_000,
      days: 90,
      apy: 28,
      earnedOkn: 3_452,
      status: 'Claimable',
    },
    {
      id: 'st-2',
      amountOkn: 100_000,
      days: 180,
      apy: 46,
      earnedOkn: 1_890,
      status: 'Locked',
    },
  ]);

  const parsedAmount = Math.max(0, Number(amountInput) || 0);
  const estimatedReward = Math.round(
    parsedAmount * (selectedTier.apy / 100) * (selectedTier.days / 365),
  );

  const totalStaked = stakes.reduce((acc, s) => acc + s.amountOkn, 0);
  const totalEarned = stakes.reduce((acc, s) => acc + s.earnedOkn, 0);

  const handleStake = () => {
    if (parsedAmount < 1000) {
      toast.error('Minimum stake is 1,000 $OKN');
      return;
    }
    const newStake: DemoStake = {
      id: `st-${Date.now()}`,
      amountOkn: parsedAmount,
      days: selectedTier.days,
      apy: selectedTier.apy,
      earnedOkn: Math.max(250, Math.round(estimatedReward * 0.1)),
      status: 'Claimable',
    };
    setStakes((prev) => [newStake, ...prev]);
    triggerConfetti();
    toast.success(
      `Staked ${parsedAmount.toLocaleString()} $OKN for ${selectedTier.days} days at ${selectedTier.apy}% APY (Demo)`,
    );
  };

  const handleClaimYield = (stakeId: string) => {
    const target = stakes.find((s) => s.id === stakeId);
    if (!target || target.earnedOkn <= 0) return;
    setStakes((prev) =>
      prev.map((s) => (s.id === stakeId ? { ...s, earnedOkn: 0 } : s)),
    );
    triggerConfetti();
    toast.success(`Claimed ${target.earnedOkn.toLocaleString()} $OKN staking yield to Demo Wallet!`);
  };

  return (
    <main className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('description')}
        actions={
          <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-400">
            <Sparkles data-icon="inline-start" />
            Interactive Vault Demo
          </Badge>
        }
      />

      {/* Top Vault KPIs */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3.5 p-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#7A12F5]/15 text-[#7A12F5]">
              <Lock className="size-5" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Your Total Staked
              </p>
              <p className="font-mono text-xl font-extrabold tabular-nums">
                {totalStaked.toLocaleString()} $OKN
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3.5 p-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
              <Percent className="size-5" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Max Vault APY
              </p>
              <p className="font-mono text-xl font-extrabold text-emerald-400 tabular-nums">
                Up to 84% APY
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3.5 p-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-ios-blue/15 text-ios-blue">
              <Coins className="size-5" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Accrued Yield (Demo)
              </p>
              <p className="font-mono text-xl font-extrabold text-ios-blue tabular-nums">
                +{totalEarned.toLocaleString()} $OKN
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Stake Calculator & Action Card */}
        <Card className="lg:col-span-7">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span>Lock $OKN &amp; Earn Yield</span>
              <span className="text-xs font-medium text-muted-foreground">
                Available: 693,333 $OKN (Demo)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Lock Duration Tiers */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Select Lock Period
              </label>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {LOCK_TIERS.map((tier) => {
                  const active = selectedTier.days === tier.days;
                  return (
                    <button
                      key={tier.days}
                      type="button"
                      onClick={() => setSelectedTier(tier)}
                      className={cn(
                        'cursor-pointer rounded-2xl border p-3 text-left transition-all',
                        active
                          ? 'border-[#7A12F5] bg-[#7A12F5]/15 shadow-sm'
                          : 'border-border/60 bg-card hover:bg-muted/50',
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">{tier.label}</span>
                        <span className="rounded bg-[#7A12F5]/20 px-1.5 py-0.5 text-[10px] font-extrabold text-[#B77BFF]">
                          {tier.multiplier}
                        </span>
                      </div>
                      <p className="mt-1.5 font-mono text-lg font-extrabold text-emerald-400">
                        {tier.apy}% APY
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Stake Amount Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="stake-amount"
                  className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  Amount to Stake ($OKN)
                </label>
                <div className="flex gap-1.5">
                  {[25_000, 50_000, 100_000, 250_000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAmountInput(String(preset))}
                      className="cursor-pointer rounded-lg border border-border/60 bg-muted/50 px-2 py-0.5 text-[11px] font-bold hover:bg-muted"
                    >
                      {(preset / 1000).toFixed(0)}k
                    </button>
                  ))}
                </div>
              </div>
              <input
                id="stake-amount"
                type="number"
                min={1000}
                step={1000}
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                className="h-12 w-full rounded-xl border border-border/60 bg-muted/40 px-4 font-mono text-base font-bold outline-none focus:border-[#7A12F5]"
              />
            </div>

            {/* Summary Preview */}
            <div className="rounded-xl border border-border/60 bg-muted/30 p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Lock Duration</span>
                <span className="font-bold">{selectedTier.label} ({selectedTier.multiplier}Points Multiplier)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Annual Percentage Yield</span>
                <span className="font-mono font-bold text-emerald-400">{selectedTier.apy}% APY</span>
              </div>
              <div className="flex items-center justify-between border-t border-border/60 pt-2 text-sm">
                <span className="font-semibold">Estimated Maturity Yield</span>
                <span className="font-mono font-extrabold text-emerald-400">
                  +{estimatedReward.toLocaleString()} $OKN
                </span>
              </div>
            </div>

            <Button
              onClick={handleStake}
              className="h-11 w-full cursor-pointer rounded-xl bg-gradient-to-r from-[#7A12F5] to-[#09B4FF] text-sm font-extrabold text-white shadow-md hover:opacity-95"
            >
              <Lock className="mr-2 size-4" />
              Stake {parsedAmount.toLocaleString()} $OKN ({selectedTier.label} Demo)
            </Button>
          </CardContent>
        </Card>

        {/* Active Demo Stakes */}
        <Card className="lg:col-span-5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarClock className="size-4 text-ios-blue" />
              Active Staking Positions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stakes.map((s) => (
              <div
                key={s.id}
                className="rounded-xl border border-border/60 bg-muted/20 p-3.5 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-mono text-sm font-extrabold">
                      {s.amountOkn.toLocaleString()} $OKN
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {s.days} Days Lock · <span className="font-semibold text-emerald-400">{s.apy}% APY</span>
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400">
                    <TrendingUp className="size-3" />
                    +{s.earnedOkn.toLocaleString()} $OKN
                  </span>
                </div>

                <div className="flex items-center justify-between border-t border-border/50 pt-2">
                  <span className="text-[11px] text-muted-foreground">
                    Status: <strong className="text-foreground">{s.status}</strong>
                  </span>
                  {s.earnedOkn > 0 ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleClaimYield(s.id)}
                      className="h-7 cursor-pointer border-emerald-500/40 bg-emerald-500/10 px-2.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20"
                    >
                      Claim +{s.earnedOkn.toLocaleString()} $OKN
                    </Button>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400">
                      <CheckCircle2 className="size-3.5" />
                      Yield Claimed
                    </span>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
