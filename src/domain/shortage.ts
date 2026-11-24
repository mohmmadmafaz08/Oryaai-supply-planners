import type {
  CauseCode,
  Mitigation,
  PabWeeklyRow,
  PriorityComponents,
  PriorityWeights,
  PurchaseOrder,
  Shortage,
  ShortageStatus,
  Supplier,
} from '@/data/schemas';
import { formatWeekLabel } from '@/lib/format';
import { evaluateMitigationFeasibility, computeSupplierRemainingCapacity } from './mitigation';
import { coverageRatio } from './pab';

export interface ShortageFilters {
  search: string;
  status: ShortageStatus | 'ALL';
  cause: CauseCode | 'ALL';
  weekMin: number;
  weekMax: number;
}

export interface WeeklyShortageTotal {
  week: number;
  weekLabel: string;
  units: number;
  count: number;
}

export interface CauseBreakdownItem {
  causeCode: CauseCode;
  count: number;
  units: number;
}

export interface ShortageSeriesMetrics {
  totalShortageUnits: number;
  peakBacklog: number;
  weeksInShortage: number;
  fillRate: number;
}

export interface CommandCenterMetrics {
  openShortageCount: number;
  unitsAtRisk: number;
  expectedServiceLevel: number;
  avgSupplierReliability: number;
  onTimeInboundRate: number;
  shortagesWithCompliantMitigationRate: number;
  weeklyShortageUnits: WeeklyShortageTotal[];
  causeBreakdown: CauseBreakdownItem[];
}

export interface PriorityBreakdownRow {
  key: keyof PriorityComponents;
  label: string;
  rawValue: number;
  weight: number;
  weightedPoints: number;
}

export interface PriorityBreakdownResult {
  rows: PriorityBreakdownRow[];
  computedScore: number;
}

export interface IndexedShortageEntry {
  shortage: Shortage;
  searchTokens: string;
}

const CAUSE_ORDER: readonly CauseCode[] = [
  'DEMAND_SPIKE',
  'LATE_INBOUND',
  'SUPPLIER_CAPACITY',
  'LEAD_TIME_GAP',
];

const PRIORITY_COMPONENT_LABELS: Record<keyof PriorityComponents, string> = {
  severity: 'Shortage Severity',
  urgency: 'Horizon Urgency',
  service_impact: 'Service Impact',
  supplier_risk: 'Supplier Risk',
};

/**
 * Computes non-double-counting weekly shortage metrics from a chronological closing balance series.
 * Business rule:
 *   backlog[t]         = max(0, -closing[t]); backlog[0] = 0
 *   newShortage[t]     = max(0, backlog[t] - backlog[t - 1])
 *   totalShortageUnits = sum(newShortage)
 *   peakBacklog        = max(backlog)
 *   weeksInShortage    = count(backlog > 0)
 *   fillRate           = clamp(1 - totalShortageUnits / totalDemand, 0, 1); 1 when totalDemand <= 0
 */
export function computeShortageSeriesMetrics(
  rows: readonly { week: number; demand: number; closing: number }[],
): ShortageSeriesMetrics {
  if (rows.length === 0) {
    return {
      totalShortageUnits: 0,
      peakBacklog: 0,
      weeksInShortage: 0,
      fillRate: 1,
    };
  }

  const sorted = [...rows].sort((a, b) => a.week - b.week);
  let previousBacklog = 0;
  let totalShortageUnits = 0;
  let peakBacklog = 0;
  let weeksInShortage = 0;
  let totalDemand = 0;

  for (const row of sorted) {
    const backlog = Math.max(0, -row.closing);
    const newShortage = Math.max(0, backlog - previousBacklog);
    totalShortageUnits += newShortage;
    if (backlog > peakBacklog) {
      peakBacklog = backlog;
    }
    if (backlog > 0) {
      weeksInShortage += 1;
    }
    if (row.demand > 0) {
      totalDemand += row.demand;
    }
    previousBacklog = backlog;
  }

  const fillRate =
    totalDemand <= 0 ? 1 : Math.min(1, Math.max(0, 1 - totalShortageUnits / totalDemand));

  return {
    totalShortageUnits,
    peakBacklog,
    weeksInShortage,
    fillRate,
  };
}

/**
 * Selects total shortage units currently at risk (status OPEN or MITIGATING).
 * Business rule: Resolved shortages are excluded; OPEN and MITIGATING shortage quantities
 * form the single source of truth shared between Command Center KPIs and charts.
 */
