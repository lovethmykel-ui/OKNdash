'use client';

/**
 * polymarket-agent/agent-panel.tsx — Landing command overview of the Polymarket Agent.
 *
 * Designed as a clean, single-elevation Polymarket execution terminal:
 *   1. Command Hero + flush hairline-divided 4-column KPI strip
 *   2. 3-Step Workflow (hairline columns) + Default Copy Guardrails
 *   3. Live Polymarket Whale Signals with outcome cents pricing & YES/NO mirror controls
 */
import { useEffect, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Copy,
  Gauge,
  Landmark,
  ShieldCheck,
  SlidersHorizontal,
  Target,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { canEngageLiveCopy } from '@/lib/polymarket/leaderboard';
import type { AgentTab } from './tab-param';
import {
  fetchBalances,
  fetchSubscriptions,
  getInitialCopierSnapshot,
  useCopierStoreVersion,
  type CopierBalances,
  type CopierSubscription,
} from './copier-hooks';

interface EventPosition {
  id: string;
  title: string;
  category: string;
  volume: string;
  yesProbability: number;
  noProbability: number;
  conviction: number;
  defaultSide: 'YES' | 'NO';
}

const SAMPLE_EVENTS: EventPosition[] = [
  {
    id: 'ev-1',
    title: 'BTC above $105k before month close',
    category: 'Crypto · Macro',
    volume: '$4.2M Vol',
    yesProbability: 64,
    noProbability: 36,
    conviction: 78,
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
    defaultSide: 'YES',
  },
  {
    id: 'ev-5',
    title: 'US CPI YoY under 2.7% next print',
    category: 'Macro · Inflation',
    volume: '$2.9M Vol',
    yesProbability: 62,
    noProbability: 38,
    conviction: 74,
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
    defaultSide: 'NO',
  },
];

interface AgentPanelProps {
  onNavigateTab?: (tab: AgentTab) => void;
}

export function AgentPanel({ onNavigateTab }: AgentPanelProps) {
  const storeVersion = useCopierStoreVersion();
  const initial = getInitialCopierSnapshot();
  const [balances, setBalances] = useState<CopierBalances>(initial.balances);
  const [subscriptions, setSubscriptions] = useState<CopierSubscription[]>(initial.subscriptions);
  const [defaultCopyPct, setDefaultCopyPct] = useState<number>(15);
  const [maxPerTradeUsd, setMaxPerTradeUsd] = useState<number>(250);
  const [autoPauseLowBal, setAutoPauseLowBal] = useState<boolean>(true);
  const [mirrored, setMirrored] = useState<Record<string, 'YES' | 'NO'>>({
    'ev-3': 'YES',
    'ev-1': 'YES',
  });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [balRes, subRes] = await Promise.all([fetchBalances(), fetchSubscriptions()]);
      if (cancelled) return;
      if (balRes.ok && balRes.data) setBalances(balRes.data);
      if (subRes.ok && subRes.data) setSubscriptions(subRes.data);
    })();
    return () => {
      cancelled = true;
    };
  }, [storeVersion]);

  const usdcBalance = Number(balances.usdc) || 0;
  const polBalance = Number(balances.pol) || 0;
  const fundingStatus = canEngageLiveCopy(usdcBalance, polBalance);
  const activeSubs = subscriptions.filter((s) => s.status !== 'stopped');
  const liveSubs = subscriptions.filter((s) => s.status === 'live');

  const handleMirror = (event: EventPosition, side: 'YES' | 'NO') => {
    setMirrored((prev) => ({ ...prev, [event.id]: side }));
    toast.success(`Mirrored ${side} on "${event.title}" ($${Math.min(25, maxPerTradeUsd)} Agent Order)`);
  };

  return (
    <div className="space-y-6">
      {/* 1. Command Hero + Hairline-Divided 4-Column KPI Strip */}
      <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--s1)]">
        <div className="p-5 sm:p-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-[var(--tx)]">
                Polymarket Autonomous Copy Agent
              </h2>
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 text-xs font-bold',
                  fundingStatus.ready ? 'text-[#10B981]' : 'text-[#D97706] dark:text-[#FBBF24]',
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'size-1.5 rounded-full',
                    fundingStatus.ready ? 'bg-[#10B981]' : 'bg-[#F59E0B]',
                  )}
                />
                <span>
                  {fundingStatus.ready
                    ? liveSubs.length > 0
                      ? 'Funded & Live Copying'
                      : 'Funded · Ready to Copy'
                    : 'Funding Required Before Live Trade'}
                </span>
              </span>
            </div>
            <p className="max-w-2xl text-xs sm:text-sm text-[var(--mut)] leading-relaxed">
              Fund your dedicated Polygon agent wallet, select top traders from the Polymarket leaderboard, and mirror outcome positions inside strict per-trade caps.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => onNavigateTab?.('fund')}
              className="h-10 px-4 rounded-xl border border-[var(--line)] bg-[var(--s2)] text-xs sm:text-sm font-bold text-[var(--tx)] hover:bg-[var(--line)]/50 active:scale-[0.98] transition-all cursor-pointer inline-flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <Landmark className="size-4 text-[#2E5CFF]" />
              <span>Fund Agent</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab?.('copy')}
              className="h-10 px-4 rounded-xl bg-[#2E5CFF] text-white text-xs sm:text-sm font-extrabold shadow-xs hover:bg-[#1E4DF0] active:scale-[0.98] transition-all cursor-pointer inline-flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <Copy className="size-4" />
              <span>Copy Top Traders</span>
              <ArrowRight className="size-4" />
            </button>
          </div>
        </div>

        {/* Flush Hairline Metric Strip (Zero nested cards) */}
        <dl className="grid grid-cols-2 lg:grid-cols-4 border-t border-[var(--line)] bg-[var(--s2)]/40 divide-y lg:divide-y-0 lg:divide-x divide-[var(--line)]">
          <div className="px-5 py-4 border-r border-[var(--line)] lg:border-r-0">
            <dt className="text-[11px] font-semibold text-[var(--mut)]">Agent Balance</dt>
            <dd className="mt-1 font-mono text-lg sm:text-xl font-extrabold text-[var(--tx)] tabular-nums">
              ${usdcBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </dd>
          </div>
          <div className="px-5 py-4">
            <dt className="text-[11px] font-semibold text-[var(--mut)]">Copied Traders</dt>
            <dd className="mt-1 font-mono text-lg sm:text-xl font-extrabold text-[#2E5CFF] dark:text-[#60A5FA] tabular-nums">
              {liveSubs.length} Live · {activeSubs.length} Total
            </dd>
          </div>
          <div className="px-5 py-4 border-r border-[var(--line)] lg:border-r-0">
            <dt className="text-[11px] font-semibold text-[var(--mut)]">7-Day Copy ROI</dt>
            <dd className="mt-1 font-mono text-lg sm:text-xl font-extrabold text-[#10B981] tabular-nums">
              +38.4%
            </dd>
          </div>
          <div className="px-5 py-4">
            <dt className="text-[11px] font-semibold text-[var(--mut)]">Signal Win Rate</dt>
            <dd className="mt-1 font-mono text-lg sm:text-xl font-extrabold text-[var(--tx)] tabular-nums">
              76.4%
            </dd>
          </div>
        </dl>
      </section>

      {/* 2. 3-Step Workflow + Default Copy Guardrails */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <section className="lg:col-span-7 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--s1)] flex flex-col justify-between">
          <div className="p-5 sm:px-6 sm:pt-5 sm:pb-4 border-b border-[var(--line)]">
            <h3 className="text-sm sm:text-base font-extrabold text-[var(--tx)]">
              How the Copy Agent Works
            </h3>
            <p className="text-xs text-[var(--mut)] mt-0.5">
              Three steps from wallet funding to automated whale mirroring.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[var(--line)] flex-1">
            <button
              type="button"
              onClick={() => onNavigateTab?.('fund')}
              className="p-5 text-left hover:bg-[var(--s2)]/60 transition-colors cursor-pointer flex flex-col justify-between gap-3"
            >
              <div className="flex items-center justify-between text-xs font-mono font-bold text-[#2E5CFF]">
                <span>01.</span>
                <Wallet className="size-4" />
              </div>
              <div className="space-y-1">
                <div className="text-sm font-extrabold text-[var(--tx)]">Fund Agent Wallet</div>
                <p className="text-xs text-[var(--mut)] leading-relaxed">
                  Deposit USDC.e capital and POL gas on Polygon before live execution starts.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab?.('copy')}
              className="p-5 text-left hover:bg-[var(--s2)]/60 transition-colors cursor-pointer flex flex-col justify-between gap-3"
            >
              <div className="flex items-center justify-between text-xs font-mono font-bold text-[#7A12F5] dark:text-[#C084FC]">
                <span>02.</span>
                <Target className="size-4" />
              </div>
              <div className="space-y-1">
                <div className="text-sm font-extrabold text-[var(--tx)]">Pick Top Traders</div>
                <p className="text-xs text-[var(--mut)] leading-relaxed">
                  Mirror verified wallets directly from the Polymarket Leaderboard.
                </p>
              </div>
            </button>

            <div className="p-5 text-left flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between text-xs font-mono font-bold text-[#10B981]">
                <span>03.</span>
                <Gauge className="size-4" />
              </div>
              <div className="space-y-1">
                <div className="text-sm font-extrabold text-[var(--tx)]">Risk-Capped Sync</div>
                <p className="text-xs text-[var(--mut)] leading-relaxed">
                  Orders scale proportionally to your agent balance inside strict USD caps.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="lg:col-span-5 rounded-2xl border border-[var(--line)] bg-[var(--s1)] p-5 sm:p-6 flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="size-4 text-[#2E5CFF]" />
              <h3 className="text-sm sm:text-base font-extrabold text-[var(--tx)]">
                Default Copy Guardrails
              </h3>
            </div>
            <ShieldCheck className="size-4 text-[#10B981]" />
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-[var(--mut)] mb-2">
                <span>Proportional Copy Size</span>
                <span className="font-mono font-bold text-[var(--tx)] tabular-nums">{defaultCopyPct}%</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 rounded-xl bg-[var(--s2)] p-1 border border-[var(--line)]">
                {[5, 10, 15, 25].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => {
                      setDefaultCopyPct(pct);
                      toast.success(`Default copy size set to ${pct}%`);
                    }}
                    className={cn(
                      'h-8 rounded-lg text-xs font-extrabold transition-all cursor-pointer tabular-nums',
                      defaultCopyPct === pct
                        ? 'bg-[var(--s1)] text-[#2E5CFF] shadow-xs border border-[var(--line)]'
                        : 'text-[var(--mut)] hover:text-[var(--tx)]',
                    )}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-[var(--mut)] mb-2">
                <span>Max Order Cap (USD)</span>
                <span className="font-mono font-bold text-[var(--tx)] tabular-nums">${maxPerTradeUsd}</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 rounded-xl bg-[var(--s2)] p-1 border border-[var(--line)]">
                {[50, 100, 250, 500].map((cap) => (
                  <button
                    key={cap}
                    type="button"
                    onClick={() => {
                      setMaxPerTradeUsd(cap);
                      toast.success(`Max per-trade cap updated to $${cap}`);
                    }}
                    className={cn(
                      'h-8 rounded-lg text-xs font-extrabold transition-all cursor-pointer tabular-nums',
                      maxPerTradeUsd === cap
                        ? 'bg-[var(--s1)] text-[#2E5CFF] shadow-xs border border-[var(--line)]'
                        : 'text-[var(--mut)] hover:text-[var(--tx)]',
                    )}
                  >
                    ${cap}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <label className="flex items-center justify-between gap-3 border-t border-[var(--line)] pt-3.5 cursor-pointer">
            <span className="text-xs font-semibold text-[var(--tx)]">
              Auto-pause if balance &lt; $25
            </span>
            <input
              type="checkbox"
              checked={autoPauseLowBal}
              onChange={(e) => setAutoPauseLowBal(e.target.checked)}
              className="size-4 accent-[#2E5CFF] cursor-pointer"
            />
          </label>
        </section>
      </div>

      {/* 3. Live Polymarket Whale Event Signals */}
      <section aria-label="High-Conviction Whale Event Signals" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h3 className="text-base sm:text-lg font-extrabold tracking-tight text-[var(--tx)]">
              Live Polymarket Whale Signals
            </h3>
            <p className="text-xs text-[var(--mut)]">
              Real-time conviction flows tracked across leaderboard whale wallets.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab?.('copy')}
            className="text-xs font-extrabold text-[#2E5CFF] hover:underline cursor-pointer inline-flex items-center gap-1 whitespace-nowrap"
          >
            <span>Open Polymarket Leaderboard</span>
            <ArrowRight className="size-3.5" />
          </button>
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
  return (
    <article
      className={cn(
        'flex flex-col justify-between rounded-2xl border bg-[var(--s1)] p-5 transition-colors',
        activeSide ? 'border-[#2E5CFF]/45' : 'border-[var(--line)] hover:border-[var(--mut)]/45',
      )}
    >
      <div>
        <div className="flex items-center justify-between gap-2 text-[11px] text-[var(--mut)]">
          <span className="truncate">
            {event.category} · <span className="font-semibold text-[var(--tx)]">{event.volume}</span>
          </span>
          <span className="font-mono font-bold text-[#2E5CFF] tabular-nums shrink-0">
            {event.conviction}% edge
          </span>
        </div>

        <h4 className="mt-2 text-sm sm:text-[15px] font-extrabold leading-snug text-[var(--tx)] min-h-[2.6rem] text-balance">
          {event.title}
        </h4>

        {/* Polymarket Outcome Odds Meter + Cents Pricing */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs tabular-nums font-mono">
            <span className="font-extrabold text-[#10B981]">
              YES {event.yesProbability}¢
            </span>
            <span className="font-extrabold text-[#F43F5E]">
              NO {event.noProbability}¢
            </span>
          </div>
          <div className="flex h-2 w-full overflow-hidden rounded-full bg-[var(--s2)] gap-0.5">
            <div
              className="h-full rounded-l-full bg-[#10B981] transition-all"
              style={{ width: `${event.yesProbability}%` }}
            />
            <div
              className="h-full rounded-r-full bg-[#F43F5E] transition-all"
              style={{ width: `${event.noProbability}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3.5 border-t border-[var(--line)] grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onMirror('YES')}
          className={cn(
            'flex h-9 items-center justify-center gap-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer active:scale-[0.98]',
            activeSide === 'YES'
              ? 'bg-[#10B981] text-white'
              : 'bg-[#10B981]/10 text-[#10B981] hover:bg-[#10B981]/18',
          )}
        >
          {activeSide === 'YES' && <CheckCircle2 className="size-3.5 stroke-[2.5]" />}
          <span>{activeSide === 'YES' ? 'Mirrored YES' : 'Mirror YES'}</span>
        </button>

        <button
          type="button"
          onClick={() => onMirror('NO')}
          className={cn(
            'flex h-9 items-center justify-center gap-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer active:scale-[0.98]',
            activeSide === 'NO'
              ? 'bg-[#F43F5E] text-white'
              : 'bg-[#F43F5E]/10 text-[#F43F5E] hover:bg-[#F43F5E]/18',
          )}
        >
          {activeSide === 'NO' && <CheckCircle2 className="size-3.5 stroke-[2.5]" />}
          <span>{activeSide === 'NO' ? 'Mirrored NO' : 'Mirror NO'}</span>
        </button>
      </div>
    </article>
  );
}
