'use client';

import { useEffect, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { AlertCircle, ArrowRight, Loader2, X } from 'lucide-react';
import { useHydrated } from '@/lib/hooks/use-hydrated';

interface WalletNoticeModalProps {
  open: boolean;
  busy: boolean;
  onClose: () => void;
  onAcceptWalletSignIn: () => void;
  onSwitchToTelegram: () => void;
}

/**
 * WalletNoticeModal — Precision confirmation dialog displayed whenever a user
 * chooses "Connect Wallet", enforcing the existing-accounts-only policy with
 * an explicit "I Accept" confirmation step.
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

    const focusTimer = window.setTimeout(() => {
      acceptBtnRef.current?.focus();
    }, 30);

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
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-6"
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
            transition={{ duration: 0.16 }}
            onClick={() => {
              if (!busy) onClose();
            }}
            className="absolute inset-0 bg-[#07060C]/62"
          />

          {/* Clean Single-Elevation Confirmation Sheet */}
          <motion.div
            initial={animateLive ? { opacity: 0, scale: 0.97, y: 10 } : undefined}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={animateLive ? { opacity: 0, scale: 0.98, y: 6 } : undefined}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-[448px] overflow-hidden rounded-[20px] bg-white dark:bg-[#13111C] text-[#110F1B] dark:text-[#F5F4FA] ring-1 ring-black/[0.08] dark:ring-white/[0.1] shadow-[0_28px_72px_-16px_rgba(7,5,18,0.42)]"
          >
            {/* Dialog Header */}
            <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-3">
              <div>
                <div className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#B45309] dark:text-[#F59E0B]">
                  <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
                  <span>Existing accounts only</span>
                </div>
                <h2
                  id="wallet-notice-title"
                  className="mt-1.5 text-[19px] font-bold tracking-[-0.02em] leading-snug text-[#0E0D15] dark:text-white"
                >
                  Continue with Wallet Connect
                </h2>
              </div>

              <button
                type="button"
                onClick={onClose}
                disabled={busy}
                aria-label="Close wallet sign-in notice"
                className="flex size-8 shrink-0 items-center justify-center rounded-[10px] text-[#777389] dark:text-[#9893AD] transition-colors hover:bg-black/[0.05] hover:text-[#110F1B] dark:hover:bg-white/[0.08] dark:hover:text-white disabled:opacity-50 cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Editorial Policy Copy — Clean Whitespace, Zero Nested Boxes */}
            <div className="px-6 pb-6">
              <p
                id="wallet-notice-description"
                className="text-[14px] leading-[1.65] text-[#464357] dark:text-[#C5C1D6]"
              >
                Wallet sign-in is for{' '}
                <strong className="font-semibold text-[#110F1B] dark:text-white">
                  existing accounts only
                </strong>{' '}
                - wallet account creation is deprecated. New here? Sign up with
                Telegram below. Already have a wallet account? Sign in, then{' '}
                <strong className="font-semibold text-[#110F1B] dark:text-white">
                  bind your Telegram in Settings → Profile
                </strong>{' '}
                to keep permanent access.
              </p>
            </div>

            {/* Structured Action Footer */}
            <div className="border-t border-[#EFEDF5] dark:border-white/[0.08] bg-[#FAF9FC] dark:bg-[#0E0C16] px-6 py-4">
              <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5">
                <button
                  type="button"
                  disabled={busy}
                  onClick={onClose}
                  className="inline-flex h-11 sm:h-10 items-center justify-center rounded-[11px] bg-white dark:bg-white/[0.05] px-4 text-[13.5px] font-semibold text-[#48455A] dark:text-[#BEB9D1] ring-1 ring-inset ring-black/[0.09] dark:ring-white/[0.11] transition-colors hover:bg-[#F3F2F8] dark:hover:bg-white/[0.09] disabled:opacity-50 cursor-pointer whitespace-nowrap"
                >
                  Cancel
                </button>

                <button
                  ref={acceptBtnRef}
                  type="button"
                  data-testid="wallet-notice-accept-btn"
                  disabled={busy}
                  onClick={onAcceptWalletSignIn}
                  className="inline-flex h-11 sm:h-10 items-center justify-center gap-2 rounded-[11px] bg-[#7A12F5] px-5 text-[13.5px] font-semibold text-white shadow-[0_1px_2px_rgba(12,10,24,0.16),inset_0_1px_0_rgba(255,255,255,0.2)] transition-all hover:bg-[#690EDD] active:scale-[0.985] disabled:opacity-70 cursor-pointer whitespace-nowrap"
                >
                  {busy ? (
                    <>
                      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <span>I Accept</span>
                  )}
                </button>
              </div>

              {/* Quiet New-User Switch Row */}
              <div className="mt-4 flex items-center justify-between gap-3 border-t border-black/[0.06] dark:border-white/[0.07] pt-3.5 text-[12.5px]">
                <span className="text-[#6F6B80] dark:text-[#918CA6]">
                  New to OKN?
                </span>
                <button
                  type="button"
                  data-testid="wallet-notice-telegram-btn"
                  disabled={busy}
                  onClick={onSwitchToTelegram}
                  className="inline-flex items-center gap-1 font-semibold text-[#7A12F5] dark:text-[#C084FC] transition-colors hover:text-[#620CC9] dark:hover:text-[#D8B4FE] disabled:opacity-50 cursor-pointer whitespace-nowrap"
                >
                  <span>Sign up with Telegram</span>
                  <ArrowRight className="size-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
