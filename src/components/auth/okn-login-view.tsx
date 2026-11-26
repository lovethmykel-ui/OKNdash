'use client';

import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  AlertTriangle,
  ArrowRight,
  ChevronRight,
  Globe,
  Loader2,
  Send,
  ShieldCheck,
  Wallet,
  Zap,
} from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { LanguageSwitcher } from '@/components/landing/language-switcher';
import { resetReferralBattlePopupForFreshLogin } from '@/lib/referral-battle-popup';
import { useHydrated } from '@/lib/hooks/use-hydrated';

type AuthProvider = 'telegram' | 'wallet';

const LAST_USED_KEY = 'okn_last_auth_provider';

/**
 * OknLoginView — Award-winning editorial split-screen login experience for $OKN.
 *
 * Includes all required account rules & auth options:
 *  - Sign in with Telegram (primary, with Last Used indicator)
 *  - Existing-accounts-only Web3 Wallet notice & Connect & Sign In with Wallet
 *  - Zero Scan QR Code option (explicitly excluded per specification)
 */
export function OknLoginView() {
  const router = useRouter();
  const hydrated = useHydrated();
  const prefersReducedMotion = useReducedMotion();
  const animateLive = hydrated && !prefersReducedMotion;

  const [pendingProvider, setPendingProvider] = useState<AuthProvider | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [lastUsed, setLastUsed] = useState<AuthProvider>(() => {
    if (typeof window === 'undefined') return 'telegram';
    const stored = window.localStorage.getItem(LAST_USED_KEY);
    return stored === 'wallet' ? 'wallet' : 'telegram';
  });

  const handleSignIn = async (provider: AuthProvider) => {
    if (pendingProvider) return;
    setPendingProvider(provider);
    setStatusMessage(
      provider === 'telegram'
        ? 'Authorizing Telegram session...'
        : 'Verifying existing wallet signature...',
    );

    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(LAST_USED_KEY, provider);
      }
      setLastUsed(provider);
    } catch {
      // Ignore storage quota errors
    }

    await new Promise((resolve) => window.setTimeout(resolve, 680));

    resetReferralBattlePopupForFreshLogin(undefined, true);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('okn:login', { detail: { provider } }));
    }
    router.push('/app/portfolio' as never);
  };

  return (
    <div className="min-h-dvh w-full bg-[#FAF9FD] text-[#110E1C] grid grid-cols-1 lg:grid-cols-[1.06fr_1fr]">
      {/* =====================================================================
          LEFT STAGE (Desktop) / COMPACT HERO BANNER (Mobile)
          Sculptural Obsidian Hardware Stage featuring the 3D OKN Monolith
         ===================================================================== */}
      <section
        aria-label="OKNexus Ecosystem Showcase"
        className="relative flex flex-col justify-between overflow-hidden bg-[#07050F] px-6 py-6 sm:px-10 sm:py-8 lg:px-12 lg:py-10 text-white"
      >
        {/* Studio 3D Monolith Backdrop */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <motion.img
            src="/assets/campaigns/login-okn-monolith.jpg"
            alt=""
            referrerPolicy="no-referrer"
            animate={animateLive ? { scale: [1.03, 1.07, 1.03], y: [0, -6, 0] } : undefined}
            transition={
              animateLive
                ? { duration: 12, repeat: Infinity, ease: 'easeInOut' }
                : undefined
            }
            className="h-full w-full object-cover object-center opacity-90 will-change-transform"
          />
          {/* Measured Editorial Scrims for Razor-Sharp Type Contrast */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#07050F]/85 via-[#07050F]/25 to-[#07050F]/95" />
          <div className="hidden lg:block absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#07050F]/70 to-transparent" />
        </div>

        {/* Top Bar: Brand Mark + Mobile Language Switcher */}
        <header className="relative z-10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-white/10 p-1.5 ring-1 ring-white/20 backdrop-blur-xl shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/okn-logo.png"
                alt="$OKN"
                referrerPolicy="no-referrer"
                className="size-full object-contain"
              />
            </span>
            <div className="leading-tight">
              <span className="block text-[17px] font-black tracking-tight text-white">
                $OKN
              </span>
              <span className="block text-[11px] font-medium text-white/60">
                OKNexus Ecosystem
              </span>
            </div>
          </div>

          <div className="lg:hidden">
            <LanguageSwitcher />
          </div>
        </header>

        {/* Center Spacer so the Sculpted 3D Monolith Breathes Unobstructed */}
        <div className="relative z-10 h-28 sm:h-36 lg:h-64" aria-hidden="true" />

        {/* Bottom Editorial Statement & Quiet Unboxed Trust Line */}
        <div className="relative z-10 space-y-4">
          <div className="max-w-md space-y-2">
            <h2 className="text-2xl sm:text-3xl lg:text-[36px] font-black tracking-[-0.03em] leading-[1.08] text-white [text-wrap:balance]">
              Your gateway to the{' '}
              <span className="bg-gradient-to-r from-[#C084FC] via-[#A78BFA] to-[#38BDF8] bg-clip-text text-transparent">
                OKNexus
              </span>{' '}
              ecosystem.
            </h2>
            <p className="text-xs sm:text-sm leading-relaxed text-white/70">
              Trade prediction agents, track Stage 1 presale allocations, and collect instant on-chain BNB rewards from one unified dashboard.
            </p>
          </div>

          {/* Unboxed Typographic Trust Strip (Zero Pill Clutter) */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/[0.12] pt-4 text-[11.5px] font-semibold text-white/75">
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
              <ShieldCheck className="size-3.5 text-[#34D399]" aria-hidden="true" />
              KYC Verified by Assured
            </span>
            <span aria-hidden="true" className="text-white/25">·</span>
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
              <Zap className="size-3.5 text-[#C084FC]" aria-hidden="true" />
              Fast Settlement
            </span>
            <span aria-hidden="true" className="text-white/25">·</span>
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
              <Globe className="size-3.5 text-[#38BDF8]" aria-hidden="true" />
              Built on BNB Smart Chain
            </span>
          </div>
        </div>
      </section>

      {/* =====================================================================
          RIGHT STUDIO: Precision Architectural Auth Panel
         ===================================================================== */}
      <main className="relative flex flex-col justify-between px-5 py-7 sm:px-10 sm:py-9 lg:px-14 lg:py-10 bg-[#FAF9FD]">
        {/* Desktop Top-Right Language Control */}
        <div className="hidden lg:flex items-center justify-end">
          <LanguageSwitcher />
        </div>

        {/* Centered Precision Auth Column */}
        <motion.div
          initial={animateLive ? { opacity: 0, y: 12 } : undefined}
          animate={animateLive ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto my-auto w-full max-w-[424px] py-2 lg:py-6"
        >
          {/* App Emblem + Editorial Title */}
          <div className="text-center lg:text-left">
            <div className="mx-auto lg:mx-0 mb-4 flex size-13 items-center justify-center rounded-2xl border border-[#E7E3F3] bg-white p-2 shadow-[0_10px_28px_rgba(122,18,245,0.1)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/okn-logo.png"
                alt="$OKN"
                referrerPolicy="no-referrer"
                className="size-full object-contain"
              />
            </div>

            <h1 className="text-[28px] sm:text-[32px] font-black tracking-[-0.03em] text-[#110E1C] leading-tight">
              Sign in to $OKN
            </h1>
            <p className="mt-1.5 text-[14px] leading-relaxed text-[#5D5870]">
              Sign in with Telegram — or with your wallet if you already have an account.
            </p>
          </div>

          {/* Required Policy Notice Callout (Clean All-Around Hairline Border) */}
          <div
            role="note"
            className="mt-5 flex items-start gap-2.5 rounded-2xl border border-[#F3D89A] bg-[#FEF9EA] px-4 py-3.5 text-[12.5px] leading-[1.52] text-[#5C3D0E]"
          >
            <AlertTriangle
              className="mt-0.5 size-4 shrink-0 text-[#B47010]"
              aria-hidden="true"
            />
            <p>
              Wallet sign-in is for{' '}
              <strong className="font-extrabold text-[#3E2705]">existing accounts only</strong> — wallet account creation is deprecated. New here? Sign up with Telegram below. Already have a wallet account? Sign in, then{' '}
              <strong className="font-extrabold text-[#3E2705]">
                bind your Telegram in Settings → Profile
              </strong>{' '}
              to keep permanent access.
            </p>
          </div>

          {/* Primary Action: Kinetic Login with Telegram */}
          <div className="mt-6">
            <motion.div
              whileHover={animateLive && !pendingProvider ? { scale: 1.015, y: -1 } : undefined}
              whileTap={animateLive && !pendingProvider ? { scale: 0.985 } : undefined}
              transition={{ type: 'spring', stiffness: 460, damping: 24 }}
              className="relative"
            >
              {/* Orbiting Prismatic Bezel Ring */}
              <span className="relative block rounded-2xl p-[1.5px] overflow-hidden shadow-[0_14px_34px_rgba(122,18,245,0.28)]">
                {animateLive && (
                  <motion.span
                    aria-hidden="true"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4.5, repeat: Infinity, ease: 'linear' }}
                    className="pointer-events-none absolute inset-[-180%] will-change-transform"
                    style={{
                      background:
                        'conic-gradient(from 0deg, rgba(122,18,245,0.2) 0deg, rgba(192,132,252,0.95) 65deg, rgba(56,189,248,0.95) 125deg, rgba(122,18,245,0.2) 210deg, rgba(122,18,245,0.2) 360deg)',
                    }}
                  />
                )}

                <button
                  type="button"
                  data-testid="login-telegram-btn"
                  disabled={Boolean(pendingProvider)}
                  onClick={() => void handleSignIn('telegram')}
                  className="group relative flex h-[54px] w-full items-center justify-between gap-3 overflow-hidden rounded-[14.5px] bg-gradient-to-r from-[#130C26] via-[#261257] to-[#7A12F5] px-5 text-white transition-[filter] duration-200 hover:brightness-110 disabled:opacity-75 cursor-pointer"
                >
                  {/* Sweeping Specular Sheen */}
                  {animateLive && (
                    <motion.span
                      aria-hidden="true"
                      initial={{ x: '-160%' }}
                      animate={{ x: ['-160%', '280%'] }}
                      transition={{
                        duration: 1.35,
                        repeat: Infinity,
                        repeatDelay: 2.8,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className="pointer-events-none absolute inset-y-0 left-0 w-16 -skew-x-[24deg] bg-gradient-to-r from-transparent via-white/25 to-transparent will-change-transform"
                    />
                  )}

                  <span className="relative z-10 flex items-center gap-3">
                    <span className="flex size-8 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
                      {pendingProvider === 'telegram' ? (
                        <Loader2 className="size-4 animate-spin text-white" />
                      ) : (
                        <Send className="size-4 -translate-x-[0.5px] translate-y-[0.5px] text-white" />
                      )}
                    </span>
                    <span className="text-[15px] font-extrabold tracking-tight text-white">
                      {pendingProvider === 'telegram'
                        ? 'Signing in with Telegram...'
                        : 'Login with Telegram'}
                    </span>
                  </span>

                  <span className="relative z-10 flex items-center gap-2">
                    {lastUsed === 'telegram' && pendingProvider !== 'telegram' && (
                      <span className="rounded-lg bg-white/14 px-2 py-0.5 text-[11px] font-bold text-[#E9D5FF] ring-1 ring-white/15 whitespace-nowrap">
                        Last Used
                      </span>
                    )}
                    <ArrowRight className="size-4 text-white/85 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </span>
                </button>
              </span>
            </motion.div>
          </div>

          {/* Hairline Divider */}
          <div className="my-5 flex items-center gap-3.5" aria-hidden="true">
            <span className="h-px flex-1 bg-[#E5E1F0]" />
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#8A849E]">
              OR
            </span>
            <span className="h-px flex-1 bg-[#E5E1F0]" />
          </div>

          {/* Secondary Auth Surface: Existing Web3 Wallet Accounts Only (NO QR Code) */}
          <div className="rounded-2xl border border-[#E5E1F0] bg-white p-4 shadow-[0_6px_22px_rgba(17,14,28,0.04)]">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Wallet className="size-4 shrink-0 text-[#110E1C]" aria-hidden="true" />
                <span className="text-[13.5px] font-extrabold text-[#110E1C]">
                  Web3 Wallet
                </span>
                <span className="text-[12.5px] font-medium text-[#6C6780]">
                  (existing accounts)
                </span>
              </div>
              {lastUsed === 'wallet' && (
                <span className="text-[11px] font-bold text-[#7A12F5] whitespace-nowrap">
                  Last Used
                </span>
              )}
            </div>

            <button
              type="button"
              data-testid="login-wallet-btn"
              disabled={Boolean(pendingProvider)}
              onClick={() => void handleSignIn('wallet')}
              className="group flex h-[48px] w-full items-center justify-between gap-3 rounded-xl border border-[#DDD8EC] bg-[#FAF9FD] px-4 text-[#110E1C] transition-all duration-150 hover:border-[#7A12F5]/55 hover:bg-white hover:shadow-[0_4px_14px_rgba(122,18,245,0.09)] active:scale-[0.985] disabled:opacity-70 cursor-pointer"
            >
              <span className="flex items-center gap-2.5 min-w-0">
                {pendingProvider === 'wallet' ? (
                  <Loader2 className="size-4 shrink-0 animate-spin text-[#7A12F5]" />
                ) : (
                  <Wallet className="size-4 shrink-0 text-[#5B5570] group-hover:text-[#7A12F5] transition-colors" />
                )}
                <span className="truncate text-[14px] font-extrabold text-[#110E1C]">
                  {pendingProvider === 'wallet'
                    ? 'Connecting wallet...'
                    : 'Connect & Sign In with Wallet'}
                </span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-[#8A849E] transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-[#7A12F5]" />
            </button>

            <p className="mt-2.5 text-[11.5px] font-medium text-[#7B768F]">
              Supports MetaMask, Trust Wallet, and WalletConnect on BNB Smart Chain.
            </p>
          </div>

          {/* Live Status Feedback */}
          {statusMessage && (
            <p
              role="status"
              aria-live="polite"
              className="mt-3.5 text-center text-xs font-semibold text-[#7A12F5]"
            >
              {statusMessage}
            </p>
          )}

          {/* Security Reassurance */}
          <div className="mt-5 flex items-center justify-center gap-2 text-[12px] font-medium text-[#5D5870]">
            <ShieldCheck className="size-4 shrink-0 text-[#059669]" aria-hidden="true" />
            <span>Your data is protected. We never store your private keys.</span>
          </div>
        </motion.div>

        {/* Quiet Policy Footer */}
        <footer className="mx-auto mt-6 w-full max-w-[424px] border-t border-[#EAE6F3] pt-4 text-center text-[12px] leading-relaxed text-[#7A758D]">
          Sign in with Telegram, or with your crypto wallet (existing accounts only). New accounts: Telegram only.
        </footer>
      </main>
    </div>
  );
}
