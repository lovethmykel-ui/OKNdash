'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  BarChart3,
  Bot,
  ChevronRight,
  Cpu,
  Lock,
  Target,
  Trophy,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { useTheme } from '@/components/layout/area-theme';
import { cn } from '@/lib/utils';

interface AgentGridItem {
  id: string;
  label: string;
  caption: string;
  href: string;
  icon: LucideIcon;
  lightIconSurface: string;
  darkIconSurface: string;
}

const SECONDARY_AGENTS: readonly AgentGridItem[] = [
  {
    id: 'ai-trading',
    label: 'AI Trading',
    caption: 'Auto trade bot',
    href: '/app/trade-bot',
    icon: Bot,
    lightIconSurface: 'bg-[#7A12F5]/12 text-[#7A12F5] ring-[#7A12F5]/20',
    darkIconSurface: 'bg-[#7A12F5]/28 text-[#E2C8FF] ring-[#A855F7]/40',
  },
  {
    id: 'predictions',
    label: 'Predictions',
    caption: 'Live markets',
    href: '/app/prediction-markets',
    icon: BarChart3,
    lightIconSurface: 'bg-[#8C38F7]/12 text-[#6D28D9] ring-[#8C38F7]/20',
    darkIconSurface: 'bg-[#8C38F7]/26 text-[#D8B8FF] ring-[#C084FC]/40',
  },
  {
    id: 'staking',
    label: 'Staking Vault',
    caption: 'Earn $OKN APY',
    href: '/app/staking',
    icon: Lock,
    lightIconSurface: 'bg-emerald-500/12 text-emerald-700 ring-emerald-500/20',
    darkIconSurface: 'bg-emerald-400/18 text-emerald-300 ring-emerald-400/35',
  },
  {
    id: 'agents-hub',
    label: 'All Agents',
    caption: 'Directory',
    href: '/app/agents',
    icon: Cpu,
    lightIconSurface: 'bg-[#7A12F5]/12 text-[#7A12F5] ring-[#7A12F5]/20',
    darkIconSurface: 'bg-[#7A12F5]/28 text-[#E2C8FF] ring-[#A855F7]/40',
  },
  {
    id: 'missions',
    label: 'Missions',
    caption: 'Bonus points',
    href: '/app/missions',
    icon: Target,
    lightIconSurface: 'bg-fuchsia-500/12 text-fuchsia-700 ring-fuchsia-500/20',
    darkIconSurface: 'bg-fuchsia-400/18 text-fuchsia-300 ring-fuchsia-400/35',
  },
  {
    id: 'leaderboard',
    label: 'Leaderboard',
    caption: 'Top earners',
    href: '/app/leaderboard',
    icon: Trophy,
    lightIconSurface: 'bg-amber-500/14 text-amber-700 ring-amber-500/22',
    darkIconSurface: 'bg-amber-400/18 text-amber-300 ring-amber-400/35',
  },
] as const;

interface AgentsHubSheetProps {
  open: boolean;
  onClose: () => void;
}

/**
 * AgentsHubSheet — Theme-adaptive Light & Dark OKN Purple mobile command sheet.
 *
 * Uses `useTheme()` for guaranteed zero-conflict Light & Dark surfaces paired
 * with OKN signature purple (#7A12F5 / #8C38F7) focal hierarchy:
 *  - Featured Polymarket Agent hero card at top with crisp /polymarket.png emblem
 *  - Symmetrical 2x3 grid of OKN agents & ecosystem modules with >=44px touch targets
 *  - Ergonomic thumb-zone OKN purple Close button at bottom
 */
