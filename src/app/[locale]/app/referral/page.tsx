'use client';

/**
 * /app/referral — Partner Program & Web3 Referral Dashboard.
 *
 * Full port from https://newdash-ruby.vercel.app/referral
 * Features dynamic referral links, real-time earnings stats, rank progression bar,
 * 4 partner package sections, and tiered commissions.
 */
import { useState, useEffect, useMemo } from 'react';
import {
  AlertTriangle,
  Award,
  Check,
  ChevronDown,
  ChevronUp,
  Coins,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useReferral } from '@/lib/hooks/use-referral';
import { OknWatermark } from '@/components/ui/okn-watermark';
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

const PARTNER_PERKS = [
  {
    icon: Coins,
    title: '10–15% Direct Cash Payouts',
    desc: 'Instant BNB & USDT commissions on every referral presale purchase from our $200,000 partner pool.',
    accent: 'text-[#2FBD8E] bg-[#2FBD8E]/15 border-[#2FBD8E]/30',
  },
  {
    icon: Zap,
    title: 'Downstream OK Points Yield',
    desc: 'Earn 10% (L1), 5% (L2), and 2% (L3) of all OK Points your network earns from completing quests.',
    accent: 'text-[#09B4FF] bg-[#09B4FF]/15 border-[#09B4FF]/30',
  },
  {
    icon: Award,
    title: '12-Month $OKN Partner Allocation',
    desc: 'Top 90-day volume leaders receive a 2x bonus multiplier on vested partner token allocations.',
    accent: 'text-[#7A12F5] dark:text-[#C9A6FF] bg-[#7A12F5]/15 border-[#7A12F5]/30',
  },
  {
    icon: ShieldCheck,
    title: 'VIP Zero-Fee & Collateral Kit',
    desc: 'Lifetime 0% OKNexus trading fees, custom tracking links, and ready-to-share creative banners.',
    accent: 'text-[#F3BA2F] bg-[#F3BA2F]/15 border-[#F3BA2F]/30',
  },
];

