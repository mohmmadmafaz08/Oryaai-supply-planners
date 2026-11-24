import { Info } from 'lucide-react';
import * as React from 'react';
import { useOrg } from '@/app/org';
import { DatasetTable } from './DatasetTable';
import { GenerateDataCard } from './GenerateDataCard';

export function DataSourcesPage(): React.ReactElement {
  const { current } = useOrg();
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Data sources</h1>
        <p className="text-xs text-muted-foreground">Import your planning exports. Any file you don't upload uses the built-in sample dataset.</p>
      </div>
      <div className="flex gap-3 rounded-lg border border-border bg-muted/50 p-3 text-xs text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <p>
          Upload a JSON array or a CSV file with the same columns as each template. Every upload is checked against the data contract (ID formats, weeks 1–52,
          non-negative quantities) before it is saved, and only owners can upload. No external API key is needed.
          {current?.role !== 'owner' ? ' You are a member, so uploads are read-only for you.' : ''}
        </p>
      </div>
      <GenerateDataCard />
      <h2 className="pt-2 text-sm font-semibold">Or import your own files</h2>
      <DatasetTable />
    </div>
  );
}
