import * as React from 'react';
import { useSearchParams } from '@/lib/router-compat';
import {
  useMitigationsQuery,
  usePabWeeklyQuery,
  usePurchaseOrdersQuery,
  useShortagesQuery,
  useSuppliersQuery,
} from '@/data/queries';
import type { Mitigation, Shortage } from '@/data/schemas';
import {
  computeCommandCenterMetrics,
  rankShortages,
  type CommandCenterMetrics,
} from '@/domain/shortage';
import { QUERY_PARAM_KEYS, TOP_SHORTAGES_LIMIT } from '@/lib/constants';

export interface CommandCenterState {
  isLoading: boolean;
  error: Error | null;
  refetchAll: () => void;
  metrics: CommandCenterMetrics;
  topShortages: Shortage[];
  mitigations: Mitigation[];
  selectedShortage: Shortage | null;
  setSelectedShortageId: (shortageId: string | null) => void;
  isEmpty: boolean;
}

/**
 * Loads and derives Command Center KPIs, chart distributions, top priority shortages,
 * and URL-synced Shortage Detail Drawer selection.
 */
export function useCommandCenterData(): CommandCenterState {
  const shortagesQuery = useShortagesQuery();
  const pabQuery = usePabWeeklyQuery();
  const suppliersQuery = useSuppliersQuery();
  const purchaseOrdersQuery = usePurchaseOrdersQuery();
  const mitigationsQuery = useMitigationsQuery();
  const [searchParams, setSearchParams] = useSearchParams();

  const isLoading =
    shortagesQuery.isLoading ||
    pabQuery.isLoading ||
    suppliersQuery.isLoading ||
    purchaseOrdersQuery.isLoading ||
    mitigationsQuery.isLoading;

  const error =
    shortagesQuery.error ??
    pabQuery.error ??
    suppliersQuery.error ??
    purchaseOrdersQuery.error ??
    mitigationsQuery.error ??
    null;

  const shortages = shortagesQuery.data;
  const pabRows = pabQuery.data;
  const suppliers = suppliersQuery.data;
  const purchaseOrders = purchaseOrdersQuery.data;
  const mitigations = React.useMemo(() => mitigationsQuery.data ?? [], [mitigationsQuery.data]);

  const metrics = React.useMemo(
    () =>
      computeCommandCenterMetrics(
        shortages ?? [],
        pabRows ?? [],
        suppliers ?? [],
        purchaseOrders ?? [],
        mitigations,
      ),
    [shortages, pabRows, suppliers, purchaseOrders, mitigations],
  );

  const topShortages = React.useMemo(
    () => rankShortages(shortages ?? []).slice(0, TOP_SHORTAGES_LIMIT),
    [shortages],
  );

  const selectedShortageId = searchParams.get(QUERY_PARAM_KEYS.SELECTED_SHORTAGE);

  const selectedShortage = React.useMemo(() => {
    if (!selectedShortageId || !shortages) {
      return null;
    }
    return shortages.find((item) => item.shortage_id === selectedShortageId) ?? null;
  }, [selectedShortageId, shortages]);

  const setSelectedShortageId = React.useCallback(
    (shortageId: string | null) => {
      const next = new URLSearchParams(searchParams);
      if (shortageId) {
        next.set(QUERY_PARAM_KEYS.SELECTED_SHORTAGE, shortageId);
      } else {
        next.delete(QUERY_PARAM_KEYS.SELECTED_SHORTAGE);
      }
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const refetchAll = React.useCallback(() => {
    void shortagesQuery.refetch();
    void pabQuery.refetch();
    void suppliersQuery.refetch();
    void purchaseOrdersQuery.refetch();
    void mitigationsQuery.refetch();
  }, [shortagesQuery, pabQuery, suppliersQuery, purchaseOrdersQuery, mitigationsQuery]);

  const isEmpty = !isLoading && !error && (shortages?.length ?? 0) === 0;

  return {
    isLoading,
    error,
    refetchAll,
    metrics,
    topShortages,
    mitigations,
    selectedShortage,
    setSelectedShortageId,
    isEmpty,
  };
}
