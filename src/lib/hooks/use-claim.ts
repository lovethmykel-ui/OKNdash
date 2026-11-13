/**
 * lib/hooks/use-claim.ts — Phase 5.10
 */
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { useHydrated } from './use-hydrated';

export function useClaimEligibility() {
  const hydrated = useHydrated();
  const query = useQuery({
    queryKey: ['claim-eligibility'],
    queryFn: api.getClaimEligibility,
    enabled: hydrated,
  });
  if (!hydrated) {
    return {
      ...query,
      data: undefined,
      isLoading: true,
      isPending: true,
      isError: false,
      error: null,
    } as typeof query;
  }
  return query;
}

export function useClaimProof(rootVersion: number | null) {
  const hydrated = useHydrated();
  const query = useQuery({
    queryKey: ['claim-proof', rootVersion],
    queryFn: () => {
      if (rootVersion == null) throw new Error('No root version');
      return api.getClaimProof(rootVersion);
    },
    enabled: hydrated && rootVersion != null,
  });
  if (!hydrated) {
    return {
      ...query,
      data: undefined,
      isLoading: rootVersion != null,
      isPending: true,
      isError: false,
      error: null,
    } as typeof query;
  }
  return query;
}