export function selectUnitsAtRisk(shortages: readonly Shortage[]): number {
  let total = 0;
  for (const item of shortages) {
    if (item.status === 'OPEN' || item.status === 'MITIGATING') {
      total += item.shortage_qty;
    }
  }
  return total;
}

/**
 * Ranks shortages deterministically without mutating the source array.
 * Business rule: Sort by priority_score descending, then shortage_qty descending,
 * then shortage_id ascending for deterministic tie-breaking.
 */
export function rankShortages(shortages: readonly Shortage[]): Shortage[] {
  return [...shortages].sort((a, b) => {
    if (b.priority_score !== a.priority_score) {
      return b.priority_score - a.priority_score;
    }
    if (b.shortage_qty !== a.shortage_qty) {
      return b.shortage_qty - a.shortage_qty;
    }
    if (a.shortage_id < b.shortage_id) {
      return -1;
    }
    if (a.shortage_id > b.shortage_id) {
      return 1;
    }
    return 0;
  });
}

/**
 * Pre-builds normalized search tokens once per shortage list load for indexed O(1)-alloc filtering.
 * Business rule: Indexes shortage_id, sku_id, source_refs.supplier_id, and linked po_ids.
 */
export function buildShortageSearchIndex(shortages: readonly Shortage[]): IndexedShortageEntry[] {
  return shortages.map((shortage) => ({
    shortage,
    searchTokens: [
      shortage.shortage_id,
      shortage.sku_id,
      shortage.source_refs.supplier_id,
      ...shortage.source_refs.po_ids,
    ]
      .join(' ')
      .toLowerCase(),
  }));
}

/**
 * Filters pre-indexed shortages by search query, status, cause, and inclusive week range.
 * Business rule: Uses precomputed searchTokens so keystrokes do not re-normalize record fields.
 */
export function filterIndexedShortages(
  indexed: readonly IndexedShortageEntry[],
  filters: ShortageFilters,
): Shortage[] {
  const normalizedQuery = filters.search.trim().toLowerCase();
  const result: Shortage[] = [];

  for (const entry of indexed) {
    const item = entry.shortage;
    if (filters.status !== 'ALL' && item.status !== filters.status) {
      continue;
    }
    if (filters.cause !== 'ALL' && item.cause_code !== filters.cause) {
      continue;
    }
    if (item.week < filters.weekMin || item.week > filters.weekMax) {
      continue;
    }
    if (normalizedQuery.length > 0 && !entry.searchTokens.includes(normalizedQuery)) {
      continue;
    }
    result.push(item);
  }

  return result;
}

/**
 * Filters shortages by global search term, status, cause code, and inclusive planning week range.
 * Business rule: Delegates to buildShortageSearchIndex + filterIndexedShortages for single-rule parity.
 */
export function filterShortages(
  shortages: readonly Shortage[],
  filters: ShortageFilters,
): Shortage[] {
  return filterIndexedShortages(buildShortageSearchIndex(shortages), filters);
}

/**
 * Computes weighted priority score breakdown from shortage components and manifest weights.
 * Business rule: Never uses hardcoded frontend weights; uses manifest.priority_weights directly
 * and scales 0..1 weighted sum by 100 to match priority_score.
 */
export function computePriorityBreakdown(
  components: PriorityComponents,
  weights: PriorityWeights,
): PriorityBreakdownResult {
  const keys: (keyof PriorityComponents)[] = [
    'severity',
    'urgency',
    'service_impact',
    'supplier_risk',
  ];
  const rows: PriorityBreakdownRow[] = keys.map((key) => {
    const rawValue = components[key];
    const weight = weights[key];
    const weightedPoints = rawValue * weight * 100;
    return {
      key,
      label: PRIORITY_COMPONENT_LABELS[key],
      rawValue,
      weight,
      weightedPoints,
    };
  });

  const computedScore = rows.reduce((sum, r) => sum + r.weightedPoints, 0);
  return {
    rows,
    computedScore: Math.round(computedScore * 10) / 10,
  };
}

/**
 * Aggregates Command Center KPIs and chart series from validated planning datasets.
 * Business rule:
 * - Open shortages = count of records with status === 'OPEN'.
 * - Units at risk = selectUnitsAtRisk(shortages) (OPEN or MITIGATING); cause chart and weekly
 *   shortage chart use the exact same active at-risk set so chart totals match the KPI.
 * - Expected service level = coverageRatio(totalDemand, max(0, totalDemand - unitsAtRisk)).
 * - Avg supplier reliability = arithmetic mean of supplier reliability_score values.
 * - On-time inbound rate = share of evaluated POs (RECEIVED or DELAYED) delivered on or before promised_date with 0 delay days.
 * - Shortages with policy-compliant mitigation = share of shortages having >= 1 feasible compliant mitigation.
 */
