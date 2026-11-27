'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  ChevronRight,
  Loader2,
  Lock,
  Send,
  Wallet,
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { routing } from '@/i18n/routing';
import { LanguageSwitcher } from '@/components/landing/language-switcher';
import { WalletNoticeModal } from '@/components/auth/wallet-notice-modal';
import { resetReferralBattlePopupForFreshLogin } from '@/lib/referral-battle-popup';

type AuthProvider = 'telegram' | 'wallet';

const LAST_USED_KEY = 'okn_last_auth_provider';

/**
 * OknLoginView — Zero-asset, instant-loading editorial authentication view
 * for the OKNexus ecosystem.
 *
 * Uses a native top-level `<form method="POST" action="/api/auth/session">`
 * submission that returns an HTTP 303 redirect with `Set-Cookie` on the same
 * navigation response. This eliminates iOS Chrome (WKWebView) / Safari ITP
 * `fetch()` -> `window.location.assign()` cookie-sync race conditions on Vercel.
 */
export function OknLoginView() {
  const locale = useLocale();
  const formRef = useRef<HTMLFormElement | null>(null);
  const providerInputRef = useRef<HTMLInputElement | null>(null);
  const noticeInputRef = useRef<HTMLInputElement | null>(null);
  const redirectInputRef = useRef<HTMLInputElement | null>(null);
  const loginPathInputRef = useRef<HTMLInputElement | null>(null);
  const frameInputRef = useRef<HTMLInputElement | null>(null);

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
      const params = new URLSearchParams(window.location.search);
      const urlError = params.get('error');
      if (urlError) {
        setErrorMessage(urlError);
      }
    } catch {
      // Ignore storage read restrictions
    }
  }, []);

  const submitSessionSignIn = (
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
      window.localStorage.setItem(LAST_USED_KEY, provider);
      setLastUsed(provider);
    } catch {
      // Ignore storage quota errors
    }

    setWalletModalOpen(false);
    resetReferralBattlePopupForFreshLogin(undefined, true);
    window.dispatchEvent(new CustomEvent('okn:login', { detail: { provider } }));

    const localePrefix =
      locale && locale !== routing.defaultLocale ? `/${locale}` : '';
    const targetPath = `${localePrefix}/app/portfolio`;
    const loginPath = `${localePrefix}/login`;
    let isEmbedded = false;
    try {
      isEmbedded = window.self !== window.top;
    } catch {
      isEmbedded = true;
    }

    if (
      formRef.current &&
      providerInputRef.current &&
      noticeInputRef.current &&
      redirectInputRef.current &&
      loginPathInputRef.current &&
      frameInputRef.current
    ) {
      providerInputRef.current.value = provider;
      noticeInputRef.current.value = acceptedExistingAccountNotice ? 'true' : 'false';
      redirectInputRef.current.value = targetPath;
      loginPathInputRef.current.value = loginPath;
      frameInputRef.current.value = isEmbedded ? 'iframe' : 'top';
      formRef.current.submit();
      return;
    }

    setErrorMessage('Unable to submit sign-in form. Please refresh and try again.');
    setStatusMessage(null);
    setPendingProvider(null);
  };

  return (
    <div className="relative flex min-h-dvh w-full flex-col justify-between bg-white dark:bg-[#0B0A11] text-[#0E0D15] dark:text-[#F5F4FA] selection:bg-[#7A12F5]/20">
      {/* Subtle Top Radial Tint (Zero Image Bytes — Instant Paint) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(122,18,245,0.08),transparent)] dark:bg-[radial-gradient(60%_50%_at_50%_0%,rgba(122,18,245,0.16),transparent)]"
      />

      {/* Top Navigation Bar: z-50 so LanguageSwitcher dropdown renders above main content */}
      <header className="relative z-50 mx-auto flex w-full max-w-[1120px] items-center justify-between gap-4 px-5 py-4 sm:px-8 sm:py-6">
        <div className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/OKN_logo_transparent.png"
            alt="OKNexus"
            referrerPolicy="no-referrer"
            className="size-8 sm:size-9 shrink-0 object-contain"
          />
          <span className="text-[19px] sm:text-[21px] font-bold tracking-[-0.02em] text-[#0E0D15] dark:text-white whitespace-nowrap">
            OKNexus
          </span>
        </div>

        <LanguageSwitcher />
      </header>

      {/* Main Centered Authentication Column */}
      <main className="relative z-10 mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center px-5 py-6 sm:px-6">
        <div>
          <h1 className="text-[28px] sm:text-[32px] font-bold tracking-[-0.03em] leading-[1.12] text-[#0E0D15] dark:text-[#F6F5FB]">
            Sign in to OKN
          </h1>
          <p className="mt-2 text-[14.5px] leading-[1.55] text-[#605D72] dark:text-[#9893AC]">
            Continue with Telegram for instant access, or sign in with an existing Web3 wallet.
          </p>
        </div>

        {/* Primary Action: Login with Telegram */}
        <div className="mt-7">
          <button
            type="button"
            data-testid="login-telegram-btn"
            disabled={Boolean(pendingProvider)}
            onClick={() => void submitSessionSignIn('telegram', false)}
            className="group flex h-[52px] w-full items-center justify-between gap-3 rounded-[13px] bg-[#7A12F5] px-4 text-white shadow-[0_1px_2px_rgba(12,10,24,0.12),0_12px_26px_-10px_rgba(122,18,245,0.52),inset_0_1px_0_rgba(255,255,255,0.2)] transition-all duration-150 hover:bg-[#690EDD] active:scale-[0.99] disabled:opacity-70 cursor-pointer"
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

        {/* Hairline Divider */}
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
            className="group flex w-full items-center justify-between gap-3 rounded-[13px] bg-[#F7F6FA] dark:bg-[#14121E] px-4 py-3.5 text-left ring-1 ring-inset ring-[#E5E3EE] dark:ring-white/[0.09] transition-all duration-150 hover:bg-[#F0EEF7] dark:hover:bg-[#1A1727] hover:ring-[#7A12F5]/40 active:scale-[0.99] disabled:opacity-70 cursor-pointer"
          >
            <span className="flex items-center gap-3 min-w-0">
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
                <span className="mt-0.5 block text-[12px] text-[#6A677B] dark:text-[#918CA5]">
                  MetaMask, WalletConnect, etc.
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
        <div className="mt-6 flex items-center gap-2 text-[12px] sm:text-[12.5px] text-[#6E6B7E] dark:text-[#8E89A3]">
          <Lock className="size-3.5 shrink-0 text-[#7A12F5] dark:text-[#A78BFA]" aria-hidden="true" />
          <span>Your data is protected. We never store your private keys.</span>
        </div>
      </main>

      {/* Quiet Editorial Footer */}
      <footer className="relative z-10 mx-auto w-full max-w-[420px] px-5 pb-6 sm:px-6">
        <div className="flex items-center justify-between gap-4 border-t border-[#EFEDF5] dark:border-white/[0.08] pt-4 text-[12px] text-[#7D798E] dark:text-[#827D96]">
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
        </div>
      </footer>

      {/* Native Top-Level POST Form for Atomic 303 + Set-Cookie Navigation */}
      <form
        ref={formRef}
        method="POST"
        action="/api/auth/session"
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      >
        <input ref={providerInputRef} type="hidden" name="provider" defaultValue="telegram" suppressHydrationWarning />
        <input
          ref={noticeInputRef}
          type="hidden"
          name="acceptedExistingAccountNotice"
          defaultValue="false"
          suppressHydrationWarning
        />
        <input
          ref={redirectInputRef}
          type="hidden"
          name="redirectTo"
          defaultValue="/app/portfolio"
          suppressHydrationWarning
        />
        <input ref={loginPathInputRef} type="hidden" name="loginPath" defaultValue="/login" suppressHydrationWarning />
        <input ref={frameInputRef} type="hidden" name="frameContext" defaultValue="top" suppressHydrationWarning />
      </form>

      {/* Existing-Accounts-Only Wallet Notice Modal */}
      <WalletNoticeModal
        open={walletModalOpen}
        busy={pendingProvider === 'wallet'}
        onClose={() => setWalletModalOpen(false)}
        onAcceptWalletSignIn={() => submitSessionSignIn('wallet', true)}
        onSwitchToTelegram={() => {
          setWalletModalOpen(false);
          submitSessionSignIn('telegram', false);
        }}
      />
    </div>
  );
}
