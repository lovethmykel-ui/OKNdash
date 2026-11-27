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
}

const SECONDARY_AGENTS: readonly AgentGridItem[] = [
  {
    id: 'ai-trading',
    label: 'AI Trading',
    caption: 'Auto trade bot',
    href: '/app/trade-bot',
    icon: Bot,
  },
  {
    id: 'predictions',
    label: 'Predictions',
    caption: 'Live markets',
    href: '/app/prediction-markets',
    icon: BarChart3,
  },
  {
    id: 'staking',
    label: 'Staking Vault',
    caption: 'Earn $OKN APY',
    href: '/app/staking',
    icon: Lock,
  },
  {
    id: 'agents-hub',
    label: 'All Agents',
    caption: 'Directory',
    href: '/app/agents',
    icon: Cpu,
  },
  {
    id: 'missions',
    label: 'Missions',
    caption: 'Bonus points',
    href: '/app/missions',
    icon: Target,
  },
  {
    id: 'leaderboard',
    label: 'Leaderboard',
    caption: 'Top earners',
    href: '/app/leaderboard',
    icon: Trophy,
  },
] as const;

/** Apple iOS native sheet deceleration curve — silky, zero overshoot */
const SHEET_EASE: [number, number, number, number] = [0.32, 0.72, 0, 1];

interface AgentsHubSheetProps {
  open: boolean;
  onClose: () => void;
}

/**
 * AgentsHubSheet — Clean, high-contrast mobile action sheet for OKN Agents.
 *
 * Follows disciplined 60-30-10 color restraint:
 *  - Neutral surface canvas & uniform monochrome module tiles (light & dark)
 *  - Single restrained OKN purple focal accent on the Polymarket Agent CTA
 *  - Single GPU-composited slide-up transition (transform-only, zero blur jank)
 */
