/**
 * lib/hooks/use-portfolio.ts — Phase 3 portfolio aggregation for the current user.
 */
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { useHydrated } from './use-hydrated';

export function usePortfolio() {
  const hydrated = useHydrated();
  const query = useQuery({
    queryKey: ['portfolio'],
    queryFn: api.getPortfolio,
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
