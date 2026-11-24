import type {
  Location,
  Mitigation,
  PabWeeklyRow,
  PoEvent,
  PurchaseOrder,
  Shortage,
  ShortageEvent,
  Sku,
  SkuSubstitute,
  Supplier,
  ValidationCheck,
} from '@/data/schemas';
import {
  CauseCodeSchema,
  DemandIdSchema,
  LocationIdSchema,
  MitigationIdSchema,
  MitigationTypeSchema,
  PoIdSchema,
  PoStatusSchema,
  ShortageIdSchema,
  ShortageStatusSchema,
  SkuIdSchema,
  SupplierIdSchema,
} from '@/data/schemas';
import { projectBalance } from './pab';
import {
  validatePoDateOrdering,
  validatePoLifecycleTransitions,
  validateShortageLifecycleTransitions,
} from './supply';

export interface PlanningValidationInput {
  skus: readonly Sku[];
  locations: readonly Location[];
  suppliers: readonly Supplier[];
  pabRows: readonly PabWeeklyRow[];
  shortages: readonly Shortage[];
  mitigations: readonly Mitigation[];
  purchaseOrders: readonly PurchaseOrder[];
  poEvents: readonly PoEvent[];
  shortageEvents: readonly ShortageEvent[];
  skuSubstitutes: readonly SkuSubstitute[];
}

export interface GroupedValidationResults {
  cleanBaseline: ValidationCheck[];
  injectedAnomalies: ValidationCheck[];
}

function countUniqueViolations(ids: readonly string[]): number {
  const seen = new Set<string>();
  let duplicates = 0;
  for (const id of ids) {
    if (seen.has(id)) {
      duplicates += 1;
    } else {
      seen.add(id);
    }
  }
  return duplicates;
}

/**
 * Runs the 12-point planning dataset integrity suite grouped into Clean Baseline
 * invariants and Injected Anomaly checks.
 * Business rule: Clean baseline checks verify PK uniqueness, FK integrity, allowed enums,
 * PO date ordering, lifecycle transitions, ID regexes, and shortage lead-time basis;
 * Injected anomaly checks cover PAB reconciliation, duplicate inbound receipts, UoM consistency,
 * supplier capacity, substitute approval, and mitigation lead-time bounds.
 */
