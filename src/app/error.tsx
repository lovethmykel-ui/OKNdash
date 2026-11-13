/**
 * app/error.tsx — root error boundary for the public site.
 *
 * Catches render errors in any route under the root layout EXCEPT the root
 * layout itself (that's global-error.tsx). Logs the error to the server.
 */
'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

export default function Error({
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
        const key = 'okn_chunk_retry';
        if (!sessionStorage.getItem(key)) {
          sessionStorage.setItem(key, '1');
          window.location.reload();
          return;
        }
      }
      reset();
      return;
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
          onClick={reset}
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
