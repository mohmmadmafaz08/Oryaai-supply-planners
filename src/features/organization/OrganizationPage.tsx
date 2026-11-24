import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Copy, LogOut, Plus, Users, Shield } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';
import { useOrg } from '@/app/org';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useProfiles } from '@/data/workflow';
import { supabase } from '@/integrations/supabase/client';
import { storageRepo } from '@/lib/storage-repository';

export function OrganizationPage(): React.ReactElement {
  const { current, userId, refresh } = useOrg();
  const profiles = useProfiles();
  const navigate = useNavigate();

  const members = useQuery({
    queryKey: ['wf', 'members', current?.id],
    enabled: Boolean(current),
    queryFn: async () => {
      if (!current) return [];
      const local = storageRepo.getMembers(current.id);
      try {
        const { data, error } = await supabase
          .from('org_members')
          .select('user_id,role,joined_at')
          .eq('org_id', current.id);
        if (!error && data && data.length > 0) return data;
      } catch {
        // fallback
      }
      return local;
    },
  });

  if (!current) return <p className="text-sm text-muted-foreground p-6">No organization selected.</p>;

  async function leave() {
    if (!current || !userId) return;
    if (!window.confirm(`Leave ${current.name}?`)) return;

    storageRepo.removeMember(current.id, userId);

    try {
      await supabase
        .from('org_members')
        .delete()
        .eq('org_id', current.id)
        .eq('user_id', userId);
    } catch {
      // ignore
    }

    toast.success(`Left ${current.name}`);
    await refresh();
    void navigate({ to: '/onboarding' });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">{current.name}</h1>
          <p className="text-xs text-muted-foreground">Organization settings, members, and invite code</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void navigate({ to: '/onboarding' })} className="cursor-pointer">
          <Plus className="h-4 w-4 mr-1" aria-hidden /> New or join another
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invite teammates</CardTitle>
          <CardDescription>Share this code. Anyone who enters it during onboarding joins your workspace.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-2">
          <code className="rounded-md border border-border bg-muted px-3 py-2 font-mono text-sm tracking-wider font-semibold">
            {current.join_code}
          </code>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Copy invite code"
            className="cursor-pointer"
            onClick={() =>
              void navigator.clipboard.writeText(current.join_code).then(() => toast.success('Invite code copied to clipboard'))
            }
          >
            <Copy className="h-4 w-4" aria-hidden />
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" aria-hidden /> Members
          </CardTitle>
          <CardDescription>Team members with planning access to this workspace</CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          {(members.data ?? []).map((m) => (
            <div key={m.user_id} className="flex items-center justify-between py-2.5 text-sm">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {(profiles.data?.get(m.user_id) || 'P').slice(0, 1).toUpperCase()}
                </span>
                <span>
                  {profiles.data?.get(m.user_id) ?? 'Supply Planner'}
                  {m.user_id === userId ? ' (you)' : ''}
                </span>
              </div>
              <Badge variant={m.role === 'owner' ? 'ok' : 'neutral'} className="capitalize text-xs">
                {m.role === 'owner' ? <Shield className="h-3 w-3 mr-1" /> : null}
                {m.role}
              </Badge>
            </div>
          ))}
          {members.data?.length === 0 ? (
            <p className="py-2 text-sm text-muted-foreground">No active members found.</p>
          ) : null}
        </CardContent>
      </Card>

      <div className="pt-2">
        <Button variant="ghost" className="text-destructive hover:bg-destructive/10 cursor-pointer" onClick={() => void leave()}>
          <LogOut className="h-4 w-4 mr-1.5" aria-hidden /> Leave organization
        </Button>
      </div>
    </div>
  );
}