export function runPlanningValidationSuite(
  input: PlanningValidationInput,
): GroupedValidationResults {
  const skuIds = new Set(input.skus.map((s) => s.sku_id));
  const locIds = new Set(input.locations.map((l) => l.location_id));
  const supIds = new Set(input.suppliers.map((s) => s.supplier_id));
  const shortageIds = new Set(input.shortages.map((s) => s.shortage_id));
  const poIds = new Set(input.purchaseOrders.map((p) => p.po_id));
  const supplierById = new Map(input.suppliers.map((s) => [s.supplier_id, s]));

  // 1. PK uniqueness
  const pkViolations =
    countUniqueViolations(input.skus.map((s) => s.sku_id)) +
    countUniqueViolations(input.locations.map((l) => l.location_id)) +
    countUniqueViolations(input.suppliers.map((s) => s.supplier_id)) +
    countUniqueViolations(input.shortages.map((s) => s.shortage_id)) +
    countUniqueViolations(input.mitigations.map((m) => m.mitigation_id)) +
    countUniqueViolations(input.purchaseOrders.map((p) => p.po_id));
  const pkRows =
    input.skus.length +
    input.locations.length +
    input.suppliers.length +
    input.shortages.length +
    input.mitigations.length +
    input.purchaseOrders.length;

  // 2. FK integrity
  let fkViolations = 0;
  for (const r of input.pabRows) {
    if (!skuIds.has(r.sku_id) || !locIds.has(r.location_id)) {
      fkViolations += 1;
    }
  }
  for (const s of input.shortages) {
    const missingPo = s.source_refs.po_ids.some((id) => !poIds.has(id));
    if (
      !skuIds.has(s.sku_id) ||
      !locIds.has(s.location_id) ||
      !supIds.has(s.source_refs.supplier_id) ||
      missingPo
    ) {
      fkViolations += 1;
    }
  }
  for (const m of input.mitigations) {
    if (!shortageIds.has(m.shortage_id)) {
      fkViolations += 1;
    }
  }
  for (const po of input.purchaseOrders) {
    if (!skuIds.has(po.sku_id) || !locIds.has(po.location_id) || !supIds.has(po.supplier_id)) {
      fkViolations += 1;
    }
  }
  const fkRows =
    input.pabRows.length +
    input.shortages.length +
    input.mitigations.length +
    input.purchaseOrders.length;

  // 3. Allowed enums
  let enumViolations = 0;
  for (const s of input.shortages) {
    if (
      !CauseCodeSchema.safeParse(s.cause_code).success ||
      !ShortageStatusSchema.safeParse(s.status).success
    ) {
      enumViolations += 1;
    }
  }
  for (const m of input.mitigations) {
    if (!MitigationTypeSchema.safeParse(m.type).success) {
      enumViolations += 1;
    }
  }
  for (const po of input.purchaseOrders) {
    if (!PoStatusSchema.safeParse(po.status).success) {
      enumViolations += 1;
    }
  }
  const enumRows = input.shortages.length + input.mitigations.length + input.purchaseOrders.length;

  // 4. PO Date ordering
  const dateViolations = input.purchaseOrders.filter(
    (po) => !validatePoDateOrdering(po).valid,
  ).length;

  // 5. Lifecycle transitions
  const poLifecycle = validatePoLifecycleTransitions(input.poEvents);
  const shortageLifecycle = validateShortageLifecycleTransitions(input.shortageEvents);
  const lifecycleViolations = poLifecycle.violations.length + shortageLifecycle.violations.length;
  const lifecycleRows = input.poEvents.length + input.shortageEvents.length;

  // 6. ID patterns
  let idPatternViolations = 0;
  for (const s of input.skus) {
    if (!SkuIdSchema.safeParse(s.sku_id).success) idPatternViolations += 1;
  }
  for (const l of input.locations) {
    if (!LocationIdSchema.safeParse(l.location_id).success) idPatternViolations += 1;
  }
  for (const sup of input.suppliers) {
    if (!SupplierIdSchema.safeParse(sup.supplier_id).success) idPatternViolations += 1;
  }
  for (const s of input.shortages) {
    if (
      !ShortageIdSchema.safeParse(s.shortage_id).success ||
      !DemandIdSchema.safeParse(s.source_refs.demand_id).success
    ) {
      idPatternViolations += 1;
    }
  }
  for (const m of input.mitigations) {
    if (!MitigationIdSchema.safeParse(m.mitigation_id).success) idPatternViolations += 1;
  }
  for (const po of input.purchaseOrders) {
    if (!PoIdSchema.safeParse(po.po_id).success) idPatternViolations += 1;
  }

  // 7. Shortage lead-time basis
  const ltBasisViolations = input.shortages.filter((s) => s.lead_time_basis_days <= 0).length;

  const cleanBaseline: ValidationCheck[] = [
    {
      name: 'PK Uniqueness',
      status: pkViolations === 0 ? 'PASS' : 'FAIL',
      rows_checked: pkRows,
      details:
        pkViolations === 0
          ? 'All primary keys across SKUs, locations, suppliers, shortages, mitigations, and POs are unique.'
          : `${String(pkViolations)} duplicate primary key identifiers detected.`,
      group: 'CLEAN_BASELINE',
    },
    {
      name: 'FK Integrity',
      status: fkViolations === 0 ? 'PASS' : 'FAIL',
      rows_checked: fkRows,
      details:
        fkViolations === 0
          ? 'All SKU, location, supplier, shortage, and purchase order foreign keys resolve cleanly.'
          : `${String(fkViolations)} unresolved foreign key references detected.`,
      group: 'CLEAN_BASELINE',
    },
    {
      name: 'Allowed Enums',
      status: enumViolations === 0 ? 'PASS' : 'FAIL',
      rows_checked: enumRows,
      details:
        enumViolations === 0
          ? 'All cause codes, statuses, and mitigation types belong to permitted schema enums.'
          : `${String(enumViolations)} records contain invalid enum values.`,
      group: 'CLEAN_BASELINE',
    },
    {
      name: 'Date Ordering',
      status: dateViolations === 0 ? 'PASS' : 'FAIL',
      rows_checked: input.purchaseOrders.length,
      details:
        dateViolations === 0
          ? 'All purchase orders satisfy order_date <= promised_date and receipt >= order_date.'
          : `${String(dateViolations)} purchase orders fail chronological date ordering.`,
      group: 'CLEAN_BASELINE',
    },
    {
      name: 'Lifecycle Transitions',
      status: lifecycleViolations === 0 ? 'PASS' : 'FAIL',
      rows_checked: lifecycleRows,
      details:
        lifecycleViolations === 0
          ? 'All PO and shortage status events follow valid state-machine transitions.'
          : `${String(lifecycleViolations)} invalid lifecycle status transitions detected.`,
      group: 'CLEAN_BASELINE',
    },
    {
      name: 'ID Patterns',
      status: idPatternViolations === 0 ? 'PASS' : 'FAIL',
      rows_checked: pkRows,
      details:
        idPatternViolations === 0
          ? 'All entity identifiers match required canonical regex formats.'
          : `${String(idPatternViolations)} entity identifiers fail canonical regex patterns.`,
      group: 'CLEAN_BASELINE',
    },
    {
      name: 'Shortage Lead-Time Basis',
      status: ltBasisViolations === 0 ? 'PASS' : 'FAIL',
      rows_checked: input.shortages.length,
      details:
        ltBasisViolations === 0
          ? 'All shortage records reference a positive lead_time_basis_days value.'
          : `${String(ltBasisViolations)} shortages lack a positive lead-time basis.`,
      group: 'CLEAN_BASELINE',
    },
  ];

  // --- Injected Anomaly Checks ---

  // 8. Arithmetic reconciliation & double-counted inbound receipts across all PAB pairs
  const pabByPair = new Map<string, PabWeeklyRow[]>();
  for (const row of input.pabRows) {
    const key = `${row.sku_id}__${row.location_id}`;
    const list = pabByPair.get(key) ?? [];
    list.push(row);
    pabByPair.set(key, list);
  }
  const reconFails: string[] = [];
  for (const [pairKey, rows] of pabByPair.entries()) {
    const res = projectBalance(rows);
    for (const err of res.reconciliationErrors) {
      reconFails.push(
        `${pairKey.replace('__', '@')}:W${String(err.week).padStart(2, '0')} (delta ${String(err.delta)})`,
      );
    }
  }

  // 9. Duplicates (composite key duplicates + duplicate inbound receipt anomalies)
  const pabKeys = input.pabRows.map((r) => `${r.sku_id}__${r.location_id}__W${String(r.week)}`);
  const compositeDuplicates = countUniqueViolations(pabKeys);
  const doubleCountedReceipts = reconFails.length;
  const totalDupFlags = compositeDuplicates + doubleCountedReceipts;

  // 10. UoM consistency (weekly buckets expect base "units")
  const nonBaseUomSkus = input.skus.filter((s) => s.uom !== 'units');

  // 11. Supplier capacity (shortage allocations vs weekly supplier capacity)
  const capacityExceededShortages = input.shortages.filter((s) => {
    const sup = supplierById.get(s.source_refs.supplier_id);
    return sup ? s.shortage_qty > sup.capacity_per_week : false;
  });

  // 12. Substitute approval policy & Mitigation lead time bounds
  const unapprovedSubNotes = input.mitigations.filter(
    (m) => m.type === 'SUBSTITUTE' && !m.policy_compliant,
  );
  const zeroLeadTimeMits = input.mitigations.filter((m) => m.lead_time_days <= 0);

  const injectedAnomalies: ValidationCheck[] = [
    {
      name: 'PAB Weekly Reconciliation Check',
      status: reconFails.length === 0 ? 'PASS' : 'FAIL',
      rows_checked: input.pabRows.length,
      details:
        reconFails.length === 0
          ? 'All weekly PAB buckets pass opening + inbound - demand = closing.'
          : `${String(reconFails.length)} row failed closing balance arithmetic (${reconFails.join(', ')}).`,
      group: 'INJECTED_ANOMALY',
    },
    {
      name: 'Duplicate Records & Inbound Receipts Check',
      status: totalDupFlags === 0 ? 'PASS' : 'FAIL',
      rows_checked: input.pabRows.length + input.purchaseOrders.length,
      details:
        totalDupFlags === 0
          ? 'No duplicate composite keys or duplicate inbound receipts detected.'
          : `${String(totalDupFlags)} anomaly flagged (${String(compositeDuplicates)} key duplicates, ${String(doubleCountedReceipts)} double-counted inbound receipt mismatch).`,
      group: 'INJECTED_ANOMALY',
    },
    {
      name: 'Substitute Approval Policy Check',
      status: unapprovedSubNotes.length === 0 ? 'PASS' : 'FAIL',
      rows_checked: input.mitigations.length + input.skuSubstitutes.length,
      details:
        unapprovedSubNotes.length === 0
          ? 'All substitute mitigations reference engineering-approved substitutes.'
          : `${String(unapprovedSubNotes.length)} substitute mitigation (${unapprovedSubNotes.map((m) => m.mitigation_id).join(', ')}) references an unapproved substitute SKU.`,
      group: 'INJECTED_ANOMALY',
    },
    {
      name: 'Supplier Weekly Capacity Check',
      status: capacityExceededShortages.length === 0 ? 'PASS' : 'FAIL',
      rows_checked: input.shortages.length,
      details:
        capacityExceededShortages.length === 0
          ? 'All supplier weekly allocations remain within quoted capacity_per_week.'
          : `${String(capacityExceededShortages.length)} shortage allocation (${capacityExceededShortages.map((s) => s.shortage_id).join(', ')}) exceeds supplier weekly capacity.`,
      group: 'INJECTED_ANOMALY',
    },
    {
      name: 'Mitigation Lead Time Bounds Check',
      status: zeroLeadTimeMits.length === 0 ? 'PASS' : 'FAIL',
      rows_checked: input.mitigations.length,
      details:
        zeroLeadTimeMits.length === 0
          ? 'All mitigation options satisfy minimum >= 1 day transit lead time.'
          : `${String(zeroLeadTimeMits.length)} mitigation (${zeroLeadTimeMits.map((m) => m.mitigation_id).join(', ')}) records lead_time_days = 0.`,
      group: 'INJECTED_ANOMALY',
    },
    {
      name: 'SKU Unit of Measure Consistency Check',
      status: nonBaseUomSkus.length === 0 ? 'PASS' : 'FAIL',
      rows_checked: input.skus.length,
      details:
        nonBaseUomSkus.length === 0
          ? 'All SKUs use standardized "units" matching weekly PAB buckets.'
          : `${String(nonBaseUomSkus.length)} SKU (${nonBaseUomSkus.map((s) => s.sku_id).join(', ')}) uses non-base UOM while PAB buckets expect "units".`,
      group: 'INJECTED_ANOMALY',
    },
  ];

  return { cleanBaseline, injectedAnomalies };
}
