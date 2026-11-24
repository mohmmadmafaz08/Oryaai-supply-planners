import { CheckCircle2, Database, Download, Loader2, RotateCcw, Upload } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';
import { useOrg } from '@/app/org';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DATASETS, DATASET_KINDS, type DatasetKind } from '@/data/datasets';
import { DATA_BASE_PATH } from '@/lib/constants';
import { readDatasetFile, useDatasetMutations, useDatasetStatus } from './useDatasets';

function errMsg(e: unknown) {
  return e instanceof Error ? e.message : 'Upload failed';
}

export function DatasetTable(): React.ReactElement {
  const { current } = useOrg();
  const isOwner = current?.role === 'owner';
  const status = useDatasetStatus();
  const m = useDatasetMutations();
  const [busy, setBusy] = React.useState<DatasetKind | null>(null);
  const inputs = React.useRef<Partial<Record<DatasetKind, HTMLInputElement | null>>>({});

  async function onFile(kind: DatasetKind, file: File | undefined) {
    if (!file) return;
    setBusy(kind);
    try {
      const rows = await readDatasetFile(kind, file);
      const r = await m.upload.mutateAsync({ kind, rows });
      toast.success(`${DATASETS[kind].label}: ${r.rows.toLocaleString()} rows imported`);
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(null);
      const el = inputs.current[kind];
      if (el) el.value = '';
    }
  }

  if (status.error) return <p className="text-sm text-destructive">Couldn't load dataset status. Refresh to try again.</p>;

  return (
    <div className="divide-y divide-border rounded-lg border border-border bg-card">
      {DATASET_KINDS.map((kind) => {
        const spec = DATASETS[kind];
        const row = status.data?.get(kind);
        return (
          <div key={kind} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <Database className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{spec.label} <span className="ml-1 text-[11px] font-normal text-muted-foreground">{spec.group}</span></p>
              <p className="text-xs text-muted-foreground">{spec.description}</p>
            </div>
            {row ? (
              <Badge variant="neutral" className="gap-1"><CheckCircle2 className="h-3 w-3 text-ok" aria-hidden />{row.row_count.toLocaleString()} rows · {new Date(row.uploaded_at).toLocaleDateString()}</Badge>
            ) : (
              <Badge variant="neutral">Sample data</Badge>
            )}
            <div className="flex gap-1">
              <Button asChild variant="ghost" size="icon" aria-label={`Download ${spec.label} template`} title="Download template">
                <a href={`${DATA_BASE_PATH}/${spec.file}`} download={spec.file}><Download className="h-4 w-4" aria-hidden /></a>
              </Button>
              {isOwner ? (
                <>
                  <input ref={(el) => { inputs.current[kind] = el; }} type="file" accept=".json,.csv,application/json,text/csv" className="hidden" aria-label={`Upload ${spec.label}`} onChange={(e) => void onFile(kind, e.target.files?.[0])} />
                  <Button variant="outline" size="sm" disabled={busy !== null} onClick={() => inputs.current[kind]?.click()}>
                    {busy === kind ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Upload className="h-4 w-4" aria-hidden />} Upload
                  </Button>
                  {row ? (
                    <Button variant="ghost" size="icon" aria-label={`Revert ${spec.label} to sample`} title="Revert to sample data" disabled={m.reset.isPending} onClick={() => m.reset.mutate(kind, { onSuccess: () => toast.success(`${spec.label} reverted to sample data`), onError: (e) => toast.error(errMsg(e)) })}>
                      <RotateCcw className="h-4 w-4" aria-hidden />
                    </Button>
                  ) : null}
                </>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
