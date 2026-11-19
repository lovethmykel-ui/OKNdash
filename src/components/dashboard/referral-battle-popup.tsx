'use client';

import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { X } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { useHydrated } from '@/lib/hooks/use-hydrated';
import {
  REFERRAL_BATTLE_FRESH_LOGIN_EVENT,
  REFERRAL_BATTLE_OPEN_EVENT,
  REFERRAL_BATTLE_PRIZES,
  markReferralBattleShownInDocument,
  shouldShowReferralBattleOnFreshLoad,
} from '@/lib/referral-battle-popup';
import { cn } from '@/lib/utils';

const SHIELD_CLIP_PATH = 'polygon(50% 0%, 96% 16%, 90% 68%, 50% 100%, 10% 68%, 4% 16%)';

const SHIELD_STYLES = {
  gold: 'bg-gradient-to-b from-[#FFE680] via-[#F2A91D] to-[#B8730B] text-[#472800]',
  silver: 'bg-gradient-to-b from-[#F8FAFC] via-[#CBD5E1] to-[#64748B] text-[#1E293B]',
  bronze: 'bg-gradient-to-b from-[#FDBA74] via-[#C87644] to-[#7A3B17] text-[#3B1805]',
} as const;

const SHIELD_SHADOW_STYLES = {
  gold: 'drop-shadow-[0_2px_6px_rgba(245,158,11,0.42)]',
  silver: 'drop-shadow-[0_2px_6px_rgba(100,116,139,0.34)]',
  bronze: 'drop-shadow-[0_2px_6px_rgba(180,95,45,0.38)]',
} as const;

const PLACE_TEXT_STYLES = {
  gold: 'text-[#C27803]',
  silver: 'text-[#64748B]',
  bronze: 'text-[#9A5B2C]',
} as const;

