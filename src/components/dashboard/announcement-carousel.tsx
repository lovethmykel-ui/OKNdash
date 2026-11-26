'use client';

import { useState, useEffect, useRef } from 'react';
import { Link } from '@/i18n/navigation';
import {
  ArrowRight,
  ArrowUpRight,
  Award,
  Copy,
  Plus,
  RefreshCw,
  TrendingUp,
  Users,
  Wallet,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Web3AdSlide {
  id: string;
  href: string;
  ariaLabel: string;
  headline: string;
  ctaLabel: string;
  bgStyle: string;
  ctaBg: string;
  toastLogo: string;
  toastLogoAlt: string;
  toastTitle: string;
  toastMeta: string;
  phoneValue: string;
  phoneAccent: string;
  phoneActions: Array<{ icon: LucideIcon; label: string; highlight?: boolean }>;
}

const AD_SLIDES: readonly Web3AdSlide[] = [
  {
    id: 'presale-stage-1',
    href: '/app/buy',
    ariaLabel: 'Buy $OKN Stage 1 Presale',
    headline: 'Stage 1 presale is live. Lock in $OKN at $0.05.',
    ctaLabel: 'Buy $OKN',
    bgStyle: 'linear-gradient(135deg, #4F0832 0%, #3E062D 55%, #2C0524 100%)',
    ctaBg: '#B21589',
    toastLogo: '/okn-logo.png',
    toastLogoAlt: '$OKN',
    toastTitle: 'Credited +12,000 $OKN',
    toastMeta: 'Stage 1 · Just now',
    phoneValue: '$0.05',
    phoneAccent: '#7A12F5',
    phoneActions: [
      { icon: Plus, label: 'Buy', highlight: true },
      { icon: ArrowUpRight, label: 'Claim' },
      { icon: RefreshCw, label: 'Swap' },
    ],
  },
  {
    id: 'polymarket-agent',
    href: '/app/polymarket-agent',
    ariaLabel: 'Open Polymarket Copy Agent',
    headline: 'Auto-mirror top Polymarket whales in real time.',
    ctaLabel: 'Copy whales',
    bgStyle: 'linear-gradient(135deg, #091E4E 0%, #0C2A6B 55%, #07173D 100%)',
    ctaBg: '#1D6BFF',
    toastLogo: '/polymarket.png',
    toastLogoAlt: 'Polymarket',
    toastTitle: 'Whale trade mirrored',
    toastMeta: '+38.4% 7D ROI',
    phoneValue: '+$342',
    phoneAccent: '#1D6BFF',
    phoneActions: [
      { icon: Zap, label: 'Auto', highlight: true },
      { icon: TrendingUp, label: 'Top 3' },
      { icon: Wallet, label: 'Fund' },
    ],
  },
  {
    id: 'partner-referrals',
    href: '/app/referral',
    ariaLabel: 'Invite friends and earn BNB payouts',
    headline: 'Invite friends & earn 12.5% instant BNB payouts.',
    ctaLabel: 'Invite now',
    bgStyle: 'linear-gradient(135deg, #06382D 0%, #094D3E 55%, #052A22 100%)',
    ctaBg: '#0FA971',
    toastLogo: '/bnb-logo.png',
    toastLogoAlt: 'BNB',
    toastTitle: 'Payout · 0.238 BNB',
    toastMeta: 'Tier 2 · Just now',
    phoneValue: '$142.50',
    phoneAccent: '#0FA971',
    phoneActions: [
      { icon: Users, label: 'Invite', highlight: true },
      { icon: Copy, label: 'Link' },
      { icon: Award, label: 'Tier' },
    ],
  },
];

/**
 * AnnouncementCarousel — Mobile-only sleek Web3 ad banner slider.
 *
 * Designed specifically for mobile dashboards (`md:hidden`):
 *  - Compact 124px height, deep jewel-tone backdrop with subtle geometric planes
 *  - Left: crisp editorial white headline + solid rounded-full pill CTA
 *  - Right: bottom-cropped iPhone device frame with overlapping floating notification toast
 *  - Touch-swipeable + auto-rotating with restrained dot indicator
 */
export function AnnouncementCarousel({ id = 'mobile-ann-carousel' }: { id?: string }) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const totalSlides = AD_SLIDES.length;

  useEffect(() => {
    if (isPaused) return;
    const timer = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % totalSlides);
    }, 5500);
    return () => window.clearInterval(timer);
  }, [isPaused, totalSlides, activeSlide]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current !== null) {
      const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
      const deltaX = endX - touchStartX.current;
      if (Math.abs(deltaX) > 36) {
        setActiveSlide((prev) =>
          deltaX < 0 ? (prev + 1) % totalSlides : (prev - 1 + totalSlides) % totalSlides,
        );
      }
    }
    touchStartX.current = null;
    setIsPaused(false);
  };

  return (
    <div
      id={id}
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured Web3 Announcements"
      className="md:hidden w-full select-none space-y-2"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="overflow-hidden rounded-[18px] shadow-[0_8px_22px_rgba(0,0,0,0.18)]">
        <div
          className="flex transition-transform duration-500 ease-out will-change-transform"
          style={{ transform: `translate3d(-${activeSlide * 100}%, 0px, 0px)` }}
        >
          {AD_SLIDES.map((slide) => (
            <div key={slide.id} className="w-full min-w-full shrink-0">
              <Link
                href={slide.href as never}
                aria-label={slide.ariaLabel}
                style={{ background: slide.bgStyle }}
                className="group relative flex h-[124px] w-full items-stretch justify-between overflow-hidden px-4 py-3 text-white active:scale-[0.99] transition-transform"
              >
                {/* Subtle Architectural Diagonal Light Planes */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 overflow-hidden"
                >
                  <div className="absolute -top-8 left-[30%] h-[180px] w-[62px] rotate-[24deg] bg-white/[0.04]" />
                  <div className="absolute -top-8 left-[54%] h-[180px] w-[36px] rotate-[24deg] bg-white/[0.03]" />
                </div>

                {/* Left Editorial Copy + Rounded Pill CTA */}
                <div className="relative z-20 flex w-[55%] flex-col justify-between pr-1">
                  <h3 className="text-[13.5px] leading-[1.22] font-semibold tracking-[-0.015em] text-white">
                    {slide.headline}
                  </h3>

                  <div className="pt-1.5">
                    <span
                      style={{ backgroundColor: slide.ctaBg, color: '#ffffff' }}
                      className="inline-flex h-[30px] items-center gap-1 rounded-full px-3.5 text-[11.5px] font-semibold !text-white shadow-[0_4px_14px_rgba(0,0,0,0.28)] group-hover:brightness-110 transition-all whitespace-nowrap"
                    >
                      <span>{slide.ctaLabel}</span>
                      <ArrowRight className="size-3 stroke-[2.3]" />
                    </span>
                  </div>
                </div>

                {/* Right Cropped Smartphone UI Mockup + Overlapping Floating Toast */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none relative z-10 w-[43%] shrink-0"
                >
                  {/* Cropped iPhone Frame Anchored Flush Bottom-Right */}
                  <div className="absolute right-0 -bottom-4 h-[120px] w-[110px] rounded-t-[18px] border-[3px] border-b-0 border-[#1A1C22] bg-[#F8F9FC] shadow-[0_10px_24px_rgba(0,0,0,0.45)] ring-1 ring-white/25 overflow-hidden">
                    {/* Status Bar + Dynamic Island */}
                    <div className="flex items-center justify-between px-2.5 pt-1.5 pb-0.5">
                      <span className="text-[6px] font-bold text-[#111827] tabular-nums">9:41</span>
                      <span className="h-[6px] w-[26px] rounded-full bg-[#090B10]" />
                      <span className="flex items-center gap-[1.5px]">
                        <span className="h-[3.5px] w-[1.5px] rounded-full bg-[#111827]" />
                        <span className="h-[4.5px] w-[1.5px] rounded-full bg-[#111827]" />
                        <span className="h-[5px] w-[7px] rounded-[1.5px] bg-[#111827]" />
                      </span>
                    </div>

                    {/* Mini App Top Avatar */}
                    <div className="flex items-center justify-between px-2 pt-0.5">
                      <span className="flex size-3 items-center justify-center rounded-full bg-[#E5E7EB] text-[5.5px] font-extrabold text-[#374151]">
                        OK
                      </span>
                      <span className="size-2.5 rounded-full border border-[#E5E7EB] bg-white" />
                    </div>

                    {/* Clear gap reserved for overlapping floating toast */}
                    <div className="h-[26px]" />

                    {/* Crisp Value Figure Visible Directly Below Toast */}
                    <div className="px-1.5 text-center">
                      <div className="text-[12px] font-extrabold tracking-tight text-[#0F172A] tabular-nums leading-none">
                        {slide.phoneValue}
                      </div>
                    </div>

                    {/* 3 Circular Action Buttons Row */}
                    <div className="mt-1.5 flex items-center justify-center gap-2 px-1.5">
                      {slide.phoneActions.map((act) => {
                        const Icon = act.icon;
                        return (
                          <div key={act.label} className="flex flex-col items-center gap-0.5">
                            <span
                              style={
                                act.highlight
                                  ? { borderColor: `${slide.phoneAccent}66`, color: slide.phoneAccent }
                                  : undefined
                              }
                              className={cn(
                                'flex size-5 items-center justify-center rounded-full border bg-white shadow-2xs',
                                act.highlight
                                  ? 'border-[1.5px]'
                                  : 'border-[#E2E8F0] text-[#475569]',
                              )}
                            >
                              <Icon className="size-2 stroke-[2.5]" />
                            </span>
                            <span className="text-[5.5px] font-semibold text-[#64748B] leading-none">
                              {act.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Signature Floating Notification Toast Overlapping Left Bezel Above Phone Value */}
                  <div className="absolute right-[6px] top-[21px] z-30 flex items-center gap-1.5 rounded-[10px] bg-white px-2 py-1 text-[#0F172A] shadow-[0_6px_18px_rgba(0,0,0,0.32)] ring-1 ring-black/5">
                    <span className="flex size-4.5 shrink-0 items-center justify-center rounded-full bg-[#0F172A] p-0.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={slide.toastLogo}
                        alt={slide.toastLogoAlt}
                        className="size-full object-contain"
                      />
                    </span>
                    <div className="min-w-0 leading-tight">
                      <div className="whitespace-nowrap text-[7.5px] font-extrabold tracking-tight text-[#0F172A]">
                        {slide.toastTitle}
                      </div>
                      <div className="whitespace-nowrap text-[6.5px] font-medium text-[#64748B]">
                        {slide.toastMeta}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Minimalist Slide Dots */}
      <div className="flex items-center justify-center gap-1.5" role="tablist" aria-label="Announcement slides">
        {AD_SLIDES.map((slide, idx) => {
          const active = idx === activeSlide;
          return (
            <button
              key={slide.id}
              type="button"
              role="tab"
              aria-selected={active}
              aria-label={`Show slide ${idx + 1}: ${slide.ctaLabel}`}
              onClick={() => setActiveSlide(idx)}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300 cursor-pointer',
                active
                  ? 'w-5 bg-[#7A12F5] dark:bg-[#C084FC]'
                  : 'w-1.5 bg-[var(--mut)]/30 hover:bg-[var(--mut)]/55',
              )}
            />
          );
        })}
      </div>
    </div>
  );
}
