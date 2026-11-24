import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Mitigation, Shortage } from '@/data/schemas';
import { MITIGATION_TYPE_LABELS } from '@/lib/constants';
import { formatPercent, formatUnits, formatUsd } from '@/lib/format';

export interface MitigationComparisonPanelProps {
  shortage: Shortage;
  baselineServiceLevel: number;
  selectedMitigation: Mitigation;
}

/**
 * Displays baseline vs. selected-mitigation impact across units, cost, and service level.
 */
export function MitigationComparisonPanel({
  shortage,
  baselineServiceLevel,
  selectedMitigation,
}: MitigationComparisonPanelProps): React.ReactElement {
  const remainingShortage = Math.max(0, shortage.shortage_qty - selectedMitigation.recovered_units);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>
          Baseline vs. {MITIGATION_TYPE_LABELS[selectedMitigation.type]} (
          {selectedMitigation.mitigation_id})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div className="rounded-md border border-[var(--border-default)] bg-[var(--bg-subtle)] p-2.5">
            <p className="text-[var(--text-muted)]">Net Shortage Units</p>
            <p className="mt-1 font-medium tabular-nums text-[var(--text-primary)]">
              {formatUnits(shortage.shortage_qty)} → {formatUnits(remainingShortage)}
            </p>
            <p className="mt-0.5 tabular-nums text-[var(--status-ok)]">
              -{formatUnits(selectedMitigation.recovered_units)} recovered
            </p>
          </div>
          <div className="rounded-md border border-[var(--border-default)] bg-[var(--bg-subtle)] p-2.5">
            <p className="text-[var(--text-muted)]">Mitigation Cost</p>
            <p className="mt-1 font-medium tabular-nums text-[var(--text-primary)]">
              {formatUsd(0)} → {formatUsd(selectedMitigation.cost_usd)}
            </p>
            <p className="mt-0.5 tabular-nums text-[var(--text-muted)]">
              +{formatUsd(selectedMitigation.cost_usd)} incremental
            </p>
          </div>
          <div className="rounded-md border border-[var(--border-default)] bg-[var(--bg-subtle)] p-2.5">
            <p className="text-[var(--text-muted)]">Service Level</p>
            <p className="mt-1 font-medium tabular-nums text-[var(--text-primary)]">
              {formatPercent(baselineServiceLevel)} →{' '}
              {formatPercent(selectedMitigation.service_level_after)}
            </p>
            <p className="mt-0.5 tabular-nums text-[var(--status-ok)]">
              +
              {formatPercent(
                Math.max(0, selectedMitigation.service_level_after - baselineServiceLevel),
              )}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
