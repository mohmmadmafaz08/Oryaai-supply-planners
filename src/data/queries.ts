import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type {
  BomItem,
  ForecastDemandRow,
  InventoryRow,
  LeadTimeRow,
  Location,
  Manifest,
  Mitigation,
  PabShard,
  PabShardIndexEntry,
  PabWeeklyRow,
  PoEvent,
  ProductionPlan,
  PurchaseOrder,
  ReproducibilityReport,
  Shortage,
  ShortageEvent,
  Sku,
  SkuSubstitute,
  Supplier,
  SupplierCapacityRow,
  ValidationReport,
} from './schemas';
import { getPlanningDataSource } from './source';
import { applyWorkflowOverrides } from './workflow';

export const DATA_QUERY_KEYS = {
  manifest: ['orbit', 'manifest'] as const,
  skus: ['orbit', 'skus'] as const,
  locations: ['orbit', 'locations'] as const,
  suppliers: ['orbit', 'suppliers'] as const,
  pabIndex: ['orbit', 'pab_index'] as const,
  pabShard: (skuId: string, locationId: string) =>
    ['orbit', 'pab_shard', skuId, locationId] as const,
  pabWeekly: ['orbit', 'pab_weekly'] as const,
  forecastDemand: ['orbit', 'forecast_demand'] as const,
  inventory: ['orbit', 'inventory'] as const,
  supplierCapacity: ['orbit', 'supplier_capacity'] as const,
  leadTimes: ['orbit', 'lead_times'] as const,
  purchaseOrders: ['orbit', 'purchase_orders'] as const,
  poEvents: ['orbit', 'po_events'] as const,
  shortages: ['orbit', 'shortages'] as const,
  shortageEvents: ['orbit', 'shortage_events'] as const,
  mitigations: ['orbit', 'mitigations'] as const,
  skuSubstitutes: ['orbit', 'sku_substitutes'] as const,
  productionPlans: ['orbit', 'production_plans'] as const,
  bom: ['orbit', 'bom'] as const,
  validationReport: ['orbit', 'validation_report'] as const,
  reproducibility: ['orbit', 'reproducibility'] as const,
} as const;

export function useManifestQuery(): UseQueryResult<Manifest> {
  return useQuery({
    queryKey: DATA_QUERY_KEYS.manifest,
    queryFn: () => getPlanningDataSource().getManifest(),
  });
}

export function useSkusQuery(): UseQueryResult<Sku[]> {
  return useQuery({
    queryKey: DATA_QUERY_KEYS.skus,
    queryFn: () => getPlanningDataSource().getSkus(),
  });
}

export function useLocationsQuery(): UseQueryResult<Location[]> {
  return useQuery({
    queryKey: DATA_QUERY_KEYS.locations,
    queryFn: () => getPlanningDataSource().getLocations(),
  });
}

export function useSuppliersQuery(): UseQueryResult<Supplier[]> {
  return useQuery({
    queryKey: DATA_QUERY_KEYS.suppliers,
    queryFn: () => getPlanningDataSource().getSuppliers(),
  });
}

export function usePabIndexQuery(): UseQueryResult<PabShardIndexEntry[]> {
  return useQuery({
    queryKey: DATA_QUERY_KEYS.pabIndex,
    queryFn: () => getPlanningDataSource().getPabIndex(),
  });
}

export function usePabShardQuery(skuId: string, locationId: string): UseQueryResult<PabShard> {
  return useQuery({
    queryKey: DATA_QUERY_KEYS.pabShard(skuId, locationId),
    queryFn: () => getPlanningDataSource().getPabShard(skuId, locationId),
    enabled: skuId.length > 0 && locationId.length > 0,
  });
}

export function usePabWeeklyQuery(): UseQueryResult<PabWeeklyRow[]> {
  return useQuery({
    queryKey: DATA_QUERY_KEYS.pabWeekly,
    queryFn: () => getPlanningDataSource().getPabWeekly(),
  });
}

export function useForecastDemandQuery(): UseQueryResult<ForecastDemandRow[]> {
  return useQuery({
    queryKey: DATA_QUERY_KEYS.forecastDemand,
    queryFn: () => getPlanningDataSource().getForecastDemand(),
  });
}

export function useInventoryQuery(): UseQueryResult<InventoryRow[]> {
  return useQuery({
    queryKey: DATA_QUERY_KEYS.inventory,
    queryFn: () => getPlanningDataSource().getInventory(),
  });
}

export function useSupplierCapacityQuery(): UseQueryResult<SupplierCapacityRow[]> {
  return useQuery({
    queryKey: DATA_QUERY_KEYS.supplierCapacity,
    queryFn: () => getPlanningDataSource().getSupplierCapacity(),
  });
}

export function useLeadTimesQuery(): UseQueryResult<LeadTimeRow[]> {
  return useQuery({
    queryKey: DATA_QUERY_KEYS.leadTimes,
    queryFn: () => getPlanningDataSource().getLeadTimes(),
  });
}

export function usePurchaseOrdersQuery(): UseQueryResult<PurchaseOrder[]> {
  return useQuery({
    queryKey: DATA_QUERY_KEYS.purchaseOrders,
    queryFn: () => getPlanningDataSource().getPurchaseOrders(),
  });
}

export function usePoEventsQuery(): UseQueryResult<PoEvent[]> {
  return useQuery({
    queryKey: DATA_QUERY_KEYS.poEvents,
    queryFn: () => getPlanningDataSource().getPoEvents(),
  });
}

export function useShortagesQuery(): UseQueryResult<Shortage[]> {
  return useQuery({
    queryKey: DATA_QUERY_KEYS.shortages,
    queryFn: async () => applyWorkflowOverrides(await getPlanningDataSource().getShortages()),
  });
}

export function useShortageEventsQuery(): UseQueryResult<ShortageEvent[]> {
  return useQuery({
    queryKey: DATA_QUERY_KEYS.shortageEvents,
    queryFn: () => getPlanningDataSource().getShortageEvents(),
  });
}

export function useMitigationsQuery(): UseQueryResult<Mitigation[]> {
  return useQuery({
    queryKey: DATA_QUERY_KEYS.mitigations,
    queryFn: () => getPlanningDataSource().getMitigations(),
  });
}

export function useSkuSubstitutesQuery(): UseQueryResult<SkuSubstitute[]> {
  return useQuery({
    queryKey: DATA_QUERY_KEYS.skuSubstitutes,
    queryFn: () => getPlanningDataSource().getSkuSubstitutes(),
  });
}

export function useProductionPlansQuery(): UseQueryResult<ProductionPlan[]> {
  return useQuery({
    queryKey: DATA_QUERY_KEYS.productionPlans,
    queryFn: () => getPlanningDataSource().getProductionPlans(),
  });
}

export function useBomQuery(): UseQueryResult<BomItem[]> {
  return useQuery({
    queryKey: DATA_QUERY_KEYS.bom,
    queryFn: () => getPlanningDataSource().getBom(),
  });
}

export function useValidationReportQuery(): UseQueryResult<ValidationReport> {
  return useQuery({
    queryKey: DATA_QUERY_KEYS.validationReport,
    queryFn: () => getPlanningDataSource().getValidationReport(),
  });
}

export function useReproducibilityQuery(): UseQueryResult<ReproducibilityReport> {
  return useQuery({
    queryKey: DATA_QUERY_KEYS.reproducibility,
    queryFn: () => getPlanningDataSource().getReproducibility(),
  });
}
