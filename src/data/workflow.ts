import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Shortage, ShortageStatus } from './schemas';
import { mergeWorkflowStatus } from '@/domain/workflow';
import { getCurrentOrgId, requireOrgId } from '@/lib/org-store';
import { storageRepo } from '@/lib/storage-repository';
import { useAuth } from '@/integrations/clerk';
import {
  addComment,
  clearDecision,
  decideMitigation,
  deleteComment,
  deleteScenario,
  saveScenario,
  updateShortageStatus,
} from '@/lib/workflow.functions';

export const WORKFLOW_KEYS = {
  workflow: ['wf', 'workflow'] as const,
  comments: (id: string) => ['wf', 'comments', id] as const,
  decisions: ['wf', 'decisions'] as const,
  scenarios: ['wf', 'scenarios'] as const,
  activity: ['wf', 'activity'] as const,
  profiles: ['wf', 'profiles'] as const,
};

/** Reads team status overrides from Supabase and local cache, and applies them to the dataset. */
export async function applyWorkflowOverrides(base: Shortage[]): Promise<Shortage[]> {
  const orgId = getCurrentOrgId();
  if (!orgId) return base;

  try {
    const { data, error } = await supabase.from('shortage_status').select('shortage_id,status').eq('org_id', orgId);
    if (!error && data) {
      return mergeWorkflowStatus(
        base,
        data.map((r) => ({ shortage_id: r.shortage_id, status: r.status as ShortageStatus })),
      );
    }
  } catch {
    // fallback to local
  }

  const localStatuses = storageRepo.getStatuses(orgId);
  if (localStatuses.length > 0) {
    return mergeWorkflowStatus(
      base,
      localStatuses.map((r) => ({ shortage_id: r.shortage_id, status: r.status as ShortageStatus })),
    );
  }

  return base;
}

export function useProfiles() {
  return useQuery({
    queryKey: WORKFLOW_KEYS.profiles,
    queryFn: async () => {
      const defaultProfiles = new Map<string, string>([
        ['usr_clerk_planner_demo_01', 'Lead Supply Planner'],
        ['usr_demo_02', 'Sarah Jenkins (Supply Chain Dir)'],
        ['usr_demo_03', 'David Chen (Procurement Specialist)'],
      ]);

      try {
        const { data, error } = await supabase.from('profiles').select('id,display_name');
        if (!error && data) {
          data.forEach((p) => defaultProfiles.set(p.id, p.display_name));
        }
      } catch {
        // fallback
      }
      return defaultProfiles;
    },
    staleTime: 60_000,
  });
}

export function useWorkflowRows() {
  const orgId = getCurrentOrgId();
  return useQuery({
    queryKey: WORKFLOW_KEYS.workflow,
    queryFn: async () => {
      if (!orgId) return [];
      try {
        const { data, error } = await supabase.from('shortage_status').select('*').eq('org_id', orgId);
        if (!error && data) return data;
      } catch {
        // fallback
      }
      return storageRepo.getStatuses(orgId);
    },
    staleTime: 0,
  });
}

export function useComments(shortageId: string) {
  const orgId = getCurrentOrgId();
  return useQuery({
    queryKey: WORKFLOW_KEYS.comments(shortageId),
    enabled: shortageId.length > 0,
    staleTime: 0,
    queryFn: async () => {
      if (!orgId) return [];
      try {
        const { data, error } = await supabase
          .from('shortage_comments')
          .select('*')
          .eq('org_id', orgId)
          .eq('shortage_id', shortageId)
          .order('created_at', { ascending: true });
        if (!error && data) return data;
      } catch {
        // fallback
      }
      return storageRepo.getComments(orgId, shortageId);
    },
  });
}

export function useDecisions() {
  const orgId = getCurrentOrgId();
  return useQuery({
    queryKey: WORKFLOW_KEYS.decisions,
    staleTime: 0,
    queryFn: async () => {
      if (!orgId) return [];
      try {
        const { data, error } = await supabase.from('mitigation_reviews').select('*').eq('org_id', orgId);
        if (!error && data) return data;
      } catch {
        // fallback
      }
      return storageRepo.getDecisions(orgId);
    },
  });
}

export function useScenarios() {
  const orgId = getCurrentOrgId();
  return useQuery({
    queryKey: WORKFLOW_KEYS.scenarios,
    staleTime: 0,
    queryFn: async () => {
      if (!orgId) return [];
      try {
        const { data, error } = await supabase
          .from('saved_scenarios')
          .select('*')
          .eq('org_id', orgId)
          .order('created_at', { ascending: false });
        if (!error && data) return data;
      } catch {
        // fallback
      }
      return storageRepo.getScenarios(orgId);
    },
  });
}

export function useActivity() {
  const orgId = getCurrentOrgId();
  return useQuery({
    queryKey: WORKFLOW_KEYS.activity,
    staleTime: 0,
    queryFn: async () => {
      if (!orgId) return [];
      try {
        const { data, error } = await supabase
          .from('activity_log')
          .select('*')
          .eq('org_id', orgId)
          .order('created_at', { ascending: false })
          .limit(200);
        if (!error && data) return data;
      } catch {
        // fallback
      }
      return storageRepo.getActivity(orgId, 200);
    },
  });
}

function useInvalidateWorkflow() {
  const qc = useQueryClient();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ['wf'] }),
      qc.invalidateQueries({ queryKey: ['orbit', 'shortages'] }),
    ]);
}

export function useWorkflowMutations() {
  const { userId } = useAuth();
  const invalidate = useInvalidateWorkflow();
  const opts = { onSuccess: invalidate };

  return {
    setStatus: useMutation({
      mutationFn: (d: { shortageId: string; status: ShortageStatus }) =>
        updateShortageStatus({ ...d, orgId: requireOrgId(), userId: userId ?? undefined }),
      ...opts,
    }),
    addComment: useMutation({
      mutationFn: (d: { shortageId: string; body: string }) =>
        addComment({ ...d, orgId: requireOrgId(), userId: userId ?? undefined }),
      ...opts,
    }),
    deleteComment: useMutation({
      mutationFn: (id: string) => deleteComment({ id }),
      ...opts,
    }),
    decide: useMutation({
      mutationFn: (d: {
        mitigationId: string;
        shortageId: string;
        decision: 'APPROVED' | 'REJECTED';
        reason: string;
      }) => decideMitigation({ ...d, orgId: requireOrgId(), userId: userId ?? undefined }),
      ...opts,
    }),
    clearDecision: useMutation({
      mutationFn: (mitigationId: string) =>
        clearDecision({ mitigationId, orgId: requireOrgId() }),
      ...opts,
    }),
    saveScenario: useMutation({
      mutationFn: (d: {
        name: string;
        skuId: string;
        locationId: string;
        params: Record<string, string>;
      }) => saveScenario({ ...d, orgId: requireOrgId(), userId: userId ?? undefined }),
      ...opts,
    }),
    deleteScenario: useMutation({
      mutationFn: (id: string) => deleteScenario({ id }),
      ...opts,
    }),
  };
}
