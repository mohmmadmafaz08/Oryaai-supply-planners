# Data dictionary & entity model

All IDs are deterministic, zero-padded and immutable. In the database every table is scoped by `org_id` (composite PK `(org_id, <id>)`), and every FK is composite so data never crosses organisations. Planning horizon: 52 ISO-style weeks starting Monday 2026-01-05. Status "as-of" date: start of week 5. Quantities are in base unit `units` unless noted.

## Entities

| Entity (table) | PK | Field | Type | Req | Allowed / units | Validation |
|---|---|---|---|---|---|---|
| SKU (`plan_skus`) | sku_id | sku_id | text | Y | `SKU-000001` | unique, regex |
| | | description | text | Y | | non-empty |
| | | uom | text | Y | `units` (baseline) | ≠ units ⇒ UOM_MISMATCH |
| Location (`plan_locations`) | location_id | location_id | text | Y | `LOC-<REGION>-NN`, region ∈ NA/EU/AP/LA/ME | unique, regex |
| | | name, region | text | Y | | |
| Supplier (`plan_suppliers`) | supplier_id | supplier_id | text | Y | `SUP-0001` | unique |
| | | reliability_score | numeric | Y | 0–1 | constrained suppliers 0.62–0.82 |
| | | capacity_per_week | int | Y | units/week | **derived** = Σ supplier_capacity |
| SkuSubstitute (`plan_sku_substitutes`, N:M bridge) | (sku_id, substitute_sku_id) | approved / approved_on | bool / date | Y / N | approved_on required iff approved | |
| BOM (`plan_bom`, N:M bridge) | (parent, component) | qty_per_parent | numeric | Y | > 0 | |
| ForecastDemand (`plan_forecast_demand`) | demand_id | demand_id | text | Y | `DEM-<sku>-<loc>-2026W01` | unique (sku,loc,week) |
| | | week | smallint | Y | 1–52 | |
| | | forecast_qty | int | Y | ≥ 0 units | seasonality × noise × spike |
| | | is_spike | bool | Y | ~3% of weeks, ×2.2–3.0 | |
| Inventory (`plan_inventory`) | inventory_id | on_hand_qty | int | Y | ≥ 0, 2–6 weeks cover | as_of_date = W1 |
| SupplierCapacity (`plan_supplier_capacity`) | capacity_id | capacity_per_week, min_order_qty | int | Y | ≥0, >0 | effective_to ≥ effective_from |
| LeadTime (`plan_lead_times`) | lead_time_id | lead_time_days | int | Y | 7–28 d (21–42 constrained) | |
| PurchaseOrder (`plan_purchase_orders`) | po_id | po_id | text | Y | `PO-2026-000001` | |
| | | ordered_qty | int | Y | > 0, ≥ MOQ | |
| | | order_date ≤ promised_date | date | Y | promised = order + lead time | CHECK |
| | | actual_receipt_date | date | N | only when RECEIVED | ≥ order_date |
| | | status | text | Y | DRAFT, CONFIRMED, SHIPPED, IN_TRANSIT, DELAYED, RECEIVED, CANCELLED | **derived** from dates vs as-of |
| | | transport_delay_days | int | Y | 0 or 7–21 | |
| PO event (`plan_po_events`) | event_id | from_status → to_status | text | Y | state machine below | history, never overwritten |
| ProductionPlan (`plan_production_plans`) | plan_id | planned_qty ≤ capacity_qty | int | Y | `PLAN-2026-0001` | status derived from week |
| Projected balance (`pab_weekly`, derived) | (sku, loc, week) | opening, inbound, demand, closing | int | Y | closing = opening + inbound − demand | reconciles weekly |
| Shortage (`plan_shortages`) | shortage_id | shortage_qty | int | Y | > 0, deepest deficit of a negative-balance run | `SHORT-2026-000001` |
| | | cause_code | text | Y | DEMAND_SPIKE, LATE_INBOUND, SUPPLIER_CAPACITY, LEAD_TIME_GAP | rule-derived |
| | | priority_score | numeric | Y | 0–100 | weighted components |
| | | lead_time_basis_days | int | Y | > 0 | 0 ⇒ NO_LEAD_TIME |
| | | demand_id, supplier_id | FK | Y | | |
| Shortage↔PO (`plan_shortage_po_refs`, N:M) | (shortage_id, po_id) | | | | POs promised within ±4 weeks | |
| Shortage event (`plan_shortage_events`) | event_id | OPEN → MITIGATING → RESOLVED | | | | history |
| MitigationOption (`plan_mitigation_options`) | mitigation_id | type | text | Y | EXPEDITE, ALT_SUPPLIER, SUBSTITUTE, TRANSFER | `MIT-<shortage>-01` |
| | | cost_usd, recovered_units, service_level_after, lead_time_days | | Y | cost vs service trade-off | recovered ≤ capacity |
| | | policy_compliant, policy_notes | bool, text | Y | | |
| Ground truth (`plan_ground_truth`) | (issue_type, record_ref) | expected_detection | text | Y | 5 issue types | **never an input feature** |

