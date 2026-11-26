'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  BarChart3,
  Bot,
  Cpu,
  Lock,
  Target,
  Trophy,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

interface AgentOrbItem {
  id: string;
  label: string;
  href: string;
  imageSrc?: string;
  icon?: LucideIcon;
  orbBg: string;
  iconGlow: string;
  ringAccent: string;
  featured?: boolean;
}

/**
 * Staggered 2 - 3 - 2 circular medallion launcher matching the user's dark
 * obsidian bottom-sheet visual reference.
 */
const AGENT_ROWS: readonly (readonly AgentOrbItem[])[] = [
  [
    {
      id: 'polymarket',
      label: 'Polymarket',
      href: '/app/polymarket-agent',
      imageSrc: '/assets/aistudio/IMG_6464_df7f8c90.jpeg',
      orbBg: 'radial-gradient(circle at 30% 25%, rgba(37, 99, 235, 0.42), rgba(24, 24, 34, 0.96) 72%)',
      iconGlow: 'shadow-[0_10px_24px_rgba(22,82,240,0.45)]',
      ringAccent: 'ring-[#38BDF8]/40',
      featured: true,
    },
    {
      id: 'ai-trading',
      label: 'AI Trading',
      href: '/app/trade-bot',
      icon: Bot,
      orbBg: 'radial-gradient(circle at 30% 25%, rgba(245, 158, 11, 0.36), rgba(24, 24, 34, 0.96) 72%)',
      iconGlow: 'shadow-[0_10px_24px_rgba(245,158,11,0.34)]',
      ringAccent: 'ring-[#FBBF24]/35',
    },
  ],
  [
    {
      id: 'predictions',
      label: 'Predictions',
      href: '/app/prediction-markets',
      icon: BarChart3,
      orbBg: 'radial-gradient(circle at 30% 25%, rgba(122, 18, 245, 0.38), rgba(24, 24, 34, 0.96) 72%)',
      iconGlow: 'shadow-[0_10px_24px_rgba(122,18,245,0.38)]',
      ringAccent: 'ring-[#C084FC]/35',
    },
    {
      id: 'staking',
      label: 'Staking\nVault',
      href: '/app/staking',
      icon: Lock,
      orbBg: 'radial-gradient(circle at 30% 25%, rgba(16, 185, 129, 0.36), rgba(24, 24, 34, 0.96) 72%)',
      iconGlow: 'shadow-[0_10px_24px_rgba(16,185,129,0.32)]',
      ringAccent: 'ring-[#34D399]/35',
    },
    {
      id: 'agents-hub',
      label: 'All Agents',
      href: '/app/agents',
      icon: Cpu,
      orbBg: 'radial-gradient(circle at 30% 25%, rgba(14, 165, 233, 0.38), rgba(24, 24, 34, 0.96) 72%)',
      iconGlow: 'shadow-[0_10px_24px_rgba(14,165,233,0.34)]',
      ringAccent: 'ring-[#38BDF8]/35',
    },
  ],
  [
    {
      id: 'missions',
      label: 'Missions',
      href: '/app/missions',
      icon: Target,
      orbBg: 'radial-gradient(circle at 30% 25%, rgba(236, 72, 153, 0.36), rgba(24, 24, 34, 0.96) 72%)',
      iconGlow: 'shadow-[0_10px_24px_rgba(236,72,153,0.32)]',
      ringAccent: 'ring-[#F472B6]/35',
    },
    {
      id: 'leaderboard',
      label: 'Leaderboard',
      href: '/app/leaderboard',
      icon: Trophy,
      orbBg: 'radial-gradient(circle at 30% 25%, rgba(250, 204, 21, 0.34), rgba(24, 24, 34, 0.96) 72%)',
      iconGlow: 'shadow-[0_10px_24px_rgba(250,204,21,0.3)]',
      ringAccent: 'ring-[#FDE047]/35',
    },
  ],
] as const;

const ICON_SURFACE_GRADIENTS: Record<string, string> = {
  'ai-trading': 'from-[#FDE68A] via-[#F59E0B] to-[#B45309] text-[#1F1203]',
  predictions: 'from-[#E9D5FF] via-[#A855F7] to-[#6B21A8] text-white',
  staking: 'from-[#A7F3D0] via-[#10B981] to-[#047857] text-[#022C22]',
  'agents-hub': 'from-[#BAE6FD] via-[#0EA5E9] to-[#0369A1] text-white',
  missions: 'from-[#FBCFE8] via-[#EC4899] to-[#9D174D] text-white',
  leaderboard: 'from-[#FEF08A] via-[#EAB308] to-[#A16207] text-[#261802]',
};

