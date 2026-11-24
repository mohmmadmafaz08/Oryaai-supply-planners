import * as React from 'react';
import {
  useLeadTimesQuery,
  usePurchaseOrdersQuery,
  useSupplierCapacityQuery,
  useSuppliersQuery,
} from '@/data/queries';
import { computeSupplierSummaries, type SupplierSummaryRow } from '@/domain/supply';

export interface SuppliersDataState {
  isLoading: boolean;
  error: Error | null;
  refetchAll: () => void;
  summaries: SupplierSummaryRow[];
}

/**
 * Loads supplier master data, POs, capacity contracts, and lead times to compute
 * weekly utilisation, MOQ ranges, and constrained/over-capacity flags.
 */
export function useSuppliersData(): SuppliersDataState {
  const suppliersQuery = useSuppliersQuery();
  const posQuery = usePurchaseOrdersQuery();
  const capQuery = useSupplierCapacityQuery();
  const ltQuery = useLeadTimesQuery();

  const summaries = React.useMemo(() => {
    const raw = computeSupplierSummaries(
      suppliersQuery.data ?? [],
      posQuery.data ?? [],
      capQuery.data ?? [],
      ltQuery.data ?? [],
    );
    return [...raw].sort((a, b) => b.utilisationRatio - a.utilisationRatio);
  }, [suppliersQuery.data, posQuery.data, capQuery.data, ltQuery.data]);

  const refetchAll = React.useCallback(() => {
    void suppliersQuery.refetch();
    void posQuery.refetch();
    void capQuery.refetch();
    void ltQuery.refetch();
  }, [suppliersQuery, posQuery, capQuery, ltQuery]);

  return {
    isLoading:
      suppliersQuery.isLoading || posQuery.isLoading || capQuery.isLoading || ltQuery.isLoading,
    error: suppliersQuery.error ?? posQuery.error ?? capQuery.error ?? ltQuery.error ?? null,
    refetchAll,
    summaries,
  };
}