export function AgentsHubSheet({ open, onClose }: AgentsHubSheetProps) {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const prefersReducedMotion = useReducedMotion();

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

  const handleSelect = (href: string) => {
    onClose();
    router.push(href as never);
  };

  return (
    <AnimatePresence>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="OKN Agents Menu"
          data-testid="mobile-agents-sheet"
          data-sheet-theme={isDark ? 'dark' : 'light'}
          className="fixed inset-0 z-[115] flex items-end justify-center md:hidden"
        >
          {/* Scrim — pure opacity transition, no backdrop-blur repaint jank */}
          <motion.div
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0.12 : 0.24, ease: SHEET_EASE }}
            onClick={onClose}
            className={cn(
              'fixed inset-0',
              isDark ? 'bg-black/68' : 'bg-black/40',
            )}
          />

          {/* Sliding Sheet Panel — single GPU-composited transform layer */}
          <motion.div
            data-testid="mobile-agents-sheet-panel"
            initial={prefersReducedMotion ? { opacity: 0 } : { y: '100%' }}
            animate={prefersReducedMotion ? { opacity: 1 } : { y: '0%' }}
            exit={prefersReducedMotion ? { opacity: 0 } : { y: '100%' }}
            transition={{
              duration: prefersReducedMotion ? 0.14 : 0.34,
              ease: SHEET_EASE,
            }}
            style={{ willChange: 'transform' }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              'relative z-10 w-full max-w-[460px] rounded-t-[26px] border-t border-x px-5 pt-2.5 pb-[max(20px,env(safe-area-inset-bottom,20px))]',
              isDark
                ? 'bg-[#121216] text-[#F5F5F7] border-white/[0.08] shadow-[0_-18px_48px_rgba(0,0,0,0.68)]'
                : 'bg-white text-[#111114] border-black/[0.08] shadow-[0_-16px_40px_rgba(15,23,42,0.12)]',
            )}
          >
            {/* Drag Handle */}
            <div
              aria-hidden="true"
              className={cn(
                'mx-auto mb-3.5 h-1 w-9 rounded-full',
                isDark ? 'bg-white/20' : 'bg-black/15',
              )}
            />

            {/* Header */}
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h2
                  className={cn(
                    'text-[17px] font-semibold tracking-tight leading-snug',
                    isDark ? 'text-[#F5F5F7]' : 'text-[#111114]',
                  )}
                >
                  OKN Agents
                </h2>
                <p
                  className={cn(
                    'text-[13px] font-normal leading-snug',
                    isDark ? 'text-[#8E8E98]' : 'text-[#6B6B76]',
                  )}
                >
                  Strategies, markets &amp; staking
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Dismiss Agents sheet"
                className={cn(
                  'flex size-10 shrink-0 items-center justify-center rounded-full transition-[background-color,transform] duration-150 active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A12F5]',
                  isDark
                    ? 'bg-white/[0.07] text-[#D4D4DC] hover:bg-white/[0.12]'
                    : 'bg-black/[0.05] text-[#3F3F46] hover:bg-black/[0.09]',
                )}
              >
                <X className="size-[18px] stroke-[2]" />
              </button>
            </div>

            {/* Focal Spotlight: Polymarket Agent */}
            <button
              type="button"
              data-testid="agents-sheet-polymarket-btn"
              onClick={() => handleSelect('/app/polymarket-agent')}
              className={cn(
                'group mb-3 flex min-h-[72px] w-full items-center gap-3.5 rounded-2xl border p-3.5 text-left transition-[background-color,border-color,transform] duration-150 active:scale-[0.985] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A12F5]',
                isDark
                  ? 'bg-[#1B1B22] border-white/[0.09] hover:bg-[#22222B] hover:border-white/[0.14]'
                  : 'bg-[#F5F5F8] border-black/[0.07] hover:bg-[#ECECF1] hover:border-black/[0.12]',
              )}
            >
              <span className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-[12px] bg-[#1652F0]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/polymarket.png"
                  alt="Polymarket"
                  referrerPolicy="no-referrer"
                  className="size-full object-cover"
                />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      'truncate text-[14.5px] font-semibold tracking-tight leading-tight',
                      isDark ? 'text-[#F5F5F7]' : 'text-[#111114]',
                    )}
                  >
                    Polymarket Agent
                  </span>
                  <span
                    aria-hidden="true"
                    className={cn(
                      'text-xs',
                      isDark ? 'text-white/30' : 'text-black/25',
                    )}
                  >
                    ·
                  </span>
                  <span
                    className={cn(
                      'shrink-0 text-[12px] font-medium',
                      isDark ? 'text-[#A78BFA]' : 'text-[#7A12F5]',
                    )}
                  >
                    Featured
                  </span>
                </div>
                <p
                  className={cn(
                    'mt-0.5 truncate text-[12.5px] font-normal leading-snug',
                    isDark ? 'text-[#9A9AA6]' : 'text-[#62626E]',
                  )}
                >
                  Copy top prediction traders
                </p>
              </div>
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#7A12F5] text-white transition-transform duration-150 group-hover:translate-x-0.5">
                <ChevronRight className="size-4 stroke-[2.25]" />
              </span>
            </button>

            {/* Unified Monochrome 2x3 Module Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              {SECONDARY_AGENTS.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    data-testid={`agents-sheet-item-${item.id}`}
                    onClick={() => handleSelect(item.href)}
                    className={cn(
                      'group flex min-h-[64px] items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition-[background-color,border-color,transform] duration-150 active:scale-[0.98] cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A12F5]',
                      isDark
                        ? 'bg-[#19191F] border-white/[0.06] hover:bg-[#212129] hover:border-white/[0.11]'
                        : 'bg-[#F7F7F9] border-black/[0.05] hover:bg-[#EFEFF3] hover:border-black/[0.09]',
                    )}
                  >
                    <span
                      className={cn(
                        'flex size-10 shrink-0 items-center justify-center rounded-[11px] transition-colors duration-150',
                        isDark
                          ? 'bg-white/[0.06] text-[#DCDCE5] group-hover:bg-white/[0.10] group-hover:text-white'
                          : 'bg-white text-[#18181B] border border-black/[0.06] shadow-[0_1px_2px_rgba(0,0,0,0.04)]',
                      )}
                    >
                      <Icon className="size-[18px] stroke-[1.9]" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          'truncate text-[13.5px] font-semibold leading-tight',
                          isDark ? 'text-[#F5F5F7]' : 'text-[#111114]',
                        )}
                      >
                        {item.label}
                      </p>
                      <p
                        className={cn(
                          'mt-0.5 truncate text-[11.5px] font-normal leading-tight',
                          isDark ? 'text-[#8E8E98]' : 'text-[#6B6B76]',
                        )}
                      >
                        {item.caption}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Clean Neutral Thumb-Zone Dismiss Button */}
            <div className="mt-3.5">
              <button
                type="button"
                data-testid="agents-sheet-close-btn"
                onClick={onClose}
                aria-label="Close Agents menu"
                className={cn(
                  'flex h-12 w-full items-center justify-center rounded-2xl border text-[14px] font-semibold tracking-tight transition-[background-color,transform] duration-150 active:scale-[0.985] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A12F5]',
                  isDark
                    ? 'bg-[#1B1B21] text-[#E4E4EC] border-white/[0.07] hover:bg-[#24242C]'
                    : 'bg-[#F2F2F5] text-[#18181B] border-black/[0.06] hover:bg-[#E7E7EC]',
                )}
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
