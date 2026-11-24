import type {
  BomItem,
  ForecastDemandRow,
  InventoryRow,
  Mitigation,
  PurchaseOrder,
  Shortage,
  Sku,
  SkuSubstitute,
  Supplier,
} from '@/data/schemas';

const MAX_CHARS = 28_000;

export interface CopilotContextInput {
  orgName: string;
  shortages: Shortage[];
  mitigations: Mitigation[];
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  skus?: Sku[];
  inventory?: InventoryRow[];
  forecastDemand?: ForecastDemandRow[];
  bom?: BomItem[];
  substitutes?: SkuSubstitute[];
  focusShortageId?: string;
  mode?: 'action_plan' | 'root_cause' | 'cost_optimizer' | 'executive' | 'general';
}

/**
 * Builds an enriched domain-grounded knowledge base for the AI Copilot.
 * Encodes all supply chain relationships: SKUs, Suppliers, BOM, PO delays,
 * Inventory, Forecasts, Shortages, and Mitigations.
 */
export function buildCopilotContext(input: CopilotContextInput): string {
  const shortages = [...input.shortages].sort((a, b) => b.priority_score - a.priority_score);
  const open = shortages.filter((s) => s.status !== 'RESOLVED');
  const mitigating = shortages.filter((s) => s.status === 'MITIGATING');
  const resolved = shortages.filter((s) => s.status === 'RESOLVED');
  const totalShortageQty = open.reduce((sum, s) => sum + s.shortage_qty, 0);

  const lines: string[] = [
    `=== ORYVA WORKSPACE KNOWLEDGE BASE ===`,
    `Organization: ${input.orgName}`,
    `System Mode: ${input.mode || 'general'}`,
    `Summary: ${shortages.length} total shortages (${open.length} OPEN, ${mitigating.length} MITIGATING, ${resolved.length} RESOLVED).`,
    `Total Units at Risk: ${totalShortageQty.toLocaleString()} units.`,
  ];

  if (input.focusShortageId) {
    lines.push(`TARGET FOCUS SHORTAGE: ${input.focusShortageId}`);
  }

  // 1. SHORTAGES TABLE
  lines.push('\n[SHORTAGES] (id|sku|location|week|qty|cause|priority_score|status|supplier|po_ids):');
  for (const s of shortages.slice(0, 30)) {
    lines.push(
      [
        s.shortage_id,
        s.sku_id,
        s.location_id,
        `W${s.week}`,
        s.shortage_qty,
        s.cause_code,
        s.priority_score.toFixed(1),
        s.status,
        s.source_refs.supplier_id,
        s.source_refs.po_ids.join(','),
      ].join('|'),
    );
  }

  // 2. MITIGATION OPTIONS
  const focus = input.focusShortageId;
  const mits = focus ? input.mitigations.filter((m) => m.shortage_id === focus) : input.mitigations;
  const compliantCount = mits.filter((m) => m.policy_compliant).length;
  lines.push(`\n[MITIGATIONS] (total: ${mits.length}, compliant: ${compliantCount})`);
  lines.push('(id|shortage|type|cost_usd|lead_days|recovered_units|service_after|policy_ok|notes):');
  for (const m of mits.slice(0, 45)) {
    lines.push(
      [
        m.mitigation_id,
        m.shortage_id,
        m.type,
        m.cost_usd,
        m.lead_time_days,
        m.recovered_units,
        m.service_level_after.toFixed(3),
        m.policy_compliant,
        m.policy_notes.slice(0, 60),
      ].join('|'),
    );
  }

  // 3. SUPPLIER NETWORK & BOTTLENECKS
  lines.push('\n[SUPPLIERS] (id|name|reliability|capacity_per_week):');
  for (const s of input.suppliers) {
    lines.push([s.supplier_id, s.name, s.reliability_score.toFixed(2), s.capacity_per_week].join('|'));
  }

  // 4. DELAYED PURCHASE ORDERS & TRANSIT RISKS
  const delayed = input.purchaseOrders.filter((p) => p.status === 'DELAYED' || p.transport_delay_days > 0);
  lines.push(`\n[DELAYED_PURCHASE_ORDERS] (${delayed.length} delayed POs in pipeline):`);
  lines.push('(id|supplier|sku|location|qty|promised|status|delay_days):');
  for (const p of delayed.slice(0, 25)) {
    lines.push(
      [
        p.po_id,
        p.supplier_id,
        p.sku_id,
        p.location_id,
        p.ordered_qty,
        p.promised_date,
        p.status,
        p.transport_delay_days,
      ].join('|'),
    );
  }

  // 5. SKU & INVENTORY INSIGHTS (if provided)
  if (input.skus && input.skus.length > 0) {
    lines.push(`\n[SKU_CATALOG] (${input.skus.length} active SKUs):`);
    for (const sk of input.skus.slice(0, 15)) {
      lines.push([sk.sku_id, sk.description, sk.uom].join('|'));
    }
  }

  if (input.substitutes && input.substitutes.length > 0) {
    lines.push(`\n[APPROVED_SUBSTITUTES]:`);
    for (const sub of input.substitutes.slice(0, 15)) {
      lines.push(`${sub.sku_id} -> ${sub.substitute_sku_id} (Approved: ${sub.approved})`);
    }
  }

  const text = lines.join('\n');
  return text.length > MAX_CHARS ? `${text.slice(0, MAX_CHARS)}\n[grounding truncated for token budget]` : text;
}
