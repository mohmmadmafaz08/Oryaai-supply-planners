import * as React from 'react';
import { useSearchParams } from '@/lib/router-compat';
import { usePoEventsQuery, usePurchaseOrdersQuery, useSuppliersQuery } from '@/data/queries';
import type { PoEvent, PoStatus, PurchaseOrder, Supplier } from '@/data/schemas';
import { QUERY_PARAM_KEYS } from '@/lib/constants';

export interface PurchaseOrdersState {
  isLoading: boolean;
  error: Error | null;
  refetchAll: () => void;
  suppliers: Supplier[];
  filteredPos: PurchaseOrder[];
  statusFilter: PoStatus | 'ALL';
  supplierFilter: string;
  delayedOnly: boolean;
  pageIndex: number;
  selectedPo: PurchaseOrder | null;
  selectedPoEvents: PoEvent[];
  supplierNameById: Map<string, string>;
  setStatusFilter: (status: PoStatus | 'ALL') => void;
  setSupplierFilter: (supplierId: string) => void;
  setDelayedOnly: (delayed: boolean) => void;
  setPageIndex: (page: number) => void;
  setSelectedPoId: (poId: string | null) => void;
  resetFilters: () => void;
}

const VALID_PO_STATUSES = new Set<string>([
  'DRAFT',
  'CONFIRMED',
  'SHIPPED',
  'IN_TRANSIT',
  'DELAYED',
  'RECEIVED',
  'CANCELLED',
]);

function isPoStatus(val: string | null): val is PoStatus {
  return val !== null && VALID_PO_STATUSES.has(val);
}

/**
 * Manages URL-synced filters, pagination, and PO lifecycle drawer data for Purchase Orders.
 */
export function usePurchaseOrdersData(): PurchaseOrdersState {
  const poQuery = usePurchaseOrdersQuery();
  const eventsQuery = usePoEventsQuery();
  const suppliersQuery = useSuppliersQuery();
  const [searchParams, setSearchParams] = useSearchParams();

  const rawStatus = searchParams.get(QUERY_PARAM_KEYS.PO_STATUS);
  const statusFilter: PoStatus | 'ALL' = isPoStatus(rawStatus) ? rawStatus : 'ALL';
  const supplierFilter = searchParams.get(QUERY_PARAM_KEYS.SUPPLIER) ?? 'ALL';
  const delayedOnly = searchParams.get(QUERY_PARAM_KEYS.DELAYED_ONLY) === '1';
  const rawPage = Number.parseInt(searchParams.get(QUERY_PARAM_KEYS.PAGE) ?? '0', 10);
  const pageIndex = Number.isNaN(rawPage) || rawPage < 0 ? 0 : rawPage;
  const selectedPoId = searchParams.get(QUERY_PARAM_KEYS.SELECTED_PO);

  const suppliers = React.useMemo(() => suppliersQuery.data ?? [], [suppliersQuery.data]);
  const supplierNameById = React.useMemo(
    () => new Map(suppliers.map((s) => [s.supplier_id, s.name])),
    [suppliers],
  );

  const filteredPos = React.useMemo(() => {
    const all = poQuery.data ?? [];
    return all
      .filter((po) => {
        if (statusFilter !== 'ALL' && po.status !== statusFilter) return false;
        if (supplierFilter !== 'ALL' && po.supplier_id !== supplierFilter) return false;
        if (delayedOnly && po.status !== 'DELAYED' && po.transport_delay_days === 0) return false;
        return true;
      })
      .sort((a, b) => a.promised_date.localeCompare(b.promised_date));
  }, [poQuery.data, statusFilter, supplierFilter, delayedOnly]);

  const selectedPo = React.useMemo(() => {
    if (!selectedPoId || !poQuery.data) return null;
    return poQuery.data.find((po) => po.po_id === selectedPoId) ?? null;
  }, [selectedPoId, poQuery.data]);

  const selectedPoEvents = React.useMemo(() => {
    if (!selectedPo || !eventsQuery.data) return [];
    return eventsQuery.data
      .filter((e) => e.entity_id === selectedPo.po_id)
      .sort((a, b) => a.occurred_on.localeCompare(b.occurred_on));
  }, [selectedPo, eventsQuery.data]);

  const updateParams = React.useCallback(
    (mutate: (next: URLSearchParams) => void) => {
      const next = new URLSearchParams(searchParams);
      mutate(next);
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const setStatusFilter = React.useCallback(
    (status: PoStatus | 'ALL') => {
      updateParams((next) => {
        if (status === 'ALL') next.delete(QUERY_PARAM_KEYS.PO_STATUS);
        else next.set(QUERY_PARAM_KEYS.PO_STATUS, status);
        next.delete(QUERY_PARAM_KEYS.PAGE);
      });
    },
    [updateParams],
  );

  const setSupplierFilter = React.useCallback(
    (supplierId: string) => {
      updateParams((next) => {
        if (supplierId === 'ALL') next.delete(QUERY_PARAM_KEYS.SUPPLIER);
        else next.set(QUERY_PARAM_KEYS.SUPPLIER, supplierId);
        next.delete(QUERY_PARAM_KEYS.PAGE);
      });
    },
    [updateParams],
  );

  const setDelayedOnly = React.useCallback(
    (delayed: boolean) => {
      updateParams((next) => {
        if (delayed) next.set(QUERY_PARAM_KEYS.DELAYED_ONLY, '1');
        else next.delete(QUERY_PARAM_KEYS.DELAYED_ONLY);
        next.delete(QUERY_PARAM_KEYS.PAGE);
      });
    },
    [updateParams],
  );

  const setPageIndex = React.useCallback(
    (page: number) => {
      updateParams((next) => {
        if (page <= 0) next.delete(QUERY_PARAM_KEYS.PAGE);
        else next.set(QUERY_PARAM_KEYS.PAGE, String(page));
      });
    },
    [updateParams],
  );

  const setSelectedPoId = React.useCallback(
    (poId: string | null) => {
      updateParams((next) => {
        if (poId) next.set(QUERY_PARAM_KEYS.SELECTED_PO, poId);
        else next.delete(QUERY_PARAM_KEYS.SELECTED_PO);
      });
    },
    [updateParams],
  );

  const resetFilters = React.useCallback(() => {
    updateParams((next) => {
      next.delete(QUERY_PARAM_KEYS.PO_STATUS);
      next.delete(QUERY_PARAM_KEYS.SUPPLIER);
      next.delete(QUERY_PARAM_KEYS.DELAYED_ONLY);
      next.delete(QUERY_PARAM_KEYS.PAGE);
    });
  }, [updateParams]);

  const refetchAll = React.useCallback(() => {
    void poQuery.refetch();
    void eventsQuery.refetch();
    void suppliersQuery.refetch();
  }, [poQuery, eventsQuery, suppliersQuery]);

  return {
    isLoading: poQuery.isLoading || eventsQuery.isLoading || suppliersQuery.isLoading,
    error: poQuery.error ?? eventsQuery.error ?? suppliersQuery.error ?? null,
    refetchAll,
    suppliers,
    filteredPos,
    statusFilter,
    supplierFilter,
    delayedOnly,
    pageIndex,
    selectedPo,
    selectedPoEvents,
    supplierNameById,
    setStatusFilter,
    setSupplierFilter,
    setDelayedOnly,
    setPageIndex,
    setSelectedPoId,
    resetFilters,
  };
}
