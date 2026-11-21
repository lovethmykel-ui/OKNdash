'use client';

/**
 * Minimalist, high-craft Top-3 Whale Leader Card with subtle Framer Motion
 * hover scale + ambient glowing shadow, clean unboxed telemetry, and
 * podium rank typography.
 */
import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight, BadgeCheck, Check, Star } from 'lucide-react';
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
      ? 'size-12 text-base'
      : size === 'sm'
        ? 'size-8 text-xs'
        : 'size-10 text-xs';

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
          'shrink-0 rounded-full object-cover ring-1 ring-[var(--line)] bg-[var(--s2)]',
          dims,
        )}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        'shrink-0 rounded-full bg-gradient-to-br flex items-center justify-center font-extrabold text-white ring-1 ring-black/10 dark:ring-white/15 select-none',
        toneClass,
        dims,
      )}
    >
      {initials}
    </span>
  );
}

function rankAccent(rank: number): { label: string; textClass: string; barClass: string } {
  if (rank === 1) {
    return {
      label: '#1',
      textClass: 'text-[#D97706] dark:text-[#FBBF24]',
      barClass: 'bg-gradient-to-r from-[#F59E0B] via-[#7A12F5] to-transparent',
    };
  }
  if (rank === 2) {
    return {
      label: '#2',
      textClass: 'text-[#64748B] dark:text-[#CBD5E1]',
      barClass: 'bg-gradient-to-r from-[#94A3B8] via-[#7A12F5]/70 to-transparent',
    };
  }
  return {
    label: '#3',
    textClass: 'text-[#B45309] dark:text-[#F59E0B]/80',
    barClass: 'bg-gradient-to-r from-[#D97706]/80 via-[#7A12F5]/50 to-transparent',
  };
}

interface WhaleCardProps {
  trader: LiveLeaderboardTrader;
  categoryLabel?: string;
  subscription?: CopierSubscription;
  isFavorite: boolean;
  onToggleFavorite: (address: string) => void;
  onOpenDetails: (trader: LiveLeaderboardTrader) => void;
}

