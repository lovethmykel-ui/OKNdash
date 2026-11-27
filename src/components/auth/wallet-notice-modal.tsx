'use client';

import { useEffect, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { AlertTriangle, CheckCircle2, Loader2, Send, Wallet, X } from 'lucide-react';
import { useHydrated } from '@/lib/hooks/use-hydrated';

interface WalletNoticeModalProps {
  open: boolean;
  busy: boolean;
  onClose: () => void;
  onAcceptWalletSignIn: () => void;
  onSwitchToTelegram: () => void;
}

/**
 * WalletNoticeModal — Mandatory existing-accounts-only acknowledgement dialog
 * shown whenever a user selects "Connect Wallet" on the OKN login screen.
 */
export function WalletNoticeModal({
  open,
  busy,
  onClose,
  onAcceptWalletSignIn,
  onSwitchToTelegram,
}: WalletNoticeModalProps) {
  const hydrated = useHydrated();
  const prefersReduced = useReducedMotion();
  const animateLive = hydrated && !prefersReduced;
  const acceptBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus the primary action button once mounted
    const focusTimer = window.setTimeout(() => {
      acceptBtnRef.current?.focus();
    }, 40);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, busy, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="wallet-notice-title"
          aria-describedby="wallet-notice-description"
          data-testid="wallet-notice-modal"
        >
          {/* Scrim Backdrop */}
          <motion.div
            initial={animateLive ? { opacity: 0 } : undefined}
            animate={{ opacity: 1 }}
            exit={animateLive ? { opacity: 0 } : undefined}
            transition={{ duration: 0.2 }}
            onClick={() => {
              if (!busy) onClose();
            }}
            className="absolute inset-0 bg-[#04030B]/80 backdrop-blur-md"
          />

          {/* Modal Frame with Luminous Violet-Blue Rim */}
          <motion.div
            initial={animateLive ? { opacity: 0, scale: 0.95, y: 12 } : undefined}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={animateLive ? { opacity: 0, scale: 0.96, y: 8 } : undefined}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 w-full max-w-[448px] rounded-[26px] bg-gradient-to-b from-[#9333EA]/55 via-[#3B82F6]/35 to-[#6D28D9]/45 p-[1.5px] shadow-[0_28px_80px_rgba(0,0,0,0.75),0_0_40px_rgba(122,18,245,0.28)]"
          >
            <div className="relative overflow-hidden rounded-[24.5px] bg-[#0B091D]/95 p-5 sm:p-6 text-white backdrop-blur-2xl">
              {/* Subtle top ambient radial sheen */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-20 left-1/2 h-40 w-72 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#8B2CFF]/30 via-[#3B82F6]/25 to-[#38BDF8]/25 blur-3xl"
              />

              {/* Header */}
              <div className="relative flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#F59E0B]/25 via-[#F59E0B]/15 to-[#7A12F5]/20 text-[#FBBF24] ring-1 ring-inset ring-[#FBBF24]/35">
                    <AlertTriangle className="size-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h2
                      id="wallet-notice-title"
                      className="text-[17px] sm:text-[18px] font-extrabold tracking-tight text-white"
                    >
                      Existing Wallet Accounts Only
                    </h2>
                    <p className="mt-0.5 text-[12px] font-medium text-[#A8A3C7]">
                      Please confirm before continuing with Wallet Connect
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  disabled={busy}
                  aria-label="Close wallet sign-in notice"
                  className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-[#B8B3D1] ring-1 ring-inset ring-white/12 transition-colors hover:bg-white/[0.12] hover:text-white disabled:opacity-50 cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Exact Required Policy Notice */}
              <div className="relative mt-4 rounded-2xl bg-[#16122E]/90 p-4 ring-1 ring-inset ring-[#FBBF24]/30">
                <p
                  id="wallet-notice-description"
                  className="text-[13.5px] leading-[1.6] text-[#F1EFFC]"
                >
                  Wallet sign-in is for{' '}
                  <strong className="font-extrabold text-[#FDE68A]">
                    existing accounts only
                  </strong>{' '}
                  - wallet account creation is deprecated. New here? Sign up with
                  Telegram below. Already have a wallet account? Sign in, then{' '}
                  <strong className="font-extrabold text-white">
                    bind your Telegram in Settings → Profile
                  </strong>{' '}
                  to keep permanent access.
                </p>
              </div>

              {/* Primary Acceptance Action + New-User Telegram Switch */}
              <div className="relative mt-5 flex flex-col gap-2.5">
                <button
                  ref={acceptBtnRef}
                  type="button"
                  data-testid="wallet-notice-accept-btn"
                  disabled={busy}
                  onClick={onAcceptWalletSignIn}
                  className="group relative flex h-12 w-full items-center justify-center gap-2.5 rounded-full bg-gradient-to-r from-[#8B2CFF] via-[#4F46E5] to-[#2563EB] px-5 text-[14.5px] font-extrabold text-white shadow-[0_10px_28px_rgba(99,51,255,0.45)] ring-1 ring-inset ring-white/20 transition-all hover:brightness-110 active:scale-[0.985] disabled:opacity-70 cursor-pointer"
                >
                  {busy ? (
                    <>
                      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                      <span>Verifying Existing Wallet...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="size-4" aria-hidden="true" />
                      <span>I Accept</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  data-testid="wallet-notice-telegram-btn"
                  disabled={busy}
                  onClick={onSwitchToTelegram}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-white/[0.06] px-4 text-[13.5px] font-bold text-[#E5E1FF] ring-1 ring-inset ring-white/15 transition-colors hover:bg-white/[0.11] hover:text-white active:scale-[0.985] disabled:opacity-60 cursor-pointer"
                >
                  <Send className="size-3.5 text-[#38BDF8]" aria-hidden="true" />
                  <span>New here? Sign up with Telegram</span>
                </button>

                <button
                  type="button"
                  disabled={busy}
                  onClick={onClose}
                  className="mt-0.5 flex h-9 w-full items-center justify-center gap-1.5 rounded-full text-[12.5px] font-semibold text-[#9C97BA] transition-colors hover:text-white disabled:opacity-50 cursor-pointer"
                >
                  <Wallet className="size-3.5 opacity-75" aria-hidden="true" />
                  <span>Cancel</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
