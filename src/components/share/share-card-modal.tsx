'use client';

import { useEffect, useId, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  Check,
  Copy,
  Download,
  Eye,
  EyeOff,
  Link2,
  Send,
  Share,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useMe } from '@/lib/hooks/use-me';
import { useClaimEligibility } from '@/lib/hooks/use-claim';
import { useReferral } from '@/lib/hooks/use-referral';
import { useStreak } from '@/lib/hooks/use-rewards';
import { useHydrated } from '@/lib/hooks/use-hydrated';
import {
  SHARE_CARD_TIMEFRAMES,
  SHARE_CARD_VARIANTS,
  buildChartSvgPaths,
  buildShareCardModel,
  renderShareCardToBlob,
  type ShareCardTimeframe,
  type ShareCardUnit,
  type ShareCardUserInput,
  type ShareCardVariant,
} from '@/lib/share-card';
import { cn } from '@/lib/utils';

export const OPEN_SHARE_CARD_EVENT = 'okn:open-share-card';

export interface OpenShareCardDetail {
  variant?: ShareCardVariant;
  source?: 'button' | 'screenshot';
}

/**
 * Dispatches a global event to open the share card modal on any supported page.
 */
export function openShareCard(
  variant?: ShareCardVariant,
  source: 'button' | 'screenshot' = 'button',
) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<OpenShareCardDetail>(OPEN_SHARE_CARD_EVENT, {
      detail: { variant, source },
    }),
  );
}

interface ShareCardModalProps {
  open: boolean;
  initialVariant: ShareCardVariant;
  triggerSource: 'button' | 'screenshot';
  onClose: () => void;
}

const TAB_LABELS: Record<ShareCardVariant, string> = {
  portfolio: 'Your portfolio',
  referrals: 'Referrals',
  profile: 'Profile',
};

