'use client';

/**
 * Clean card-based Whale Leaderboard item modeled on the reference card
 * architecture, adapted to OKN theme tokens for both light & dark modes.
 */
import { useState } from 'react';
import { ArrowRight, BadgeCheck, Star, Trophy, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  buildDeterministicSparkline,
  formatCompactUsd,
  formatSignedPct,
  type LiveLeaderboardTrader,
} from '@/lib/polymarket/leaderboard';
import type { CopierSubscription } from './copier-hooks';
import { SparklineChart } from './sparkline-chart';

interface WhaleAvatarProps {
  name: string;
  imageUrl: string | null;
  toneClass: string;
  size?: 'sm' | 'md' | 'lg';
}

export function WhaleAvatar({
  name,
  imageUrl,
  toneClass,
  size = 'md',
}: WhaleAvatarProps) {
  const [failed, setFailed] = useState(false);

  const dims =
    size === 'lg'
      ? 'size-13 text-base'
      : size === 'sm'
        ? 'size-9 text-xs'
        : 'size-11 text-sm';

  const initials = name.replace(/^[@0x]+/i, '').slice(0, 2).toUpperCase() || 'PM';

  if (imageUrl && !failed) {
    return (
      <img
        src={imageUrl}
        alt={name}
        referrerPolicy="no-referrer"
        loading="lazy"
        onError={() => setFailed(true)}
        className={cn(
          'shrink-0 rounded-full object-cover ring-2 ring-[var(--line)] bg-[var(--s2)]',
          dims,
        )}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        'shrink-0 rounded-full bg-gradient-to-br flex items-center justify-center font-extrabold text-white ring-2 ring-black/5 dark:ring-white/10 select-none',
        toneClass,
        dims,
      )}
    >
      {initials}
    </span>
  );
}

interface WhaleCardProps {
  trader: LiveLeaderboardTrader;
  subscription?: CopierSubscription;
  isFavorite: boolean;
  onToggleFavorite: (address: string) => void;
  onOpenDetails: (trader: LiveLeaderboardTrader) => void;
}

