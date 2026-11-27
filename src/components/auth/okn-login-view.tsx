'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion, useReducedMotion } from 'motion/react';
import {
  ArrowRight,
  ChevronRight,
  Loader2,
  Lock,
  Send,
  Wallet,
} from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { LanguageSwitcher } from '@/components/landing/language-switcher';
import { WalletNoticeModal } from '@/components/auth/wallet-notice-modal';
import { resetReferralBattlePopupForFreshLogin } from '@/lib/referral-battle-popup';
import { useHydrated } from '@/lib/hooks/use-hydrated';
import obsidianStageImg from '@/assets/images/okn_obsidian_architectural_stage_1795751394657.jpg';

type AuthProvider = 'telegram' | 'wallet';

const LAST_USED_KEY = 'okn_last_auth_provider';

/**
 * OknLoginView — Architectural split-canvas sign-in experience for the OKN dashboard.
 *
 * Left panel (desktop) / compact obsidian banner (mobile):
 *   Studio obsidian basalt & smoked-glass showcase featuring the authentic
 *   tilted 3D OKN coin and verified Assure DeFi + BNB Smart Chain marks.
 *
 * Right panel (desktop) / main canvas (mobile):
 *   Clean, distraction-free authentication studio honoring Light & Dark themes
 *   with Telegram primary login, Connect Wallet (gated behind the mandatory
 *   existing-accounts-only notice modal), and zero Scan QR Code option.
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
    <div className="min-h-dvh w-full bg-white dark:bg-[#0B0A11] text-[#0E0D15] dark:text-[#F5F4FA] grid grid-cols-1 lg:grid-cols-[1.08fr_1fr] selection:bg-[#7A12F5]/20">
      {/* =====================================================================
          LEFT SHOWCASE PANEL (Desktop) / COMPACT ARCHITECTURAL HEADER (Mobile)
         ===================================================================== */}
      <section
        aria-label="OKNexus Brand Showcase"
        className="relative flex flex-col justify-between overflow-hidden bg-[#08070D] text-white px-6 py-5 sm:px-10 sm:py-7 lg:px-12 lg:py-10 min-h-[228px] lg:min-h-dvh"
      >
        {/* Minimalist Architectural Obsidian & Smoked Glass Studio Backdrop */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <Image
            src={obsidianStageImg}
            alt=""
            fill
            priority
            sizes="(min-width: 1024px) 54vw, 100vw"
            referrerPolicy="no-referrer"
            className="object-cover object-center opacity-90"
          />
          {/* Measured Editorial Scrims for High-Contrast Typography */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#08070D]/75 via-[#08070D]/20 to-[#08070D]/95" />
          <div className="hidden lg:block absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#08070D]/65 to-transparent" />
        </div>

        {/* Top Lockup: Brand Mark + Mobile Language Switcher */}
        <header className="relative z-10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/OKN_logo_transparent.png"
              alt="OKN"
              referrerPolicy="no-referrer"
              className="size-7 sm:size-8 object-contain"
            />
            <span className="text-[18px] sm:text-[19px] font-bold tracking-[0.06em] text-white whitespace-nowrap">
              OKN
            </span>
          </div>

          {/* Mobile-only Language Switcher scoped for dark obsidian surface */}
          <div
            className="lg:hidden dark"
            style={
              {
                '--line': 'rgba(255, 255, 255, 0.14)',
                '--s1': '#14121E',
                '--s2': 'rgba(20, 18, 30, 0.72)',
                '--tx': '#F5F4FA',
                '--mut': '#A39EB8',
              } as React.CSSProperties
            }
          >
            <LanguageSwitcher />
          </div>
        </header>

        {/* Center Sculptural Asset: Authentic Studio-Rendered Tilted 3D OKN Coin */}
        <div className="relative z-10 my-3 lg:my-auto flex flex-col items-center justify-center py-1 lg:py-8">
          <motion.div
            animate={animateLive ? { y: [0, -6, 0] } : undefined}
            transition={
              animateLive
                ? { duration: 6, repeat: Infinity, ease: 'easeInOut' }
                : undefined
            }
            className="relative flex items-center justify-center will-change-transform"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/OKN_coin_3d_new_tilted.png"
              alt="$OKN 3D Token"
              referrerPolicy="no-referrer"
              className="w-[126px] sm:w-[152px] lg:w-[242px] xl:w-[268px] h-auto object-contain drop-shadow-[0_28px_42px_rgba(0,0,0,0.68)] [clip-path:inset(0_0_11%_0)]"
            />
          </motion.div>

          {/* Subtle grounded contact shadow over the basalt plinth */}
          <div
            aria-hidden="true"
            className="-mt-3 lg:-mt-2 h-3 w-28 lg:w-44 rounded-full bg-black/70 blur-md"
          />
        </div>

        {/* Desktop Editorial Statement & Real Credential Bar */}
        <div className="relative z-10 hidden lg:block space-y-6">
          <div className="max-w-[440px] space-y-2.5">
            <h2 className="text-[32px] xl:text-[36px] font-semibold tracking-[-0.03em] leading-[1.12] text-white [text-wrap:balance]">
              Your gateway to the{' '}
              <span className="text-[#C7C2DC]">OKNexus ecosystem.</span>
            </h2>
            <p className="text-[14.5px] leading-[1.6] text-[#9A95B0]">
              Manage Stage 1 presale holdings, autonomous prediction agents, and on-chain BNB rewards from one unified account.
            </p>
          </div>

          {/* Unboxed Real Brand Seals & Credentials (Zero Pill Clutter) */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/[0.1] pt-5 text-[12.5px] font-medium text-[#C5C0D8]">
            <span className="inline-flex items-center gap-2 whitespace-nowrap">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/assure_defi_badge.webp"
                alt="Assure DeFi"
                referrerPolicy="no-referrer"
                className="size-5 object-contain"
              />
              <span>KYC Verified by Assure DeFi</span>
            </span>
            <span aria-hidden="true" className="text-white/25">·</span>
            <span className="inline-flex items-center gap-2 whitespace-nowrap">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/bnb_chain_logo.png"
                alt="BNB Smart Chain"
                referrerPolicy="no-referrer"
                className="size-4 object-contain"
              />
              <span>BNB Smart Chain</span>
            </span>
            <span aria-hidden="true" className="text-white/25">·</span>
            <span className="whitespace-nowrap text-[#A49FB8]">Non-Custodial</span>
          </div>
        </div>
      </section>

      {/* =====================================================================
          RIGHT AUTHENTICATION STUDIO (Desktop) / PRIMARY CANVAS (Mobile)
          Zero nested boxes, crisp typographic hierarchy, pure whitespace.
         ===================================================================== */}
      <main className="relative flex flex-col justify-between bg-white dark:bg-[#0B0A11] px-6 py-7 sm:px-10 sm:py-9 lg:px-16 lg:py-10">
        {/* Desktop Top-Right Language Control */}
        <div className="hidden lg:flex items-center justify-end">
          <LanguageSwitcher />
        </div>

        {/* Centered Precision Auth Stack */}
        <motion.div
          initial={animateLive ? { opacity: 0, y: 8 } : undefined}
          animate={animateLive ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto my-auto w-full max-w-[416px] py-2 lg:py-6"
        >
          {/* Header Copy */}
          <div>
            <h1 className="text-[27px] sm:text-[31px] font-bold tracking-[-0.03em] leading-[1.12] text-[#0E0D15] dark:text-[#F6F5FB]">
              Sign in to OKN
            </h1>
            <p className="mt-2 text-[14.5px] leading-[1.55] text-[#605D72] dark:text-[#9893AC]">
              Continue with Telegram for instant access, or sign in with an existing Web3 wallet.
            </p>
          </div>

          {/* Primary Action: Solid Architectural OKN Signature Purple CTA */}
          <div className="mt-7">
            <button
              type="button"
              data-testid="login-telegram-btn"
              disabled={Boolean(pendingProvider)}
              onClick={() => void submitSessionSignIn('telegram', false)}
              className="group flex h-[52px] w-full items-center justify-between gap-3 rounded-[13px] bg-[#7A12F5] px-4 text-white shadow-[0_1px_2px_rgba(12,10,24,0.12),0_12px_26px_-10px_rgba(122,18,245,0.55),inset_0_1px_0_rgba(255,255,255,0.2)] transition-all duration-150 hover:bg-[#690EDD] active:scale-[0.99] disabled:opacity-70 cursor-pointer"
            >
              <span className="flex items-center gap-3 min-w-0">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-[9px] bg-white/[0.15]">
                  {pendingProvider === 'telegram' ? (
                    <Loader2 className="size-4 animate-spin text-white" aria-hidden="true" />
                  ) : (
                    <Send className="size-4 -translate-x-[0.5px] translate-y-[0.5px] text-white" aria-hidden="true" />
                  )}
                </span>
                <span className="truncate text-[15px] font-semibold tracking-[-0.01em] text-white">
                  {pendingProvider === 'telegram'
                    ? 'Signing in with Telegram...'
                    : 'Login with Telegram'}
                </span>
              </span>

              <span className="flex items-center gap-2 shrink-0">
                {lastUsed === 'telegram' && pendingProvider !== 'telegram' && (
                  <span className="text-[12px] font-medium text-white/75 whitespace-nowrap">
                    Last used
                  </span>
                )}
                <ArrowRight
                  className="size-4 text-white/80 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-white"
                  aria-hidden="true"
                />
              </span>
            </button>
          </div>

          {/* Minimal Hairline Divider */}
          <div className="my-5 flex items-center gap-3.5" aria-hidden="true">
            <span className="h-px flex-1 bg-[#ECEAF3] dark:bg-white/[0.08]" />
            <span className="text-[12px] font-medium text-[#8B879B] dark:text-[#78748B]">
              or
            </span>
            <span className="h-px flex-1 bg-[#ECEAF3] dark:bg-white/[0.08]" />
          </div>

          {/* Secondary Action: Connect Wallet (Opens Mandatory Notice Modal, NO Scan QR Code) */}
          <div>
            <button
              type="button"
              data-testid="login-wallet-btn"
              disabled={Boolean(pendingProvider)}
              onClick={() => {
                setErrorMessage(null);
                setWalletModalOpen(true);
              }}
              className="group flex w-full items-center justify-between gap-3.5 rounded-[13px] bg-[#F7F6FA] dark:bg-[#14121E] px-4 py-3.5 text-left ring-1 ring-inset ring-[#E5E3EE] dark:ring-white/[0.09] transition-all duration-150 hover:bg-[#F0EEF7] dark:hover:bg-[#1A1727] hover:ring-[#7A12F5]/40 active:scale-[0.99] disabled:opacity-70 cursor-pointer"
            >
              <span className="flex items-center gap-3.5 min-w-0">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-white dark:bg-[#1E1B2B] text-[#171424] dark:text-[#EAE7F5] ring-1 ring-inset ring-black/[0.06] dark:ring-white/[0.08] transition-colors group-hover:text-[#7A12F5] dark:group-hover:text-[#C084FC]">
                  {pendingProvider === 'wallet' ? (
                    <Loader2 className="size-4.5 animate-spin" aria-hidden="true" />
                  ) : (
                    <Wallet className="size-4.5" aria-hidden="true" />
                  )}
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-[14.5px] font-semibold tracking-[-0.01em] text-[#110F1B] dark:text-[#F4F3F9]">
                      {pendingProvider === 'wallet'
                        ? 'Signing in with Wallet...'
                        : 'Connect Wallet'}
                    </span>
                    {lastUsed === 'wallet' && pendingProvider !== 'wallet' && (
                      <span className="text-[11.5px] font-medium text-[#7A12F5] dark:text-[#C084FC] whitespace-nowrap">
                        Last used
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block truncate text-[12px] sm:text-[12.5px] text-[#6A677B] dark:text-[#918CA5]">
                    MetaMask, WalletConnect · Existing accounts
                  </span>
                </span>
              </span>

              <ChevronRight
                className="size-4 shrink-0 text-[#9490A6] transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-[#7A12F5] dark:group-hover:text-[#C084FC]"
                aria-hidden="true"
              />
            </button>
          </div>

          {/* Live Auth Status / Error Feedback */}
          {statusMessage && !errorMessage && (
            <p
              role="status"
              aria-live="polite"
              className="mt-4 text-[12.5px] font-medium text-[#7A12F5] dark:text-[#C084FC]"
            >
              {statusMessage}
            </p>
          )}

          {errorMessage && (
            <p
              role="alert"
              className="mt-4 text-[12.5px] font-medium text-[#DC2626] dark:text-[#F87171]"
            >
              {errorMessage}
            </p>
          )}

          {/* Unboxed Non-Custodial Privacy Note */}
          <div className="mt-6 flex items-center gap-2 text-[12.5px] text-[#6E6B7E] dark:text-[#8E89A3]">
            <Lock className="size-3.5 shrink-0 text-[#7A12F5] dark:text-[#A78BFA]" aria-hidden="true" />
            <span>Your data is protected. We never store your private keys.</span>
          </div>
        </motion.div>

        {/* Quiet Editorial Footer */}
        <footer className="mx-auto mt-8 w-full max-w-[416px] border-t border-[#EFEDF5] dark:border-white/[0.08] pt-4 flex items-center justify-between gap-4 text-[12px] text-[#7D798E] dark:text-[#827D96]">
          <span>
            Powered by{' '}
            <span className="font-semibold text-[#110F1B] dark:text-[#E8E5F5]">
              OKNexus
            </span>
          </span>

          <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/assure_defi_badge.webp"
              alt="Assure DeFi"
              referrerPolicy="no-referrer"
              className="size-4 object-contain"
            />
            <span>Assure DeFi Verified</span>
          </span>
        </footer>
      </main>

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
