import type { ZodType } from 'zod';
import { DataFetchError, fetchValidatedJson } from './client';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentOrgId } from '@/lib/org-store';
import { DATASETS, type DatasetKind } from './datasets';
import {
  BomFileSchema,
  ForecastDemandFileSchema,
  InventoryFileSchema,
  LeadTimesFileSchema,
  LocationsFileSchema,
  ManifestSchema,
  MitigationsFileSchema,
  PabShardIndexFileSchema,
  PabShardSchema,
  PabWeeklyFileSchema,
  PoEventsFileSchema,
  ProductionPlansFileSchema,
  PurchaseOrdersFileSchema,
  ReproducibilityFileSchema,
  ShortageEventsFileSchema,
  ShortagesFileSchema,
  SkusFileSchema,
  SkuSubstitutesFileSchema,
  SupplierCapacityFileSchema,
  SuppliersFileSchema,
  ValidationReportSchema,
  type BomItem,
  type ForecastDemandRow,
  type InventoryRow,
  type LeadTimeRow,
  type Location,
  type Manifest,
  type Mitigation,
  type PabShard,
  type PabShardIndexEntry,
  type PabWeeklyRow,
  type PoEvent,
  type ProductionPlan,
  type PurchaseOrder,
  type ReproducibilityReport,
  type Shortage,
  type ShortageEvent,
  type Sku,
  type SkuSubstitute,
  type Supplier,
  type SupplierCapacityRow,
  type ValidationReport,
} from './schemas';

/**
 * Abstraction for planning dataset retrieval so static sharded JSON fixtures
 * and future HTTP API endpoints share one typed contract.
 */
export interface PlanningDataSource {
  getManifest: () => Promise<Manifest>;
  getSkus: () => Promise<Sku[]>;
  getLocations: () => Promise<Location[]>;
  getSuppliers: () => Promise<Supplier[]>;
  getPabIndex: () => Promise<PabShardIndexEntry[]>;
  getPabShard: (skuId: string, locationId: string) => Promise<PabShard>;
  getPabWeekly: () => Promise<PabWeeklyRow[]>;
  getForecastDemand: () => Promise<ForecastDemandRow[]>;
  getInventory: () => Promise<InventoryRow[]>;
  getSupplierCapacity: () => Promise<SupplierCapacityRow[]>;
  getLeadTimes: () => Promise<LeadTimeRow[]>;
  getPurchaseOrders: () => Promise<PurchaseOrder[]>;
  getPoEvents: () => Promise<PoEvent[]>;
  getShortages: () => Promise<Shortage[]>;
  getShortageEvents: () => Promise<ShortageEvent[]>;
  getMitigations: () => Promise<Mitigation[]>;
  getSkuSubstitutes: () => Promise<SkuSubstitute[]>;
  getProductionPlans: () => Promise<ProductionPlan[]>;
  getBom: () => Promise<BomItem[]>;
  getValidationReport: () => Promise<ValidationReport>;
  getReproducibility: () => Promise<ReproducibilityReport>;
}

/**
 * Loads zod-validated planning JSON files and per-SKU-location PAB shards from /data.
 */
export class StaticJsonSource implements PlanningDataSource {
  getManifest(): Promise<Manifest> {
    return fetchValidatedJson('manifest.json', ManifestSchema);
  }

  getSkus(): Promise<Sku[]> {
    return fetchValidatedJson('skus.json', SkusFileSchema);
  }

  getLocations(): Promise<Location[]> {
    return fetchValidatedJson('locations.json', LocationsFileSchema);
  }

  getSuppliers(): Promise<Supplier[]> {
    return fetchValidatedJson('suppliers.json', SuppliersFileSchema);
  }

  getPabIndex(): Promise<PabShardIndexEntry[]> {
    return fetchValidatedJson('pab/index.json', PabShardIndexFileSchema);
  }

  getPabShard(skuId: string, locationId: string): Promise<PabShard> {
    return fetchValidatedJson(`pab/${skuId}__${locationId}.json`, PabShardSchema);
  }

  getPabWeekly(): Promise<PabWeeklyRow[]> {
    return fetchValidatedJson('pab_weekly.json', PabWeeklyFileSchema);
  }

  getForecastDemand(): Promise<ForecastDemandRow[]> {
    return fetchValidatedJson('forecast_demand.json', ForecastDemandFileSchema);
  }

  getInventory(): Promise<InventoryRow[]> {
    return fetchValidatedJson('inventory.json', InventoryFileSchema);
  }

  getSupplierCapacity(): Promise<SupplierCapacityRow[]> {
    return fetchValidatedJson('supplier_capacity.json', SupplierCapacityFileSchema);
  }

