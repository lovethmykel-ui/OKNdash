'use client';

/**
 * polymarket-agent/risk-disclosure.tsx — Prominent educational risk disclosure
 * banner rendered at the bottom of the Polymarket Copy Agent page to warn
 * users of the volatility associated with automated whale mirroring.
 */
import { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const RISK_POINTS = [
  {
    title: 'Whale Mirroring Volatility',
    body: 'Prediction markets can swing sharply on breaking news and resolve to $0.00. High-conviction whale positions carry extreme binary volatility and past PnL never guarantees future returns.',
  },
  {
    title: 'Execution Lag & Slippage',
    body: 'Whale wallets often enter large blocks before liquidity reprices. Automated mirror orders may fill at worse odds due to thin orderbooks, spreads, and Polygon confirmation latency.',
  },
  {
    title: 'Sizing & Custody Controls',
    body: 'You are solely responsible for funded USDC.e/POL balances, proportional copy percentages, and per-trade USD caps. Never allocate capital to automated whale mirroring you cannot afford to lose.',
  },
] as const;

export function RiskDisclosure() {
  const [minimized, setMinimized] = useState(false);

  return (
    <section
      role="region"
      aria-label="Automated whale mirroring risk disclosure"
      className={cn(
        'overflow-hidden rounded-2xl border border-[#F59E0B]/40 bg-[#F59E0B]/[0.07] transition-all',
      )}
    >
      <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-6 sm:py-5">
        <div className="flex items-start gap-3.5 min-w-0">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#F59E0B]/20 text-[#D97706] dark:text-[#FBBF24] mt-0.5">
            <AlertTriangle className="size-4.5" />
          </span>
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <h2 className="text-sm sm:text-base font-extrabold tracking-tight text-[var(--tx)]">
                Risk Disclosure: Automated Whale Mirroring Volatility
              </h2>
              <span className="text-[11px] font-bold text-[#B45309] dark:text-[#FBBF24]">
                · High-risk automated execution
              </span>
            </div>
            <p className="text-xs sm:text-[13px] text-[var(--mut)] leading-relaxed max-w-4xl">
              Automated whale mirroring exposes your Polymarket Copy Agent wallet to rapid price swings, binary event resolution losses, and orderbook slippage on Polygon. Nothing on this page is financial advice.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setMinimized((v) => !v)}
          aria-expanded={!minimized}
          className="self-start shrink-0 inline-flex items-center gap-1.5 rounded-xl border border-[#F59E0B]/35 bg-[var(--s1)]/90 px-3 py-1.5 text-xs font-bold text-[var(--tx)] hover:bg-[var(--s1)] transition-colors cursor-pointer whitespace-nowrap"
        >
          <span>{minimized ? 'Show Risk Details' : 'Hide Details'}</span>
          {minimized ? <ChevronDown className="size-3.5" /> : <ChevronUp className="size-3.5" />}
        </button>
      </div>

      {!minimized && (
        <div className="grid grid-cols-1 md:grid-cols-3 border-t border-[#F59E0B]/25 bg-[var(--s1)]/65 divide-y md:divide-y-0 md:divide-x divide-[#F59E0B]/20">
          {RISK_POINTS.map((point) => (
            <div key={point.title} className="px-4 py-3.5 sm:px-6 sm:py-4 space-y-1">
              <h3 className="text-xs font-extrabold text-[var(--tx)]">{point.title}</h3>
              <p className="text-[11.5px] text-[var(--mut)] leading-relaxed">{point.body}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
