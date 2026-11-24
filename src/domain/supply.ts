import type {
  BomItem,
  InventoryRow,
  LeadTimeRow,
  PabWeeklyRow,
  PoEvent,
  PoStatus,
  PurchaseOrder,
  ShortageEvent,
  ShortageStatus,
  Sku,
  Supplier,
  SupplierCapacityRow,
} from '@/data/schemas';
import { UTILISATION_THRESHOLDS } from '@/lib/constants';

export interface DateOrderingCheckResult {
  valid: boolean;
  violations: string[];
}

export interface LifecycleValidationResult {
  valid: boolean;
  violations: string[];
}

export type UtilisationStatus = 'HEALTHY' | 'CONSTRAINED' | 'OVER_CAPACITY';

export interface SupplierSummaryRow {
  supplier: Supplier;
  peakWeeklyAllocated: number;
  peakWeekLabel: string;
  utilisationRatio: number;
  status: UtilisationStatus;
  minOrderQtyMin: number | null;
  minOrderQtyMax: number | null;
  leadTimeDaysMin: number | null;
  leadTimeDaysMax: number | null;
  activePoCount: number;
}

export interface BomComponentAvailability {
  componentSkuId: string;
  description: string;
  qtyPerParent: number;
  uom: string;
  onHandQty: number;
  projectedNetAvailable: number;
  buildableParents: number;
  isLimiting: boolean;
}

const VALID_PO_TRANSITIONS: Record<PoStatus, readonly PoStatus[]> = {
  DRAFT: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['SHIPPED', 'DELAYED', 'CANCELLED'],
  SHIPPED: ['IN_TRANSIT', 'DELAYED', 'RECEIVED'],
  IN_TRANSIT: ['DELAYED', 'RECEIVED'],
  DELAYED: ['IN_TRANSIT', 'RECEIVED', 'CANCELLED'],
  RECEIVED: [],
  CANCELLED: [],
};

const VALID_SHORTAGE_TRANSITIONS: Record<ShortageStatus, readonly ShortageStatus[]> = {
  OPEN: ['MITIGATING', 'RESOLVED'],
  MITIGATING: ['OPEN', 'RESOLVED'],
  RESOLVED: [],
};

function isoWeekNumber(isoDate: string): number {
  const baseline = Date.UTC(2026, 0, 5);
  const current = Date.parse(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(current)) {
    return 1;
  }
  const diffDays = Math.floor((current - baseline) / (1000 * 60 * 60 * 24));
  return Math.min(52, Math.max(1, Math.floor(diffDays / 7) + 1));
}

/**
 * Validates chronological date ordering for a purchase order.
 * Business rule: order_date must be <= promised_date, and when actual_receipt_date
 * is present it must be >= order_date.
 */
export function validatePoDateOrdering(po: PurchaseOrder): DateOrderingCheckResult {
  const violations: string[] = [];
  if (po.order_date > po.promised_date) {
    violations.push(`Promised date (${po.promised_date}) precedes order date (${po.order_date}).`);
  }
  if (po.actual_receipt_date !== null && po.actual_receipt_date < po.order_date) {
    violations.push(
      `Receipt date (${po.actual_receipt_date}) precedes order date (${po.order_date}).`,
    );
  }
  return {
    valid: violations.length === 0,
    violations,
  };
}

/**
 * Validates PO status transition history against the purchase order state machine.
 * Business rule: Initial events must start from null -> DRAFT|CONFIRMED; subsequent transitions
 * must follow VALID_PO_TRANSITIONS for the same entity_id ordered chronologically.
 */
