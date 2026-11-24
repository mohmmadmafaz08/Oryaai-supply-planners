import type { ZodType } from 'zod';
import {
  BomFileSchema,
  ForecastDemandFileSchema,
  InventoryFileSchema,
  LeadTimesFileSchema,
  LocationsFileSchema,
  MitigationsFileSchema,
  PabWeeklyFileSchema,
  PoEventsFileSchema,
  ProductionPlansFileSchema,
  PurchaseOrdersFileSchema,
  ShortageEventsFileSchema,
  ShortagesFileSchema,
  SkusFileSchema,
  SkuSubstitutesFileSchema,
  SupplierCapacityFileSchema,
  SuppliersFileSchema,
} from './schemas';

export const DATASET_KINDS = [
  'skus',
  'locations',
  'suppliers',
  'inventory',
  'pab_weekly',
  'forecast_demand',
  'purchase_orders',
  'po_events',
  'supplier_capacity',
  'lead_times',
  'shortages',
  'shortage_events',
  'mitigations',
  'sku_substitutes',
  'production_plans',
  'bom',
] as const;
export type DatasetKind = (typeof DATASET_KINDS)[number];

export interface DatasetSpec {
  label: string;
  file: string;
  group: 'Master data' | 'Planning' | 'Supply' | 'Risk' | 'Production';
  description: string;
  schema: ZodType<unknown[]>;
}

/** Single registry for every uploadable dataset file: label, sample template and validation schema. */
export const DATASETS: Record<DatasetKind, DatasetSpec> = {
  skus: { label: 'SKUs', file: 'skus.json', group: 'Master data', description: 'Products, unit of measure and approved substitutes.', schema: SkusFileSchema },
  locations: { label: 'Locations', file: 'locations.json', group: 'Master data', description: 'Plants and distribution centres.', schema: LocationsFileSchema },
  suppliers: { label: 'Suppliers', file: 'suppliers.json', group: 'Master data', description: 'Reliability score and weekly capacity.', schema: SuppliersFileSchema },
  inventory: { label: 'Inventory', file: 'inventory.json', group: 'Planning', description: 'On-hand quantity per SKU and location.', schema: InventoryFileSchema },
  pab_weekly: { label: 'Projected balance (weekly)', file: 'pab_weekly.json', group: 'Planning', description: 'Opening, inbound, demand and closing per week.', schema: PabWeeklyFileSchema },
  forecast_demand: { label: 'Demand forecast', file: 'forecast_demand.json', group: 'Planning', description: 'Weekly forecast quantity and spike flags.', schema: ForecastDemandFileSchema },
  purchase_orders: { label: 'Purchase orders', file: 'purchase_orders.json', group: 'Supply', description: 'Ordered quantity, promised and actual receipt dates.', schema: PurchaseOrdersFileSchema },
  po_events: { label: 'PO events', file: 'po_events.json', group: 'Supply', description: 'Status history of purchase orders.', schema: PoEventsFileSchema },
  supplier_capacity: { label: 'Supplier capacity', file: 'supplier_capacity.json', group: 'Supply', description: 'Capacity and minimum order per supplier and SKU.', schema: SupplierCapacityFileSchema },
  lead_times: { label: 'Lead times', file: 'lead_times.json', group: 'Supply', description: 'Quoted lead time per supplier, SKU and location.', schema: LeadTimesFileSchema },
  shortages: { label: 'Shortages', file: 'shortages.json', group: 'Risk', description: 'Detected shortages with cause and priority score.', schema: ShortagesFileSchema },
  shortage_events: { label: 'Shortage events', file: 'shortage_events.json', group: 'Risk', description: 'Status history of shortages.', schema: ShortageEventsFileSchema },
  mitigations: { label: 'Mitigation options', file: 'mitigations.json', group: 'Risk', description: 'Candidate recovery actions with cost and policy check.', schema: MitigationsFileSchema },
  sku_substitutes: { label: 'SKU substitutes', file: 'sku_substitutes.json', group: 'Production', description: 'Substitute approvals.', schema: SkuSubstitutesFileSchema },
  production_plans: { label: 'Production plans', file: 'production_plans.json', group: 'Production', description: 'Planned quantity vs capacity per week.', schema: ProductionPlansFileSchema },
  bom: { label: 'Bill of materials', file: 'bom.json', group: 'Production', description: 'Parent/child component quantities.', schema: BomFileSchema },
};

export const MAX_DATASET_ROWS = 50_000;

/** Validates an uploaded file's parsed JSON against the dataset schema; returns rows or a readable error. */
export function validateDataset(kind: DatasetKind, raw: unknown): { ok: true; rows: unknown[] } | { ok: false; error: string } {
  if (!Array.isArray(raw)) return { ok: false, error: 'File must contain a JSON array of rows.' };
  if (raw.length === 0) return { ok: false, error: 'File has no rows.' };
  if (raw.length > MAX_DATASET_ROWS) return { ok: false, error: `Too many rows (max ${MAX_DATASET_ROWS.toLocaleString()}).` };
  const parsed = DATASETS[kind].schema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const where = issue ? issue.path.join('.') : 'root';
    return { ok: false, error: `Row ${where}: ${issue?.message ?? 'invalid value'}` };
  }
  return { ok: true, rows: parsed.data };
}
