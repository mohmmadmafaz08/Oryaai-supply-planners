import * as React from 'react';
import { CopyText } from '@/components/CopyText';
import { StatusBadge } from '@/components/StatusBadge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Manifest } from '@/data/schemas';
import { formatCount } from '@/lib/format';

export interface ProvenancePanelProps {
  manifest: Manifest | undefined;
}

/**
 * Displays dataset seed, label, row counts, and copyable SHA-256 checksums from manifest.json.
 */
export function ProvenancePanel({ manifest }: ProvenancePanelProps): React.ReactElement {
  if (!manifest) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Dataset Provenance</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-[var(--text-muted)]">Manifest metadata unavailable.</p>
        </CardContent>
      </Card>
    );
  }

  const rowCountEntries = Object.entries(manifest.row_counts);
  const checksumEntries = Object.entries(manifest.checksums);

  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-2">
        <div>
          <CardTitle>Dataset Provenance</CardTitle>
          <CardDescription>{manifest.generated_at_label}</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {manifest.is_fixture ? <StatusBadge tone="info" label="Fixture Dataset" /> : null}
          <span className="font-mono text-xs text-[var(--text-secondary)]">
            Seed {String(manifest.seed)}
          </span>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="rounded-md border border-[var(--border-default)] lg:col-span-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Entity</TableHead>
                <TableHead className="text-right">Row Count</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rowCountEntries.map(([entity, count]) => (
                <TableRow key={entity}>
                  <TableCell className="font-mono">{entity}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCount(count)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="rounded-md border border-[var(--border-default)] lg:col-span-8">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">File</TableHead>
                <TableHead>SHA-256 Checksum</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {checksumEntries.map(([fileName, sha256]) => (
                <TableRow key={fileName}>
                  <TableCell className="truncate font-mono whitespace-nowrap">{fileName}</TableCell>
                  <TableCell>
                    <CopyText value={sha256} label={`${fileName} SHA-256`} className="w-full" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
