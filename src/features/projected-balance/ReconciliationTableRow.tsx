import * as React from 'react';
import { StatusBadge } from '@/components/StatusBadge';
import { TableCell, TableRow } from '@/components/ui/table';
import type { ProjectedBalanceRow } from '@/domain/pab';
import { cn } from '@/lib/cn';
import { formatCount, formatSignedUnits, formatUnits, formatWeekLabel } from '@/lib/format';

export interface ReconciliationTableRowProps {
  row: ProjectedBalanceRow;
  isHighlighted: boolean;
  rowRef?: React.Ref<HTMLTableRowElement> | undefined;
}

/**
 * Single weekly arithmetic reconciliation row showing formula, supplied vs expected closing, and difference.
 */
export function ReconciliationTableRow({
  row,
  isHighlighted,
  rowRef,
}: ReconciliationTableRowProps): React.ReactElement {
  const diff = row.suppliedClosing !== undefined ? row.suppliedClosing - row.closing : 0;

  return (
    <TableRow
      ref={rowRef}
      data-highlighted={isHighlighted ? 'true' : undefined}
      className={cn(
        row.hasReconciliationError && 'bg-[var(--status-critical-bg)]',
        isHighlighted && 'ring-2 ring-inset ring-[var(--status-critical)]',
      )}
    >
      <TableCell className="font-mono">{formatWeekLabel(row.week)}</TableCell>
      <TableCell className="font-mono text-xs tabular-nums">
        {formatCount(row.opening)} + {formatCount(row.inbound)} − {formatCount(row.demand)} ={' '}
        {formatCount(row.closing)}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {row.suppliedClosing !== undefined ? formatUnits(row.suppliedClosing) : '—'}
      </TableCell>
      <TableCell className="text-right font-medium tabular-nums">
        {formatUnits(row.closing)}
      </TableCell>
      <TableCell
        className={cn(
          'text-right font-mono tabular-nums',
          row.hasReconciliationError && 'font-semibold text-[var(--status-critical)]',
        )}
      >
        {row.suppliedClosing !== undefined ? formatSignedUnits(diff) : '—'}
      </TableCell>
      <TableCell>
        {row.hasReconciliationError ? (
          <StatusBadge tone="critical" label="Mismatch" />
        ) : (
          <StatusBadge tone="ok" label="Reconciled" />
        )}
      </TableCell>
    </TableRow>
  );
}
