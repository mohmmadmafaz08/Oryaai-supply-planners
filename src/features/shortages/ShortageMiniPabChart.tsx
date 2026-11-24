import * as React from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartFrame } from '@/components/ChartFrame';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { PabWeeklyRow } from '@/data/schemas';
import { projectBalance } from '@/domain/pab';
import { formatUnits, formatWeekLabel } from '@/lib/format';

export interface ShortageMiniPabChartProps {
  skuId: string;
  locationId: string;
  focusWeek: number;
  pabRows: PabWeeklyRow[];
}

const MINI_WINDOW_RADIUS = 5;

/**
 * Renders a localized mini PAB closing balance chart around a shortage week.
 */
export function ShortageMiniPabChart({
  skuId,
  locationId,
  focusWeek,
  pabRows,
}: ShortageMiniPabChartProps): React.ReactElement {
  const windowRows = React.useMemo(() => {
    const pairRows = pabRows.filter(
      (row) => row.sku_id === skuId && row.location_id === locationId,
    );
    const projected = projectBalance(pairRows).rows;
    return projected
      .filter(
        (row) =>
          row.week >= focusWeek - MINI_WINDOW_RADIUS && row.week <= focusWeek + MINI_WINDOW_RADIUS,
      )
      .map((row) => ({ ...row, weekLabel: formatWeekLabel(row.week) }));
  }, [pabRows, skuId, locationId, focusWeek]);

  return (
    <ChartFrame
      title="Local Projected Balance Window"
      description={`${skuId} at ${locationId} around ${formatWeekLabel(focusWeek)}`}
      summary={`Closing balance trajectory for ${skuId} at ${locationId} across ${String(windowRows.length)} weeks centered on ${formatWeekLabel(focusWeek)}.`}
      chart={
        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={windowRows} margin={{ top: 8, right: 12, left: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
              <XAxis dataKey="weekLabel" tick={{ fill: 'var(--chart-axis)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'var(--chart-axis)', fontSize: 11 }} />
              <ReferenceLine y={0} stroke="var(--status-critical)" strokeDasharray="4 4" />
              <Tooltip
                formatter={(value) => [formatUnits(Number(value ?? 0)), 'Closing']}
                contentStyle={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-default)',
                  borderRadius: '6px',
                  fontSize: '12px',
                }}
              />
              <Line
                type="monotone"
                dataKey="closing"
                stroke="var(--chart-series-primary)"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      }
      tableFallback={
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Week</TableHead>
              <TableHead className="text-right">Opening</TableHead>
              <TableHead className="text-right">Inbound</TableHead>
              <TableHead className="text-right">Demand</TableHead>
              <TableHead className="text-right">Closing</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {windowRows.map((row) => (
              <TableRow key={row.week}>
                <TableCell className="font-mono">{row.weekLabel}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatUnits(row.opening)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatUnits(row.inbound)}
                </TableCell>
                <TableCell className="text-right tabular-nums">{formatUnits(row.demand)}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatUnits(row.closing)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      }
    />
  );
}
