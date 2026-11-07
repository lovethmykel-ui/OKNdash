'use client';

/**
 * /app/referral — Partner Program & Web3 Referral Dashboard.
 *
 * Full port from https://newdash-ruby.vercel.app/referral
 * Features dynamic referral links, real-time earnings stats, rank progression bar,
 * 4 partner package sections, and tiered commissions.
 */
import { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  EyeOff,
  Search,
  Users,
} from 'lucide-react';
import { useReferral } from '@/lib/hooks/use-referral';
import { useMe } from '@/lib/hooks/use-me';
import { toast } from 'sonner';

interface InvitedFriendRow {
  id: string;
  name: string;
  username: string;
  wallet: string;
  level: 1 | 2 | 3;
  status: 'Active Buyer' | 'Task Verified' | 'Joined';
  cashUsd: number;
  cashBnb: number;
  okPoints: number;
  joinedAgo: string;
  joinedDate: string;
}

const INVITED_FRIENDS_META: Record<
  string,
  { wallet: string; cashUsd: number; cashBnb: number; joinedAgo: string; joinedDate: string }
> = {
  'ref-1': { wallet: '0x71C4...9A21', cashUsd: 28.5, cashBnb: 0.048, joinedAgo: '2h ago', joinedDate: 'Nov 7, 2026' },
  'ref-2': { wallet: '0x94E1...3B08', cashUsd: 22.0, cashBnb: 0.037, joinedAgo: '7h ago', joinedDate: 'Nov 7, 2026' },
  'ref-3': { wallet: '0x38A9...7C14', cashUsd: 19.5, cashBnb: 0.033, joinedAgo: '19h ago', joinedDate: 'Nov 6, 2026' },
  'ref-4': { wallet: '0x52D0...1E66', cashUsd: 12.0, cashBnb: 0.020, joinedAgo: '1d ago', joinedDate: 'Nov 6, 2026' },
  'ref-5': { wallet: '0x8B12...4F90', cashUsd: 16.5, cashBnb: 0.028, joinedAgo: '1d ago', joinedDate: 'Nov 5, 2026' },
  'ref-6': { wallet: '0x19F3...8D42', cashUsd: 0, cashBnb: 0, joinedAgo: '2d ago', joinedDate: 'Nov 5, 2026' },
  'ref-7': { wallet: '0x63C8...2A15', cashUsd: 9.5, cashBnb: 0.016, joinedAgo: '3d ago', joinedDate: 'Nov 4, 2026' },
  'ref-8': { wallet: '0x4E77...9C03', cashUsd: 14.0, cashBnb: 0.023, joinedAgo: '4d ago', joinedDate: 'Nov 3, 2026' },
  'ref-9': { wallet: '0x2A55...6B81', cashUsd: 5.5, cashBnb: 0.009, joinedAgo: '5d ago', joinedDate: 'Nov 2, 2026' },
  'ref-10': { wallet: '0x7D91...0E34', cashUsd: 8.5, cashBnb: 0.014, joinedAgo: '6d ago', joinedDate: 'Nov 1, 2026' },
  'ref-11': { wallet: '0xC048...5A79', cashUsd: 0, cashBnb: 0, joinedAgo: '7d ago', joinedDate: 'Oct 31, 2026' },
  'ref-12': { wallet: '0xF182...3D90', cashUsd: 0, cashBnb: 0, joinedAgo: '8d ago', joinedDate: 'Oct 30, 2026' },
  'ref-13': { wallet: '0xA923...7F12', cashUsd: 6.5, cashBnb: 0.010, joinedAgo: '9d ago', joinedDate: 'Oct 29, 2026' },
  'ref-14': { wallet: '0xE410...8B55', cashUsd: 0, cashBnb: 0, joinedAgo: '10d ago', joinedDate: 'Oct 28, 2026' },
};

