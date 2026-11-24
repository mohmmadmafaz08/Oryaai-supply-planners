import { describe, expect, it } from 'vitest';
import type { Mitigation, PurchaseOrder, Supplier } from '@/data/schemas';
import {
  computeSupplierRemainingCapacity,
  evaluateMitigationFeasibility,
  groupMitigationsByPolicy,
  rankMitigations,
} from './mitigation';

function makeMitigation(
  overrides: Partial<Mitigation> & Pick<Mitigation, 'mitigation_id'>,
): Mitigation {
  return {
    shortage_id: 'SHORT-2026-000001',
    type: 'EXPEDITE',
    cost_usd: 1500,
    lead_time_days: 3,
    recovered_units: 200,
    service_level_after: 0.95,
    policy_compliant: true,
    policy_notes: 'Approved.',
    ...overrides,
  };
}

describe('rankMitigations & feasibility guard', () => {
  it('filters out non-compliant and over-capacity options, sorting compliant options deterministically', () => {
    const options: Mitigation[] = [
      makeMitigation({
        mitigation_id: 'MIT-SHORT-2026-000001-01',
        recovered_units: 300,
        cost_usd: 4000,
        policy_compliant: true,
      }),
      makeMitigation({
        mitigation_id: 'MIT-SHORT-2026-000001-02',
        recovered_units: 500,
        cost_usd: 9000,
        policy_compliant: false,
      }),
      makeMitigation({
        mitigation_id: 'MIT-SHORT-2026-000001-04',
        recovered_units: 300,
        cost_usd: 2500,
        policy_compliant: true,
      }),
      makeMitigation({
        mitigation_id: 'MIT-SHORT-2026-000001-03',
        recovered_units: 300,
        cost_usd: 2500,
        policy_compliant: true,
      }),
      makeMitigation({
        mitigation_id: 'MIT-SHORT-2026-000001-05',
        recovered_units: 420,
        cost_usd: 6100,
        policy_compliant: true,
      }),
    ];

    const ranked = rankMitigations(options, 350);

    // MIT-05 (420) exceeds remaining capacity 350 so is excluded
    expect(ranked.map((m) => m.mitigation_id)).toEqual([
      'MIT-SHORT-2026-000001-03',
      'MIT-SHORT-2026-000001-04',
      'MIT-SHORT-2026-000001-01',
    ]);
  });

  it('never marks a mitigation as feasible when recovered_units exceeds supplier remaining capacity', () => {
    const mit = makeMitigation({
      mitigation_id: 'MIT-SHORT-2026-000001-01',
      recovered_units: 400,
      policy_compliant: true,
    });
    expect(evaluateMitigationFeasibility(mit, 399).feasible).toBe(false);
    expect(evaluateMitigationFeasibility(mit, 400).feasible).toBe(true);
  });

  it('computes remaining weekly supplier capacity from non-cancelled POs in that week', () => {
    const supplier: Supplier = {
      supplier_id: 'SUP-0001',
      name: 'Kestrel',
      reliability_score: 0.94,
      capacity_per_week: 1200,
    };
    const pos: PurchaseOrder[] = [
      {
        po_id: 'PO-2026-000101',
        supplier_id: 'SUP-0001',
        sku_id: 'SKU-000001',
        location_id: 'LOC-NA-01',
        ordered_qty: 900,
        uom: 'units',
        order_date: '2026-01-01',
        promised_date: '2026-01-12', // Week 2
        actual_receipt_date: null,
        status: 'CONFIRMED',
        transport_delay_days: 0,
      },
      {
        po_id: 'PO-2026-000102',
        supplier_id: 'SUP-0001',
        sku_id: 'SKU-000001',
        location_id: 'LOC-NA-01',
        ordered_qty: 500,
        uom: 'units',
        order_date: '2026-01-01',
        promised_date: '2026-01-12',
        actual_receipt_date: null,
        status: 'CANCELLED',
        transport_delay_days: 0,
      },
    ];

    expect(computeSupplierRemainingCapacity(supplier, pos, 2)).toBe(300);
    expect(computeSupplierRemainingCapacity(supplier, pos, 5)).toBe(1200);
  });

  it('keeps non-compliant options visible in nonCompliant list', () => {
    const options: Mitigation[] = [
      makeMitigation({ mitigation_id: 'MIT-SHORT-2026-000001-02', policy_compliant: false }),
      makeMitigation({ mitigation_id: 'MIT-SHORT-2026-000001-01', policy_compliant: true }),
    ];

    const grouped = groupMitigationsByPolicy(options);
    expect(grouped.compliant.map((m) => m.mitigation_id)).toEqual(['MIT-SHORT-2026-000001-01']);
    expect(grouped.nonCompliant.map((m) => m.mitigation_id)).toEqual(['MIT-SHORT-2026-000001-02']);
  });
});
