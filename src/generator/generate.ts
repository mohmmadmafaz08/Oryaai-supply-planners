/**
 * ORYVA deterministic synthetic planning-data generator.
 * Pure TypeScript (no Node APIs) so the same code runs in the CLI (scripts/generate.ts)
 * and in server functions. Same seed + same scale => byte-identical output.
 *
 * Generation order (dependency order): locations -> suppliers -> SKUs -> substitutes -> BOM ->
 * SKU-location assignment -> forecast demand -> inventory -> supplier capacity -> lead times ->
 * purchase orders (replenishment policy) -> PO events -> projected available balance ->
 * shortages (derived) -> shortage events -> mitigations -> production plans -> labelled anomalies.
 */
import type {
  BomItem, ForecastDemandRow, GroundTruthRecord, InventoryRow, LeadTimeRow, Location, Mitigation,
  PabWeeklyRow, PoEvent, PoStatus, ProductionPlan, PurchaseOrder, Shortage, ShortageEvent, Sku,
  SkuSubstitute, Supplier, SupplierCapacityRow, CauseCode, PriorityWeights,
} from '@/data/schemas';

export const DEFAULT_SEED = 20261022;

export interface ScaleConfig {
  skus: number; locations: number; suppliers: number; targetPurchaseOrders: number;
  weeks: number; anomaliesPerType: number;
}
export const SCALES = {
  starter: { skus: 60, locations: 8, suppliers: 30, targetPurchaseOrders: 400, weeks: 52, anomaliesPerType: 2 },
  full: { skus: 3000, locations: 50, suppliers: 500, targetPurchaseOrders: 10000, weeks: 52, anomaliesPerType: 10 },
} as const satisfies Record<string, ScaleConfig>;
export type ScaleName = keyof typeof SCALES;

export const PRIORITY_WEIGHTS: PriorityWeights = { severity: 0.35, urgency: 0.25, service_impact: 0.25, supplier_risk: 0.15 };
/** Week 1 of the planning horizon starts Monday 2026-01-05. Status "as-of" date is the start of week 5. */
const HORIZON_START = Date.UTC(2026, 0, 5);
const AS_OF_WEEK = 5;
const DAY = 86_400_000;

export interface GeneratedDataset {
  seed: number; scale: ScaleName;
  skus: Sku[]; locations: Location[]; suppliers: Supplier[]; sku_substitutes: SkuSubstitute[]; bom: BomItem[];
  forecast_demand: ForecastDemandRow[]; inventory: InventoryRow[]; supplier_capacity: SupplierCapacityRow[];
  lead_times: LeadTimeRow[]; purchase_orders: PurchaseOrder[]; po_events: PoEvent[]; pab_weekly: PabWeeklyRow[];
  shortages: Shortage[]; shortage_events: ShortageEvent[]; mitigations: Mitigation[]; production_plans: ProductionPlan[];
  ground_truth: GroundTruthRecord[];
}

// ---------- deterministic helpers ----------
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pad = (n: number, w: number) => String(n).padStart(w, '0');
export const weekStartIso = (week: number) => new Date(HORIZON_START + (week - 1) * 7 * DAY).toISOString().slice(0, 10);
const addDays = (iso: string, days: number) => new Date(Date.parse(`${iso}T00:00:00Z`) + days * DAY).toISOString().slice(0, 10);
const weekOf = (iso: string) => Math.floor((Date.parse(`${iso}T00:00:00Z`) - HORIZON_START) / (7 * DAY)) + 1;
const weekTag = (w: number) => `2026W${pad(w, 2)}`;
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const round2 = (x: number) => Math.round(x * 100) / 100;
const round4 = (x: number) => Math.round(x * 10000) / 10000;