  getLeadTimes(): Promise<LeadTimeRow[]> {
    return fetchValidatedJson('lead_times.json', LeadTimesFileSchema);
  }

  getPurchaseOrders(): Promise<PurchaseOrder[]> {
    return fetchValidatedJson('purchase_orders.json', PurchaseOrdersFileSchema);
  }

  getPoEvents(): Promise<PoEvent[]> {
    return fetchValidatedJson('po_events.json', PoEventsFileSchema);
  }

  getShortages(): Promise<Shortage[]> {
    return fetchValidatedJson('shortages.json', ShortagesFileSchema);
  }

  getShortageEvents(): Promise<ShortageEvent[]> {
    return fetchValidatedJson('shortage_events.json', ShortageEventsFileSchema);
  }

  getMitigations(): Promise<Mitigation[]> {
    return fetchValidatedJson('mitigations.json', MitigationsFileSchema);
  }

  getSkuSubstitutes(): Promise<SkuSubstitute[]> {
    return fetchValidatedJson('sku_substitutes.json', SkuSubstitutesFileSchema);
  }

  getProductionPlans(): Promise<ProductionPlan[]> {
    return fetchValidatedJson('production_plans.json', ProductionPlansFileSchema);
  }

  getBom(): Promise<BomItem[]> {
    return fetchValidatedJson('bom.json', BomFileSchema);
  }

  getValidationReport(): Promise<ValidationReport> {
    return fetchValidatedJson('validation_report.json', ValidationReportSchema);
  }

  getReproducibility(): Promise<ReproducibilityReport> {
    return fetchValidatedJson('reproducibility.json', ReproducibilityFileSchema);
  }
}

function unimplementedApiCall(endpoint: string): Promise<never> {
  return Promise.reject(
    new Error(
      `ApiSource is a stub and cannot fetch "${endpoint}". Set VITE_DATA_SOURCE=static to use local JSON shards.`,
    ),
  );
}

/**
 * Typed stub for a future backend API implementation of PlanningDataSource.
 */
export class ApiSource implements PlanningDataSource {
  getManifest(): Promise<Manifest> {
    return unimplementedApiCall('/manifest');
  }
  getSkus(): Promise<Sku[]> {
    return unimplementedApiCall('/skus');
  }
  getLocations(): Promise<Location[]> {
    return unimplementedApiCall('/locations');
  }
  getSuppliers(): Promise<Supplier[]> {
    return unimplementedApiCall('/suppliers');
  }
  getPabIndex(): Promise<PabShardIndexEntry[]> {
    return unimplementedApiCall('/pab/index');
  }
  getPabShard(skuId: string, locationId: string): Promise<PabShard> {
    return unimplementedApiCall(`/pab/${skuId}/${locationId}`);
  }
  getPabWeekly(): Promise<PabWeeklyRow[]> {
    return unimplementedApiCall('/pab-weekly');
  }
  getForecastDemand(): Promise<ForecastDemandRow[]> {
    return unimplementedApiCall('/forecast-demand');
  }
  getInventory(): Promise<InventoryRow[]> {
    return unimplementedApiCall('/inventory');
  }
  getSupplierCapacity(): Promise<SupplierCapacityRow[]> {
    return unimplementedApiCall('/supplier-capacity');
  }
  getLeadTimes(): Promise<LeadTimeRow[]> {
    return unimplementedApiCall('/lead-times');
  }
  getPurchaseOrders(): Promise<PurchaseOrder[]> {
    return unimplementedApiCall('/purchase-orders');
  }
  getPoEvents(): Promise<PoEvent[]> {
    return unimplementedApiCall('/po-events');
  }
  getShortages(): Promise<Shortage[]> {
    return unimplementedApiCall('/shortages');
  }
  getShortageEvents(): Promise<ShortageEvent[]> {
    return unimplementedApiCall('/shortage-events');
  }
  getMitigations(): Promise<Mitigation[]> {
    return unimplementedApiCall('/mitigations');
  }
  getSkuSubstitutes(): Promise<SkuSubstitute[]> {
    return unimplementedApiCall('/sku-substitutes');
  }
  getProductionPlans(): Promise<ProductionPlan[]> {
    return unimplementedApiCall('/production-plans');
  }
  getBom(): Promise<BomItem[]> {
    return unimplementedApiCall('/bom');
  }
  getValidationReport(): Promise<ValidationReport> {
    return unimplementedApiCall('/validation-report');
  }
  getReproducibility(): Promise<ReproducibilityReport> {
    return unimplementedApiCall('/reproducibility');
  }
}

import { storageRepo } from '@/lib/storage-repository';

/**
 * Reads an organization's uploaded dataset when present, otherwise the bundled sample file.
 * Uploaded payloads are re-validated with the same zod schema at read time.
 */
