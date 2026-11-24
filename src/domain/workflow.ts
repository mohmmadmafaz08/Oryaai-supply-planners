import type { Shortage, ShortageStatus } from '@/data/schemas';

export interface WorkflowOverride {
  shortage_id: string;
  status: ShortageStatus;
}

/** Overlays team-edited statuses (stored in the backend) on top of the planning dataset. */
export function mergeWorkflowStatus(base: Shortage[], overrides: WorkflowOverride[]): Shortage[] {
  if (overrides.length === 0) return base;
  const map = new Map(overrides.map((o) => [o.shortage_id, o.status]));
  return base.map((s) => {
    const status = map.get(s.shortage_id);
    return status ? { ...s, status } : s;
  });
}

/**
 * Business rule: a shortage can only be marked RESOLVED once a recovery action has been approved.
 * Returns an error message, or null when the change is allowed.
 */
export function validateStatusChange(
  next: ShortageStatus,
  approvedMitigationCount: number,
): string | null {
  if (next === 'RESOLVED' && approvedMitigationCount < 1) {
    return 'Approve at least one mitigation before resolving this shortage.';
  }
  return null;
}
