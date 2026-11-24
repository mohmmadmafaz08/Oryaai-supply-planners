import { describe, expect, it } from 'vitest';
import type {
  Mitigation,
  PabWeeklyRow,
  PurchaseOrder,
  Shortage,
  Supplier,
} from '@/data/schemas';
import {
  computeCommandCenterMetrics,
  computePriorityBreakdown,
  computeShortageSeriesMetrics,
  filterShortages,
  rankShortages,
  selectUnitsAtRisk,
} from './shortage';

function makeShortage(overrides: Partial<Shortage> & Pick<Shortage, 'shortage_id'>): Shortage {
  return {
    sku_id: 'SKU-000001',
    location_id: 'LOC-NA-01',
    week: 10,
    shortage_qty: 100,
    cause_code: 'DEMAND_SPIKE',
    priority_score: 70,
    priority_components: {
      severity: 0.7,
      urgency: 0.8,
      service_impact: 0.65,
      supplier_risk: 0.4,
    },
    lead_time_basis_days: 10,
    status: 'OPEN',
    source_refs: {
      demand_id: 'DEM-SKU-000001-LOC-NA-01-2026W10',
      po_ids: ['PO-2026-000001'],
      supplier_id: 'SUP-0001',
    },
    ...overrides,
  };
}

describe('computeShortageSeriesMetrics (D1 non-double-counting rules)', () => {
  it('totals 100 (not 300) when a 100-unit backlog is carried 3 weeks with no new demand', () => {
    const result = computeShortageSeriesMetrics([
      { week: 1, demand: 200, closing: -100 },
      { week: 2, demand: 0, closing: -100 },
      { week: 3, demand: 0, closing: -100 },
    ]);

    expect(result.totalShortageUnits).toBe(100);
    expect(result.peakBacklog).toBe(100);
    expect(result.weeksInShortage).toBe(3);
    expect(result.fillRate).toBeCloseTo(0.5, 5);
  });

  it('counts regrowth separately when backlog clears and later returns', () => {
    const result = computeShortageSeriesMetrics([
      { week: 1, demand: 150, closing: -100 },
      { week: 2, demand: 50, closing: 20 },
      { week: 3, demand: 200, closing: -60 },
    ]);

    expect(result.totalShortageUnits).toBe(160);
    expect(result.peakBacklog).toBe(100);
    expect(result.weeksInShortage).toBe(2);
    expect(result.fillRate).toBeCloseTo(1 - 160 / 400, 5);
  });

  it('returns fillRate = 1 when total demand is zero', () => {
    const result = computeShortageSeriesMetrics([
      { week: 1, demand: 0, closing: -50 },
      { week: 2, demand: 0, closing: -50 },
    ]);

    expect(result.totalShortageUnits).toBe(50);
    expect(result.fillRate).toBe(1);
  });

  it('treats exactly-zero closing as zero backlog and zero shortage weeks', () => {
    const result = computeShortageSeriesMetrics([
      { week: 1, demand: 100, closing: 0 },
      { week: 2, demand: 120, closing: 0 },
    ]);

    expect(result.totalShortageUnits).toBe(0);
    expect(result.peakBacklog).toBe(0);
    expect(result.weeksInShortage).toBe(0);
    expect(result.fillRate).toBe(1);
  });
});

