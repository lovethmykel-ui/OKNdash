'use client';

/**
 * /app/agents — OKN Autonomous Suite & Unified Agents Hub (Interactive Demo).
 *
 * Sums all agents and autonomous features in one seamless surface:
 *   1. Staking (Lock $OKN, earn APY)
 *   2. AI Trading Agent (24/7 market scanning co-pilot)
 *   3. Polymarket Copy Agent (Auto-mirror top 1% prediction whales)
 *   4. Prediction Markets (Decentralized outcome contracts)
 */
import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import {
  Lock,
  TrendingUp,
  BarChart3,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

const STAKING_PERIODS: { label: string; apy: string }[] = [
  { label: '30d', apy: '14% APY' },
  { label: '90d', apy: '28% APY' },
  { label: '180d', apy: '46% APY' },
  { label: '365d', apy: '84% APY' },
];

export default function AgentsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('90d');

  return (
    <main className="space-y-4 md:space-y-6 max-w-4xl mx-auto pb-12">
      {/* Hero Banner — Autonomous Protocol Suite */}
      <section className="relative overflow-hidden rounded-[28px] md:rounded-[32px] bg-gradient-to-br from-[#7A12F5] via-[#660CD9] to-[#4A00A8] p-6 md:p-8 text-white shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-extrabold backdrop-blur-md mb-3">
            <Sparkles className="size-3.5" />
            <span>Autonomous Protocol Suite · Coming Soon</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            OKN Autonomous Suite
          </h1>
          <p className="mt-2 text-sm md:text-base font-medium text-[#E4D3FF] leading-relaxed">
            Explore all four upcoming autonomous modules: mirror whale trades, copy AI crypto signals, trade outcome markets, or stake $OKN for yield.
          </p>
        </div>

        {/* Ambient background glow */}
        <div className="absolute -right-12 -bottom-12 size-64 rounded-full bg-cyan-400/20 blur-3xl pointer-events-none" />
      </section>

      {/* Feature Card 1: Staking */}
      <section className="rounded-[24px] bg-[var(--inv-bg)] text-[var(--inv-tx)] p-5 md:p-6 shadow-sm border border-[var(--line)]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--inv-tx)] text-[var(--inv-bg)] shadow-inner">
              <Lock className="size-5 stroke-[2.5]" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base md:text-lg font-extrabold text-[var(--inv-tx)] leading-tight">
                  $OKN Staking Vault
                </h2>
                <span className="inline-flex items-center rounded-full bg-[#7A12F5]/15 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#7A12F5]">
                  Coming Soon
                </span>
              </div>
              <p className="text-xs md:text-sm font-semibold text-[var(--inv-mut)] mt-0.5 truncate">
                Lock $OKN, earn up to 84% APY. Longer locks earn higher multipliers.
              </p>
            </div>
          </div>
          <Link
            href="/app/staking"
            className="shrink-0 inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-[#7A12F5] text-white text-xs font-extrabold shadow-sm hover:opacity-90 transition-opacity"
          >
            <span>Coming Soon</span>
            <ChevronRight className="size-3.5" />
          </Link>
        </div>

        {/* Duration Pills */}
        <div className="grid grid-cols-4 gap-2.5 mt-4 pt-3 border-t border-[var(--line)]/40">
          {STAKING_PERIODS.map((period) => (
            <button
              key={period.label}
              type="button"
              onClick={() => setSelectedPeriod(period.label)}
              className={`h-12 rounded-2xl text-xs font-extrabold transition-all cursor-pointer flex flex-col items-center justify-center ${
                selectedPeriod === period.label
                  ? 'bg-[#7A12F5] text-white shadow-[0_2px_10px_rgba(122,18,245,0.4)]'
                  : 'bg-[var(--inv-chip)] text-[var(--inv-tx)] hover:opacity-80'
              }`}
            >
              <span>{period.label}</span>
              <span className="text-[10px] opacity-80">{period.apy}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Feature Card 2: AI Trading Agent */}
      <section className="rounded-[24px] border border-[var(--line)] bg-[var(--s1)] p-5 md:p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#FFAA00]/20 text-[#FFAA00] shadow-sm">
              <TrendingUp className="size-5 stroke-[2.5]" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base md:text-lg font-extrabold text-[var(--tx)] leading-tight">
                  AI Trading Agent
                </h2>
                <span className="inline-flex items-center rounded-full border border-[#FFD60A]/40 bg-[#FFD60A]/15 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#FFD60A]">
                  Coming Soon
                </span>
              </div>
              <p className="text-xs md:text-sm font-semibold text-[var(--mut)] mt-0.5 truncate">
                Your AI co-pilot for automated Long / Short crypto signals
              </p>
            </div>
          </div>
          <Link
            href="/app/trade-bot"
            className="shrink-0 inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-[#FFAA00]/15 text-[#FFAA00] text-xs font-extrabold border border-[#FFAA00]/30 hover:bg-[#FFAA00]/25 transition-colors"
          >
            <span>Coming Soon</span>
            <ChevronRight className="size-3.5" />
          </Link>
        </div>
        <p className="text-xs md:text-sm font-semibold text-[var(--mut)] mt-3 leading-relaxed">
          24/7 market scanning, automated entry, target and stop levels, confidence scoring, and 1-click signal execution.
        </p>
      </section>

      {/* Feature Card 3: Polymarket Copy Agent */}
      <section className="rounded-[24px] border-2 border-[#1652F0]/60 bg-gradient-to-br from-[#1652F0]/15 via-[var(--s1)] to-[var(--s1)] p-5 md:p-6 shadow-[0_8px_24px_rgba(22,82,240,0.18)]">
        <div className="flex items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            <img
              src="/polymarket.png"
              alt="Polymarket"
              className="size-11 md:size-12 rounded-2xl object-cover shadow-[0_4px_12px_rgba(22,82,240,0.45)] border border-white/20 shrink-0"
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base md:text-lg font-extrabold text-[var(--tx)] leading-tight">
                  Polymarket Copy Agent
                </h2>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FFD60A]/15 text-[#FFD60A] border border-[#FFD60A]/40 text-[10px] font-extrabold uppercase tracking-wider">
                  <span className="size-1.5 rounded-full bg-[#FFD60A] animate-pulse" />
                  <span>Coming Soon</span>
                </span>
              </div>
              <p className="text-xs md:text-sm font-semibold text-[var(--mut)] mt-0.5 truncate">
                Automated whale prediction mirroring
              </p>
            </div>
          </div>
          <Link
            href="/app/polymarket-agent"
            className="shrink-0 inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-[#1652F0] text-white text-xs font-extrabold shadow-[0_4px_12px_rgba(22,82,240,0.4)] hover:bg-[#1E60FF] active:scale-95 transition-all"
          >
            <span>Coming Soon</span>
            <ChevronRight className="size-3.5" />
          </Link>
        </div>

        <p className="text-xs md:text-sm font-semibold text-[var(--mut)] mt-3 leading-relaxed">
          24/7 whale wallet tracking, probability edge scoring, and 1-click automated copy execution on Polymarket outcome shares.
        </p>

        <div className="grid grid-cols-3 gap-2.5 mt-4 pt-3.5 border-t border-[var(--line)]">
          <div className="rounded-xl bg-[var(--s2)]/70 border border-[var(--line)] px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--mut)]">7D Copy ROI</p>
            <p className="text-xs md:text-sm font-black text-[#34D399] mt-0.5">+38.4%</p>
          </div>
          <div className="rounded-xl bg-[var(--s2)]/70 border border-[var(--line)] px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--mut)]">Win Rate</p>
            <p className="text-xs md:text-sm font-black text-[#09B4FF] mt-0.5">78.4%</p>
          </div>
          <div className="rounded-xl bg-[var(--s2)]/70 border border-[var(--line)] px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--mut)]">Tracked</p>
            <p className="text-xs md:text-sm font-black text-[var(--tx)] mt-0.5">142 Whales</p>
          </div>
        </div>
      </section>

      {/* Feature Card 4: Prediction Markets */}
      <Link
        href="/app/prediction-markets"
        className="flex items-center justify-between gap-3 h-[76px] px-5 rounded-[24px] border border-[var(--line)] bg-[var(--s1)] shadow-sm hover:scale-[1.01] active:scale-98 transition-all group"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#E81CFF]/15 text-[#E81CFF] shadow-sm">
            <BarChart3 className="size-5 stroke-[2.5]" />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm md:text-base font-extrabold text-[var(--tx)] leading-tight group-hover:text-[#E81CFF] transition-colors">
              Prediction Markets
            </h2>
            <p className="text-xs font-semibold text-[var(--mut)] mt-0.5 truncate">
              Trade YES / NO outcome markets across decentralized protocols
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="px-3 py-1 rounded-full bg-[#FFD60A]/15 text-[#FFD60A] text-[10px] font-extrabold uppercase tracking-wider border border-[#FFD60A]/40">
            Coming Soon
          </span>
          <ChevronRight className="size-4 text-[var(--mut)]" />
        </div>
      </Link>
    </main>
  );
}
