import * as React from 'react';
import { StatusBadge } from '@/components/StatusBadge';
import { TablePaginationBar } from '@/components/TablePaginationBar';
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
import type { ProjectedBalanceRow } from '@/domain/pab';
import { RECONCILIATION_PAGE_SIZE } from '@/lib/constants';
import { formatCount } from '@/lib/format';
import { ReconciliationTableRow } from './ReconciliationTableRow';

export interface PabReconciliationTableProps {
  rows: ProjectedBalanceRow[];
  errorCount: number;
}

/**
 * Displays per-week PAB arithmetic sorted with mismatches first, paginated at 13 rows/page,
 * with a mismatches-only toggle and jump-to-first-mismatch badge.
 */
export function PabReconciliationTable({
  rows,
  errorCount,
}: PabReconciliationTableProps): React.ReactElement {
  const [mismatchesOnly, setMismatchesOnly] = React.useState(false);
  const [pageIndex, setPageIndex] = React.useState(0);
  const [highlightedWeek, setHighlightedWeek] = React.useState<number | null>(null);
  const firstMismatchRef = React.useRef<HTMLTableRowElement | null>(null);

  const orderedRows = React.useMemo(() => {
    const sorted = [...rows].sort((a, b) =>
      a.hasReconciliationError !== b.hasReconciliationError
        ? a.hasReconciliationError
          ? -1
          : 1
        : a.week - b.week,
    );
    return mismatchesOnly ? sorted.filter((row) => row.hasReconciliationError) : sorted;
  }, [rows, mismatchesOnly]);

  const pageCount = Math.max(1, Math.ceil(orderedRows.length / RECONCILIATION_PAGE_SIZE));
  const safePageIndex = Math.min(pageIndex, pageCount - 1);
  const visibleRows = orderedRows.slice(
    safePageIndex * RECONCILIATION_PAGE_SIZE,
    (safePageIndex + 1) * RECONCILIATION_PAGE_SIZE,
  );
  const firstMismatchWeek = orderedRows.find((r) => r.hasReconciliationError)?.week ?? null;

  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-3">
        <div>
          <CardTitle>Weekly Arithmetic Reconciliation</CardTitle>
          <CardDescription>
            Per-week check: opening + inbound − demand = expected closing (mismatches sorted first)
          </CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex cursor-pointer select-none items-center gap-1.5 text-xs text-[var(--text-secondary)]">
            <input
              type="checkbox"
              checked={mismatchesOnly}
              onChange={(event) => {
                setMismatchesOnly(event.target.checked);
                setPageIndex(0);
              }}
              className="h-3.5 w-3.5 accent-[var(--accent)]"
            />
            <span>Show mismatches only</span>
          </label>
          {errorCount > 0 ? (
            <button
              type="button"
              onClick={() => {
                if (firstMismatchWeek === null) return;
                setPageIndex(0);
                setHighlightedWeek(firstMismatchWeek);
                if (
                  firstMismatchRef.current &&
                  typeof firstMismatchRef.current.scrollIntoView === 'function'
                ) {
                  firstMismatchRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }}
              className="cursor-pointer rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]"
              aria-label={`Jump to first of ${formatCount(errorCount)} reconciliation mismatches`}
            >
              <StatusBadge
                tone="critical"
                label={`${formatCount(errorCount)} reconciliation ${errorCount === 1 ? 'mismatch' : 'mismatches'}`}
              />
            </button>
          ) : (
            <StatusBadge tone="ok" label="All weeks reconciled" />
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Week</TableHead>
                <TableHead>Arithmetic Formula</TableHead>
                <TableHead className="text-right">Supplied Closing</TableHead>
                <TableHead className="text-right">Expected Closing</TableHead>
                <TableHead className="text-right">Difference</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleRows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-6 text-center text-xs text-[var(--text-muted)]"
                  >
                    No reconciliation mismatches in this series.
                  </TableCell>
                </TableRow>
              ) : (
                visibleRows.map((row) => (
                  <ReconciliationTableRow
                    key={row.week}
                    row={row}
                    isHighlighted={row.week === highlightedWeek}
                    rowRef={row.week === firstMismatchWeek ? firstMismatchRef : undefined}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <TablePaginationBar
          totalRows={orderedRows.length}
          pageIndex={safePageIndex}
          pageCount={pageCount}
          canPrevious={safePageIndex > 0}
          canNext={safePageIndex + 1 < pageCount}
          onPrevious={() => {
            setPageIndex((p) => Math.max(0, p - 1));
          }}
          onNext={() => {
            setPageIndex((p) => Math.min(pageCount - 1, p + 1));
          }}
          itemLabel="weeks"
        />
      </CardContent>
    </Card>
  );
}
