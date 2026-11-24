import { z } from 'zod';
import { MAX_WEEK, MIN_WEEK } from '@/lib/constants';

export const SkuIdSchema = z.string().regex(/^SKU-\d{6}$/, 'Expected format SKU-000001');

export const DemandIdSchema = z
  .string()
  .regex(
    /^DEM-SKU-\d{6}-[A-Z0-9-]+-\d{4}W(?:0[1-9]|[1-4]\d|5[0-2])$/,
    'Expected format DEM-<sku>-<location>-2026W01',
  );

export const PoIdSchema = z.string().regex(/^PO-\d{4}-\d{6}$/, 'Expected format PO-2026-000001');

export const ShortageIdSchema = z
  .string()
  .regex(/^SHORT-\d{4}-\d{6}$/, 'Expected format SHORT-2026-000001');

export const MitigationIdSchema = z
  .string()
  .regex(/^MIT-SHORT-\d{4}-\d{6}-\d{2}$/, 'Expected format MIT-<shortage-id>-01');

export const LocationIdSchema = z
  .string()
  .regex(/^LOC-[A-Z]{2}-\d{2}$/, 'Expected format LOC-NA-01');

export const SupplierIdSchema = z.string().regex(/^SUP-\d{4}$/, 'Expected format SUP-0001');
export const InventoryIdSchema = z.string().regex(/^INV-\d{6}$/, 'Expected format INV-000001');
export const CapacityIdSchema = z.string().regex(/^CAP-\d{6}$/, 'Expected format CAP-000001');
export const LeadTimeIdSchema = z.string().regex(/^LT-\d{6}$/, 'Expected format LT-000001');
export const EventIdSchema = z.string().regex(/^EVT-\d{6}$/, 'Expected format EVT-000001');
export const PlanIdSchema = z
  .string()
  .regex(/^PLAN-\d{4}-\d{4}$/, 'Expected format PLAN-2026-0001');
export const IsoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected ISO YYYY-MM-DD date');
export const Sha256Schema = z.string().regex(/^[a-f0-9]{64}$/, 'Expected 64-char SHA-256 hex');

export const PriorityWeightsSchema = z.object({
  severity: z.number().min(0).max(1),
  urgency: z.number().min(0).max(1),
  service_impact: z.number().min(0).max(1),
  supplier_risk: z.number().min(0).max(1),
});

export const PriorityComponentsSchema = z.object({
  severity: z.number().min(0).max(1),
  urgency: z.number().min(0).max(1),
  service_impact: z.number().min(0).max(1),
  supplier_risk: z.number().min(0).max(1),
});

export const ManifestSchema = z.object({
  seed: z.number().int(),
  generated_at_label: z.string().min(1),
  is_fixture: z.boolean().optional(),
  priority_weights: PriorityWeightsSchema,
  row_counts: z.record(z.string(), z.number().int().nonnegative()),
  checksums: z.record(z.string(), Sha256Schema),
});

export const SkuSchema = z.object({
  sku_id: SkuIdSchema,
  description: z.string().min(1),
  uom: z.string().min(1),
  is_substitute_approved_for: z.array(SkuIdSchema),
});
export const SkusFileSchema = z.array(SkuSchema);

export const LocationSchema = z.object({
  location_id: LocationIdSchema,
  name: z.string().min(1),
  region: z.string().min(1),
});
export const LocationsFileSchema = z.array(LocationSchema);

export const SupplierSchema = z.object({
  supplier_id: SupplierIdSchema,
  name: z.string().min(1),
  reliability_score: z.number().min(0).max(1),
  capacity_per_week: z.number().int().nonnegative(),
});
export const SuppliersFileSchema = z.array(SupplierSchema);

export const PabWeeklyRowSchema = z.object({
  sku_id: SkuIdSchema,
  location_id: LocationIdSchema,
  week: z.number().int().min(MIN_WEEK).max(MAX_WEEK),
  opening: z.number().int(),
  inbound: z.number().int(),
  demand: z.number().int(),
  closing: z.number().int(),
});
export const PabWeeklyFileSchema = z.array(PabWeeklyRowSchema);

