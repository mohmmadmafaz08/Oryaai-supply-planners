import { describe, expect, it } from 'vitest';
import type {
  BomItem,
  InventoryRow,
  LeadTimeRow,
  PabWeeklyRow,
  PoEvent,
  PurchaseOrder,
  ShortageEvent,
  Sku,
  Supplier,
  SupplierCapacityRow,
} from '@/data/schemas';
import {
  analyzeBomAvailability,
  computeSupplierSummaries,
  getUtilisationStatus,
  validatePoDateOrdering,
  validatePoLifecycleTransitions,
  validateShortageLifecycleTransitions,
} from './supply';

function makePo(overrides: Partial<PurchaseOrder> = {}): PurchaseOrder {
  return {
    po_id: 'PO-2026-000001',
    supplier_id: 'SUP-0001',
    sku_id: 'SKU-000001',
    location_id: 'LOC-NA-01',
    ordered_qty: 200,
    uom: 'units',
    order_date: '2026-01-10',
    promised_date: '2026-01-20',
    actual_receipt_date: '2026-01-20',
    status: 'RECEIVED',
    transport_delay_days: 0,
    ...overrides,
  };
}

describe('validatePoDateOrdering', () => {
  it('passes when order_date <= promised_date and receipt_date >= order_date (or null)', () => {
    expect(validatePoDateOrdering(makePo())).toEqual({ valid: true, violations: [] });
    expect(validatePoDateOrdering(makePo({ actual_receipt_date: null }))).toEqual({
      valid: true,
      violations: [],
    });
  });

  it('flags promised_date < order_date and receipt_date < order_date', () => {
    const result = validatePoDateOrdering(
      makePo({
        order_date: '2026-02-10',
        promised_date: '2026-02-01',
        actual_receipt_date: '2026-01-25',
      }),
    );
    expect(result.valid).toBe(false);
    expect(result.violations).toHaveLength(2);
  });
});

describe('lifecycle transition validators', () => {
  it('accepts valid chronological PO transitions and rejects invalid transitions', () => {
    const validEvents: PoEvent[] = [
      {
        event_id: 'EVT-000001',
        entity_id: 'PO-2026-000001',
        from_status: null,
        to_status: 'DRAFT',
        occurred_on: '2026-01-05',
        actor_role: 'SYSTEM',
      },
      {
        event_id: 'EVT-000002',
        entity_id: 'PO-2026-000001',
        from_status: 'DRAFT',
        to_status: 'CONFIRMED',
        occurred_on: '2026-01-06',
        actor_role: 'PLANNER',
      },
    ];
    expect(validatePoLifecycleTransitions(validEvents).valid).toBe(true);

    const invalidEvents: PoEvent[] = [
      ...validEvents,
      {
        event_id: 'EVT-000003',
        entity_id: 'PO-2026-000001',
        from_status: 'CONFIRMED',
        to_status: 'DRAFT',
        occurred_on: '2026-01-07',
        actor_role: 'PLANNER',
      },
    ];
    const invalidRes = validatePoLifecycleTransitions(invalidEvents);
    expect(invalidRes.valid).toBe(false);
    expect(invalidRes.violations[0]).toContain('CONFIRMED -> DRAFT');
  });

  it('accepts valid shortage transitions and rejects backward from RESOLVED', () => {
    const valid: ShortageEvent[] = [
      {
        event_id: 'EVT-100001',
        entity_id: 'SHORT-2026-000001',
        from_status: null,
        to_status: 'OPEN',
        occurred_on: '2026-01-10',
        actor_role: 'SYSTEM',
      },
      {
        event_id: 'EVT-100002',
        entity_id: 'SHORT-2026-000001',
        from_status: 'OPEN',
        to_status: 'RESOLVED',
        occurred_on: '2026-01-12',
        actor_role: 'OPERATIONS_MANAGER',
      },
    ];
    expect(validateShortageLifecycleTransitions(valid).valid).toBe(true);

    const bad: ShortageEvent[] = [
      ...valid,
      {
        event_id: 'EVT-100003',
        entity_id: 'SHORT-2026-000001',
        from_status: 'RESOLVED',
        to_status: 'OPEN',
        occurred_on: '2026-01-14',
        actor_role: 'PLANNER',
      },
    ];
    expect(validateShortageLifecycleTransitions(bad).valid).toBe(false);
  });
});

