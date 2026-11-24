import * as React from 'react';
import { StatusBadge, type SemanticTone } from '@/components/StatusBadge';
import { TablePaginationBar } from '@/components/TablePaginationBar';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { SupplierSummaryRow, UtilisationStatus } from '@/domain/supply';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';
import { formatCount, formatDays, formatPercent, formatUnits } from '@/lib/format';

const STATUS_BADGE_MAP: Record<UtilisationStatus, { tone: SemanticTone; label: string }> = {
  HEALTHY: { tone: 'ok', label: 'Healthy' },
  CONSTRAINED: { tone: 'warning', label: 'Constrained' },
  OVER_CAPACITY: { tone: 'critical', label: 'Over capacity' },
};

const STATUS_FILL_VAR: Record<UtilisationStatus, string> = {
  HEALTHY: 'var(--status-ok)',
  CONSTRAINED: 'var(--status-warning)',
  OVER_CAPACITY: 'var(--status-critical)',
};

export interface SuppliersTableProps {
  summaries: SupplierSummaryRow[];
}

function formatRange(
  min: number | null,
  max: number | null,
  formatter: (val: number) => string,
): string {
  if (min === null || max === null) return '—';
  return min === max ? formatter(min) : `${formatter(min)}–${formatter(max)}`;
}

/**
 * Paginated Suppliers table with weekly capacity vs allocated utilisation bars,
 * reliability, MOQ, lead times, and Constrained / Over capacity badges.
 */
export function SuppliersTable({ summaries }: SuppliersTableProps): React.ReactElement {
  const [pageIndex, setPageIndex] = React.useState(0);
  const pageCount = Math.max(1, Math.ceil(summaries.length / DEFAULT_PAGE_SIZE));
  const safePageIndex = Math.min(pageIndex, pageCount - 1);
  const rows = summaries.slice(
    safePageIndex * DEFAULT_PAGE_SIZE,
    (safePageIndex + 1) * DEFAULT_PAGE_SIZE,
  );

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Supplier</TableHead>
              <TableHead className="text-right">Weekly Capacity</TableHead>
              <TableHead className="text-right">Peak Allocated</TableHead>
              <TableHead>Peak Utilisation</TableHead>
              <TableHead>Capacity Flag</TableHead>
              <TableHead className="text-right">Reliability</TableHead>
              <TableHead className="text-right">MOQ Range</TableHead>
              <TableHead className="text-right">Lead Time</TableHead>
              <TableHead className="text-right">Active POs</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const badge = STATUS_BADGE_MAP[row.status];
              const pctWidth = Math.min(100, Math.round(row.utilisationRatio * 100));
              return (
                <TableRow key={row.supplier.supplier_id}>
                  <TableCell>
                    <div className="font-medium text-[var(--text-primary)]">
                      {row.supplier.name}
                    </div>
                    <div className="font-mono text-[11px] text-[var(--text-muted)]">
                      {row.supplier.supplier_id}
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatUnits(row.supplier.capacity_per_week)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    <div>{formatUnits(row.peakWeeklyAllocated)}</div>
                    <div className="font-mono text-[11px] text-[var(--text-muted)]">
                      {row.peakWeekLabel}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex w-36 items-center gap-2">
                      <svg
                        className="h-2 flex-1 rounded-full bg-[var(--bg-muted)]"
                        viewBox="0 0 100 8"
                        preserveAspectRatio="none"
                        aria-hidden="true"
                      >
                        <rect
                          x="0"
                          y="0"
                          width={pctWidth}
                          height="8"
                          rx="4"
                          fill={STATUS_FILL_VAR[row.status]}
                        />
                      </svg>
                      <span className="w-12 text-right font-mono text-xs tabular-nums">
                        {formatPercent(row.utilisationRatio)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge tone={badge.tone} label={badge.label} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatPercent(row.supplier.reliability_score)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatRange(row.minOrderQtyMin, row.minOrderQtyMax, (v) => formatUnits(v))}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatRange(row.leadTimeDaysMin, row.leadTimeDaysMax, (v) => formatDays(v))}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCount(row.activePoCount)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <TablePaginationBar
        totalRows={summaries.length}
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
        itemLabel="suppliers"
      />
    </Card>
  );
}
