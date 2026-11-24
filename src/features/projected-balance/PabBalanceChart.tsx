import * as React from 'react';
import {
  Bar,
  Brush,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
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
import type { ProjectedBalanceRow } from '@/domain/pab';
import { formatCount, formatUnits, formatWeekLabel } from '@/lib/format';

export interface PabBalanceChartProps {
  rows: ProjectedBalanceRow[];
  skuId: string;
  locationId: string;
}

interface ClosingDotProps {
  cx?: number;
  cy?: number;
  payload?: { closing?: number; week?: number };
}

function renderBacklogDot(props: ClosingDotProps): React.ReactElement {
  const { cx, cy, payload } = props;
  if (cx === undefined || cy === undefined || !payload || (payload.closing ?? 0) >= 0) {
    return <g key={`empty-${String(payload?.week ?? cx ?? 0)}`} />;
  }
  return (
    <circle
      key={`backlog-${String(payload.week ?? cx)}`}
      cx={cx}
      cy={cy}
      r={4}
      fill="var(--status-critical)"
      stroke="var(--bg-surface)"
      strokeWidth={1.5}
    />
  );
}

/**
 * Visualizes inbound and demand bars alongside a linear closing balance series,
 * emphasised zero reference line, red backlog markers, and a 52-week zoom brush.
 */
export function PabBalanceChart({
  rows,
  skuId,
  locationId,
}: PabBalanceChartProps): React.ReactElement {
  const chartData = React.useMemo(
    () =>
      rows.map((row) => ({
        ...row,
        weekLabel: formatWeekLabel(row.week),
      })),
    [rows],
  );

  return (
    <ChartFrame
      title="Weekly Projected Available Balance"
      description={`${skuId} at ${locationId} · Bars show inbound and demand; linear line shows closing balance with red backlog markers`}
      summary={`Composed bar and linear line chart for ${skuId} at ${locationId} across ${formatCount(rows.length)} weeks with zero-balance line and zoom brush.`}
      chart={
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 16, left: 4, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
              <XAxis
                dataKey="weekLabel"
                interval={3}
                tick={{ fill: 'var(--chart-axis)', fontSize: 11 }}
              />
              <YAxis tick={{ fill: 'var(--chart-axis)', fontSize: 11 }} />
              <ReferenceLine
                y={0}
                stroke="var(--status-critical)"
                strokeWidth={2}
                strokeDasharray="4 4"
              />
              <Tooltip
                formatter={(value, name) => [formatUnits(Number(value ?? 0)), String(name)]}
                contentStyle={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-default)',
                  borderRadius: '6px',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="inbound" name="Inbound" fill="var(--chart-series-inbound)" />
              <Bar dataKey="demand" name="Demand" fill="var(--chart-series-demand)" />
              <Line
                type="linear"
                dataKey="closing"
                name="Closing"
                stroke="var(--chart-series-closing)"
                strokeWidth={2}
                dot={renderBacklogDot}
                activeDot={{ r: 5 }}
              />
              <Brush
                dataKey="weekLabel"
                height={24}
                stroke="var(--accent)"
                fill="var(--bg-muted)"
                travellerWidth={8}
              />
            </ComposedChart>
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
            {chartData.map((row) => (
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
