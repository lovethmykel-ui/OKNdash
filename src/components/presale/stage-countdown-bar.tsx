'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
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

/** Single mechanical 3D split-flap digit that rolls smoothly only when its character changes. */
function FlipDigit({
  digit,
  reduceMotion,
  accent = false,
}: {
  digit: string;
  reduceMotion: boolean;
  accent?: boolean;
}) {
  return (
    <span
      className="relative inline-flex h-[20px] sm:h-[22px] w-[11px] sm:w-[13px] items-center justify-center overflow-hidden"
      style={{ perspective: '240px' }}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={digit}
          initial={
            reduceMotion
              ? { opacity: 0 }
              : { y: '-78%', rotateX: 62, opacity: 0 }
          }
          animate={
            reduceMotion
              ? { opacity: 1 }
              : { y: '0%', rotateX: 0, opacity: 1 }
          }
          exit={
            reduceMotion
              ? { opacity: 0 }
              : { y: '78%', rotateX: -62, opacity: 0 }
          }
          transition={{
            type: 'spring',
            stiffness: 460,
            damping: 30,
            mass: 0.65,
          }}
          className={cn(
            'absolute inset-0 flex items-center justify-center font-mono text-[13px] sm:text-[14.5px] font-black leading-none tabular-nums will-change-transform',
            accent ? 'text-[#E9D5FF]' : 'text-white',
          )}
        >
          {digit}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/** Precision machined two-digit chronograph tumbler with split-hinge hairline & top glass sheen. */
function TumblerUnit({
  value,
  unit,
  reduceMotion,
  isSeconds = false,
}: {
  value: string;
  unit: string;
  reduceMotion: boolean;
  isSeconds?: boolean;
}) {
  const padded = value.padStart(2, '0');
  const chars = padded.split('');

  return (
    <div className="inline-flex items-center gap-[3px]">
      <div
        className={cn(
          'relative inline-flex items-center justify-center rounded-[7px] px-[4px] sm:px-[5px] py-[2px] border overflow-hidden select-none',
          isSeconds
            ? 'border-[#9D4DFF]/60 bg-gradient-to-b from-[#261447] via-[#180E30] to-[#110922] shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_0_14px_rgba(122,18,245,0.34)]'
            : 'border-white/[0.13] bg-gradient-to-b from-[#1B172C] via-[#131020] to-[#0D0B17] shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_3px_10px_rgba(0,0,0,0.45)]',
        )}
      >
        {/* Top subtle glass reflection */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/[0.08] to-transparent"
        />
        {/* Mechanical split-flap center hinge */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-1/2 z-20 h-[1px] -translate-y-1/2 bg-black/55 shadow-[0_1px_0_rgba(255,255,255,0.06)]"
        />
        {/* Live per-second specular tick flash */}
        {isSeconds && !reduceMotion && (
          <motion.span
            key={padded}
            aria-hidden="true"
            initial={{ opacity: 0.45 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-tr from-[#7A12F5]/30 via-[#C084FC]/20 to-transparent"
          />
        )}
        <div className="relative z-10 flex items-center">
          {chars.map((ch, idx) => (
            <FlipDigit
              key={`${unit}-${idx}`}
              digit={ch}
              reduceMotion={reduceMotion}
              accent={isSeconds}
            />
          ))}
        </div>
      </div>
      <span className="text-[9.5px] sm:text-[10px] font-bold uppercase tracking-wider text-white/45 select-none">
        {unit}
      </span>
    </div>
  );
}

/**
 * StageCountdownBar — Global kinetic Stage 1 Presale Chronograph Ribbon.
 *
 * Mounted directly beneath the top bar across every dashboard page:
 *  - Mechanical 3D split-flap rolling digit tumblers (DD : HH : MM : SS)
 *  - Continuous orbital light-beam sweep along the lower hairline border
 *  - Live Stage 1 telemetry ($0.05 + 68.4% sold progress bar on desktop)
 *  - Tactile metallic CTA linking straight to /app/buy
 */
export function StageCountdownBar({ className }: { className?: string }) {
  const hydrated = useHydrated();
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  const [snapshot, setSnapshot] = useState<PresaleCountdownSnapshot>(INITIAL_COUNTDOWN_SNAPSHOT);

  useEffect(() => {
    if (!hydrated) return;
    const sync = () => setSnapshot(computePresaleCountdown(Date.now(), STAGE_1_END_MS));
    sync();
    const id = window.setInterval(sync, 1000);
    return () => window.clearInterval(id);
  }, [hydrated]);

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
        'relative z-40 w-full shrink-0 overflow-hidden border-b border-white/[0.09] bg-[#0B0816] text-white',
        className,
      )}
    >
      {/* Subtle Architectural Micro-Grid Texture & Ambient Depth */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(60% 140% at 15% 50%, rgba(122, 18, 245, 0.24) 0%, transparent 70%), radial-gradient(45% 120% at 88% 50%, rgba(14, 165, 233, 0.14) 0%, transparent 70%), repeating-linear-gradient(90deg, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 28px)',
        }}
      />

      {/* Continuous Sweeping Specular Light Beam Along Bottom Border */}
      {hydrated && !reduceMotion && (
        <motion.div
          aria-hidden="true"
          initial={{ x: '-35%' }}
          animate={{ x: '135%' }}
          transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut', repeatDelay: 0.8 }}
          className="pointer-events-none absolute bottom-0 left-0 h-[1.5px] w-[38%] bg-gradient-to-r from-transparent via-[#A855F7] to-transparent opacity-90"
        />
      )}

      <div className="relative z-10 mx-auto flex max-w-7xl items-center justify-between gap-2 sm:gap-4 px-3 py-2 sm:px-5 md:px-8">
        {/* Left: Engraved Stage 1 Status + Price + Progress Rail */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Live Radar Pulse Dot */}
          <span className="relative flex size-2 shrink-0 items-center justify-center">
            {hydrated && !reduceMotion && (
              <motion.span
                aria-hidden="true"
                animate={{ scale: [1, 2.35], opacity: [0.75, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
                className="absolute inset-0 rounded-full bg-[#22C55E]"
              />
            )}
            <span className="relative size-2 rounded-full bg-[#22C55E] shadow-[0_0_8px_#22C55E]" />
          </span>

          {/* Stage 1 Engraved Emblem */}
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <span className="relative overflow-hidden rounded-[6px] border border-[#A855F7]/40 bg-[#7A12F5]/25 px-1.5 sm:px-2 py-[2px] text-[9.5px] sm:text-[10.5px] font-black uppercase tracking-[0.12em] text-[#E9D5FF] whitespace-nowrap">
              Stage 1
            </span>
            <span className="hidden xs:inline sm:inline text-[11px] sm:text-xs font-extrabold tracking-tight text-white whitespace-nowrap">
              Presale
            </span>
            <span
              aria-hidden="true"
              className="hidden sm:inline h-3 w-[1px] bg-white/15"
            />
            <span className="hidden sm:inline font-mono text-[11.5px] font-bold text-[#38BDF8] tabular-nums whitespace-nowrap">
              $0.05
            </span>
          </div>

          {/* Desktop Stage Allocation Progress Bar */}
          <div className="hidden lg:flex items-center gap-2 pl-1">
            <div className="relative h-[5px] w-24 overflow-hidden rounded-full bg-white/10">
              <div
                className="relative h-full rounded-full bg-gradient-to-r from-[#7A12F5] via-[#A855F7] to-[#38BDF8]"
                style={{ width: `${STAGE_1_PROGRESS_PCT}%` }}
              >
                {hydrated && !reduceMotion && (
                  <motion.span
                    aria-hidden="true"
                    initial={{ x: '-100%' }}
                    animate={{ x: '220%' }}
                    transition={{ duration: 2.6, repeat: Infinity, ease: 'linear', repeatDelay: 1.2 }}
                    className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/75 to-transparent"
                  />
                )}
              </div>
            </div>
            <span className="font-mono text-[10.5px] font-bold text-white/65 tabular-nums whitespace-nowrap">
              {STAGE_1_PROGRESS_PCT}% sold
            </span>
          </div>
        </div>

        {/* Center / Right-Center: Mechanical 3D Flip-Odometer Tumblers */}
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
              <TumblerUnit
                value={seg.value}
                unit={seg.unit}
                reduceMotion={reduceMotion}
                isSeconds={seg.isSeconds}
              />
              {idx < segments.length - 1 && (
                <span
                  aria-hidden="true"
                  className="hidden sm:inline-flex flex-col gap-[3px] px-[1px] opacity-55"
                >
                  <span className="size-[2.5px] rounded-full bg-[#C084FC]" />
                  <span className="size-[2.5px] rounded-full bg-[#C084FC]" />
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Right: Kinetic Action Button */}
        {!isOnBuyPage ? (
          <Link
            href="/app/buy"
            className="group relative inline-flex h-[28px] sm:h-[30px] shrink-0 items-center gap-1 overflow-hidden rounded-full bg-gradient-to-r from-[#7A12F5] via-[#8E2BFF] to-[#7A12F5] px-2.5 sm:px-3.5 text-[10.5px] sm:text-[11.5px] font-extrabold !text-white shadow-[0_0_18px_rgba(122,18,245,0.48)] hover:brightness-110 active:scale-95 transition-all whitespace-nowrap"
            style={{ color: '#ffffff' }}
          >
            {hydrated && !reduceMotion && (
              <motion.span
                aria-hidden="true"
                initial={{ x: '-140%' }}
                animate={{ x: '260%' }}
                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3.2, ease: 'easeInOut' }}
                className="pointer-events-none absolute inset-y-0 left-0 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/35 to-transparent"
              />
            )}
            <span className="relative z-10 sm:hidden">Buy</span>
            <span className="relative z-10 hidden sm:inline">Buy $OKN</span>
            <ArrowRight className="relative z-10 size-3 stroke-[2.5] transition-transform duration-200 group-hover:translate-x-0.5" />
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
