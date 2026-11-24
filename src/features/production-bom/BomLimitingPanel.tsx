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
import type { BomComponentAvailability } from '@/domain/supply';
import { cn } from '@/lib/cn';
import { formatCount, formatUnits } from '@/lib/format';

export interface BomLimitingPanelProps {
  parentSkuId: string;
  components: BomComponentAvailability[];
}

/**
 * Displays Bill of Materials component availability and highlights limiting components.
 */
export function BomLimitingPanel({
  parentSkuId,
  components,
}: BomLimitingPanelProps): React.ReactElement {
  const maxBuildable =
    components.length > 0 ? Math.min(...components.map((c) => c.buildableParents)) : 0;

  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-2">
        <div>
          <CardTitle>Bill of Materials & Limiting Components ({parentSkuId})</CardTitle>
          <CardDescription>
            Component on-hand vs projected net available and maximum buildable finished-good units
          </CardDescription>
        </div>
        <StatusBadge
          tone={maxBuildable > 0 ? 'info' : 'critical'}
          label={`Max buildable: ${formatUnits(maxBuildable)}`}
        />
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-[var(--border-default)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Component SKU</TableHead>
                <TableHead className="text-right">Qty / Parent</TableHead>
                <TableHead className="text-right">On-Hand</TableHead>
                <TableHead className="text-right">Net Available</TableHead>
                <TableHead className="text-right">Buildable Parents</TableHead>
                <TableHead>Constraint</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {components.map((comp) => (
                <TableRow
                  key={comp.componentSkuId}
                  className={cn(comp.isLimiting && 'bg-[var(--status-warning-bg)]')}
                >
                  <TableCell>
                    <div className="font-mono font-medium">{comp.componentSkuId}</div>
                    <div className="text-xs text-[var(--text-muted)]">{comp.description}</div>
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {formatCount(comp.qtyPerParent)} {comp.uom}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatUnits(comp.onHandQty, comp.uom)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatUnits(comp.projectedNetAvailable, comp.uom)}
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">
                    {formatUnits(comp.buildableParents)}
                  </TableCell>
                  <TableCell>
                    {comp.isLimiting ? (
                      <StatusBadge tone="warning" label="Limiting Component" />
                    ) : (
                      <StatusBadge tone="ok" label="Sufficient" />
                    )}
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
