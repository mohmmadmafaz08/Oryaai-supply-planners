import * as React from 'react';
import { StatusBadge, type SemanticTone } from '@/components/StatusBadge';
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
import type { ValidationCheck } from '@/data/schemas';
import { formatCount } from '@/lib/format';

export interface ValidationGroupCardProps {
  title: string;
  description: string;
  badgeLabel: string;
  badgeTone: SemanticTone;
  checks: ValidationCheck[];
}

/**
 * Renders one labelled group of dataset validation checks with PASS/FAIL badges and row counts.
 */
export function ValidationGroupCard({
  title,
  description,
  badgeLabel,
  badgeTone,
  checks,
}: ValidationGroupCardProps): React.ReactElement {
  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-2">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <StatusBadge tone={badgeTone} label={badgeLabel} />
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Validation Check</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Rows Checked</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {checks.map((check) => (
              <TableRow key={check.name}>
                <TableCell className="font-medium">{check.name}</TableCell>
                <TableCell>
                  <StatusBadge
                    tone={check.status === 'PASS' ? 'ok' : 'critical'}
                    label={check.status}
                  />
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatCount(check.rows_checked)}
                </TableCell>
                <TableCell className="text-xs text-[var(--text-secondary)]">
                  {check.details}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
