import * as React from 'react';
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
import type { ReproducibilityReport } from '@/data/schemas';
import { formatCount } from '@/lib/format';

export interface ReproducibilityTableProps {
  report: ReproducibilityReport | undefined;
}

/**
 * Compares Run A vs Run B entity row counts and SHA-256 checksums with MATCH/MISMATCH badges.
 */
export function ReproducibilityTable({
  report,
}: ReproducibilityTableProps): React.ReactElement | null {
  if (!report) {
    return null;
  }

  const fileNames = Array.from(
    new Set([...Object.keys(report.run_a.checksums), ...Object.keys(report.run_b.checksums)]),
  );

  const allMatched =
    report.run_a.seed === report.run_b.seed &&
    fileNames.every((file) => {
      const entity = file.replace(/\.json$/, '');
      const countA = report.run_a.row_counts[entity];
      const countB = report.run_b.row_counts[entity];
      const shaA = report.run_a.checksums[file];
      const shaB = report.run_b.checksums[file];
      return shaA !== undefined && shaA === shaB && countA === countB;
    });

  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-2">
        <div>
          <CardTitle>Reproducibility Verification (Run A vs Run B)</CardTitle>
          <CardDescription>
            {report.run_a.run_label} (seed {String(report.run_a.seed)}) vs {report.run_b.run_label}{' '}
            (seed {String(report.run_b.seed)})
          </CardDescription>
        </div>
        <StatusBadge
          tone={allMatched ? 'ok' : 'critical'}
          label={allMatched ? 'All Files Match' : 'Drift Detected'}
        />
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-[var(--border-default)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File</TableHead>
                <TableHead className="text-right">Run A Rows</TableHead>
                <TableHead className="text-right">Run B Rows</TableHead>
                <TableHead>Run A SHA-256</TableHead>
                <TableHead>Run B SHA-256</TableHead>
                <TableHead>Comparison</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fileNames.map((fileName) => {
                const entity = fileName.replace(/\.json$/, '');
                const rowsA = report.run_a.row_counts[entity];
                const rowsB = report.run_b.row_counts[entity];
                const shaA = report.run_a.checksums[fileName];
                const shaB = report.run_b.checksums[fileName];
                const isMatch = shaA !== undefined && shaA === shaB && rowsA === rowsB;

                return (
                  <TableRow key={fileName}>
                    <TableCell className="font-mono text-xs">{fileName}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {rowsA !== undefined ? formatCount(rowsA) : '—'}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {rowsB !== undefined ? formatCount(rowsB) : '—'}
                    </TableCell>
                    <TableCell className="font-mono text-[11px] text-[var(--text-secondary)]">
                      {shaA ? `${shaA.slice(0, 12)}…` : '—'}
                    </TableCell>
                    <TableCell className="font-mono text-[11px] text-[var(--text-secondary)]">
                      {shaB ? `${shaB.slice(0, 12)}…` : '—'}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        tone={isMatch ? 'ok' : 'critical'}
                        label={isMatch ? 'MATCH' : 'MISMATCH'}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
