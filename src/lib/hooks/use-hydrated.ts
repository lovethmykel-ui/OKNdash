'use client';

import { useSyncExternalStore } from 'react';

const emptySubscribe = () => () => {};

/**
 * Returns `false` on SSR and throughout the entire React client hydration pass
 * (even across suspended boundaries or slow devices), then switches to `true`
 * synchronously once hydration commits.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}