export function validatePoLifecycleTransitions(
  events: readonly PoEvent[],
): LifecycleValidationResult {
  const violations: string[] = [];
  const sorted = [...events].sort((a, b) => a.occurred_on.localeCompare(b.occurred_on));
  const lastStatusByPo = new Map<string, PoStatus>();

  for (const evt of sorted) {
    const trackedPrev = lastStatusByPo.get(evt.entity_id) ?? null;
    if (evt.from_status === null) {
      if (trackedPrev !== null || (evt.to_status !== 'DRAFT' && evt.to_status !== 'CONFIRMED')) {
        violations.push(
          `${evt.event_id} (${evt.entity_id}): invalid initial transition to ${evt.to_status}.`,
        );
      }
    } else {
      const allowedNext = VALID_PO_TRANSITIONS[evt.from_status];
      if (!allowedNext.includes(evt.to_status)) {
        violations.push(
          `${evt.event_id} (${evt.entity_id}): invalid transition ${evt.from_status} -> ${evt.to_status}.`,
        );
      }
      if (trackedPrev !== null && trackedPrev !== evt.from_status) {
        violations.push(
          `${evt.event_id} (${evt.entity_id}): out-of-sequence from_status ${evt.from_status} (expected ${trackedPrev}).`,
        );
      }
    }
    lastStatusByPo.set(evt.entity_id, evt.to_status);
  }

  return { valid: violations.length === 0, violations };
}

/**
 * Validates shortage status transition history against the shortage lifecycle state machine.
 * Business rule: Initial event must transition null -> OPEN; later events must follow
 * VALID_SHORTAGE_TRANSITIONS chronologically.
 */
export function validateShortageLifecycleTransitions(
  events: readonly ShortageEvent[],
): LifecycleValidationResult {
  const violations: string[] = [];
  const sorted = [...events].sort((a, b) => a.occurred_on.localeCompare(b.occurred_on));
  const lastStatusByShortage = new Map<string, ShortageStatus>();

  for (const evt of sorted) {
    const trackedPrev = lastStatusByShortage.get(evt.entity_id) ?? null;
    if (evt.from_status === null) {
      if (trackedPrev !== null || evt.to_status !== 'OPEN') {
        violations.push(
          `${evt.event_id} (${evt.entity_id}): initial shortage status must be OPEN.`,
        );
      }
    } else {
      const allowedNext = VALID_SHORTAGE_TRANSITIONS[evt.from_status];
      if (!allowedNext.includes(evt.to_status)) {
        violations.push(
          `${evt.event_id} (${evt.entity_id}): invalid transition ${evt.from_status} -> ${evt.to_status}.`,
        );
      }
      if (trackedPrev !== null && trackedPrev !== evt.from_status) {
        violations.push(
          `${evt.event_id} (${evt.entity_id}): expected from_status ${trackedPrev}, found ${evt.from_status}.`,
        );
      }
    }
    lastStatusByShortage.set(evt.entity_id, evt.to_status);
  }

  return { valid: violations.length === 0, violations };
}

/**
 * Classifies supplier weekly capacity utilisation into semantic status thresholds.
 * Business rule: > 100% (1.0) is OVER_CAPACITY; >= 90% (0.9) is CONSTRAINED; otherwise HEALTHY.
 */
export function getUtilisationStatus(utilisationRatio: number): UtilisationStatus {
  if (utilisationRatio > UTILISATION_THRESHOLDS.OVER_CAPACITY) {
    return 'OVER_CAPACITY';
  }
  if (utilisationRatio >= UTILISATION_THRESHOLDS.CONSTRAINED) {
    return 'CONSTRAINED';
  }
  return 'HEALTHY';
}

/**
 * Aggregates per-supplier peak weekly allocation, utilisation %, MOQ range, and lead-time range.
 * Business rule: Sums non-cancelled PO ordered_qty per supplier per promised ISO week;
 * uses peak weekly load against supplier.capacity_per_week to flag constrained/over-capacity suppliers.
 */
