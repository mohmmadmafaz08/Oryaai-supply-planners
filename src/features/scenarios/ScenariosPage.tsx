import { Trash2 } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';
import { AsyncBoundary } from '@/components/AsyncBoundary';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useScenarios, useWorkflowMutations } from '@/data/workflow';
import { Link } from '@/lib/router-compat';
import { ROUTE_PATHS } from '@/lib/constants';

export function ScenariosPage(): React.ReactElement {
  const scenarios = useScenarios();
  const m = useWorkflowMutations();
  const rows = scenarios.data ?? [];
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-xl font-semibold tracking-tight">Saved Scenarios</h1>
        <p className="text-xs text-muted-foreground">Simulator setups you saved. Only you can see these.</p>
      </div>
      <AsyncBoundary isLoading={scenarios.isLoading} error={scenarios.error} onRetry={() => void scenarios.refetch()} isEmpty={rows.length === 0} emptyTitle="No saved scenarios" emptyDescription="Open the Simulator, adjust the sliders and press “Save scenario”.">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((s) => {
            const params = new URLSearchParams(s.params as Record<string, string>);
            return (
              <Card key={s.id}>
                <CardHeader className="flex-row items-start justify-between gap-2">
                  <div>
                    <CardTitle>{s.name}</CardTitle>
                    <p className="font-mono text-xs text-muted-foreground">{s.sku_id} @ {s.location_id}</p>
                  </div>
                  <Button variant="ghost" size="icon" aria-label="Delete scenario" onClick={() => m.deleteScenario.mutate(s.id, { onSuccess: () => toast.success('Scenario deleted') })}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    {[...params.entries()].filter(([k]) => k !== 'sku' && k !== 'location').map(([k, v]) => (
                      <span key={k} className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[11px]">{k}={v}</span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</span>
                    <Link to={`${ROUTE_PATHS.SIMULATOR}?${params.toString()}`} className="text-xs font-medium text-primary hover:underline">Open in simulator →</Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </AsyncBoundary>
    </div>
  );
}
