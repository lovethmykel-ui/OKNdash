'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { useHydrated } from '@/lib/hooks/use-hydrated';
import {
  REFERRAL_BATTLE_FRESH_LOGIN_EVENT,
  REFERRAL_BATTLE_OPEN_EVENT,
  markReferralBattleShownInDocument,
  shouldShowReferralBattleOnFreshLoad,
} from '@/lib/referral-battle-popup';
import { cn } from '@/lib/utils';

interface PictureAdCampaign {
  id: string;
  title: string;
  imageSrc: string;
  imageAlt: string;
  href: string;
}

/**
 * Full-bleed campaign poster creatives (pure picture posters, not code-built cards).
 * Rotates automatically across fresh sessions and allows immediate browsing via swipe/arrows/dots.
 */
const PICTURE_AD_CAMPAIGNS: readonly PictureAdCampaign[] = [
  {
    id: 'presale-giveaway',
    title: 'Stage 1 Presale Giveaway — Win Flagship iPhones',
    imageSrc: '/assets/campaigns/popup-presale-giveaway.jpg',
    imageAlt: 'Stage 1 Presale Giveaway: Win Flagship iPhones — Lock in $OKN at $0.05',
    href: '/app/buy',
  },
  {
    id: 'polymarket-copy-agent',
    title: 'Polymarket Copy Agent — Mirror Top Whales',
    imageSrc: '/assets/campaigns/popup-polymarket-agent.jpg',
    imageAlt: 'Polymarket Copy Agent: Mirror Top Whales with +38.4% 7D ROI on Polygon',
    href: '/app/polymarket-agent',
  },
  {
    id: 'partner-bnb-vault',
    title: 'Partner Vault — Earn 12.5% Instant BNB Payouts',
    imageSrc: '/assets/campaigns/popup-bnb-partner.jpg',
    imageAlt: 'Partner Vault: Earn 12.5% BNB Instant On-Chain Referral Payouts',
    href: '/app/referral',
  },
] as const;

const AD_ROTATION_KEY = 'okn_popup_ad_rotation_idx_v1';

function readAndAdvanceRotationIndex(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = window.localStorage.getItem(AD_ROTATION_KEY);
    const current = raw ? Number.parseInt(raw, 10) : 0;
    const safeIdx = Number.isFinite(current)
      ? ((current % PICTURE_AD_CAMPAIGNS.length) + PICTURE_AD_CAMPAIGNS.length) % PICTURE_AD_CAMPAIGNS.length
      : 0;
    window.localStorage.setItem(
      AD_ROTATION_KEY,
      String((safeIdx + 1) % PICTURE_AD_CAMPAIGNS.length),
    );
    return safeIdx;
  } catch {
    return 0;
  }
}

export function ReferralBattlePopup() {
  const hydrated = useHydrated();
  const rawReducedMotion = useReducedMotion();
  const prefersReducedMotion = hydrated && Boolean(rawReducedMotion);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const openIfNeeded = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (shouldShowReferralBattleOnFreshLoad()) {
      markReferralBattleShownInDocument();
      setActiveIndex(readAndAdvanceRotationIndex());
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
      setActiveIndex(readAndAdvanceRotationIndex());
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

  const nextAd = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % PICTURE_AD_CAMPAIGNS.length);
  }, []);

  const prevAd = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + PICTURE_AD_CAMPAIGNS.length) % PICTURE_AD_CAMPAIGNS.length);
  }, []);

  const currentCampaign = PICTURE_AD_CAMPAIGNS[activeIndex] ?? PICTURE_AD_CAMPAIGNS[0];

  const handleOpenCampaign = useCallback(() => {
    dismiss();
    router.push(currentCampaign.href as never);
  }, [dismiss, router, currentCampaign.href]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss();
      if (e.key === 'ArrowRight') nextAd();
      if (e.key === 'ArrowLeft') prevAd();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, dismiss, nextAd, prevAd]);

  if (!hydrated) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="referral-battle-heading"
          data-testid="picture-ad-popup"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          onClick={dismiss}
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/72 px-4 py-4 backdrop-blur-[10px] overflow-y-auto"
        >
          <motion.div
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92, y: 18 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 12 }}
            transition={{ type: 'spring', stiffness: 360, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => {
              touchStartX.current = e.touches[0]?.clientX ?? null;
            }}
            onTouchEnd={(e) => {
              if (touchStartX.current !== null) {
                const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
                const deltaX = endX - touchStartX.current;
                if (Math.abs(deltaX) > 36) {
                  if (deltaX < 0) nextAd();
                  else prevAd();
                }
              }
              touchStartX.current = null;
            }}
            className="relative my-auto flex w-full max-w-[356px] sm:max-w-[388px] flex-col items-center"
          >
            <h2 id="referral-battle-heading" className="sr-only">
              {currentCampaign.title}
            </h2>

            {/* Full-Bleed Pure Picture Campaign Poster Frame */}
            <div className="relative w-full overflow-hidden rounded-[26px] border border-white/20 bg-[#0A0714] shadow-[0_32px_80px_rgba(0,0,0,0.72),0_0_0_1px_rgba(255,255,255,0.08)]">
              <button
                type="button"
                onClick={handleOpenCampaign}
                aria-label={currentCampaign.title}
                className="group relative block aspect-[3/4] w-full overflow-hidden text-left cursor-pointer focus:outline-none"
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.img
                    key={currentCampaign.id}
                    src={currentCampaign.imageSrc}
                    alt={currentCampaign.imageAlt}
                    referrerPolicy="no-referrer"
                    initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 1.03 }}
                    animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
                    exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    className="h-full w-full object-cover select-none transition-transform duration-300 group-hover:scale-[1.015]"
                  />
                </AnimatePresence>
              </button>

              {/* Discreet Previous / Next Campaign Controls */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  prevAd();
                }}
                aria-label="Previous campaign poster"
                className="absolute left-2.5 top-1/2 z-20 flex size-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/45 text-white backdrop-blur-md transition-all hover:bg-black/70 active:scale-90 cursor-pointer"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  nextAd();
                }}
                aria-label="Next campaign poster"
                className="absolute right-2.5 top-1/2 z-20 flex size-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/45 text-white backdrop-blur-md transition-all hover:bg-black/70 active:scale-90 cursor-pointer"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>

            {/* Minimalist Campaign Dots */}
            <div
              className="mt-3.5 flex items-center justify-center gap-1.5"
              role="tablist"
              aria-label="Campaign posters"
            >
              {PICTURE_AD_CAMPAIGNS.map((ad, idx) => {
                const isSelected = idx === activeIndex;
                return (
                  <button
                    key={ad.id}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    aria-label={ad.title}
                    onClick={() => setActiveIndex(idx)}
                    className={cn(
                      'h-1.5 rounded-full transition-all duration-200 cursor-pointer',
                      isSelected
                        ? 'w-6 bg-white shadow-[0_0_10px_rgba(255,255,255,0.65)]'
                        : 'w-1.5 bg-white/35 hover:bg-white/65',
                    )}
                  />
                );
              })}
            </div>

            {/* Bottom Circular Dismiss Button */}
            <button
              type="button"
              onClick={dismiss}
              aria-label="Close popup"
              className="mt-3.5 flex size-10 items-center justify-center rounded-full border border-white/55 bg-black/55 text-white shadow-lg backdrop-blur-md transition-transform duration-150 hover:scale-105 hover:bg-black/75 active:scale-95 cursor-pointer"
            >
              <X className="size-4.5" />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
