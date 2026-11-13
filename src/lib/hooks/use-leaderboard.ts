/**
 * lib/hooks/use-leaderboard.ts — Phase 4 leaderboard queries.
 *
 * useLeaderboard: live ranking for a (category, period) including the viewer's
 *   own rank. queryKey embeds both so switching tabs refetches.
 * useLeaderboardWinners: past snapshot winners, optionally filtered.
 */
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { useHydrated } from './use-hydrated';
import type { LeaderboardCategory, LeaderboardPeriod } from '@okn/shared';

export function useLeaderboard(
  category: LeaderboardCategory,
  period: LeaderboardPeriod,
  limit = 50,
) {
  const hydrated = useHydrated();
  const query = useQuery({
    queryKey: ['leaderboard', category, period, limit],
    queryFn: () => api.getLeaderboard({ category, period, limit }),
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

export function useLeaderboardWinners(
  params: { period?: LeaderboardPeriod; category?: LeaderboardCategory; limit?: number } = {},
) {
  const hydrated = useHydrated();
  const query = useQuery({
    queryKey: ['leaderboard', 'winners', params.period ?? 'all', params.category ?? 'all', params.limit ?? 50],
    queryFn: () => api.getLeaderboardWinners(params),
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
