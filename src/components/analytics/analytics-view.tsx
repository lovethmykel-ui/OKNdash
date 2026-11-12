'use client';

/**
 * Clean, Straightforward $OKN Ecosystem & Presale Analytics View.
 */
import { useState } from 'react';
import {
  Activity,
  ArrowUpRight,
  Coins,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import { Link } from '@/i18n/navigation';

type TimeRange = '7D' | '30D' | '90D' | 'ALL';

interface ChartSeries {
  totalRaised: string;
  growthPct: string;
  holdersCount: string;
  dailyVolume: string;
  bars: { label: string; value: number; amount: string }[];
}

const CHART_DATA: Record<TimeRange, ChartSeries> = {
  '7D': {
    totalRaised: '$412,800',
    growthPct: '+18.4%',
    holdersCount: '4,820',
    dailyVolume: '$48,200',
    bars: [
      { label: 'Mon', value: 45, amount: '$32K' },
      { label: 'Tue', value: 58, amount: '$41K' },
      { label: 'Wed', value: 52, amount: '$37K' },
      { label: 'Thu', value: 74, amount: '$53K' },
      { label: 'Fri', value: 82, amount: '$59K' },
      { label: 'Sat', value: 91, amount: '$65K' },
      { label: 'Sun', value: 100, amount: '$72K' },
    ],
  },
  '30D': {
    totalRaised: '$412,800',
    growthPct: '+64.2%',
    holdersCount: '4,820',
    dailyVolume: '$164,500',
    bars: [
      { label: 'W1', value: 38, amount: '$68K' },
      { label: 'W2', value: 56, amount: '$94K' },
      { label: 'W3', value: 78, amount: '$118K' },
      { label: 'W4', value: 100, amount: '$132K' },
    ],
  },
  '90D': {
    totalRaised: '$412,800',
    growthPct: '+142.0%',
    holdersCount: '4,820',
    dailyVolume: '$310,000',
    bars: [
      { label: 'Sep', value: 32, amount: '$89K' },
      { label: 'Oct', value: 68, amount: '$142K' },
      { label: 'Nov', value: 100, amount: '$181K' },
    ],
  },
  ALL: {
    totalRaised: '$412,800',
    growthPct: '+312.5%',
    holdersCount: '4,820',
    dailyVolume: '$412,800',
    bars: [
      { label: 'Seed', value: 28, amount: '$60K' },
      { label: 'Stage 1', value: 64, amount: '$150K' },
      { label: 'Stage 2', value: 100, amount: '$202K' },
    ],
  },
};

const ALLOCATION_BREAKDOWN = [
  { label: 'Presale & Community', pct: 45, color: '#7A12F5' },
  { label: 'Liquidity & Exchange Listing', pct: 25, color: '#00C2FF' },
  { label: 'Staking & Ecosystem Rewards', pct: 20, color: '#10B981' },
  { label: 'Team & Development', pct: 10, color: '#F59E0B' },
];

export function AnalyticsView() {
  const [range, setRange] = useState<TimeRange>('7D');
  const activeSeries = CHART_DATA[range];

  return (
    <main className="mx-auto max-w-4xl space-y-5 pb-12">
      {/* 1. Clean Header + Timeframe Filter */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-[24px] border border-[var(--line)] bg-[var(--s1)] p-5 sm:p-6 shadow-sm">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#7A12F5]/15 px-3 py-1 text-xs font-extrabold text-[var(--vio-l)]">
            <Activity className="size-3.5" />
            <span>Live Token Metrics</span>
          </span>
          <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--tx)]">
            $OKN Analytics
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-[var(--mut)]">
            Simple overview of presale growth, token price, and holder activity.
          </p>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto rounded-2xl border border-[var(--line)] bg-[var(--s2)] p-1.5">
          {(['7D', '30D', '90D', 'ALL'] as TimeRange[]).map((item) => {
            const active = range === item;
            return (
              <button
                key={item}
                type="button"
                onClick={() => setRange(item)}
                className={`h-8 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  active
                    ? 'bg-[#7A12F5] text-white shadow-xs'
                    : 'text-[var(--mut)] hover:text-[var(--tx)]'
                }`}
              >
                {item}
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. Straightforward 4-Card KPI Row */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-[22px] border border-[var(--line)] bg-[var(--s1)] p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-[var(--mut)]">
            <span>Total Raised</span>
            <Coins className="size-4 text-[var(--vio-l)]" />
          </div>
          <div className="num mt-2 text-xl sm:text-2xl font-extrabold text-[var(--tx)]">
            {activeSeries.totalRaised}
          </div>
          <div className="mt-1 inline-flex items-center gap-1 text-xs font-extrabold text-[var(--grn)]">
            <ArrowUpRight className="size-3.5" />
            <span>{activeSeries.growthPct}</span>
          </div>
        </div>

        <div className="rounded-[22px] border border-[var(--line)] bg-[var(--s1)] p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-[var(--mut)]">
            <span>Token Price</span>
            <TrendingUp className="size-4 text-[var(--grn)]" />
          </div>
          <div className="num mt-2 text-xl sm:text-2xl font-extrabold text-[var(--vio-l)]">
            $0.00060
          </div>
          <div className="mt-1 text-xs font-bold text-[var(--mut)]">
            Listing: <strong className="text-[var(--tx)] num">$0.0025</strong>
          </div>
        </div>

        <div className="rounded-[22px] border border-[var(--line)] bg-[var(--s1)] p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-[var(--mut)]">
            <span>Total Holders</span>
            <Users className="size-4 text-[#00C2FF]" />
          </div>
          <div className="num mt-2 text-xl sm:text-2xl font-extrabold text-[var(--tx)]">
            {activeSeries.holdersCount}
          </div>
          <div className="mt-1 text-xs font-bold text-[var(--grn)]">
            +142 today
          </div>
        </div>

        <div className="rounded-[22px] border border-[var(--line)] bg-[var(--s1)] p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-[var(--mut)]">
            <span>Volume ({range})</span>
            <Wallet className="size-4 text-[#F59E0B]" />
          </div>
          <div className="num mt-2 text-xl sm:text-2xl font-extrabold text-[var(--tx)]">
            {activeSeries.dailyVolume}
          </div>
          <div className="mt-1 text-xs font-bold text-[var(--mut)]">
            Stage 2 · 68.4% Sold
          </div>
        </div>
      </section>

      {/* 3. Clean Presale Volume Chart + Token Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
        {/* Bar Chart Card */}
        <section className="lg:col-span-7 rounded-[24px] border border-[var(--line)] bg-[var(--s1)] p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-[var(--tx)]">
                Presale Inflow ({range})
              </h2>
              <p className="text-xs text-[var(--mut)] mt-0.5">
                Verified token purchases across BNB &amp; USDT
              </p>
            </div>
            <span className="num rounded-xl bg-[#10B981]/15 px-3 py-1 text-xs font-extrabold text-[var(--grn)]">
              {activeSeries.growthPct}
            </span>
          </div>

          {/* Clean Visual Bar Chart */}
          <div className="flex h-48 items-end justify-between gap-2.5 sm:gap-4 pt-6 px-1">
            {activeSeries.bars.map((bar) => (
              <div
                key={bar.label}
                className="group flex flex-1 flex-col items-center gap-2 h-full justify-end"
              >
                <span className="num text-[11px] font-extrabold text-[var(--mut)] group-hover:text-[var(--tx)] transition-colors">
                  {bar.amount}
                </span>
                <div className="w-full max-w-[48px] rounded-t-2xl bg-[var(--s2)] p-1 flex items-end h-full">
                  <div
                    className="w-full rounded-xl bg-gradient-to-t from-[#7A12F5] via-[#9D4EDD] to-[#00C2FF] transition-all duration-300 group-hover:opacity-90"
                    style={{ height: `${bar.value}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-[var(--mut)]">
                  {bar.label}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Token Allocation Breakdown */}
        <section className="lg:col-span-5 rounded-[24px] border border-[var(--line)] bg-[var(--s1)] p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-5">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-[var(--tx)]">
              Token Allocation
            </h2>
            <p className="text-xs text-[var(--mut)] mt-0.5">
              1,000,000,000 $OKN Fixed Supply
            </p>
          </div>

          <div className="space-y-3.5">
            {ALLOCATION_BREAKDOWN.map((item) => (
              <div key={item.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-[var(--tx)]">{item.label}</span>
                  <span className="num font-extrabold text-[var(--tx)]">{item.pct}%</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-[var(--s2)] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${item.pct}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <Link
            href="/app/buy"
            className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#7A12F5] hover:bg-[#8C38F7] text-xs sm:text-sm font-extrabold text-white shadow-[0_6px_20px_rgba(122,18,245,0.3)] active:scale-[0.98] transition-all"
          >
            <span>Buy $OKN Presale</span>
            <ArrowUpRight className="size-4" />
          </Link>
        </section>
      </div>
    </main>
  );
}
