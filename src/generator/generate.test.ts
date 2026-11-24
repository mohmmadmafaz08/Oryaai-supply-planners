import { describe, expect, it } from 'vitest';
import { runPlanningValidationSuite } from '@/domain/validation';
import { DEFAULT_SEED, detectAnomalies, generateDataset, scoreDetection } from './generate';

const d = generateDataset('starter', DEFAULT_SEED);

describe('synthetic generator', () => {
  it('is reproducible: same seed gives identical output', () => {
    expect(JSON.stringify(generateDataset('starter', DEFAULT_SEED))).toBe(JSON.stringify(d));
  });
  it('changes with a different seed', () => {
    expect(JSON.stringify(generateDataset('starter', 7).forecast_demand)).not.toBe(JSON.stringify(d.forecast_demand));
  });
  it('uses the required ID patterns', () => {
    expect(d.skus[0]?.sku_id).toBe('SKU-000001');
    expect(d.purchase_orders[0]?.po_id).toBe('PO-2026-000001');
    expect(d.shortages[0]?.shortage_id).toBe('SHORT-2026-000001');
    expect(d.forecast_demand[0]?.demand_id).toMatch(/^DEM-SKU-000001-LOC-[A-Z]{2}-\d{2}-2026W01$/);
    expect(d.mitigations[0]?.mitigation_id).toBe('MIT-SHORT-2026-000001-01');
  });
  it('injects exactly the five labelled edge-case types', () => {
    expect(new Set(d.ground_truth.map((g) => g.issue_type))).toEqual(new Set(['DOUBLE_COUNTED_INBOUND', 'UNAPPROVED_SUBSTITUTE', 'CAPACITY_EXCEEDED', 'NO_LEAD_TIME', 'UOM_MISMATCH']));
  });
  it('detects every injected anomaly with no false positives', () => {
    const s = scoreDetection(detectAnomalies(d), d.ground_truth);
    expect(s.recall).toBe(1);
    expect(s.precision).toBe(1);
  });
  it('passes all clean-baseline integrity checks except the injected lead-time case', () => {
    const v = runPlanningValidationSuite({ skus: d.skus, locations: d.locations, suppliers: d.suppliers, pabRows: d.pab_weekly, shortages: d.shortages, mitigations: d.mitigations, purchaseOrders: d.purchase_orders, poEvents: d.po_events, shortageEvents: d.shortage_events, skuSubstitutes: d.sku_substitutes });
    const failing = v.cleanBaseline.filter((c) => c.status === 'FAIL').map((c) => c.name);
    expect(failing).toEqual(['Shortage Lead-Time Basis']);
  });
  it('every shortage traces to a negative projected balance in its start week', () => {
    const pab = new Map(d.pab_weekly.map((r) => [`${r.sku_id}|${r.location_id}|${r.week}`, r]));
    for (const s of d.shortages) expect(pab.get(`${s.sku_id}|${s.location_id}|${s.week}`)?.closing).toBeLessThan(0);
  });
});
