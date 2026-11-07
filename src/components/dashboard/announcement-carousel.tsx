'use client';

import { useState, useEffect, useRef } from 'react';
import { Link } from '@/i18n/navigation';
import { ArrowRight } from 'lucide-react';

/**
 * AnnouncementCarousel — Pure Graphic announcement slider.
 *
 * Design Architecture:
 * - Zero neon colors: clean surfaces matching var(--s1)/var(--s2) and border-[var(--line)].
 * - Pure vector graphics: high-craft SVG geometric line art embedded in background.
 * - Clean auto-rotating & touch-swipeable viewport without bottom clutter pills/arrows.
 */
export function AnnouncementCarousel({ id = 'ann-carousel' }: { id?: string }) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const totalSlides = 2;

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % totalSlides);
    }, 5500);
    return () => clearInterval(timer);
  }, [isPaused]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
    const deltaX = endX - touchStartX.current;
    if (Math.abs(deltaX) > 40) {
      setActiveSlide((prev) =>
        deltaX < 0 ? (prev + 1) % totalSlides : (prev - 1 + totalSlides) % totalSlides,
      );
    }
    touchStartX.current = null;
  };

  return (
    <section
      id={id}
      className="announcement-carousel w-full select-none"
      aria-roledescription="carousel"
      aria-label="Featured Announcements"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="announcement-carousel-viewport overflow-hidden rounded-[22px] border border-[var(--line)] bg-[var(--s1)] shadow-sm">
        <div
          className="announcement-carousel-track flex transition-transform duration-500 ease-out"
          style={{ transform: `translate3d(-${activeSlide * 100}%, 0px, 0px)` }}
        >
          {/* =================================================================
              Slide 0: Polymarket Copy Agent
              ================================================================= */}
          <div className={`announcement-slide min-w-full shrink-0 ${activeSlide === 0 ? 'active' : ''}`}>
            <Link
              href="/app/polymarket-agent"
              className="group relative block overflow-hidden p-4 sm:p-5 md:px-6 md:py-5 text-[var(--tx)] transition-all hover:bg-[var(--s2)]/50"
              aria-label="Open Polymarket Copy Agent"
            >
              {/* Pure Graphic Background: Fine SVG Prediction Vector Lines */}
              <svg
                className="absolute inset-0 size-full pointer-events-none opacity-[0.07] text-[var(--tx)]"
                viewBox="0 0 800 160"
                preserveAspectRatio="none"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path d="M-20 130 C120 110, 240 40, 380 60 C520 80, 640 25, 820 15" stroke="currentColor" strokeWidth="1.5" />
                <path d="M-20 85 C140 70, 260 120, 420 95 C580 70, 680 30, 820 55" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
                <path d="M-20 40 C100 20, 280 80, 460 50 C620 20, 720 70, 820 40" stroke="currentColor" strokeWidth="1" opacity="0.6" />
                <circle cx="380" cy="60" r="4" fill="currentColor" />
                <circle cx="640" cy="25" r="3" fill="currentColor" />
                <circle cx="720" cy="80" r="48" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
              </svg>

              {/* Slide Content — 2-Zone Desktop Hierarchy (Left Identity/Copy + Right Social Proof & CTA) */}
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3.5 md:gap-6">
                {/* Left Zone: Brand Icon + 3-Tier Typographic Stack */}
                <div className="flex items-start sm:items-center gap-3.5 md:gap-4 min-w-0 flex-1">
                  <div className="relative size-11 sm:size-12 md:size-14 rounded-2xl bg-[var(--s2)] border border-[var(--line)] flex items-center justify-center shrink-0 shadow-sm group-hover:border-[#7A12F5]/40 transition-colors">
                    <img
                      src="/polymarket.png"
                      alt="Polymarket"
                      className="size-7 sm:size-8 md:size-9 object-contain"
                    />
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    {/* Tier 1: Eyebrow Badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] sm:text-[11px] font-extrabold bg-[#FFD60A]/15 text-[#FFD60A] border border-[#FFD60A]/30">
                        <span className="size-1.5 rounded-full bg-[#FFD60A] animate-pulse" />
                        COMING SOON
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10.5px] sm:text-[11px] font-bold bg-[var(--s2)] text-[var(--tx)] border border-[var(--line)]">
                        +38.4% 7D ROI · 78% Win Rate
                      </span>
                    </div>

                    {/* Tier 2: Headline */}
                    <h3 className="text-sm sm:text-base md:text-lg font-extrabold tracking-tight text-[var(--tx)] leading-snug">
                      Polymarket Copy Agent — <span className="text-[#7A12F5] dark:text-[#9D4EDD]">Coming Soon</span>
                    </h3>

                    {/* Tier 3: Supporting Description */}
                    <p className="text-xs sm:text-[13px] text-[var(--mut)] font-medium line-clamp-2 sm:line-clamp-1">
                      Auto-mirror top 1% prediction whales in real time with 1-click execution.
                    </p>
                  </div>
                </div>

                {/* Right Zone: Social Proof + Primary CTA Button */}
                <div className="flex items-center justify-between md:justify-end gap-3.5 pt-2.5 md:pt-0 border-t border-[var(--line)]/60 md:border-t-0 shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="hidden sm:flex items-center -space-x-1.5 shrink-0">
                      <span className="size-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white bg-[#1652F0] border border-[var(--s1)]">
                        0x
                      </span>
                      <span className="size-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white bg-[#10B981] border border-[var(--s1)]">
                        W1
                      </span>
                      <span className="size-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white bg-[#7A12F5] border border-[var(--s1)]">
                        +9
                      </span>
                    </div>
                    <span className="text-[11px] sm:text-xs font-semibold text-[var(--mut)] whitespace-nowrap">
                      142 whales mirrored
                    </span>
                  </div>

                  <span className="inline-flex items-center justify-center gap-1.5 h-8 sm:h-9 md:h-10 px-3.5 md:px-4 rounded-xl text-[11px] sm:text-xs font-extrabold bg-[#7A12F5] !text-white text-white shadow-[0_4px_14px_rgba(122,18,245,0.35)] shrink-0 whitespace-nowrap group-hover:bg-[#8C38F7] active:scale-95 transition-all">
                    <span>Open Agent</span>
                    <ArrowRight className="size-3.5 stroke-[2.5]" />
                  </span>
                </div>
              </div>
            </Link>
          </div>

          {/* =================================================================
              Slide 1: Buy $OKN Presale Multi-Gateway
              ================================================================= */}
          <div className={`announcement-slide min-w-full shrink-0 ${activeSlide === 1 ? 'active' : ''}`}>
            <Link
              href="/app/buy"
              className="group relative block overflow-hidden p-4 sm:p-5 md:px-6 md:py-5 text-[var(--tx)] transition-all hover:bg-[var(--s2)]/50"
              aria-label="Buy $OKN Presale"
            >
              {/* Pure Graphic Background: Fine SVG Blockchain Orbital Vector Lines */}
              <svg
                className="absolute inset-0 size-full pointer-events-none opacity-[0.07] text-[var(--tx)]"
                viewBox="0 0 800 160"
                preserveAspectRatio="none"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <circle cx="700" cy="80" r="75" stroke="currentColor" strokeWidth="1" strokeDasharray="5 5" />
                <circle cx="700" cy="80" r="45" stroke="currentColor" strokeWidth="1" />
                <path d="M-20 120 C140 60, 280 15, 460 70 C620 115, 720 40, 820 20" stroke="currentColor" strokeWidth="1.5" />
                <path d="M-20 40 C160 85, 300 135, 480 80 C640 30, 740 90, 820 70" stroke="currentColor" strokeWidth="1" opacity="0.6" />
                <circle cx="460" cy="70" r="4" fill="currentColor" />
                <circle cx="280" cy="15" r="3" fill="currentColor" />
              </svg>

              {/* Slide Content — Identical 2-Zone Desktop Hierarchy */}
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3.5 md:gap-6">
                {/* Left Zone: Brand Icon + 3-Tier Typographic Stack */}
                <div className="flex items-start sm:items-center gap-3.5 md:gap-4 min-w-0 flex-1">
                  <div className="relative size-11 sm:size-12 md:size-14 rounded-2xl bg-[var(--s2)] border border-[var(--line)] flex items-center justify-center shrink-0 shadow-sm group-hover:border-[#7A12F5]/40 transition-colors">
                    <img
                      src="/okn-logo.png"
                      alt="$OKN Presale"
                      className="size-7 sm:size-8 md:size-9 object-contain"
                    />
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    {/* Tier 1: Eyebrow Badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] sm:text-[11px] font-extrabold bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/25">
                        <span className="size-1.5 rounded-full bg-[#F59E0B] animate-pulse" />
                        PRESALE · STAGE 2
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10.5px] sm:text-[11px] font-bold bg-[var(--s2)] text-[var(--tx)] border border-[var(--line)]">
                        1 BNB = 1,000,000 $OKN · $0.0006
                      </span>
                    </div>

                    {/* Tier 2: Headline */}
                    <h3 className="text-sm sm:text-base md:text-lg font-extrabold tracking-tight text-[var(--tx)] leading-snug">
                      Buy $OKN Presale — <span className="text-[#F59E0B] dark:text-[#FBBF24]">Multi-Gateway</span> Live
                    </h3>

                    {/* Tier 3: Supporting Description */}
                    <p className="text-xs sm:text-[13px] text-[var(--mut)] font-medium line-clamp-2 sm:line-clamp-1">
                      Connect Wallet, 300+ Crypto, or Card with instant allocation.
                    </p>
                  </div>
                </div>

                {/* Right Zone: Social Proof + Primary CTA Button */}
                <div className="flex items-center justify-between md:justify-end gap-3.5 pt-2.5 md:pt-0 border-t border-[var(--line)]/60 md:border-t-0 shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="hidden sm:flex items-center -space-x-1.5 shrink-0">
                      <span className="size-5 rounded-full flex items-center justify-center bg-[#1E2026] border border-[var(--s1)] p-0.5">
                        <img src="/bnb-logo.png" alt="BNB" className="size-3 object-contain" />
                      </span>
                      <span className="size-5 rounded-full flex items-center justify-center text-[7px] font-extrabold text-white bg-[#0066FF] border border-[var(--s1)]">
                        300+
                      </span>
                    </div>
                    <span className="text-[11px] sm:text-xs font-semibold text-[var(--mut)] whitespace-nowrap">
                      68.4% Sold · $412.8K
                    </span>
                  </div>

                  <span className="inline-flex items-center justify-center gap-1.5 h-8 sm:h-9 md:h-10 px-3.5 md:px-4 rounded-xl text-[11px] sm:text-xs font-extrabold bg-[#7A12F5] !text-white text-white shadow-[0_4px_14px_rgba(122,18,245,0.35)] shrink-0 whitespace-nowrap group-hover:bg-[#8C38F7] active:scale-95 transition-all">
                    <span>Buy Presale</span>
                    <ArrowRight className="size-3.5 stroke-[2.5]" />
                  </span>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
