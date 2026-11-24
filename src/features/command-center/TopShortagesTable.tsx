import { ArrowRight } from 'lucide-react';
import * as React from 'react';
import { Link } from '@/lib/router-compat';
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
import type { Shortage, ShortageStatus } from '@/data/schemas';
import { CAUSE_CODE_LABELS, ROUTE_PATHS, SHORTAGE_STATUS_LABELS } from '@/lib/constants';
import { formatScore, formatUnits, formatWeekLabel } from '@/lib/format';

const STATUS_TONE: Record<ShortageStatus, SemanticTone> = {
  OPEN: 'critical',
  MITIGATING: 'warning',
  RESOLVED: 'ok',
};

export interface TopShortagesTableProps {
  shortages: Shortage[];
  onSelectShortage: (shortageId: string) => void;
}

/**
 * Compact priority queue of top 10 shortages opening the Shortage Detail Drawer directly.
 */
export function TopShortagesTable({
  shortages,
  onSelectShortage,
}: TopShortagesTableProps): React.ReactElement {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-4">
        <div>
          <CardTitle>Top 10 Priority Shortages</CardTitle>
          <CardDescription>
            Ranked by priority score descending, then shortage volume descending
          </CardDescription>
        </div>
        <Link
          to={ROUTE_PATHS.SHORTAGES}
          className="inline-flex items-center gap-1 text-xs font-medium text-[var(--accent)] hover:underline whitespace-nowrap shrink-0"
        >
          <span>View all shortages</span>
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Shortage ID</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Week</TableHead>
              <TableHead>Cause</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Priority</TableHead>
              <TableHead className="text-right">Shortage Qty</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shortages.map((item) => (
              <TableRow
                key={item.shortage_id}
                onClick={() => {
                  onSelectShortage(item.shortage_id);
                }}
                className="cursor-pointer hover:bg-[var(--bg-hover)]"
              >
                <TableCell className="font-mono">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelectShortage(item.shortage_id);
                    }}
                    className="font-medium text-[var(--accent)] hover:underline cursor-pointer"
                  >
                    {item.shortage_id}
                  </button>
                </TableCell>
                <TableCell className="font-mono">{item.sku_id}</TableCell>
                <TableCell>{item.location_id}</TableCell>
                <TableCell className="font-mono">{formatWeekLabel(item.week)}</TableCell>
                <TableCell>{CAUSE_CODE_LABELS[item.cause_code]}</TableCell>
                <TableCell>
                  <StatusBadge
                    tone={STATUS_TONE[item.status]}
                    label={SHORTAGE_STATUS_LABELS[item.status]}
                  />
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatScore(item.priority_score)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatUnits(item.shortage_qty)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
