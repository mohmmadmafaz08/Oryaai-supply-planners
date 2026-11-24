import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AsyncBoundary } from '@/components/AsyncBoundary';
import { useActivity, useProfiles } from '@/data/workflow';

const LABELS: Record<string, string> = {
  STATUS_CHANGED: 'changed status',
  COMMENT_ADDED: 'commented on',
  MITIGATION_APPROVED: 'approved',
  MITIGATION_REJECTED: 'rejected',
  MITIGATION_RESET: 'withdrew decision on',
  SCENARIO_SAVED: 'saved a scenario for',
  DATASET_UPLOADED: 'imported',
  DATASET_RESET: 'reverted to sample',
};

export function ActivityPage(): React.ReactElement {
  const activity = useActivity();
  const profiles = useProfiles();
  const rows = activity.data ?? [];
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-xl font-semibold tracking-tight">Team Activity</h1>
        <p className="text-xs text-muted-foreground">Audit trail of workflow changes across the planning team.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recent changes</CardTitle>
          <CardDescription>Last 200 events, newest first</CardDescription>
        </CardHeader>
        <CardContent>
          <AsyncBoundary isLoading={activity.isLoading} error={activity.error} onRetry={() => void activity.refetch()} isEmpty={rows.length === 0} emptyTitle="No activity yet" emptyDescription="Change a shortage status or approve a mitigation to see it here.">
            <ol className="divide-y divide-border">
              {rows.map((r) => (
                <li key={r.id} className="flex items-start justify-between gap-4 py-3 text-sm">
                  <div>
                    <span className="font-medium">{profiles.data?.get(r.actor_id) ?? 'Planner'}</span>{' '}
                    <span className="text-muted-foreground">{LABELS[r.action] ?? r.action}</span>{' '}
                    <span className="font-mono text-xs">{r.entity_id}</span>
                    {r.detail ? <p className="mt-0.5 text-xs text-muted-foreground">{r.detail}</p> : null}
                  </div>
                  <time className="shrink-0 font-mono text-[11px] text-muted-foreground">{new Date(r.created_at).toLocaleString()}</time>
                </li>
              ))}
            </ol>
          </AsyncBoundary>
        </CardContent>
      </Card>
    </div>
  );
}