interface AgentsHubSheetProps {
  open: boolean;
  onClose: () => void;
}

export function AgentsHubSheet({ open, onClose }: AgentsHubSheetProps) {
  const router = useRouter();
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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 z-[115] flex items-end justify-center bg-black/62 backdrop-blur-[6px] md:hidden"
        >
          <motion.div
            initial={prefersReducedMotion ? { opacity: 0 } : { y: '100%' }}
            animate={prefersReducedMotion ? { opacity: 1 } : { y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { y: '100%' }}
            transition={{ type: 'spring', stiffness: 360, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[460px] rounded-t-[32px] border-t border-white/[0.1] bg-[#141319]/96 px-6 pt-3.5 pb-[max(24px,env(safe-area-inset-bottom,24px))] text-white shadow-[0_-20px_60px_rgba(0,0,0,0.68)] backdrop-blur-2xl"
          >
            {/* Subtle Sheet Handle */}
            <div className="mx-auto mb-7 h-[4px] w-12 rounded-full bg-white/20" />

            {/* Staggered 2 - 3 - 2 Circular Medallion Rows */}
            <div className="space-y-6">
              {AGENT_ROWS.map((row, rowIdx) => (
                <div
                  key={rowIdx}
                  className={cn(
                    'flex items-start justify-center',
                    row.length === 2 ? 'gap-12' : 'gap-6',
                  )}
                >
                  {row.map((item, itemIdx) => {
                    const currentOrder = rowIdx * 3 + itemIdx;
                    const Icon = item.icon;
                    return (
                      <motion.button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelect(item.href)}
                        initial={prefersReducedMotion ? undefined : { opacity: 0, y: 14, scale: 0.92 }}
                        animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
                        transition={{
                          delay: 0.04 + currentOrder * 0.035,
                          type: 'spring',
                          stiffness: 420,
                          damping: 26,
                        }}
                        whileTap={{ scale: 0.92 }}
                        className="group flex w-[84px] flex-col items-center gap-2.5 text-center cursor-pointer select-none focus:outline-none"
                      >
                        <span
                          className={cn(
                            'relative flex size-[72px] items-center justify-center rounded-full ring-1 transition-transform duration-200 group-hover:scale-105',
                            item.ringAccent,
                            item.iconGlow,
                          )}
                          style={{ background: item.orbBg }}
                        >
                          {/* Subtle top hemisphere specular rim */}
                          <span
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-[1px] rounded-full bg-gradient-to-b from-white/[0.12] via-transparent to-transparent"
                          />

                          {item.imageSrc ? (
                            <span className="relative flex size-11 items-center justify-center overflow-hidden rounded-full ring-2 ring-[#38BDF8]/65 shadow-[0_6px_16px_rgba(22,82,240,0.55)]">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={item.imageSrc}
                                alt={item.label}
                                referrerPolicy="no-referrer"
                                className="size-full scale-[1.06] object-cover"
                              />
                            </span>
                          ) : Icon ? (
                            <span
                              className={cn(
                                'relative flex size-11 items-center justify-center rounded-[15px] bg-gradient-to-br shadow-[0_6px_16px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.45)]',
                                ICON_SURFACE_GRADIENTS[item.id] ?? 'from-white/20 to-white/5 text-white',
                              )}
                            >
                              <Icon className="size-5.5 stroke-[2.3]" />
                            </span>
                          ) : null}
                        </span>

                        <span className="whitespace-pre-line text-[13px] font-semibold leading-[1.2] tracking-[-0.01em] text-white/95">
                          {item.label}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Bottom Centered Circular Crimson-Tinted Close Button */}
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={onClose}
                aria-label="Close Agents menu"
                className="flex size-[66px] flex-col items-center justify-center gap-0.5 rounded-full bg-[#4A1C24]/90 text-white ring-1 ring-[#F43F5E]/35 shadow-[0_10px_28px_rgba(0,0,0,0.45)] transition-transform duration-150 hover:scale-105 active:scale-95 cursor-pointer"
              >
                <X className="size-5 stroke-[2.2] text-white" />
                <span className="text-[11px] font-semibold tracking-tight text-white/90">
                  Close
                </span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
