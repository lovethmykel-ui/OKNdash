/**
 * dashboard/stat-card.tsx — KPI card with tinted icon, label, tabular value.
 */
import { Share2, type LucideIcon } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

const TINTS = {
  blue: 'bg-[rgba(9,180,255,0.12)] text-[#09B4FF]',
  green: 'bg-[rgba(47,189,142,0.14)] text-[#2FBD8E]',
  orange: 'bg-[rgba(255,170,0,0.15)] text-[#FFAA00]',
  indigo: 'bg-[rgba(122,18,245,0.14)] text-[#C9A6FF]',
  red: 'bg-red-500/15 text-red-500',
  gray: 'bg-zinc-500/15 text-zinc-400',
} as const;

export type StatTint = keyof typeof TINTS;

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tint = 'blue',
  onShare,
  shareAriaLabel,
  href,
  dataTestId,
}: {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  hint?: string;
  tint?: StatTint;
  onShare?: () => void;
  shareAriaLabel?: string;
  href?: string;
  dataTestId?: string;
}) {
  const topContent = (
    <div className="flex items-center gap-3.5 min-w-0">
      <span
        className={cn(
          'flex size-11 shrink-0 items-center justify-center rounded-[14px] transition-transform duration-200 group-hover:scale-105',
          TINTS[tint],
        )}
      >
        <Icon className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold tracking-wider text-[var(--mut)] uppercase truncate">
          {label}
        </p>
        <p className="num mt-0.5 truncate text-2xl font-extrabold tracking-tight text-[var(--tx)] md:text-[26px]">
          {value}
        </p>
      </div>
    </div>
  );

  return (
    <div
      data-testid={dataTestId}
      className="group relative flex flex-col justify-between rounded-[20px] border border-[var(--line)] bg-[var(--s1)] p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#7A12F5]/35 hover:shadow-xl hover:shadow-black/20"
    >
      {href ? (
        <Link href={href as never} className="block text-inherit">
          {topContent}
        </Link>
      ) : (
        topContent
      )}
      {(hint || onShare) && (
        <div className="mt-3.5 flex items-center justify-between gap-2 pt-2.5 border-t border-[var(--line)]/60">
          {hint ? (
            href ? (
              <Link
                href={href as never}
                className="truncate text-xs font-medium text-[var(--mut)] hover:text-[var(--tx)] transition-colors"
              >
                {hint}
              </Link>
            ) : (
              <p className="truncate text-xs font-medium text-[var(--mut)]">{hint}</p>
            )
          ) : (
            <span />
          )}
          {onShare && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onShare();
              }}
              data-testid="asset-card-share-btn"
              aria-label={shareAriaLabel ?? `Share ${label}`}
              className="inline-flex items-center gap-1 rounded-lg bg-[var(--s2)] px-2.5 py-1 text-[11px] font-bold text-[var(--tx)] ring-1 ring-inset ring-[var(--line)] hover:ring-[#7A12F5]/50 hover:text-[#7A12F5] dark:hover:text-[#C9A6FF] active:scale-95 transition-all cursor-pointer whitespace-nowrap shrink-0"
            >
              <Share2 className="size-3 shrink-0" />
              <span>Share</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

