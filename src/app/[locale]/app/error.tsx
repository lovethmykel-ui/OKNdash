/**
 * app/[locale]/app/error.tsx — dashboard error boundary.
 *
 * Catches render errors inside the /app dashboard tree. The layout (sidebar,
 * header) is preserved — only the page content area shows the error card.
 */
'use client';

import { useCallback, useEffect } from 'react';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { Link } from '@/i18n/navigation';

const CHUNK_RETRY_KEY = 'okn_app_chunk_retry_ts';
const CHUNK_RETRY_COOLDOWN_MS = 10_000;

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset?: () => void;
}) {
  const handleRetry = useCallback(() => {
    if (typeof reset === 'function') {
      reset();
      return;
    }
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }, [reset]);

  useEffect(() => {
    const isChunkError =
      error?.name === 'ChunkLoadError' ||
      error?.message?.includes('ChunkLoadError') ||
      error?.message?.includes('Loading chunk');
    if (!isChunkError) return;

    if (typeof window !== 'undefined') {
      try {
        const lastRetry = Number(window.sessionStorage.getItem(CHUNK_RETRY_KEY) ?? '0');
        const now = Date.now();
        if (!Number.isFinite(lastRetry) || now - lastRetry > CHUNK_RETRY_COOLDOWN_MS) {
          window.sessionStorage.setItem(CHUNK_RETRY_KEY, String(now));
          window.location.reload();
          return;
        }
      } catch {
        window.location.reload();
        return;
      }
    }

    if (typeof reset === 'function') {
      reset();
    }
  }, [error, reset]);

  return (
    <div
      role="alert"
      className="mx-auto my-10 flex max-w-md flex-col items-center justify-center gap-4 rounded-[28px] border border-[var(--line)] bg-[var(--s1)] p-7 text-center shadow-lg"
    >
      <div className="flex size-14 items-center justify-center rounded-2xl border border-[#EF4444]/30 bg-[#EF4444]/12 text-[#EF4444]">
        <AlertTriangle className="size-7" />
      </div>
      <div className="space-y-1.5">
        <h2 className="text-lg font-extrabold tracking-tight text-[var(--tx)]">
          Something went wrong
        </h2>
        <p className="text-xs sm:text-sm text-[var(--mut)] leading-relaxed">
          {error?.message || 'This page encountered an unexpected error. Your wallet and balances are safe.'}
        </p>
      </div>
      <div className="mt-1 flex flex-wrap items-center justify-center gap-2.5">
        <button
          type="button"
          onClick={handleRetry}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#7A12F5] px-5 text-xs sm:text-sm font-extrabold text-white shadow-sm hover:bg-[#8C38F7] active:scale-95 transition-all cursor-pointer"
        >
          <RefreshCw className="size-4" />
          <span>Try again</span>
        </button>
        <Link
          href="/app/portfolio"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--s2)] px-4 text-xs sm:text-sm font-bold text-[var(--tx)] hover:bg-[var(--line)]/50 transition-colors"
        >
          <Home className="size-4" />
          <span>Back to Portfolio</span>
        </Link>
      </div>
    </div>
  );
}
