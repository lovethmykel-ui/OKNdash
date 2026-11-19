/**
 * app/global-error.tsx — last-resort error boundary.
 *
 * This replaces the root layout entirely when it fails to render. It MUST
 * include <html> and <body> tags because it replaces the root layout.
 * Logs the error to the server for observability.
 */
'use client';

import { useCallback, useEffect } from 'react';

const CHUNK_RETRY_KEY = 'okn_global_chunk_retry_ts';
const CHUNK_RETRY_COOLDOWN_MS = 10_000;

export default function GlobalError({
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
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '2rem',
            textAlign: 'center',
          }}
        >
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Something went wrong</h1>
          <p style={{ color: '#666', marginBottom: '1.5rem' }}>
            An unexpected error occurred. Please reload to continue.
          </p>
          <button
            type="button"
            onClick={handleRetry}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '12px',
              border: 'none',
              background: '#7A12F5',
              color: 'white',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
