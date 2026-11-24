import type { Mitigation, PurchaseOrder, Supplier } from '@/data/schemas';

export interface GroupedMitigations {
  compliant: Mitigation[];
  nonCompliant: Mitigation[];
}

export interface MitigationFeasibility {
  feasible: boolean;
  reason: string;
}

function isoDateToPlanningWeek(isoDate: string): number {
  const baseline = Date.UTC(2026, 0, 5);
  const current = Date.parse(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(current)) {
    return 1;
  }
  const diffDays = Math.floor((current - baseline) / (1000 * 60 * 60 * 24));
  return Math.min(52, Math.max(1, Math.floor(diffDays / 7) + 1));
}

/**
 * Computes a supplier's remaining weekly capacity for a target planning week.
 * Business rule: Sums ordered_qty across non-cancelled POs whose promised_date falls
 * in the target week and subtracts from supplier.capacity_per_week (floored at 0).
 */
export function computeSupplierRemainingCapacity(
  supplier: Supplier,
  purchaseOrders: readonly PurchaseOrder[],
  week: number,
): number {
  let allocated = 0;
  for (const po of purchaseOrders) {
    if (po.supplier_id !== supplier.supplier_id || po.status === 'CANCELLED') {
      continue;
    }
    if (isoDateToPlanningWeek(po.promised_date) === week) {
      allocated += po.ordered_qty;
    }
  }
  return Math.max(0, supplier.capacity_per_week - allocated);
}

/**
 * Evaluates whether a mitigation option is policy-compliant and feasible within supplier capacity.
 * Business rule: A mitigation is never feasible if policy_compliant is false OR if
 * recovered_units exceeds supplierRemainingCapacity.
 */
export function evaluateMitigationFeasibility(
  mitigation: Mitigation,
  supplierRemainingCapacity: number | null,
): MitigationFeasibility {
  if (!mitigation.policy_compliant) {
    return {
      feasible: false,
      reason: mitigation.policy_notes,
    };
  }
  if (
    supplierRemainingCapacity !== null &&
    mitigation.recovered_units > supplierRemainingCapacity
  ) {
    return {
      feasible: false,
      reason: `Recovered quantity (${String(mitigation.recovered_units)}) exceeds supplier remaining capacity (${String(supplierRemainingCapacity)}).`,
    };
  }
  return {
    feasible: true,
    reason: mitigation.policy_notes,
  };
}

/**
 * Filters and ranks policy-compliant mitigation options without mutating inputs.
 * Business rule: Only policy_compliant === true options (and within optional remaining capacity)
 * are eligible; ranked by recovered_units desc, cost_usd asc, mitigation_id asc.
 */
export function rankMitigations(
  options: readonly Mitigation[],
  supplierRemainingCapacity: number | null = null,
): Mitigation[] {
  return options
    .filter((option) => evaluateMitigationFeasibility(option, supplierRemainingCapacity).feasible)
    .sort((a, b) => {
      if (b.recovered_units !== a.recovered_units) {
        return b.recovered_units - a.recovered_units;
      }
      if (a.cost_usd !== b.cost_usd) {
        return a.cost_usd - b.cost_usd;
      }
      if (a.mitigation_id < b.mitigation_id) {
        return -1;
      }
      if (a.mitigation_id > b.mitigation_id) {
        return 1;
      }
      return 0;
    });
}

/**
 * Separates mitigation options into ranked selectable (feasible compliant) options
 * and non-compliant / capacity-infeasible options that remain visible but cannot be selected.
 * Business rule: Eligible compliant options follow rankMitigations ordering; ineligible options
 * remain visible for audit transparency sorted by mitigation_id ascending.
 */
export function groupMitigationsByPolicy(
  options: readonly Mitigation[],
  supplierRemainingCapacity: number | null = null,
): GroupedMitigations {
  const compliant = rankMitigations(options, supplierRemainingCapacity);
  const compliantIds = new Set(compliant.map((c) => c.mitigation_id));
  const nonCompliant = options
    .filter((option) => !compliantIds.has(option.mitigation_id))
    .sort((a, b) => {
      if (a.mitigation_id < b.mitigation_id) {
        return -1;
      }
      if (a.mitigation_id > b.mitigation_id) {
        return 1;
      }
      return 0;
    });

  return { compliant, nonCompliant };
}
