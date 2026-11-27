'use client';

import { useState, useEffect, useRef } from 'react';
import { Link } from '@/i18n/navigation';
import {
  ArrowRight,
  ArrowUpRight,
  Plus,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type SlideArtworkType = 'phone-toast' | 'trade-stack' | 'metal-card';

interface Web3AdSlide {
  id: string;
  href: string;
  ariaLabel: string;
  headline: string;
  ctaLabel: string;
  bgStyle: string;
  ctaBg: string;
  artwork: SlideArtworkType;
}

const AD_SLIDES: readonly Web3AdSlide[] = [
  {
    id: 'presale-stage-1',
    href: '/app/buy',
    ariaLabel: 'Buy $OKN Stage 1 Presale',
    headline: 'Stage 1 presale is live. Lock in $OKN at $0.05.',
    ctaLabel: 'Buy $OKN',
    bgStyle: 'linear-gradient(135deg, #160B2E 0%, #0E0820 55%, #090712 100%)',
    ctaBg: '#7A12F5',
    artwork: 'phone-toast',
  },
  {
    id: 'polymarket-agent',
    href: '/app/polymarket-agent',
    ariaLabel: 'Open Polymarket Copy Agent',
    headline: 'Auto-mirror top Polymarket whales in real time.',
    ctaLabel: 'Copy whales',
    bgStyle: 'linear-gradient(135deg, #061436 0%, #0D2D75 58%, #071942 100%)',
    ctaBg: '#1D6BFF',
    artwork: 'trade-stack',
  },
  {
    id: 'partner-referrals',
    href: '/app/referral',
    ariaLabel: 'Invite friends and earn BNB payouts',
    headline: 'Invite friends & earn 12.5% instant BNB payouts.',
    ctaLabel: 'Invite now',
    bgStyle: 'linear-gradient(135deg, #04241D 0%, #09493A 56%, #031B16 100%)',
    ctaBg: '#0FA971',
    artwork: 'metal-card',
  },
];

const PHONE_ACTIONS = [
  { icon: Plus, label: 'Buy', highlight: true },
  { icon: ArrowUpRight, label: 'Claim', highlight: false },
  { icon: RefreshCw, label: 'Swap', highlight: false },
] as const;

const SPARK_BARS = [34, 48, 42, 62, 58, 76, 88, 100] as const;

/** Slide 1 Artwork: Cropped iPhone UI + Overlapping White Notification Toast */
function PhoneToastArtwork() {
  return (
    <>
      {/* Subtle Obsidian Violet-Cyan Aurora & Architectural Light Planes */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(50% 130% at 18% 55%, rgba(122, 18, 245, 0.28) 0%, transparent 72%), radial-gradient(45% 120% at 84% 40%, rgba(56, 189, 248, 0.16) 0%, transparent 70%)',
          }}
        />
        <div className="absolute -top-8 left-[30%] h-[180px] w-[62px] rotate-[24deg] bg-white/[0.04]" />
        <div className="absolute -top-8 left-[54%] h-[180px] w-[36px] rotate-[24deg] bg-white/[0.03]" />
      </div>

      <div aria-hidden="true" className="pointer-events-none relative z-10 w-[43%] shrink-0">
        {/* Cropped iPhone Frame Anchored Flush Bottom-Right */}
        <div className="absolute right-0 -bottom-4 h-[120px] w-[110px] rounded-t-[18px] border-[3px] border-b-0 border-[#1A1C22] bg-[#F8F9FC] shadow-[0_10px_24px_rgba(0,0,0,0.45)] ring-1 ring-white/25 overflow-hidden">
          <div className="flex items-center justify-between px-2.5 pt-1.5 pb-0.5">
            <span className="text-[6px] font-bold text-[#111827] tabular-nums">9:41</span>
            <span className="h-[6px] w-[26px] rounded-full bg-[#090B10]" />
            <span className="flex items-center gap-[1.5px]">
              <span className="h-[3.5px] w-[1.5px] rounded-full bg-[#111827]" />
              <span className="h-[4.5px] w-[1.5px] rounded-full bg-[#111827]" />
              <span className="h-[5px] w-[7px] rounded-[1.5px] bg-[#111827]" />
            </span>
          </div>

          <div className="flex items-center justify-between px-2 pt-0.5">
            <span className="flex size-3 items-center justify-center rounded-full bg-[#E5E7EB] text-[5.5px] font-extrabold text-[#374151]">
              OK
            </span>
            <span className="size-2.5 rounded-full border border-[#E5E7EB] bg-white" />
          </div>

          <div className="h-[26px]" />

          <div className="px-1.5 text-center">
            <div className="text-[12px] font-extrabold tracking-tight text-[#0F172A] tabular-nums leading-none">
              $0.05
            </div>
          </div>

          <div className="mt-1.5 flex items-center justify-center gap-2 px-1.5">
            {PHONE_ACTIONS.map((act) => {
              const Icon = act.icon;
              return (
                <div key={act.label} className="flex flex-col items-center gap-0.5">
                  <span
                    className={cn(
                      'flex size-5 items-center justify-center rounded-full border bg-white shadow-2xs',
                      act.highlight
                        ? 'border-[1.5px] border-[#7A12F5]/45 text-[#7A12F5]'
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

        {/* Floating White Notification Toast Overlapping Left Bezel */}
        <div className="absolute right-[6px] top-[21px] z-30 flex items-center gap-1.5 rounded-[10px] bg-white px-2 py-1 text-[#0F172A] shadow-[0_6px_18px_rgba(0,0,0,0.32)] ring-1 ring-black/5">
          <span className="flex size-4.5 shrink-0 items-center justify-center rounded-full bg-[#0F172A] p-0.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/okn-logo.png" alt="$OKN" className="size-full object-contain" />
          </span>
          <div className="min-w-0 leading-tight">
            <div className="whitespace-nowrap text-[7.5px] font-extrabold tracking-tight text-[#0F172A]">
              Credited +12,000 $OKN
            </div>
            <div className="whitespace-nowrap text-[6.5px] font-medium text-[#64748B]">
              Stage 1 · Just now
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/** Slide 2 Artwork: Concentric Radar Rings + Fanned Angled Live Whale Trade Ticket Stack */
function TradeStackArtwork() {
  return (
    <>
      {/* Concentric Radar Rings + Cyan Aura */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-8 -bottom-10 size-[156px] rounded-full border border-white/[0.08]" />
        <div className="absolute -right-2 -bottom-4 size-[110px] rounded-full border border-[#60A5FA]/15" />
        <div className="absolute right-4 top-2 size-24 rounded-full bg-[#38BDF8]/18 blur-2xl" />
      </div>

      <div aria-hidden="true" className="pointer-events-none relative z-10 w-[44%] shrink-0">
        {/* Back Angled Frosted Signal Card */}
        <div className="absolute right-[18px] top-[0px] w-[108px] -rotate-[7deg] rounded-[11px] border border-white/15 bg-[#0C2560]/85 px-2.5 py-1.5 backdrop-blur-md shadow-[0_8px_20px_rgba(0,0,0,0.34)]">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[6.5px] font-bold uppercase tracking-wider text-[#93C5FD]">
              YES · 78¢
            </span>
            <span className="text-[6.5px] font-bold text-[#34D399] tabular-nums">+19.2%</span>
          </div>
          <div className="mt-1.5 flex h-[16px] items-end gap-[2.5px]">
            {SPARK_BARS.map((h, i) => (
              <span
                key={i}
                style={{ height: `${h}%` }}
                className={cn(
                  'flex-1 rounded-[1.5px]',
                  i >= 5 ? 'bg-[#38BDF8]' : 'bg-white/25',
                )}
              />
            ))}
          </div>
        </div>

        {/* Front Angled Crisp White Whale Copy Ticket */}
        <div className="absolute right-[-2px] bottom-[-2px] z-20 w-[124px] rotate-[3.5deg] rounded-[13px] bg-white px-2.5 py-2 text-[#0F172A] shadow-[0_12px_26px_rgba(0,0,0,0.46)] ring-1 ring-black/5">
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1 min-w-0">
              <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-[#0F172A] p-0.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/polymarket.png" alt="Polymarket" className="size-full object-contain" />
              </span>
              <span className="truncate text-[7.5px] font-extrabold tracking-tight text-[#0F172A]">
                #1 Whale
              </span>
            </div>
            <span className="inline-flex items-center gap-0.5 rounded-full bg-[#ECFDF5] px-1.5 py-[1px] text-[6.5px] font-extrabold text-[#059669] tabular-nums">
              <TrendingUp className="size-2 stroke-[2.6]" />
              38.4%
            </span>
          </div>

          <div className="mt-1.5 flex items-baseline justify-between">
            <span className="text-[14px] font-black tracking-tight text-[#0F172A] tabular-nums leading-none">
              +$342.80
            </span>
            <span className="text-[6.5px] font-bold text-[#1D6BFF]">Mirrored</span>
          </div>

          <div className="mt-1.5 flex items-center gap-1.5">
            <div className="h-[4px] flex-1 overflow-hidden rounded-full bg-[#E2E8F0]">
              <div className="h-full w-[78%] rounded-full bg-gradient-to-r from-[#1D6BFF] to-[#10B981]" />
            </div>
            <span className="text-[6px] font-bold text-[#64748B] tabular-nums">78% win</span>
          </div>
        </div>
      </div>
    </>
  );
}

/** Slide 3 Artwork: Brushed Obsidian-Emerald Metallic Partner Vault Card + Gold Yield Tag */
function MetalVaultCardArtwork() {
  return (
    <>
      {/* Architectural Emerald-Gold Light Prism + Micro-Lines */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'repeating-linear-gradient(125deg, rgba(52,211,153,0.08) 0px, rgba(52,211,153,0.08) 1px, transparent 1px, transparent 14px)',
          }}
        />
        <div className="absolute right-2 -top-4 size-[110px] rounded-full bg-[#10B981]/25 blur-2xl" />
        <div className="absolute right-12 bottom-0 size-[64px] rounded-full bg-[#F3BA2F]/20 blur-xl" />
      </div>

      <div aria-hidden="true" className="pointer-events-none relative z-10 w-[44%] shrink-0">
        {/* Crisp Floating Brushed-Gold 12.5% Yield Stamp Overlapping Top-Left of Card */}
        <div className="absolute left-[2px] top-[0px] z-30 flex items-center gap-1 rounded-[8px] border border-[#FDE68A]/70 bg-gradient-to-r from-[#F3BA2F] via-[#F7CC55] to-[#E5A71C] px-2 py-[3px] text-[#091813] shadow-[0_6px_16px_rgba(0,0,0,0.42)] rotate-[5deg]">
          <span className="text-[8.5px] font-black tracking-tight tabular-nums leading-none">
            12.5%
          </span>
          <span className="text-[6.5px] font-extrabold uppercase tracking-wider leading-none opacity-85">
            BNB
          </span>
        </div>

        {/* Angled Brushed Obsidian-Emerald Metallic Partner Card */}
        <div
          className="absolute right-[-6px] bottom-[-6px] z-20 h-[86px] w-[134px] -rotate-[7deg] overflow-hidden rounded-[13px] border border-[#34D399]/40 p-2.5 shadow-[0_14px_28px_rgba(0,0,0,0.55)] ring-1 ring-white/10"
          style={{
            background:
              'linear-gradient(135deg, #133A2E 0%, #071D17 48%, #0E2F26 82%, #18493B 100%)',
          }}
        >
          {/* Metallic Diagonal Sheen Highlight */}
          <div className="pointer-events-none absolute -top-6 left-[34%] h-[140px] w-[26px] rotate-[24deg] bg-gradient-to-b from-white/15 via-white/[0.06] to-transparent" />

          {/* Top Row: Brushed Gold EMV Chip + BNB Chain Crest */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="grid h-[14px] w-[20px] grid-cols-3 grid-rows-2 gap-[1px] overflow-hidden rounded-[3px] border border-[#FDE68A]/55 bg-gradient-to-br from-[#F7D166] via-[#E1A825] to-[#B77E0E] p-[1.5px] shadow-inner">
              <span className="rounded-[0.5px] bg-[#6B4A06]/30" />
              <span className="rounded-[0.5px] bg-[#6B4A06]/20" />
              <span className="rounded-[0.5px] bg-[#6B4A06]/30" />
              <span className="rounded-[0.5px] bg-[#6B4A06]/20" />
              <span className="rounded-[0.5px] bg-[#6B4A06]/30" />
              <span className="rounded-[0.5px] bg-[#6B4A06]/20" />
            </div>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/bnb_chain_logo.png"
              alt="BNB"
              className="size-[18px] object-contain drop-shadow-[0_1px_4px_rgba(243,186,47,0.45)]"
            />
          </div>

          {/* Center Payout Readout */}
          <div className="relative z-10 mt-2">
            <div className="text-[6px] font-bold uppercase tracking-[0.16em] text-[#6EE7B7]/80">
              Partner Vault · Tier 2
            </div>
            <div className="mt-0.5 text-[14px] font-black tracking-tight text-white tabular-nums leading-none">
              +0.238 BNB
            </div>
          </div>

          {/* Bottom Micro-Engraved Footer */}
          <div className="relative z-10 mt-2 flex items-center justify-between border-t border-white/10 pt-1">
            <span className="text-[5.5px] font-bold uppercase tracking-[0.14em] text-white/55">
              Instant Payout
            </span>
            <span className="text-[6px] font-extrabold tracking-wider text-[#FDE68A]">
              $OKN
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * AnnouncementCarousel — Mobile-only sleek Web3 ad banner slider (`md:hidden`).
 *
 * Three distinct right-side graphic silhouettes inside a unified 124px banner:
 *  1. Stage 1 Presale: cropped iPhone UI + overlapping white credit toast
 *  2. Polymarket Copy Agent: concentric radar rings + fanned angled trade tickets
 *  3. Partner Referrals: sculptural 3D $OKN & BNB floating coin orbit + glass payout chip
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
          style={{
            transform:
              activeSlide === 0
                ? 'translate3d(0%, 0px, 0px)'
                : `translate3d(-${activeSlide * 100}%, 0px, 0px)`,
          }}
        >
          {AD_SLIDES.map((slide) => (
            <div key={slide.id} className="w-full min-w-full shrink-0">
              <Link
                href={slide.href as never}
                aria-label={slide.ariaLabel}
                style={{ background: slide.bgStyle }}
                className="group relative flex h-[124px] w-full items-stretch justify-between overflow-hidden px-4 py-3 text-white active:scale-[0.99] transition-transform"
              >
                {/* Left Editorial Copy + Rounded Pill CTA */}
                <div className="relative z-20 flex w-[54%] flex-col justify-between pr-1">
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

                {/* Bespoke Right-Side Visual Silhouette per Slide */}
                {slide.artwork === 'phone-toast' && <PhoneToastArtwork />}
                {slide.artwork === 'trade-stack' && <TradeStackArtwork />}
                {slide.artwork === 'metal-card' && <MetalVaultCardArtwork />}
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
