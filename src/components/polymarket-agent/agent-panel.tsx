'use client';

/**
 * polymarket-agent/agent-panel.tsx — Minimalist Polymarket Copy Agent dashboard.
 * Data-first: compact KPI bar, inline execution guardrails, and high-conviction signals.
 */
import { useEffect, useState } from 'react';
import { ArrowRight, Check, Landmark } from 'lucide-react';
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
}

const MARKET_SIGNALS: EventPosition[] = [
  {
    id: 'ev-1',
    title: 'BTC above $105k before month close',
    category: 'Crypto',
    volume: '$4.2M',
    yesProbability: 64,
    noProbability: 36,
    conviction: 78,
  },
  {
    id: 'ev-2',
    title: 'ETH flippening market cap in 2026',
    category: 'Crypto',
    volume: '$1.8M',
    yesProbability: 22,
    noProbability: 78,
    conviction: 84,
  },
  {
    id: 'ev-3',
    title: 'Fed cuts rates by 25bps next FOMC',
    category: 'Economics',
    volume: '$9.6M',
    yesProbability: 71,
    noProbability: 29,
    conviction: 88,
  },
  {
    id: 'ev-4',
    title: 'Spot SOL ETF approved this year',
    category: 'Finance',
    volume: '$3.4M',
    yesProbability: 58,
    noProbability: 42,
    conviction: 69,
  },
  {
    id: 'ev-5',
    title: 'US CPI YoY under 2.7% next print',
    category: 'Economics',
    volume: '$2.9M',
    yesProbability: 62,
    noProbability: 38,
    conviction: 74,
  },
  {
    id: 'ev-6',
    title: 'US recession officially declared in 2026',
    category: 'Economics',
    volume: '$5.7M',
    yesProbability: 31,
    noProbability: 69,
    conviction: 76,
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
    toast.success(`Mirrored ${side} · ${event.title}`);
  };

  return (
    <div className="space-y-5">
      {/* 1. Compact Overview & Hairline-Divided 4-KPI Bar */}
      <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--s1)]">
        <div className="px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)]">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span
              className={cn(
                fundingStatus.ready ? 'text-[#059669] dark:text-[#10B981]' : 'text-[#D97706] dark:text-[#FBBF24]',
              )}
            >
              {fundingStatus.ready
                ? liveSubs.length > 0
                  ? 'Live Mirroring'
                  : 'Funded · Ready'
                : 'Funding Required'}
            </span>
            <span aria-hidden="true" className="text-[var(--mut)]">·</span>
            <span className="font-mono text-[var(--mut)] tabular-nums">
              {polBalance.toFixed(2)} POL gas
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onNavigateTab?.('fund')}
              className="h-9 px-3.5 rounded-lg border border-[var(--line)] bg-[var(--s2)] text-xs font-bold text-[var(--tx)] hover:bg-[var(--line)]/50 transition-colors cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              <Landmark className="size-3.5 text-[#10B981]" aria-hidden="true" />
              <span>Fund</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab?.('copy')}
              className="h-9 px-3.5 rounded-lg bg-[#7A12F5] hover:bg-[#690CD9] text-white text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              <span>Top 3 Leaders</span>
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>

        <dl className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[var(--line)]">
          <div className="bg-[var(--s1)] px-5 py-4">
            <dt className="text-[11px] font-medium text-[var(--mut)]">Balance</dt>
            <dd className="mt-1 font-mono text-xl font-extrabold text-[var(--tx)] tabular-nums">
              ${usdcBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </dd>
          </div>
          <div className="bg-[var(--s1)] px-5 py-4">
            <dt className="text-[11px] font-medium text-[var(--mut)]">Active Copies</dt>
            <dd className="mt-1 font-mono text-xl font-extrabold text-[var(--tx)] tabular-nums whitespace-nowrap">
              {liveSubs.length}{' '}
              <span className="text-xs font-semibold text-[var(--mut)]">
                / {activeSubs.length} linked
              </span>
            </dd>
          </div>
          <div className="bg-[var(--s1)] px-5 py-4">
            <dt className="text-[11px] font-medium text-[var(--mut)]">7D Copy ROI</dt>
            <dd className="mt-1 font-mono text-xl font-extrabold text-[#059669] dark:text-[#10B981] tabular-nums">
              +38.4%
            </dd>
          </div>
          <div className="bg-[var(--s1)] px-5 py-4">
            <dt className="text-[11px] font-medium text-[var(--mut)]">Signal Win Rate</dt>
            <dd className="mt-1 font-mono text-xl font-extrabold text-[var(--tx)] tabular-nums">
              76.4%
            </dd>
          </div>
        </dl>
      </section>

      {/* 2. Compact Inline Execution Guardrails */}
      <section
        aria-label="Copy guardrails"
        className="rounded-2xl border border-[var(--line)] bg-[var(--s1)] px-5 py-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-center"
      >
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-[var(--mut)]">Copy Size</span>
            <span className="font-mono font-bold text-[var(--tx)] tabular-nums">{defaultCopyPct}%</span>
          </div>
          <div className="grid grid-cols-4 gap-1 rounded-lg bg-[var(--s2)] p-1 border border-[var(--line)]">
            {[5, 10, 15, 25].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => {
                  setDefaultCopyPct(pct);
                  toast.success(`Copy size set to ${pct}%`);
                }}
                className={cn(
                  'h-7 rounded-md text-xs font-bold transition-colors cursor-pointer tabular-nums',
                  defaultCopyPct === pct
                    ? 'bg-[var(--s1)] text-[#7A12F5] dark:text-[#C084FC] shadow-xs'
                    : 'text-[var(--mut)] hover:text-[var(--tx)]',
                )}
              >
                {pct}%
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-[var(--mut)]">Max Order Cap</span>
            <span className="font-mono font-bold text-[var(--tx)] tabular-nums">${maxPerTradeUsd}</span>
          </div>
          <div className="grid grid-cols-4 gap-1 rounded-lg bg-[var(--s2)] p-1 border border-[var(--line)]">
            {[50, 100, 250, 500].map((cap) => (
              <button
                key={cap}
                type="button"
                onClick={() => {
                  setMaxPerTradeUsd(cap);
                  toast.success(`Max order cap set to $${cap}`);
                }}
                className={cn(
                  'h-7 rounded-md text-xs font-bold transition-colors cursor-pointer tabular-nums',
                  maxPerTradeUsd === cap
                    ? 'bg-[var(--s1)] text-[#7A12F5] dark:text-[#C084FC] shadow-xs'
                    : 'text-[var(--mut)] hover:text-[var(--tx)]',
                )}
              >
                ${cap}
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center justify-between gap-3 md:border-l md:border-[var(--line)] md:pl-4 py-1 cursor-pointer">
          <div>
            <p className="text-xs font-bold text-[var(--tx)]">Low-balance guard</p>
            <p className="text-[11px] text-[var(--mut)]">Pause below $25 USDC.e</p>
          </div>
          <input
            type="checkbox"
            checked={autoPauseLowBal}
            onChange={(e) => setAutoPauseLowBal(e.target.checked)}
            className="size-4 accent-[#7A12F5] cursor-pointer shrink-0"
          />
        </label>
      </section>

      {/* 3. Scannable Whale Market Signals Grid */}
      <section aria-label="Whale market signals" className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-extrabold tracking-tight text-[var(--tx)]">
            Whale Signals
          </h2>
          <button
            type="button"
            onClick={() => onNavigateTab?.('copy')}
            className="text-xs font-bold text-[#7A12F5] dark:text-[#C084FC] hover:underline cursor-pointer inline-flex items-center gap-1 whitespace-nowrap"
          >
            <span>Top 3 Leaderboard</span>
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {MARKET_SIGNALS.map((e) => (
            <SignalCard
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

function SignalCard({
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
        'flex flex-col justify-between rounded-2xl border bg-[var(--s1)] p-4 transition-colors',
        activeSide ? 'border-[#7A12F5]/40' : 'border-[var(--line)] hover:border-[var(--mut)]/40',
      )}
    >
      <div>
        <div className="flex items-center justify-between gap-2 text-[11px] text-[var(--mut)] tabular-nums">
          <span className="truncate">
            {event.category} · {event.volume}
          </span>
          <span className="font-mono font-bold text-[var(--tx)] shrink-0">
            {event.conviction}% edge
          </span>
        </div>

        <h3 className="mt-1.5 text-sm font-bold leading-snug text-[var(--tx)] min-h-[2.4rem] text-balance">
          {event.title}
        </h3>

        <div className="mt-3 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-mono tabular-nums">
            <span className="font-bold text-[#059669] dark:text-[#10B981]">
              YES {event.yesProbability}¢
            </span>
            <span className="font-bold text-[#E11D48] dark:text-[#F43F5E]">
              NO {event.noProbability}¢
            </span>
          </div>
          <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-[var(--s2)] gap-0.5">
            <div
              className="h-full rounded-l-full bg-[#10B981]"
              style={{ width: `${event.yesProbability}%` }}
            />
            <div
              className="h-full rounded-r-full bg-[#F43F5E]"
              style={{ width: `${event.noProbability}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-3.5 pt-3 border-t border-[var(--line)] grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onMirror('YES')}
          className={cn(
            'h-8 rounded-lg text-xs font-bold transition-colors cursor-pointer inline-flex items-center justify-center gap-1 whitespace-nowrap',
            activeSide === 'YES'
              ? 'bg-[#10B981] text-white'
              : 'bg-[#10B981]/10 text-[#059669] dark:text-[#34D399] hover:bg-[#10B981]/18',
          )}
        >
          {activeSide === 'YES' && <Check className="size-3 stroke-[2.75]" aria-hidden="true" />}
          <span>YES</span>
        </button>

        <button
          type="button"
          onClick={() => onMirror('NO')}
          className={cn(
            'h-8 rounded-lg text-xs font-bold transition-colors cursor-pointer inline-flex items-center justify-center gap-1 whitespace-nowrap',
            activeSide === 'NO'
              ? 'bg-[#F43F5E] text-white'
              : 'bg-[#F43F5E]/10 text-[#E11D48] dark:text-[#FB7185] hover:bg-[#F43F5E]/18',
          )}
        >
          {activeSide === 'NO' && <Check className="size-3 stroke-[2.75]" aria-hidden="true" />}
          <span>NO</span>
        </button>
      </div>
    </article>
  );
}