describe('supplier utilisation thresholds and summaries', () => {
  it('classifies <90% HEALTHY, 90%..100% CONSTRAINED, and >100% OVER_CAPACITY boundaries', () => {
    expect(getUtilisationStatus(0.899)).toBe('HEALTHY');
    expect(getUtilisationStatus(0.9)).toBe('CONSTRAINED');
    expect(getUtilisationStatus(1.0)).toBe('CONSTRAINED');
    expect(getUtilisationStatus(1.001)).toBe('OVER_CAPACITY');
  });

  it('aggregates peak weekly allocation, MOQ range, and lead time range', () => {
    const suppliers: Supplier[] = [
      { supplier_id: 'SUP-0001', name: 'A', reliability_score: 0.9, capacity_per_week: 500 },
    ];
    const pos: PurchaseOrder[] = [
      makePo({ po_id: 'PO-2026-000001', promised_date: '2026-01-12', ordered_qty: 300 }),
      makePo({ po_id: 'PO-2026-000002', promised_date: '2026-01-12', ordered_qty: 250 }),
    ];
    const cap: SupplierCapacityRow[] = [
      {
        capacity_id: 'CAP-000001',
        supplier_id: 'SUP-0001',
        sku_id: 'SKU-000001',
        capacity_per_week: 500,
        min_order_qty: 50,
        effective_from: '2026-01-01',
        effective_to: null,
      },
    ];
    const lt: LeadTimeRow[] = [
      {
        lead_time_id: 'LT-000001',
        supplier_id: 'SUP-0001',
        sku_id: 'SKU-000001',
        location_id: 'LOC-NA-01',
        lead_time_days: 9,
        effective_from: '2026-01-01',
        effective_to: null,
      },
    ];

    const summary = computeSupplierSummaries(suppliers, pos, cap, lt);
    expect(summary[0]?.peakWeeklyAllocated).toBe(550);
    expect(summary[0]?.utilisationRatio).toBeCloseTo(1.1, 4);
    expect(summary[0]?.status).toBe('OVER_CAPACITY');
    expect(summary[0]?.minOrderQtyMin).toBe(50);
    expect(summary[0]?.leadTimeDaysMin).toBe(9);
  });
});

describe('analyzeBomAvailability', () => {
  it('identifies the limiting component based on buildable parent units', () => {
    const bom: BomItem[] = [
      {
        parent_sku_id: 'SKU-000003',
        component_sku_id: 'SKU-000001',
        qty_per_parent: 4,
        uom: 'units',
      },
      {
        parent_sku_id: 'SKU-000003',
        component_sku_id: 'SKU-000006',
        qty_per_parent: 2,
        uom: 'units',
      },
    ];
    const skus: Sku[] = [
      { sku_id: 'SKU-000001', description: 'Bolt', uom: 'units', is_substitute_approved_for: [] },
      { sku_id: 'SKU-000006', description: 'Seal', uom: 'units', is_substitute_approved_for: [] },
    ];
    const inventory: InventoryRow[] = [
      {
        inventory_id: 'INV-000001',
        sku_id: 'SKU-000001',
        location_id: 'LOC-NA-01',
        on_hand_qty: 400,
        as_of_date: '2026-01-05',
      },
      {
        inventory_id: 'INV-000002',
        sku_id: 'SKU-000006',
        location_id: 'LOC-NA-01',
        on_hand_qty: 120,
        as_of_date: '2026-01-05',
      },
    ];
    const pab: PabWeeklyRow[] = [
      {
        sku_id: 'SKU-000001',
        location_id: 'LOC-NA-01',
        week: 1,
        opening: 400,
        inbound: 0,
        demand: 0,
        closing: 400,
      },
      {
        sku_id: 'SKU-000006',
        location_id: 'LOC-NA-01',
        week: 1,
        opening: 120,
        inbound: 0,
        demand: 0,
        closing: 100,
      },
    ];

    const res = analyzeBomAvailability('SKU-000003', 'LOC-NA-01', bom, skus, inventory, pab);
    expect(res).toHaveLength(2);
    expect(res.find((r) => r.componentSkuId === 'SKU-000001')?.buildableParents).toBe(100);
    expect(res.find((r) => r.componentSkuId === 'SKU-000006')?.buildableParents).toBe(50);
    expect(res.find((r) => r.componentSkuId === 'SKU-000006')?.isLimiting).toBe(true);
    expect(res.find((r) => r.componentSkuId === 'SKU-000001')?.isLimiting).toBe(false);
  });
});
