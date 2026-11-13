/**
 * lib/hooks/use-sale.ts — sale config + purchase history.
 *
 * usePurchaseHistory merges the optimistic "indexing" rows (added by the buy
 * widget on receipt success) ahead of the fetched rows. mergePurchaseRows
 * de-duplicates by txHash, so once the indexer row with the same hash lands
 * the optimistic row disappears — the purchase never shows twice.
 */
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { useHydrated } from './use-hydrated';
import { mergePurchaseRows, type PurchaseHistoryRow } from '../buy-guard';
import { usePendingPurchases } from '../store/pending-purchases';

export function useSalePrice() {
  const hydrated = useHydrated();
  const query = useQuery({
    queryKey: ['sale-price'],
    queryFn: api.getSalePrice,
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

export function usePurchaseHistory() {
  const hydrated = useHydrated();
  const optimistic = usePendingPurchases((s) => s.rows);
  const query = useQuery({
    queryKey: ['purchase-history'],
    queryFn: api.getPurchaseHistory,
    enabled: hydrated,
    select: (fetched): PurchaseHistoryRow[] => mergePurchaseRows(optimistic, fetched),
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
