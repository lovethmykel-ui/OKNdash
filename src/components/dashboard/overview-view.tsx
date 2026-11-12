'use client';

import { useState, useEffect } from 'react';
import { Link } from '@/i18n/navigation';
import {
  Check,
  ChevronRight,
  Download,
  Eye,
  EyeOff,
  Flame,
  ListChecks,
  ShoppingCart,
  TrendingUp,
  Users,
} from 'lucide-react';
import { AnnouncementCarousel } from '@/components/dashboard/announcement-carousel';
import { useClaimEligibility } from '@/lib/hooks/use-claim';
import { useTasks } from '@/lib/hooks/use-tasks';
import { useOknBalance } from '@/lib/hooks/use-wallet';
import { useStreak } from '@/lib/hooks/use-rewards';
import { formatPoints, formatWei } from '@/lib/utils';

export function OverviewView({ onSelectActivity }: { onSelectActivity?: () => void } = {}) {
  const eligibility = useClaimEligibility();
  const tasks = useTasks();
  const balance = useOknBalance();
  const streak = useStreak();

  const [mounted, setMounted] = useState(false);
  const [hideBalance, setHideBalance] = useState(false);

  useEffect(() => {
    setMounted(true);
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

  const points = mounted ? (eligibility.data?.points ?? 135) : 135;
  const taskList = mounted ? (tasks.data ?? []) : [];
  const doneCount = taskList.filter((t) => t.completionStatus != null).length || 2;
  const totalTasks = taskList.length || 4;
  const currentDays = mounted ? (streak.data?.currentStreak ?? 6) : 6;
  const oknTokens = mounted && balance.data != null ? formatWei(balance.data) : '693,333';

  return (
    <div className="space-y-5">
      {/* =========================================================================
          DESKTOP & TABLET VIEW (md and up)
          ========================================================================= */}
      <div className="hidden md:block space-y-6">
        {/* Vibrant Purple Portfolio Hero Card (Rich & Vivid in both Light and Dark Mode) */}
        <div className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-[#7A12F5] via-[#660CD9] to-[#4A00A8] p-6 lg:p-7 text-white shadow-[0_12px_32px_rgba(122,18,245,0.28)]">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-white/85">
                  Total Asset Value
                </span>
                <button
                  type="button"
                  onClick={toggleBalance}
                  className="balance-eye-btn flex size-7 items-center justify-center rounded-lg bg-white/15 text-white hover:bg-white/25 transition-colors cursor-pointer"
                  aria-label={hideBalance ? 'Show balance' : 'Hide balance'}
                >
                  {hideBalance ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </button>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold text-white">
                  <Flame className="size-3.5 fill-current text-[#FFD60A]" style={{ color: '#FFD60A' }} />
                  <span>{currentDays}-day streak</span>
                </span>
              </div>

              <div className="mt-2 flex items-baseline gap-3">
                <span className="num text-4xl font-extrabold text-white tracking-tight">
                  {hideBalance ? '••••••••' : '$1,428.50'}
                </span>
                <span className="rounded-lg border border-[#2FBD8E]/40 bg-[#2FBD8E]/25 px-2.5 py-1 text-xs font-extrabold text-[#4EEDB2]">
                  +$142.50 (24h)
                </span>
              </div>
            </div>

            {/* Clean 3-Card Summary Row inside Hero */}
            <div className="grid grid-cols-3 gap-3 lg:min-w-[460px]">
              <Link
                href="/app/claim"
                className="rounded-2xl border border-white/15 bg-black/25 p-3.5 backdrop-blur-md hover:bg-black/35 transition-colors"
              >
                <div className="text-xs font-semibold text-white/80">OK Points</div>
                <div className="num mt-1 text-xl font-extrabold text-white">
                  {hideBalance ? '••••' : formatPoints(points)}
                </div>
              </Link>

              <Link
                href="/app/wallet"
                className="rounded-2xl border border-white/15 bg-black/25 p-3.5 backdrop-blur-md hover:bg-black/35 transition-colors"
              >
                <div className="text-xs font-semibold text-white/80">$OKN Balance</div>
                <div className="num mt-1 text-xl font-extrabold text-white">
                  {hideBalance ? '••••••' : oknTokens}
                </div>
              </Link>

              <Link
                href="/app/referral"
                className="rounded-2xl border border-white/15 bg-black/25 p-3.5 backdrop-blur-md hover:bg-black/35 transition-colors"
              >
                <div className="text-xs font-semibold text-white/80">Referrals</div>
                <div className="num mt-1 text-xl font-extrabold text-white">
                  {hideBalance ? '••••••' : '$142.50'}
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Announcements Slider */}
        <AnnouncementCarousel id="desktop-ann-carousel" />

        {/* Straightforward 3-Column Action Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Card 1: Buy $OKN Presale */}
          <div className="rounded-[24px] border border-[var(--line)] bg-[var(--s1)] p-6 shadow-sm flex flex-col justify-between gap-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#7A12F5]/12 px-3 py-1 text-xs font-extrabold text-[var(--vio-l)]">
                  <TrendingUp className="size-3.5" />
                  <span>Presale Stage 2</span>
                </span>
                <span className="num text-xs font-extrabold text-[var(--tx)]">68.4% Sold</span>
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-[var(--tx)]">Buy $OKN Token</h3>
                <p className="text-xs font-semibold text-[var(--mut)] mt-0.5">
                  Price: 1 $OKN = $0.00060
                </p>
              </div>
              <div className="h-2.5 w-full rounded-full bg-[var(--s2)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#7A12F5] via-[#9D4EDD] to-[#00C2FF]"
                  style={{ width: '68.4%' }}
                />
              </div>
            </div>

            <Link
              href="/app/buy"
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#7A12F5] hover:bg-[#8C38F7] text-white text-xs font-extrabold shadow-[0_6px_18px_rgba(122,18,245,0.3)] transition-all"
            >
              <ShoppingCart className="size-4" />
              <span>Buy $OKN</span>
            </Link>
          </div>

          {/* Card 2: Daily Streak & Check-in */}
          <div className="rounded-[24px] border border-[var(--line)] bg-[var(--s1)] p-6 shadow-sm flex flex-col justify-between gap-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#7A12F5]/12 px-3 py-1 text-xs font-extrabold text-[var(--vio-l)]">
                  <Flame className="size-3.5" />
                  <span>Daily Check-in</span>
                </span>
                <span className="num text-xs font-extrabold text-[var(--tx)]">
                  {currentDays} Days
                </span>
              </div>

              <div>
                <h3 className="text-lg font-extrabold text-[var(--tx)]">Active Streak</h3>
                <p className="text-xs font-semibold text-[var(--mut)] mt-0.5">
                  Check in daily to boost your OK Points
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                  const isFilled = day <= currentDays;
                  return (
                    <div
                      key={day}
                      className={`h-8 flex-1 rounded-lg transition-all ${
                        isFilled
                          ? 'bg-gradient-to-b from-[#8C38F7] to-[#7A12F5] shadow-[0_2px_8px_rgba(122,18,245,0.35)]'
                          : 'border border-[var(--line)] bg-[var(--s2)]'
                      }`}
                    />
                  );
                })}
              </div>
            </div>

            <Link
              href="/app/claim"
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--s2)] hover:border-[#7A12F5]/50 text-[var(--tx)] text-xs font-extrabold transition-colors"
            >
              <Download className="size-4 text-[var(--vio-l)]" />
              <span>Claim Status</span>
            </Link>
          </div>

          {/* Card 3: Tasks & Missions */}
          <div className="rounded-[24px] border border-[var(--line)] bg-[var(--s1)] p-6 shadow-sm flex flex-col justify-between gap-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#7A12F5]/12 px-3 py-1 text-xs font-extrabold text-[var(--vio-l)]">
                  <ListChecks className="size-3.5" />
                  <span>Daily Tasks</span>
                </span>
                <span className="num text-xs font-extrabold text-[var(--tx)]">
                  {doneCount} / {totalTasks} Done
                </span>
              </div>

              <div>
                <h3 className="text-lg font-extrabold text-[var(--tx)]">Earn OK Points</h3>
                <p className="text-xs font-semibold text-[var(--mut)] mt-0.5">
                  Complete simple social &amp; daily missions
                </p>
              </div>

              <div className="h-2.5 w-full rounded-full bg-[var(--s2)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#7A12F5]"
                  style={{ width: `${Math.max(15, Math.round((doneCount / totalTasks) * 100))}%` }}
                />
              </div>
            </div>

            <Link
              href="/app/tasks"
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--s2)] hover:border-[#7A12F5]/50 text-[var(--tx)] text-xs font-extrabold transition-colors"
            >
              <span>Open Tasks</span>
              <ChevronRight className="size-4 text-[var(--vio-l)]" />
            </Link>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MOBILE VIEW (< 768px)
          ========================================================================= */}
      <div className="block md:hidden space-y-4">
        {/* 4 Vibrant Quick Actions */}
        <div className="grid grid-cols-4 gap-2.5">
          <Link
            href="/app/tasks"
            className="flex flex-col items-center justify-center gap-1.5 h-[80px] rounded-2xl bg-gradient-to-b from-[#7A12F5] to-[#660CD9] text-white shadow-[0_4px_14px_rgba(122,18,245,0.3)] border border-white/20 active:scale-95 transition-transform"
            style={{ backgroundColor: '#7A12F5', color: '#ffffff' }}
          >
            <span className="flex size-9 items-center justify-center rounded-full bg-white/20 text-white">
              <Check className="size-4.5 stroke-[2.5] text-white" style={{ color: '#ffffff', stroke: '#ffffff' }} />
            </span>
            <span className="text-xs font-extrabold text-white" style={{ color: '#ffffff' }}>Tasks</span>
          </Link>

          <Link
            href="/app/claim"
            className="flex flex-col items-center justify-center gap-1.5 h-[80px] rounded-2xl bg-gradient-to-b from-[#7A12F5] to-[#660CD9] text-white shadow-[0_4px_14px_rgba(122,18,245,0.3)] border border-white/20 active:scale-95 transition-transform"
            style={{ backgroundColor: '#7A12F5', color: '#ffffff' }}
          >
            <span className="flex size-9 items-center justify-center rounded-full bg-white/20 text-white">
              <Download className="size-4.5 stroke-[2.5] text-white" style={{ color: '#ffffff', stroke: '#ffffff' }} />
            </span>
            <span className="text-xs font-extrabold text-white" style={{ color: '#ffffff' }}>Claim</span>
          </Link>

          <Link
            href="/app/buy"
            className="flex flex-col items-center justify-center gap-1.5 h-[80px] rounded-2xl bg-gradient-to-b from-[#7A12F5] to-[#660CD9] text-white shadow-[0_4px_14px_rgba(122,18,245,0.3)] border border-white/20 active:scale-95 transition-transform"
            style={{ backgroundColor: '#7A12F5', color: '#ffffff' }}
          >
            <span className="flex size-9 items-center justify-center rounded-full bg-white/20 text-white">
              <ShoppingCart className="size-4.5 stroke-[2.5] text-white" style={{ color: '#ffffff', stroke: '#ffffff' }} />
            </span>
            <span className="text-xs font-extrabold text-white" style={{ color: '#ffffff' }}>Buy</span>
          </Link>

          <Link
            href="/app/referral"
            className="flex flex-col items-center justify-center gap-1.5 h-[80px] rounded-2xl bg-gradient-to-b from-[#7A12F5] to-[#660CD9] text-white shadow-[0_4px_14px_rgba(122,18,245,0.3)] border border-white/20 active:scale-95 transition-transform"
            style={{ backgroundColor: '#7A12F5', color: '#ffffff' }}
          >
            <span className="flex size-9 items-center justify-center rounded-full bg-white/20 text-white">
              <Users className="size-4.5 stroke-[2.5] text-white" style={{ color: '#ffffff', stroke: '#ffffff' }} />
            </span>
            <span className="text-xs font-extrabold text-white" style={{ color: '#ffffff' }}>Invite</span>
          </Link>
        </div>

        {/* Mobile Announcement Carousel */}
        <AnnouncementCarousel id="mobile-ann-carousel" />

        {/* 2-Column Core Summary Cards (Tasks + Daily Streak) */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/app/tasks"
            className="flex flex-col justify-between h-[136px] rounded-[24px] border border-[var(--line)] bg-[var(--s1)] p-4 shadow-sm active:scale-98 transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-extrabold text-[var(--tx)]">Tasks</span>
              <span className="flex size-7 items-center justify-center rounded-lg bg-[#7A12F5]/15 text-[var(--vio-l)]">
                <Check className="size-4 stroke-[2.5]" />
              </span>
            </div>
            <div>
              <div className="num text-3xl font-extrabold leading-none text-[var(--tx)]">
                {doneCount}/{totalTasks}
              </div>
              <div className="text-xs font-bold text-[var(--vio-l)] mt-1.5">
                Earn OK Points →
              </div>
            </div>
          </Link>

          <div className="flex flex-col justify-between h-[136px] rounded-[24px] border border-[var(--line)] bg-[var(--s1)] p-4 shadow-sm">
            <div>
              <div className="text-sm font-extrabold text-[var(--tx)]">Check-in</div>
              <div className="text-xs font-bold text-[var(--mut)] mt-0.5">
                {currentDays}-day streak
              </div>
            </div>
            <div className="flex items-end gap-1.5 h-10">
              {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                const isFilled = day <= currentDays;
                return (
                  <span
                    key={day}
                    className={`flex-1 h-full rounded-md transition-all ${
                      isFilled
                        ? 'bg-gradient-to-b from-[#8C38F7] to-[#7A12F5]'
                        : 'bg-[var(--s2)] border border-[var(--line)]'
                    }`}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Clean Presale Card on Mobile */}
        <div className="rounded-[24px] border border-[var(--line)] bg-[var(--s1)] p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-extrabold text-[var(--tx)]">Buy $OKN Token</div>
              <div className="text-xs font-bold text-[var(--mut)] mt-0.5">
                Presale Stage 2 · $0.00060
              </div>
            </div>
            <Link
              href="/app/buy"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#7A12F5] px-3.5 text-xs font-extrabold text-white shadow-xs"
            >
              <span>Buy Now</span>
              <ChevronRight className="size-3.5" />
            </Link>
          </div>
          <div className="space-y-1.5">
            <div className="h-2 w-full rounded-full bg-[var(--s2)] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#7A12F5] via-[#9D4EDD] to-[#00C2FF]"
                style={{ width: '68.4%' }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] font-bold text-[var(--mut)]">
              <span>Stage 2 Progress</span>
              <span className="num text-[var(--tx)]">68.4% Sold</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