const REGIONS = ['NA', 'EU', 'AP', 'LA', 'ME'] as const;
const CITIES: Record<(typeof REGIONS)[number], string[]> = {
  NA: ['Chicago', 'Dallas', 'Atlanta', 'Toronto', 'Phoenix', 'Columbus', 'Memphis', 'Reno', 'Denver', 'Newark'],
  EU: ['Rotterdam', 'Hamburg', 'Lyon', 'Milan', 'Poznan', 'Madrid', 'Antwerp', 'Dublin', 'Prague', 'Vienna'],
  AP: ['Pune', 'Chennai', 'Shenzhen', 'Penang', 'Osaka', 'Busan', 'Jakarta', 'Manila', 'Sydney', 'Hanoi'],
  LA: ['Monterrey', 'Sao Paulo', 'Bogota', 'Lima', 'Santiago', 'Queretaro', 'Curitiba', 'Medellin', 'Quito', 'Rosario'],
  ME: ['Dubai', 'Riyadh', 'Doha', 'Muscat', 'Amman', 'Jeddah', 'Kuwait City', 'Manama', 'Abu Dhabi', 'Dammam'],
};
const FAMILIES = ['Bearing', 'Valve', 'Sensor', 'Gasket', 'Motor', 'Pump', 'Filter', 'Bracket', 'Cable', 'Controller', 'Seal', 'Coupling'];
const GRADES = ['Std', 'HD', 'Pro', 'Lite', 'XL', 'Marine', 'Food-grade'];
const SUPPLIER_WORDS = ['Apex', 'Nordic', 'Vertex', 'Summit', 'Harbor', 'Atlas', 'Pioneer', 'Crest', 'Orion', 'Delta', 'Keystone', 'Meridian'];
const SUPPLIER_KINDS = ['Components', 'Industries', 'Manufacturing', 'Supply Co', 'Precision', 'Works'];

