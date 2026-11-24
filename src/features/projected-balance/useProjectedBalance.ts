import * as React from 'react';
import { useSearchParams } from '@/lib/router-compat';
import { useLocationsQuery, usePabShardQuery, useSkusQuery } from '@/data/queries';
import type { Location, Sku } from '@/data/schemas';
import { projectBalance, type ProjectBalanceResult } from '@/domain/pab';
import { QUERY_PARAM_KEYS } from '@/lib/constants';

export interface ProjectedBalanceState {
  isLoading: boolean;
  error: Error | null;
  refetchAll: () => void;
  skus: Sku[];
  locations: Location[];
  selectedSkuId: string;
  selectedLocationId: string;
  setSelectedSkuId: (skuId: string) => void;
  setSelectedLocationId: (locationId: string) => void;
  projection: ProjectBalanceResult;
}

/**
 * Manages URL-synced SKU/location selection and loads sharded weekly PAB data for one SKU-location pair.
 */
export function useProjectedBalance(): ProjectedBalanceState {
  const skusQuery = useSkusQuery();
  const locationsQuery = useLocationsQuery();
  const [searchParams, setSearchParams] = useSearchParams();

  const skus = skusQuery.data ?? [];
  const locations = locationsQuery.data ?? [];

  const paramSku = searchParams.get(QUERY_PARAM_KEYS.SKU);
  const paramLocation = searchParams.get(QUERY_PARAM_KEYS.LOCATION);

  const selectedSkuId = skus.find((s) => s.sku_id === paramSku)?.sku_id ?? skus[0]?.sku_id ?? '';
  const selectedLocationId =
    locations.find((l) => l.location_id === paramLocation)?.location_id ??
    locations[0]?.location_id ??
    '';

  const shardQuery = usePabShardQuery(selectedSkuId, selectedLocationId);

  const setSelectedSkuId = React.useCallback(
    (skuId: string) => {
      const next = new URLSearchParams(searchParams);
      next.set(QUERY_PARAM_KEYS.SKU, skuId);
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const setSelectedLocationId = React.useCallback(
    (locationId: string) => {
      const next = new URLSearchParams(searchParams);
      next.set(QUERY_PARAM_KEYS.LOCATION, locationId);
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const projection = React.useMemo(() => {
    if (!selectedSkuId || !selectedLocationId || !shardQuery.data) {
      return { rows: [], reconciliationErrors: [] };
    }
    return projectBalance(shardQuery.data.pab_weekly);
  }, [shardQuery.data, selectedSkuId, selectedLocationId]);

  const refetchAll = React.useCallback(() => {
    void skusQuery.refetch();
    void locationsQuery.refetch();
    void shardQuery.refetch();
  }, [skusQuery, locationsQuery, shardQuery]);

  return {
    isLoading: skusQuery.isLoading || locationsQuery.isLoading || shardQuery.isLoading,
    error: skusQuery.error ?? locationsQuery.error ?? shardQuery.error ?? null,
    refetchAll,
    skus,
    locations,
    selectedSkuId,
    selectedLocationId,
    setSelectedSkuId,
    setSelectedLocationId,
    projection,
  };
}
