/**
 * High-performance local repository and cache for Oryva supply workbench.
 * Ensures instant reads, optimistic updates, and resilient offline/fallback operation.
 */

export interface ShortageStatusRecord {
  org_id: string;
  shortage_id: string;
  status: 'OPEN' | 'MITIGATING' | 'RESOLVED';
  updated_by: string;
  updated_at: string;
}

export interface ShortageCommentRecord {
  id: string;
  org_id: string;
  shortage_id: string;
  body: string;
  author_id: string;
  created_at: string;
}

export interface MitigationReviewRecord {
  org_id: string;
  mitigation_id: string;
  shortage_id: string;
  decision: 'APPROVED' | 'REJECTED';
  reason: string;
  decided_by: string;
  decided_at: string;
}

export interface SavedScenarioRecord {
  id: string;
  org_id: string;
  name: string;
  sku_id: string;
  location_id: string;
  params: Record<string, string>;
  created_by: string;
  created_at: string;
}

export interface ActivityLogRecord {
  id: string;
  org_id: string;
  actor_id: string;
  action: string;
  entity_id: string;
  detail: string;
  created_at: string;
}

export interface OrganizationRecord {
  id: string;
  name: string;
  join_code: string;
  created_at: string;
}

export interface OrgMemberRecord {
  org_id: string;
  user_id: string;
  role: 'owner' | 'member';
  joined_at: string;
}

const STORAGE_PREFIX = 'oryva_db_v1:';

function read<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : defaultValue;
  } catch (err) {
    console.warn(`[storage] Failed reading ${key}:`, err);
    return defaultValue;
  }
}

function write<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch (err) {
    console.warn(`[storage] Failed writing ${key}:`, err);
  }
}

// Initial demo organization constant
export const DEFAULT_DEMO_ORG: OrganizationRecord = {
  id: 'org_northwind_default',
  name: 'Northwind Supply Chain',
  join_code: 'NW-SUPPLY-2026',
  created_at: '2026-01-01T00:00:00.000Z',
};

