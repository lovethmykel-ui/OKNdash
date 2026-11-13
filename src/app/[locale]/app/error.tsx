/**
 * app/[locale]/app/error.tsx — dashboard error boundary.
 *
 * Catches render errors inside the /app dashboard tree. The layout (sidebar,
 * header) is preserved — only the page content area shows the error card.
 */
'use client';

import { useEffect } from 'react';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { Link } from '@/i18n/navigation';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    const isChunkError =
      error?.name === 'ChunkLoadError' ||
      error?.message?.includes('ChunkLoadError') ||
      error?.message?.includes('Loading chunk');
    if (isChunkError) {
      if (typeof window !== 'undefined') {
        const key = 'okn_app_chunk_retry';
        if (!sessionStorage.getItem(key)) {
          sessionStorage.setItem(key, '1');
          window.location.reload();
          return;
        }
      }
      reset();
      return;
    }
    void fetch('/api/client-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: error.message,
        digest: error.digest,
        stack: error.stack,
        location: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
        area: 'app',
      }),
    }).catch(() => {});
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
          onClick={reset}
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