export function ShareCardModal({
  open,
  initialVariant,
  triggerSource,
  onClose,
}: ShareCardModalProps) {
  const hydrated = useHydrated();
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = hydrated && Boolean(prefersReducedMotion);
  const gradientId = useId();

  const me = useMe();
  const eligibility = useClaimEligibility();
  const referral = useReferral();
  const streak = useStreak();

  const [variant, setVariant] = useState<ShareCardVariant>(initialVariant);
  const [timeframe, setTimeframe] = useState<ShareCardTimeframe>('24h');
  const [unit, setUnit] = useState<ShareCardUnit>('usd');
  const [showRefCode, setShowRefCode] = useState(true);
  const [busyAction, setBusyAction] = useState<'share' | 'copy' | 'save' | null>(null);
  const [copiedImage, setCopiedImage] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);

  // Sync active tab whenever modal opens with a new initialVariant
  useEffect(() => {
    if (open) {
      setVariant(initialVariant);
      setShowShareSheet(false);
    }
  }, [open, initialVariant]);

  // Escape key closes modal + lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  const userInput = useMemo<ShareCardUserInput>(() => {
    const rawUser = me.data;
    const fullName = [rawUser?.firstName, rawUser?.lastName].filter(Boolean).join(' ').trim();
    const displayName = fullName || rawUser?.username || 'OKN Member';
    const handle = rawUser?.username
      ? `@${rawUser.username}`
      : fullName
        ? fullName.toLowerCase().replace(/\s+/g, '')
        : '@okn_member';
    const parts = displayName.split(/\s+/).filter(Boolean);
    const initials =
      parts.length >= 2
        ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
        : displayName.slice(0, 2).toUpperCase();

    return {
      displayName,
      handle,
      avatarUrl: rawUser?.photoUrl ?? null,
      initials: initials || 'OK',
      referralCode: referral.data?.code ?? 'ref_dev',
      portfolioUsd: 1428.5,
      referralUsd: 142.5,
      okPoints: eligibility.data?.points ?? 135,
      streakDays: streak.data?.currentStreak ?? 6,
      inviteCount: referral.data?.recent?.length || 14,
      tierLabel: 'Tier 2',
    };
  }, [me.data, eligibility.data?.points, referral.data?.code, referral.data?.recent?.length, streak.data?.currentStreak]);

  const model = useMemo(
    () => buildShareCardModel(userInput, variant, timeframe, unit),
    [userInput, variant, timeframe, unit],
  );

  const chartSvg = useMemo(
    () => buildChartSvgPaths(model.series, 280, 132, 14, 16),
    [model.series],
  );

  const referralUrl = `https://t.me/okntest001_bot?start=${userInput.referralCode}`;
  const xShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(model.shareSummary)}&url=${encodeURIComponent(referralUrl)}`;
  const tgShareUrl = `https://t.me/share/url?url=${encodeURIComponent(referralUrl)}&text=${encodeURIComponent(model.shareSummary)}`;

  const downloadBlob = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `okn-${variant}-${timeframe}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  };

  const handleSaveImage = async () => {
    setBusyAction('save');
    try {
      const blob = await renderShareCardToBlob({ user: userInput, model, showRefCode });
      downloadBlob(blob);
      toast.success('Share card saved as PNG');
    } catch {
      toast.error('Unable to export share card');
    } finally {
      setBusyAction(null);
    }
  };

  const handleCopyImage = async () => {
    setBusyAction('copy');
    try {
      const blob = await renderShareCardToBlob({ user: userInput, model, showRefCode });
      const canWriteImage =
        typeof navigator !== 'undefined' &&
        typeof navigator.clipboard?.write === 'function' &&
        typeof window.ClipboardItem !== 'undefined';

      if (canWriteImage) {
        try {
          await navigator.clipboard.write([new window.ClipboardItem({ 'image/png': blob })]);
          setCopiedImage(true);
          toast.success('Card image copied to clipboard');
          window.setTimeout(() => setCopiedImage(false), 2000);
          return;
        } catch {
          // Browser blocked clipboard image write (e.g. non-secure context); fall back to PNG download
        }
      }
      downloadBlob(blob);
      setCopiedImage(true);
      toast.success('Card PNG downloaded for sharing');
      window.setTimeout(() => setCopiedImage(false), 2000);
    } catch {
      toast.error('Unable to copy card image');
    } finally {
      setBusyAction(null);
    }
  };

  const handleNativeShare = async () => {
    setBusyAction('share');
    try {
      const blob = await renderShareCardToBlob({ user: userInput, model, showRefCode });
      const file = new File([blob], `okn-${variant}-${timeframe}.png`, { type: 'image/png' });

      if (
        typeof navigator !== 'undefined' &&
        typeof navigator.share === 'function' &&
        typeof navigator.canShare === 'function' &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          title: `OKN ${model.badgeLabel}`,
          text: model.shareSummary,
          files: [file],
        });
        toast.success('Share card shared');
        return;
      }

      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        try {
          await navigator.share({
            title: `OKN ${model.badgeLabel}`,
            text: model.shareSummary,
            url: referralUrl,
          });
          return;
        } catch {
          // User dismissed or unsupported in iframe — reveal quick share bar
        }
      }

      setShowShareSheet((prev) => !prev);
    } catch {
      setShowShareSheet(true);
    } finally {
      setBusyAction(null);
    }
  };

  const handleCopyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(`${model.shareSummary} ${referralUrl}`);
      toast.success('Share caption & link copied');
    } catch {
      toast.info('Share text ready');
    }
  };

  const accentStroke = model.isPositive ? '#18E074' : '#FF5A5F';

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="OKN Share Card"
          data-testid="share-card-modal"
          initial={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[120] flex flex-col justify-between bg-[#05060D]/96 px-4 pt-[max(16px,env(safe-area-inset-top,16px))] pb-[max(24px,env(safe-area-inset-bottom,24px))] text-white backdrop-blur-xl overflow-y-auto"
        >
          {/* Top Bar: Capture indicator (if triggered via screenshot) + Close button */}
          <div className="mx-auto flex w-full max-w-[390px] items-center justify-between">
            <span className="text-[11px] font-medium tracking-wide text-white/45">
              {triggerSource === 'screenshot' ? 'Screenshot card ready' : 'Shareable snapshot'}
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close share card"
              className="flex size-10 items-center justify-center rounded-full text-white/65 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Center Stack: Tabs + Framed Card + Compact Controls */}
          <div className="mx-auto my-auto flex w-full max-w-[372px] flex-col items-center py-3">
            {/* Horizontal Category Tabs (Modeled cleanly on reference) */}
            <div
              role="tablist"
              aria-label="Share card view"
              className="mb-5 flex items-center justify-center gap-6"
            >
              {SHARE_CARD_VARIANTS.map((key) => {
                const active = variant === key;
                return (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setVariant(key)}
                    className={cn(
                      'relative pb-1.5 text-[15px] font-bold tracking-tight transition-colors cursor-pointer whitespace-nowrap',
                      active ? 'text-white' : 'text-white/40 hover:text-white/70',
                    )}
                  >
                    {TAB_LABELS[key]}
                    {active ? (
                      <span className="absolute inset-x-0 bottom-0 h-[2px] rounded-full bg-white" />
                    ) : null}
                  </button>
                );
              })}
            </div>

            {/* Framed Share Card */}
            <motion.div
              key={`${variant}-${timeframe}-${unit}`}
              initial={reduceMotion ? false : { opacity: 0.9, y: 6, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="w-full rounded-[24px] bg-gradient-to-br from-[#7A12F5] via-[#5B3DF5] to-[#2563EB] p-[4px] shadow-[0_24px_60px_rgba(0,0,0,0.65)]"
            >
              {/* Inner Dark Surface */}
              <div className="rounded-[20px] bg-[#090B12] px-5 pt-5 pb-4 border border-white/[0.06]">
                {/* User Identity Row */}
                <div className="flex items-center gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#7A12F5] to-[#09B4FF] text-sm font-extrabold text-white ring-1 ring-white/15">
                    {userInput.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={userInput.avatarUrl}
                        alt={userInput.displayName}
                        className="size-full object-cover"
                      />
                    ) : (
                      <span>{userInput.initials}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-[16px] font-bold tracking-tight text-white leading-snug">
                      {userInput.handle}
                    </div>
                    <span className="mt-0.5 inline-block rounded-[6px] bg-[#7A12F5]/22 px-2 py-0.5 text-[11px] font-semibold text-[#C4A6FF]">
                      {model.badgeLabel}
                    </span>
                  </div>
                </div>

                {/* Primary Figure + Delta */}
                <div className="mt-4">
                  <div
                    data-testid="share-card-headline"
                    className="text-[34px] font-extrabold tracking-tight text-white leading-none tabular-nums"
                  >
                    {model.headlineValue}
                  </div>
                  <div className="mt-2 flex items-baseline gap-2 text-[14px] font-bold tabular-nums">
                    <span className={model.isPositive ? 'text-[#18E074]' : 'text-[#FF5A5F]'}>
                      {model.deltaLabel}
                    </span>
                    <span className="text-white/45 font-medium">{model.timeframeLabel}</span>
                  </div>
                </div>

                {/* Quiet 3-Metric Telemetry Row */}
                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/[0.07] pt-3">
                  {model.subMetrics.map((item) => (
                    <div key={item.label} className="min-w-0">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-white/40 truncate">
                        {item.label}
                      </div>
                      <div className="mt-0.5 text-[13px] font-bold text-white/90 tabular-nums truncate">
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Minimal Performance Chart */}
                <div className="mt-4">
                  <div className="relative h-[138px] w-full">
                    <svg
                      viewBox="0 0 280 132"
                      preserveAspectRatio="none"
                      aria-hidden="true"
                      className="h-full w-full overflow-visible pr-12"
                    >
                      <defs>
                        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={accentStroke} stopOpacity="0.26" />
                          <stop offset="100%" stopColor="#090B12" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <line
                        x1="0"
                        y1="14"
                        x2="280"
                        y2="14"
                        stroke="rgba(255,255,255,0.06)"
                        strokeWidth="1"
                      />
                      <line
                        x1="0"
                        y1="116"
                        x2="280"
                        y2="116"
                        stroke="rgba(255,255,255,0.06)"
                        strokeWidth="1"
                      />
                      <path d={chartSvg.areaPath} fill={`url(#${gradientId})`} />
                      <path
                        d={chartSvg.linePath}
                        fill="none"
                        stroke={accentStroke}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>

                    {/* Right-aligned Y Bounds */}
                    <span className="pointer-events-none absolute top-2 right-0 text-[10.5px] font-medium text-white/40 tabular-nums">
                      {model.yMaxLabel}
                    </span>
                    <span className="pointer-events-none absolute bottom-3 right-0 text-[10.5px] font-medium text-white/40 tabular-nums">
                      {model.yMinLabel}
                    </span>
                  </div>

                  {/* X-Axis Timestamps */}
                  <div className="mt-1 flex items-center justify-between text-[10.5px] font-medium text-white/38 tabular-nums">
                    <span>{model.xLabels[0]}</span>
                    <span>{model.xLabels[1]}</span>
                    <span>{model.xLabels[2]}</span>
                  </div>
                </div>
              </div>

              {/* Integrated Brand Footer Bar inside Gradient Frame */}
              <div className="flex items-center justify-between px-4 py-3.5 text-white">
                <div className="text-[24px] font-black tracking-tight leading-none select-none">
                  $OKN
                </div>
                {showRefCode ? (
                  <div className="text-right leading-tight">
                    <div className="text-[10.5px] font-medium text-white/80">
                      Earn bonus with code
                    </div>
                    <div
                      data-testid="share-card-ref-code"
                      className="mt-0.5 font-mono text-[14px] font-extrabold tracking-tight text-white"
                    >
                      {userInput.referralCode}
                    </div>
                  </div>
                ) : (
                  <div className="text-[12.5px] font-semibold text-white/85">okn.network</div>
                )}
              </div>
            </motion.div>

            {/* Compact Segmented Controls Row (24h/7d/30d | $/% | Ref code) */}
            <div className="mt-5 flex w-full flex-wrap items-center justify-center gap-2">
              {/* Timeframe Segment */}
              <div className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] p-1">
                {SHARE_CARD_TIMEFRAMES.map((tf) => {
                  const active = timeframe === tf;
                  return (
                    <button
                      key={tf}
                      type="button"
                      onClick={() => setTimeframe(tf)}
                      className={cn(
                        'min-h-[32px] rounded-full px-3 text-xs font-bold transition-colors cursor-pointer',
                        active
                          ? 'bg-white/14 text-white'
                          : 'text-white/45 hover:text-white/80',
                      )}
                    >
                      {tf}
                    </button>
                  );
                })}
              </div>

              {/* Unit Toggle ($ | %) */}
              <div className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] p-1">
                {(['usd', 'pct'] as const).map((mode) => {
                  const active = unit === mode;
                  return (
                    <button
                      key={mode}
                      type="button"
                      aria-label={mode === 'usd' ? 'Show dollar amount' : 'Show percentage'}
                      onClick={() => setUnit(mode)}
                      className={cn(
                        'min-h-[32px] min-w-[34px] rounded-full px-2.5 text-xs font-bold transition-colors cursor-pointer',
                        active
                          ? 'bg-white/14 text-white'
                          : 'text-white/45 hover:text-white/80',
                      )}
                    >
                      {mode === 'usd' ? '$' : '%'}
                    </button>
                  );
                })}
              </div>

              {/* Ref Code Visibility Toggle */}
              <button
                type="button"
                onClick={() => setShowRefCode((prev) => !prev)}
                aria-pressed={showRefCode}
                className={cn(
                  'inline-flex min-h-[40px] items-center gap-1.5 rounded-full border px-3.5 text-xs font-bold transition-colors cursor-pointer',
                  showRefCode
                    ? 'border-white/15 bg-white/[0.07] text-white'
                    : 'border-white/10 bg-white/[0.03] text-white/45 hover:text-white/80',
                )}
              >
                {showRefCode ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
                <span>Ref code</span>
              </button>
            </div>

            {/* Optional Fallback Social Share Strip (when Web Share API is unavailable) */}
            <AnimatePresence>
              {showShareSheet ? (
                <motion.div
                  initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  className="mt-3.5 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] p-2"
                >
                  <a
                    href={xShareUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-white/10 px-3 text-xs font-bold text-white hover:bg-white/16 transition-colors"
                  >
                    <span>Post on X</span>
                  </a>
                  <a
                    href={tgShareUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#229ED9]/25 px-3 text-xs font-bold text-[#7AD5FF] hover:bg-[#229ED9]/35 transition-colors"
                  >
                    <Send className="size-3.5" />
                    <span>Telegram</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => void handleCopyShareLink()}
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-white/10 px-3 text-xs font-bold text-white hover:bg-white/16 transition-colors cursor-pointer"
                  >
                    <Link2 className="size-3.5" />
                    <span>Link</span>
                  </button>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          {/* Bottom Thumb-Zone Circular Action Buttons */}
          <div className="mx-auto flex w-full max-w-[340px] items-start justify-center gap-8 pt-2">
            <button
              type="button"
              onClick={() => void handleNativeShare()}
              disabled={busyAction !== null}
              className="group flex flex-col items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span className="flex size-13 items-center justify-center rounded-full border border-white/12 bg-white/[0.08] text-white group-hover:bg-white/14 group-active:scale-95 transition-all">
                <Share className="size-5" />
              </span>
              <span className="text-xs font-semibold text-white/85">Share</span>
            </button>

            <button
              type="button"
              onClick={() => void handleCopyImage()}
              disabled={busyAction !== null}
              className="group flex flex-col items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span className="flex size-13 items-center justify-center rounded-full border border-white/12 bg-white/[0.08] text-white group-hover:bg-white/14 group-active:scale-95 transition-all">
                {copiedImage ? (
                  <Check className="size-5 text-[#18E074]" />
                ) : (
                  <Copy className="size-5" />
                )}
              </span>
              <span className="text-xs font-semibold text-white/85">
                {copiedImage ? 'Copied' : 'Copy image'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => void handleSaveImage()}
              disabled={busyAction !== null}
              className="group flex flex-col items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span className="flex size-13 items-center justify-center rounded-full border border-white/12 bg-white/[0.08] text-white group-hover:bg-white/14 group-active:scale-95 transition-all">
                <Download className="size-5" />
              </span>
              <span className="text-xs font-semibold text-white/85">Save</span>
            </button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