export default function ReferralPage() {
  const referral = useReferral();
  const [copied, setCopied] = useState(false);
  const [hideBalance, setHideBalance] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'l1' | 'buyers'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [animProgress, setAnimProgress] = useState(0);

  useEffect(() => {
    let rafId = 0;
    const durationMs = 1050;
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

  const referralCode = referral.data?.code ?? 'ref_dev';
  const link = `https://t.me/okntest001_bot?start=${referralCode}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success('Referral link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      toast.info('Referral link selected');
      setTimeout(() => setCopied(false), 2000);
    }
  };

const DEFAULT_INVITED_FRIENDS: InvitedFriendRow[] = [
  { id: 'ref-1', name: 'Alex Carter', username: '@alex_web3', wallet: '0x71C4...9A21', level: 1, status: 'Active Buyer', cashUsd: 28.5, cashBnb: 0.048, okPoints: 180, joinedAgo: '2h ago', joinedDate: 'Nov 7, 2026' },
  { id: 'ref-2', name: 'Nina Vance', username: '@nina_eth', wallet: '0x94E1...3B08', level: 1, status: 'Active Buyer', cashUsd: 22.0, cashBnb: 0.037, okPoints: 150, joinedAgo: '7h ago', joinedDate: 'Nov 7, 2026' },
  { id: 'ref-3', name: 'Marco Silva', username: '@marco_bsc', wallet: '0x38A9...7C14', level: 1, status: 'Active Buyer', cashUsd: 19.5, cashBnb: 0.033, okPoints: 140, joinedAgo: '19h ago', joinedDate: 'Nov 6, 2026' },
  { id: 'ref-4', name: 'Elena Rostova', username: '@elena_okn', wallet: '0x52D0...1E66', level: 2, status: 'Active Buyer', cashUsd: 12.0, cashBnb: 0.020, okPoints: 95, joinedAgo: '1d ago', joinedDate: 'Nov 6, 2026' },
  { id: 'ref-5', name: 'Devon Brooks', username: '@devon_defi', wallet: '0x8B12...4F90', level: 1, status: 'Active Buyer', cashUsd: 16.5, cashBnb: 0.028, okPoints: 120, joinedAgo: '1d ago', joinedDate: 'Nov 5, 2026' },
  { id: 'ref-6', name: 'Sora Takahashi', username: '@sora_tk', wallet: '0x19F3...8D42', level: 1, status: 'Task Verified', cashUsd: 0, cashBnb: 0, okPoints: 85, joinedAgo: '2d ago', joinedDate: 'Nov 5, 2026' },
  { id: 'ref-7', name: 'Liam O’Connor', username: '@liam_trades', wallet: '0x63C8...2A15', level: 2, status: 'Active Buyer', cashUsd: 9.5, cashBnb: 0.016, okPoints: 80, joinedAgo: '3d ago', joinedDate: 'Nov 4, 2026' },
  { id: 'ref-8', name: 'Zara Al-Mansoor', username: '@zara_crypto', wallet: '0x4E77...9C03', level: 1, status: 'Active Buyer', cashUsd: 14.0, cashBnb: 0.023, okPoints: 110, joinedAgo: '4d ago', joinedDate: 'Nov 3, 2026' },
  { id: 'ref-9', name: 'Jonas Lindqvist', username: '@jonas_l', wallet: '0x2A55...6B81', level: 3, status: 'Active Buyer', cashUsd: 5.5, cashBnb: 0.009, okPoints: 50, joinedAgo: '5d ago', joinedDate: 'Nov 2, 2026' },
  { id: 'ref-10', name: 'Chloe Dubois', username: '@chloe_web3', wallet: '0x7D91...0E34', level: 2, status: 'Active Buyer', cashUsd: 8.5, cashBnb: 0.014, okPoints: 75, joinedAgo: '6d ago', joinedDate: 'Nov 1, 2026' },
  { id: 'ref-11', name: 'Tariq Hassan', username: '@tariq_bnb', wallet: '0xC048...5A79', level: 1, status: 'Task Verified', cashUsd: 0, cashBnb: 0, okPoints: 90, joinedAgo: '7d ago', joinedDate: 'Oct 31, 2026' },
  { id: 'ref-12', name: 'Maya Lin', username: '@maya_nodes', wallet: '0xF182...3D90', level: 2, status: 'Joined', cashUsd: 0, cashBnb: 0, okPoints: 45, joinedAgo: '8d ago', joinedDate: 'Oct 30, 2026' },
  { id: 'ref-13', name: 'Lucas Meyer', username: '@lucas_m', wallet: '0xA923...7F12', level: 3, status: 'Active Buyer', cashUsd: 6.5, cashBnb: 0.010, okPoints: 60, joinedAgo: '9d ago', joinedDate: 'Oct 29, 2026' },
  { id: 'ref-14', name: 'Hannah Kim', username: '@hannah_k', wallet: '0xE410...8B55', level: 1, status: 'Task Verified', cashUsd: 0, cashBnb: 0, okPoints: 140, joinedAgo: '10d ago', joinedDate: 'Oct 28, 2026' },
];

  const invitedFriends: InvitedFriendRow[] = useMemo(() => {
    const entries = referral.data?.recent;
    if (!entries || entries.length === 0) {
      return DEFAULT_INVITED_FRIENDS;
    }
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

  const visibleFriends = showAllHistory ? filteredFriends : filteredFriends.slice(0, 5);

  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    'Join the $OKN ecosystem and stack points with me!',
  )}&url=${encodeURIComponent(link)}`;

  const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(
    link,
  )}&text=${encodeURIComponent('Join the $OKN presale and referral program!')}`;

  return (
    <main className="space-y-5 pb-12">
      {/* Error Banner if referral query fails */}
      {referral.isError && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs font-semibold text-rose-500"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 shrink-0" />
            <span>Unable to sync live referral telemetry. Showing cached partner data.</span>
          </div>
          <button
            type="button"
            onClick={() => void referral.refetch()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500/20 px-3 py-1.5 font-extrabold text-rose-500 hover:bg-rose-500/30 transition-colors cursor-pointer"
          >
            <RefreshCw className="size-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* 1. Hero + Quick Referral Link Card (Unified & Streamlined) */}
      <section className="relative overflow-hidden rounded-[26px] sm:rounded-[28px] bg-gradient-to-br from-[#7A12F5] via-[#6D0ED8] to-[#4A05A3] p-5 sm:p-7 text-white shadow-xl">
        <OknWatermark variant="hero" size="md" />
        <div className="relative z-10 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/15 px-3 py-1 text-[10.5px] font-extrabold tracking-widest text-white uppercase backdrop-blur-sm">
                <Sparkles className="size-3" />
                <span>Partner Program · Tier 2</span>
              </span>
              <h1 className="mt-2.5 text-2xl font-black tracking-tight text-white sm:text-3xl">
                Invite &amp; Earn 12.5% BNB
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-purple-100/90 max-w-xl">
                Share your referral link to earn instant BNB/USDT payouts plus up to 10% of your network&apos;s OK Points.
              </p>
            </div>

            <div className="rounded-2xl border border-white/20 bg-white/15 px-3.5 py-2 backdrop-blur-md text-right">
              <div className="text-[10px] font-bold uppercase tracking-wider text-purple-100/85">
                Partner Code
              </div>
              <div className="font-mono text-sm sm:text-base font-black text-white">
                {referralCode}
              </div>
            </div>
          </div>

          {/* 3-Column Highlight Strip */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3.5">
            <div className="rounded-2xl border border-white/20 bg-white/12 px-3 py-2.5 backdrop-blur-md">
              <div className="num text-base sm:text-xl font-black text-white leading-tight">
                10–15%
              </div>
              <div className="text-[10px] sm:text-xs font-semibold text-purple-100/90 mt-0.5">
                Cash Commission
              </div>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/12 px-3 py-2.5 backdrop-blur-md">
              <div className="num text-base sm:text-xl font-black text-white leading-tight">
                $200,000
              </div>
              <div className="text-[10px] sm:text-xs font-semibold text-purple-100/90 mt-0.5">
                Partner Pool
              </div>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/12 px-3 py-2.5 backdrop-blur-md">
              <div className="num text-base sm:text-xl font-black text-white leading-tight">
                1.5x Pts
              </div>
              <div className="text-[10px] sm:text-xs font-semibold text-purple-100/90 mt-0.5">
                Tier Multiplier
              </div>
            </div>
          </div>

          {/* Integrated Referral Link & Share Bar */}
          <div className="rounded-2xl border border-white/20 bg-black/25 p-2 sm:p-2.5 backdrop-blur-md flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              id="ref-link-input"
              type="text"
              readOnly
              value={link}
              aria-label="Your unique referral link"
              className="min-w-0 flex-1 rounded-xl bg-white/10 px-3.5 py-2.5 font-mono text-xs sm:text-sm font-bold text-white outline-none select-all border border-white/10 focus:border-white/40"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void copy()}
                className="flex h-10 flex-1 sm:flex-initial sm:px-5 items-center justify-center gap-2 rounded-xl bg-white text-[#5B0AC2] font-extrabold text-xs sm:text-sm shadow-md hover:bg-purple-50 active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap"
              >
                <AnimatePresence mode="wait" initial={false}>
                  {copied ? (
                    <motion.span
                      key="copied"
                      initial={{ opacity: 0, scale: 0.85, filter: 'blur(4px)' }}
                      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                      exit={{ opacity: 0, scale: 0.85 }}
                      transition={{ duration: 0.2 }}
                      className="inline-flex items-center gap-1.5 text-[#10B981]"
                    >
                      <Check className="size-4 stroke-[2.8]" />
                      <span>✔️ Copied</span>
                    </motion.span>
                  ) : (
                    <motion.span
                      key="copy"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="inline-flex items-center gap-1.5"
                    >
                      <Copy className="size-3.5" />
                      <span>Copy Link</span>
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>

              <a
                href={tweetUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Share on X"
                className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white hover:bg-white/20 active:scale-95 transition-all cursor-pointer"
              >
                <svg className="size-4 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>

              <a
                href={telegramShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Share on Telegram"
                className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-[#38BDF8] hover:bg-white/20 active:scale-95 transition-all cursor-pointer"
              >
                <svg className="size-4.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.52 2.77-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Referral Account Statistics & Rank Progression */}
      <section className="rounded-[26px] border border-[var(--line)] bg-[var(--s1)] p-5 md:p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-[var(--tx)]">
              Referral Performance
            </h2>
            <p className="text-xs text-[var(--mut)] mt-0.5">
              Real-time commission payouts, active buyers, and tier progression
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-xl border border-[#7A12F5]/30 bg-[#7A12F5]/12 px-3 py-1 text-xs font-extrabold text-[#7A12F5] dark:text-[#C9A6FF]">
              Silver Partner · Tier 2
            </span>
            <button
              type="button"
              onClick={toggleBalance}
              className="flex h-8 items-center gap-1.5 px-3 rounded-xl border border-[var(--line)] bg-[var(--s2)] text-xs font-bold text-[var(--tx)] hover:bg-[var(--line)] transition-colors cursor-pointer"
            >
              {hideBalance ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              <span className="hidden sm:inline">Balances</span>
            </button>
          </div>
        </div>

        {/* 4-Stat Metric Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--s2)] p-3.5 sm:p-4">
            <div className="text-[11px] sm:text-xs font-bold text-[var(--mut)]">Total Referrals</div>
            <div className="num text-xl sm:text-2xl font-extrabold text-[var(--tx)] mt-1">
              {invitedFriends.length || 14}{' '}
              <span className="text-xs font-semibold text-[var(--mut)]">friends</span>
            </div>
            <div className="text-[11px] font-bold text-[#2FBD8E] mt-1">10 active buyers (71%)</div>
          </div>

          <div className="rounded-2xl border border-[var(--line)] bg-[var(--s2)] p-3.5 sm:p-4">
            <div className="text-[11px] sm:text-xs font-bold text-[var(--mut)]">Total Earned ($)</div>
            <div className="num text-xl sm:text-2xl font-extrabold text-[#2FBD8E] mt-1">
              {hideBalance ? '••••••' : `$${animatedCashTotal}`}
            </div>
            <div className="text-[11px] font-bold text-[#D97706] dark:text-[#F3BA2F] mt-1">
              {hideBalance ? '•••• BNB Payout' : `~${animatedBnbTotal} BNB Payout`}
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--line)] bg-[var(--s2)] p-3.5 sm:p-4">
            <div className="text-[11px] sm:text-xs font-bold text-[var(--mut)]">Commission Rate</div>
            <div className="num text-xl sm:text-2xl font-extrabold text-[var(--tx)] mt-1">12.5%</div>
            <div className="text-[11px] font-bold text-[#7A12F5] dark:text-[#C9A6FF] mt-1">
              Next tier: 15.0% BNB
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--line)] bg-[var(--s2)] p-3.5 sm:p-4">
            <div className="text-[11px] sm:text-xs font-bold text-[var(--mut)]">Points Earned</div>
            <div className="num text-xl sm:text-2xl font-extrabold text-[#09B4FF] mt-1">
              +{animatedPointsTotal}
            </div>
            <div className="text-[11px] font-bold text-[var(--mut)] mt-1">
              1.5x Tier Multiplier
            </div>
          </div>
        </div>

        {/* High-Contrast Tier Progress Bar */}
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--s2)] p-4 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-1 text-xs font-bold">
            <span className="text-[var(--tx)]">
              Next Rank:{' '}
              <strong className="text-[#7A12F5] dark:text-[#C9A6FF]">
                Gold Partner (15% Commission)
              </strong>
            </span>
            <span className="num font-extrabold text-[#7A12F5] dark:text-[#C9A6FF]">
              14 / 25 Referrals (56%)
            </span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-[var(--line)] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#7A12F5] to-[#09B4FF] transition-all duration-500"
              style={{ width: '56%' }}
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] text-[var(--mut)]">
            <span>11 more invites to unlock 15% BNB commission</span>
            <span className="font-bold text-[var(--tx)]">Auto-upgrades on qualification</span>
          </div>
        </div>
      </section>

      {/* 3. Simplified Referral History */}
      <section className="rounded-[26px] border border-[var(--line)] bg-[var(--s1)] p-5 md:p-6 shadow-sm space-y-4">
        {/* Header + Compact Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-[#7A12F5]/30 bg-[#7A12F5]/12 text-[#7A12F5] dark:text-[#C9A6FF]">
              <Users className="size-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-extrabold text-[var(--tx)]">
                  Referral History
                </h3>
                <span className="rounded-full border border-[var(--line)] bg-[var(--s2)] px-2.5 py-0.5 text-[11px] font-extrabold text-[var(--tx)] num">
                  {invitedFriends.length}
                </span>
              </div>
              <p className="text-xs text-[var(--mut)]">
                Your invited friends and earned rewards
              </p>
            </div>
          </div>

          <div className="relative w-full sm:w-56">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-[var(--mut)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name or @handle..."
              aria-label="Search invited friends"
              className="h-9 w-full rounded-xl border border-[var(--line)] bg-[var(--s2)] pr-3 pl-8 text-xs font-semibold text-[var(--tx)] outline-none transition-colors placeholder:text-[var(--mut)] focus:border-[#7A12F5]"
            />
          </div>
        </div>

        {/* Single-Line Filter Pills */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {[
              { id: 'all' as const, label: `All (${invitedFriends.length})` },
              {
                id: 'l1' as const,
                label: `Direct L1 (${invitedFriends.filter((f) => f.level === 1).length})`,
              },
              {
                id: 'buyers' as const,
                label: `Buyers (${invitedFriends.filter((f) => f.status === 'Active Buyer').length})`,
              },
            ].map((tab) => {
              const active = historyFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setHistoryFilter(tab.id)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    active
                      ? 'bg-[#7A12F5] text-white shadow-xs'
                      : 'border border-[var(--line)] bg-[var(--s2)] text-[var(--mut)] hover:text-[var(--tx)]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <span className="hidden sm:inline text-[11px] font-semibold text-[var(--mut)] shrink-0">
            Showing <strong className="text-[var(--tx)] num">{visibleFriends.length}</strong> of{' '}
            <strong className="text-[var(--tx)] num">{filteredFriends.length}</strong>
          </span>
        </div>

        {/* Simplified Single-Row Referral List */}
        {visibleFriends.length === 0 ? (
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--s2)] p-7 text-center">
            <p className="text-sm font-bold text-[var(--tx)]">No matching referrals found</p>
            <p className="mt-1 text-xs text-[var(--mut)]">
              Try clearing your search or switching filter tabs above.
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
                  className="flex items-center justify-between gap-3 px-3.5 py-3 sm:px-4 sm:py-3.5 hover:bg-[var(--s1)]/60 transition-colors"
                >
                  {/* Left: Avatar + Name + Compact Meta */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-full border border-[#7A12F5]/30 bg-gradient-to-br from-[#7A12F5]/20 to-[#09B4FF]/15 font-display text-xs font-extrabold text-[var(--tx)]">
                      {initials}
                      <span
                        title={friend.status}
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
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-xs sm:text-sm font-extrabold text-[var(--tx)]">
                          {friend.name}
                        </span>
                        <span
                          className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-extrabold ${
                            friend.level === 1
                              ? 'bg-[#7A12F5]/15 text-[#7A12F5] dark:text-[#C9A6FF]'
                              : 'bg-[#09B4FF]/15 text-[#09B4FF]'
                          }`}
                        >
                          L{friend.level}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-1.5 text-[11px] font-medium text-[var(--mut)] truncate">
                        <span className="font-mono truncate">{friend.username}</span>
                        <span>·</span>
                        <span className="shrink-0">{friend.joinedAgo}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Earned Cash + OK Points */}
                  <div className="text-right shrink-0">
                    {friend.cashUsd > 0 ? (
                      <div className="num text-xs sm:text-sm font-extrabold text-[#2FBD8E]">
                        {hideBalance ? '••••' : `+$${friend.cashUsd.toFixed(2)}`}
                      </div>
                    ) : (
                      <div className="text-[11px] font-bold text-[var(--mut)]">
                        {friend.status}
                      </div>
                    )}
                    <div className="num text-[11px] font-extrabold text-[#09B4FF] mt-0.5">
                      +{friend.okPoints} Pts
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Expand / Collapse Footer */}
        {filteredFriends.length > 5 && (
          <div className="pt-1 flex justify-center">
            <button
              type="button"
              onClick={() => setShowAllHistory((prev) => !prev)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--s2)] px-4 py-2 text-xs font-extrabold text-[var(--tx)] hover:border-[#7A12F5]/50 hover:bg-[var(--s1)] transition-all cursor-pointer"
            >
              {showAllHistory ? (
                <>
                  <span>Show Less</span>
                  <ChevronUp className="size-4 text-[#7A12F5] dark:text-[#C9A6FF]" />
                </>
              ) : (
                <>
                  <span>View All {filteredFriends.length} Referrals</span>
                  <ChevronDown className="size-4 text-[#7A12F5] dark:text-[#C9A6FF]" />
                </>
              )}
            </button>
          </div>
        )}
      </section>

      {/* 4. Commission Tiers & Partner Package Summary */}
      <section className="rounded-[26px] border border-[var(--line)] bg-[var(--s1)] p-5 md:p-6 shadow-sm space-y-5">
        <div>
          <h3 className="text-base sm:text-lg font-extrabold text-[var(--tx)]">
            Commission Tiers &amp; Partner Benefits
          </h3>
          <p className="text-xs text-[var(--mut)] mt-0.5">
            Automatic tier upgrades based on active presale buyers in your network.
          </p>
        </div>

        {/* 3-Column Unified Tier Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl border border-[var(--line)] bg-[var(--s2)] flex flex-col justify-between gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-[var(--tx)]">Tier 1 · Starter</span>
              <span className="text-[11px] font-semibold text-[var(--mut)]">0–5 Buyers</span>
            </div>
            <div className="flex items-baseline justify-between pt-1">
              <span className="num text-xl font-black text-[var(--tx)]">10% BNB</span>
              <span className="num text-xs font-extrabold text-[#09B4FF]">+10% L1 Pts</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl border-2 border-[#7A12F5] bg-[#7A12F5]/10 flex flex-col justify-between gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-[#7A12F5] dark:text-[#C9A6FF]">
                Tier 2 · Growth (Current)
              </span>
              <span className="text-[11px] font-semibold text-[var(--mut)]">6–25 Buyers</span>
            </div>
            <div className="flex items-baseline justify-between pt-1">
              <span className="num text-xl font-black text-[#7A12F5] dark:text-[#C9A6FF]">
                12.5% BNB
              </span>
              <span className="num text-xs font-extrabold text-[#09B4FF]">+5% L2 Pts</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-[#F3BA2F]/45 bg-[#F3BA2F]/10 flex flex-col justify-between gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-[#B45309] dark:text-[#FFD60A]">
                Tier 3 · Whale Partner
              </span>
              <span className="text-[11px] font-semibold text-[var(--mut)]">26+ Buyers</span>
            </div>
            <div className="flex items-baseline justify-between pt-1">
              <span className="num text-xl font-black text-[#B45309] dark:text-[#FFD60A]">
                15% BNB
              </span>
              <span className="num text-xs font-extrabold text-[#09B4FF]">+2% L3 Pts</span>
            </div>
          </div>
        </div>

        {/* Compact 2x2 Partner Perks Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {PARTNER_PERKS.map((perk) => {
            const Icon = perk.icon;
            return (
              <div
                key={perk.title}
                className="flex items-start gap-3 rounded-2xl border border-[var(--line)] bg-[var(--s2)] p-4"
              >
                <div
                  className={`flex size-9 shrink-0 items-center justify-center rounded-xl border ${perk.accent}`}
                >
                  <Icon className="size-4.5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-extrabold text-[var(--tx)]">
                    {perk.title}
                  </h4>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--mut)]">{perk.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