export function generateDataset(scaleName: ScaleName = 'starter', seed: number = DEFAULT_SEED): GeneratedDataset {
  const cfg: ScaleConfig = SCALES[scaleName];
  const rnd = mulberry32(seed);
  const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rnd() * arr.length)] as T;
  const int = (lo: number, hi: number) => lo + Math.floor(rnd() * (hi - lo + 1));
  const normal = () => { const u = Math.max(rnd(), 1e-9); const v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  const W = cfg.weeks;

  // 1. Locations (LOC-<region>-NN)
  const locations: Location[] = [];
  for (let i = 0; i < cfg.locations; i++) {
    const region = REGIONS[i % REGIONS.length] as (typeof REGIONS)[number];
    const n = Math.floor(i / REGIONS.length) + 1;
    const city = CITIES[region][(n - 1) % 10] as string;
    locations.push({ location_id: `LOC-${region}-${pad(n, 2)}`, name: `${city} ${i % 3 === 0 ? 'Plant' : 'DC'}`, region });
  }

  // 2. Suppliers. capacity_per_week is derived later from supplier_capacity rows.
  const suppliers: Supplier[] = [];
  const constrained = new Set<string>();
  for (let i = 1; i <= cfg.suppliers; i++) {
    const id = `SUP-${pad(i, 4)}`;
    const isConstrained = rnd() < 0.15;
    if (isConstrained) constrained.add(id);
    const reliability = clamp01(isConstrained ? 0.62 + rnd() * 0.2 : 0.82 + rnd() * 0.17);
    suppliers.push({ supplier_id: id, name: `${pick(SUPPLIER_WORDS)} ${pick(SUPPLIER_KINDS)} ${pad(i, 3)}`, reliability_score: round2(reliability), capacity_per_week: 0 });
  }

  // 3. SKUs (base UoM "units"), unit cost kept internal for mitigation costing.
  const skus: Sku[] = [];
  const unitCost = new Map<string, number>();
  for (let i = 1; i <= cfg.skus; i++) {
    const id = `SKU-${pad(i, 6)}`;
    skus.push({ sku_id: id, description: `${pick(FAMILIES)} ${pick(GRADES)} ${pad(int(10, 999), 3)}`, uom: 'units', is_substitute_approved_for: [] });
    unitCost.set(id, round2(Math.exp(2 + rnd() * 3)));
  }

  // 4. Substitutes (~12% of SKUs, ~75% engineering-approved). Bridge table sku_substitutes (N:M).
  const sku_substitutes: SkuSubstitute[] = [];
  for (let i = 0; i < skus.length - 1; i++) {
    if (rnd() < 0.12) {
      const a = skus[i] as Sku; const b = skus[i + 1] as Sku;
      const approved = rnd() < 0.75;
      sku_substitutes.push({ sku_id: a.sku_id, substitute_sku_id: b.sku_id, approved, approved_on: approved ? weekStartIso(1) : null });
      if (approved) b.is_substitute_approved_for.push(a.sku_id);
    }
  }

  // 5. BOM: ~8% of SKUs are manufactured with 2 components.
  const bom: BomItem[] = [];
  const manufactured: string[] = [];
  for (const s of skus) {
    if (rnd() < 0.08) {
      manufactured.push(s.sku_id);
      const comps = new Set<string>();
      while (comps.size < 2) { const c = pick(skus).sku_id; if (c !== s.sku_id) comps.add(c); }
      for (const c of comps) bom.push({ parent_sku_id: s.sku_id, component_sku_id: c, qty_per_parent: int(1, 4), uom: 'units' });
    }
  }

  // 6. SKU-location assignments (1-3 locations per SKU) and primary/alternate supplier per SKU.
  type Pair = { sku: string; loc: string; base: number };
  const pairs: Pair[] = [];
  const primary = new Map<string, string>(); const alternate = new Map<string, string>();
  for (const s of skus) {
    const k = int(1, 3); const chosen = new Set<string>();
    while (chosen.size < Math.min(k, locations.length)) chosen.add(pick(locations).location_id);
    for (const loc of [...chosen].sort()) pairs.push({ sku: s.sku_id, loc, base: Math.max(5, Math.round(Math.exp(3.6 + normal() * 0.7))) });
    const p = pick(suppliers).supplier_id; let a = pick(suppliers).supplier_id;
    if (a === p) a = (suppliers[(suppliers.findIndex((x) => x.supplier_id === p) + 1) % suppliers.length] as Supplier).supplier_id;
    primary.set(s.sku_id, p); alternate.set(s.sku_id, a);
  }

  // 7. Forecast demand: seasonality + noise + ~3% labelled demand spikes (x2.2-3.0).
  const forecast_demand: ForecastDemandRow[] = [];
  const demandOf = new Map<string, number[]>(); const spikeOf = new Map<string, boolean[]>();
  const planBase = new Map<string, number[]>(); // what the planner orders against (spikes not foreseen)
  for (const p of pairs) {
    const key = `${p.sku}|${p.loc}`; const phase = rnd() * Math.PI * 2; const amp = 0.1 + rnd() * 0.25;
    const d: number[] = []; const sp: boolean[] = []; const pb: number[] = [];
    for (let w = 1; w <= W; w++) {
      const seasonal = p.base * (1 + amp * Math.sin((2 * Math.PI * w) / 52 + phase));
      const isSpike = rnd() < 0.03;
      const qty = Math.max(0, Math.round(seasonal * (1 + normal() * 0.12) * (isSpike ? 2.2 + rnd() * 0.8 : 1)));
      d.push(qty); sp.push(isSpike); pb.push(Math.round(seasonal));
      forecast_demand.push({ demand_id: `DEM-${p.sku}-${p.loc}-${weekTag(w)}`, sku_id: p.sku, location_id: p.loc, week: w, forecast_qty: qty, is_spike: isSpike });
    }
    demandOf.set(key, d); spikeOf.set(key, sp); planBase.set(key, pb);
  }

  // 8. Supplier capacity per (supplier, SKU): primary covers ~0.9-1.5x avg weekly SKU demand, constrained suppliers 0.55-0.85x.
  const skuWeekly = new Map<string, number>();
  for (const p of pairs) skuWeekly.set(p.sku, (skuWeekly.get(p.sku) ?? 0) + p.base);
  const supplier_capacity: SupplierCapacityRow[] = []; const capOf = new Map<string, { cap: number; moq: number }>();
  let capN = 0;
  for (const s of skus) {
    const avg = skuWeekly.get(s.sku_id) ?? 0;
    for (const sup of [primary.get(s.sku_id) as string, alternate.get(s.sku_id) as string]) {
      const factor = constrained.has(sup) ? 0.55 + rnd() * 0.3 : 0.9 + rnd() * 0.6;
      const cap = Math.max(10, Math.round(avg * factor)); const moq = Math.max(5, Math.round(avg * (0.5 + rnd())));
      capN++; capOf.set(`${sup}|${s.sku_id}`, { cap, moq });
      supplier_capacity.push({ capacity_id: `CAP-${pad(capN, 6)}`, supplier_id: sup, sku_id: s.sku_id, capacity_per_week: cap, min_order_qty: moq, effective_from: weekStartIso(1), effective_to: null });
    }
  }
  const supCap = new Map<string, number>();
  for (const c of supplier_capacity) supCap.set(c.supplier_id, (supCap.get(c.supplier_id) ?? 0) + c.capacity_per_week);
  for (const s of suppliers) s.capacity_per_week = Math.max(supCap.get(s.supplier_id) ?? 0, 1000);

  // 9. Lead times per (primary supplier, SKU, location): 7-42 days, longer for constrained suppliers.
  const lead_times: LeadTimeRow[] = []; const ltOf = new Map<string, number>();
  pairs.forEach((p, i) => {
    const sup = primary.get(p.sku) as string;
    const days = constrained.has(sup) ? int(21, 42) : int(7, 28);
    ltOf.set(`${p.sku}|${p.loc}`, days);
    lead_times.push({ lead_time_id: `LT-${pad(i + 1, 6)}`, supplier_id: sup, sku_id: p.sku, location_id: p.loc, lead_time_days: days, effective_from: weekStartIso(1), effective_to: null });
  });

  // 10. Inventory: 2-6 weeks of cover on hand at horizon start.
  const inventory: InventoryRow[] = pairs.map((p, i) => ({ inventory_id: `INV-${pad(i + 1, 6)}`, sku_id: p.sku, location_id: p.loc, on_hand_qty: Math.round(p.base * (2 + rnd() * 4)), as_of_date: weekStartIso(1) }));
  const onHand = new Map(inventory.map((r) => [`${r.sku_id}|${r.location_id}`, r.on_hand_qty]));

  // 11. Purchase orders from a reorder-point policy against the *baseline* forecast (spikes are not foreseen).
  // Order cover is parameterised so total inbound orders lands close to the target volume.
  const coverWeeks = Math.max(2, Math.round((pairs.length * W) / cfg.targetPurchaseOrders));
  const purchase_orders: PurchaseOrder[] = []; const po_events: PoEvent[] = [];
  const arrivals = new Map<string, Map<number, number>>(); const poByPair = new Map<string, PurchaseOrder[]>();
  const poMeta = new Map<string, { promisedWeek: number; arrivalWeek: number }>();
  let poN = 0; let evtN = 0;
  const statusChain = (status: PoStatus): PoStatus[] => {
    switch (status) {
      case 'DRAFT': return ['DRAFT'];
      case 'CONFIRMED': return ['DRAFT', 'CONFIRMED'];
      case 'SHIPPED': return ['DRAFT', 'CONFIRMED', 'SHIPPED'];
      case 'IN_TRANSIT': return ['DRAFT', 'CONFIRMED', 'SHIPPED', 'IN_TRANSIT'];
      case 'DELAYED': return ['DRAFT', 'CONFIRMED', 'SHIPPED', 'DELAYED'];
      case 'RECEIVED': return ['DRAFT', 'CONFIRMED', 'SHIPPED', 'IN_TRANSIT', 'RECEIVED'];
      case 'CANCELLED': return ['DRAFT', 'CANCELLED'];
    }
  };
  for (const p of pairs) {
    const key = `${p.sku}|${p.loc}`; const base = planBase.get(key) as number[];
    const sup = primary.get(p.sku) as string; const { cap, moq } = capOf.get(`${sup}|${p.sku}`) as { cap: number; moq: number };
    const lt = ltOf.get(key) as number; const arr = new Map<number, number>(); const list: PurchaseOrder[] = [];
    let projected = onHand.get(key) ?? 0;
    for (let w = 1; w <= W; w++) {
      const need = base[w - 1] as number;
      if (projected - need < need * 1.5) {
        let qty = Math.max(moq, Math.round(need * coverWeeks));
        // Allocation from a supplier is limited to cover x its weekly capacity share; constrained suppliers short-ship.
        const share = Math.max(1, Math.round(cap * coverWeeks * (p.base / (skuWeekly.get(p.sku) ?? p.base))));
        if (constrained.has(sup)) qty = Math.min(qty, Math.max(moq, Math.round(share * 0.75)));
        const promised = weekStartIso(w); const order = addDays(promised, -lt);
        const delayed = rnd() < (constrained.has(sup) ? 0.25 : 0.08);
        const delay = delayed ? int(7, 21) : 0;
        const arrival = addDays(promised, delay); const arrivalWeek = Math.min(W + 1, weekOf(arrival));
        const cancelled = rnd() < 0.015;
        const asOf = weekStartIso(AS_OF_WEEK);
        let status: PoStatus;
        if (cancelled) status = 'CANCELLED';
        else if (arrival < asOf) status = 'RECEIVED';
        else if (order > asOf) status = rnd() < 0.3 ? 'DRAFT' : 'CONFIRMED';
        else if (delay > 0 && promised <= addDays(asOf, 14)) status = 'DELAYED';
        else status = addDays(order, 7) <= asOf ? 'IN_TRANSIT' : 'SHIPPED';
        poN++;
        const po: PurchaseOrder = { po_id: `PO-2026-${pad(poN, 6)}`, supplier_id: sup, sku_id: p.sku, location_id: p.loc, ordered_qty: qty, uom: 'units', order_date: order, promised_date: promised, actual_receipt_date: status === 'RECEIVED' ? arrival : null, status, transport_delay_days: delay };
        purchase_orders.push(po); list.push(po); poMeta.set(po.po_id, { promisedWeek: w, arrivalWeek });
        // Event history: one immutable event per state change, dated between order and arrival.
        const chain = statusChain(status); const span = Math.max(1, Math.round((Date.parse(arrival) - Date.parse(order)) / DAY));
        chain.forEach((to, idx) => {
          evtN++;
          const on = to === 'RECEIVED' ? arrival : addDays(order, Math.min(span, Math.round((span * idx) / chain.length)));
          po_events.push({ event_id: `EVT-${pad(evtN, 6)}`, entity_id: po.po_id, from_status: idx === 0 ? null : (chain[idx - 1] as PoStatus), to_status: to, occurred_on: on, actor_role: to === 'DRAFT' || to === 'CONFIRMED' || to === 'CANCELLED' ? 'PLANNER' : to === 'DELAYED' ? 'LOGISTICS_ANALYST' : 'SYSTEM' });
        });
        if (status !== 'CANCELLED' && arrivalWeek <= W) arr.set(arrivalWeek, (arr.get(arrivalWeek) ?? 0) + qty);
        projected += status === 'CANCELLED' ? 0 : qty;
      }
      projected -= need;
    }
    arrivals.set(key, arr); poByPair.set(key, list);
  }

  // 12. Projected available balance: closing = opening + inbound - demand; opening(n) = closing(n-1).
  const pab_weekly: PabWeeklyRow[] = []; const closingOf = new Map<string, number[]>();
  for (const p of pairs) {
    const key = `${p.sku}|${p.loc}`; const d = demandOf.get(key) as number[]; const arr = arrivals.get(key) as Map<number, number>;
    let opening = onHand.get(key) ?? 0; const closes: number[] = [];
    for (let w = 1; w <= W; w++) {
      const inbound = arr.get(w) ?? 0; const demand = d[w - 1] as number; const closing = opening + inbound - demand;
      pab_weekly.push({ sku_id: p.sku, location_id: p.loc, week: w, opening, inbound, demand, closing });
      closes.push(closing); opening = closing;
    }
    closingOf.set(key, closes);
  }

  // 13. Shortages: one per contiguous run of negative closing balance; qty = deepest deficit in the run.
  // Cause is derived from documented rules in priority order (see docs/DATA_DICTIONARY.md).
  const shortages: Shortage[] = []; const shortage_events: ShortageEvent[] = []; const mitigations: Mitigation[] = [];
  const supplierById = new Map(suppliers.map((s) => [s.supplier_id, s]));
  const subsBySku = new Map<string, SkuSubstitute[]>();
  for (const s of sku_substitutes) subsBySku.set(s.sku_id, [...(subsBySku.get(s.sku_id) ?? []), s]);
  const pairsBySku = new Map<string, Pair[]>();
  for (const p of pairs) pairsBySku.set(p.sku, [...(pairsBySku.get(p.sku) ?? []), p]);
  let shN = 0; let sevtN = 0;
  for (const p of pairs) {
    const key = `${p.sku}|${p.loc}`; const closes = closingOf.get(key) as number[]; const d = demandOf.get(key) as number[];
    const sp = spikeOf.get(key) as boolean[]; const sup = primary.get(p.sku) as string; const lt = ltOf.get(key) as number;
    let w = 1;
    while (w <= W) {
      if ((closes[w - 1] as number) >= 0) { w++; continue; }
      const start = w; let deepest = 0; let runDemand = 0;
      while (w <= W && (closes[w - 1] as number) < 0) { deepest = Math.max(deepest, -(closes[w - 1] as number)); runDemand += d[w - 1] as number; w++; }
      const late = (poByPair.get(key) ?? []).filter((po) => { const m = poMeta.get(po.po_id); return m !== undefined && po.transport_delay_days > 0 && m.promisedWeek <= start && m.arrivalWeek > start; });
      const { cap } = capOf.get(`${sup}|${p.sku}`) as { cap: number };
      let cause: CauseCode;
      if (sp[start - 1] || (start > 1 && sp[start - 2])) cause = 'DEMAND_SPIKE';
      else if (late.length > 0) cause = 'LATE_INBOUND';
      else if (cap < (skuWeekly.get(p.sku) ?? 0) || constrained.has(sup)) cause = 'SUPPLIER_CAPACITY';
      else cause = 'LEAD_TIME_GAP';
      const supplier = supplierById.get(sup) as Supplier;
      const comps = { severity: round4(clamp01(deepest / Math.max(1, p.base * 2))), urgency: round4(clamp01(1 - (start - 1) / (W - 1))), service_impact: round4(clamp01(deepest / Math.max(1, runDemand))), supplier_risk: round4(clamp01(1 - supplier.reliability_score)) };
      const score = Math.round(100 * (comps.severity * PRIORITY_WEIGHTS.severity + comps.urgency * PRIORITY_WEIGHTS.urgency + comps.service_impact * PRIORITY_WEIGHTS.service_impact + comps.supplier_risk * PRIORITY_WEIGHTS.supplier_risk) * 100) / 100;
      shN++;
      const shortageId = `SHORT-2026-${pad(shN, 6)}`;
      const nearPos = (poByPair.get(key) ?? []).filter((po) => Math.abs((poMeta.get(po.po_id)?.promisedWeek ?? 99) - start) <= 4).map((po) => po.po_id);
      // Candidate mitigations (cost vs service trade-off). Policy: lead time must fit before the shortage week (with a 3-day floor);
      // alt-supplier recovery is bounded by its weekly capacity; substitutes only when engineering-approved.
      const daysToShortage = Math.max(0, (start - AS_OF_WEEK) * 7);
      const options: Omit<Mitigation, 'mitigation_id'>[] = [];
      const cost = unitCost.get(p.sku) ?? 10; const weekDemand = Math.max(1, d[start - 1] as number);
      const svc = (rec: number) => round4(clamp01(1 - Math.max(0, deepest - rec) / Math.max(weekDemand, deepest)));
      const expLt = Math.max(3, Math.round(lt / 2)); const expRec = Math.min(deepest, cap);
      options.push({ shortage_id: shortageId, type: 'EXPEDITE', cost_usd: round2(expRec * cost * 0.18 + 250), lead_time_days: expLt, recovered_units: expRec, service_level_after: svc(expRec), policy_compliant: expLt <= Math.max(3, daysToShortage), policy_notes: expLt <= Math.max(3, daysToShortage) ? `Expedite fits before W${pad(start, 2)}.` : `Expedite lead time ${expLt}d exceeds ${daysToShortage}d available.` });
      const alt = alternate.get(p.sku) as string; const altCap = capOf.get(`${alt}|${p.sku}`)?.cap ?? 0; const altRec = Math.min(deepest, altCap);
      const altLt = Math.max(5, lt + int(-5, 10));
      options.push({ shortage_id: shortageId, type: 'ALT_SUPPLIER', cost_usd: round2(altRec * cost * 1.12), lead_time_days: altLt, recovered_units: altRec, service_level_after: svc(altRec), policy_compliant: altRec > 0 && altLt <= Math.max(5, daysToShortage + 7), policy_notes: `${alt} spare capacity ${altCap}/wk.` });
      const approvedSub = (subsBySku.get(p.sku) ?? []).find((s) => s.approved);
      if (approvedSub) { const rec = Math.round(deepest * 0.8); options.push({ shortage_id: shortageId, type: 'SUBSTITUTE', cost_usd: round2(rec * cost * 0.05), lead_time_days: 2, recovered_units: rec, service_level_after: svc(rec), policy_compliant: true, policy_notes: `Approved substitute ${approvedSub.substitute_sku_id}.` }); }
      const donor = (pairsBySku.get(p.sku) ?? []).filter((o) => o.loc !== p.loc).map((o) => ({ o, surplus: (closingOf.get(`${o.sku}|${o.loc}`) as number[])[start - 1] as number })).filter((x) => x.surplus > 0).sort((a, b) => b.surplus - a.surplus)[0];
      if (donor) { const rec = Math.min(deepest, Math.floor(donor.surplus * 0.5)); if (rec > 0) options.push({ shortage_id: shortageId, type: 'TRANSFER', cost_usd: round2(rec * 1.4 + 180), lead_time_days: 5, recovered_units: rec, service_level_after: svc(rec), policy_compliant: true, policy_notes: `Transfer surplus from ${donor.o.loc}.` }); }
      options.forEach((o, i) => mitigations.push({ mitigation_id: `MIT-${shortageId}-${pad(i + 1, 2)}`, ...o }));
      // Lifecycle: every shortage opens; near-term shortages with a compliant option move to MITIGATING (derived, not random).
      const hasCompliant = options.some((o) => o.policy_compliant);
      const status = hasCompliant && start <= AS_OF_WEEK + 4 ? 'MITIGATING' : 'OPEN';
      sevtN++; shortage_events.push({ event_id: `EVT-${pad(sevtN, 6)}`, entity_id: shortageId, from_status: null, to_status: 'OPEN', occurred_on: weekStartIso(AS_OF_WEEK), actor_role: 'SYSTEM' });
      if (status === 'MITIGATING') { sevtN++; shortage_events.push({ event_id: `EVT-${pad(sevtN, 6)}`, entity_id: shortageId, from_status: 'OPEN', to_status: 'MITIGATING', occurred_on: addDays(weekStartIso(AS_OF_WEEK), 1), actor_role: 'PLANNER' }); }
      shortages.push({ shortage_id: shortageId, sku_id: p.sku, location_id: p.loc, week: start, shortage_qty: deepest, cause_code: cause, priority_score: Math.min(100, score), priority_components: comps, lead_time_basis_days: lt, status, source_refs: { demand_id: `DEM-${p.sku}-${p.loc}-${weekTag(start)}`, po_ids: nearPos, supplier_id: sup } });
    }
  }
  // Shortage events use their own counter space after PO events to keep EVT ids globally unique.
  shortage_events.forEach((e, i) => { e.event_id = `EVT-${pad(evtN + i + 1, 6)}`; });

  // 14. Production plans for manufactured SKUs (planned vs capacity, status by week).
  const production_plans: ProductionPlan[] = []; let planN = 0;
  for (const sku of manufactured) for (const p of pairsBySku.get(sku) ?? []) for (let w = 2; w <= W && planN < 9999; w += 8) {
    planN++; const capacity = Math.round(p.base * 6); const planned = Math.round(capacity * (0.6 + rnd() * 0.55));
    production_plans.push({ plan_id: `PLAN-2026-${pad(planN, 4)}`, sku_id: sku, location_id: p.loc, week: w, planned_qty: Math.min(planned, capacity), capacity_qty: capacity, status: w < AS_OF_WEEK ? 'COMPLETED' : w < AS_OF_WEEK + 4 ? 'RELEASED' : planned > capacity ? 'HOLD' : 'PLANNED' });
  }

  // 15. Labelled edge cases, injected after the clean baseline. Each touches only its own record and is listed in ground_truth.
  const ground_truth: GroundTruthRecord[] = [];
  const k = cfg.anomaliesPerType; const used = new Set<string>();
  const sample = <T,>(arr: T[], idOf: (t: T) => string, filter: (t: T) => boolean = () => true): T[] => {
    const pool = arr.filter((t) => filter(t) && !used.has(idOf(t))); const out: T[] = [];
    while (out.length < k && pool.length > 0) { const t = pool.splice(Math.floor(rnd() * pool.length), 1)[0] as T; used.add(idOf(t)); out.push(t); }
    return out;
  };
  for (const r of sample(pab_weekly, (r) => `${r.sku_id}@${r.location_id}`, (r) => r.inbound > 0)) {
    r.inbound *= 2; // inbound counted twice while closing still reflects one receipt
    ground_truth.push({ issue_type: 'DOUBLE_COUNTED_INBOUND', record_ref: `${r.sku_id}@${r.location_id}:W${pad(r.week, 2)}`, expected_detection: 'PAB Weekly Reconciliation Check' });
  }
  for (const s of sample(sku_substitutes, (s) => `sub:${s.sku_id}`, (s) => !s.approved)) {
    const sh = shortages.find((x) => x.sku_id === s.sku_id && !used.has(x.shortage_id));
    if (!sh) continue; used.add(sh.shortage_id);
    const n = mitigations.filter((m) => m.shortage_id === sh.shortage_id).length + 1;
    const id = `MIT-${sh.shortage_id}-${pad(n, 2)}`;
    mitigations.push({ mitigation_id: id, shortage_id: sh.shortage_id, type: 'SUBSTITUTE', cost_usd: round2(sh.shortage_qty * 0.5), lead_time_days: 2, recovered_units: sh.shortage_qty, service_level_after: 1, policy_compliant: false, policy_notes: `Substitute ${s.substitute_sku_id} is NOT engineering-approved.` });
    ground_truth.push({ issue_type: 'UNAPPROVED_SUBSTITUTE', record_ref: id, expected_detection: 'Substitute Approval Policy Check' });
  }
  for (const sh of sample(shortages, (s) => s.shortage_id)) {
    const sup = supplierById.get(sh.source_refs.supplier_id) as Supplier;
    sh.shortage_qty = sup.capacity_per_week + int(50, 500); // allocation exceeds quoted weekly supplier capacity
    ground_truth.push({ issue_type: 'CAPACITY_EXCEEDED', record_ref: sh.shortage_id, expected_detection: 'Supplier Weekly Capacity Check' });
  }
  for (const sh of sample(shortages, (s) => s.shortage_id)) {
    sh.lead_time_basis_days = 0;
    ground_truth.push({ issue_type: 'NO_LEAD_TIME', record_ref: sh.shortage_id, expected_detection: 'Shortage Lead-Time Basis' });
  }
  for (const s of sample(skus, (s) => s.sku_id)) {
    s.uom = 'cases';
    ground_truth.push({ issue_type: 'UOM_MISMATCH', record_ref: s.sku_id, expected_detection: 'SKU Unit of Measure Consistency Check' });
  }

  return { seed, scale: scaleName, skus, locations, suppliers, sku_substitutes, bom, forecast_demand, inventory, supplier_capacity, lead_times, purchase_orders, po_events, pab_weekly, shortages, shortage_events, mitigations, production_plans, ground_truth };
}