export function computeCommandCenterMetrics(
  shortages: readonly Shortage[],
  pabRows: readonly PabWeeklyRow[],
  suppliers: readonly Supplier[],
  purchaseOrders: readonly PurchaseOrder[] = [],
  mitigations: readonly Mitigation[] = [],
): CommandCenterMetrics {
  let openShortageCount = 0;
  const unitsAtRisk = selectUnitsAtRisk(shortages);

  const weekMap = new Map<number, { units: number; count: number }>();
  const causeMap = new Map<CauseCode, { count: number; units: number }>();

  for (const code of CAUSE_ORDER) {
    causeMap.set(code, { count: 0, units: 0 });
  }

  for (const item of shortages) {
    if (item.status === 'OPEN') {
      openShortageCount += 1;
    }
    if (item.status === 'OPEN' || item.status === 'MITIGATING') {
      const weekAgg = weekMap.get(item.week) ?? { units: 0, count: 0 };
      weekMap.set(item.week, {
        units: weekAgg.units + item.shortage_qty,
        count: weekAgg.count + 1,
      });

      const causeAgg = causeMap.get(item.cause_code) ?? { count: 0, units: 0 };
      causeMap.set(item.cause_code, {
        count: causeAgg.count + 1,
        units: causeAgg.units + item.shortage_qty,
      });
    }
  }

  let totalDemand = 0;
  for (const row of pabRows) {
    if (row.demand > 0) {
      totalDemand += row.demand;
    }
  }

  const expectedServiceLevel = coverageRatio(totalDemand, Math.max(0, totalDemand - unitsAtRisk));

  let reliabilitySum = 0;
  for (const supplier of suppliers) {
    reliabilitySum += supplier.reliability_score;
  }
  const avgSupplierReliability = suppliers.length > 0 ? reliabilitySum / suppliers.length : 0;

  const evaluatedPos = purchaseOrders.filter(
    (po) => po.status === 'RECEIVED' || po.status === 'DELAYED',
  );
  const onTimeCount = evaluatedPos.filter(
    (po) =>
      po.transport_delay_days === 0 &&
      (po.actual_receipt_date === null || po.actual_receipt_date <= po.promised_date),
  ).length;
  const onTimeInboundRate = evaluatedPos.length > 0 ? onTimeCount / evaluatedPos.length : 1;

  const supplierById = new Map(suppliers.map((s) => [s.supplier_id, s]));
  const mitigationsByShortage = new Map<string, Mitigation[]>();
  for (const mit of mitigations) {
    const list = mitigationsByShortage.get(mit.shortage_id) ?? [];
    list.push(mit);
    mitigationsByShortage.set(mit.shortage_id, list);
  }

  let mitigatedShortageCount = 0;
  for (const shortage of shortages) {
    const opts = mitigationsByShortage.get(shortage.shortage_id) ?? [];
    const supplier = supplierById.get(shortage.source_refs.supplier_id);
    const remainingCap = supplier
      ? computeSupplierRemainingCapacity(supplier, purchaseOrders, shortage.week)
      : null;
    const hasFeasible = opts.some(
      (opt) => evaluateMitigationFeasibility(opt, remainingCap).feasible,
    );
    if (hasFeasible) {
      mitigatedShortageCount += 1;
    }
  }
  const shortagesWithCompliantMitigationRate =
    shortages.length > 0 ? mitigatedShortageCount / shortages.length : 0;

  const weeklyShortageUnits: WeeklyShortageTotal[] = [...weekMap.entries()]
    .sort(([a], [b]) => a - b)
    .map(([week, agg]) => ({
      week,
      weekLabel: formatWeekLabel(week),
      units: agg.units,
      count: agg.count,
    }));

  const causeBreakdown: CauseBreakdownItem[] = CAUSE_ORDER.map((causeCode) => {
    const agg = causeMap.get(causeCode) ?? { count: 0, units: 0 };
    return {
      causeCode,
      count: agg.count,
      units: agg.units,
    };
  }).sort((a, b) => b.units - a.units);

  return {
    openShortageCount,
    unitsAtRisk,
    expectedServiceLevel,
    avgSupplierReliability,
    onTimeInboundRate,
    shortagesWithCompliantMitigationRate,
    weeklyShortageUnits,
    causeBreakdown,
  };
}
