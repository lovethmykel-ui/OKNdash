/**
 * lib/hooks/use-referral.ts — referral link + stats for the current user.
 */
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { useHydrated } from './use-hydrated';

export function useReferral() {
  const hydrated = useHydrated();
  const query = useQuery({
    queryKey: ['referral'],
    queryFn: api.getReferralInfo,
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
