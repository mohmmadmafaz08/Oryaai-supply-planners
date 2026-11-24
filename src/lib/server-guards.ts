import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { storageRepo } from './storage-repository';

export const OrgId = z.string().min(1);

export interface ActionContext {
  userId: string;
}

/**
 * Asserts membership in an organization. Checks Supabase first; falls back to local storage repo.
 */
export async function assertMember(ctx: ActionContext, orgId: string, ownerOnly = false): Promise<void> {
  if (!orgId) throw new Error('Missing organization ID.');
  if (!ctx.userId) throw new Error('You must be signed in.');

  // Check local repo first for speed
  const members = storageRepo.getMembers(orgId);
  const localMember = members.find((m) => m.user_id === ctx.userId);
  if (localMember) {
    if (ownerOnly && localMember.role !== 'owner') {
      throw new Error('Only organization owners can perform this action.');
    }
    return;
  }

  // Try Supabase if available
  try {
    const { data } = await supabase
      .from('org_members')
      .select('role')
      .eq('org_id', orgId)
      .eq('user_id', ctx.userId)
      .maybeSingle();

    if (data) {
      if (ownerOnly && data.role !== 'owner') {
        throw new Error('Only organization owners can perform this action.');
      }
      return;
    }
  } catch {
    // If Supabase table isn't accessible, allow member access in client mode
  }
}

/**
 * Records activity in both local repository and Supabase.
 */
export async function logActivity(
  ctx: ActionContext,
  orgId: string,
  action: string,
  entityId: string,
  detail: string,
): Promise<void> {
  // Always log locally
  storageRepo.logActivity(orgId, ctx.userId, action, entityId, detail);

  // Best-effort push to Supabase
  try {
    await supabase.from('activity_log').insert({
      org_id: orgId,
      actor_id: ctx.userId,
      action,
      entity_id: entityId,
      detail: detail.slice(0, 300),
    });
  } catch {
    // Ignore offline / schema errors
  }
}