export const ForecastDemandRowSchema = z.object({
  demand_id: DemandIdSchema,
  sku_id: SkuIdSchema,
  location_id: LocationIdSchema,
  week: z.number().int().min(MIN_WEEK).max(MAX_WEEK),
  forecast_qty: z.number().int().nonnegative(),
  is_spike: z.boolean(),
});
export const ForecastDemandFileSchema = z.array(ForecastDemandRowSchema);

export const PabShardIndexEntrySchema = z.object({
  sku_id: SkuIdSchema,
  location_id: LocationIdSchema,
  file: z.string().min(1),
  pab_rows: z.number().int().nonnegative(),
  forecast_rows: z.number().int().nonnegative(),
});
export const PabShardIndexFileSchema = z.array(PabShardIndexEntrySchema);

export const PabShardSchema = z.object({
  sku_id: SkuIdSchema,
  location_id: LocationIdSchema,
  pab_weekly: z.array(PabWeeklyRowSchema),
  forecast_demand: z.array(ForecastDemandRowSchema),
});

export const InventoryRowSchema = z.object({
  inventory_id: InventoryIdSchema,
  sku_id: SkuIdSchema,
  location_id: LocationIdSchema,
  on_hand_qty: z.number().int().nonnegative(),
  as_of_date: IsoDateSchema,
});
export const InventoryFileSchema = z.array(InventoryRowSchema);

export const SupplierCapacityRowSchema = z.object({
  capacity_id: CapacityIdSchema,
  supplier_id: SupplierIdSchema,
  sku_id: SkuIdSchema,
  capacity_per_week: z.number().int().nonnegative(),
  min_order_qty: z.number().int().positive(),
  effective_from: IsoDateSchema,
  effective_to: IsoDateSchema.nullable(),
});
export const SupplierCapacityFileSchema = z.array(SupplierCapacityRowSchema);

export const LeadTimeRowSchema = z.object({
  lead_time_id: LeadTimeIdSchema,
  supplier_id: SupplierIdSchema,
  sku_id: SkuIdSchema,
  location_id: LocationIdSchema,
  lead_time_days: z.number().int().nonnegative(),
  effective_from: IsoDateSchema,
  effective_to: IsoDateSchema.nullable(),
});
export const LeadTimesFileSchema = z.array(LeadTimeRowSchema);

export const PoStatusSchema = z.enum([
  'DRAFT',
  'CONFIRMED',
  'SHIPPED',
  'IN_TRANSIT',
  'DELAYED',
  'RECEIVED',
  'CANCELLED',
]);

export const PurchaseOrderSchema = z.object({
  po_id: PoIdSchema,
  supplier_id: SupplierIdSchema,
  sku_id: SkuIdSchema,
  location_id: LocationIdSchema,
  ordered_qty: z.number().int().positive(),
  uom: z.string().min(1),
  order_date: IsoDateSchema,
  promised_date: IsoDateSchema,
  actual_receipt_date: IsoDateSchema.nullable(),
  status: PoStatusSchema,
  transport_delay_days: z.number().int().nonnegative(),
});
export const PurchaseOrdersFileSchema = z.array(PurchaseOrderSchema);

export const ActorRoleSchema = z.enum([
  'PLANNER',
  'LOGISTICS_ANALYST',
  'OPERATIONS_MANAGER',
  'SYSTEM',
]);

export const PoEventSchema = z.object({
  event_id: EventIdSchema,
  entity_id: PoIdSchema,
  from_status: PoStatusSchema.nullable(),
  to_status: PoStatusSchema,
  occurred_on: IsoDateSchema,
  actor_role: ActorRoleSchema,
});
export const PoEventsFileSchema = z.array(PoEventSchema);

export const CauseCodeSchema = z.enum([
  'DEMAND_SPIKE',
  'LATE_INBOUND',
  'SUPPLIER_CAPACITY',
  'LEAD_TIME_GAP',
]);

