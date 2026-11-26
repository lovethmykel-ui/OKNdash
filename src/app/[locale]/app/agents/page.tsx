'use client';

/**
 * /app/agents — Unified OKN Agents & Yield Hub.
 *
 * Clean, single-elevation dashboard layout with clear visual hierarchy:
 *   1. Featured Live Anchor: Polymarket Copy Agent (Top-3 All-Time whale mirroring)
 *   2. Balanced 2-Column Module Grid: AI Trading Agent & Prediction Markets
 *   3. Interactive Yield Module: $OKN Staking Vault with selectable lock terms
 */
import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import {
  ArrowUpRight,
  BarChart3,
  Lock,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StakingTier {
  id: string;
  term: string;
  apy: string;
  multiplier: string;
}

const STAKING_TIERS: readonly StakingTier[] = [
  { id: '30d', term: '30 Days', apy: '14% APY', multiplier: '1.0x' },
  { id: '90d', term: '90 Days', apy: '28% APY', multiplier: '1.5x' },
  { id: '180d', term: '180 Days', apy: '46% APY', multiplier: '2.2x' },
  { id: '365d', term: '365 Days', apy: '84% APY', multiplier: '3.5x' },
];

export default function AgentsPage() {
  const [selectedTierId, setSelectedTierId] = useState<string>('90d');
  const activeTier =
    STAKING_TIERS.find((tier) => tier.id === selectedTierId) ?? STAKING_TIERS[1];

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-10">
      {/* Compact Page Header */}
      <header className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--tx)]">
          OKN Agents
        </h1>
        <p className="text-sm text-[var(--mut)] max-w-2xl">
          Automated trade mirroring, market intelligence, and $OKN yield modules in one place.
        </p>
      </header>

      {/* 1. Primary Focal Module — Polymarket Copy Agent */}
      <article
        aria-labelledby="polymarket-agent-heading"
        className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--s1)]"
      >
        <div
          aria-hidden="true"
          className="h-[2px] w-full bg-gradient-to-r from-[#1652F0] via-[#7A12F5] to-transparent"
        />

        <div className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--s2)] p-1.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/polymarket.png"
                  alt="Polymarket"
                  referrerPolicy="no-referrer"
                  className="size-full rounded-lg object-contain"
                />
              </div>

              <div className="min-w-0">
                <h2
                  id="polymarket-agent-heading"
                  className="text-base sm:text-lg font-extrabold tracking-tight text-[var(--tx)]"
                >
                  Polymarket Copy Agent
                </h2>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs font-medium text-[var(--mut)]">
                  <span className="font-semibold text-[#059669] dark:text-[#10B981]">
                    Active
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>Top-3 All-Time Whales</span>
                  <span aria-hidden="true">·</span>
                  <span>Polygon</span>
                </p>
              </div>
            </div>

            <Link
              href="/app/polymarket-agent"
              className="inline-flex h-10 w-full sm:w-auto shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#7A12F5] px-4 text-xs font-bold text-white transition-colors hover:bg-[#8C38F7] whitespace-nowrap"
            >
              <span>Open Agent</span>
              <ArrowUpRight className="size-4 shrink-0" aria-hidden="true" />
            </Link>
          </div>

          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[var(--mut)]">
            Automatically mirror positions from the top 3 Polymarket leaderboard leaders per category with configurable USDC caps and execution logs.
          </p>

          {/* Unboxed Hairline-Divided Telemetry Strip */}
          <dl className="mt-5 grid grid-cols-3 gap-4 border-t border-[var(--line)] pt-4">
            <div>
              <dt className="text-[11px] font-medium text-[var(--mut)]">7D Copy ROI</dt>
              <dd className="mt-1 font-mono text-sm sm:text-base font-extrabold text-[#059669] dark:text-[#10B981] tabular-nums">
                +38.4%
              </dd>
            </div>
            <div>
              <dt className="text-[11px] font-medium text-[var(--mut)]">Win Rate</dt>
              <dd className="mt-1 font-mono text-sm sm:text-base font-extrabold text-[var(--tx)] tabular-nums">
                78.4%
              </dd>
            </div>
            <div>
              <dt className="text-[11px] font-medium text-[var(--mut)]">Scope</dt>
              <dd className="mt-1 font-mono text-sm sm:text-base font-extrabold text-[var(--tx)] tabular-nums">
                Top 3
              </dd>
            </div>
          </dl>
        </div>
      </article>

      {/* 2. Secondary Protocol Modules — Uniform 2-Column Grid */}
      <div role="region" aria-labelledby="agents-trading-heading" className="space-y-3">
        <h2
          id="agents-trading-heading"
          className="text-xs font-semibold tracking-wide text-[var(--mut)]"
        >
          Trading &amp; Markets
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 items-stretch">
          {/* AI Trading Agent */}
          <article className="flex flex-col justify-between rounded-2xl border border-[var(--line)] bg-[var(--s1)] p-5 sm:p-6">
            <div>
              <div className="flex items-center gap-3.5">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#F59E0B]/12 text-[#D97706] dark:text-[#FBBF24]">
                  <TrendingUp className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h3 className="text-base font-extrabold tracking-tight text-[var(--tx)]">
                    AI Trading Agent
                  </h3>
                  <p className="mt-0.5 text-xs font-medium text-[var(--mut)]">
                    Crypto Signals · Preview
                  </p>
                </div>
              </div>

              <p className="mt-3.5 text-sm leading-relaxed text-[var(--mut)]">
                24/7 market scanning with automated entry, target, and stop levels alongside confidence scoring.
              </p>
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-[var(--line)] pt-3.5">
              <span className="text-xs font-medium text-[var(--mut)]">
                Long &amp; Short Co-Pilot
              </span>
              <Link
                href="/app/trade-bot"
                className="inline-flex h-9 items-center gap-1 rounded-lg px-2.5 text-xs font-bold text-[#7A12F5] dark:text-[#C084FC] transition-colors hover:bg-[#7A12F5]/10 whitespace-nowrap shrink-0"
              >
                <span>Open Preview</span>
                <ArrowUpRight className="size-3.5 shrink-0" aria-hidden="true" />
              </Link>
            </div>
          </article>

          {/* Prediction Markets */}
          <article className="flex flex-col justify-between rounded-2xl border border-[var(--line)] bg-[var(--s1)] p-5 sm:p-6">
            <div>
              <div className="flex items-center gap-3.5">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#7A12F5]/12 text-[#7A12F5] dark:text-[#C084FC]">
                  <BarChart3 className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h3 className="text-base font-extrabold tracking-tight text-[var(--tx)]">
                    Prediction Markets
                  </h3>
                  <p className="mt-0.5 text-xs font-medium text-[var(--mut)]">
                    Outcome Contracts · Preview
                  </p>
                </div>
              </div>

              <p className="mt-3.5 text-sm leading-relaxed text-[var(--mut)]">
                Trade YES / NO event outcome shares across decentralized prediction protocols with on-chain settlement.
              </p>
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-[var(--line)] pt-3.5">
              <span className="text-xs font-medium text-[var(--mut)]">
                Binary Event Shares
              </span>
              <Link
                href="/app/prediction-markets"
                className="inline-flex h-9 items-center gap-1 rounded-lg px-2.5 text-xs font-bold text-[#7A12F5] dark:text-[#C084FC] transition-colors hover:bg-[#7A12F5]/10 whitespace-nowrap shrink-0"
              >
                <span>Open Preview</span>
                <ArrowUpRight className="size-3.5 shrink-0" aria-hidden="true" />
              </Link>
            </div>
          </article>
        </div>
      </div>

      {/* 3. Yield Vault — $OKN Staking */}
      <div role="region" aria-labelledby="agents-yield-heading" className="space-y-3">
        <h2
          id="agents-yield-heading"
          className="text-xs font-semibold tracking-wide text-[var(--mut)]"
        >
          Protocol Yield
        </h2>

        <article className="rounded-2xl border border-[var(--line)] bg-[var(--s1)] p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3.5 min-w-0">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--s2)] text-[var(--tx)] border border-[var(--line)]">
                <Lock className="size-4.5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h3 className="text-base font-extrabold tracking-tight text-[var(--tx)]">
                  $OKN Staking Vault
                </h3>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs font-medium text-[var(--mut)]">
                  <span>Selected: {activeTier.term}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono font-bold text-[#7A12F5] dark:text-[#C084FC] tabular-nums">
                    {activeTier.apy} ({activeTier.multiplier})
                  </span>
                </p>
              </div>
            </div>

            <Link
              href="/app/staking"
              className="inline-flex h-10 w-full sm:w-auto shrink-0 items-center justify-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--s2)] px-4 text-xs font-bold text-[var(--tx)] transition-colors hover:border-[#7A12F5]/50 hover:text-[#7A12F5] dark:hover:text-[#C084FC] whitespace-nowrap"
            >
              <span>Explore Vault</span>
              <ArrowUpRight className="size-4 shrink-0" aria-hidden="true" />
            </Link>
          </div>

          <p className="mt-3.5 text-sm leading-relaxed text-[var(--mut)]">
            Lock $OKN for fixed durations to earn boosted APY multipliers. Choose a lock window below to preview returns.
          </p>

          {/* Interactive Lock Term Segmented Selector */}
          <div
            role="group"
            aria-label="Staking lock duration"
            className="mt-4 grid grid-cols-2 gap-2 border-t border-[var(--line)] pt-4 sm:grid-cols-4"
          >
            {STAKING_TIERS.map((tier) => {
              const isSelected = tier.id === selectedTierId;
              return (
                <button
                  key={tier.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setSelectedTierId(tier.id)}
                  className={cn(
                    'flex min-h-[52px] flex-col items-center justify-center rounded-xl border px-3 py-2 text-center transition-colors cursor-pointer',
                    isSelected
                      ? 'border-[#7A12F5] bg-[#7A12F5] text-white'
                      : 'border-[var(--line)] bg-[var(--s2)] text-[var(--tx)] hover:border-[#7A12F5]/40',
                  )}
                >
                  <span className="text-xs font-extrabold whitespace-nowrap">
                    {tier.id}
                  </span>
                  <span
                    className={cn(
                      'mt-0.5 font-mono text-[11px] font-semibold tabular-nums whitespace-nowrap',
                      isSelected ? 'text-white/90' : 'text-[var(--mut)]',
                    )}
                  >
                    {tier.apy}
                  </span>
                </button>
              );
            })}
          </div>
        </article>
      </div>
    </div>
  );
}
