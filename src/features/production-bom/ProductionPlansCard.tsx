import * as React from 'react';
import { StatusBadge, type SemanticTone } from '@/components/StatusBadge';
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
import type { ProductionPlan, ProductionPlanStatus } from '@/data/schemas';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';
import { formatPercent, formatUnits, formatWeekLabel } from '@/lib/format';

const PLAN_TONE: Record<ProductionPlanStatus, SemanticTone> = {
  PLANNED: 'info',
  RELEASED: 'ok',
  COMPLETED: 'neutral',
  HOLD: 'critical',
};

export interface ProductionPlansCardProps {
  parentSkuId: string;
  plans: ProductionPlan[];
}

/**
 * Displays weekly production schedules and capacity utilisation for a finished-good SKU.
 */
export function ProductionPlansCard({
  parentSkuId,
  plans,
}: ProductionPlansCardProps): React.ReactElement {
  const [pageIndex, setPageIndex] = React.useState(0);
  const pageCount = Math.max(1, Math.ceil(plans.length / DEFAULT_PAGE_SIZE));
  const safePageIndex = Math.min(pageIndex, pageCount - 1);
  const visiblePlans = plans.slice(
    safePageIndex * DEFAULT_PAGE_SIZE,
    (safePageIndex + 1) * DEFAULT_PAGE_SIZE,
  );

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Production Schedule ({parentSkuId})</CardTitle>
        <CardDescription>
          Weekly planned build quantities against line capacity across planning locations
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Plan ID</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Week</TableHead>
              <TableHead className="text-right">Planned Qty</TableHead>
              <TableHead className="text-right">Line Capacity</TableHead>
              <TableHead className="text-right">Load</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visiblePlans.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-6 text-center text-xs text-[var(--text-muted)]"
                >
                  No production plans for the selected SKU-location scope.
                </TableCell>
              </TableRow>
            ) : (
              visiblePlans.map((plan) => (
                <TableRow key={plan.plan_id}>
                  <TableCell className="font-mono">{plan.plan_id}</TableCell>
                  <TableCell className="font-mono">{plan.location_id}</TableCell>
                  <TableCell className="font-mono">{formatWeekLabel(plan.week)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatUnits(plan.planned_qty)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatUnits(plan.capacity_qty)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {plan.capacity_qty > 0
                      ? formatPercent(plan.planned_qty / plan.capacity_qty)
                      : '—'}
                  </TableCell>
                  <TableCell>
                    <StatusBadge tone={PLAN_TONE[plan.status]} label={plan.status} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePaginationBar
          totalRows={plans.length}
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
          itemLabel="plans"
        />
      </CardContent>
    </Card>
  );
}
