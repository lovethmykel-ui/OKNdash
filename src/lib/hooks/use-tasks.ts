/**
 * lib/hooks/use-tasks.ts — Phase 5
 * TanStack Query hooks for the task system.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { useHydrated } from './use-hydrated';

export function useTasks() {
  const hydrated = useHydrated();
  const query = useQuery({
    queryKey: ['tasks'],
    queryFn: api.getTasks,
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

export function useCompleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, proofData }: { taskId: string; proofData?: Record<string, unknown> }) =>
      api.completeTask(taskId, proofData),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
