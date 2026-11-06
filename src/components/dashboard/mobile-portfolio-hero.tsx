'use client';

import { useState, useEffect } from 'react';
import { Link } from '@/i18n/navigation';
import { Flame, Eye, EyeOff, Users, ChevronRight } from 'lucide-react';
import { useClaimEligibility } from '@/lib/hooks/use-claim';
import { useStreak } from '@/lib/hooks/use-rewards';
import { formatPoints } from '@/lib/utils';

/**
 * MobilePortfolioHero — Card 1 on mobile portfolio.
 * Positioned at the very top of the mobile screen above the segmented switcher.
 */
export function MobilePortfolioHero() {
  const eligibility = useClaimEligibility();
  const streak = useStreak();

  const [hideBalance, setHideBalance] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('okn_hide_balance') === 'true';
      setHideBalance(stored);
    } catch {}
  }, []);

  const toggleBalance = () => {
    setHideBalance((prev) => {
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
    <div className="relative overflow-hidden -mx-3.5 -mt-5 rounded-none rounded-b-[28px] bg-gradient-to-br from-[#7A12F5] via-[#660CD9] to-[#4A00A8] p-4 pt-5 text-white shadow-xl">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-bold text-[#E4D3FF]">Your OK Points</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-bold backdrop-blur-md">
          <Flame className="size-3.5 fill-current text-[#FFD60A]" />
          <span>{currentDays}-day streak</span>
        </span>
      </div>

      <div className="num text-4xl font-extrabold tracking-tight mb-3.5">
        {formatPoints(points)}
      </div>

      {/* Nested Frosted Glass Total Asset Value Card */}
      <div className="rounded-[20px] border border-white/15 bg-black/25 p-3.5 backdrop-blur-md flex flex-col gap-2.5">
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
                {hideBalance ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              </button>
            </div>
            <div className="num text-xl font-extrabold text-white leading-tight mt-0.5">
              {hideBalance ? '••••••••' : '$1,428.50'}
            </div>
          </div>
          <span className="rounded-lg border border-[#2FBD8E]/40 bg-[#2FBD8E]/25 px-2 py-0.5 text-[11px] font-extrabold text-[#4EEDB2] whitespace-nowrap">
            +$142.50 (24h)
          </span>
        </div>

        <div className="h-[1px] bg-white/15" />

        {/* Referral Earnings shortcut — Cleanly arranged & unclustered */}
        <Link
          href="/app/referral"
          className="flex items-center justify-between rounded-xl bg-white/[0.08] px-3 py-2.5 hover:bg-white/[0.14] active:scale-98 transition-all gap-2"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/15 text-white shadow-inner">
              <Users className="size-4 text-white" />
            </span>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-[#E9DAFF]">
                Referral Earnings
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="num text-sm font-extrabold text-white">
                  {hideBalance ? '••••••' : '$142.50'}
                </span>
                <span className="text-[11px] font-semibold text-[#FFD60A]">
                  · 0.238 BNB
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 rounded-lg bg-white/10 px-2 py-1 text-[11px] font-bold text-white shrink-0">
            <span>14 invites</span>
            <ChevronRight className="size-3.5 opacity-80" />
          </div>
        </Link>
      </div>
    </div>
  );
}
