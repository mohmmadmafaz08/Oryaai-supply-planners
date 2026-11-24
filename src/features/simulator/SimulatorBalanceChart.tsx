import * as React from 'react';
import {
  CartesianGrid,
  Legend,
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
import type { SimulationOutcome } from '@/domain/simulate';
import { formatUnits, formatWeekLabel } from '@/lib/format';

export interface SimulatorBalanceChartProps {
  outcome: SimulationOutcome;
  skuId: string;
  locationId: string;
}

/**
 * Overlays baseline, scenario, and optional mitigated linear closing balances across 52 weeks.
 */
export function SimulatorBalanceChart({
  outcome,
  skuId,
  locationId,
}: SimulatorBalanceChartProps): React.ReactElement {
  const hasMitigated = outcome.mitigated !== null;

  const mergedData = React.useMemo(() => {
    const scenarioByWeek = new Map(outcome.scenario.rows.map((r) => [r.week, r.closing]));
    const mitigatedByWeek = new Map(
      (outcome.mitigated?.rows ?? []).map((r) => [r.week, r.closing]),
    );
    return outcome.baseline.rows.map((row) => ({
      week: row.week,
      weekLabel: formatWeekLabel(row.week),
      baselineClosing: row.closing,
      scenarioClosing: scenarioByWeek.get(row.week) ?? row.closing,
      mitigatedClosing: hasMitigated ? (mitigatedByWeek.get(row.week) ?? row.closing) : undefined,
    }));
  }, [outcome, hasMitigated]);

  return (
    <ChartFrame
      title="Baseline vs. Scenario Closing Balance"
      description={`${skuId} at ${locationId} · Projected ending inventory across 52 weeks`}
      summary={`Linear line chart comparing baseline, simulated scenario, and mitigated closing balances for ${skuId} at ${locationId}.`}
      chart={
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mergedData} margin={{ top: 10, right: 16, left: 4, bottom: 4 }}>
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
              <Line
                type="linear"
                dataKey="baselineClosing"
                name="Baseline Closing"
                stroke="var(--chart-series-secondary)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="linear"
                dataKey="scenarioClosing"
                name="Scenario Closing"
                stroke="var(--chart-series-primary)"
                strokeWidth={2}
                dot={false}
              />
              {hasMitigated ? (
                <Line
                  type="linear"
                  dataKey="mitigatedClosing"
                  name="Mitigated Closing"
                  stroke="var(--status-ok)"
                  strokeWidth={2}
                  dot={false}
                />
              ) : null}
            </LineChart>
          </ResponsiveContainer>
        </div>
      }
      tableFallback={
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Week</TableHead>
              <TableHead className="text-right">Baseline Closing</TableHead>
              <TableHead className="text-right">Scenario Closing</TableHead>
              {hasMitigated ? (
                <TableHead className="text-right">Mitigated Closing</TableHead>
              ) : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {mergedData.map((row) => (
              <TableRow key={row.week}>
                <TableCell className="font-mono">{row.weekLabel}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatUnits(row.baselineClosing)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatUnits(row.scenarioClosing)}
                </TableCell>
                {hasMitigated ? (
                  <TableCell className="text-right tabular-nums">
                    {row.mitigatedClosing !== undefined ? formatUnits(row.mitigatedClosing) : '—'}
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      }
    />
  );
}