export default function ReferralPage() {
  const t = useTranslations('dashboard.referral');
  const referral = useReferral();
  const { data: meData } = useMe();
  const [copied, setCopied] = useState(false);
  const [hideBalance, setHideBalance] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'l1' | 'downline' | 'buyers'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [animProgress, setAnimProgress] = useState(0);

  useEffect(() => {
    let rafId = 0;
    const durationMs = 1150;
    let startTime: number | null = null;

    const tick = (now: number) => {
      if (startTime === null) {
        startTime = now;
        try {
          const stored = localStorage.getItem('okn_hide_balance') === 'true';
          if (stored) setHideBalance(true);
        } catch {}
      }
      const elapsed = now - startTime;
      const rawT = Math.min(1, elapsed / durationMs);
      // Cubic ease-out: 1 - (1 - t)^3
      const eased = 1 - Math.pow(1 - rawT, 3);
      setAnimProgress(eased);
      if (rawT < 1) {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, []);

  const animatedCashTotal = (142.5 * animProgress).toFixed(2);
  const animatedBnbTotal = (0.238 * animProgress).toFixed(3);
  const animatedPointsTotal = Math.round(1420 * animProgress).toLocaleString('en-US');

  const toggleBalance = () => {
    setHideBalance((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('okn_hide_balance', next ? 'true' : 'false');
      } catch {}
      return next;
    });
  };

  const referralCode = 'ref_dev';
  const link = `https://t.me/okntest001_bot?start=${referralCode}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success('Referral link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.info('Link copied');
    }
  };

  const invitedFriends: InvitedFriendRow[] = useMemo(() => {
    const entries = referral.data?.recent ?? [];
    return entries.map((entry, idx) => {
      const meta = INVITED_FRIENDS_META[entry.id] ?? {
        wallet: `0x89A${idx}...4C1${idx}`,
        cashUsd: entry.status === 'paid' ? 10 : 0,
        cashBnb: entry.status === 'paid' ? 0.017 : 0,
        joinedAgo: `${idx + 1}d ago`,
        joinedDate: 'Nov 2026',
      };
      const statusLabel: InvitedFriendRow['status'] =
        entry.status === 'paid'
          ? 'Active Buyer'
          : entry.status === 'eligible'
            ? 'Task Verified'
            : 'Joined';
      return {
        id: entry.id,
        name: entry.referredFirstName ?? entry.referredUsername ?? `User #${idx + 1}`,
        username: entry.referredUsername ? `@${entry.referredUsername}` : `@okn_user_${idx + 1}`,
        wallet: meta.wallet,
        level: (entry.level as 1 | 2 | 3) || 1,
        status: statusLabel,
        cashUsd: meta.cashUsd,
        cashBnb: meta.cashBnb,
        okPoints: entry.rewardPoints ?? 0,
        joinedAgo: meta.joinedAgo,
        joinedDate: meta.joinedDate,
      };
    });
  }, [referral.data]);

  const filteredFriends = useMemo(() => {
    return invitedFriends.filter((item) => {
      if (historyFilter === 'l1' && item.level !== 1) return false;
      if (historyFilter === 'downline' && item.level === 1) return false;
      if (historyFilter === 'buyers' && item.status !== 'Active Buyer') return false;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          item.username.toLowerCase().includes(q) ||
          item.wallet.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [invitedFriends, historyFilter, searchQuery]);

  const visibleFriends = showAllHistory ? filteredFriends : filteredFriends.slice(0, 6);

  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    'Join the $OKN ecosystem and stack points with me!',
  )}&url=${encodeURIComponent(link)}`;

  const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(
    link,
  )}&text=${encodeURIComponent('Join the $OKN presale and referral program!')}`;

  return (
    <main className="space-y-6 pb-12">
      {/* 1. Hero Banner: Partner package */}
      <section className="relative overflow-hidden rounded-[26px] sm:rounded-[28px] bg-gradient-to-br from-[#7A12F5] via-[#6D0ED8] to-[#5106B3] p-4 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col justify-between">
          <div className="px-0.5">
            <span className="inline-block text-[10.5px] sm:text-[11px] font-extrabold tracking-widest text-purple-200/90 uppercase">
              PARTNER PROGRAM · REFERRAL
            </span>
            <h1 className="mt-1.5 text-2xl font-black tracking-tight text-white sm:text-3xl md:text-4xl">
              Partner package
            </h1>
          </div>

          <div className="mt-5 sm:mt-6 grid grid-cols-3 gap-2 sm:gap-4">
            <div className="min-w-0 overflow-hidden rounded-2xl border border-white/20 bg-white/15 px-2.5 py-3 backdrop-blur-md shadow-inner sm:p-4 flex flex-col justify-center gap-1.5">
              <div className="num text-[15px] sm:text-2xl font-black tracking-tight text-white whitespace-nowrap leading-none">
                10–15%
              </div>
              <div className="text-[10px] sm:text-xs font-semibold tracking-tight text-purple-100/95 whitespace-nowrap">
                Commission
              </div>
            </div>

            <div className="min-w-0 overflow-hidden rounded-2xl border border-white/20 bg-white/15 px-2.5 py-3 backdrop-blur-md shadow-inner sm:p-4 flex flex-col justify-center gap-1.5">
              <div className="num text-[15px] sm:text-2xl font-black tracking-tight text-white whitespace-nowrap leading-none">
                $200,000
              </div>
              <div className="text-[10px] sm:text-xs font-semibold tracking-tight text-purple-100/95 whitespace-nowrap">
                Marketing budget
              </div>
            </div>

            <div className="min-w-0 overflow-hidden rounded-2xl border border-white/20 bg-white/15 px-2.5 py-3 backdrop-blur-md shadow-inner sm:p-4 flex flex-col justify-center gap-1.5">
              <div className="num text-[15px] sm:text-2xl font-black tracking-tight text-white whitespace-nowrap leading-none">
                12 mo
              </div>
              <div className="text-[10px] sm:text-xs font-semibold tracking-tight text-purple-100/95 whitespace-nowrap">
                Token vesting
              </div>
            </div>
          </div>
        </div>

        {/* Subtle ambient lighting */}
        <div className="pointer-events-none absolute -right-12 -top-12 size-64 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-12 size-64 rounded-full bg-[#8C38F7]/30 blur-3xl" />
      </section>

      {/* 2. Your Unique Referral Link Card */}
      <section className="rounded-[26px] border border-[var(--line)] bg-[var(--s1)] p-5 shadow-sm sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-[var(--tx)]">
              Your Unique Referral Link
            </h2>
            <p className="mt-1 text-xs text-[var(--mut)] sm:text-sm">
              Share your personal link to earn instant commissions and ascending tier multipliers.
            </p>
          </div>
          <div className="self-start sm:self-auto rounded-xl border border-[var(--line)] bg-[var(--s2)] px-3 py-1.5 text-xs font-semibold text-[var(--mut)]">
            Referral Code: <strong className="font-mono text-[var(--tx)] font-extrabold">{referralCode}</strong>
          </div>
        </div>

        <div className="mt-4 sm:mt-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <input
            id="ref-link-input"
            type="text"
            readOnly
            value={link}
            className="min-w-0 flex-1 rounded-2xl border border-[var(--line)] bg-[var(--s2)] px-4 py-3 font-mono text-xs sm:text-sm font-bold text-[var(--tx)] outline-none select-all transition-colors focus:border-[#7A12F5]"
          />

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={copy}
              className="flex h-12 flex-1 sm:flex-initial sm:px-6 items-center justify-center gap-2 rounded-2xl bg-[#7A12F5] font-bold text-sm text-white shadow-md hover:bg-[#8C38F7] active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap"
            >
              {copied ? (
                <>
                  <Check className="size-4 text-emerald-300" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="size-4" />
                  <span>Copy link</span>
                </>
              )}
            </button>

            {/* X / Twitter share */}
            <a
              href={tweetUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Share on X"
              className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-[var(--line)] bg-[var(--s2)] text-[var(--tx)] hover:bg-[var(--s1)] active:scale-95 transition-all cursor-pointer"
            >
              <svg className="size-4 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>

            {/* Telegram share */}
            <a
              href={telegramShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Share on Telegram"
              className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-[var(--line)] bg-[var(--s2)] text-[#09B4FF] hover:bg-[var(--s1)] active:scale-95 transition-all cursor-pointer"
            >
              <svg className="size-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.52 2.77-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* 3. Upgraded Referral Account Statistics */}
      <section className="rounded-[26px] border border-[var(--line)] bg-[var(--s1)] p-5 md:p-7 shadow-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-[var(--tx)]">Referral Account Statistics</h3>
            <p className="text-xs text-[var(--mut)] mt-0.5">
              Real-time earnings performance, active downstream buyers, and partner rank
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-xl border border-[#7A12F5]/30 bg-[#7A12F5]/15 px-3 py-1 text-xs font-extrabold text-[#C9A6FF]">
              Silver Partner (Tier 2)
            </span>
            <button
              type="button"
              onClick={toggleBalance}
              className="flex h-8 items-center gap-1.5 px-3 rounded-lg border border-[var(--line)] bg-[var(--s2)] text-xs font-bold text-[var(--tx)] hover:bg-[var(--line)] transition-colors cursor-pointer"
            >
              {hideBalance ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              <span>Toggle Balances</span>
            </button>
          </div>
        </div>

        {/* 4-Stat Metric Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--s2)] p-3.5 sm:p-4">
            <div className="text-[11px] sm:text-xs font-bold text-[var(--mut)]">Total Referrals</div>
            <div className="num text-xl sm:text-2xl font-extrabold text-[var(--tx)] mt-1">
              14 <span className="text-xs font-semibold text-[var(--mut)]">friends</span>
            </div>
            <div className="text-[11px] font-bold text-[#2FBD8E] mt-1">11 active buyers (78%)</div>
          </div>

          <div className="rounded-2xl border border-[var(--line)] bg-[var(--s2)] p-3.5 sm:p-4">
            <div className="text-[11px] sm:text-xs font-bold text-[var(--mut)]">Total Earned ($)</div>
            <div className="num text-xl sm:text-2xl font-extrabold text-[#2FBD8E] mt-1">
              {hideBalance ? '••••••' : `$${animatedCashTotal}`}
            </div>
            <div className="text-[11px] font-bold text-[#F3BA2F] mt-1">
              {hideBalance ? '•••• BNB Payout' : `~${animatedBnbTotal} BNB Payout`}
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--line)] bg-[var(--s2)] p-3.5 sm:p-4">
            <div className="text-[11px] sm:text-xs font-bold text-[var(--mut)]">Commission Rate</div>
            <div className="num text-xl sm:text-2xl font-extrabold text-[var(--tx)] mt-1">12.5%</div>
            <div className="text-[11px] font-bold text-[var(--mut)] mt-1">Next tier: 15.0%</div>
          </div>

          <div className="rounded-2xl border border-[var(--line)] bg-[var(--s2)] p-3.5 sm:p-4">
            <div className="text-[11px] sm:text-xs font-bold text-[var(--mut)]">Points Multiplier</div>
            <div className="num text-xl sm:text-2xl font-extrabold text-[#FFD60A] mt-1">1.5x</div>
            <div className="text-[11px] font-bold text-[var(--mut)] mt-1 num">
              +{animatedPointsTotal} OK Points
            </div>
          </div>
        </div>

        {/* Tier Progress Bar */}
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--s2)] p-4 space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs font-bold">
            <span className="text-[var(--tx)]">
              Rank Progression: <strong className="text-[#C9A6FF]">Gold Partner (15% Commission)</strong>
            </span>
            <span className="text-[#C9A6FF] shrink-0">14 / 25 Referrals (56%)</span>
          </div>
          <div className="h-2 w-full rounded-full bg-[var(--line)] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#7A12F5] to-[#09B4FF] transition-all duration-500"
              style={{ width: '56%' }}
            />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-[var(--mut)]">
            <span>11 more successful invites needed to reach Tier 3 status</span>
            <span className="font-bold text-[var(--tx)] shrink-0">Instant auto-upgrade upon qualification</span>
          </div>
        </div>
      </section>

      {/* 3.5. Referral History (Invited Friends) */}
      <section className="rounded-[26px] border border-[var(--line)] bg-[var(--s1)] p-5 md:p-7 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-[#7A12F5]/30 bg-[#7A12F5]/15 text-[#C9A6FF]">
              <Users className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-extrabold text-[var(--tx)]">
                  Referral History
                </h3>
                <span className="rounded-full border border-[var(--line)] bg-[var(--s2)] px-2.5 py-0.5 text-[11px] font-extrabold text-[var(--tx)] num">
                  {invitedFriends.length} Invited
                </span>
              </div>
              <p className="text-xs text-[var(--mut)] mt-0.5">
                Track everyone you invited, their tier level, presale activity, and your earned rewards.
              </p>
            </div>
          </div>

          {/* Search input */}
          <div className="relative w-full lg:w-64">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[var(--mut)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, @handle, wallet..."
              aria-label="Search invited friends"
              className="h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--s2)] pr-3 pl-9 text-xs font-semibold text-[var(--tx)] outline-none transition-colors placeholder:text-[var(--mut)] focus:border-[#7A12F5]"
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] pb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all' as const, label: `All (${invitedFriends.length})` },
              { id: 'l1' as const, label: `Direct · L1 (${invitedFriends.filter((f) => f.level === 1).length})` },
              { id: 'downline' as const, label: `Downline · L2/L3 (${invitedFriends.filter((f) => f.level > 1).length})` },
              { id: 'buyers' as const, label: `Active Buyers (${invitedFriends.filter((f) => f.status === 'Active Buyer').length})` },
            ].map((tab) => {
              const active = historyFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setHistoryFilter(tab.id)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    active
                      ? 'bg-[#7A12F5] text-white shadow-sm'
                      : 'border border-[var(--line)] bg-[var(--s2)] text-[var(--mut)] hover:text-[var(--tx)]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
          <div className="text-[11px] font-semibold text-[var(--mut)]">
            Showing <strong className="text-[var(--tx)] num">{visibleFriends.length}</strong> of{' '}
            <strong className="text-[var(--tx)] num">{filteredFriends.length}</strong> referrals
          </div>
        </div>

        {/* Desktop Table Header (hidden on mobile) */}
        <div className="hidden md:grid md:grid-cols-12 gap-3 px-3.5 text-[11px] font-bold uppercase tracking-wider text-[var(--mut)]">
          <div className="col-span-4">Invited User</div>
          <div className="col-span-2">Tier Level</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2 text-right">Cash Commission</div>
          <div className="col-span-2 text-right">OK Points / Joined</div>
        </div>

        {/* Referral List */}
        {visibleFriends.length === 0 ? (
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--s2)] p-8 text-center">
            <p className="text-sm font-bold text-[var(--tx)]">No matching referrals found</p>
            <p className="mt-1 text-xs text-[var(--mut)]">
              Try clearing your search query or switching filter tabs above.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--line)] rounded-2xl border border-[var(--line)] bg-[var(--s2)] overflow-hidden">
            {visibleFriends.map((friend) => {
              const initials = friend.name
                .split(' ')
                .map((p) => p[0])
                .join('')
                .slice(0, 2)
                .toUpperCase();

              return (
                <div
                  key={friend.id}
                  className="p-3.5 sm:px-4 sm:py-3.5 hover:bg-[var(--s1)]/60 transition-colors"
                >
                  {/* Desktop Row + Mobile Stacked Layout */}
                  <div className="flex flex-col gap-3 md:grid md:grid-cols-12 md:items-center md:gap-3">
                    {/* User Identity */}
                    <div className="flex items-center justify-between md:col-span-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative flex size-10 shrink-0 items-center justify-center rounded-full border border-[#7A12F5]/30 bg-gradient-to-br from-[#7A12F5]/25 to-[#09B4FF]/20 font-display text-xs font-extrabold text-[var(--tx)]">
                          {initials}
                          <span
                            className={`absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full ring-2 ring-[var(--s2)] ${
                              friend.status === 'Active Buyer'
                                ? 'bg-[#2FBD8E]'
                                : friend.status === 'Task Verified'
                                  ? 'bg-[#09B4FF]'
                                  : 'bg-[#F3BA2F]'
                            }`}
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-sm font-extrabold text-[var(--tx)]">
                              {friend.name}
                            </span>
                            <span className="font-mono text-[11px] font-semibold text-[var(--mut)]">
                              {friend.username}
                            </span>
                          </div>
                          <div className="mt-0.5 flex items-center gap-2 text-[11px] text-[var(--mut)]">
                            <span className="font-mono">{friend.wallet}</span>
                            <span className="md:hidden">· {friend.joinedAgo}</span>
                          </div>
                        </div>
                      </div>

                      {/* Mobile Status Badge */}
                      <div className="md:hidden shrink-0">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                            friend.status === 'Active Buyer'
                              ? 'bg-[#2FBD8E]/15 text-[#2FBD8E] border border-[#2FBD8E]/30'
                              : friend.status === 'Task Verified'
                                ? 'bg-[#09B4FF]/15 text-[#09B4FF] border border-[#09B4FF]/30'
                                : 'bg-[#F3BA2F]/15 text-[#F3BA2F] border border-[#F3BA2F]/30'
                          }`}
                        >
                          {friend.status}
                        </span>
                      </div>
                    </div>

                    {/* Tier Level (Desktop) */}
                    <div className="hidden md:flex md:col-span-2 items-center">
                      <span
                        className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold ${
                          friend.level === 1
                            ? 'bg-[#7A12F5]/15 text-[#C9A6FF] border border-[#7A12F5]/30'
                            : friend.level === 2
                              ? 'bg-[#09B4FF]/15 text-[#09B4FF] border border-[#09B4FF]/30'
                              : 'bg-[var(--line)] text-[var(--mut)]'
                        }`}
                      >
                        {friend.level === 1
                          ? 'Tier 1 · Direct'
                          : friend.level === 2
                            ? 'Tier 2 · L2'
                            : 'Tier 3 · L3'}
                      </span>
                    </div>

                    {/* Status (Desktop) */}
                    <div className="hidden md:flex md:col-span-2 items-center">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
                          friend.status === 'Active Buyer'
                            ? 'bg-[#2FBD8E]/15 text-[#2FBD8E] border border-[#2FBD8E]/30'
                            : friend.status === 'Task Verified'
                              ? 'bg-[#09B4FF]/15 text-[#09B4FF] border border-[#09B4FF]/30'
                              : 'bg-[#F3BA2F]/15 text-[#F3BA2F] border border-[#F3BA2F]/30'
                        }`}
                      >
                        <span
                          className={`size-1.5 rounded-full ${
                            friend.status === 'Active Buyer'
                              ? 'bg-[#2FBD8E]'
                              : friend.status === 'Task Verified'
                                ? 'bg-[#09B4FF]'
                                : 'bg-[#F3BA2F]'
                          }`}
                        />
                        {friend.status}
                      </span>
                    </div>

                    {/* Cash Commission (Desktop) */}
                    <div className="hidden md:block md:col-span-2 text-right">
                      {friend.cashUsd > 0 ? (
                        <>
                          <div className="num text-sm font-extrabold text-[#2FBD8E]">
                            {hideBalance ? '••••' : `+$${friend.cashUsd.toFixed(2)}`}
                          </div>
                          <div className="num text-[11px] font-semibold text-[#F3BA2F]">
                            {hideBalance ? '•••• BNB' : `${friend.cashBnb.toFixed(3)} BNB`}
                          </div>
                        </>
                      ) : (
                        <div className="text-xs font-semibold text-[var(--mut)]">—</div>
                      )}
                    </div>

                    {/* OK Points & Joined (Desktop) */}
                    <div className="hidden md:block md:col-span-2 text-right">
                      <div className="num text-sm font-extrabold text-[#09B4FF]">
                        +{friend.okPoints} OK Pts
                      </div>
                      <div className="text-[11px] font-medium text-[var(--mut)]">
                        {friend.joinedDate} ({friend.joinedAgo})
                      </div>
                    </div>

                    {/* Mobile Compact Metrics Row */}
                    <div className="flex items-center justify-between rounded-xl border border-[var(--line)] bg-[var(--s1)] px-3 py-2 text-xs md:hidden">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-[#C9A6FF]">
                          {friend.level === 1 ? 'L1 Direct' : `L${friend.level} Downline`}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="num font-extrabold text-[#2FBD8E]">
                          {friend.cashUsd > 0
                            ? hideBalance
                              ? '••••'
                              : `+$${friend.cashUsd.toFixed(2)}`
                            : '$0.00'}
                        </span>
                        <span className="text-[var(--line)]">|</span>
                        <span className="num font-extrabold text-[#09B4FF]">
                          +{friend.okPoints} Pts
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Expand / Collapse Footer */}
        {filteredFriends.length > 6 && (
          <div className="pt-1 flex justify-center">
            <button
              type="button"
              onClick={() => setShowAllHistory((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--s2)] px-4 py-2 text-xs font-extrabold text-[var(--tx)] hover:border-[#7A12F5]/50 hover:bg-[var(--s1)] transition-all cursor-pointer"
            >
              {showAllHistory ? (
                <>
                  <span>Show Less</span>
                  <ChevronUp className="size-4 text-[#C9A6FF]" />
                </>
              ) : (
                <>
                  <span>View All {filteredFriends.length} Invited Friends</span>
                  <ChevronDown className="size-4 text-[#C9A6FF]" />
                </>
              )}
            </button>
          </div>
        )}
      </section>

      {/* 4. Section Title: Here is the package */}
      <div className="pt-2">
        <h2 className="text-lg font-extrabold text-[var(--tx)]">
          Here is the package:
        </h2>
      </div>

      {/* 5. The 4 Package Cards (2x2 Grid) */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Card 1 */}
        <section className="rounded-3xl border border-[var(--line)] bg-[var(--s1)] p-6 sm:p-7 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#7A12F5] font-extrabold text-base text-white shadow-sm">
              1
            </span>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-extrabold text-[var(--tx)] leading-tight">
                Tiered Performance Commissions
              </h3>
              <p className="text-xs font-semibold text-[var(--mut)] mt-0.5">
                (The &quot;Mouth-Watering&quot; Part)
              </p>
            </div>
          </div>

          <p className="mt-4 text-xs sm:text-sm leading-relaxed text-[var(--mut)]">
            We are allocating an initial{' '}
            <strong className="text-[var(--tx)] font-extrabold">
              $200,000 Presale Marketing Budget
            </strong>{' '}
            strictly for performance payouts.
          </p>

          <div className="mt-4 flex flex-col gap-3">
            <div className="flex items-start gap-2.5">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#7A12F5]" />
              <div className="text-xs sm:text-sm leading-relaxed text-[var(--mut)]">
                <strong className="text-[var(--tx)] font-bold">Direct Cash Commission:</strong>{' '}
                You earn a <strong className="text-[var(--tx)] font-bold">10% – 15% commission</strong>{' '}
                on every single token purchase (USDT/BNB) made through your unique tracking links.
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#09B4FF]" />
              <div className="text-xs sm:text-sm leading-relaxed text-[var(--mut)]">
                <strong className="text-[var(--tx)] font-bold">&quot;OK Points&quot; Commission Structure:</strong>{' '}
                You earn a share of the OK Points your referrals make from tasks:{' '}
                <strong className="text-[var(--tx)] font-bold">
                  10% at Tier 1 (Starter), 5% at Tier 2 (Growth), 2% at Tier 3 (Whale Partner)
                </strong>.
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#7A12F5]" />
              <div className="text-xs sm:text-sm leading-relaxed text-[var(--mut)]">
                <strong className="text-[var(--tx)] font-bold">The Math:</strong>{' '}
                If you drive $500k in sales, you instantly earn{' '}
                <strong className="text-[var(--tx)] font-bold">$50,000 - $75,000</strong>. If you drive $1M, you earn $100k+.
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#7A12F5]" />
              <div className="text-xs sm:text-sm leading-relaxed text-[var(--mut)]">
                <strong className="text-[var(--tx)] font-bold">Milestone Bonuses:</strong>{' '}
                Aggressive monthly volume targets pay flat cash bonuses directly to your wallet.
              </div>
            </div>
          </div>
        </section>

        {/* Card 2 */}
        <section className="rounded-3xl border border-[var(--line)] bg-[var(--s1)] p-6 sm:p-7 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#7A12F5] font-extrabold text-base text-white shadow-sm">
              2
            </span>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-extrabold text-[var(--tx)] leading-tight">
                The OKN Token Allocation
              </h3>
              <p className="text-xs font-semibold text-[var(--mut)] mt-0.5">
                (The &quot;Skin in the Game&quot;)
              </p>
            </div>
          </div>

          <p className="mt-4 text-xs sm:text-sm leading-relaxed text-[var(--mut)]">
            We want you to be wealthy when OKN succeeds, not just paid for a campaign.
          </p>

          <div className="mt-4 flex flex-col gap-3">
            <div className="flex items-start gap-2.5">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#7A12F5]" />
              <div className="text-xs sm:text-sm leading-relaxed text-[var(--mut)]">
                Offering an allocation of <strong className="text-[var(--tx)] font-bold">OKN Tokens</strong> to top marketing partners, vesting over 12 months.
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#7A12F5]" />
              <div className="text-xs sm:text-sm leading-relaxed text-[var(--mut)]">
                Direct stake in the token: when OKN lists on Tier-1 exchanges at a higher price, your allocation delivers exponential upside.
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#7A12F5]" />
              <div className="text-xs sm:text-sm leading-relaxed text-[var(--mut)]">
                <strong className="text-[var(--tx)] font-bold">Affiliate Leaderboard:</strong> Top 90-day volume drivers receive a 2x multiplier on token allocations.
              </div>
            </div>
          </div>
        </section>

        {/* Card 3 */}
        <section className="rounded-3xl border border-[var(--line)] bg-[var(--s1)] p-6 sm:p-7 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#7A12F5] font-extrabold text-base text-white shadow-sm">
              3
            </span>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-extrabold text-[var(--tx)] leading-tight">
                VIP Access &amp; Status
              </h3>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3">
            <div className="flex items-start gap-2.5">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#7A12F5]" />
              <div className="text-xs sm:text-sm leading-relaxed text-[var(--mut)]">
                <strong className="text-[var(--tx)] font-bold">Lifetime Fee Discount:</strong> Personal trading fees on the OKNexus exchange will be permanently zeroed out.
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#7A12F5]" />
              <div className="text-xs sm:text-sm leading-relaxed text-[var(--mut)]">
                <strong className="text-[var(--tx)] font-bold">Inner Circle:</strong> Private briefing on major listings, agent deployments, and roadmap milestones before the public.
              </div>
            </div>
          </div>
        </section>

        {/* Card 4 */}
        <section
          style={{ background: 'var(--inv-bg)', color: 'var(--inv-tx)' }}
          className="rounded-3xl p-6 sm:p-7 shadow-lg"
        >
          <div className="flex items-center gap-3">
            <span
              style={{ background: 'var(--inv-tx)', color: 'var(--inv-bg)' }}
              className="flex size-9 shrink-0 items-center justify-center rounded-full font-extrabold text-base"
            >
              4
            </span>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-extrabold leading-tight">
                What We Provide You
              </h3>
              <p style={{ color: 'var(--inv-mut)' }} className="text-xs font-semibold mt-0.5">
                (Our Commitment)
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2.5">
            {[
              'A high-converting landing page and presale widget.',
              'Ready-made creative assets, banners, and video explainers.',
              'A dedicated affiliate dashboard to track your sales and commissions in real-time.',
              'Weekly syncs to ensure you have the support and custom collateral you need.',
            ].map((text, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span style={{ background: 'var(--inv-tx)' }} className="mt-1.5 size-1.5 shrink-0 rounded-full" />
                <div className="text-xs sm:text-sm leading-relaxed">{text}</div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* 6. Commission Tier Structure: Cash + OK Points */}
      <section className="rounded-3xl border border-[var(--line)] bg-[var(--s1)] p-5 sm:p-7 shadow-sm space-y-6">
        {/* Cash Commission Structure */}
        <div>
          <div className="mb-3.5">
            <h3 className="text-base sm:text-lg font-extrabold text-[var(--tx)]">
              Cash Commission Tier Structure
            </h3>
            <p className="text-xs text-[var(--mut)] mt-0.5">
              Instant BNB / USDT commission payouts on every token purchase made by your referrals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl border border-[var(--line)] bg-[var(--s2)] space-y-1">
              <div className="text-xs font-extrabold text-[var(--tx)]">Tier 1 · Starter</div>
              <div className="text-[11px] text-[var(--mut)]">0–5 Active Buyers</div>
              <div className="num text-xl font-black text-[var(--tx)] mt-1">10% BNB</div>
            </div>

            <div className="p-4 rounded-2xl border border-[#7A12F5]/40 bg-[#7A12F5]/10 space-y-1">
              <div className="text-xs font-extrabold text-[#C9A6FF]">Tier 2 · Growth (Current)</div>
              <div className="text-[11px] text-[var(--mut)]">6–25 Active Buyers</div>
              <div className="num text-xl font-black text-[#C9A6FF] mt-1">12.5% BNB</div>
            </div>

            <div className="p-4 rounded-2xl border border-[#FFD60A]/40 bg-[#FFD60A]/10 space-y-1">
              <div className="text-xs font-extrabold text-[#FFD60A]">Tier 3 · Whale Partner</div>
              <div className="text-[11px] text-[var(--mut)]">26+ Active Buyers</div>
              <div className="num text-xl font-black text-[#FFD60A] mt-1">15% BNB</div>
            </div>
          </div>
        </div>

        {/* OK Points Commission Structure */}
        <div className="pt-5 border-t border-[var(--line)]">
          <div className="mb-3.5">
            <h3 className="text-base sm:text-lg font-extrabold text-[var(--tx)]">
              &quot;OK Points&quot; Commission Structure
            </h3>
            <p className="text-xs sm:text-sm text-[var(--mut)] mt-1 leading-relaxed">
              You earn a share of the OK Points your referrals make from tasks:{' '}
              <strong className="text-[var(--tx)] font-bold">
                10% at Tier 1 (Starter), 5% at Tier 2 (Growth), 2% at Tier 3 (Whale Partner).
              </strong>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl border border-[var(--line)] bg-[var(--s2)] space-y-1">
              <div className="text-xs font-extrabold text-[var(--tx)]">Tier 1 (Starter)</div>
              <div className="text-[11px] text-[var(--mut)]">Share of referral task points</div>
              <div className="num text-xl font-black text-[#09B4FF] mt-1">10% OK Points</div>
            </div>

            <div className="p-4 rounded-2xl border border-[#7A12F5]/40 bg-[#7A12F5]/10 space-y-1">
              <div className="text-xs font-extrabold text-[#C9A6FF]">Tier 2 (Growth)</div>
              <div className="text-[11px] text-[var(--mut)]">Share of referral task points</div>
              <div className="num text-xl font-black text-[#C9A6FF] mt-1">5% OK Points</div>
            </div>

            <div className="p-4 rounded-2xl border border-[#FFD60A]/40 bg-[#FFD60A]/10 space-y-1">
              <div className="text-xs font-extrabold text-[#FFD60A]">Tier 3 (Whale Partner)</div>
              <div className="text-[11px] text-[var(--mut)]">Share of referral task points</div>
              <div className="num text-xl font-black text-[#FFD60A] mt-1">2% OK Points</div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
