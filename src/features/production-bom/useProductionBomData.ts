import * as React from 'react';
import { useSearchParams } from '@/lib/router-compat';
import {
  useBomQuery,
  useInventoryQuery,
  useLocationsQuery,
  usePabWeeklyQuery,
  useProductionPlansQuery,
  useSkusQuery,
  useSkuSubstitutesQuery,
} from '@/data/queries';
import type { Location, ProductionPlan, Sku, SkuSubstitute } from '@/data/schemas';
import { analyzeBomAvailability, type BomComponentAvailability } from '@/domain/supply';
import { QUERY_PARAM_KEYS } from '@/lib/constants';

export interface ProductionBomState {
  isLoading: boolean;
  error: Error | null;
  refetchAll: () => void;
  parentSkus: Sku[];
  locations: Location[];
  selectedParentSkuId: string;
  selectedLocationId: string;
  setSelectedParentSkuId: (skuId: string) => void;
  setSelectedLocationId: (locationId: string) => void;
  plans: ProductionPlan[];
  bomComponents: BomComponentAvailability[];
  substitutes: SkuSubstitute[];
  skuDescById: Map<string, string>;
}

/**
 * Loads production plans, BOM structures, inventory, PAB, and substitute relationships
 * for the Production & BOM screen.
 */
export function useProductionBomData(): ProductionBomState {
  const skusQuery = useSkusQuery();
  const locationsQuery = useLocationsQuery();
  const bomQuery = useBomQuery();
  const plansQuery = useProductionPlansQuery();
  const invQuery = useInventoryQuery();
  const pabQuery = usePabWeeklyQuery();
  const subsQuery = useSkuSubstitutesQuery();
  const [searchParams, setSearchParams] = useSearchParams();

  const skus = React.useMemo(() => skusQuery.data ?? [], [skusQuery.data]);
  const locations = React.useMemo(() => locationsQuery.data ?? [], [locationsQuery.data]);
  const bomItems = React.useMemo(() => bomQuery.data ?? [], [bomQuery.data]);

  const skuDescById = React.useMemo(
    () => new Map(skus.map((s) => [s.sku_id, s.description])),
    [skus],
  );

  const parentSkus = React.useMemo(() => {
    const parentIds = new Set(bomItems.map((b) => b.parent_sku_id));
    return skus.filter((s) => parentIds.has(s.sku_id));
  }, [bomItems, skus]);

  const paramParent = searchParams.get(QUERY_PARAM_KEYS.PARENT_SKU);
  const selectedParentSkuId =
    parentSkus.find((s) => s.sku_id === paramParent)?.sku_id ?? parentSkus[0]?.sku_id ?? '';

  const paramLocation = searchParams.get(QUERY_PARAM_KEYS.LOCATION);
  const selectedLocationId =
    paramLocation && locations.some((l) => l.location_id === paramLocation) ? paramLocation : 'ALL';

  const plans = React.useMemo(() => {
    return (plansQuery.data ?? [])
      .filter(
        (p) =>
          p.sku_id === selectedParentSkuId &&
          (selectedLocationId === 'ALL' || p.location_id === selectedLocationId),
      )
      .sort((a, b) => a.week - b.week);
  }, [plansQuery.data, selectedParentSkuId, selectedLocationId]);

  const bomComponents = React.useMemo(() => {
    if (!selectedParentSkuId) return [];
    return analyzeBomAvailability(
      selectedParentSkuId,
      selectedLocationId === 'ALL' ? null : selectedLocationId,
      bomItems,
      skus,
      invQuery.data ?? [],
      pabQuery.data ?? [],
    );
  }, [selectedParentSkuId, selectedLocationId, bomItems, skus, invQuery.data, pabQuery.data]);

  const setSelectedParentSkuId = React.useCallback(
    (skuId: string) => {
      const next = new URLSearchParams(searchParams);
      next.set(QUERY_PARAM_KEYS.PARENT_SKU, skuId);
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const setSelectedLocationId = React.useCallback(
    (locationId: string) => {
      const next = new URLSearchParams(searchParams);
      if (locationId === 'ALL') next.delete(QUERY_PARAM_KEYS.LOCATION);
      else next.set(QUERY_PARAM_KEYS.LOCATION, locationId);
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const refetchAll = React.useCallback(() => {
    void skusQuery.refetch();
    void locationsQuery.refetch();
    void bomQuery.refetch();
    void plansQuery.refetch();
    void invQuery.refetch();
    void pabQuery.refetch();
    void subsQuery.refetch();
  }, [skusQuery, locationsQuery, bomQuery, plansQuery, invQuery, pabQuery, subsQuery]);

  return {
    isLoading:
      skusQuery.isLoading ||
      locationsQuery.isLoading ||
      bomQuery.isLoading ||
      plansQuery.isLoading ||
      invQuery.isLoading ||
      pabQuery.isLoading ||
      subsQuery.isLoading,
    error:
      skusQuery.error ??
      locationsQuery.error ??
      bomQuery.error ??
      plansQuery.error ??
      invQuery.error ??
      pabQuery.error ??
      subsQuery.error ??
      null,
    refetchAll,
    parentSkus,
    locations,
    selectedParentSkuId,
    selectedLocationId,
    setSelectedParentSkuId,
    setSelectedLocationId,
    plans,
    bomComponents,
    substitutes: subsQuery.data ?? [],
    skuDescById,
  };
}
