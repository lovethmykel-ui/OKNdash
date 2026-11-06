'use client';

/**
 * polymarket-agent/agent-panel.tsx — Interactive Demo of the Polymarket Agent tab.
 *
 * Allows users to inspect whale event positions and 1-click mirror YES/NO positions
 * in Demo Mode with clear visual hierarchy across desktop and mobile.
 */
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Activity, CheckCircle2, Gauge, ShieldCheck, Sparkles, Target } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface EventPosition {
  id: string;
  title: string;
  category: string;
  volume: string;
  yesProbability: number;
  noProbability: number;
  conviction: number;
  size: 'S' | 'M' | 'L';
  defaultSide: 'YES' | 'NO';
}

const SAMPLE_EVENTS: EventPosition[] = [
  {
    id: 'ev-1',
    title: 'BTC above $100k before Q4 close',
    category: 'Crypto · Macro',
    volume: '$4.2M Vol',
    yesProbability: 64,
    noProbability: 36,
    conviction: 78,
    size: 'M',
    defaultSide: 'YES',
  },
  {
    id: 'ev-2',
    title: 'ETH flippening market cap in 2026',
    category: 'Crypto · Layer 1',
    volume: '$1.8M Vol',
    yesProbability: 22,
    noProbability: 78,
    conviction: 84,
    size: 'S',
    defaultSide: 'NO',
  },
  {
    id: 'ev-3',
    title: 'Fed cuts rates by 25bps in next FOMC meeting',
    category: 'Economics · Fed',
    volume: '$9.6M Vol',
    yesProbability: 71,
    noProbability: 29,
    conviction: 88,
    size: 'L',
    defaultSide: 'YES',
  },
  {
    id: 'ev-4',
    title: 'Spot SOL ETF approved this year',
    category: 'Regulation · SEC',
    volume: '$3.4M Vol',
    yesProbability: 58,
    noProbability: 42,
    conviction: 69,
    size: 'M',
    defaultSide: 'YES',
  },
  {
    id: 'ev-5',
    title: 'BNB reaches new all-time high this month',
    category: 'BNB Ecosystem',
    volume: '$2.1M Vol',
    yesProbability: 62,
    noProbability: 38,
    conviction: 74,
    size: 'M',
    defaultSide: 'YES',
  },
  {
    id: 'ev-6',
    title: 'US recession officially declared in 2026',
    category: 'Macro · GDP',
    volume: '$5.7M Vol',
    yesProbability: 31,
    noProbability: 69,
    conviction: 76,
    size: 'L',
    defaultSide: 'NO',
  },
];

const CAPABILITY_ICONS = [Activity, Target, Gauge, ShieldCheck];

