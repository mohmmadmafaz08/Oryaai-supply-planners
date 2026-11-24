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
import type { CauseCode } from '@/data/schemas';
import type { CauseBreakdownItem } from '@/domain/shortage';
import { cn } from '@/lib/cn';
import { CAUSE_CODE_COLORS, CAUSE_CODE_LABELS } from '@/lib/constants';
import { formatCount, formatUnits } from '@/lib/format';

const CAUSE_SWATCH_CLASS: Record<CauseCode, string> = {
  DEMAND_SPIKE: 'bg-[var(--cause-demand-spike)]',
  LATE_INBOUND: 'bg-[var(--cause-late-inbound)]',
  SUPPLIER_CAPACITY: 'bg-[var(--cause-supplier-capacity)]',
  LEAD_TIME_GAP: 'bg-[var(--cause-lead-time-gap)]',
};

interface BarShapeProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  payload?: { fill?: string };
}

function renderCauseBarShape(props: BarShapeProps): React.ReactElement {
  const x = props.x ?? 0;
  const y = props.y ?? 0;
  const width = Math.max(0, props.width ?? 0);
  const height = Math.max(0, props.height ?? 0);
  const fill = props.payload?.fill ?? 'var(--status-warning)';

  return <rect x={x} y={y} width={width} height={height} rx={4} ry={4} fill={fill} />;
}

export interface CauseBreakdownChartProps {
  causeBreakdown: CauseBreakdownItem[];
}

/**
 * Renders shortages by cause_code as a horizontal bar chart colored per cause token.
 */
export function CauseBreakdownChart({
  causeBreakdown,
}: CauseBreakdownChartProps): React.ReactElement {
  const causeChartData = React.useMemo(
    () =>
      causeBreakdown.map((item) => ({
        ...item,
        label: CAUSE_CODE_LABELS[item.causeCode],
        fill: CAUSE_CODE_COLORS[item.causeCode],
      })),
    [causeBreakdown],
  );

  return (
    <ChartFrame
      title="Shortages by Cause Code"
      description="Horizontal breakdown of total units at risk by root cause"
      summary={`Horizontal bar chart breaking down shortages across ${formatCount(causeChartData.length)} root cause categories.`}
      chart={
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={causeChartData}
              layout="vertical"
              margin={{ top: 8, right: 16, left: 24, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fill: 'var(--chart-axis)', fontSize: 11 }}
                axisLine={{ stroke: 'var(--border-default)' }}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="label"
                width={120}
                tick={{ fill: 'var(--chart-axis)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(value) => [formatUnits(Number(value ?? 0)), 'Units']}
                contentStyle={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-default)',
                  borderRadius: '6px',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="units" shape={renderCauseBarShape} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      }
      tableFallback={
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cause</TableHead>
              <TableHead className="text-right">Records</TableHead>
              <TableHead className="text-right">Total Units</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {causeChartData.map((row) => (
              <TableRow key={row.causeCode}>
                <TableCell className="flex items-center gap-2">
                  <span
                    className={cn(
                      'inline-block h-2.5 w-2.5 rounded-xs',
                      CAUSE_SWATCH_CLASS[row.causeCode],
                    )}
                    aria-hidden="true"
                  />
                  <span>{row.label}</span>
                </TableCell>
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