export const ShortageStatusSchema = z.enum(['OPEN', 'MITIGATING', 'RESOLVED']);

export const ShortageEventSchema = z.object({
  event_id: EventIdSchema,
  entity_id: ShortageIdSchema,
  from_status: ShortageStatusSchema.nullable(),
  to_status: ShortageStatusSchema,
  occurred_on: IsoDateSchema,
  actor_role: ActorRoleSchema,
});
export const ShortageEventsFileSchema = z.array(ShortageEventSchema);

export const ShortageSourceRefsSchema = z.object({
  demand_id: DemandIdSchema,
  po_ids: z.array(PoIdSchema),
  supplier_id: SupplierIdSchema,
});

export const ShortageSchema = z.object({
  shortage_id: ShortageIdSchema,
  sku_id: SkuIdSchema,
  location_id: LocationIdSchema,
  week: z.number().int().min(MIN_WEEK).max(MAX_WEEK),
  shortage_qty: z.number().int().positive(),
  cause_code: CauseCodeSchema,
  priority_score: z.number().min(0).max(100),
  priority_components: PriorityComponentsSchema,
  lead_time_basis_days: z.number().int().nonnegative(),
  status: ShortageStatusSchema,
  source_refs: ShortageSourceRefsSchema,
});
export const ShortagesFileSchema = z.array(ShortageSchema);

export const MitigationTypeSchema = z.enum(['EXPEDITE', 'ALT_SUPPLIER', 'SUBSTITUTE', 'TRANSFER']);

export const MitigationSchema = z.object({
  mitigation_id: MitigationIdSchema,
  shortage_id: ShortageIdSchema,
  type: MitigationTypeSchema,
  cost_usd: z.number().nonnegative(),
  lead_time_days: z.number().int().nonnegative(),
  recovered_units: z.number().int().nonnegative(),
  service_level_after: z.number().min(0).max(1),
  policy_compliant: z.boolean(),
  policy_notes: z.string(),
});
export const MitigationsFileSchema = z.array(MitigationSchema);

export const SkuSubstituteSchema = z.object({
  sku_id: SkuIdSchema,
  substitute_sku_id: SkuIdSchema,
  approved: z.boolean(),
  approved_on: IsoDateSchema.nullable(),
});
export const SkuSubstitutesFileSchema = z.array(SkuSubstituteSchema);

export const ProductionPlanStatusSchema = z.enum(['PLANNED', 'RELEASED', 'COMPLETED', 'HOLD']);

export const ProductionPlanSchema = z.object({
  plan_id: PlanIdSchema,
  sku_id: SkuIdSchema,
  location_id: LocationIdSchema,
  week: z.number().int().min(MIN_WEEK).max(MAX_WEEK),
  planned_qty: z.number().int().nonnegative(),
  capacity_qty: z.number().int().nonnegative(),
  status: ProductionPlanStatusSchema,
});
export const ProductionPlansFileSchema = z.array(ProductionPlanSchema);

export const BomItemSchema = z.object({
  parent_sku_id: SkuIdSchema,
  component_sku_id: SkuIdSchema,
  qty_per_parent: z.number().positive(),
  uom: z.string().min(1),
});
export const BomFileSchema = z.array(BomItemSchema);

export const ValidationStatusSchema = z.enum(['PASS', 'FAIL']);
export const ValidationGroupSchema = z.enum(['CLEAN_BASELINE', 'INJECTED_ANOMALY']);

export const ValidationCheckSchema = z.object({
  name: z.string().min(1),
  status: ValidationStatusSchema,
  rows_checked: z.number().int().nonnegative(),
  details: z.string(),
  group: ValidationGroupSchema.optional(),
});

export const ValidationReportSchema = z.object({
  checks: z.array(ValidationCheckSchema),
});

export const GroundTruthIssueTypeSchema = z.enum([
  'DOUBLE_COUNTED_INBOUND',
  'UNAPPROVED_SUBSTITUTE',
  'CAPACITY_EXCEEDED',
  'NO_LEAD_TIME',
  'UOM_MISMATCH',
]);

