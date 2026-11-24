import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { SimulationSeriesSummary } from '@/domain/simulate';
import {
  formatCount,
  formatPercent,
  formatPercentagePoints,
  formatSignedUnits,
  formatUnits,
  formatUsd,
} from '@/lib/format';

export interface SimulatorComparisonCardsProps {
  baseline: SimulationSeriesSummary;
  scenario: SimulationSeriesSummary;
  mitigated: SimulationSeriesSummary | null;
  mitigationCostUsd: number;
}

interface ComparisonRow {
  label: string;
  baselineText: string;
  scenarioText: string;
  mitigatedText: string;
  deltaNote: string;
}

/**
 * Displays Baseline, Scenario, and Mitigated D1 shortage metrics with signed unit/pp deltas.
 */
export function SimulatorComparisonCards({
  baseline,
  scenario,
  mitigated,
  mitigationCostUsd,
}: SimulatorComparisonCardsProps): React.ReactElement {
  const shortageDelta = scenario.totalShortageUnits - baseline.totalShortageUnits;
  const peakDelta = scenario.peakBacklog - baseline.peakBacklog;
  const weeksDelta = scenario.weeksInShortage - baseline.weeksInShortage;
  const fillRateDelta = scenario.fillRate - baseline.fillRate;

  const rows: ComparisonRow[] = [
    {
      label: 'Total shortage units',
      baselineText: formatUnits(baseline.totalShortageUnits),
      scenarioText: formatUnits(scenario.totalShortageUnits),
      mitigatedText: mitigated ? formatUnits(mitigated.totalShortageUnits) : '—',
      deltaNote: `${formatSignedUnits(shortageDelta)} vs baseline`,
    },
    {
      label: 'Peak backlog',
      baselineText: formatUnits(baseline.peakBacklog),
      scenarioText: formatUnits(scenario.peakBacklog),
      mitigatedText: mitigated ? formatUnits(mitigated.peakBacklog) : '—',
      deltaNote: `${formatSignedUnits(peakDelta)} vs baseline`,
    },
    {
      label: 'Weeks in shortage',
      baselineText: `${formatCount(baseline.weeksInShortage)} weeks`,
      scenarioText: `${formatCount(scenario.weeksInShortage)} weeks`,
      mitigatedText: mitigated ? `${formatCount(mitigated.weeksInShortage)} weeks` : '—',
      deltaNote: `${formatSignedUnits(weeksDelta, 'weeks')} vs baseline`,
    },
    {
      label: 'Fill rate',
      baselineText: formatPercent(baseline.fillRate),
      scenarioText: formatPercent(scenario.fillRate),
      mitigatedText: mitigated ? formatPercent(mitigated.fillRate) : '—',
      deltaNote: `${formatPercentagePoints(fillRateDelta)} vs baseline`,
    },
  ];

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {rows.map((row) => (
          <Card key={row.label}>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs font-medium text-[var(--text-secondary)]">
                {row.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="block text-[var(--text-muted)]">Baseline</span>
                  <span className="font-mono text-sm font-semibold tabular-nums text-[var(--text-primary)]">
                    {row.baselineText}
                  </span>
                </div>
                <div>
                  <span className="block text-[var(--text-muted)]">Scenario</span>
                  <span className="font-mono text-sm font-semibold tabular-nums text-[var(--accent)]">
                    {row.scenarioText}
                  </span>
                </div>
                <div>
                  <span className="block text-[var(--text-muted)]">Mitigated</span>
                  <span className="font-mono text-sm font-semibold tabular-nums text-[var(--status-ok)]">
                    {row.mitigatedText}
                  </span>
                </div>
              </div>
              <p className="text-xs tabular-nums text-[var(--text-muted)]">{row.deltaNote}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      {mitigated ? (
        <p className="text-xs text-[var(--text-secondary)] tabular-nums">
          Applied mitigation incremental cost:{' '}
          <span className="font-mono font-medium text-[var(--text-primary)]">
            {formatUsd(mitigationCostUsd)}
          </span>
        </p>
      ) : null}
    </div>
  );
}
