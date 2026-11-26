'use client';

import { useEffect, useState } from 'react';
import { motion, useMotionValue, useReducedMotion, useTransform, type MotionValue } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { Link, usePathname } from '@/i18n/navigation';
import {
  INITIAL_COUNTDOWN_SNAPSHOT,
  STAGE_1_END_MS,
  computePresaleCountdown,
  formatCountdownUnit,
  type PresaleCountdownSnapshot,
} from '@/lib/presale-countdown';
import { useHydrated } from '@/lib/hooks/use-hydrated';
import { cn } from '@/lib/utils';

const STAGE_1_PROGRESS_PCT = 68.4;
const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'] as const;
const DRUM_EASE = [0.22, 1, 0.36, 1] as const;

/**
 * OdometerColumn — Continuous 10-digit cylindrical mechanical drum.
 *
 * All 10 digits remain permanently mounted in a single GPU-composited ribbon
 * (zero AnimatePresence unmounts, zero layout thrash, zero missing frames).
 * Top and bottom alpha mask creates subtle cylindrical watch-drum depth.
 */
function OdometerColumn({
  digit,
  hydrated,
  reduceMotion,
  accent = false,
}: {
  digit: string;
  hydrated: boolean;
  reduceMotion: boolean;
  accent?: boolean;
}) {
  const num = Number.parseInt(digit, 10);
  const safeIndex = Number.isFinite(num) && num >= 0 && num <= 9 ? num : 0;
  const targetY = `-${safeIndex * 10}%`;

  return (
    <span
      className="relative inline-block h-[20px] sm:h-[22px] w-[11px] sm:w-[12.5px] overflow-hidden align-middle"
      style={{
        WebkitMaskImage:
          'linear-gradient(to bottom, transparent 0%, #000 18%, #000 82%, transparent 100%)',
        maskImage:
          'linear-gradient(to bottom, transparent 0%, #000 18%, #000 82%, transparent 100%)',
      }}
    >
      {!hydrated ? (
        <span
          className="flex flex-col will-change-transform"
          style={{ transform: `translate3d(0, ${targetY}, 0)` }}
        >
          {DIGITS.map((d) => (
            <span
              key={d}
              aria-hidden={d !== digit}
              className={cn(
                'flex h-[20px] sm:h-[22px] w-full items-center justify-center font-mono text-[13px] sm:text-[14px] font-black leading-none tabular-nums',
                accent ? 'text-[#E9D5FF]' : 'text-white',
              )}
            >
              {d}
            </span>
          ))}
        </span>
      ) : (
        <motion.span
          className="flex flex-col will-change-transform"
          initial={false}
          animate={{ y: targetY }}
          transition={
            reduceMotion
              ? { duration: 0.12, ease: 'linear' }
              : { duration: 0.44, ease: DRUM_EASE }
          }
        >
          {DIGITS.map((d) => (
            <span
              key={d}
              aria-hidden={d !== digit}
              className={cn(
                'flex h-[20px] sm:h-[22px] w-full items-center justify-center font-mono text-[13px] sm:text-[14px] font-black leading-none tabular-nums',
                accent ? 'text-[#E9D5FF]' : 'text-white',
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

/** Precision machined chronograph capsule housing two continuous odometer drums. */
function ChronographCapsule({
  value,
  unit,
  hydrated,
  reduceMotion,
  isSeconds = false,
  subSecondProgress,
}: {
  value: string;
  unit: string;
  hydrated: boolean;
  reduceMotion: boolean;
  isSeconds?: boolean;
  subSecondProgress?: MotionValue<number>;
}) {
  const padded = value.padStart(2, '0');
  const chars = padded.split('');

  return (
    <div className="inline-flex items-center gap-[3px]">
      <div
        className={cn(
          'relative inline-flex items-center justify-center rounded-[7px] px-[4.5px] sm:px-[5.5px] py-[2px] overflow-hidden select-none ring-1',
          isSeconds
            ? 'bg-gradient-to-b from-[#21123F] via-[#150C2A] to-[#0E081D] ring-[#A855F7]/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_2px_12px_rgba(122,18,245,0.28)]'
            : 'bg-gradient-to-b from-white/[0.08] via-white/[0.04] to-white/[0.02] ring-white/[0.11] shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_2px_8px_rgba(0,0,0,0.4)]',
        )}
      >
        {/* Subtle upper sapphire crystal highlight */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[46%] bg-gradient-to-b from-white/[0.07] to-transparent"
        />

        <div className="relative z-10 flex items-center">
          {chars.map((ch, idx) => (
            <OdometerColumn
              key={`${unit}-${idx}`}
              digit={ch}
              hydrated={hydrated}
              reduceMotion={reduceMotion}
              accent={isSeconds}
            />
          ))}
        </div>

        {/* Continuous 60fps sub-second vernier hairline synchronized to the exact millisecond */}
        {hydrated && isSeconds && !reduceMotion && subSecondProgress && (
          <motion.span
            aria-hidden="true"
            style={{ scaleX: subSecondProgress, transformOrigin: '0% 50%' }}
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[1.5px] bg-gradient-to-r from-[#7A12F5] via-[#C084FC] to-[#38BDF8] will-change-transform"
          />
        )}
      </div>
      <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-white/45 select-none">
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
      <span aria-hidden="true" className="hidden sm:inline-flex flex-col gap-[3px] px-[1px] opacity-45">
        <span className="size-[2.5px] rounded-full bg-[#C084FC]" />
        <span className="size-[2.5px] rounded-full bg-[#C084FC]" />
      </span>
    );
  }

  return (
    <motion.span
      aria-hidden="true"
      style={{ opacity: colonOpacity }}
      className="hidden sm:inline-flex flex-col gap-[3px] px-[1px] will-change-[opacity]"
    >
      <span className="size-[2.5px] rounded-full bg-[#C084FC]" />
      <span className="size-[2.5px] rounded-full bg-[#C084FC]" />
    </motion.span>
  );
}

/**
 * StageCountdownBar — Global sticky Stage 1 Presale Chronograph Ribbon.
 *
 * Engineered for 60/120fps fluidity with zero generic template animations:
 *  - Continuous 10-digit cylindrical mechanical odometer drums (no unmount flicker)
 *  - rAF-driven MotionValue sub-second vernier hairline & synchronized colon breath
 *  - Precision rotating orbital escapement ring on live Stage 1 indicator
 *  - Atmospheric slow aurora drift in obsidian titanium housing
 */
export function StageCountdownBar({ className }: { className?: string }) {
  const hydrated = useHydrated();
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = hydrated && Boolean(prefersReducedMotion);
  const [snapshot, setSnapshot] = useState<PresaleCountdownSnapshot>(INITIAL_COUNTDOWN_SNAPSHOT);

  // Smooth 60/120fps sub-second MotionValue (1 -> 0 across each real second) with ZERO React re-renders
  const subSecondProgress = useMotionValue(1);
  const colonOpacity = useTransform(subSecondProgress, (p) => 0.28 + 0.62 * Math.sin(p * Math.PI));

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

  const segments = [
    { value: formatCountdownUnit(snapshot.days), unit: 'd', isSeconds: false },
    { value: formatCountdownUnit(snapshot.hours), unit: 'h', isSeconds: false },
    { value: formatCountdownUnit(snapshot.minutes), unit: 'm', isSeconds: false },
    { value: formatCountdownUnit(snapshot.seconds), unit: 's', isSeconds: true },
  ];

  return (
    <div
      data-testid="stage-1-countdown"
      className={cn(
        'relative z-40 w-full shrink-0 overflow-hidden border-b border-white/[0.08] bg-[#090712]/95 backdrop-blur-2xl text-white shadow-[0_8px_24px_rgba(0,0,0,0.22)]',
        className,
      )}
    >
      {/* Slow Fluid Atmospheric Aurora Drift (GPU translate only, dignified 16s sine) */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        {hydrated && !reduceMotion ? (
          <motion.div
            animate={{ x: ['-6%', '6%', '-6%'] }}
            transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -inset-x-[15%] inset-y-0 will-change-transform"
            style={{
              backgroundImage:
                'radial-gradient(45% 150% at 22% 50%, rgba(122, 18, 245, 0.22) 0%, transparent 72%), radial-gradient(38% 140% at 78% 50%, rgba(14, 165, 233, 0.14) 0%, transparent 72%)',
            }}
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'radial-gradient(45% 150% at 22% 50%, rgba(122, 18, 245, 0.22) 0%, transparent 72%), radial-gradient(38% 140% at 78% 50%, rgba(14, 165, 233, 0.14) 0%, transparent 72%)',
            }}
          />
        )}
      </div>

      {/* Hairline bottom accent synced with the sub-second vernier */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-[#A855F7]/35 to-transparent"
      />

      <div className="relative z-10 mx-auto flex max-w-7xl items-center justify-between gap-2 sm:gap-4 px-3 py-2 sm:px-5 md:px-8">
        {/* Left: Precision Escapement Ring + Stage 1 Telemetry + Progress Track */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Precision Watch Escapement Indicator */}
          <span className="relative flex size-4 shrink-0 items-center justify-center">
            {hydrated && !reduceMotion && (
              <motion.span
                aria-hidden="true"
                animate={{ rotate: 360 }}
                transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 rounded-full will-change-transform"
                style={{
                  background:
                    'conic-gradient(from 0deg, rgba(34,197,94,0) 0deg, rgba(34,197,94,0.85) 110deg, rgba(56,189,248,0.6) 170deg, rgba(34,197,94,0) 210deg)',
                  WebkitMaskImage: 'radial-gradient(farthest-side, transparent calc(100% - 1.5px), #000 calc(100% - 1px))',
                  maskImage: 'radial-gradient(farthest-side, transparent calc(100% - 1.5px), #000 calc(100% - 1px))',
                }}
              />
            )}
            <span className="relative size-1.5 rounded-full bg-[#22C55E] shadow-[0_0_8px_rgba(34,197,94,0.85)]" />
          </span>

          {/* Stage 1 Engraved Emblem */}
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <span className="rounded-[6px] border border-[#A855F7]/35 bg-[#7A12F5]/22 px-1.5 sm:px-2 py-[2px] text-[9.5px] sm:text-[10.5px] font-black uppercase tracking-[0.12em] text-[#E9D5FF] whitespace-nowrap">
              Stage 1
            </span>
            <span className="hidden xs:inline sm:inline text-[11px] sm:text-xs font-extrabold tracking-tight text-white whitespace-nowrap">
              Presale
            </span>
            <span aria-hidden="true" className="hidden sm:inline h-3 w-[1px] bg-white/15" />
            <span className="hidden sm:inline font-mono text-[11.5px] font-bold text-[#38BDF8] tabular-nums whitespace-nowrap">
              $0.05
            </span>
          </div>

          {/* Desktop Stage Allocation Progress Track with Luminous Tip */}
          <div className="hidden lg:flex items-center gap-2 pl-1">
            <div className="relative h-[4.5px] w-24 rounded-full bg-white/[0.1] overflow-visible">
              <div
                className="relative h-full rounded-full bg-gradient-to-r from-[#7A12F5] via-[#A855F7] to-[#38BDF8]"
                style={{ width: `${STAGE_1_PROGRESS_PCT}%` }}
              >
                <span className="absolute right-0 top-1/2 size-2 -translate-y-1/2 translate-x-1/2 rounded-full bg-[#E0F2FE] shadow-[0_0_8px_#38BDF8]" />
              </div>
            </div>
            <span className="font-mono text-[10.5px] font-bold text-white/65 tabular-nums whitespace-nowrap">
              {STAGE_1_PROGRESS_PCT}% sold
            </span>
          </div>
        </div>

        {/* Center / Right-Center: Fluid Continuous 10-Digit Mechanical Odometer Drums */}
        <div
          role="timer"
          aria-label={`Stage 1 presale ends in ${snapshot.days} days, ${snapshot.hours} hours, ${snapshot.minutes} minutes, ${snapshot.seconds} seconds`}
          className="flex items-center gap-1 sm:gap-1.5 shrink-0"
        >
          <span className="hidden md:inline text-[10px] font-bold uppercase tracking-[0.14em] text-white/45 mr-1">
            {snapshot.expired ? 'Closed' : 'Ends in'}
          </span>

          {segments.map((seg, idx) => (
            <div key={seg.unit} className="inline-flex items-center gap-1 sm:gap-1.5">
              <ChronographCapsule
                value={seg.value}
                unit={seg.unit}
                hydrated={hydrated}
                reduceMotion={reduceMotion}
                isSeconds={seg.isSeconds}
                subSecondProgress={seg.isSeconds ? subSecondProgress : undefined}
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

        {/* Right: Tactile Action CTA */}
        {!isOnBuyPage ? (
          <Link
            href="/app/buy"
            className="group relative inline-flex h-[28px] sm:h-[30px] shrink-0 items-center gap-1 rounded-full bg-gradient-to-r from-[#7A12F5] via-[#8E2BFF] to-[#7A12F5] px-2.5 sm:px-3.5 text-[10.5px] sm:text-[11.5px] font-extrabold !text-white shadow-[0_0_16px_rgba(122,18,245,0.42)] hover:brightness-110 active:scale-[0.96] transition-all duration-200 whitespace-nowrap"
            style={{ color: '#ffffff' }}
          >
            <span className="sm:hidden">Buy</span>
            <span className="hidden sm:inline">Buy $OKN</span>
            <ArrowRight className="size-3 stroke-[2.5] transition-transform duration-200 ease-out group-hover:translate-x-0.5" />
          </Link>
        ) : (
          <span className="hidden sm:inline-flex h-[28px] shrink-0 items-center rounded-full border border-[#22C55E]/35 bg-[#22C55E]/15 px-3 text-[10.5px] font-extrabold uppercase tracking-wider text-[#4ADE80] whitespace-nowrap">
            Live Now
          </span>
        )}
      </div>
    </div>
  );
}
