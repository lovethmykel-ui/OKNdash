'use client';

import { useEffect, useState } from 'react';
import {
  INITIAL_COUNTDOWN_SNAPSHOT,
  STAGE_1_END_MS,
  computePresaleCountdown,
  formatCountdownUnit,
  type PresaleCountdownSnapshot,
} from '@/lib/presale-countdown';
import { useHydrated } from '@/lib/hooks/use-hydrated';
import { cn } from '@/lib/utils';

interface StageCountdownBarProps {
  /**
   * 'hero-dark' — translucent white hairline bar for deep purple hero cards (Mobile Home).
   * 'surface'   — architectural neutral hairline bar for surface hero cards (Desktop Home & Buy).
   */
  variant: 'hero-dark' | 'surface';
  className?: string;
}

export function StageCountdownBar({ variant, className }: StageCountdownBarProps) {
  const hydrated = useHydrated();
  const [snapshot, setSnapshot] = useState<PresaleCountdownSnapshot>(INITIAL_COUNTDOWN_SNAPSHOT);

  useEffect(() => {
    if (!hydrated) return;
    const sync = () => setSnapshot(computePresaleCountdown(Date.now(), STAGE_1_END_MS));
    sync();
    const id = window.setInterval(sync, 1000);
    return () => window.clearInterval(id);
  }, [hydrated]);

  const isDarkHero = variant === 'hero-dark';

  const segments = [
    { value: formatCountdownUnit(snapshot.days), unit: 'd' },
    { value: formatCountdownUnit(snapshot.hours), unit: 'h' },
    { value: formatCountdownUnit(snapshot.minutes), unit: 'm' },
    { value: formatCountdownUnit(snapshot.seconds), unit: 's' },
  ];

  return (
    <div
      data-testid="stage-1-countdown"
      className={cn(
        'relative z-10 flex items-center justify-between gap-3 border-b pb-3',
        isDarkHero
          ? 'border-white/15 mb-3.5 text-white'
          : 'border-[var(--line)] mb-4 sm:mb-5 text-[var(--tx)]',
        className,
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span
          className={cn(
            'text-[10.5px] sm:text-[11px] font-bold uppercase tracking-[0.13em] whitespace-nowrap',
            isDarkHero ? 'text-white/90' : 'text-[var(--tx)]',
          )}
        >
          Stage 1 Presale
        </span>
        <span
          aria-hidden="true"
          className={cn(
            'hidden sm:inline text-[10px] select-none',
            isDarkHero ? 'text-white/35' : 'text-[var(--mut)]/50',
          )}
        >
          /
        </span>
        <span
          className={cn(
            'hidden sm:inline text-[11px] font-medium tracking-wide whitespace-nowrap',
            isDarkHero ? 'text-white/65' : 'text-[var(--mut)]',
          )}
        >
          {snapshot.expired ? 'Closed' : 'Ends in'}
        </span>
      </div>

      <div
        role="timer"
        aria-label={`Stage 1 presale ends in ${snapshot.days} days, ${snapshot.hours} hours, ${snapshot.minutes} minutes, ${snapshot.seconds} seconds`}
        className="flex items-baseline gap-0.5 font-mono tabular-nums shrink-0"
      >
        {segments.map((seg, idx) => (
          <span key={seg.unit} className="inline-flex items-baseline">
            <span
              className={cn(
                'text-[13px] sm:text-sm font-bold tracking-tight',
                isDarkHero ? 'text-white' : 'text-[var(--tx)]',
              )}
            >
              {seg.value}
            </span>
            <span
              className={cn(
                'text-[10px] sm:text-[11px] font-medium ml-[1px]',
                isDarkHero ? 'text-white/55' : 'text-[var(--mut)]',
              )}
            >
              {seg.unit}
            </span>
            {idx < segments.length - 1 ? (
              <span
                aria-hidden="true"
                className={cn(
                  'mx-1 text-[11px] font-normal select-none',
                  isDarkHero ? 'text-white/30' : 'text-[var(--mut)]/45',
                )}
              >
                :
              </span>
            ) : null}
          </span>
        ))}
      </div>
    </div>
  );
}
