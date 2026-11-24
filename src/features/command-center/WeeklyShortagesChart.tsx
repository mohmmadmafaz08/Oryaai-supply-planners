import * as React from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartFrame } from '@/components/ChartFrame';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { WeeklyShortageTotal } from '@/domain/shortage';
import { formatCount, formatUnits } from '@/lib/format';

export interface WeeklyShortagesChartProps {
  weeklyShortageUnits: WeeklyShortageTotal[];
}

/**
 * Renders shortage units by week as a vertical bar chart with accessible table fallback.
 */
export function WeeklyShortagesChart({
  weeklyShortageUnits,
}: WeeklyShortagesChartProps): React.ReactElement {
  const totalWeeklyUnits = weeklyShortageUnits.reduce((sum, item) => sum + item.units, 0);

  return (
    <ChartFrame
      title="Shortage Units by Week"
      description="Total shortage quantity distributed across planning weeks"
      summary={`Bar chart showing ${formatUnits(totalWeeklyUnits)} across ${formatCount(weeklyShortageUnits.length)} shortage weeks.`}
      chart={
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyShortageUnits} margin={{ top: 8, right: 12, left: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
              <XAxis
                dataKey="weekLabel"
                tick={{ fill: 'var(--chart-axis)', fontSize: 11 }}
                axisLine={{ stroke: 'var(--border-default)' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: 'var(--chart-axis)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(value) => [formatUnits(Number(value ?? 0)), 'Shortage']}
                contentStyle={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-default)',
                  borderRadius: '6px',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="units" fill="var(--chart-series-primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      }
      tableFallback={
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Week</TableHead>
              <TableHead className="text-right">Shortage Count</TableHead>
              <TableHead className="text-right">Shortage Units</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {weeklyShortageUnits.map((row) => (
              <TableRow key={row.week}>
                <TableCell className="font-mono">{row.weekLabel}</TableCell>
                <TableCell className="text-right tabular-nums">{formatCount(row.count)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatUnits(row.units)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      }
    />
  );
}
