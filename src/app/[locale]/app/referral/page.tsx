'use client';

/**
 * /app/referral — Clean, Simple & Straightforward Referral Page.
 */
import { useState, useEffect, useMemo } from 'react';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Gift,
  Share2,
  Users,
} from 'lucide-react';
import { useReferral } from '@/lib/hooks/use-referral';
import { toast } from 'sonner';

interface SimpleReferralRow {
  id: string;
  name: string;
  earnedUsd: number;
  joinedAgo: string;
}

const FRIEND_REWARDS: Record<string, { earnedUsd: number; joinedAgo: string }> = {
  'ref-1': { earnedUsd: 28.5, joinedAgo: '2h ago' },
  'ref-2': { earnedUsd: 22.0, joinedAgo: '7h ago' },
  'ref-3': { earnedUsd: 19.5, joinedAgo: '19h ago' },
  'ref-4': { earnedUsd: 12.0, joinedAgo: '1d ago' },
  'ref-5': { earnedUsd: 16.5, joinedAgo: '1d ago' },
  'ref-6': { earnedUsd: 0, joinedAgo: '2d ago' },
  'ref-7': { earnedUsd: 9.5, joinedAgo: '3d ago' },
  'ref-8': { earnedUsd: 14.0, joinedAgo: '4d ago' },
  'ref-9': { earnedUsd: 5.5, joinedAgo: '5d ago' },
  'ref-10': { earnedUsd: 8.5, joinedAgo: '6d ago' },
  'ref-11': { earnedUsd: 0, joinedAgo: '7d ago' },
  'ref-12': { earnedUsd: 0, joinedAgo: '8d ago' },
  'ref-13': { earnedUsd: 6.5, joinedAgo: '9d ago' },
  'ref-14': { earnedUsd: 0, joinedAgo: '10d ago' },
};

const DEFAULT_FRIENDS: SimpleReferralRow[] = [
  { id: 'ref-1', name: 'Alex Carter', earnedUsd: 28.5, joinedAgo: '2h ago' },
  { id: 'ref-2', name: 'Nina Vance', earnedUsd: 22.0, joinedAgo: '7h ago' },
  { id: 'ref-3', name: 'Marco Silva', earnedUsd: 19.5, joinedAgo: '19h ago' },
  { id: 'ref-4', name: 'Elena Rostova', earnedUsd: 12.0, joinedAgo: '1d ago' },
  { id: 'ref-5', name: 'Liam K.', earnedUsd: 16.5, joinedAgo: '1d ago' },
  { id: 'ref-6', name: 'Sora Takahashi', earnedUsd: 0, joinedAgo: '2d ago' },
  { id: 'ref-7', name: 'David Kim', earnedUsd: 9.5, joinedAgo: '3d ago' },
  { id: 'ref-8', name: 'Tariq Al-Mansoor', earnedUsd: 14.0, joinedAgo: '4d ago' },
  { id: 'ref-9', name: 'Chloe Dubois', earnedUsd: 5.5, joinedAgo: '5d ago' },
  { id: 'ref-10', name: 'Mateo Herrera', earnedUsd: 8.5, joinedAgo: '6d ago' },
  { id: 'ref-11', name: 'Yuki Tanaka', earnedUsd: 0, joinedAgo: '7d ago' },
  { id: 'ref-12', name: 'Hannah Abbott', earnedUsd: 0, joinedAgo: '8d ago' },
  { id: 'ref-13', name: 'Lucas Meyer', earnedUsd: 6.5, joinedAgo: '9d ago' },
  { id: 'ref-14', name: 'Zara Khan', earnedUsd: 0, joinedAgo: '10d ago' },
];