describe('selectUnitsAtRisk and Command Center consistency (D2)', () => {
  it('sums only OPEN and MITIGATING shortages and guarantees cause chart total equals KPI value', () => {
    const shortages: Shortage[] = [
      makeShortage({
        shortage_id: 'SHORT-2026-000001',
        status: 'OPEN',
        cause_code: 'DEMAND_SPIKE',
        shortage_qty: 200,
        week: 4,
      }),
      makeShortage({
        shortage_id: 'SHORT-2026-000002',
        status: 'MITIGATING',
        cause_code: 'LATE_INBOUND',
        shortage_qty: 150,
        week: 4,
      }),
      makeShortage({
        shortage_id: 'SHORT-2026-000003',
        status: 'RESOLVED',
        cause_code: 'SUPPLIER_CAPACITY',
        shortage_qty: 500,
        week: 8,
      }),
    ];

    const kpiUnitsAtRisk = selectUnitsAtRisk(shortages);
    expect(kpiUnitsAtRisk).toBe(350);

    const pabRows: PabWeeklyRow[] = [
      {
        sku_id: 'SKU-000001',
        location_id: 'LOC-NA-01',
        week: 4,
        opening: 0,
        inbound: 650,
        demand: 1000,
        closing: -350,
      },
    ];
    const suppliers: Supplier[] = [
      { supplier_id: 'SUP-0001', name: 'Alpha', reliability_score: 0.9, capacity_per_week: 500 },
      { supplier_id: 'SUP-0002', name: 'Beta', reliability_score: 0.8, capacity_per_week: 500 },
    ];
    const purchaseOrders: PurchaseOrder[] = [
      {
        po_id: 'PO-2026-000001',
        supplier_id: 'SUP-0001',
        sku_id: 'SKU-000001',
        location_id: 'LOC-NA-01',
        ordered_qty: 200,
        uom: 'units',
        order_date: '2026-01-05',
        promised_date: '2026-01-12',
        actual_receipt_date: '2026-01-12',
        status: 'RECEIVED',
        transport_delay_days: 0,
      },
      {
        po_id: 'PO-2026-000002',
        supplier_id: 'SUP-0001',
        sku_id: 'SKU-000001',
        location_id: 'LOC-NA-01',
        ordered_qty: 100,
        uom: 'units',
        order_date: '2026-01-05',
        promised_date: '2026-01-12',
        actual_receipt_date: null,
        status: 'DELAYED',
        transport_delay_days: 4,
      },
    ];
    const mitigations: Mitigation[] = [
      {
        mitigation_id: 'MIT-SHORT-2026-000001-01',
        shortage_id: 'SHORT-2026-000001',
        type: 'EXPEDITE',
        cost_usd: 1000,
        lead_time_days: 3,
        recovered_units: 180,
        service_level_after: 0.95,
        policy_compliant: true,
        policy_notes: 'Approved.',
      },
    ];

    const metrics = computeCommandCenterMetrics(
      shortages,
      pabRows,
      suppliers,
      purchaseOrders,
      mitigations,
    );

    const chartCauseTotal = metrics.causeBreakdown.reduce((sum, c) => sum + c.units, 0);
    const weeklyChartTotal = metrics.weeklyShortageUnits.reduce((sum, w) => sum + w.units, 0);

    expect(metrics.unitsAtRisk).toBe(kpiUnitsAtRisk);
    expect(chartCauseTotal).toBe(metrics.unitsAtRisk);
    expect(weeklyChartTotal).toBe(metrics.unitsAtRisk);
    expect(metrics.onTimeInboundRate).toBeCloseTo(0.5, 5);
    expect(metrics.shortagesWithCompliantMitigationRate).toBeCloseTo(1 / 3, 5);
  });

  it('handles empty datasets without division by zero', () => {
    const metrics = computeCommandCenterMetrics([], [], []);
    expect(metrics.openShortageCount).toBe(0);
    expect(metrics.unitsAtRisk).toBe(0);
    expect(metrics.expectedServiceLevel).toBe(1);
    expect(metrics.avgSupplierReliability).toBe(0);
    expect(metrics.onTimeInboundRate).toBe(1);
    expect(metrics.shortagesWithCompliantMitigationRate).toBe(0);
  });
});

describe('rankShortages, filterShortages, computePriorityBreakdown', () => {
  it('sorts deterministically without mutating inputs', () => {
    const items: Shortage[] = [
      makeShortage({ shortage_id: 'SHORT-2026-000003', priority_score: 80, shortage_qty: 200 }),
      makeShortage({ shortage_id: 'SHORT-2026-000002', priority_score: 80, shortage_qty: 200 }),
      makeShortage({ shortage_id: 'SHORT-2026-000004', priority_score: 80, shortage_qty: 350 }),
      makeShortage({ shortage_id: 'SHORT-2026-000001', priority_score: 95, shortage_qty: 50 }),
    ];
    const ranked = rankShortages(items);
    expect(ranked.map((i) => i.shortage_id)).toEqual([
      'SHORT-2026-000001',
      'SHORT-2026-000004',
      'SHORT-2026-000002',
      'SHORT-2026-000003',
    ]);
  });

  it('filters by search across shortage_id, sku_id, supplier_id, and po_ids', () => {
    const sample = [
      makeShortage({
        shortage_id: 'SHORT-2026-000001',
        source_refs: {
          demand_id: 'DEM-SKU-000001-LOC-NA-01-2026W10',
          po_ids: ['PO-2026-000777'],
          supplier_id: 'SUP-0009',
        },
      }),
    ];
    const matched = filterShortages(sample, {
      search: '000777',
      status: 'ALL',
      cause: 'ALL',
      weekMin: 1,
      weekMax: 52,
    });
    expect(matched).toHaveLength(1);
  });

  it('computes priority breakdown strictly from manifest weights', () => {
    const result = computePriorityBreakdown(
      { severity: 0.8, urgency: 0.6, service_impact: 0.9, supplier_risk: 0.4 },
      { severity: 0.35, urgency: 0.25, service_impact: 0.25, supplier_risk: 0.15 },
    );
    expect(result.rows).toHaveLength(4);
    expect(result.computedScore).toBeCloseTo(71.5, 1);
  });
});