export function WhaleCard({
  trader,
  subscription,
  isFavorite,
  onToggleFavorite,
  onOpenDetails,
}: WhaleCardProps) {
  const positive = trader.pnlUsd >= 0;
  const sparkPoints = buildDeterministicSparkline(
    trader.address,
    trader.pnlUsd,
    trader.volumeUsd,
  );
  const isCopied = Boolean(subscription && subscription.status !== 'stopped');
  const isLive = subscription?.status === 'live';

  return (
    <article
      data-testid="whale-card"
      className={cn(
        'group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-gradient-to-b from-[var(--s1)] via-[var(--s1)] transition-all duration-200',
        isLive
          ? 'border-[#10B981]/50 to-[#10B981]/[0.08] dark:to-[#10B981]/[0.12] shadow-xs'
          : 'border-[#7A12F5]/22 hover:border-[#7A12F5]/55 dark:border-[#7A12F5]/30 dark:hover:border-[#9B4DFF]/65 to-[#7A12F5]/[0.07] dark:to-[#7A12F5]/[0.14] hover:shadow-md',
      )}
    >
      {/* Top Section: Header */}
      <div className="p-4 sm:p-5 pb-3.5 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <WhaleAvatar
            name={trader.displayName}
            imageUrl={trader.profileImage}
            toneClass={trader.avatarTone}
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <h3 className="truncate text-[15px] sm:text-base font-extrabold tracking-tight text-[var(--tx)]">
                {trader.displayName}
              </h3>
              {trader.verified && (
                <BadgeCheck
                  className="size-4 shrink-0 text-[#7A12F5] dark:text-[#A855F7]"
                  aria-label="Verified Polymarket profile"
                />
              )}
            </div>
            <div className="mt-0.5 flex items-center gap-2 text-xs text-[var(--mut)] tabular-nums">
              <span className="inline-flex items-center gap-1 font-semibold">
                <Trophy className="size-3.5 text-[var(--mut)]" aria-hidden="true" />
                <span>#{trader.rank}</span>
              </span>
              {trader.xUsername ? (
                <span className="truncate max-w-[110px]">@{trader.xUsername}</span>
              ) : isCopied ? (
                <span className="inline-flex items-center gap-1 text-[#10B981] font-semibold">
                  <Users className="size-3" aria-hidden="true" />
                  <span>{isLive ? 'Copying live' : 'Preview'}</span>
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(trader.address);
          }}
          aria-pressed={isFavorite}
          aria-label={
            isFavorite
              ? `Remove ${trader.displayName} from watchlist`
              : `Add ${trader.displayName} to watchlist`
          }
          className={cn(
            'size-9 shrink-0 rounded-xl border flex items-center justify-center transition-colors cursor-pointer',
            isFavorite
              ? 'border-[#F59E0B]/40 bg-[#F59E0B]/10 text-[#D97706] dark:text-[#FBBF24]'
              : 'border-[var(--line)] bg-[var(--s1)] text-[var(--mut)] hover:text-[var(--tx)] hover:border-[var(--mut)]/40',
          )}
        >
          <Star
            className={cn('size-4', isFavorite && 'fill-current')}
            aria-hidden="true"
          />
        </button>
      </div>

      {/* Hairline Divider */}
      <div className="mx-4 sm:mx-5 border-t border-[var(--line)]/80" />

      {/* Middle Section: Total PnL + Sparkline */}
      <div className="px-4 sm:px-5 py-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-[var(--mut)]">Total PnL</p>
          <p
            className={cn(
              'mt-1 text-xl sm:text-[22px] font-extrabold tracking-tight tabular-nums leading-none',
              positive
                ? 'text-[#059669] dark:text-[#10B981]'
                : 'text-[#E11D48] dark:text-[#F43F5E]',
            )}
          >
            {formatCompactUsd(trader.pnlUsd, true)}
          </p>
        </div>

        <SparklineChart
          values={sparkPoints}
          positive={positive}
          ariaLabel={`${trader.displayName} ${positive ? 'positive' : 'negative'} PnL curve`}
        />
      </div>

      {/* Hairline Divider */}
      <div className="mx-4 sm:mx-5 border-t border-[var(--line)]/80" />

      {/* Secondary Metric + Footer CTA (sitting over soft tinted wash) */}
      <div className="px-4 sm:px-5 pt-3.5 pb-4 sm:pb-5 space-y-4">
        <div>
          <p className="text-base sm:text-lg font-extrabold tracking-tight text-[var(--tx)] tabular-nums leading-tight">
            {formatCompactUsd(trader.volumeUsd)}
          </p>
          <div className="mt-1 flex items-center gap-2 text-xs text-[var(--mut)]">
            <span>Volume</span>
            <span
              className={cn(
                'inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] font-bold tabular-nums',
                positive
                  ? 'border-[#10B981]/25 bg-[#10B981]/10 text-[#059669] dark:text-[#34D399]'
                  : 'border-[#F43F5E]/25 bg-[#F43F5E]/10 text-[#E11D48] dark:text-[#FB7185]',
              )}
            >
              ROI {formatSignedPct(trader.roiPct)}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onOpenDetails(trader)}
          data-testid="whale-details-btn"
          className={cn(
            'w-full h-11 rounded-xl border px-4 text-sm font-bold transition-all cursor-pointer inline-flex items-center justify-center gap-2 shadow-xs active:scale-[0.985]',
            isLive
              ? 'border-[#10B981]/40 bg-[var(--s1)] text-[#059669] dark:text-[#34D399] hover:bg-[#10B981]/10'
              : 'border-[var(--line)] bg-[var(--s1)] text-[var(--tx)] hover:border-[#7A12F5]/50 hover:text-[#7A12F5] dark:hover:text-[#C084FC]',
          )}
        >
          {isCopied && (
            <span
              aria-hidden="true"
              className={cn(
                'size-2 rounded-full',
                isLive ? 'bg-[#10B981]' : 'bg-[#7A12F5]',
              )}
            />
          )}
          <span>{isLive ? 'Copying · Details' : 'Details'}</span>
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </article>
  );
}

export function WhaleCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="rounded-2xl border border-[var(--line)] bg-[var(--s1)] p-4 sm:p-5 space-y-4 animate-pulse"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-full bg-[var(--s2)]" />
          <div className="space-y-2">
            <div className="h-4 w-28 rounded bg-[var(--s2)]" />
            <div className="h-3 w-16 rounded bg-[var(--s2)]" />
          </div>
        </div>
        <div className="size-9 rounded-xl bg-[var(--s2)]" />
      </div>
      <div className="border-t border-[var(--line)]/70" />
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-3 w-14 rounded bg-[var(--s2)]" />
          <div className="h-6 w-24 rounded bg-[var(--s2)]" />
        </div>
        <div className="h-8 w-24 rounded bg-[var(--s2)]" />
      </div>
      <div className="border-t border-[var(--line)]/70" />
      <div className="space-y-3">
        <div className="space-y-1.5">
          <div className="h-5 w-20 rounded bg-[var(--s2)]" />
          <div className="h-3 w-28 rounded bg-[var(--s2)]" />
        </div>
        <div className="h-11 w-full rounded-xl bg-[var(--s2)]" />
      </div>
    </div>
  );
}
