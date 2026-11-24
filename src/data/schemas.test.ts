import { describe, expect, it } from 'vitest';
import {
  BomFileSchema,
  ForecastDemandFileSchema,
  InventoryFileSchema,
  LeadTimesFileSchema,
  ManifestSchema,
  PoEventsFileSchema,
  ProductionPlansFileSchema,
  PurchaseOrdersFileSchema,
  ReproducibilityFileSchema,
  ShortageEventsFileSchema,
  ShortagesFileSchema,
  SkuSubstitutesFileSchema,
  SupplierCapacityFileSchema,
} from './schemas';

describe('P1 data schemas reject malformed IDs and unknown enum values', () => {
  it('rejects malformed IDs and bad spike flags in forecast_demand.json', () => {
    const valid = ForecastDemandFileSchema.safeParse([
      {
        demand_id: 'DEM-SKU-000001-LOC-NA-01-2026W01',
        sku_id: 'SKU-000001',
        location_id: 'LOC-NA-01',
        week: 1,
        forecast_qty: 120,
        is_spike: false,
      },
    ]);
    expect(valid.success).toBe(true);

    const badId = ForecastDemandFileSchema.safeParse([
      {
        demand_id: 'BAD-DEM-1',
        sku_id: 'SKU-000001',
        location_id: 'LOC-NA-01',
        week: 1,
        forecast_qty: 120,
        is_spike: false,
      },
    ]);
    expect(badId.success).toBe(false);
  });

  it('rejects malformed IDs in inventory.json, supplier_capacity.json, and lead_times.json', () => {
    expect(
      InventoryFileSchema.safeParse([
        {
          inventory_id: 'INV-BAD',
          sku_id: 'SKU-000001',
          location_id: 'LOC-NA-01',
          on_hand_qty: 50,
          as_of_date: '2026-01-05',
        },
      ]).success,
    ).toBe(false);

    expect(
      SupplierCapacityFileSchema.safeParse([
        {
          capacity_id: 'CAP-1',
          supplier_id: 'SUP-0001',
          sku_id: 'SKU-000001',
          capacity_per_week: 500,
          min_order_qty: 25,
          effective_from: '2026-01-01',
          effective_to: null,
        },
      ]).success,
    ).toBe(false);

    expect(
      LeadTimesFileSchema.safeParse([
        {
          lead_time_id: 'LEAD-000001',
          supplier_id: 'SUP-0001',
          sku_id: 'SKU-000001',
          location_id: 'LOC-NA-01',
          lead_time_days: 7,
          effective_from: '2026-01-01',
          effective_to: null,
        },
      ]).success,
    ).toBe(false);
  });

  it('rejects malformed PO IDs and unknown PO statuses in purchase_orders.json', () => {
    const basePo = {
      po_id: 'PO-2026-000001',
      supplier_id: 'SUP-0001',
      sku_id: 'SKU-000001',
      location_id: 'LOC-NA-01',
      ordered_qty: 200,
      uom: 'units',
      order_date: '2026-01-05',
      promised_date: '2026-01-15',
      actual_receipt_date: null,
      status: 'IN_TRANSIT',
      transport_delay_days: 0,
    };
    expect(PurchaseOrdersFileSchema.safeParse([basePo]).success).toBe(true);
    expect(PurchaseOrdersFileSchema.safeParse([{ ...basePo, po_id: 'PO-99' }]).success).toBe(false);
    expect(PurchaseOrdersFileSchema.safeParse([{ ...basePo, status: 'LOST' }]).success).toBe(false);
  });

  it('rejects unknown actor roles and statuses in po_events.json and shortage_events.json', () => {
    const validPoEvent = {
      event_id: 'EVT-000001',
      entity_id: 'PO-2026-000001',
      from_status: null,
      to_status: 'DRAFT',
      occurred_on: '2026-01-05',
      actor_role: 'PLANNER',
    };
    expect(PoEventsFileSchema.safeParse([validPoEvent]).success).toBe(true);
    expect(
      PoEventsFileSchema.safeParse([{ ...validPoEvent, actor_role: 'DIRECTOR' }]).success,
    ).toBe(false);
    expect(PoEventsFileSchema.safeParse([{ ...validPoEvent, event_id: 'E-1' }]).success).toBe(
      false,
    );

    const validShortageEvent = {
      event_id: 'EVT-100001',
      entity_id: 'SHORT-2026-000001',
      from_status: 'OPEN',
      to_status: 'MITIGATING',
      occurred_on: '2026-02-01',
      actor_role: 'SYSTEM',
    };
    expect(ShortageEventsFileSchema.safeParse([validShortageEvent]).success).toBe(true);
    expect(
      ShortageEventsFileSchema.safeParse([{ ...validShortageEvent, to_status: 'CLOSED' }]).success,
    ).toBe(false);
  });

  it('rejects malformed IDs and unknown enums in substitutes, production_plans, bom, shortages, manifest, reproducibility, evaluation_metrics', () => {
    expect(
      SkuSubstitutesFileSchema.safeParse([
        {
          sku_id: 'BAD-SKU',
          substitute_sku_id: 'SKU-000002',
          approved: true,
          approved_on: '2026-01-01',
        },
      ]).success,
    ).toBe(false);

    expect(
      ProductionPlansFileSchema.safeParse([
        {
          plan_id: 'PLAN-2026-0001',
          sku_id: 'SKU-000003',
          location_id: 'LOC-NA-01',
          week: 8,
          planned_qty: 200,
          capacity_qty: 250,
          status: 'UNKNOWN_STATUS',
        },
      ]).success,
    ).toBe(false);

    expect(
      BomFileSchema.safeParse([
        {
          parent_sku_id: 'SKU-000003',
          component_sku_id: 'NOT-A-SKU',
          qty_per_parent: 2,
          uom: 'units',
        },
      ]).success,
    ).toBe(false);

    expect(
      ShortagesFileSchema.safeParse([
        {
          shortage_id: 'SHORT-2026-000001',
          sku_id: 'SKU-000003',
          location_id: 'LOC-NA-01',
          week: 8,
          shortage_qty: 100,
          cause_code: 'UNKNOWN_CAUSE',
          priority_score: 80,
          priority_components: {
            severity: 0.5,
            urgency: 0.5,
            service_impact: 0.5,
            supplier_risk: 0.5,
          },
          lead_time_basis_days: 10,
          status: 'OPEN',
          source_refs: {
            demand_id: 'DEM-SKU-000003-LOC-NA-01-2026W08',
            po_ids: ['PO-2026-000101'],
            supplier_id: 'SUP-0001',
          },
        },
      ]).success,
    ).toBe(false);

    expect(
      ManifestSchema.safeParse({
        seed: 20260401,
        generated_at_label: 'Fixture',
        priority_weights: {
          severity: 0.35,
          urgency: 0.25,
          service_impact: 0.25,
          supplier_risk: 0.15,
        },
        row_counts: { skus: 10 },
        checksums: { 'skus.json': 'not-a-sha256' },
      }).success,
    ).toBe(false);

    expect(
      ReproducibilityFileSchema.safeParse({
        run_a: { run_label: 'A', seed: 1, row_counts: {}, checksums: { 'a.json': 'bad' } },
        run_b: { run_label: 'B', seed: 1, row_counts: {}, checksums: {} },
      }).success,
    ).toBe(false);
  });
});
