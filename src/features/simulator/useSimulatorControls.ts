import * as React from 'react';
import { useSearchParams } from '@/lib/router-compat';
import {
  useLocationsQuery,
  useMitigationsQuery,
  usePabShardQuery,
  useShortagesQuery,
  useSkusQuery,
  useSupplierCapacityQuery,
  useSuppliersQuery,
} from '@/data/queries';
import type { Location, Mitigation, Sku } from '@/data/schemas';
import {
  simulate,
  type SimulationAdjustments,
  type SimulationOutcome,
} from '@/domain/simulate';
import { QUERY_PARAM_KEYS, SIMULATION_BOUNDS, SIMULATION_DEFAULTS } from '@/lib/constants';

function parseBoundedFloat(raw: string | null, fallback: number, min: number, max: number): number {
  if (!raw) return fallback;
  const parsed = Number.parseFloat(raw);
  if (Number.isNaN(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

export interface SimulatorState {
  isLoading: boolean;
  error: Error | null;
  refetchAll: () => void;
  skus: Sku[];
  locations: Location[];
  selectedSkuId: string;
  selectedLocationId: string;
  adjustments: SimulationAdjustments;
  availableMitigations: Mitigation[];
  selectedMitigationId: string | null;
  outcome: SimulationOutcome;
  setSelectedSkuId: (skuId: string) => void;
  setSelectedLocationId: (locationId: string) => void;
  setSelectedMitigationId: (mitigationId: string | null) => void;
  updateAdjustment: <K extends keyof SimulationAdjustments>(
    key: K,
    value: SimulationAdjustments[K],
  ) => void;
  resetAll: () => void;
}

/**
 * Synchronizes Simulator SKU/location scope, parameter sliders, and optional mitigation
 * selection with URL query params using sharded PAB data and supplier capacity clipping.
 */
export function useSimulatorControls(): SimulatorState {
  const skusQuery = useSkusQuery();
  const locationsQuery = useLocationsQuery();
  const shortagesQuery = useShortagesQuery();
  const mitigationsQuery = useMitigationsQuery();
  const suppliersQuery = useSuppliersQuery();
  const capacityQuery = useSupplierCapacityQuery();
  const [searchParams, setSearchParams] = useSearchParams();

  const skus = skusQuery.data ?? [];
  const locations = locationsQuery.data ?? [];

  const paramSku = searchParams.get(QUERY_PARAM_KEYS.SKU);
  const paramLoc = searchParams.get(QUERY_PARAM_KEYS.LOCATION);

  const selectedSkuId = skus.find((s) => s.sku_id === paramSku)?.sku_id ?? skus[0]?.sku_id ?? '';
  const selectedLocationId =
    locations.find((l) => l.location_id === paramLoc)?.location_id ??
    locations[0]?.location_id ??
    '';

  const shardQuery = usePabShardQuery(selectedSkuId, selectedLocationId);

  const adjustments: SimulationAdjustments = React.useMemo(
    () => ({
      demandMultiplier: parseBoundedFloat(
        searchParams.get(QUERY_PARAM_KEYS.DEMAND_MULT),
        SIMULATION_DEFAULTS.demandMultiplier,
        SIMULATION_BOUNDS.demandMultiplier.min,
        SIMULATION_BOUNDS.demandMultiplier.max,
      ),
      inboundDelayWeeks: Math.round(
        parseBoundedFloat(
          searchParams.get(QUERY_PARAM_KEYS.DELAY_WEEKS),
          SIMULATION_DEFAULTS.inboundDelayWeeks,
          SIMULATION_BOUNDS.inboundDelayWeeks.min,
          SIMULATION_BOUNDS.inboundDelayWeeks.max,
        ),
      ),
      supplierCapacityMultiplier: parseBoundedFloat(
        searchParams.get(QUERY_PARAM_KEYS.CAPACITY_MULT),
        SIMULATION_DEFAULTS.supplierCapacityMultiplier,
        SIMULATION_BOUNDS.supplierCapacityMultiplier.min,
        SIMULATION_BOUNDS.supplierCapacityMultiplier.max,
      ),
      onHandDelta: Math.round(
        parseBoundedFloat(
          searchParams.get(QUERY_PARAM_KEYS.ON_HAND_DELTA),
          SIMULATION_DEFAULTS.onHandDelta,
          SIMULATION_BOUNDS.onHandDelta.min,
          SIMULATION_BOUNDS.onHandDelta.max,
        ),
      ),
    }),
    [searchParams],
  );

  const pairShortages = React.useMemo(() => {
    return (shortagesQuery.data ?? []).filter(
      (s) => s.sku_id === selectedSkuId && s.location_id === selectedLocationId,
    );
  }, [shortagesQuery.data, selectedSkuId, selectedLocationId]);

  const availableMitigations = React.useMemo(() => {
    const shortageIds = new Set(pairShortages.map((s) => s.shortage_id));
    return (mitigationsQuery.data ?? []).filter(
      (m) => m.policy_compliant && shortageIds.has(m.shortage_id),
    );
  }, [mitigationsQuery.data, pairShortages]);

  const paramMitigation = searchParams.get(QUERY_PARAM_KEYS.MITIGATION_ID);
  const selectedMitigation =
    availableMitigations.find((m) => m.mitigation_id === paramMitigation) ?? null;

  const capacityPerWeek = React.useMemo(() => {
    const capRow = (capacityQuery.data ?? []).find((c) => c.sku_id === selectedSkuId);
    if (capRow) return capRow.capacity_per_week;
    const primarySupplierId = pairShortages[0]?.source_refs.supplier_id;
    if (!primarySupplierId) return null;
    return (
      (suppliersQuery.data ?? []).find((s) => s.supplier_id === primarySupplierId)
        ?.capacity_per_week ?? null
    );
  }, [capacityQuery.data, pairShortages, selectedSkuId, suppliersQuery.data]);

  const updateParams = React.useCallback(
    (mutate: (next: URLSearchParams) => void) => {
      const next = new URLSearchParams(searchParams);
      mutate(next);
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const setSelectedSkuId = React.useCallback(
    (skuId: string) => {
      updateParams((next) => {
        next.set(QUERY_PARAM_KEYS.SKU, skuId);
        next.delete(QUERY_PARAM_KEYS.MITIGATION_ID);
      });
    },
    [updateParams],
  );

  const setSelectedLocationId = React.useCallback(
    (locationId: string) => {
      updateParams((next) => {
        next.set(QUERY_PARAM_KEYS.LOCATION, locationId);
        next.delete(QUERY_PARAM_KEYS.MITIGATION_ID);
      });
    },
    [updateParams],
  );

  const setSelectedMitigationId = React.useCallback(
    (mitigationId: string | null) => {
      updateParams((next) => {
        if (mitigationId) {
          next.set(QUERY_PARAM_KEYS.MITIGATION_ID, mitigationId);
        } else {
          next.delete(QUERY_PARAM_KEYS.MITIGATION_ID);
        }
      });
    },
    [updateParams],
  );

  const updateAdjustment = React.useCallback(
    <K extends keyof SimulationAdjustments>(key: K, value: SimulationAdjustments[K]) => {
      const keyMap: Record<keyof SimulationAdjustments, string> = {
        demandMultiplier: QUERY_PARAM_KEYS.DEMAND_MULT,
        inboundDelayWeeks: QUERY_PARAM_KEYS.DELAY_WEEKS,
        supplierCapacityMultiplier: QUERY_PARAM_KEYS.CAPACITY_MULT,
        onHandDelta: QUERY_PARAM_KEYS.ON_HAND_DELTA,
      };
      updateParams((next) => {
        const paramKey = keyMap[key];
        if (value === SIMULATION_DEFAULTS[key]) {
          next.delete(paramKey);
        } else {
          next.set(paramKey, String(value));
        }
      });
    },
    [updateParams],
  );

  const resetAll = React.useCallback(() => {
    updateParams((next) => {
      next.delete(QUERY_PARAM_KEYS.DEMAND_MULT);
      next.delete(QUERY_PARAM_KEYS.DELAY_WEEKS);
      next.delete(QUERY_PARAM_KEYS.CAPACITY_MULT);
      next.delete(QUERY_PARAM_KEYS.ON_HAND_DELTA);
      next.delete(QUERY_PARAM_KEYS.MITIGATION_ID);
    });
  }, [updateParams]);

  const outcome = React.useMemo(() => {
    const pabRows = shardQuery.data?.pab_weekly ?? [];
    if (!selectedSkuId || !selectedLocationId || pabRows.length === 0) {
      return simulate([], adjustments);
    }
    const mitigationTargetShortage = selectedMitigation
      ? pairShortages.find((s) => s.shortage_id === selectedMitigation.shortage_id)
      : undefined;
    return simulate(pabRows, adjustments, {
      capacityPerWeek,
      mitigation: selectedMitigation,
      mitigationWeek: mitigationTargetShortage?.week ?? null,
    });
  }, [
    shardQuery.data,
    selectedSkuId,
    selectedLocationId,
    adjustments,
    capacityPerWeek,
    selectedMitigation,
    pairShortages,
  ]);

  const refetchAll = React.useCallback(() => {
    void skusQuery.refetch();
    void locationsQuery.refetch();
    void shardQuery.refetch();
    void shortagesQuery.refetch();
    void mitigationsQuery.refetch();
    void suppliersQuery.refetch();
    void capacityQuery.refetch();
  }, [
    skusQuery,
    locationsQuery,
    shardQuery,
    shortagesQuery,
    mitigationsQuery,
    suppliersQuery,
    capacityQuery,
  ]);

  return {
    isLoading:
      skusQuery.isLoading ||
      locationsQuery.isLoading ||
      shardQuery.isLoading ||
      shortagesQuery.isLoading ||
      mitigationsQuery.isLoading,
    error:
      skusQuery.error ??
      locationsQuery.error ??
      shardQuery.error ??
      shortagesQuery.error ??
      mitigationsQuery.error ??
      null,
    refetchAll,
    skus,
    locations,
    selectedSkuId,
    selectedLocationId,
    adjustments,
    availableMitigations,
    selectedMitigationId: selectedMitigation?.mitigation_id ?? null,
    outcome,
    setSelectedSkuId,
    setSelectedLocationId,
    setSelectedMitigationId,
    updateAdjustment,
    resetAll,
  };
}
