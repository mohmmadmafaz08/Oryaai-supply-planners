import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { DATASET_KINDS } from '@/data/datasets';
import {
  DEFAULT_SEED,
  detectAnomalies,
  generateDataset,
  scoreDetection,
  type GeneratedDataset,
} from '@/generator/generate';
import { OrgId, assertMember, logActivity } from './server-guards';
import { storageRepo } from './storage-repository';

const CHUNK = 1000;

function getFallbackUserId(): string {
  if (typeof window !== 'undefined') {
    try {
      const clerkId = localStorage.getItem('oryva_clerk_user_id');
      if (clerkId) return clerkId;
      const demo = localStorage.getItem('oryva_demo_user_auth');
      if (demo) return JSON.parse(demo).id;
    } catch {
      // ignore
    }
  }
  return 'usr_planner_guest';
}

async function sha256(text: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  return 'sha256_mock';
}

function relationalRows(orgId: string, d: GeneratedDataset): [string, Record<string, unknown>[]][] {
  const o = { org_id: orgId };
  return [
    ['plan_locations', d.locations.map((r) => ({ ...o, ...r }))],
    ['plan_suppliers', d.suppliers.map((r) => ({ ...o, ...r }))],
    ['plan_skus', d.skus.map((r) => ({ ...o, sku_id: r.sku_id, description: r.description, uom: r.uom }))],
    ['plan_sku_substitutes', d.sku_substitutes.map((r) => ({ ...o, ...r }))],
    ['plan_bom', d.bom.map((r) => ({ ...o, ...r }))],
    ['plan_forecast_demand', d.forecast_demand.map((r) => ({ ...o, ...r }))],
    ['plan_inventory', d.inventory.map((r) => ({ ...o, ...r }))],
    ['plan_supplier_capacity', d.supplier_capacity.map((r) => ({ ...o, ...r }))],
    ['plan_lead_times', d.lead_times.map((r) => ({ ...o, ...r }))],
    ['plan_purchase_orders', d.purchase_orders.map((r) => ({ ...o, ...r }))],
    [
      'plan_po_events',
      d.po_events.map((r) => ({
        ...o,
        event_id: r.event_id,
        po_id: r.entity_id,
        from_status: r.from_status,
        to_status: r.to_status,
        occurred_on: r.occurred_on,
        actor_role: r.actor_role,
      })),
    ],
    ['plan_production_plans', d.production_plans.map((r) => ({ ...o, ...r }))],
    [
      'plan_shortages',
      d.shortages.map((r) => ({
        ...o,
        shortage_id: r.shortage_id,
        sku_id: r.sku_id,
        location_id: r.location_id,
        week: r.week,
        shortage_qty: r.shortage_qty,
        cause_code: r.cause_code,
        priority_score: r.priority_score,
        priority_components: r.priority_components,
        lead_time_basis_days: r.lead_time_basis_days,
        status: r.status,
        demand_id: r.source_refs.demand_id,
        supplier_id: r.source_refs.supplier_id,
      })),
    ],
    [
      'plan_shortage_po_refs',
      d.shortages.flatMap((r) => r.source_refs.po_ids.map((po_id) => ({ ...o, shortage_id: r.shortage_id, po_id }))),
    ],
    [
      'plan_shortage_events',
      d.shortage_events.map((r) => ({
        ...o,
        event_id: r.event_id,
        shortage_id: r.entity_id,
        from_status: r.from_status,
        to_status: r.to_status,
        occurred_on: r.occurred_on,
        actor_role: r.actor_role,
      })),
    ],
    ['plan_mitigation_options', d.mitigations.map((r) => ({ ...o, ...r }))],
    ['plan_ground_truth', d.ground_truth.map((r) => ({ ...o, ...r }))],
  ];
}

export interface GenerateWorkspaceDataInput {
  orgId: string;
  seed?: number;
  userId?: string;
}

