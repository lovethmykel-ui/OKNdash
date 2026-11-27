'use client';

import { useState, useEffect } from 'react';
import { Link } from '@/i18n/navigation';
import { Flame, Users, ChevronRight, Share2 } from 'lucide-react';
import { useClaimEligibility } from '@/lib/hooks/use-claim';
import { useStreak } from '@/lib/hooks/use-rewards';
import { useHydrated } from '@/lib/hooks/use-hydrated';
import { OknWatermark } from '@/components/ui/okn-watermark';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { EyeToggleIcon, MaskedBalance } from '@/components/ui/masked-balance';
import { openShareCard } from '@/components/share/share-card-modal';

/**
 * MobilePortfolioHero — Card 1 on mobile portfolio.
 * Positioned at the very top of the mobile screen above the segmented switcher.
 */
export function MobilePortfolioHero() {
  const hydrated = useHydrated();
  const eligibility = useClaimEligibility();
  const streak = useStreak();

  const [hideBalanceState, setHideBalanceState] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    try {
      const stored = localStorage.getItem('okn_hide_balance') === 'true';
      setHideBalanceState(stored);
    } catch {}
  }, [hydrated]);

  const hideBalance = hydrated && hideBalanceState;

  const toggleBalance = () => {
    setHideBalanceState((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('okn_hide_balance', next ? 'true' : 'false');
      } catch {}
      return next;
    });
  };

  const points = eligibility.data?.points ?? 135;
  const currentDays = streak.data?.currentStreak ?? 6;

  return (
    <div className="relative overflow-hidden -mx-3.5 -mt-5 rounded-none rounded-b-[28px] bg-gradient-to-br from-[#7A12F5] via-[#660CD9] to-[#4A00A8] p-4 pt-4 text-white shadow-xl">
      <OknWatermark variant="hero" size="lg" />
      <div className="relative z-10 flex items-center justify-between gap-2 mb-1">
        <span className="text-xs font-bold text-[#E4D3FF]">Your OK Points</span>
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-bold backdrop-blur-md">
            <Flame className="size-3.5 fill-current text-[#FFD60A]" />
            <span>{currentDays}-day streak</span>
          </span>
          <button
            type="button"
            onClick={() => openShareCard('portfolio', 'button')}
            aria-label="Share portfolio card"
            data-testid="mobile-share-portfolio-btn"
            className="inline-flex h-7 items-center justify-center gap-1 rounded-full bg-white/18 px-2.5 text-[11px] font-extrabold text-white ring-1 ring-inset ring-white/25 hover:bg-white/25 active:scale-95 transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            <Share2 className="size-3 shrink-0" />
            <span>Share</span>
          </button>
        </div>
      </div>

      <div className="relative z-10 num text-4xl font-extrabold tracking-tight mb-3.5 tabular-nums">
        <AnimatedCounter target={points} durationMs={1100} />
      </div>

      {/* Nested Frosted Glass Total Asset Value Card */}
      <div className="relative z-10 rounded-[20px] border border-white/15 bg-black/25 p-3.5 backdrop-blur-md flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#E6D7FF]/85">
              <span>Total Asset Value</span>
              <button
                type="button"
                onClick={toggleBalance}
                className="balance-eye-btn p-0.5 text-white/90 hover:text-white cursor-pointer"
                aria-label={hideBalance ? 'Show balance' : 'Hide balance'}
              >
                <EyeToggleIcon hidden={hideBalance} className="size-3.5" />
              </button>
            </div>
            <div className="num text-2xl font-extrabold text-white leading-tight mt-0.5 tabular-nums">
              <MaskedBalance hidden={hideBalance} mask="••••••••">
                <AnimatedCounter target={1428.5} decimals={2} prefix="$" durationMs={1200} />
              </MaskedBalance>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="rounded-xl border border-[#2FBD8E]/40 bg-[#2FBD8E]/20 px-2.5 py-1 text-xs font-extrabold text-[#4EEDB2] whitespace-nowrap">
              +$142.50
            </span>
            <button
              type="button"
              onClick={() => openShareCard('portfolio', 'button')}
              data-testid="asset-card-share-btn"
              aria-label="Share Total Asset Value"
              className="inline-flex h-7 items-center justify-center gap-1 rounded-xl bg-white/15 px-2.5 text-[11px] font-extrabold text-white ring-1 ring-inset ring-white/20 hover:bg-white/25 active:scale-95 transition-all cursor-pointer whitespace-nowrap shrink-0"
            >
              <Share2 className="size-3 shrink-0" />
              <span>Share</span>
            </button>
          </div>
        </div>

        <div className="h-[1px] bg-white/12" />

        {/* Referral Earnings shortcut */}
        <Link
          href="/app/referral"
          className="flex items-center justify-between rounded-xl bg-white/[0.08] px-3 py-2.5 hover:bg-white/[0.14] active:scale-98 transition-all gap-2"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white shadow-inner">
              <Users className="size-4 text-white" />
            </span>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-[#E9DAFF]">
                Referral Earnings
              </div>
              <div className="num text-sm font-extrabold text-white mt-0.5 tabular-nums">
                <MaskedBalance hidden={hideBalance} mask="••••••">
                  <AnimatedCounter target={142.5} decimals={2} prefix="$" durationMs={1150} />
                </MaskedBalance>
              </div>
            </div>
          </div>
          <div className="inline-flex items-center gap-1 rounded-full bg-white/12 px-3 py-1.5 text-[11px] font-bold text-white shrink-0">
            <span>14 invites</span>
            <ChevronRight className="size-3.5 opacity-80" />
          </div>
        </Link>
      </div>
    </div>
  );
}