export function WhaleCard({
  trader,
  categoryLabel = 'All-Time',
  subscription,
  isFavorite,
  onToggleFavorite,
  onOpenDetails,
}: WhaleCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const positive = trader.pnlUsd >= 0;
  const sparkPoints = buildDeterministicSparkline(
    trader.address,
    trader.pnlUsd,
    trader.volumeUsd,
  );
  const isCopied = Boolean(subscription && subscription.status !== 'stopped');
  const isLive = subscription?.status === 'live';
  const rankMeta = rankAccent(trader.rank);

  const hoverBoxShadow = isLive
    ? '0 18px 40px -12px rgba(16, 185, 129, 0.28), 0 0 0 1px rgba(16, 185, 129, 0.45)'
    : '0 18px 40px -12px rgba(122, 18, 245, 0.24), 0 0 0 1px rgba(122, 18, 245, 0.40)';

  return (
    <motion.article
      data-testid="whale-card"
      whileHover={
        prefersReducedMotion
          ? undefined
          : {
              scale: 1.018,
              y: -3,
              boxShadow: hoverBoxShadow,
            }
      }
      whileTap={prefersReducedMotion ? undefined : { scale: 0.992 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28, mass: 0.75 }}
      className={cn(
        'group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-[var(--s1)] transition-colors duration-200 will-change-transform',
        isLive
          ? 'border-[#10B981]/50'
          : 'border-[var(--line)] hover:border-[#7A12F5]/45 dark:hover:border-[#9B4DFF]/55',
      )}
    >
      {/* Subtle 2px top podium accent line */}
      <div
        aria-hidden="true"
        className={cn(
          'h-[2px] w-full transition-opacity duration-200',
          isLive
            ? 'bg-gradient-to-r from-[#10B981] via-[#34D399] to-transparent opacity-100'
            : cn(rankMeta.barClass, 'opacity-55 group-hover:opacity-100'),
        )}
      />

      {/* Ambient hover sheen */}
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-x-0 top-0 h-24 opacity-0 transition-opacity duration-200 group-hover:opacity-100',
          isLive
            ? 'bg-gradient-to-b from-[#10B981]/[0.07] to-transparent'
            : 'bg-gradient-to-b from-[#7A12F5]/[0.06] to-transparent',
        )}
      />

      {/* Card Body */}
      <div className="relative p-5 flex flex-col gap-5 flex-1">
        {/* Identity Row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <WhaleAvatar
              name={trader.displayName}
              imageUrl={trader.profileImage}
              toneClass={trader.avatarTone}
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <h3 className="truncate text-[15px] font-bold tracking-tight text-[var(--tx)]">
                  {trader.displayName}
                </h3>
                {trader.verified && (
                  <BadgeCheck
                    className="size-4 shrink-0 text-[#7A12F5] dark:text-[#A855F7]"
                    aria-label="Verified profile"
                  />
                )}
              </div>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-[var(--mut)] tabular-nums truncate">
                <span className={cn('font-mono font-extrabold', rankMeta.textClass)}>
                  {rankMeta.label}
                </span>
                <span aria-hidden="true">·</span>
                <span className="truncate">
                  {trader.xUsername ? `@${trader.xUsername}` : categoryLabel}
                </span>
              </p>
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
              'size-8 shrink-0 rounded-lg flex items-center justify-center transition-colors cursor-pointer',
              isFavorite
                ? 'text-[#D97706] dark:text-[#FBBF24] bg-[#F59E0B]/10'
                : 'text-[var(--mut)] hover:text-[var(--tx)] hover:bg-[var(--s2)]',
            )}
          >
            <Star
              className={cn('size-4', isFavorite && 'fill-current')}
              aria-hidden="true"
            />
          </button>
        </div>

        {/* Dominant Metric + Precision Area Sparkline */}
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-[var(--mut)]">All-Time PnL</p>
            <p
              className={cn(
                'mt-1 font-mono text-2xl sm:text-[26px] font-extrabold tracking-tight tabular-nums leading-none',
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
            seed={trader.address}
            width={118}
            height={42}
            ariaLabel={`${trader.displayName} ${positive ? 'positive' : 'negative'} PnL curve`}
          />
        </div>

        {/* Unboxed Secondary Telemetry Strip (Zero pills) */}
        <dl className="grid grid-cols-2 gap-3 border-t border-[var(--line)] pt-3.5 text-xs">
          <div>
            <dt className="text-[11px] text-[var(--mut)]">Volume</dt>
            <dd className="mt-0.5 font-mono text-sm font-bold text-[var(--tx)] tabular-nums">
              {formatCompactUsd(trader.volumeUsd)}
            </dd>
          </div>
          <div className="text-right">
            <dt className="text-[11px] text-[var(--mut)]">Return</dt>
            <dd
              className={cn(
                'mt-0.5 font-mono text-sm font-bold tabular-nums',
                positive
                  ? 'text-[#059669] dark:text-[#10B981]'
                  : 'text-[#E11D48] dark:text-[#F43F5E]',
              )}
            >
              {formatSignedPct(trader.roiPct)}
            </dd>
          </div>
        </dl>
      </div>

      {/* Minimalist Action Footer */}
      <div className="relative px-5 pb-4">
        <button
          type="button"
          onClick={() => onOpenDetails(trader)}
          data-testid="whale-details-btn"
          className={cn(
            'w-full h-10 rounded-xl px-4 text-xs font-bold transition-colors cursor-pointer inline-flex items-center justify-between whitespace-nowrap',
            isLive
              ? 'bg-[#10B981]/12 text-[#059669] dark:text-[#34D399] hover:bg-[#10B981]/20'
              : isCopied
                ? 'bg-[#7A12F5]/12 text-[#7A12F5] dark:text-[#C084FC] hover:bg-[#7A12F5]/18'
                : 'bg-[var(--s2)] text-[var(--tx)] hover:bg-[#7A12F5] hover:text-white',
          )}
        >
          <span className="inline-flex items-center gap-1.5">
            {isLive && <Check className="size-3.5 stroke-[2.75]" aria-hidden="true" />}
            <span>
              {isLive
                ? 'Mirroring Live'
                : isCopied
                  ? 'Preview Connected'
                  : 'Inspect & Copy'}
            </span>
          </span>
          <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </button>
      </div>
    </motion.article>
  );
}

export function WhaleCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="rounded-2xl border border-[var(--line)] bg-[var(--s1)] p-5 space-y-5 animate-pulse"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-full bg-[var(--s2)]" />
          <div className="space-y-1.5">
            <div className="h-4 w-24 rounded bg-[var(--s2)]" />
            <div className="h-3 w-16 rounded bg-[var(--s2)]" />
          </div>
        </div>
        <div className="size-8 rounded-lg bg-[var(--s2)]" />
      </div>
      <div className="flex items-end justify-between">
        <div className="space-y-1.5">
          <div className="h-3 w-16 rounded bg-[var(--s2)]" />
          <div className="h-7 w-28 rounded bg-[var(--s2)]" />
        </div>
        <div className="h-10 w-28 rounded bg-[var(--s2)]" />
      </div>
      <div className="grid grid-cols-2 gap-3 border-t border-[var(--line)] pt-3.5">
        <div className="space-y-1.5">
          <div className="h-3 w-12 rounded bg-[var(--s2)]" />
          <div className="h-4 w-20 rounded bg-[var(--s2)]" />
        </div>
        <div className="space-y-1.5 flex flex-col items-end">
          <div className="h-3 w-12 rounded bg-[var(--s2)]" />
          <div className="h-4 w-16 rounded bg-[var(--s2)]" />
        </div>
      </div>
      <div className="h-10 w-full rounded-xl bg-[var(--s2)]" />
    </div>
  );
}
