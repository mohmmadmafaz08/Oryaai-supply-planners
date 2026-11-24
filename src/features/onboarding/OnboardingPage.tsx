import { Logo } from '@/components/Logo';
import { useSignOut } from '@/app/useSignOut';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { ArrowRight, Building2, Check, Database, KeyRound, Loader2, LogOut, Sparkles, Upload } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';
import { useOrg } from '@/app/org';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DatasetTable } from '@/features/data-sources/DatasetTable';
import { GenerateDataCard } from '@/features/data-sources/GenerateDataCard';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/cn';
import { storageRepo } from '@/lib/storage-repository';

const STEPS = ['Organization', 'Data', 'Done'] as const;
const inputCls =
  'h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none';

export function OnboardingPage(): React.ReactElement {
  const { orgs, switchOrg, refresh, userId } = useOrg();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const signOut = useSignOut();
  const [step, setStep] = React.useState(orgs.length > 0 ? 1 : 0);
  const [mode, setMode] = React.useState<'create' | 'join'>('create');
  const [name, setName] = React.useState('');
  const [code, setCode] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [dataChoice, setDataChoice] = React.useState<'generate' | 'upload'>('generate');

  async function submitOrg(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const activeUserId = userId || `usr_planner_${Date.now()}`;

    try {
      let createdOrJoinedId: string | null = null;

      if (mode === 'create') {
        const orgId = `org_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const joinCode = `ORY-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
        const newOrg = {
          id: orgId,
          name: name.trim(),
          join_code: joinCode,
          created_at: new Date().toISOString(),
        };

        // 1. Save locally
        storageRepo.saveOrganization(newOrg);
        storageRepo.addMember({
          org_id: orgId,
          user_id: activeUserId,
          role: 'owner',
          joined_at: new Date().toISOString(),
        });

        createdOrJoinedId = orgId;

        // 2. Direct Supabase insert
        try {
          await supabase.from('organizations').insert({
            id: orgId,
            name: name.trim(),
            join_code: joinCode,
            created_by: activeUserId,
          });

          await supabase.from('org_members').insert({
            org_id: orgId,
            user_id: activeUserId,
            role: 'owner',
          });
        } catch (supabaseErr) {
          console.warn('[onboarding] Supabase org creation sync deferred:', supabaseErr);
        }
      } else {
        const cleanCode = code.trim().toUpperCase();

        // 1. Try Supabase lookup
        try {
          const { data: remoteOrg } = await supabase
            .from('organizations')
            .select('id, name, join_code')
            .eq('join_code', cleanCode)
            .maybeSingle();

          if (remoteOrg) {
            await supabase.from('org_members').upsert({
              org_id: remoteOrg.id,
              user_id: activeUserId,
              role: 'member',
            });
            storageRepo.saveOrganization({
              id: remoteOrg.id,
              name: remoteOrg.name,
              join_code: remoteOrg.join_code,
              created_at: new Date().toISOString(),
            });
            storageRepo.addMember({
              org_id: remoteOrg.id,
              user_id: activeUserId,
              role: 'member',
              joined_at: new Date().toISOString(),
            });
            createdOrJoinedId = remoteOrg.id;
          }
        } catch (err) {
          console.warn('[onboarding] Supabase join lookup:', err);
        }

        // 2. If not found in remote, check local
        if (!createdOrJoinedId) {
          const localOrgs = storageRepo.getOrganizations();
          const found = localOrgs.find((o) => o.join_code.toUpperCase() === cleanCode);
          if (found) {
            storageRepo.addMember({
              org_id: found.id,
              user_id: activeUserId,
              role: 'member',
              joined_at: new Date().toISOString(),
            });
            createdOrJoinedId = found.id;
          }
        }

        if (!createdOrJoinedId) {
          throw new Error('Organization not found with this invite code. Please check and try again.');
        }
      }

      await qc.invalidateQueries({ queryKey: ['org'] });
      await refresh();
      if (createdOrJoinedId) switchOrg(createdOrJoinedId);
      toast.success(mode === 'create' ? 'Organization created!' : 'Joined organization!');
      setStep(mode === 'join' ? 2 : 1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  async function handleLoadDemoOrg() {
    setBusy(true);
    const activeUserId = userId || `usr_planner_${Date.now()}`;
    try {
      const demoOrg = storageRepo.seedDemoOrganization(activeUserId);
      try {
        await supabase.from('organizations').insert({
          id: demoOrg.id,
          name: demoOrg.name,
          join_code: demoOrg.join_code,
          created_by: activeUserId,
        });
        await supabase.from('org_members').insert({
          org_id: demoOrg.id,
          user_id: activeUserId,
          role: 'owner',
        });
      } catch (err) {
        console.warn('[onboarding] Supabase demo org sync deferred:', err);
      }
      await qc.invalidateQueries({ queryKey: ['org'] });
      await refresh();
      switchOrg(demoOrg.id);
      toast.success('Sample supply chain environment loaded!');
      setStep(1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed loading demo');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl space-y-8 px-6 py-12">
        <div className="flex items-center justify-between">
          <Logo />
          <ol className="flex items-center gap-2 text-xs">
            {STEPS.map((s, i) => (
              <li key={s} className="flex items-center gap-2">
                <span
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full border text-[11px]',
                    i < step
                      ? 'border-primary bg-primary text-primary-foreground'
                      : i === step
                        ? 'border-primary text-primary'
                        : 'border-border text-muted-foreground',
                  )}
                >
                  {i < step ? <Check className="h-3 w-3" aria-hidden /> : i + 1}
                </span>
                <span className={i === step ? 'font-medium' : 'text-muted-foreground'}>{s}</span>
                {i < STEPS.length - 1 ? <span className="h-px w-6 bg-border" /> : null}
              </li>
            ))}
          </ol>
          <Button variant="ghost" size="sm" onClick={() => void signOut()} className="cursor-pointer">
            <LogOut className="h-3.5 w-3.5" aria-hidden /> Sign out
          </Button>
        </div>

        {step === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Set up your organization</CardTitle>
              <CardDescription>Your organization keeps its own data, statuses and team activity.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {([['create', Building2, 'Create new'], ['join', KeyRound, 'Join with invite code']] as const).map(
                  ([k, Icon, label]) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setMode(k)}
                      className={cn(
                        'flex items-center gap-2 rounded-md border px-3 py-2.5 text-sm cursor-pointer transition-colors',
                        mode === k
                          ? 'border-primary bg-primary/5 text-foreground font-medium'
                          : 'border-border text-muted-foreground hover:bg-muted/50',
                      )}
                    >
                      <Icon className="h-4 w-4" aria-hidden /> {label}
                    </button>
                  ),
                )}
              </div>
              <form onSubmit={submitOrg} className="space-y-3">
                {mode === 'create' ? (
                  <input
                    className={inputCls}
                    placeholder="Organization name, e.g. Northwind Supply"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    minLength={2}
                    maxLength={80}
                    required
                    aria-label="Organization name"
                  />
                ) : (
                  <input
                    className={inputCls}
                    placeholder="Invite code from your owner (e.g. NW-SUPPLY-2026)"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                    maxLength={32}
                    aria-label="Invite code"
                  />
                )}
                <Button type="submit" className="h-10 w-full cursor-pointer" disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
                  {mode === 'create' ? 'Create organization' : 'Join organization'}
                </Button>
              </form>

              <div className="relative pt-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">or explore with sample data</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleLoadDemoOrg}
                disabled={busy}
                className="w-full h-10 cursor-pointer text-xs flex items-center justify-center gap-2"
              >
                <Sparkles className="h-4 w-4 text-primary" />
                <span>Load Sample Supply Chain Workspace</span>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {step === 1 ? (
          <Card>
            <CardHeader>
              <CardTitle>Load planning datasets</CardTitle>
              <CardDescription>
                Choose how to populate your supply chain model: generate realistic synthetic data or upload CSV/JSON files.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDataChoice('generate')}
                  className={cn(
                    'flex items-center gap-2 rounded-md border px-3 py-2.5 text-sm cursor-pointer transition-colors',
                    dataChoice === 'generate'
                      ? 'border-primary bg-primary/5 text-foreground font-medium'
                      : 'border-border text-muted-foreground hover:bg-muted/50',
                  )}
                >
                  <Database className="h-4 w-4" /> Generate starter data
                </button>
                <button
                  type="button"
                  onClick={() => setDataChoice('upload')}
                  className={cn(
                    'flex items-center gap-2 rounded-md border px-3 py-2.5 text-sm cursor-pointer transition-colors',
                    dataChoice === 'upload'
                      ? 'border-primary bg-primary/5 text-foreground font-medium'
                      : 'border-border text-muted-foreground hover:bg-muted/50',
                  )}
                >
                  <Upload className="h-4 w-4" /> Upload custom files
                </button>
              </div>

              {dataChoice === 'generate' ? (
                <GenerateDataCard onDone={() => setStep(2)} />
              ) : (
                <div className="space-y-4">
                  <DatasetTable />
                  <Button onClick={() => setStep(2)} className="w-full cursor-pointer">
                    Continue to Workbench <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ) : null}

        {step === 2 ? (
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-2">
                <Check className="h-6 w-6" />
              </div>
              <CardTitle>Workspace ready!</CardTitle>
              <CardDescription>
                Your supply planning environment is configured and ready for shortage triage and balance audits.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={() => void navigate({ to: '/dashboard' })}
                className="w-full h-11 font-medium cursor-pointer"
              >
                Go to Command Center <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
