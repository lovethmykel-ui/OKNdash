'use client';

/**
 * Minimalist collapsible risk notice bar — stays as a quiet single-line footer
 * by default so the dashboard remains focused on metrics and execution.
 */
import { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

const RISK_ITEMS = [
  {
    title: 'Binary Volatility',
    body: 'Prediction markets can resolve to $0.00 rapidly. Historical PnL does not guarantee future results.',
  },
  {
    title: 'Slippage & Latency',
    body: 'Mirror orders execute after whale fills and may experience spread or Polygon confirmation lag.',
  },
  {
    title: 'Self-Directed Caps',
    body: 'You control funding balances, copy ratios, and per-trade USD limits at all times.',
  },
] as const;

export function RiskDisclosure() {
  const [expanded, setExpanded] = useState(false);

  return (
    <section
      role="region"
      aria-label="Risk notice"
      className="rounded-xl border border-[var(--line)] bg-[var(--s1)]/70"
    >
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
        className="w-full px-4 py-2.5 flex items-center justify-between gap-3 text-left cursor-pointer hover:bg-[var(--s2)]/50 transition-colors rounded-xl"
      >
        <span className="flex items-center gap-2 min-w-0 text-xs text-[var(--mut)]">
          <AlertTriangle
            className="size-3.5 shrink-0 text-[#D97706] dark:text-[#FBBF24]"
            aria-hidden="true"
          />
          <span className="truncate">
            High-risk automated execution · Past returns do not guarantee future performance.
          </span>
        </span>
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--mut)] shrink-0">
          <span>{expanded ? 'Hide' : 'Risk notice'}</span>
          {expanded ? (
            <ChevronUp className="size-3.5" aria-hidden="true" />
          ) : (
            <ChevronDown className="size-3.5" aria-hidden="true" />
          )}
        </span>
      </button>

      {expanded && (
        <div className="grid grid-cols-1 md:grid-cols-3 border-t border-[var(--line)] divide-y md:divide-y-0 md:divide-x divide-[var(--line)]">
          {RISK_ITEMS.map((item) => (
            <div key={item.title} className="px-4 py-3 space-y-1">
              <p className="text-xs font-bold text-[var(--tx)]">{item.title}</p>
              <p className="text-[11px] text-[var(--mut)] leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