async function readOrgDataset<T>(kind: DatasetKind, schema: ZodType<T>): Promise<T | null> {
  const orgId = getCurrentOrgId();
  if (!orgId) return null;

  // Check local cache first
  const local = storageRepo.getUploadedDatasets(orgId);
  if (local[kind]) {
    const parsed = schema.safeParse(local[kind]);
    if (parsed.success) return parsed.data;
  }

  try {
    const { data, error } = await supabase
      .from('org_datasets')
      .select('payload')
      .eq('org_id', orgId)
      .eq('kind', kind)
      .maybeSingle();
    if (error || !data) return null;
    const parsed = schema.safeParse(data.payload);
    if (!parsed.success) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

export class OrgDatasetSource extends StaticJsonSource {
  private async pick<T>(kind: DatasetKind, schema: ZodType<T>, fallback: () => Promise<T>): Promise<T> {
    return (await readOrgDataset(kind, schema)) ?? fallback();
  }
  override getSkus() { return this.pick('skus', SkusFileSchema, () => super.getSkus()); }
  override getLocations() { return this.pick('locations', LocationsFileSchema, () => super.getLocations()); }
  override getSuppliers() { return this.pick('suppliers', SuppliersFileSchema, () => super.getSuppliers()); }
  override getPabWeekly() { return this.pick('pab_weekly', PabWeeklyFileSchema, () => super.getPabWeekly()); }
  override getForecastDemand() { return this.pick('forecast_demand', ForecastDemandFileSchema, () => super.getForecastDemand()); }
  override getInventory() { return this.pick('inventory', InventoryFileSchema, () => super.getInventory()); }
  override getSupplierCapacity() { return this.pick('supplier_capacity', SupplierCapacityFileSchema, () => super.getSupplierCapacity()); }
  override getLeadTimes() { return this.pick('lead_times', LeadTimesFileSchema, () => super.getLeadTimes()); }
  override getPurchaseOrders() { return this.pick('purchase_orders', PurchaseOrdersFileSchema, () => super.getPurchaseOrders()); }
  override getPoEvents() { return this.pick('po_events', PoEventsFileSchema, () => super.getPoEvents()); }
  override getShortages() { return this.pick('shortages', ShortagesFileSchema, () => super.getShortages()); }
  override getShortageEvents() { return this.pick('shortage_events', ShortageEventsFileSchema, () => super.getShortageEvents()); }
  override getMitigations() { return this.pick('mitigations', MitigationsFileSchema, () => super.getMitigations()); }
  override getSkuSubstitutes() { return this.pick('sku_substitutes', SkuSubstitutesFileSchema, () => super.getSkuSubstitutes()); }
  override getProductionPlans() { return this.pick('production_plans', ProductionPlansFileSchema, () => super.getProductionPlans()); }
  override getBom() { return this.pick('bom', BomFileSchema, () => super.getBom()); }

  override async getPabIndex(): Promise<PabShardIndexEntry[]> {
    const pab = await readOrgDataset('pab_weekly', PabWeeklyFileSchema);
    if (!pab) return super.getPabIndex();
    const seen = new Map<string, PabShardIndexEntry>();
    for (const r of pab) {
      const key = `${r.sku_id}__${r.location_id}`;
      const e = seen.get(key) ?? { sku_id: r.sku_id, location_id: r.location_id, file: '', pab_rows: 0, forecast_rows: 0 };
      e.pab_rows += 1;
      seen.set(key, e);
    }
    return [...seen.values()];
  }

  override async getPabShard(skuId: string, locationId: string): Promise<PabShard> {
    const [pab, fc] = await Promise.all([
      readOrgDataset('pab_weekly', PabWeeklyFileSchema),
      readOrgDataset('forecast_demand', ForecastDemandFileSchema),
    ]);
    if (!pab && !fc) return super.getPabShard(skuId, locationId);
    const match = (r: { sku_id: string; location_id: string }) => r.sku_id === skuId && r.location_id === locationId;
    const base = !pab || !fc ? await super.getPabShard(skuId, locationId).catch(() => null) : null;
    return {
      sku_id: skuId,
      location_id: locationId,
      pab_weekly: pab ? pab.filter(match).sort((a, b) => a.week - b.week) : (base?.pab_weekly ?? []),
      forecast_demand: fc ? fc.filter(match) : (base?.forecast_demand ?? []),
    };
  }
}

const orgSource = new OrgDatasetSource();
const apiSource = new ApiSource();

/**
 * Selects the active PlanningDataSource implementation based on VITE_DATA_SOURCE.
 */
export function getPlanningDataSource(): PlanningDataSource {
  const mode = import.meta.env['VITE_DATA_SOURCE'];
  return mode === 'api' ? apiSource : orgSource;
}
