'use client';

import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { useHydrated } from '@/lib/hooks/use-hydrated';
import {
  REFERRAL_BATTLE_FRESH_LOGIN_EVENT,
  REFERRAL_BATTLE_PRIZES,
  markReferralBattlePopupShown,
  shouldShowReferralBattlePopup,
} from '@/lib/referral-battle-popup';
import { cn } from '@/lib/utils';

const BADGE_STYLES = {
  gold: 'bg-gradient-to-b from-[#FCE38A] via-[#F5B027] to-[#B9770E] text-[#4A2C00] ring-2 ring-[#FDE68A]/80 shadow-[0_3px_10px_rgba(245,158,11,0.35)]',
  silver:
    'bg-gradient-to-b from-[#F1F5F9] via-[#CBD5E1] to-[#64748B] text-[#1E293B] ring-2 ring-white/80 shadow-[0_3px_10px_rgba(100,116,139,0.28)]',
  bronze:
    'bg-gradient-to-b from-[#FDBA74] via-[#C97B4B] to-[#7C3F1D] text-[#3B1B07] ring-2 ring-[#FED7AA]/75 shadow-[0_3px_10px_rgba(194,120,72,0.32)]',
} as const;

const PLACE_TEXT_STYLES = {
  gold: 'text-[#C27803]',
  silver: 'text-[#64748B]',
  bronze: 'text-[#9A5B2C]',
} as const;

