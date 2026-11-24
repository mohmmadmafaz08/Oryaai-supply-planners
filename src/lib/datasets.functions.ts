import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { DATASETS, DATASET_KINDS, validateDataset, type DatasetKind } from '@/data/datasets';
import { OrgId, assertMember, logActivity } from './server-guards';
import { storageRepo } from './storage-repository';

const Kind = z.enum(DATASET_KINDS);

export interface UploadDatasetInput {
  orgId: string;
  kind: DatasetKind;
  rows: unknown;
  userId?: string;
}

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

export async function uploadDataset(input: { data: UploadDatasetInput } | UploadDatasetInput) {
  const data = 'data' in input ? input.data : input;
  const parsed = z
    .object({
      orgId: OrgId,
      kind: Kind,
      rows: z.unknown(),
      userId: z.string().optional(),
    })
    .parse(data);

  const ctx = { userId: parsed.userId || getFallbackUserId() };
  await assertMember(ctx, parsed.orgId, true);

  const result = validateDataset(parsed.kind, parsed.rows);
  if (!result.ok) {
    throw new Error(`${DATASETS[parsed.kind].label}: ${result.error}`);
  }

  // Save to local repo for immediate offline/local availability
  storageRepo.saveUploadedDataset(parsed.orgId, parsed.kind, result.rows);

  const now = new Date().toISOString();
  try {
    await supabase.from('org_datasets').upsert({
      org_id: parsed.orgId,
      kind: parsed.kind,
      payload: result.rows as any,
      row_count: result.rows.length,
      uploaded_by: ctx.userId,
      uploaded_at: now,
    });
  } catch (err) {
    console.warn('[datasets] Supabase dataset upsert deferred:', err);
  }

  await logActivity(
    ctx,
    parsed.orgId,
    'DATASET_UPLOADED',
    DATASETS[parsed.kind].label,
    `${result.rows.length} rows`,
  );

  return { rows: result.rows.length };
}

export interface ResetDatasetInput {
  orgId: string;
  kind: DatasetKind;
  userId?: string;
}

export async function resetDataset(input: { data: ResetDatasetInput } | ResetDatasetInput) {
  const data = 'data' in input ? input.data : input;
  const parsed = z
    .object({
      orgId: OrgId,
      kind: Kind,
      userId: z.string().optional(),
    })
    .parse(data);

  const ctx = { userId: parsed.userId || getFallbackUserId() };
  await assertMember(ctx, parsed.orgId, true);

  storageRepo.resetUploadedDataset(parsed.orgId, parsed.kind);

  try {
    await supabase
      .from('org_datasets')
      .delete()
      .eq('org_id', parsed.orgId)
      .eq('kind', parsed.kind);
  } catch (err) {
    console.warn('[datasets] Supabase dataset delete deferred:', err);
  }

  await logActivity(
    ctx,
    parsed.orgId,
    'DATASET_RESET',
    DATASETS[parsed.kind].label,
    'Reverted to sample data',
  );

  return { ok: true };
}