export interface DetectedIssue { issue_type: GroundTruthRecord['issue_type']; record_ref: string }

/**
 * Rule-based anomaly detector. Reads only planning tables (never ground_truth) so it can be scored
 * against the separate labels for precision/recall.
 */
export function detectAnomalies(d: Pick<GeneratedDataset, 'pab_weekly' | 'mitigations' | 'shortages' | 'suppliers' | 'skus' | 'purchase_orders'>): DetectedIssue[] {
  const out: DetectedIssue[] = [];
  for (const r of d.pab_weekly) if (r.opening + r.inbound - r.demand !== r.closing) out.push({ issue_type: 'DOUBLE_COUNTED_INBOUND', record_ref: `${r.sku_id}@${r.location_id}:W${pad(r.week, 2)}` });
  for (const m of d.mitigations) if (m.type === 'SUBSTITUTE' && !m.policy_compliant) out.push({ issue_type: 'UNAPPROVED_SUBSTITUTE', record_ref: m.mitigation_id });
  const cap = new Map(d.suppliers.map((s) => [s.supplier_id, s.capacity_per_week]));
  for (const s of d.shortages) if (s.shortage_qty > (cap.get(s.source_refs.supplier_id) ?? Infinity)) out.push({ issue_type: 'CAPACITY_EXCEEDED', record_ref: s.shortage_id });
  for (const s of d.shortages) if (s.lead_time_basis_days <= 0) out.push({ issue_type: 'NO_LEAD_TIME', record_ref: s.shortage_id });
  const poUom = new Map<string, string>();
  for (const p of d.purchase_orders) poUom.set(p.sku_id, p.uom);
  for (const s of d.skus) if (s.uom !== 'units' || (poUom.has(s.sku_id) && poUom.get(s.sku_id) !== s.uom)) out.push({ issue_type: 'UOM_MISMATCH', record_ref: s.sku_id });
  return out;
}

/** Precision / recall of detected issues vs. ground-truth labels (matched on issue_type + record_ref). */
export function scoreDetection(detected: DetectedIssue[], truth: GroundTruthRecord[]) {
  const key = (x: DetectedIssue) => `${x.issue_type}|${x.record_ref}`;
  const t = new Set(truth.map(key)); const dset = new Set(detected.map(key));
  const tp = [...dset].filter((k) => t.has(k)).length;
  return { tp, fp: dset.size - tp, fn: t.size - tp, precision: dset.size ? tp / dset.size : 1, recall: t.size ? tp / t.size : 1 };
}
