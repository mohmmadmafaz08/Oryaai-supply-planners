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
import { ISSUE_TYPE_LABELS } from '@/lib/constants';
import type { JoinedEdgeCase } from './useDataQuality';

export interface EdgeCasesTableProps {
  edgeCases: JoinedEdgeCase[];
}

/**
 * Displays the five injected QA edge cases joined with the validation check that caught each one.
 */
export function EdgeCasesTable({ edgeCases }: EdgeCasesTableProps): React.ReactElement {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Injected Edge Case Verification</CardTitle>
        <CardDescription>
          Ground-truth anomalies joined against validation_report.json detection results
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Issue Type</TableHead>
              <TableHead>Affected Record</TableHead>
              <TableHead>Caught By Check</TableHead>
              <TableHead>Detection Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {edgeCases.map((item) => {
              const caught = item.matchedCheck?.status === 'FAIL';
              return (
                <TableRow key={`${item.issue_type}-${item.record_ref}`}>
                  <TableCell>
                    <div className="font-medium">{ISSUE_TYPE_LABELS[item.issue_type]}</div>
                    <div className="font-mono text-[11px] text-[var(--text-muted)]">
                      {item.issue_type}
                    </div>
                  </TableCell>
                  <TableCell>
                    <CopyText value={item.record_ref} label={item.issue_type} />
                  </TableCell>
                  <TableCell>{item.expected_detection}</TableCell>
                  <TableCell>
                    <StatusBadge
                      tone={caught ? 'ok' : 'critical'}
                      label={caught ? 'Detected (FAIL raised)' : 'Missed'}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