export function AgentPanel() {
  const t = useTranslations('dashboard.polymarketAgent');
  const capabilities = t.raw('capabilities') as unknown as string[];
  const [mirrored, setMirrored] = useState<Record<string, 'YES' | 'NO'>>({
    'ev-3': 'YES',
    'ev-1': 'YES',
  });

  const handleMirror = (event: EventPosition, side: 'YES' | 'NO') => {
    setMirrored((prev) => ({ ...prev, [event.id]: side }));
    toast.success(`Mirrored ${side} on "${event.title}" ($25 Demo Copy)`);
  };

  return (
    <div className="space-y-6">
      {/* Level 1: Hero Overview Card with KPI Strip */}
      <div className="rounded-[24px] border border-[var(--line)] bg-[var(--s1)] p-5 md:p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4 min-w-0">
            <div className="flex size-12 md:size-14 shrink-0 items-center justify-center rounded-2xl border border-[var(--line)] bg-[var(--s2)] shadow-sm">
              <img src="/polymarket.png" alt="Polymarket" className="size-8 md:size-9 object-contain" />
            </div>
            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-base sm:text-lg md:text-xl font-extrabold tracking-tight text-[var(--tx)]">
                  Autonomous Whale Signal &amp; Copy Engine
                </h2>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-extrabold text-emerald-400">
                  <Sparkles className="size-3" />
                  <span>Live Demo</span>
                </span>
              </div>
              <p className="max-w-2xl text-xs sm:text-sm text-[var(--mut)] leading-relaxed">
                Monitors top 1% Polymarket whale wallets 24/7 and surfaces high-conviction event positions with probability edge scoring and 1-click copy execution.
              </p>
            </div>
          </div>

          {/* Capability chips in clean 2x2 grid on desktop */}
          <div className="grid grid-cols-2 gap-2 shrink-0">
            {capabilities.map((label, i) => {
              const Icon = CAPABILITY_ICONS[i] ?? Activity;
              return (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--s2)] px-3 py-1.5 text-[11px] font-bold text-[var(--tx)] whitespace-nowrap"
                >
                  <Icon className="size-3.5 text-[#09B4FF] shrink-0" />
                  <span>{label}</span>
                </span>
              );
            })}
          </div>
        </div>

        {/* 4-Column KPI Metric Strip */}
        <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-3 pt-4 border-t border-[var(--line)]">
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--s2)] px-4 py-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--mut)]">7-Day Whale ROI</div>
            <div className="num text-lg sm:text-xl font-extrabold text-[#2FBD8E] mt-0.5">+38.4%</div>
          </div>
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--s2)] px-4 py-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--mut)]">Signal Win Rate</div>
            <div className="num text-lg sm:text-xl font-extrabold text-[#09B4FF] mt-0.5">78.4%</div>
          </div>
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--s2)] px-4 py-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--mut)]">Tracked Whales</div>
            <div className="num text-lg sm:text-xl font-extrabold text-[var(--tx)] mt-0.5">142 Wallets</div>
          </div>
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--s2)] px-4 py-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--mut)]">Active Copies</div>
            <div className="num text-lg sm:text-xl font-extrabold text-[#C9A6FF] mt-0.5">
              {Object.keys(mirrored).length} Positions
            </div>
          </div>
        </div>
      </div>

      {/* Level 2: High-Conviction Event Positions Grid */}
      <section aria-label="High-Conviction Whale Event Signals" className="space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-base sm:text-lg font-extrabold tracking-tight text-[var(--tx)]">
              High-Conviction Whale Event Signals
            </h3>
            <p className="text-xs text-[var(--mut)]">
              Select YES or NO on any prediction market below to simulate an instant $25 whale copy order.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-extrabold text-emerald-400">
            <CheckCircle2 className="size-3.5" />
            {Object.keys(mirrored).length} active mirrored {Object.keys(mirrored).length === 1 ? 'position' : 'positions'}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SAMPLE_EVENTS.map((e) => (
            <EventCard
              key={e.id}
              event={e}
              activeSide={mirrored[e.id]}
              onMirror={(side) => handleMirror(e, side)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function EventCard({
  event,
  activeSide,
  onMirror,
}: {
  event: EventPosition;
  activeSide?: 'YES' | 'NO';
  onMirror: (side: 'YES' | 'NO') => void;
}) {
  const yesIsStronger = event.yesProbability >= event.noProbability;
  const sizeLabel =
    event.size === 'L' ? 'Large Whale Size' : event.size === 'M' ? 'Medium Size' : 'Standard Size';

  return (
    <div
      className={cn(
        'flex flex-col justify-between rounded-[22px] border bg-[var(--s1)] p-5 shadow-sm transition-all',
        activeSide
          ? 'border-[#7A12F5]/60 shadow-[0_4px_20px_rgba(122,18,245,0.14)]'
          : 'border-[var(--line)] hover:border-[var(--mut)]/40',
      )}
    >
      <div>
        {/* Tier 1: Category & Conviction Header */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--s2)] px-2.5 py-0.5 text-[10.5px] font-bold text-[var(--mut)]">
            <span>{event.category}</span>
            <span>·</span>
            <span className="text-[var(--tx)]">{event.volume}</span>
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#09B4FF]/15 border border-[#09B4FF]/30 px-2.5 py-0.5 text-[10.5px] font-extrabold text-[#09B4FF]">
            <Activity className="size-3" />
            {event.conviction}% edge
          </span>
        </div>

        {/* Tier 2: Market Question Headline */}
        <h4 className="text-sm sm:text-base font-extrabold leading-snug text-[var(--tx)] min-h-[2.5rem]">
          {event.title}
        </h4>

        {/* Tier 3: Visual Probability Bar + Split YES/NO Boxes */}
        <div className="mt-3.5 space-y-2.5">
          <div className="flex h-2 w-full overflow-hidden rounded-full bg-[var(--s2)] p-0.5 gap-0.5">
            <div
              className="h-full rounded-l-full bg-[#2FBD8E] transition-all"
              style={{ width: `${event.yesProbability}%` }}
            />
            <div
              className="h-full rounded-r-full bg-[#F43F5E] transition-all"
              style={{ width: `${event.noProbability}%` }}
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div
              className={cn(
                'flex items-center justify-between rounded-xl border px-3 py-2',
                yesIsStronger
                  ? 'border-[#2FBD8E]/35 bg-[#2FBD8E]/10'
                  : 'border-[var(--line)] bg-[var(--s2)]',
              )}
            >
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#2FBD8E]">YES</span>
              <span className="num text-sm font-extrabold text-[var(--tx)]">{event.yesProbability}%</span>
            </div>
            <div
              className={cn(
                'flex items-center justify-between rounded-xl border px-3 py-2',
                !yesIsStronger
                  ? 'border-[#F43F5E]/35 bg-[#F43F5E]/10'
                  : 'border-[var(--line)] bg-[var(--s2)]',
              )}
            >
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#F43F5E]">NO</span>
              <span className="num text-sm font-extrabold text-[var(--tx)]">{event.noProbability}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tier 4: Whale Signal Meta + Full-Width Action Buttons */}
      <div className="mt-4 pt-3.5 border-t border-[var(--line)] space-y-2.5">
        <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--mut)]">
          <span>Whale Consensus: <strong className={yesIsStronger ? 'text-[#2FBD8E]' : 'text-[#F43F5E]'}>{event.defaultSide}</strong></span>
          <span>{sizeLabel}</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onMirror('YES')}
            className={cn(
              'flex h-9 items-center justify-center gap-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer active:scale-95',
              activeSide === 'YES'
                ? 'bg-[#2FBD8E] text-black shadow-[0_2px_10px_rgba(47,189,142,0.4)]'
                : 'border border-[#2FBD8E]/40 bg-[#2FBD8E]/12 text-[#2FBD8E] hover:bg-[#2FBD8E]/20',
            )}
          >
            {activeSide === 'YES' && <CheckCircle2 className="size-3.5 stroke-[2.5]" />}
            <span>{activeSide === 'YES' ? 'Mirrored YES' : 'Mirror YES'}</span>
          </button>

          <button
            type="button"
            onClick={() => onMirror('NO')}
            className={cn(
              'flex h-9 items-center justify-center gap-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer active:scale-95',
              activeSide === 'NO'
                ? 'bg-[#F43F5E] text-white shadow-[0_2px_10px_rgba(244,63,94,0.4)]'
                : 'border border-[#F43F5E]/40 bg-[#F43F5E]/12 text-[#F43F5E] hover:bg-[#F43F5E]/20',
            )}
          >
            {activeSide === 'NO' && <CheckCircle2 className="size-3.5 stroke-[2.5]" />}
            <span>{activeSide === 'NO' ? 'Mirrored NO' : 'Mirror NO'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