export function ReferralBattlePopup() {
  const hydrated = useHydrated();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const evaluateFreshLogin = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (shouldShowReferralBattlePopup(window.sessionStorage)) {
      markReferralBattlePopupShown(window.sessionStorage);
      setOpen(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const timer = window.setTimeout(() => {
      evaluateFreshLogin();
    }, 280);

    const onFreshLogin = () => {
      evaluateFreshLogin();
    };
    window.addEventListener(REFERRAL_BATTLE_FRESH_LOGIN_EVENT, onFreshLogin);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(REFERRAL_BATTLE_FRESH_LOGIN_EVENT, onFreshLogin);
    };
  }, [hydrated, evaluateFreshLogin]);

  const dismiss = useCallback(() => {
    if (typeof window !== 'undefined') {
      markReferralBattlePopupShown(window.sessionStorage);
    }
    setOpen(false);
  }, []);

  const handleStart = useCallback(() => {
    dismiss();
    router.push('/app/referral' as never);
  }, [dismiss, router]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        dismiss();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, dismiss]);

  if (!hydrated) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="referral-battle-heading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          onClick={dismiss}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/65 px-4 py-6 backdrop-blur-md overflow-y-auto"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ type: 'spring', stiffness: 360, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="relative mt-10 flex w-full max-w-[368px] flex-col items-center"
          >
            {/* Floating 3D Glossy Bell Hero Illustration */}
            <motion.div
              initial={{ y: -8, rotate: -6 }}
              animate={{ y: [0, -4, 0], rotate: [-2, 3, -1, 0] }}
              transition={{ duration: 2.2, ease: 'easeInOut' }}
              className="pointer-events-none relative z-20 -mb-14 flex items-center justify-center"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/referral-battle/bell-hero.png"
                alt="Referral Battle Notification"
                referrerPolicy="no-referrer"
                className="h-28 w-28 sm:h-32 sm:w-32 object-contain drop-shadow-[0_14px_24px_rgba(122,18,245,0.42)] select-none"
              />
            </motion.div>

            {/* Main Frosted Glass Card */}
            <div className="relative w-full rounded-[30px] border border-white/80 bg-gradient-to-b from-[#FAF8FF] via-[#F4EFFD] to-[#E6DFF9] px-5 pt-16 pb-6 text-[#181824] shadow-[0_28px_72px_rgba(10,6,28,0.58),inset_0_1px_0_rgba(255,255,255,0.95)]">
              {/* Top Showcase Box: 3 iPhone Assets + Live Strip */}
              <div className="overflow-hidden rounded-[20px] border border-[#E4DDF5] bg-white/95 shadow-[0_10px_28px_rgba(122,18,245,0.09)]">
                <div className="grid grid-cols-3 items-center gap-1.5 px-3 pt-4 pb-2.5 bg-gradient-to-b from-white to-[#FBF9FF]">
                  {/* 3rd Prize: iPhone 17 Air */}
                  <div className="flex flex-col items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/assets/referral-battle/iphone-17-air.png"
                      alt="iPhone 17 Air"
                      referrerPolicy="no-referrer"
                      className="h-22 sm:h-24 w-auto object-contain drop-shadow-[0_4px_10px_rgba(15,23,42,0.12)]"
                    />
                  </div>

                  {/* 1st Prize: iPhone Duo */}
                  <div className="flex flex-col items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/assets/referral-battle/iphone-duo.png"
                      alt="iPhone Duo"
                      referrerPolicy="no-referrer"
                      className="h-22 sm:h-24 w-auto object-contain drop-shadow-[0_6px_14px_rgba(15,23,42,0.18)]"
                    />
                  </div>

                  {/* Featured Spotlight Circle: iPhone 18 Pro Max + 1st Badge */}
                  <div className="relative flex items-center justify-center">
                    <div className="relative flex size-24 sm:size-26 items-center justify-center rounded-full border border-[#EAE4FA] bg-gradient-to-b from-white to-[#F7F3FF] p-2.5 shadow-[0_8px_22px_rgba(122,18,245,0.14)]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/assets/referral-battle/iphone-18-pro-max.png"
                        alt="iPhone 18 Pro Max"
                        referrerPolicy="no-referrer"
                        className="h-20 sm:h-22 w-auto object-contain drop-shadow-[0_5px_12px_rgba(88,28,45,0.22)]"
                      />
                    </div>
                    <span className="absolute -top-0.5 right-0 flex size-7 items-center justify-center rounded-full border border-white/80 bg-[#56536A] text-[10px] font-black tracking-tight text-white shadow-md">
                      1st
                    </span>
                  </div>
                </div>

                {/* Showcase Bottom Notification Strip */}
                <div className="flex items-center justify-between gap-2 border-t border-[#EEEAF9] bg-[#F7F4FE]/90 px-3.5 py-2 text-[11.5px]">
                  <p className="truncate text-[#5E5A75]">
                    <strong className="font-extrabold text-[#1E1B2E]">Referral Battle Live!</strong>{' '}
                    <span>Invite friends to win.</span>
                  </p>
                  <button
                    type="button"
                    onClick={dismiss}
                    aria-label="Dismiss announcement"
                    className="flex size-5 shrink-0 items-center justify-center rounded-full text-[#8B87A0] hover:bg-[#E7E1F7] hover:text-[#1E1B2E] transition-colors cursor-pointer"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              </div>

              {/* Headline */}
              <div className="mt-5 text-center">
                <p
                  id="referral-battle-heading"
                  className="text-[20px] sm:text-[22px] font-black uppercase tracking-[0.02em] text-[#232334] leading-tight"
                >
                  STAND A CHANCE
                </p>
                <p className="mt-0.5 bg-gradient-to-r from-[#7A12F5] via-[#B414F5] to-[#DA18CE] bg-clip-text text-[40px] sm:text-[44px] font-black uppercase tracking-tight text-transparent leading-[0.96]">
                  TO WIN
                </p>
                <p className="mt-2 text-xs sm:text-[13px] font-medium text-[#64617B]">
                  The biggest referrals win the biggest rewards.
                </p>
              </div>

              {/* Ranked Prize List */}
              <ul className="mx-auto mt-4 flex max-w-[280px] flex-col gap-2.5">
                {REFERRAL_BATTLE_PRIZES.map((prize) => (
                  <li key={prize.rank} className="flex items-center gap-3">
                    <span
                      className={cn(
                        'flex size-7 shrink-0 items-center justify-center rounded-[9px] text-[11px] font-black tabular-nums',
                        BADGE_STYLES[prize.tier],
                      )}
                    >
                      {prize.rank}
                    </span>
                    <div className="flex items-baseline gap-1.5 text-[14px] sm:text-[15px] leading-snug">
                      <span className={cn('font-extrabold', PLACE_TEXT_STYLES[prize.tier])}>
                        {prize.placeLabel}
                      </span>
                      <span className="font-extrabold text-[#181824]">{prize.title}</span>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Primary CTA Pill Button */}
              <button
                type="button"
                onClick={handleStart}
                className="mt-5 flex h-12 w-full items-center justify-center rounded-full bg-gradient-to-r from-[#7A12F5] via-[#C316F5] to-[#8C1DF7] text-[15px] font-extrabold text-white shadow-[0_10px_28px_rgba(122,18,245,0.42)] transition-all duration-150 hover:brightness-110 active:scale-[0.98] cursor-pointer"
              >
                Start
              </button>
            </div>

            {/* Bottom Circular Dismiss Button */}
            <button
              type="button"
              onClick={dismiss}
              aria-label="Close popup"
              className="mt-4 flex size-10 items-center justify-center rounded-full border border-white/60 bg-black/50 text-white shadow-lg backdrop-blur-md transition-transform duration-150 hover:scale-105 hover:bg-black/70 active:scale-95 cursor-pointer"
            >
              <X className="size-4.5" />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
