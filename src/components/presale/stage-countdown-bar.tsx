'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { Link, usePathname } from '@/i18n/navigation';
import {
  INITIAL_COUNTDOWN_SNAPSHOT,
  STAGE_1_END_MS,
  buildOdometerReel,
  computePresaleCountdown,
  formatCountdownUnit,
  planOdometerTransition,
  type PresaleCountdownSnapshot,
} from '@/lib/presale-countdown';
import { useHydrated } from '@/lib/hooks/use-hydrated';
import { cn } from '@/lib/utils';

const STAGE_1_PROGRESS_PCT = 68.4;

const DETENT_SPRING = {
  type: 'spring' as const,
  stiffness: 340,
  damping: 26,
  mass: 0.78,
};

/**
 * OdometerColumn — Unidirectional watchmaker mechanical digit drum.
 *
 * Uses an extended reel ['0', ..., maxDigit, '0'] so downward wraps (0 -> 9,
 * 0 -> 5, 0 -> 2) jump instantaneously to the visually identical trailing '0'
 * and step cleanly by 1 single slot with calibrated spring detent physics.
 * Zero AnimatePresence unmounts, zero backward rewinding, zero digit clipping.
 */
function OdometerColumn({
  digit,
  maxDigit = 9,
  hydrated,
  reduceMotion,
  accent = false,
}: {
  digit: string;
  maxDigit?: number;
  hydrated: boolean;
  reduceMotion: boolean;
  accent?: boolean;
}) {
  const reel = useMemo(() => buildOdometerReel(maxDigit), [maxDigit]);
  const parsed = Number.parseInt(digit, 10);
  const safeNum = Number.isFinite(parsed)
    ? Math.max(0, Math.min(maxDigit, parsed))
    : 0;

  const indexToPct = (idx: number) => -(idx / reel.length) * 100;
  const reelPct = useMotionValue(indexToPct(safeNum));
  const y = useTransform(reelPct, (v) => `${v}%`);
  const prevDigitRef = useRef<number | null>(null);

  useEffect(() => {
    if (!hydrated) return;

    const prev = prevDigitRef.current;
    prevDigitRef.current = safeNum;

    if (prev === null || prev === safeNum) {
      reelPct.jump(indexToPct(safeNum));
      return;
    }

    const plan = planOdometerTransition(prev, safeNum, maxDigit);
    if (plan.jumpToIndex !== null) {
      reelPct.jump(indexToPct(plan.jumpToIndex));
    }

    const controls = animate(
      reelPct,
      indexToPct(plan.targetIndex),
      reduceMotion ? { duration: 0.1, ease: 'linear' } : DETENT_SPRING,
    );

    return () => {
      controls.stop();
    };
  }, [hydrated, safeNum, maxDigit, reduceMotion, reel.length, reelPct]);

  const staticPct = `${indexToPct(safeNum)}%`;

  return (
    <span
      className="relative inline-block h-[22px] sm:h-[24px] w-[11.5px] sm:w-[13px] overflow-hidden align-middle"
      style={{
        WebkitMaskImage:
          'linear-gradient(to bottom, transparent 0%, #000 11%, #000 89%, transparent 100%)',
        maskImage:
          'linear-gradient(to bottom, transparent 0%, #000 11%, #000 89%, transparent 100%)',
      }}
    >
      {!hydrated ? (
        <span
          className="flex flex-col will-change-transform"
          style={{ transform: `translate3d(0, ${staticPct}, 0)` }}
        >
          {reel.map((d, slotIdx) => (
            <span
              key={`${slotIdx}-${d}`}
              aria-hidden={slotIdx !== safeNum}
              className={cn(
                'flex h-[22px] sm:h-[24px] w-full items-center justify-center font-mono text-[13px] sm:text-[14px] font-black leading-none tabular-nums',
                accent ? 'text-[#FCE7F3]' : 'text-white',
              )}
            >
              {d}
            </span>
          ))}
        </span>
      ) : (
        <motion.span
          className="flex flex-col will-change-transform"
          style={{ y }}
        >
          {reel.map((d, slotIdx) => (
            <span
              key={`${slotIdx}-${d}`}
              aria-hidden={slotIdx !== safeNum}
              className={cn(
                'flex h-[22px] sm:h-[24px] w-full items-center justify-center font-mono text-[13px] sm:text-[14px] font-black leading-none tabular-nums',
                accent ? 'text-[#FCE7F3]' : 'text-white',
              )}
            >
              {d}
            </span>
          ))}
        </motion.span>
      )}
    </span>
  );
}

