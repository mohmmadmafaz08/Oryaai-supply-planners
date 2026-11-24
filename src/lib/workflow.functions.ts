import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { validateStatusChange } from '@/domain/workflow';
import { OrgId, assertMember, logActivity, type ActionContext } from './server-guards';
import { storageRepo } from './storage-repository';

const ShortageId = z.string().regex(/^SHORT-\d{4}-\d{6}$/);
const MitigationId = z.string().regex(/^MIT-SHORT-\d{4}-\d{6}-\d{2}$/);

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

function resolveContext(explicitUserId?: string): ActionContext {
  return { userId: explicitUserId || getFallbackUserId() };
}

async function approvedCount(orgId: string, shortageId: string): Promise<number> {
  const localReviews = storageRepo.getDecisions(orgId);
  const localApproved = localReviews.filter(
    (r) => r.shortage_id === shortageId && r.decision === 'APPROVED',
  ).length;

  try {
    const { count, error } = await supabase
      .from('mitigation_reviews')
      .select('mitigation_id', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('shortage_id', shortageId)
      .eq('decision', 'APPROVED');
    if (!error && count !== null && count !== undefined) {
      return Math.max(count, localApproved);
    }
  } catch {
    // fallback
  }
  return localApproved;
}

export interface ShortageStatusInput {
  orgId: string;
  shortageId: string;
  status: 'OPEN' | 'MITIGATING' | 'RESOLVED';
  userId?: string;
}

export async function updateShortageStatus(input: { data: ShortageStatusInput } | ShortageStatusInput) {
  const data = 'data' in input ? input.data : input;
  const parsed = z
    .object({
      orgId: OrgId,
      shortageId: ShortageId,
      status: z.enum(['OPEN', 'MITIGATING', 'RESOLVED']),
      userId: z.string().optional(),
    })
    .parse(data);

  const ctx = resolveContext(parsed.userId);
  await assertMember(ctx, parsed.orgId);

  const appCount = await approvedCount(parsed.orgId, parsed.shortageId);
  const rule = validateStatusChange(parsed.status, appCount);
  if (rule) throw new Error(rule);

  const now = new Date().toISOString();

  // Save to local repository
  storageRepo.saveStatus({
    org_id: parsed.orgId,
    shortage_id: parsed.shortageId,
    status: parsed.status,
    updated_by: ctx.userId,
    updated_at: now,
  });

  // Save to Supabase
  try {
    await supabase.from('shortage_status').upsert({
      org_id: parsed.orgId,
      shortage_id: parsed.shortageId,
      status: parsed.status,
      updated_by: ctx.userId,
      updated_at: now,
    });
  } catch (err) {
    console.warn('[workflow] Supabase status sync deferred:', err);
  }

  await logActivity(ctx, parsed.orgId, 'STATUS_CHANGED', parsed.shortageId, `Status set to ${parsed.status}`);
  return { ok: true };
}

export interface AddCommentInput {
  orgId: string;
  shortageId: string;
  body: string;
  userId?: string;
}

export async function addComment(input: { data: AddCommentInput } | AddCommentInput) {
  const data = 'data' in input ? input.data : input;
  const parsed = z
    .object({
      orgId: OrgId,
      shortageId: ShortageId,
      body: z.string().trim().min(1).max(2000),
      userId: z.string().optional(),
    })
    .parse(data);

  const ctx = resolveContext(parsed.userId);
  await assertMember(ctx, parsed.orgId);

  const commentRecord = {
    id: `com_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    org_id: parsed.orgId,
    shortage_id: parsed.shortageId,
    body: parsed.body,
    author_id: ctx.userId,
    created_at: new Date().toISOString(),
  };

  storageRepo.addComment(commentRecord);

  try {
    await supabase.from('shortage_comments').insert({
      org_id: parsed.orgId,
      shortage_id: parsed.shortageId,
      body: parsed.body,
      author_id: ctx.userId,
    });
  } catch (err) {
    console.warn('[workflow] Supabase comment sync deferred:', err);
  }

  await logActivity(ctx, parsed.orgId, 'COMMENT_ADDED', parsed.shortageId, parsed.body.slice(0, 120));
  return { ok: true, id: commentRecord.id };
}

export interface DeleteCommentInput {
  id: string;
}

export async function deleteComment(input: { data: DeleteCommentInput } | DeleteCommentInput) {
  const data = 'data' in input ? input.data : input;
  const parsed = z.object({ id: z.string().min(1) }).parse(data);

  storageRepo.deleteComment(parsed.id);

  try {
    await supabase.from('shortage_comments').delete().eq('id', parsed.id);
  } catch (err) {
    console.warn('[workflow] Supabase delete comment deferred:', err);
  }

  return { ok: true };
}

export interface DecideMitigationInput {
  orgId: string;
  mitigationId: string;
  shortageId: string;
  decision: 'APPROVED' | 'REJECTED';
  reason: string;
  userId?: string;
}

export async function decideMitigation(input: { data: DecideMitigationInput } | DecideMitigationInput) {
  const data = 'data' in input ? input.data : input;
  const parsed = z
    .object({
      orgId: OrgId,
      mitigationId: MitigationId,
      shortageId: ShortageId,
      decision: z.enum(['APPROVED', 'REJECTED']),
      reason: z.string().trim().max(500),
      userId: z.string().optional(),
    })
    .refine((d) => d.mitigationId.includes(d.shortageId), 'Mitigation does not belong to shortage')
    .parse(data);

  const ctx = resolveContext(parsed.userId);
  await assertMember(ctx, parsed.orgId);

  const now = new Date().toISOString();
  storageRepo.saveDecision({
    org_id: parsed.orgId,
    mitigation_id: parsed.mitigationId,
    shortage_id: parsed.shortageId,
    decision: parsed.decision,
    reason: parsed.reason,
    decided_by: ctx.userId,
    decided_at: now,
  });

  try {
    await supabase.from('mitigation_reviews').upsert({
      org_id: parsed.orgId,
      mitigation_id: parsed.mitigationId,
      shortage_id: parsed.shortageId,
      decision: parsed.decision,
      reason: parsed.reason,
      decided_by: ctx.userId,
      decided_at: now,
    });
  } catch (err) {
    console.warn('[workflow] Supabase decision sync deferred:', err);
  }

  await logActivity(
    ctx,
    parsed.orgId,
    parsed.decision === 'APPROVED' ? 'MITIGATION_APPROVED' : 'MITIGATION_REJECTED',
    parsed.mitigationId,
    parsed.reason || parsed.decision,
  );

  return { ok: true };
}

export interface ClearDecisionInput {
  orgId: string;
  mitigationId: string;
  userId?: string;
}

export async function clearDecision(input: { data: ClearDecisionInput } | ClearDecisionInput) {
  const data = 'data' in input ? input.data : input;
  const parsed = z
    .object({
      orgId: OrgId,
      mitigationId: MitigationId,
      userId: z.string().optional(),
    })
    .parse(data);

  const ctx = resolveContext(parsed.userId);
  await assertMember(ctx, parsed.orgId);

  storageRepo.deleteDecision(parsed.orgId, parsed.mitigationId);

  try {
    await supabase
      .from('mitigation_reviews')
      .delete()
      .eq('org_id', parsed.orgId)
      .eq('mitigation_id', parsed.mitigationId);
  } catch (err) {
    console.warn('[workflow] Supabase clear decision deferred:', err);
  }

  await logActivity(ctx, parsed.orgId, 'MITIGATION_REVIEW_CLEARED', parsed.mitigationId, 'Decision reset');
  return { ok: true };
}

export interface SaveScenarioInput {
  orgId: string;
  name: string;
  skuId: string;
  locationId: string;
  params: Record<string, string>;
  userId?: string;
}

export async function saveScenario(input: { data: SaveScenarioInput } | SaveScenarioInput) {
  const data = 'data' in input ? input.data : input;
  const parsed = z
    .object({
      orgId: OrgId,
      name: z.string().trim().min(1).max(80),
      skuId: z.string().min(1),
      locationId: z.string().min(1),
      params: z.record(z.string()),
      userId: z.string().optional(),
    })
    .parse(data);

  const ctx = resolveContext(parsed.userId);
  await assertMember(ctx, parsed.orgId);

  const scenarioRecord = {
    id: `scen_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    org_id: parsed.orgId,
    name: parsed.name,
    sku_id: parsed.skuId,
    location_id: parsed.locationId,
    params: parsed.params,
    created_by: ctx.userId,
    created_at: new Date().toISOString(),
  };

  storageRepo.saveScenario(scenarioRecord);

  try {
    await supabase.from('saved_scenarios').insert(scenarioRecord);
  } catch (err) {
    console.warn('[workflow] Supabase scenario sync deferred:', err);
  }

  await logActivity(ctx, parsed.orgId, 'SCENARIO_SAVED', scenarioRecord.id, parsed.name);
  return { ok: true, id: scenarioRecord.id };
}

export interface DeleteScenarioInput {
  id: string;
  userId?: string;
}

export async function deleteScenario(input: { data: DeleteScenarioInput } | DeleteScenarioInput) {
  const data = 'data' in input ? input.data : input;
  const parsed = z.object({ id: z.string().min(1) }).parse(data);

  storageRepo.deleteScenario(parsed.id);

  try {
    await supabase.from('saved_scenarios').delete().eq('id', parsed.id);
  } catch (err) {
    console.warn('[workflow] Supabase delete scenario deferred:', err);
  }

  return { ok: true };
}