export function ReferralBattlePopup() {
  const hydrated = useHydrated();
  const prefersReducedMotion = useReducedMotion();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const openIfNeeded = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (shouldShowReferralBattleOnFreshLoad()) {
      markReferralBattleShownInDocument();
      setOpen(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    const timer = window.setTimeout(() => {
      openIfNeeded();
    }, 180);

    const onFreshLogin = () => {
      openIfNeeded();
    };
    const onManualOpen = () => {
      markReferralBattleShownInDocument();
      setOpen(true);
    };

    window.addEventListener(REFERRAL_BATTLE_FRESH_LOGIN_EVENT, onFreshLogin);
    window.addEventListener('okn:login', onFreshLogin);
    window.addEventListener(REFERRAL_BATTLE_OPEN_EVENT, onManualOpen);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(REFERRAL_BATTLE_FRESH_LOGIN_EVENT, onFreshLogin);
      window.removeEventListener('okn:login', onFreshLogin);
      window.removeEventListener(REFERRAL_BATTLE_OPEN_EVENT, onManualOpen);
    };
  }, [hydrated, openIfNeeded]);

  const dismiss = useCallback(() => {
    markReferralBattleShownInDocument();
    setOpen(false);
  }, []);

  const handleStart = useCallback(() => {
    dismiss();
    router.push('/app/buy' as never);
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
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/62 px-4 py-4 backdrop-blur-[9px] overflow-y-auto"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ type: 'spring', stiffness: 360, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="relative my-auto flex w-full max-w-[364px] sm:max-w-[388px] flex-col items-center pt-10"
          >
            {/* Floating 3D Glossy Bell Hero Illustration */}
            <motion.div
              initial={{ y: -8, rotate: -6 }}
              animate={{ y: [0, -4, 0], rotate: [-2, 3, -1, 0] }}
              transition={{ duration: 2.2, ease: 'easeInOut' }}
              className="pointer-events-none relative z-20 -mb-12 sm:-mb-13 flex items-center justify-center"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/referral-battle/bell-hero.png"
                alt="Presale Giveaway Notification"
                referrerPolicy="no-referrer"
                className="h-24 w-24 sm:h-28 sm:w-28 object-contain drop-shadow-[0_14px_26px_rgba(122,18,245,0.42)] select-none"
              />
            </motion.div>

            {/* Main Frosted Iridescent Lavender-to-Mint Glass Card */}
            <div className="relative w-full rounded-[28px] border border-white/85 bg-[linear-gradient(170deg,#FAF8FF_0%,#F2EDFE_48%,#E9EEFD_78%,#DDF6F5_100%)] px-4.5 sm:px-5.5 pt-14 sm:pt-15 pb-5.5 text-[#181824] shadow-[0_28px_72px_rgba(10,6,28,0.58),inset_0_1px_0_rgba(255,255,255,0.95)]">
              {/* Top Showcase Box: 3 Uploaded iPhone Assets + Live Strip */}
              <div className="overflow-hidden rounded-[20px] border border-[#E5DFF5] bg-white shadow-[0_10px_28px_rgba(122,18,245,0.09)]">
                <div className="grid grid-cols-[1fr_0.95fr_1.15fr] items-center gap-1.5 px-3 pt-3.5 pb-2.5 bg-white">
                  {/* 3rd Prize: iPhone 17 Air */}
                  <div className="flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={REFERRAL_BATTLE_PRIZES[2].imageSrc}
                      alt={REFERRAL_BATTLE_PRIZES[2].imageAlt}
                      referrerPolicy="no-referrer"
                      className="h-[80px] sm:h-[90px] w-auto object-contain"
                    />
                  </div>

                  {/* 2nd Prize: iPhone 18 Pro Max */}
                  <div className="flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={REFERRAL_BATTLE_PRIZES[1].imageSrc}
                      alt={REFERRAL_BATTLE_PRIZES[1].imageAlt}
                      referrerPolicy="no-referrer"
                      className="h-[78px] sm:h-[88px] w-auto object-contain drop-shadow-[0_6px_14px_rgba(15,23,42,0.14)]"
                    />
                  </div>

                  {/* Featured Spotlight Circle: 1st Prize iPhone Duo + 1st Badge */}
                  <div className="relative flex items-center justify-center">
                    <div className="relative flex size-[86px] sm:size-[94px] items-center justify-center rounded-full border border-[#EAE4FA] bg-white p-2 shadow-[0_8px_22px_rgba(122,18,245,0.14)]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={REFERRAL_BATTLE_PRIZES[0].imageSrc}
                        alt={REFERRAL_BATTLE_PRIZES[0].imageAlt}
                        referrerPolicy="no-referrer"
                        className="h-[68px] sm:h-[74px] w-auto object-contain"
                      />
                      <span className="absolute -top-1 -right-1 flex size-[26px] items-center justify-center rounded-full border-[1.5px] border-white/95 bg-gradient-to-b from-[#69657E] to-[#464357] text-[10px] font-black tracking-tight text-white shadow-md">
                        1st
                      </span>
                    </div>
                  </div>
                </div>

                {/* Showcase Bottom Notification Strip */}
                <div className="flex items-center justify-between gap-2 border-t border-[#EEEAF9] bg-[#F8F5FE] px-3.5 py-2 text-[11px] sm:text-[11.5px]">
                  <p className="truncate text-[#5E5A75]">
                    <strong className="font-extrabold text-[#1E1B2E]">Presale Giveaway Live!</strong>{' '}
                    <span>Join Presale to win.</span>
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
              <div className="mt-4.5 text-center">
                <p
                  id="referral-battle-heading"
                  className="text-[19px] sm:text-[21px] font-black uppercase tracking-[0.02em] text-[#222230] leading-tight"
                >
                  STAND A CHANCE
                </p>
                <p className="mt-0.5 bg-gradient-to-r from-[#7A12F5] via-[#C316F5] to-[#DF19CE] bg-clip-text text-[38px] sm:text-[42px] font-black uppercase tracking-tight text-transparent leading-[0.95]">
                  TO WIN
                </p>
                <p className="mt-1.5 px-2 text-[12px] sm:text-[13px] font-medium leading-snug text-[#64617B]">
                  Win any of the iPhones by participating in the Presale.
                </p>
              </div>

              {/* Ranked Prize List with Metallic Pointed Shield Badges */}
              <ul className="mx-auto mt-4 flex max-w-[272px] flex-col gap-2.5">
                {REFERRAL_BATTLE_PRIZES.map((prize) => (
                  <li key={prize.rank} className="flex items-center gap-3">
                    <span className={cn('inline-flex shrink-0', SHIELD_SHADOW_STYLES[prize.tier])}>
                      <span
                        style={{ clipPath: SHIELD_CLIP_PATH }}
                        className={cn(
                          'flex h-[30px] w-[26px] items-center justify-center pb-0.5 text-[11px] font-black tabular-nums',
                          SHIELD_STYLES[prize.tier],
                        )}
                      >
                        {prize.rank}
                      </span>
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

              {/* Primary CTA Pill Button with Smooth Attention Pulse */}
              <div className="relative mt-5">
                {!prefersReducedMotion && (
                  <motion.span
                    aria-hidden="true"
                    initial={{ opacity: 0.4, scale: 0.985 }}
                    animate={{
                      opacity: [0.4, 0.78, 0.4],
                      scale: [0.985, 1.03, 0.985],
                    }}
                    transition={{
                      duration: 1.85,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    className="pointer-events-none absolute -inset-1 rounded-full bg-gradient-to-r from-[#7A12F5]/45 via-[#C818F5]/45 to-[#941DF7]/45 blur-[10px] will-change-transform"
                  />
                )}
                <motion.button
                  type="button"
                  onClick={handleStart}
                  animate={
                    prefersReducedMotion
                      ? undefined
                      : { scale: [1, 1.022, 1] }
                  }
                  transition={
                    prefersReducedMotion
                      ? undefined
                      : {
                          duration: 1.85,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }
                  }
                  whileHover={
                    prefersReducedMotion
                      ? undefined
                      : {
                          scale: 1.035,
                          transition: { type: 'spring', stiffness: 480, damping: 28 },
                        }
                  }
                  whileTap={{
                    scale: 0.965,
                    transition: { type: 'spring', stiffness: 560, damping: 30 },
                  }}
                  className="relative flex h-11 sm:h-12 w-full items-center justify-center rounded-full bg-gradient-to-r from-[#7A12F5] via-[#C818F5] to-[#941DF7] text-[15px] font-extrabold text-white shadow-[0_10px_26px_rgba(138,24,245,0.44)] transition-[filter] duration-150 hover:brightness-110 will-change-transform cursor-pointer"
                >
                  <span>Start</span>
                </motion.button>
              </div>
            </div>

            {/* Bottom Circular Dismiss Button */}
            <button
              type="button"
              onClick={dismiss}
              aria-label="Close popup"
              className="mt-3.5 flex size-10 items-center justify-center rounded-full border border-white/75 bg-black/50 text-white shadow-lg backdrop-blur-md transition-transform duration-150 hover:scale-105 hover:bg-black/70 active:scale-95 cursor-pointer"
            >
              <X className="size-4.5" />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
