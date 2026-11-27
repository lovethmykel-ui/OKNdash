'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion, useReducedMotion } from 'motion/react';
import {
  Box,
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
import { WalletNoticeModal } from '@/components/auth/wallet-notice-modal';
import { resetReferralBattlePopupForFreshLogin } from '@/lib/referral-battle-popup';
import { useHydrated } from '@/lib/hooks/use-hydrated';
import cosmicHorizonStage from '@/assets/images/okn_cosmic_horizon_stage_1795738928961.jpg';

type AuthProvider = 'telegram' | 'wallet';

const LAST_USED_KEY = 'okn_last_auth_provider';

/**
 * OknLoginView — Cosmic dark OKN authentication experience securing the
 * OKNexus dashboard.
 *
 * Visual composition mirrors the cosmic OKN reference:
 *  - Top bar with circular $OKN emblem + OKN wordmark & language switcher
 *  - Floating 3D $OKN coin suspended above the luminous cosmic horizon pedestal
 *  - Frosted obsidian-indigo glass card with Telegram login & Connect Wallet
 *  - Mandatory Wallet Connect notice modal with "I Accept" confirmation gate
 *  - Zero "Scan QR Code" / "Scan to login" option
 */
export function OknLoginView() {
  const router = useRouter();
  const hydrated = useHydrated();
  const prefersReducedMotion = useReducedMotion();
  const animateLive = hydrated && !prefersReducedMotion;

  const [pendingProvider, setPendingProvider] = useState<AuthProvider | null>(null);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastUsed, setLastUsed] = useState<AuthProvider>('telegram');

  // Read last-used provider strictly after hydration to avoid SSR mismatches
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(LAST_USED_KEY);
      if (stored === 'wallet' || stored === 'telegram') {
        setLastUsed(stored);
      }
    } catch {
      // Ignore storage read restrictions
    }
  }, []);

  const submitSessionSignIn = async (
    provider: AuthProvider,
    acceptedExistingAccountNotice = false,
  ) => {
    if (pendingProvider) return;
    setErrorMessage(null);
    setPendingProvider(provider);
    setStatusMessage(
      provider === 'telegram'
        ? 'Authorizing Telegram session...'
        : 'Verifying existing wallet session...',
    );

    try {
      const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'OKN-Auth',
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          provider,
          acceptedExistingAccountNotice,
        }),
      });

      const data = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;

      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || 'Unable to sign in right now. Please try again.');
      }

      try {
        window.localStorage.setItem(LAST_USED_KEY, provider);
        setLastUsed(provider);
      } catch {
        // Ignore storage quota errors
      }

      setWalletModalOpen(false);
      resetReferralBattlePopupForFreshLogin(undefined, true);
      window.dispatchEvent(new CustomEvent('okn:login', { detail: { provider } }));

      router.replace('/app/portfolio' as never);
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to sign in right now. Please try again.';
      setErrorMessage(message);
      setStatusMessage(null);
      setPendingProvider(null);
    }
  };

  return (
    <div className="relative min-h-dvh w-full overflow-x-clip bg-[#05040D] text-white selection:bg-[#7A12F5]/40 selection:text-white">
      {/* =====================================================================
          AMBIENT COSMIC BACKGROUND STAGE
          Deep space backdrop + luminous Earth-at-night pedestal + orbital arcs
         ===================================================================== */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden bg-[#05040D]"
      >
        {/* Cosmic horizon & glowing neon pedestal anchored behind the coin */}
        <div className="relative mx-auto h-[370px] sm:h-[420px] lg:h-[445px] w-full max-w-[1440px]">
          <Image
            src={cosmicHorizonStage}
            alt=""
            fill
            priority
            sizes="100vw"
            referrerPolicy="no-referrer"
            className="object-cover object-[50%_76%] opacity-95"
          />
          {/* Top edge atmospheric vignette */}
          <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#05040D]/80 via-[#05040D]/30 to-transparent" />
          {/* Smooth bottom blend into deep cosmic obsidian */}
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#05040D] via-[#05040D]/80 to-transparent" />
          {/* Side feathering for ultra-wide viewports */}
          <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#05040D] to-transparent" />
          <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#05040D] to-transparent" />
        </div>

        {/* Lower sweeping ambient violet & sapphire glow ribbons matching reference */}
        <div
          className="absolute -bottom-32 -left-24 h-[420px] w-[420px] rounded-full opacity-35 blur-[110px]"
          style={{
            background:
              'radial-gradient(circle, rgba(147,51,234,0.85) 0%, rgba(122,18,245,0.25) 55%, transparent 75%)',
          }}
        />
        <div
          className="absolute -bottom-28 -right-24 h-[420px] w-[420px] rounded-full opacity-35 blur-[110px]"
          style={{
            background:
              'radial-gradient(circle, rgba(37,99,235,0.85) 0%, rgba(56,189,248,0.28) 55%, transparent 75%)',
          }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-px opacity-80"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(168,85,247,0.9) 30%, rgba(56,189,248,0.95) 70%, transparent 100%)',
          }}
        />
      </div>

      {/* =====================================================================
          FOREGROUND LOGIN LAYOUT
         ===================================================================== */}
      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-[1160px] flex-col justify-between px-5 py-4 sm:px-8 sm:py-6">
        {/* Top Bar: Circular $OKN Emblem + Bold OKN Wordmark | Language Switcher */}
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="relative flex size-10 sm:size-11 items-center justify-center rounded-full bg-gradient-to-br from-[#A855F7] via-[#7A12F5] to-[#38BDF8] p-[2px] shadow-[0_0_24px_rgba(122,18,245,0.55)]">
              <span className="flex size-full items-center justify-center rounded-full bg-white p-1.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/okn-logo.png"
                  alt="$OKN"
                  referrerPolicy="no-referrer"
                  className="size-full object-contain"
                />
              </span>
            </span>
            <span className="text-[22px] sm:text-[24px] font-black tracking-[0.06em] text-white">
              OKN
            </span>
          </div>

          {/* Scoped dark CSS vars so the shared LanguageSwitcher renders as dark glass */}
          <div
            className="dark"
            style={
              {
                '--line': 'rgba(255, 255, 255, 0.16)',
                '--s1': '#121026',
                '--s2': 'rgba(16, 14, 34, 0.72)',
                '--tx': '#F8F7FF',
                '--mut': '#B6B0D2',
              } as React.CSSProperties
            }
          >
            <LanguageSwitcher />
          </div>
        </header>

        {/* Center Main Stage */}
        <main className="mx-auto flex w-full max-w-[448px] flex-1 flex-col items-center justify-center py-3 sm:py-4">
          {/* Floating 3D $OKN Coin Hovering Directly Above the Luminous Pedestal */}
          <div className="relative mb-3 sm:mb-4 flex h-[156px] sm:h-[176px] w-full items-center justify-center">
            {/* Soft neon violet-blue volumetric halo behind coin */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute size-44 sm:size-52 rounded-full opacity-70 blur-3xl"
              style={{
                background:
                  'radial-gradient(circle, rgba(168,85,247,0.65) 0%, rgba(56,189,248,0.38) 52%, transparent 74%)',
              }}
            />

            {/* Tilted luminous orbital light ring echoing the reference coin orbit */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute h-[86px] w-[264px] sm:h-[96px] sm:w-[300px] -rotate-[22deg] rounded-[50%] border border-[#A855F7]/55 shadow-[0_0_24px_rgba(168,85,247,0.55),inset_0_0_18px_rgba(56,189,248,0.45)]"
            />

            {/* Crisp Floating $OKN 3D Coin */}
            <motion.div
              animate={animateLive ? { y: [0, -7, 0] } : undefined}
              transition={
                animateLive
                  ? { duration: 4.6, repeat: Infinity, ease: 'easeInOut' }
                  : undefined
              }
              className="relative z-10 flex size-[176px] sm:size-[196px] items-center justify-center will-change-transform"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/OKN_coin_transparent_padded.png"
                alt="$OKN Coin"
                referrerPolicy="no-referrer"
                className="size-full object-contain drop-shadow-[0_18px_36px_rgba(122,18,245,0.62)]"
              />
            </motion.div>
          </div>

          {/* Headline, Subheading & Unboxed Trust Strip */}
          <div className="w-full text-center">
            <h1 className="text-[32px] sm:text-[38px] font-black tracking-[-0.03em] leading-[1.08] text-white">
              Sign in to{' '}
              <span className="bg-gradient-to-r from-[#C084FC] via-[#818CF8] to-[#38BDF8] bg-clip-text text-transparent">
                OKN
              </span>
            </h1>
            <p className="mt-1.5 text-[14px] sm:text-[15px] font-medium text-[#CFCBE6]">
              Your gateway to the OKNexus ecosystem
            </p>

            {/* Unboxed Inline Trust Strip (Secure | Fast | Decentralized) */}
            <div className="mt-3.5 flex flex-wrap items-center justify-center gap-x-3.5 gap-y-1.5 text-[12px] sm:text-[12.5px] font-semibold text-[#D6D2EC]">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-[#E9D5FF]" aria-hidden="true" />
                <span>Secure</span>
              </span>
              <span aria-hidden="true" className="h-3.5 w-px bg-white/20" />
              <span className="inline-flex items-center gap-1.5">
                <Zap className="size-3.5 text-[#C084FC]" aria-hidden="true" />
                <span>Fast</span>
              </span>
              <span aria-hidden="true" className="h-3.5 w-px bg-white/20" />
              <span className="inline-flex items-center gap-1.5">
                <Globe className="size-3.5 text-[#7DD3FC]" aria-hidden="true" />
                <span>Decentralized</span>
              </span>
            </div>
          </div>

          {/* Frosted Obsidian-Indigo Glass Auth Card with Radiant Rim */}
          <div className="mt-5 w-full rounded-[28px] bg-gradient-to-b from-[#A855F7]/60 via-[#3B82F6]/38 to-[#7C3AED]/55 p-[1.5px] shadow-[0_24px_70px_rgba(0,0,0,0.65),0_0_44px_rgba(122,18,245,0.22)]">
            <section
              aria-label="Sign in methods"
              className="relative overflow-hidden rounded-[26.5px] bg-[#0B0920]/86 px-4 py-5 sm:px-5 sm:py-6 backdrop-blur-2xl"
            >
              {/* Subtle internal radial glow */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-24 left-1/2 h-44 w-80 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#9333EA]/22 via-[#2563EB]/20 to-[#38BDF8]/18 blur-3xl"
              />

              {/* Primary CTA: Login with Telegram */}
              <motion.div
                whileHover={animateLive && !pendingProvider ? { scale: 1.012 } : undefined}
                whileTap={animateLive && !pendingProvider ? { scale: 0.985 } : undefined}
                transition={{ type: 'spring', stiffness: 450, damping: 26 }}
                className="relative"
              >
                <button
                  type="button"
                  data-testid="login-telegram-btn"
                  disabled={Boolean(pendingProvider)}
                  onClick={() => void submitSessionSignIn('telegram', false)}
                  className="group relative flex h-[54px] sm:h-[58px] w-full items-center justify-between gap-3 overflow-hidden rounded-full bg-gradient-to-r from-[#9333EA] via-[#4F46E5] to-[#38BDF8] px-5 text-white shadow-[0_12px_32px_rgba(122,18,245,0.5),inset_0_1px_0_rgba(255,255,255,0.35)] ring-1 ring-inset ring-white/25 transition-[filter] duration-200 hover:brightness-110 disabled:opacity-75 cursor-pointer"
                >
                  {/* Sweeping Specular Sheen */}
                  {animateLive && (
                    <motion.span
                      aria-hidden="true"
                      initial={{ x: '-160%' }}
                      animate={{ x: ['-160%', '300%'] }}
                      transition={{
                        duration: 1.4,
                        repeat: Infinity,
                        repeatDelay: 3.2,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className="pointer-events-none absolute inset-y-0 left-0 w-16 -skew-x-[24deg] bg-gradient-to-r from-transparent via-white/25 to-transparent will-change-transform"
                    />
                  )}

                  <span className="relative z-10 flex items-center gap-3">
                    {pendingProvider === 'telegram' ? (
                      <Loader2 className="size-5 shrink-0 animate-spin text-white" aria-hidden="true" />
                    ) : (
                      <Send className="size-5 shrink-0 -translate-x-[1px] translate-y-[0.5px] text-white" aria-hidden="true" />
                    )}
                    <span className="text-[15.5px] sm:text-[16px] font-extrabold tracking-tight text-white">
                      {pendingProvider === 'telegram'
                        ? 'Signing in with Telegram...'
                        : 'Login with Telegram'}
                    </span>
                  </span>

                  {lastUsed === 'telegram' && pendingProvider !== 'telegram' && (
                    <span className="relative z-10 inline-flex items-center gap-1.5 rounded-full bg-[#09152E]/45 px-2.5 py-1 text-[11px] font-bold text-[#E0F2FE] ring-1 ring-inset ring-white/25 whitespace-nowrap">
                      <span className="size-1.5 rounded-full bg-[#34D399]" aria-hidden="true" />
                      <span>Last Used</span>
                    </span>
                  )}
                </button>
              </motion.div>

              {/* OR Hairline Divider */}
              <div className="my-4 flex items-center gap-3.5" aria-hidden="true">
                <span className="h-px flex-1 bg-white/15" />
                <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#B8B2D6]">
                  OR
                </span>
                <span className="h-px flex-1 bg-white/15" />
              </div>

              {/* Secondary CTA: Connect Wallet (triggers mandatory existing-accounts-only notice modal) */}
              <button
                type="button"
                data-testid="login-wallet-btn"
                disabled={Boolean(pendingProvider)}
                onClick={() => {
                  setErrorMessage(null);
                  setWalletModalOpen(true);
                }}
                className="group relative flex w-full items-center justify-between gap-3 rounded-2xl bg-[#13112B]/88 px-3.5 py-3 text-left text-white ring-1 ring-inset ring-white/16 transition-all duration-150 hover:bg-[#191638]/95 hover:ring-[#A855F7]/55 active:scale-[0.985] disabled:opacity-70 cursor-pointer"
              >
                <span className="flex items-center gap-3 min-w-0">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.08] text-white ring-1 ring-inset ring-white/12 transition-colors group-hover:bg-[#7A12F5]/25 group-hover:text-[#E9D5FF]">
                    {pendingProvider === 'wallet' ? (
                      <Loader2 className="size-4.5 animate-spin" aria-hidden="true" />
                    ) : (
                      <Wallet className="size-4.5" aria-hidden="true" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-[14.5px] sm:text-[15px] font-extrabold text-white">
                        {pendingProvider === 'wallet'
                          ? 'Signing in with Wallet...'
                          : 'Connect Wallet'}
                      </span>
                      {lastUsed === 'wallet' && pendingProvider !== 'wallet' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#7A12F5]/25 px-2 py-0.5 text-[10.5px] font-bold text-[#E9D5FF] ring-1 ring-inset ring-[#C084FC]/30 whitespace-nowrap">
                          Last Used
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 block truncate text-[12px] font-medium text-[#A9A3C9]">
                      MetaMask, WalletConnect, etc.
                    </span>
                  </span>
                </span>

                <ChevronRight
                  className="size-4.5 shrink-0 text-[#9B95BC] transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-white"
                  aria-hidden="true"
                />
              </button>

              {/* Live Auth Status / Error Feedback */}
              {statusMessage && !errorMessage && (
                <p
                  role="status"
                  aria-live="polite"
                  className="mt-3.5 text-center text-[12px] font-semibold text-[#C4B5FD]"
                >
                  {statusMessage}
                </p>
              )}

              {errorMessage && (
                <p
                  role="alert"
                  className="mt-3.5 rounded-xl bg-[#EF4444]/15 px-3 py-2 text-center text-[12px] font-semibold text-[#FCA5A5] ring-1 ring-inset ring-[#EF4444]/35"
                >
                  {errorMessage}
                </p>
              )}
            </section>
          </div>

          {/* Privacy Reassurance Capsule */}
          <div className="mt-4 inline-flex max-w-full items-center gap-2 rounded-full bg-[#0E0C24]/85 px-4 py-2 text-[11.5px] sm:text-[12px] font-medium text-[#D1CCE8] ring-1 ring-inset ring-white/12 backdrop-blur-xl">
            <ShieldCheck className="size-4 shrink-0 text-[#34D399]" aria-hidden="true" />
            <span>Your data is protected. We never store your private keys.</span>
          </div>
        </main>

        {/* Bottom Ecosystem Attribution & 3-Column Trust Footer */}
        <footer className="mx-auto w-full max-w-[448px] pt-2 pb-1">
          <div className="flex items-center gap-3 text-[11.5px] font-semibold text-[#9E98BD]">
            <span className="h-px flex-1 bg-white/12" aria-hidden="true" />
            <span>
              Powered by <span className="font-bold text-[#A855F7]">OKNexus</span>
            </span>
            <span className="h-px flex-1 bg-white/12" aria-hidden="true" />
          </div>

          <div className="mt-3 grid grid-cols-3 items-center divide-x divide-white/12 text-[11px] sm:text-[11.5px] font-semibold text-[#C9C4E0]">
            <div className="flex items-center justify-center gap-1.5 pr-2">
              <ShieldCheck className="size-4 shrink-0 text-[#E9D5FF]" aria-hidden="true" />
              <span className="leading-tight">
                KYC Verified
                <br />
                by Assured
              </span>
            </div>
            <div className="flex items-center justify-center gap-1.5 px-2">
              <Box className="size-4 shrink-0 text-[#C084FC]" aria-hidden="true" />
              <span className="leading-tight">
                Built on
                <br />
                Blockchain
              </span>
            </div>
            <div className="flex items-center justify-center gap-1.5 pl-2">
              <Globe className="size-4 shrink-0 text-[#7DD3FC]" aria-hidden="true" />
              <span className="leading-tight">
                Trusted by
                <br />
                Millions
              </span>
            </div>
          </div>
        </footer>
      </div>

      {/* Existing-Accounts-Only Wallet Notice Modal */}
      <WalletNoticeModal
        open={walletModalOpen}
        busy={pendingProvider === 'wallet'}
        onClose={() => setWalletModalOpen(false)}
        onAcceptWalletSignIn={() => void submitSessionSignIn('wallet', true)}
        onSwitchToTelegram={() => {
          setWalletModalOpen(false);
          void submitSessionSignIn('telegram', false);
        }}
      />
    </div>
  );
}