/** Precision machined burgundy chronograph capsule housing two unidirectional odometer drums. */
function ChronographCapsule({
  value,
  unit,
  tensMax = 9,
  onesMax = 9,
  hydrated,
  reduceMotion,
  isSeconds = false,
  subSecondProgress,
  tickImpulseOpacity,
  cometX,
}: {
  value: string;
  unit: string;
  tensMax?: number;
  onesMax?: number;
  hydrated: boolean;
  reduceMotion: boolean;
  isSeconds?: boolean;
  subSecondProgress?: MotionValue<number>;
  tickImpulseOpacity?: MotionValue<number>;
  cometX?: MotionValue<string>;
}) {
  const padded = value.padStart(2, '0');
  const chars = padded.split('');

  return (
    <div className="inline-flex items-center gap-[3px]">
      <div
        className={cn(
          'relative inline-flex items-center justify-center rounded-[7px] px-[4.5px] sm:px-[5.5px] py-[1.5px] overflow-hidden select-none ring-1',
          isSeconds
            ? 'bg-gradient-to-b from-[#5A0B3B] via-[#3F0729] to-[#27041A] ring-[#F472B6]/55 shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_2px_14px_rgba(178,21,137,0.4)]'
            : 'bg-gradient-to-b from-white/[0.11] via-white/[0.06] to-black/[0.22] ring-white/[0.14] shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_2px_8px_rgba(0,0,0,0.34)]',
        )}
      >
        {/* Subtle sapphire upper highlight */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[44%] bg-gradient-to-b from-white/[0.09] to-transparent"
        />

        {/* Exact-millisecond escapement specular flash at each second turnover */}
        {hydrated && isSeconds && !reduceMotion && tickImpulseOpacity && (
          <motion.span
            aria-hidden="true"
            style={{ opacity: tickImpulseOpacity }}
            className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#FBCFE8] to-transparent will-change-[opacity]"
          />
        )}

        <div className="relative z-10 flex items-center">
          {chars.map((ch, idx) => (
            <OdometerColumn
              key={`${unit}-${idx}`}
              digit={ch}
              maxDigit={idx === 0 ? tensMax : onesMax}
              hydrated={hydrated}
              reduceMotion={reduceMotion}
              accent={isSeconds}
            />
          ))}
        </div>

        {/* Continuous 60/120fps sub-second vernier gauge + glowing GPU comet head */}
        {hydrated && isSeconds && !reduceMotion && subSecondProgress && (
          <>
            <motion.span
              aria-hidden="true"
              style={{ scaleX: subSecondProgress, transformOrigin: '0% 50%' }}
              className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-[#B21589] via-[#F472B6] to-[#FDE68A] will-change-transform"
            />
            {cometX && (
              <motion.span
                aria-hidden="true"
                style={{ x: cometX }}
                className="pointer-events-none absolute inset-x-0 bottom-[-1.5px] h-[5px] will-change-transform"
              >
                <span className="block size-[5px] -translate-x-1/2 rounded-full bg-[#FFF7ED] shadow-[0_0_8px_#F9A8D4,0_0_12px_#FDE68A]" />
              </motion.span>
            )}
          </>
        )}
      </div>
      <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#FBCFE8]/60 select-none">
        {unit}
      </span>
    </div>
  );
}

/** Fluid sub-second breathing LED colon separator driven directly on the GPU compositor. */
function BreathingColon({
  hydrated,
  reduceMotion,
  colonOpacity,
}: {
  hydrated: boolean;
  reduceMotion: boolean;
  colonOpacity: MotionValue<number>;
}) {
  if (!hydrated || reduceMotion) {
    return (
      <span aria-hidden="true" className="hidden sm:inline-flex flex-col gap-[3px] px-[1px] opacity-50">
        <span className="size-[2.5px] rounded-full bg-[#F9A8D4]" />
        <span className="size-[2.5px] rounded-full bg-[#F9A8D4]" />
      </span>
    );
  }

  return (
    <motion.span
      aria-hidden="true"
      style={{ opacity: colonOpacity }}
      className="hidden sm:inline-flex flex-col gap-[3px] px-[1px] will-change-[opacity]"
    >
      <span className="size-[2.5px] rounded-full bg-[#F9A8D4]" />
      <span className="size-[2.5px] rounded-full bg-[#F9A8D4]" />
    </motion.span>
  );
}

/**
 * PresaleBuyCta — Tier-1 kinetic berry-magenta CTA button.
 *
 * Layered GPU-composited choreography:
 *  - Ambient breathing magenta-rose glow halo
 *  - Continuously orbiting prismatic conic-gradient hairline bezel
 *  - Choreographed diagonal specular glass sweep
 *  - Kinetic dual-arrow portal (rhythmic micro-nudge at rest, dual glide-through on hover)
 *  - Tactile spring hover/press physics
 */
function PresaleBuyCta({
  hydrated,
  reduceMotion,
}: {
  hydrated: boolean;
  reduceMotion: boolean;
}) {
  const animateLive = hydrated && !reduceMotion;

  return (
    <motion.div
      className="relative shrink-0"
      whileHover={animateLive ? { scale: 1.04, y: -0.5 } : undefined}
      whileTap={animateLive ? { scale: 0.94 } : undefined}
      transition={{ type: 'spring', stiffness: 460, damping: 24 }}
    >
      {/* Ambient Breathing Berry-Rose Glow Halo */}
      {animateLive && (
        <motion.span
          aria-hidden="true"
          animate={{ opacity: [0.4, 0.82, 0.4], scale: [0.95, 1.06, 0.95] }}
          transition={{ duration: 3.1, repeat: Infinity, ease: 'easeInOut' }}
          className="pointer-events-none absolute -inset-[3px] rounded-full bg-gradient-to-r from-[#B21589] via-[#EC4899] to-[#F59E0B]/75 blur-[8px] will-change-transform"
        />
      )}

      {/* Outer Orbiting Prismatic Bezel Ring */}
      <span className="relative inline-flex rounded-full p-[1.5px] overflow-hidden shadow-[0_4px_16px_rgba(178,21,137,0.48)]">
        {animateLive ? (
          <motion.span
            aria-hidden="true"
            animate={{ rotate: 360 }}
            transition={{ duration: 3.2, repeat: Infinity, ease: 'linear' }}
            className="pointer-events-none absolute inset-[-140%] will-change-transform"
            style={{
              background:
                'conic-gradient(from 0deg, rgba(255,255,255,0.12) 0deg, rgba(251,207,232,0.95) 55deg, rgba(253,230,138,0.95) 95deg, rgba(178,21,137,0.2) 150deg, rgba(255,255,255,0.12) 360deg)',
            }}
          />
        ) : (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-r from-[#F472B6]/60 via-[#FDE68A]/50 to-[#B21589]/60"
          />
        )}

        <Link
          href="/app/buy"
          data-testid="countdown-buy-cta"
          className="group relative inline-flex h-[27px] sm:h-[29px] items-center gap-1.5 overflow-hidden rounded-full bg-gradient-to-r from-[#B21589] via-[#CC199C] to-[#9E0E78] px-3 sm:px-3.5 text-[10.5px] sm:text-[11.5px] font-extrabold !text-white transition-[filter] duration-200 hover:brightness-110 whitespace-nowrap"
          style={{ color: '#ffffff' }}
        >
          {/* Top Inner Crystal Highlight */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-1.5 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/55 to-transparent"
          />

          {/* Choreographed Diagonal Specular Glass Sweep */}
          {animateLive && (
            <motion.span
              aria-hidden="true"
              initial={{ x: '-160%' }}
              animate={{ x: ['-160%', '260%'] }}
              transition={{
                duration: 1.15,
                repeat: Infinity,
                repeatDelay: 2.35,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="pointer-events-none absolute inset-y-[-6px] left-0 w-9 -skew-x-[24deg] bg-gradient-to-r from-transparent via-white/45 to-transparent will-change-transform"
            />
          )}

          <span className="relative z-10 sm:hidden">Buy</span>
          <span className="relative z-10 hidden sm:inline">Buy $OKN</span>

          {/* Kinetic Dual-Arrow Portal */}
          <span
            aria-hidden="true"
            className="relative z-10 inline-flex size-3.5 items-center justify-center overflow-hidden"
          >
            {animateLive ? (
              <motion.span
                animate={{ x: [0, 2.2, 0] }}
                transition={{
                  duration: 0.9,
                  repeat: Infinity,
                  repeatDelay: 2.6,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="inline-flex items-center justify-center transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-4 will-change-transform"
              >
                <ArrowRight className="size-3 stroke-[2.6]" />
              </motion.span>
            ) : (
              <ArrowRight className="size-3 stroke-[2.6] transition-transform duration-200 ease-out group-hover:translate-x-0.5" />
            )}
            <span className="pointer-events-none absolute inset-0 inline-flex -translate-x-4 items-center justify-center transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0">
              <ArrowRight className="size-3 stroke-[2.6]" />
            </span>
          </span>
        </Link>
      </span>
    </motion.div>
  );
}

/**
 * StageCountdownBar — Global sticky Stage 1 Presale Chronograph Ribbon.
 *
 * Rich velvet-burgundy & berry-magenta palette paired with Tier-1 horological motion:
 *  - Unidirectional watchmaker spring-detent odometer reels (zero backward rewind)
 *  - Exact-millisecond escapement flash + GPU sub-second vernier comet
 *  - Dual counter-rotating orbital watch escapement arcs
 *  - Living Stage 1 allocation progress bar with gliding light wave & breathing tip
 *  - Tier-1 animated Buy $OKN CTA with orbiting prismatic bezel, specular sweep & dual-arrow portal
 */
export function StageCountdownBar({ className }: { className?: string }) {
  const hydrated = useHydrated();
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = hydrated && Boolean(prefersReducedMotion);
  const [snapshot, setSnapshot] = useState<PresaleCountdownSnapshot>(INITIAL_COUNTDOWN_SNAPSHOT);

  // Continuous 60/120fps sub-second MotionValues with ZERO React re-renders
  const subSecondProgress = useMotionValue(1);
  const colonOpacity = useTransform(subSecondProgress, (p) => 0.3 + 0.65 * Math.sin(p * Math.PI));
  const tickImpulseOpacity = useTransform(subSecondProgress, [1, 0.78, 0], [0.95, 0.14, 0.02]);
  const cometX = useTransform(subSecondProgress, (p) => `${p * 100}%`);

  useEffect(() => {
    if (!hydrated) return;

    let lastWholeSecond = -1;
    let rafId = 0;

    const tick = () => {
      const now = Date.now();
      const remainingMs = Math.max(0, STAGE_1_END_MS - now);
      const wholeSec = Math.floor(remainingMs / 1000);

      if (wholeSec !== lastWholeSecond) {
        lastWholeSecond = wholeSec;
        setSnapshot(computePresaleCountdown(now, STAGE_1_END_MS));
      }

      if (!reduceMotion) {
        const frac = remainingMs > 0 ? (remainingMs % 1000) / 1000 : 0;
        subSecondProgress.set(frac);
      }

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [hydrated, reduceMotion, subSecondProgress]);

  const isOnBuyPage = pathname === '/app/buy' || pathname.startsWith('/app/buy/');
  const animateLive = hydrated && !reduceMotion;

  const segments = [
    { value: formatCountdownUnit(snapshot.days), unit: 'd', tensMax: 9, onesMax: 9, isSeconds: false },
    { value: formatCountdownUnit(snapshot.hours), unit: 'h', tensMax: 2, onesMax: 9, isSeconds: false },
    { value: formatCountdownUnit(snapshot.minutes), unit: 'm', tensMax: 5, onesMax: 9, isSeconds: false },
    { value: formatCountdownUnit(snapshot.seconds), unit: 's', tensMax: 5, onesMax: 9, isSeconds: true },
  ];

  return (
    <div
      data-testid="stage-1-countdown"
      className={cn(
        'relative w-full shrink-0 overflow-hidden border-b border-[#F472B6]/18 text-white shadow-none',
        className,
      )}
      style={{
        background:
          'linear-gradient(135deg, rgba(79, 8, 50, 0.99) 0%, rgba(62, 6, 45, 0.99) 54%, rgba(44, 5, 36, 0.99) 100%)',
      }}
    >
      {/* Velvet Burgundy Atmospheric Aurora Drift + Architectural Diagonal Planes */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-6 left-[18%] h-[110px] w-[48px] rotate-[24deg] bg-white/[0.035]" />
        <div className="absolute -top-6 left-[64%] h-[110px] w-[32px] rotate-[24deg] bg-white/[0.025]" />
        {animateLive ? (
          <motion.div
            animate={{ x: ['-7%', '7%', '-7%'] }}
            transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -inset-x-[15%] inset-y-0 will-change-transform"
            style={{
              backgroundImage:
                'radial-gradient(46% 160% at 22% 50%, rgba(219, 39, 119, 0.3) 0%, transparent 72%), radial-gradient(38% 150% at 78% 50%, rgba(245, 158, 11, 0.14) 0%, transparent 72%)',
            }}
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'radial-gradient(46% 160% at 22% 50%, rgba(219, 39, 119, 0.3) 0%, transparent 72%), radial-gradient(38% 150% at 78% 50%, rgba(245, 158, 11, 0.14) 0%, transparent 72%)',
            }}
          />
        )}
      </div>

      {/* Synchronized Gliding Bottom Rose-Champagne Light Beam */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[1.5px] overflow-hidden bg-gradient-to-r from-transparent via-[#F472B6]/30 to-transparent"
      >
        {animateLive && (
          <motion.span
            animate={{ x: ['-30%', '130%'] }}
            transition={{ duration: 6.5, repeat: Infinity, ease: 'easeInOut' }}
            className="block h-full w-[32%] bg-gradient-to-r from-transparent via-[#FBCFE8]/90 to-transparent will-change-transform"
          />
        )}
      </div>

      <div className="relative z-10 mx-auto flex max-w-7xl items-center justify-between gap-2 sm:gap-4 px-3 py-2 sm:px-5 md:px-8">
        {/* Left: Dual Counter-Rotating Watch Escapement + Stage 1 Telemetry + Living Progress Track */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Dual Counter-Rotating Orbital Escapement Indicator */}
          <span className="relative flex size-[18px] shrink-0 items-center justify-center">
            {animateLive && (
              <>
                <motion.span
                  aria-hidden="true"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 5.4, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0 rounded-full will-change-transform"
                  style={{
                    background:
                      'conic-gradient(from 0deg, rgba(52,211,153,0) 0deg, rgba(52,211,153,0.95) 115deg, rgba(253,230,138,0.85) 170deg, rgba(52,211,153,0) 220deg)',
                    WebkitMaskImage:
                      'radial-gradient(farthest-side, transparent calc(100% - 1.5px), #000 calc(100% - 1px))',
                    maskImage:
                      'radial-gradient(farthest-side, transparent calc(100% - 1.5px), #000 calc(100% - 1px))',
                  }}
                />
                <motion.span
                  aria-hidden="true"
                  animate={{ rotate: -360 }}
                  transition={{ duration: 9, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-[3px] rounded-full will-change-transform"
                  style={{
                    background:
                      'conic-gradient(from 180deg, rgba(244,114,182,0) 0deg, rgba(244,114,182,0.75) 90deg, rgba(244,114,182,0) 150deg)',
                    WebkitMaskImage:
                      'radial-gradient(farthest-side, transparent calc(100% - 1px), #000 calc(100% - 0.5px))',
                    maskImage:
                      'radial-gradient(farthest-side, transparent calc(100% - 1px), #000 calc(100% - 0.5px))',
                  }}
                />
              </>
            )}
            <span className="relative size-1.5 rounded-full bg-[#34D399] shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
          </span>

          {/* Stage 1 Engraved Emblem */}
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <span className="rounded-[6px] border border-[#F472B6]/40 bg-[#B21589]/35 px-1.5 sm:px-2 py-[2px] text-[9.5px] sm:text-[10.5px] font-black uppercase tracking-[0.12em] text-[#FCE7F3] shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] whitespace-nowrap">
              Stage 1
            </span>
            <span className="hidden xs:inline sm:inline text-[11px] sm:text-xs font-extrabold tracking-tight text-white whitespace-nowrap">
              Presale
            </span>
            <span aria-hidden="true" className="hidden sm:inline h-3 w-[1px] bg-white/20" />
            <span className="hidden sm:inline font-mono text-[11.5px] font-bold text-[#FDE68A] tabular-nums whitespace-nowrap">
              $0.05
            </span>
          </div>

          {/* Desktop Living Stage Allocation Track with Traveling Energy Wave & Breathing Beacon */}
          <div className="hidden lg:flex items-center gap-2 pl-1">
            <div className="relative h-[5px] w-24 rounded-full bg-white/[0.13] overflow-visible">
              <div
                className="relative h-full rounded-full bg-gradient-to-r from-[#B21589] via-[#EC4899] to-[#FDE68A] overflow-hidden"
                style={{ width: `${STAGE_1_PROGRESS_PCT}%` }}
              >
                {animateLive && (
                  <motion.span
                    aria-hidden="true"
                    animate={{ x: ['-100%', '220%'] }}
                    transition={{
                      duration: 2.2,
                      repeat: Infinity,
                      repeatDelay: 1.4,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="block h-full w-1/2 bg-gradient-to-r from-transparent via-white/70 to-transparent will-change-transform"
                  />
                )}
              </div>
              {animateLive ? (
                <motion.span
                  aria-hidden="true"
                  animate={{ scale: [1, 1.38, 1], opacity: [0.85, 1, 0.85] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ left: `${STAGE_1_PROGRESS_PCT}%` }}
                  className="pointer-events-none absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FFF7ED] shadow-[0_0_9px_#FDE68A] will-change-transform"
                />
              ) : (
                <span
                  aria-hidden="true"
                  style={{ left: `${STAGE_1_PROGRESS_PCT}%` }}
                  className="pointer-events-none absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FFF7ED] shadow-[0_0_9px_#FDE68A]"
                />
              )}
            </div>
            <span className="font-mono text-[10.5px] font-bold text-[#FCE7F3]/80 tabular-nums whitespace-nowrap">
              {STAGE_1_PROGRESS_PCT}% sold
            </span>
          </div>
        </div>

        {/* Center / Right-Center: Fluid Unidirectional Spring-Detent Mechanical Odometer Drums */}
        <div
          role="timer"
          aria-label={`Stage 1 presale ends in ${snapshot.days} days, ${snapshot.hours} hours, ${snapshot.minutes} minutes, ${snapshot.seconds} seconds`}
          className="flex items-center gap-1 sm:gap-1.5 shrink-0"
        >
          <span className="hidden md:inline text-[10px] font-bold uppercase tracking-[0.14em] text-[#FBCFE8]/60 mr-1">
            {snapshot.expired ? 'Closed' : 'Ends in'}
          </span>

          {segments.map((seg, idx) => (
            <div key={seg.unit} className="inline-flex items-center gap-1 sm:gap-1.5">
              <ChronographCapsule
                value={seg.value}
                unit={seg.unit}
                tensMax={seg.tensMax}
                onesMax={seg.onesMax}
                hydrated={hydrated}
                reduceMotion={reduceMotion}
                isSeconds={seg.isSeconds}
                subSecondProgress={seg.isSeconds ? subSecondProgress : undefined}
                tickImpulseOpacity={seg.isSeconds ? tickImpulseOpacity : undefined}
                cometX={seg.isSeconds ? cometX : undefined}
              />
              {idx < segments.length - 1 && (
                <BreathingColon
                  hydrated={hydrated}
                  reduceMotion={reduceMotion}
                  colonOpacity={colonOpacity}
                />
              )}
            </div>
          ))}
        </div>

        {/* Right: Tier-1 Kinetic Berry-Magenta CTA */}
        {!isOnBuyPage ? (
          <PresaleBuyCta hydrated={hydrated} reduceMotion={reduceMotion} />
        ) : (
          <span className="hidden sm:inline-flex h-[28px] shrink-0 items-center gap-1.5 rounded-full border border-[#34D399]/40 bg-[#34D399]/15 px-3 text-[10.5px] font-extrabold uppercase tracking-wider text-[#6EE7B7] whitespace-nowrap">
            <span className="size-1.5 rounded-full bg-[#34D399]" />
            Live Now
          </span>
        )}
      </div>
    </div>
  );
}
