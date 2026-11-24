import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useRouterState } from '@tanstack/react-router';
import * as React from 'react';
import { supabase } from '@/integrations/supabase/client';
import { readStoredOrgId, setCurrentOrgId } from '@/lib/org-store';
import { useAuth } from '@/integrations/clerk';
import { storageRepo, type OrganizationRecord } from '@/lib/storage-repository';

export interface OrgSummary {
  id: string;
  name: string;
  role: 'owner' | 'member';
  join_code: string;
}

interface OrgContextValue {
  orgs: OrgSummary[];
  current: OrgSummary | null;
  userId: string | null;
  switchOrg: (id: string) => void;
  refresh: () => Promise<unknown>;
}

const OrgContext = React.createContext<OrgContextValue | null>(null);

export function useOrg(): OrgContextValue {
  const ctx = React.useContext(OrgContext);
  if (!ctx) throw new Error('useOrg must be used within OrgProvider');
  return ctx;
}

/** Org membership is the tenancy boundary: all data queries read the selected org. */
export function OrgProvider({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { userId, isLoaded } = useAuth();
  const [selected, setSelected] = React.useState<string | null>(() => readStoredOrgId());

  const orgsQuery = useQuery({
    queryKey: ['org', 'list', userId],
    staleTime: 30_000,
    enabled: isLoaded && Boolean(userId),
    queryFn: async () => {
      if (!userId) {
        return { uid: null, orgs: [] };
      }

      // 1. Try Supabase for memberships of this user
      let remoteOrgs: OrgSummary[] = [];
      try {
        const { data, error } = await supabase
          .from('org_members')
          .select('role, organizations(id, name, join_code)')
          .eq('user_id', userId);

        if (!error && data && data.length > 0) {
          remoteOrgs = (data as any[]).flatMap((r) =>
            r.organizations
              ? [
                  {
                    id: r.organizations.id,
                    name: r.organizations.name,
                    join_code: r.organizations.join_code,
                    role: r.role as 'owner' | 'member',
                  },
                ]
              : [],
          );
        }
      } catch (err) {
        console.warn('[org] Supabase query failed:', err);
      }

      // 2. Get local storage organizations for this user
      const localSummaries = storageRepo.getOrganizationsForUser(userId);

      // Merge remote with local without duplicates
      const seen = new Set(remoteOrgs.map((o) => o.id));
      const merged = [...remoteOrgs, ...localSummaries.filter((o) => !seen.has(o.id))];

      return { uid: userId, orgs: merged };
    },
  });

  const orgs = orgsQuery.data?.orgs ?? [];
  const current = orgs.find((o) => o.id === selected) ?? orgs[0] ?? null;

  React.useEffect(() => {
    if (current) {
      setCurrentOrgId(current.id);
    }
  }, [current]);

  React.useEffect(() => {
    if (orgsQuery.isSuccess && orgs.length === 0 && pathname !== '/onboarding') {
      void navigate({ to: '/onboarding', replace: true });
    }
  }, [orgsQuery.isSuccess, orgs.length, pathname, navigate]);

  const switchOrg = React.useCallback(
    (id: string) => {
      setCurrentOrgId(id);
      setSelected(id);
      qc.removeQueries({ queryKey: ['orbit'] });
      qc.removeQueries({ queryKey: ['wf'] });
      qc.removeQueries({ queryKey: ['db-summary'] });
    },
    [qc],
  );

  const value = React.useMemo(
    () => ({
      orgs,
      current,
      userId: userId ?? null,
      switchOrg,
      refresh: () => orgsQuery.refetch(),
    }),
    [orgs, current, userId, switchOrg, orgsQuery],
  );

  if (orgsQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading workspace…
      </div>
    );
  }

  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
}
