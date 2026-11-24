import { useQuery } from '@tanstack/react-query';
import { Database, ShieldCheck } from 'lucide-react';
import * as React from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useOrg } from '@/app/org';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

interface Overview {
  counts: Record<string, number>;
  total_demand: number; units_at_risk: number; open_shortages: number; delayed_pos: number; with_compliant_mitigation: number;
  by_cause: { cause: string; count: number; units: number }[];
  by_week: { week: number; units: number }[];
  top: { shortage_id: string; sku_id: string; location_id: string; week: number; shortage_qty: number; cause_code: string; priority_score: number; status: string }[];
  last_run: { seed: number; scale: string; created_at: string; detection: { tp: number; fn: number; fp: number; precision: number; recall: number }; checksums: Record<string, string> } | null;
}

export function useOrgOverview() {
  const { current } = useOrg();
  return useQuery({
    queryKey: ['org-overview', current?.id],
    enabled: !!current,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('org_planning_overview', { _org: current!.id });
      if (error) throw new Error('Could not load the database summary.');
      return data as unknown as Overview | null;
    },
  });
}

const n = (x: number) => x.toLocaleString();
const label = (c: string) => c.toLowerCase().replace(/_/g, ' ').replace(/^\w/, (m) => m.toUpperCase());

/** Server-side aggregates over the org's full relational dataset (works at 3,000 SKUs / 300k+ demand rows). */
export function DatabaseOverview(): React.ReactElement | null {
  const q = useOrgOverview();
  const o = q.data;
  if (!o || !o.counts['skus']) return null;
  const shortages = o.counts['shortages'] ?? 0;
  const run = o.last_run;
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-sm"><Database className="h-4 w-4 text-primary" aria-hidden /> Database view · full dataset</CardTitle>
          {run ? <Badge variant="info">Seed {run.seed} · {run.scale} scale</Badge> : null}
        </div>
        <CardDescription className="text-xs">
          Totals computed in the database across {n(o.counts['skus'] ?? 0)} SKUs, {n(o.counts['locations'] ?? 0)} locations, {n(o.counts['suppliers'] ?? 0)} suppliers and {n(o.counts['demand_rows'] ?? 0)} weekly demand rows.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {[
            ['Shortages', n(shortages)],
            ['Open', n(o.open_shortages)],
            ['Units at risk', n(o.units_at_risk)],
            ['Fill rate at risk', `${((o.units_at_risk / Math.max(1, o.total_demand)) * 100).toFixed(2)}%`],
            ['With compliant fix', `${((o.with_compliant_mitigation / Math.max(1, shortages)) * 100).toFixed(1)}%`],
          ].map(([k, v]) => (
            <div key={k} className="rounded-md border border-border p-3">
              <p className="text-[11px] text-muted-foreground">{k}</p>
              <p className="font-mono text-lg font-semibold tabular-nums">{v}</p>
            </div>
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-medium">Shortage units by week</p>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={o.by_week}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="week" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
                  <YAxis tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" width={48} />
                  <Tooltip formatter={(v) => n(Number(v))} labelFormatter={(w) => `Week ${String(w)}`} />
                  <Bar dataKey="units" fill="var(--chart-series-primary)" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium">Root causes</p>
            <div className="space-y-2">
              {o.by_cause.map((c) => {
                const max = Math.max(...o.by_cause.map((x) => x.units), 1);
                return (
                  <div key={c.cause} className="text-xs">
                    <div className="mb-1 flex justify-between"><span>{label(c.cause)}</span><span className="font-mono text-muted-foreground">{n(c.count)} · {n(c.units)} units</span></div>
                    <div className="h-2 rounded bg-muted"><div className="h-2 rounded bg-primary" style={{ width: `${(c.units / max) * 100}%` }} /></div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <p className="mb-2 text-xs font-medium">Top 10 by priority (whole network)</p>
          <table className="w-full text-xs">
            <thead className="text-left text-muted-foreground"><tr>{['Shortage', 'SKU', 'Location', 'Week', 'Cause', 'Qty', 'Priority'].map((h) => <th key={h} className="py-1.5 pr-3 font-medium">{h}</th>)}</tr></thead>
            <tbody>
              {o.top.map((t) => (
                <tr key={t.shortage_id} className="border-t border-border/60">
                  <td className="py-1.5 pr-3 font-mono">{t.shortage_id}</td><td className="pr-3 font-mono">{t.sku_id}</td><td className="pr-3 font-mono">{t.location_id}</td>
                  <td className="pr-3">W{String(t.week).padStart(2, '0')}</td><td className="pr-3">{label(t.cause_code)}</td>
                  <td className="pr-3 font-mono tabular-nums">{n(t.shortage_qty)}</td><td className="font-mono tabular-nums">{Number(t.priority_score).toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

/** Latest generation run: seed, reproducibility checksums and edge-case detection score vs ground truth. */
export function GenerationRunCard(): React.ReactElement | null {
  const q = useOrgOverview();
  const run = q.data?.last_run;
  if (!run) return null;
  const d = run.detection;
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm"><ShieldCheck className="h-4 w-4 text-primary" aria-hidden /> Latest generation run in the database</CardTitle>
        <CardDescription className="text-xs">Seed {run.seed} · {run.scale} scale · {new Date(run.created_at).toLocaleString()}. The detector reads only planning tables; ground truth is stored separately and used only for scoring.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ['Edge cases caught', `${d.tp}/${d.tp + d.fn}`],
          ['Precision', d.precision.toFixed(2)],
          ['Recall', d.recall.toFixed(2)],
          ['Files checksummed', String(Object.keys(run.checksums).length)],
        ].map(([k, v]) => (
          <div key={k} className="rounded-md border border-border p-3">
            <p className="text-[11px] text-muted-foreground">{k}</p>
            <p className="font-mono text-lg font-semibold tabular-nums">{v}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