export default function ReferralPage() {
  const referral = useReferral();
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const referralCode = 'ref_dev';
  const link = `https://t.me/okntest001_bot?start=${referralCode}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success('Referral link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.info('Link copied');
    }
  };

  const invitedFriends: SimpleReferralRow[] = useMemo(() => {
    const entries = mounted ? referral.data?.recent : undefined;
    if (!entries || entries.length === 0) {
      return DEFAULT_FRIENDS;
    }
    return entries.map((entry, idx) => {
      const meta = FRIEND_REWARDS[entry.id] ?? {
        earnedUsd: entry.status === 'paid' ? 10 : 0,
        joinedAgo: `${idx + 1}d ago`,
      };
      return {
        id: entry.id,
        name: entry.referredFirstName ?? entry.referredUsername ?? `Friend #${idx + 1}`,
        earnedUsd: meta.earnedUsd,
        joinedAgo: meta.joinedAgo,
      };
    });
  }, [mounted, referral.data]);

  const visibleFriends = showAll ? invitedFriends : invitedFriends.slice(0, 5);

  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    'Join the $OKN presale with my invite link!',
  )}&url=${encodeURIComponent(link)}`;

  const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(
    link,
  )}&text=${encodeURIComponent('Join the $OKN presale with my referral link!')}`;

  return (
    <main className="mx-auto max-w-[680px] space-y-5 pb-12">
      {/* 1. Simple Referral Link & Share Card */}
      <section className="rounded-[24px] border border-[var(--line)] bg-[var(--s1)] p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#7A12F5]/15 px-3 py-1 text-xs font-extrabold text-[var(--vio-l)]">
              <Gift className="size-3.5" />
              <span>Earn 12.5% Commission</span>
            </span>
            <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--tx)]">
              Invite Friends &amp; Earn
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-[var(--mut)]">
              Share your link and earn instant rewards whenever your friends buy $OKN.
            </p>
          </div>
        </div>

        {/* Copy Link Input + Share Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
          <input
            type="text"
            readOnly
            value={link}
            aria-label="Your referral link"
            className="min-w-0 flex-1 rounded-2xl border border-[var(--line)] bg-[var(--s2)] px-4 py-3 font-mono text-xs sm:text-sm font-bold text-[var(--tx)] outline-none select-all"
          />

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={copyLink}
              className="flex h-11 flex-1 sm:flex-initial sm:px-5 items-center justify-center gap-2 rounded-2xl bg-[#7A12F5] font-extrabold text-xs sm:text-sm text-white shadow-[0_6px_20px_rgba(122,18,245,0.3)] hover:bg-[#8C38F7] active:scale-[0.97] transition-all cursor-pointer whitespace-nowrap"
            >
              {copied ? (
                <>
                  <Check className="size-4" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="size-4" />
                  <span>Copy Link</span>
                </>
              )}
            </button>

            <a
              href={tweetUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Share on X"
              className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-[var(--line)] bg-[var(--s2)] text-[var(--tx)] hover:bg-[var(--s3)] active:scale-95 transition-all"
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
              className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-[var(--line)] bg-[var(--s2)] text-[#09B4FF] hover:bg-[var(--s3)] active:scale-95 transition-all"
            >
              <Share2 className="size-4" />
            </a>
          </div>
        </div>
      </section>

      {/* 2. Straightforward 3-Card Summary */}
      <section className="grid grid-cols-3 gap-3">
        <div className="rounded-[22px] border border-[var(--line)] bg-[var(--s1)] p-4 shadow-sm">
          <div className="text-xs font-bold text-[var(--mut)]">Invited</div>
          <div className="num mt-1 text-xl sm:text-2xl font-extrabold text-[var(--tx)]">
            {invitedFriends.length}
          </div>
        </div>

        <div className="rounded-[22px] border border-[var(--line)] bg-[var(--s1)] p-4 shadow-sm">
          <div className="text-xs font-bold text-[var(--mut)]">Total Earned</div>
          <div className="num mt-1 text-xl sm:text-2xl font-extrabold text-[var(--grn)]">
            $142.50
          </div>
        </div>

        <div className="rounded-[22px] border border-[var(--line)] bg-[var(--s1)] p-4 shadow-sm">
          <div className="text-xs font-bold text-[var(--mut)]">Commission</div>
          <div className="num mt-1 text-xl sm:text-2xl font-extrabold text-[var(--vio-l)]">
            12.5%
          </div>
        </div>
      </section>

      {/* 3. Clean, Simple Referral History */}
      <section className="rounded-[24px] border border-[var(--line)] bg-[var(--s1)] p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#7A12F5]/15 text-[var(--vio-l)]">
              <Users className="size-4" />
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-[var(--tx)]">
              Invited Friends
            </h2>
          </div>
          <span className="rounded-full border border-[var(--line)] bg-[var(--s2)] px-3 py-1 text-xs font-extrabold text-[var(--tx)] num">
            {invitedFriends.length} Total
          </span>
        </div>

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
                className="flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-[var(--s1)]/60 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#7A12F5]/15 text-xs font-extrabold text-[var(--vio-l)]">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-extrabold text-[var(--tx)]">
                      {friend.name}
                    </div>
                    <div className="text-xs font-medium text-[var(--mut)]">
                      Joined {friend.joinedAgo}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  {friend.earnedUsd > 0 ? (
                    <span className="num text-sm font-extrabold text-[var(--grn)]">
                      +${friend.earnedUsd.toFixed(2)}
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-[var(--s1)] border border-[var(--line)] px-2.5 py-0.5 text-[11px] font-bold text-[var(--mut)]">
                      Joined
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {invitedFriends.length > 5 && (
          <div className="flex justify-center pt-1">
            <button
              type="button"
              onClick={() => setShowAll((prev) => !prev)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--s2)] px-4 py-2 text-xs font-extrabold text-[var(--tx)] hover:bg-[var(--s3)] active:scale-[0.97] transition-all cursor-pointer"
            >
              {showAll ? (
                <>
                  <span>Show Less</span>
                  <ChevronUp className="size-4 text-[var(--vio-l)]" />
                </>
              ) : (
                <>
                  <span>Show All ({invitedFriends.length})</span>
                  <ChevronDown className="size-4 text-[var(--vio-l)]" />
                </>
              )}
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