export const storageRepo = {
  // Organizations
  getOrganizations(): OrganizationRecord[] {
    return read<OrganizationRecord[]>('organizations', []);
  },

  getOrganizationsForUser(userId: string): { id: string; name: string; join_code: string; role: 'owner' | 'member' }[] {
    if (!userId) return [];
    const allMembers = read<OrgMemberRecord[]>('org_members', []);
    const userMembers = allMembers.filter((m) => m.user_id === userId);
    if (userMembers.length === 0) return [];

    const allOrgs = read<OrganizationRecord[]>('organizations', []);
    const orgMap = new Map(allOrgs.map((o) => [o.id, o]));

    return userMembers.flatMap((m) => {
      const org = orgMap.get(m.org_id);
      if (!org) return [];
      return [
        {
          id: org.id,
          name: org.name,
          join_code: org.join_code,
          role: m.role,
        },
      ];
    });
  },

  seedDemoOrganization(userId: string): OrganizationRecord {
    const safeSuffix = userId.replace(/[^a-zA-Z0-9]/g, '_').slice(-8) || 'planner';
    const demoOrg: OrganizationRecord = {
      id: `org_demo_${safeSuffix}_${Date.now().toString(36)}`,
      name: 'Northwind Supply Chain (Demo)',
      join_code: `NW-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      created_at: new Date().toISOString(),
    };
    this.saveOrganization(demoOrg);
    this.addMember({
      org_id: demoOrg.id,
      user_id: userId,
      role: 'owner',
      joined_at: new Date().toISOString(),
    });
    return demoOrg;
  },

  getOrganization(id: string): OrganizationRecord | null {
    const orgs = this.getOrganizations();
    return orgs.find((o) => o.id === id) ?? null;
  },

  saveOrganization(org: OrganizationRecord): void {
    const orgs = read<OrganizationRecord[]>('organizations', []);
    const idx = orgs.findIndex((o) => o.id === org.id);
    if (idx >= 0) {
      orgs[idx] = org;
    } else {
      orgs.unshift(org);
    }
    write('organizations', orgs);
  },

  // Org Members
  getMembers(orgId: string): OrgMemberRecord[] {
    const all = read<OrgMemberRecord[]>('org_members', []);
    return all.filter((m) => m.org_id === orgId);
  },

  addMember(member: OrgMemberRecord): void {
    const all = read<OrgMemberRecord[]>('org_members', []);
    const existing = all.findIndex((m) => m.org_id === member.org_id && m.user_id === member.user_id);
    if (existing >= 0) {
      all[existing] = member;
    } else {
      all.push(member);
    }
    write('org_members', all);
  },

  removeMember(orgId: string, userId: string): void {
    const all = read<OrgMemberRecord[]>('org_members', []);
    write('org_members', all.filter((m) => !(m.org_id === orgId && m.user_id === userId)));
  },

  // Shortage Statuses
  getStatuses(orgId: string): ShortageStatusRecord[] {
    const all = read<ShortageStatusRecord[]>('shortage_statuses', []);
    return all.filter((s) => s.org_id === orgId);
  },

  saveStatus(record: ShortageStatusRecord): void {
    const all = read<ShortageStatusRecord[]>('shortage_statuses', []);
    const idx = all.findIndex((s) => s.org_id === record.org_id && s.shortage_id === record.shortage_id);
    if (idx >= 0) {
      all[idx] = record;
    } else {
      all.push(record);
    }
    write('shortage_statuses', all);
  },

  // Comments
  getComments(orgId: string, shortageId: string): ShortageCommentRecord[] {
    const all = read<ShortageCommentRecord[]>('shortage_comments', []);
    return all
      .filter((c) => c.org_id === orgId && c.shortage_id === shortageId)
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
  },

  addComment(record: ShortageCommentRecord): void {
    const all = read<ShortageCommentRecord[]>('shortage_comments', []);
    all.push(record);
    write('shortage_comments', all);
  },

  deleteComment(id: string): void {
    const all = read<ShortageCommentRecord[]>('shortage_comments', []);
    write('shortage_comments', all.filter((c) => c.id !== id));
  },

  // Mitigation Reviews
  getDecisions(orgId: string): MitigationReviewRecord[] {
    const all = read<MitigationReviewRecord[]>('mitigation_reviews', []);
    return all.filter((r) => r.org_id === orgId);
  },

  saveDecision(record: MitigationReviewRecord): void {
    const all = read<MitigationReviewRecord[]>('mitigation_reviews', []);
    const idx = all.findIndex((r) => r.org_id === record.org_id && r.mitigation_id === record.mitigation_id);
    if (idx >= 0) {
      all[idx] = record;
    } else {
      all.push(record);
    }
    write('mitigation_reviews', all);
  },

  deleteDecision(orgId: string, mitigationId: string): void {
    const all = read<MitigationReviewRecord[]>('mitigation_reviews', []);
    write('mitigation_reviews', all.filter((r) => !(r.org_id === orgId && r.mitigation_id === mitigationId)));
  },

  // Scenarios
  getScenarios(orgId: string): SavedScenarioRecord[] {
    const all = read<SavedScenarioRecord[]>('saved_scenarios', []);
    return all.filter((s) => s.org_id === orgId).sort((a, b) => b.created_at.localeCompare(a.created_at));
  },

  saveScenario(record: SavedScenarioRecord): void {
    const all = read<SavedScenarioRecord[]>('saved_scenarios', []);
    const idx = all.findIndex((s) => s.id === record.id);
    if (idx >= 0) {
      all[idx] = record;
    } else {
      all.unshift(record);
    }
    write('saved_scenarios', all);
  },

  deleteScenario(id: string): void {
    const all = read<SavedScenarioRecord[]>('saved_scenarios', []);
    write('saved_scenarios', all.filter((s) => s.id !== id));
  },

  // Activity Log
  getActivity(orgId: string, limit = 100): ActivityLogRecord[] {
    const all = read<ActivityLogRecord[]>('activity_log', []);
    return all
      .filter((a) => a.org_id === orgId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, limit);
  },

  logActivity(orgId: string, actorId: string, action: string, entityId: string, detail: string): void {
    const all = read<ActivityLogRecord[]>('activity_log', []);
    all.unshift({
      id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      org_id: orgId,
      actor_id: actorId,
      action,
      entity_id: entityId,
      detail: detail.slice(0, 300),
      created_at: new Date().toISOString(),
    });
    if (all.length > 500) all.length = 500;
    write('activity_log', all);
  },

  // Uploaded datasets cache
  getUploadedDatasets(orgId: string): Record<string, unknown[]> {
    return read<Record<string, unknown[]>>(`datasets:${orgId}`, {});
  },

  saveUploadedDataset(orgId: string, kind: string, rows: unknown[]): void {
    const ds = this.getUploadedDatasets(orgId);
    ds[kind] = rows;
    write(`datasets:${orgId}`, ds);
  },

  resetUploadedDataset(orgId: string, kind: string): void {
    const ds = this.getUploadedDatasets(orgId);
    delete ds[kind];
    write(`datasets:${orgId}`, ds);
  },

  // Generator summary
  getLastGenerationRun(orgId: string): Record<string, unknown> | null {
    return read<Record<string, unknown> | null>(`gen_run:${orgId}`, null);
  },

  saveGenerationRun(orgId: string, run: Record<string, unknown>): void {
    write(`gen_run:${orgId}`, run);
  },
};
