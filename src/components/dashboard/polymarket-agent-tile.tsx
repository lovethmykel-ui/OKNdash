'use client';

import { motion, useReducedMotion } from 'motion/react';
import { Link } from '@/i18n/navigation';
import { useHydrated } from '@/lib/hooks/use-hydrated';

/**
 * PolymarketAgentTile — Tier-1 animated Home quick-action tile replacing "Claim".
 *
 * Choreographed GPU-composited motion craft:
 *  - Electric royal-cobalt to deep-violet architectural card with subtle glass sheen sweep
 *  - Dual counter-rotating precision orbital rings framing the Polymarket emblem
 *  - Smooth 3D gyroscopic float + micro-tilt on the Polymarket logo with specular glaze
 *  - Tactile spring hover/tap feedback, strictly honoring prefers-reduced-motion
 */
export function PolymarketAgentTile() {
  const hydrated = useHydrated();
  const prefersReducedMotion = useReducedMotion();
  const animateLive = hydrated && !prefersReducedMotion;

  return (
    <motion.div
      whileHover={animateLive ? { y: -2, scale: 1.025 } : undefined}
      whileTap={animateLive ? { scale: 0.94 } : undefined}
      transition={{ type: 'spring', stiffness: 460, damping: 24 }}
      className="relative"
    >
      {/* Subtle Cobalt-Violet Ambient Halo */}
      {animateLive && (
        <motion.span
          aria-hidden="true"
          animate={{ opacity: [0.32, 0.68, 0.32], scale: [0.96, 1.04, 0.96] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
          className="pointer-events-none absolute -inset-[2px] rounded-[18px] bg-gradient-to-br from-[#1652F0] via-[#38BDF8] to-[#7A12F5] blur-[9px] will-change-transform"
        />
      )}

      <Link
        href="/app/polymarket-agent"
        data-testid="home-agent-tile"
        aria-label="Open Polymarket Agent"
        className="group relative flex h-[88px] w-full flex-col items-center justify-center gap-1.5 overflow-hidden rounded-2xl border border-[#93C5FD]/40 text-white shadow-[0_8px_22px_rgba(22,82,240,0.42),inset_0_1px_0_rgba(255,255,255,0.28)]"
        style={{
          background: 'linear-gradient(145deg, #1E44F7 0%, #1652F0 46%, #5C18F0 100%)',
          color: '#ffffff',
        }}
      >
        {/* Choreographed Diagonal Specular Glass Sweep */}
        {animateLive && (
          <motion.span
            aria-hidden="true"
            initial={{ x: '-160%' }}
            animate={{ x: ['-160%', '260%'] }}
            transition={{
              duration: 1.25,
              repeat: Infinity,
              repeatDelay: 2.6,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="pointer-events-none absolute inset-y-[-10px] left-0 w-10 -skew-x-[24deg] bg-gradient-to-r from-transparent via-white/30 to-transparent will-change-transform"
          />
        )}

        {/* Precision Corner Top Highlight */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-3 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#BAE6FD]/80 to-transparent"
        />

        {/* Tier-1 Kinetic Polymarket Emblem Medallion */}
        <span
          className="relative flex size-11 items-center justify-center"
          style={{ perspective: '240px' }}
        >
          {/* Outer Orbiting Luminous Cobalt-Cyan Energy Arc */}
          {animateLive && (
            <motion.span
              aria-hidden="true"
              animate={{ rotate: 360 }}
              transition={{ duration: 3.2, repeat: Infinity, ease: 'linear' }}
              className="pointer-events-none absolute inset-0 rounded-full will-change-transform"
              style={{
                background:
                  'conic-gradient(from 0deg, rgba(255,255,255,0.08) 0deg, rgba(186,230,253,0.98) 65deg, rgba(56,189,248,0.95) 125deg, rgba(255,255,255,0.05) 190deg, rgba(255,255,255,0.08) 360deg)',
                WebkitMaskImage:
                  'radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 1.5px))',
                maskImage:
                  'radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 1.5px))',
              }}
            />
          )}

          {/* Inner Counter-Rotating Precision Sapphire Hairline */}
          {animateLive && (
            <motion.span
              aria-hidden="true"
              animate={{ rotate: -360 }}
              transition={{ duration: 6.4, repeat: Infinity, ease: 'linear' }}
              className="pointer-events-none absolute inset-[2.5px] rounded-full will-change-transform"
              style={{
                background:
                  'conic-gradient(from 180deg, rgba(255,255,255,0) 0deg, rgba(255,255,255,0.72) 70deg, rgba(255,255,255,0) 140deg)',
                WebkitMaskImage:
                  'radial-gradient(farthest-side, transparent calc(100% - 1px), #000 calc(100% - 0.5px))',
                maskImage:
                  'radial-gradient(farthest-side, transparent calc(100% - 1px), #000 calc(100% - 0.5px))',
              }}
            />
          )}

          {/* 3D Gyroscopic Floating Polymarket Logo Core */}
          <motion.span
            animate={
              animateLive
                ? {
                    rotateY: [-11, 11, -11],
                    rotateX: [4, -4, 4],
                    y: [0, -1.5, 0],
                  }
                : undefined
            }
            transition={
              animateLive
                ? { duration: 4.2, repeat: Infinity, ease: 'easeInOut' }
                : undefined
            }
            className="relative z-10 flex size-[34px] items-center justify-center overflow-hidden rounded-full bg-[#1652F0] ring-1 ring-white/55 shadow-[0_4px_12px_rgba(7,18,64,0.5)] will-change-transform"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/polymarket.png"
              alt="Polymarket"
              referrerPolicy="no-referrer"
              className="size-full scale-[1.06] object-cover"
            />
            {/* Optical Glass Glaze Sweep Across Logo Face */}
            {animateLive && (
              <motion.span
                aria-hidden="true"
                initial={{ x: '-140%' }}
                animate={{ x: ['-140%', '220%'] }}
                transition={{
                  duration: 1.0,
                  repeat: Infinity,
                  repeatDelay: 2.85,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="pointer-events-none absolute inset-y-0 left-0 w-4 -skew-x-[22deg] bg-gradient-to-r from-transparent via-white/55 to-transparent will-change-transform"
              />
            )}
          </motion.span>
        </span>

        <span
          className="relative z-10 text-xs font-extrabold tracking-tight text-white !text-white leading-none"
          style={{ color: '#ffffff' }}
        >
          Agent
        </span>
      </Link>
    </motion.div>
  );
}
