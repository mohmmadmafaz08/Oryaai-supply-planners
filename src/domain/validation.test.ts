import { describe, expect, it } from 'vitest';
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
} from '@/data/schemas';
import { runPlanningValidationSuite } from './validation';

function makeCleanInput() {
  const skus: Sku[] = [
    { sku_id: 'SKU-000001', description: 'Bolt', uom: 'units', is_substitute_approved_for: [] },
  ];
  const locations: Location[] = [
    { location_id: 'LOC-NA-01', name: 'Reno', region: 'North America' },
  ];
  const suppliers: Supplier[] = [
    { supplier_id: 'SUP-0001', name: 'Kestrel', reliability_score: 0.94, capacity_per_week: 500 },
  ];
  const pabRows: PabWeeklyRow[] = [
    {
      sku_id: 'SKU-000001',
      location_id: 'LOC-NA-01',
      week: 1,
      opening: 100,
      inbound: 50,
      demand: 80,
      closing: 70,
    },
  ];
  const purchaseOrders: PurchaseOrder[] = [
    {
      po_id: 'PO-2026-000001',
      supplier_id: 'SUP-0001',
      sku_id: 'SKU-000001',
      location_id: 'LOC-NA-01',
      ordered_qty: 50,
      uom: 'units',
      order_date: '2026-01-01',
      promised_date: '2026-01-05',
      actual_receipt_date: '2026-01-05',
      status: 'RECEIVED',
      transport_delay_days: 0,
    },
  ];
  const shortages: Shortage[] = [
    {
      shortage_id: 'SHORT-2026-000001',
      sku_id: 'SKU-000001',
      location_id: 'LOC-NA-01',
      week: 1,
      shortage_qty: 120,
      cause_code: 'DEMAND_SPIKE',
      priority_score: 70,
      priority_components: { severity: 0.6, urgency: 0.8, service_impact: 0.7, supplier_risk: 0.3 },
      lead_time_basis_days: 10,
      status: 'OPEN',
      source_refs: {
        demand_id: 'DEM-SKU-000001-LOC-NA-01-2026W01',
        po_ids: ['PO-2026-000001'],
        supplier_id: 'SUP-0001',
      },
    },
  ];
  const mitigations: Mitigation[] = [
    {
      mitigation_id: 'MIT-SHORT-2026-000001-01',
      shortage_id: 'SHORT-2026-000001',
      type: 'EXPEDITE',
      cost_usd: 1200,
      lead_time_days: 3,
      recovered_units: 120,
      service_level_after: 0.96,
      policy_compliant: true,
      policy_notes: 'Approved.',
    },
  ];
  const poEvents: PoEvent[] = [
    {
      event_id: 'EVT-000001',
      entity_id: 'PO-2026-000001',
      from_status: null,
      to_status: 'DRAFT',
      occurred_on: '2026-01-01',
      actor_role: 'SYSTEM',
    },
  ];
  const shortageEvents: ShortageEvent[] = [
    {
      event_id: 'EVT-100001',
      entity_id: 'SHORT-2026-000001',
      from_status: null,
      to_status: 'OPEN',
      occurred_on: '2026-01-01',
      actor_role: 'SYSTEM',
    },
  ];
  const skuSubstitutes: SkuSubstitute[] = [];

  return {
    skus,
    locations,
    suppliers,
    pabRows,
    shortages,
    mitigations,
    purchaseOrders,
    poEvents,
    shortageEvents,
    skuSubstitutes,
  };
}

describe('runPlanningValidationSuite', () => {
  it('passes all clean baseline and anomaly checks when dataset has no defects', () => {
    const result = runPlanningValidationSuite(makeCleanInput());
    expect(result.cleanBaseline).toHaveLength(7);
    expect(result.cleanBaseline.every((c) => c.status === 'PASS')).toBe(true);
    expect(result.injectedAnomalies.every((c) => c.status === 'PASS')).toBe(true);
  });

  it('catches PO date ordering and reconciliation anomalies cleanly', () => {
    const input = makeCleanInput();
    const firstPo = input.purchaseOrders[0];
    const firstPab = input.pabRows[0];
    if (firstPo && firstPab) {
      input.purchaseOrders[0] = {
        ...firstPo,
        order_date: '2026-02-01',
        promised_date: '2026-01-10',
      };
      input.pabRows[0] = {
        ...firstPab,
        closing: 999,
      };
    }

    const result = runPlanningValidationSuite(input);
    const dateCheck = result.cleanBaseline.find((c) => c.name === 'Date Ordering');
    const reconCheck = result.injectedAnomalies.find(
      (c) => c.name === 'PAB Weekly Reconciliation Check',
    );
    expect(dateCheck?.status).toBe('FAIL');
    expect(reconCheck?.status).toBe('FAIL');
  });
});
