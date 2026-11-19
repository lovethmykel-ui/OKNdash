/**
 * app/error.tsx — root error boundary for the public site.
 *
 * Catches render errors in any route under the root layout EXCEPT the root
 * layout itself (that's global-error.tsx). Logs the error to the server.
 */
'use client';

import { useCallback, useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

const CHUNK_RETRY_KEY = 'okn_chunk_retry_ts';
const CHUNK_RETRY_COOLDOWN_MS = 10_000;

export default function Error({
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
      className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-6 py-16 text-center"
    >
      <div className="flex size-14 items-center justify-center rounded-2xl border border-[#EF4444]/30 bg-[#EF4444]/12 text-[#EF4444]">
        <AlertTriangle className="size-7" />
      </div>
      <h2 className="text-xl font-extrabold tracking-tight text-foreground">
        Something went wrong
      </h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        We hit an unexpected error while loading this page. Your account data is safe.
      </p>
      <div className="mt-2 flex items-center gap-3">
        <button
          type="button"
          onClick={handleRetry}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#7A12F5] px-5 text-sm font-extrabold text-white shadow-sm hover:bg-[#8C38F7] transition-all cursor-pointer"
        >
          <RefreshCw className="size-4" />
          <span>Try again</span>
        </button>
        <Link
          href="/app/portfolio"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-bold text-foreground hover:bg-muted transition-colors"
        >
          <Home className="size-4" />
          <span>Go home</span>
        </Link>
      </div>
    </div>
  );
}