## Cardinality
Location 1:N ForecastDemand/Inventory/PO · SKU 1:N ForecastDemand/Inventory/PO/Shortage · Supplier 1:N SupplierCapacity/LeadTime/PO · SKU N:M SKU (substitutes, BOM) · Shortage N:M PurchaseOrder · Shortage 1:N MitigationOption · PO 1:N POEvent · Shortage 1:N ShortageEvent. Effective dates on capacity and lead times (`effective_to` NULL = open-ended).

## Lifecycles
PO: `null→DRAFT|CONFIRMED`, `DRAFT→CONFIRMED|CANCELLED`, `CONFIRMED→SHIPPED|DELAYED|CANCELLED`, `SHIPPED→IN_TRANSIT|DELAYED|RECEIVED`, `IN_TRANSIT→DELAYED|RECEIVED`, `DELAYED→IN_TRANSIT|RECEIVED|CANCELLED`.
Shortage: `null→OPEN`, `OPEN→MITIGATING|RESOLVED`, `MITIGATING→OPEN|RESOLVED`. Resolving requires an approved mitigation (enforced server-side).

## Derivation rules
1. **Replenishment**: reorder-point policy on the *baseline* forecast (spikes not foreseen): order when projected − need < 1.5 × need; qty = max(MOQ, need × cover); constrained suppliers short-ship to 75% of their capacity share.
2. **PAB**: closing = opening + inbound − demand; opening(n) = closing(n−1); inbound = POs arriving that week (promised + transport delay), cancelled excluded.
3. **Shortage**: one per contiguous run of negative closing balance; week = first negative week; qty = deepest deficit.
4. **Cause** (first match): spike in week or previous week → DEMAND_SPIKE; a delayed PO promised on/before but arriving after → LATE_INBOUND; primary capacity < SKU weekly demand or constrained supplier → SUPPLIER_CAPACITY; else LEAD_TIME_GAP.
5. **Priority** = 100 × (0.35 severity + 0.25 urgency + 0.25 service impact + 0.15 supplier risk); severity = qty / (2 × base weekly demand), urgency = 1 − (week−1)/51, service impact = qty / run demand, supplier risk = 1 − reliability.
6. **Mitigation policy**: expedite/alt lead time must fit before the shortage week; alt recovery ≤ alternate supplier capacity; substitutes only if engineering-approved; transfers ≤ 50% of a sister location's surplus.
7. **Shortage status**: MITIGATING if a compliant option exists and the shortage starts within 4 weeks of as-of; else OPEN.

## Injected edge cases (after the clean baseline)
| issue_type | Injection | Detection rule | record_ref |
|---|---|---|---|
| DOUBLE_COUNTED_INBOUND | PAB row inbound doubled, closing unchanged | opening + inbound − demand ≠ closing | `SKU@LOC:Www` |
| UNAPPROVED_SUBSTITUTE | SUBSTITUTE mitigation using an unapproved substitute | type = SUBSTITUTE ∧ ¬policy_compliant | mitigation_id |
| CAPACITY_EXCEEDED | shortage allocation set above supplier weekly capacity | shortage_qty > supplier.capacity_per_week | shortage_id |
| NO_LEAD_TIME | lead_time_basis_days set to 0 | lead_time_basis_days ≤ 0 | shortage_id |
| UOM_MISMATCH | SKU uom switched to `cases` while POs/PAB use units | sku.uom ≠ units or ≠ PO uom | sku_id |