export async function generateWorkspaceData(
  input: { data: GenerateWorkspaceDataInput } | GenerateWorkspaceDataInput,
) {
  const data = 'data' in input ? input.data : input;
  const parsed = z
    .object({
      orgId: OrgId,
      seed: z.number().int().min(1).max(2_147_483_647).default(DEFAULT_SEED),
      userId: z.string().optional(),
    })
    .parse(data);

  const ctx = { userId: parsed.userId || getFallbackUserId() };
  await assertMember(ctx, parsed.orgId, true);

  const d = generateDataset('starter', parsed.seed);

  // Cache generated datasets locally
  for (const kind of DATASET_KINDS) {
    if (d[kind]) {
      storageRepo.saveUploadedDataset(parsed.orgId, kind, d[kind] as unknown[]);
    }
  }

  const rowCounts: Record<string, number> = {};
  const checksums: Record<string, string> = {};
  for (const [k, v] of Object.entries(d)) {
    if (Array.isArray(v)) {
      rowCounts[k] = v.length;
      checksums[`${k}.json`] = await sha256(JSON.stringify(v));
    }
  }

  const detection = scoreDetection(detectAnomalies(d), d.ground_truth);
  const now = new Date().toISOString();

  const runSummary = {
    seed: parsed.seed,
    scale: 'starter',
    detection,
    created_at: now,
    checksums,
    row_counts: rowCounts,
  };
  storageRepo.saveGenerationRun(parsed.orgId, runSummary);

  // Attempt to load into Supabase tables if reachable
  try {
    for (const t of ['plan_skus', 'plan_locations', 'plan_suppliers', 'plan_ground_truth'] as const) {
      await supabase.from(t).delete().eq('org_id', parsed.orgId);
    }
    for (const [table, rows] of relationalRows(parsed.orgId, d)) {
      for (let i = 0; i < rows.length; i += CHUNK) {
        await supabase.from(table as any).insert(rows.slice(i, i + CHUNK) as never);
      }
    }
    await supabase.from('org_datasets').upsert(
      DATASET_KINDS.map((kind) => ({
        org_id: parsed.orgId,
        kind,
        payload: d[kind] as any,
        row_count: d[kind].length,
        uploaded_by: ctx.userId,
        uploaded_at: now,
      })),
    );
    await supabase.from('plan_generation_runs').insert({
      org_id: parsed.orgId,
      seed: parsed.seed,
      scale: 'starter',
      row_counts: rowCounts,
      checksums,
      detection,
      created_by: ctx.userId,
    });
  } catch (err) {
    console.warn('[generator] Supabase relational load deferred to local store:', err);
  }

  await logActivity(
    ctx,
    parsed.orgId,
    'DATA_GENERATED',
    `seed ${parsed.seed}`,
    `${d.shortages.length} shortages, ${d.purchase_orders.length} POs`,
  );

  return { rowCounts, detection, seed: parsed.seed };
}

export interface GetDatabaseSummaryInput {
  orgId: string;
}

export async function getDatabaseSummary(
  input: { data: GetDatabaseSummaryInput } | GetDatabaseSummaryInput,
) {
  const data = 'data' in input ? input.data : input;
  const parsed = z.object({ orgId: OrgId }).parse(data);

  const lastLocalRun = storageRepo.getLastGenerationRun(parsed.orgId);
  const localDatasets = storageRepo.getUploadedDatasets(parsed.orgId);

  const tables = [
    'skus',
    'locations',
    'suppliers',
    'forecast_demand',
    'inventory',
    'supplier_capacity',
    'lead_times',
    'purchase_orders',
    'po_events',
    'production_plans',
    'shortages',
    'shortage_events',
    'mitigation_options',
    'ground_truth',
  ] as const;

  let counts = tables.map((t) => {
    const dsKey = t === 'mitigation_options' ? 'mitigations' : t;
    const rows = (localDatasets[dsKey] as unknown[])?.length ?? 0;
    return { table: t, rows };
  });

  let lastRun = lastLocalRun;

  try {
    const { data: run } = await supabase
      .from('plan_generation_runs')
      .select('seed, scale, detection, created_at, checksums')
      .eq('org_id', parsed.orgId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (run) lastRun = run;

    const remoteCounts = await Promise.all(
      tables.map(async (t) => {
        const { count } = await supabase
          .from(`plan_${t}` as any)
          .select('*', { count: 'exact', head: true })
          .eq('org_id', parsed.orgId);
        return { table: t, rows: count ?? 0 };
      }),
    );

    if (remoteCounts.some((c) => c.rows > 0)) {
      counts = remoteCounts;
    }
  } catch {
    // Return local counts
  }

  return { counts, lastRun: lastRun ?? null };
}