export const GroundTruthRecordSchema = z.object({
  issue_type: GroundTruthIssueTypeSchema,
  record_ref: z.string().min(1),
  expected_detection: z.string().min(1),
});
export const GroundTruthFileSchema = z.array(GroundTruthRecordSchema);

export const EvaluationMetricsSchema = z.object({
  evaluated_at_label: z.string().min(1),
  total_injected: z.number().int().nonnegative(),
  detected_count: z.number().int().nonnegative(),
  detection_recall: z.number().min(0).max(1),
  detection_precision: z.number().min(0).max(1),
  unexpected_failures: z.number().int().nonnegative(),
  explained_shortage_share: z.number().min(0).max(1),
});

export const ReproducibilityRunSchema = z.object({
  run_label: z.string().min(1),
  seed: z.number().int(),
  row_counts: z.record(z.string(), z.number().int().nonnegative()),
  checksums: z.record(z.string(), Sha256Schema),
});

export const ReproducibilityFileSchema = z.object({
  run_a: ReproducibilityRunSchema,
  run_b: ReproducibilityRunSchema,
});

export type PriorityWeights = z.infer<typeof PriorityWeightsSchema>;
export type PriorityComponents = z.infer<typeof PriorityComponentsSchema>;
export type Manifest = z.infer<typeof ManifestSchema>;
export type Sku = z.infer<typeof SkuSchema>;
export type Location = z.infer<typeof LocationSchema>;
export type Supplier = z.infer<typeof SupplierSchema>;
export type PabWeeklyRow = z.infer<typeof PabWeeklyRowSchema>;
export type ForecastDemandRow = z.infer<typeof ForecastDemandRowSchema>;
export type PabShardIndexEntry = z.infer<typeof PabShardIndexEntrySchema>;
export type PabShard = z.infer<typeof PabShardSchema>;
export type InventoryRow = z.infer<typeof InventoryRowSchema>;
export type SupplierCapacityRow = z.infer<typeof SupplierCapacityRowSchema>;
export type LeadTimeRow = z.infer<typeof LeadTimeRowSchema>;
export type PoStatus = z.infer<typeof PoStatusSchema>;
export type PurchaseOrder = z.infer<typeof PurchaseOrderSchema>;
export type ActorRole = z.infer<typeof ActorRoleSchema>;
export type PoEvent = z.infer<typeof PoEventSchema>;
export type CauseCode = z.infer<typeof CauseCodeSchema>;
export type ShortageStatus = z.infer<typeof ShortageStatusSchema>;
export type ShortageEvent = z.infer<typeof ShortageEventSchema>;
export type ShortageSourceRefs = z.infer<typeof ShortageSourceRefsSchema>;
export type Shortage = z.infer<typeof ShortageSchema>;
export type MitigationType = z.infer<typeof MitigationTypeSchema>;
export type Mitigation = z.infer<typeof MitigationSchema>;
export type SkuSubstitute = z.infer<typeof SkuSubstituteSchema>;
export type ProductionPlanStatus = z.infer<typeof ProductionPlanStatusSchema>;
export type ProductionPlan = z.infer<typeof ProductionPlanSchema>;
export type BomItem = z.infer<typeof BomItemSchema>;
export type ValidationStatus = z.infer<typeof ValidationStatusSchema>;
export type ValidationGroup = z.infer<typeof ValidationGroupSchema>;
export type ValidationCheck = z.infer<typeof ValidationCheckSchema>;
export type ValidationReport = z.infer<typeof ValidationReportSchema>;
export type GroundTruthIssueType = z.infer<typeof GroundTruthIssueTypeSchema>;
export type GroundTruthRecord = z.infer<typeof GroundTruthRecordSchema>;
export type EvaluationMetrics = z.infer<typeof EvaluationMetricsSchema>;
export type ReproducibilityRun = z.infer<typeof ReproducibilityRunSchema>;
export type ReproducibilityReport = z.infer<typeof ReproducibilityFileSchema>;
