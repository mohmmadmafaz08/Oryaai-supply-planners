import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Database, Loader2, Sparkles } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';
import { useOrg } from '@/app/org';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DEFAULT_SEED } from '@/generator/generate';
import { generateWorkspaceData, getDatabaseSummary } from '@/lib/generator.functions';

/** Generates the seeded synthetic dataset into the org's database and shows what is stored there. */
export function GenerateDataCard({ onDone }: { onDone?: () => void }): React.ReactElement | null {
  const { current } = useOrg();
  const qc = useQueryClient();
  const [seed, setSeed] = React.useState(String(DEFAULT_SEED));
  const [busy, setBusy] = React.useState(false);
  const orgId = current?.id;

  const summary = useQuery({
    queryKey: ['db-summary', orgId],
    queryFn: () => getDatabaseSummary({ orgId: orgId as string }),
    enabled: Boolean(orgId),
  });

  if (!current) return null;
  const isOwner = current.role === 'owner';

  async function run() {
    const n = Number(seed);
    if (!Number.isInteger(n) || n < 1) {
      toast.error('Seed must be a positive whole number.');
      return;
    }
    setBusy(true);
    try {
      const res = await generateWorkspaceData({ orgId: current!.id, seed: n });
      toast.success(
        `Loaded ${res.rowCounts['shortages'] ?? 0} shortages and ${res.rowCounts['purchase_orders'] ?? 0} purchase orders into your workspace.`,
      );
      await qc.invalidateQueries();
      onDone?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Generation failed');
    } finally {
      setBusy(false);
    }
  }

  const run0 = summary.data?.lastRun as
    | {
        seed?: number;
        created_at?: string;
        detection?: { tp?: number; fn?: number; precision?: number; recall?: number };
      }
    | undefined;

  const det = run0?.detection;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-primary" aria-hidden /> Generate synthetic dataset
        </CardTitle>
        <CardDescription>
          Deterministic generator: same seed, same data. Builds SKUs, locations, suppliers, weekly demand, inventory,
          capacity, lead times, purchase orders, projected balance, shortages and mitigations in dependency order, then
          injects 5 labelled edge cases.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
            inputMode="numeric"
            aria-label="Seed"
            className="sm:w-40"
            disabled={!isOwner || busy}
          />
          <Button onClick={() => void run()} disabled={!isOwner || busy} className="sm:flex-1 cursor-pointer">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Database className="h-4 w-4" aria-hidden />}
            {busy ? 'Generating and saving…' : 'Generate & load into database'}
          </Button>
        </div>
        {!isOwner ? <p className="text-xs text-muted-foreground">Only organization owners can load data.</p> : null}
        {run0 ? (
          <div className="space-y-3 rounded-md border border-border p-3">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden />
              <span>
                Last run: seed <b>{run0.seed}</b> · {run0.created_at ? new Date(run0.created_at).toLocaleString() : 'Recent'}
              </span>
              {det ? (
                <Badge variant="ok">
                  Edge cases detected {det.tp}/{(det.tp ?? 0) + (det.fn ?? 0)} · precision {(det.precision ?? 0).toFixed(2)}
                </Badge>
              ) : null}
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-3">
              {summary.data?.counts.map((c) => (
                <div key={c.table} className="flex justify-between border-b border-border/50 py-1">
                  <span className="text-muted-foreground">{c.table.replace(/_/g, ' ')}</span>
                  <span className="font-mono tabular-nums">{c.rows.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