export function computeSupplierSummaries(
  suppliers: readonly Supplier[],
  purchaseOrders: readonly PurchaseOrder[],
  supplierCapacity: readonly SupplierCapacityRow[],
  leadTimes: readonly LeadTimeRow[],
): SupplierSummaryRow[] {
  return suppliers.map((supplier) => {
    const weeklyTotals = new Map<number, number>();
    let activePoCount = 0;

    for (const po of purchaseOrders) {
      if (po.supplier_id !== supplier.supplier_id || po.status === 'CANCELLED') {
        continue;
      }
      activePoCount += 1;
      const wk = isoWeekNumber(po.promised_date);
      weeklyTotals.set(wk, (weeklyTotals.get(wk) ?? 0) + po.ordered_qty);
    }

    let peakWeeklyAllocated = 0;
    let peakWeek = 1;
    for (const [wk, qty] of weeklyTotals.entries()) {
      if (qty > peakWeeklyAllocated) {
        peakWeeklyAllocated = qty;
        peakWeek = wk;
      }
    }

    const utilisationRatio =
      supplier.capacity_per_week > 0 ? peakWeeklyAllocated / supplier.capacity_per_week : 0;

    const moqs = supplierCapacity
      .filter((row) => row.supplier_id === supplier.supplier_id)
      .map((row) => row.min_order_qty);
    const lts = leadTimes
      .filter((row) => row.supplier_id === supplier.supplier_id)
      .map((row) => row.lead_time_days);

    return {
      supplier,
      peakWeeklyAllocated,
      peakWeekLabel: `W${String(peakWeek).padStart(2, '0')}`,
      utilisationRatio,
      status: getUtilisationStatus(utilisationRatio),
      minOrderQtyMin: moqs.length > 0 ? Math.min(...moqs) : null,
      minOrderQtyMax: moqs.length > 0 ? Math.max(...moqs) : null,
      leadTimeDaysMin: lts.length > 0 ? Math.min(...lts) : null,
      leadTimeDaysMax: lts.length > 0 ? Math.max(...lts) : null,
      activePoCount,
    };
  });
}

/**
 * Analyzes BOM component availability for a finished-good SKU and identifies limiting components.
 * Business rule: Aggregates each component per location, taking min(on_hand_qty, max(0, ending_closing))
 * across the location's PAB horizon (or on_hand_qty if no PAB rows exist), sums across active locations,
 * computes floor(available / qty_per_parent), and marks components tied at the minimum as limiting.
 */
export function analyzeBomAvailability(
  parentSkuId: string,
  locationId: string | null,
  bomItems: readonly BomItem[],
  skus: readonly Sku[],
  inventory: readonly InventoryRow[],
  pabRows: readonly PabWeeklyRow[],
): BomComponentAvailability[] {
  const lines = bomItems.filter((item) => item.parent_sku_id === parentSkuId);
  if (lines.length === 0) {
    return [];
  }

  const skuMap = new Map(skus.map((s) => [s.sku_id, s]));

  const rows = lines.map((line) => {
    const sku = skuMap.get(line.component_sku_id);
    const matchingInv = inventory.filter(
      (inv) =>
        inv.sku_id === line.component_sku_id &&
        (locationId === null || inv.location_id === locationId),
    );
    const matchingPab = pabRows.filter(
      (row) =>
        row.sku_id === line.component_sku_id &&
        (locationId === null || row.location_id === locationId),
    );

    const onHandQty = matchingInv.reduce((sum, inv) => sum + inv.on_hand_qty, 0);
    const locIds = new Set<string>([
      ...matchingInv.map((i) => i.location_id),
      ...matchingPab.map((r) => r.location_id),
    ]);

    let projectedNetAvailable = 0;
    for (const loc of locIds) {
      const locOnHand = matchingInv
        .filter((i) => i.location_id === loc)
        .reduce((sum, i) => sum + i.on_hand_qty, 0);
      const locPab = matchingPab
        .filter((r) => r.location_id === loc)
        .sort((a, b) => a.week - b.week);
      const lastRow = locPab[locPab.length - 1];
      const locEndAvailable = lastRow ? Math.max(0, lastRow.closing) : locOnHand;
      projectedNetAvailable += Math.max(0, Math.min(locOnHand, locEndAvailable));
    }

    const buildableParents = Math.floor(projectedNetAvailable / line.qty_per_parent);

    return {
      componentSkuId: line.component_sku_id,
      description: sku?.description ?? line.component_sku_id,
      qtyPerParent: line.qty_per_parent,
      uom: line.uom,
      onHandQty,
      projectedNetAvailable,
      buildableParents,
      isLimiting: false,
    };
  });

  const minBuildable = Math.min(...rows.map((r) => r.buildableParents));
  return rows.map((row) => ({
    ...row,
    isLimiting: row.buildableParents === minBuildable,
  }));
}