export function AgentsHubSheet({ open, onClose }: AgentsHubSheetProps) {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const handleSelect = (href: string) => {
    onClose();
    router.push(href as never);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="OKN Agents Menu"
          data-testid="mobile-agents-sheet"
          data-sheet-theme={isDark ? 'dark' : 'light'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
          className={cn(
            'fixed inset-0 z-[115] flex items-end justify-center md:hidden',
            isDark
              ? 'bg-black/75 backdrop-blur-[10px]'
              : 'bg-[#160B2E]/42 backdrop-blur-[8px]',
          )}
        >
          <motion.div
            data-testid="mobile-agents-sheet-panel"
            initial={prefersReducedMotion ? { opacity: 0 } : { y: 120, opacity: 0 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { y: 0, opacity: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { y: 120, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 34 }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              'relative w-full max-w-[460px] overflow-hidden rounded-t-[30px] px-5 pt-3 pb-[max(22px,env(safe-area-inset-bottom,22px))] backdrop-blur-2xl ring-1 ring-inset',
              isDark
                ? 'bg-[#120E1F]/98 text-[#F8F7FC] ring-[#A855F7]/25 shadow-[0_-24px_64px_rgba(0,0,0,0.82)]'
                : 'bg-white/98 text-[#120E24] ring-[#7A12F5]/16 shadow-[0_-18px_50px_rgba(32,14,72,0.18)]',
            )}
          >
            {/* Subtle OKN Purple Atmospheric Top Wash */}
            <div
              aria-hidden="true"
              className={cn(
                'pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b to-transparent',
                isDark
                  ? 'from-[#7A12F5]/26 via-[#7A12F5]/[0.08]'
                  : 'from-[#7A12F5]/[0.08] via-[#7A12F5]/[0.025]',
              )}
            />

            {/* Drag Handle */}
            <div
              className={cn(
                'relative z-10 mx-auto mb-4 h-1 w-11 rounded-full',
                isDark ? 'bg-[#C9A6FF]/40' : 'bg-[#7A12F5]/25',
              )}
            />

            {/* Sheet Header */}
            <div className="relative z-10 mb-4 flex items-center justify-between gap-3">
              <div>
                <h2
                  className={cn(
                    'text-[17px] font-extrabold tracking-tight',
                    isDark ? 'text-white' : 'text-[#120E24]',
                  )}
                >
                  OKN Agents
                </h2>
                <p
                  className={cn(
                    'text-xs font-medium',
                    isDark ? 'text-[#B4ACD0]' : 'text-[#5F5878]',
                  )}
                >
                  Autonomous strategies &amp; ecosystem tools
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Dismiss Agents sheet"
                className={cn(
                  'flex size-10 shrink-0 items-center justify-center rounded-full ring-1 ring-inset transition-colors active:scale-95 cursor-pointer',
                  isDark
                    ? 'bg-[#241C3C] text-[#E9D5FF] ring-[#A855F7]/30 hover:bg-[#312554]'
                    : 'bg-[#F3ECFF] text-[#6D0EE2] ring-[#7A12F5]/18 hover:bg-[#E8DBFE]',
                )}
              >
                <X className="size-4.5 stroke-[2.2]" />
              </button>
            </div>

            {/* Featured Primary Agent Spotlight: Polymarket Agent */}
            <motion.button
              type="button"
              data-testid="agents-sheet-polymarket-btn"
              onClick={() => handleSelect('/app/polymarket-agent')}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
              className={cn(
                'group relative z-10 mb-3.5 flex w-full items-center gap-3.5 overflow-hidden rounded-[22px] p-3.5 text-left transition-all cursor-pointer',
                'bg-gradient-to-r from-[#7A12F5] via-[#7016EE] to-[#1652F0] text-white shadow-[0_10px_26px_rgba(122,18,245,0.34)]',
                'ring-1 ring-inset ring-white/25 hover:brightness-105',
              )}
              style={{ color: '#ffffff' }}
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-4 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent"
              />
              <span className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#1652F0] ring-2 ring-white/45 shadow-[0_6px_16px_rgba(11,16,54,0.35)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/polymarket.png"
                  alt="Polymarket"
                  referrerPolicy="no-referrer"
                  className="size-full scale-[1.06] object-cover"
                />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-extrabold tracking-tight text-white">
                    Polymarket Agent
                  </span>
                  <span className="text-[11px] font-semibold text-white/75">
                    · Featured
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs font-medium text-white/85">
                  Auto-copy top prediction whales
                </p>
              </div>
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-white transition-transform duration-200 group-hover:translate-x-0.5">
                <ChevronRight className="size-4 stroke-[2.5]" />
              </span>
            </motion.button>

            {/* Symmetrical 2x3 Theme-Adaptive Agent & Module Grid */}
            <div className="relative z-10 grid grid-cols-2 gap-2.5">
              {SECONDARY_AGENTS.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <motion.button
                    key={item.id}
                    type="button"
                    data-testid={`agents-sheet-item-${item.id}`}
                    onClick={() => handleSelect(item.href)}
                    initial={prefersReducedMotion ? undefined : { opacity: 0, y: 10 }}
                    animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                    transition={{
                      delay: 0.03 + idx * 0.025,
                      duration: 0.22,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
                    className={cn(
                      'group flex min-h-[64px] items-center gap-3 rounded-2xl px-3 py-2.5 text-left ring-1 ring-inset transition-all cursor-pointer select-none',
                      isDark
                        ? 'bg-[#1E1832] ring-[#A855F7]/20 hover:bg-[#281F44] hover:ring-[#A855F7]/45'
                        : 'bg-[#F6F2FE] ring-[#7A12F5]/14 hover:bg-[#EDE4FD] hover:ring-[#7A12F5]/35',
                    )}
                  >
                    <span
                      className={cn(
                        'flex size-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset transition-transform duration-200 group-hover:scale-105',
                        isDark ? item.darkIconSurface : item.lightIconSurface,
                      )}
                    >
                      <Icon className="size-[18px] stroke-[2.2]" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          'truncate text-[13px] font-extrabold leading-tight',
                          isDark ? 'text-white' : 'text-[#151029]',
                        )}
                      >
                        {item.label}
                      </p>
                      <p
                        className={cn(
                          'mt-0.5 truncate text-[11px] font-medium',
                          isDark ? 'text-[#AFA7CB]' : 'text-[#60597A]',
                        )}
                      >
                        {item.caption}
                      </p>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Bottom Ergonomic Thumb-Zone Close Button (OKN Purple Brand Anchor) */}
            <div className="relative z-10 mt-4">
              <button
                type="button"
                data-testid="agents-sheet-close-btn"
                onClick={onClose}
                aria-label="Close Agents menu"
                className={cn(
                  'flex h-11 w-full items-center justify-center gap-2 rounded-2xl text-xs font-extrabold tracking-tight ring-1 ring-inset transition-all active:scale-[0.98] cursor-pointer',
                  isDark
                    ? 'bg-[#7A12F5]/32 text-[#F5F3FF] ring-[#A855F7]/45 hover:bg-[#7A12F5]/44'
                    : 'bg-[#7A12F5]/12 text-[#6D0EE2] ring-[#7A12F5]/20 hover:bg-[#7A12F5]/18',
                )}
              >
                <X className="size-4 stroke-[2.4]" />
                <span>Close</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
