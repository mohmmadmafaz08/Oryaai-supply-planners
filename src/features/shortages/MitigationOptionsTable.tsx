import * as React from 'react';
import { StatusBadge } from '@/components/StatusBadge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Mitigation } from '@/data/schemas';
import { evaluateMitigationFeasibility } from '@/domain/mitigation';
import { cn } from '@/lib/cn';
import { MITIGATION_TYPE_LABELS } from '@/lib/constants';
import { formatDays, formatPercent, formatUnits, formatUsd } from '@/lib/format';

export interface MitigationOptionsTableProps {
  compliant: Mitigation[];
  nonCompliant: Mitigation[];
  supplierRemainingCapacity: number | null;
  selectedMitigationId: string | null;
  onSelectMitigation: (mitigationId: string) => void;
}

/**
 * Displays ranked feasible compliant mitigations alongside flagged non-compliant or over-capacity options.
 */
export function MitigationOptionsTable({
  compliant,
  nonCompliant,
  supplierRemainingCapacity,
  selectedMitigationId,
  onSelectMitigation,
}: MitigationOptionsTableProps): React.ReactElement {
  const allRows = [...compliant, ...nonCompliant];

  if (allRows.length === 0) {
    return (
      <p className="rounded-md border border-[var(--border-default)] bg-[var(--bg-subtle)] p-3 text-xs text-[var(--text-muted)]">
        No mitigation options available for this shortage.
      </p>
    );
  }

  return (
    <div className="rounded-md border border-[var(--border-default)]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Select</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Cost</TableHead>
            <TableHead className="text-right">Lead Time</TableHead>
            <TableHead className="text-right">Recovered</TableHead>
            <TableHead className="text-right">Service After</TableHead>
            <TableHead>Policy Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {allRows.map((option) => {
            const feasibility = evaluateMitigationFeasibility(option, supplierRemainingCapacity);
            const isSelected =
              feasibility.feasible && option.mitigation_id === selectedMitigationId;
            const badgeLabel = !option.policy_compliant
              ? 'Policy Violation'
              : !feasibility.feasible
                ? 'Exceeds Capacity'
                : 'Compliant';

            return (
              <TableRow
                key={option.mitigation_id}
                className={cn(
                  !feasibility.feasible && 'opacity-70',
                  isSelected && 'bg-[var(--accent-subtle)]',
                )}
              >
                <TableCell>
                  <input
                    type="radio"
                    name="mitigation-option"
                    checked={isSelected}
                    disabled={!feasibility.feasible}
                    aria-label={`Select mitigation ${option.mitigation_id}`}
                    onChange={() => {
                      if (feasibility.feasible) {
                        onSelectMitigation(option.mitigation_id);
                      }
                    }}
                    className="h-4 w-4 accent-[var(--accent)] cursor-pointer disabled:cursor-not-allowed"
                  />
                </TableCell>
                <TableCell className="px-2.5 font-medium">
                  <div className="whitespace-nowrap">{MITIGATION_TYPE_LABELS[option.type]}</div>
                  <div className="font-mono text-[11px] whitespace-nowrap text-[var(--text-muted)]">
                    {option.mitigation_id}
                  </div>
                </TableCell>
                <TableCell className="px-2.5 text-right whitespace-nowrap tabular-nums">
                  {formatUsd(option.cost_usd)}
                </TableCell>
                <TableCell className="px-2.5 text-right whitespace-nowrap tabular-nums">
                  {formatDays(option.lead_time_days)}
                </TableCell>
                <TableCell className="px-2.5 text-right whitespace-nowrap tabular-nums">
                  {formatUnits(option.recovered_units)}
                </TableCell>
                <TableCell className="px-2.5 text-right whitespace-nowrap tabular-nums">
                  {formatPercent(option.service_level_after)}
                </TableCell>
                <TableCell className="px-2.5">
                  <div className="space-y-1">
                    <StatusBadge
                      tone={feasibility.feasible ? 'ok' : 'critical'}
                      label={badgeLabel}
                    />
                    <p className="max-w-[200px] text-[11px] text-[var(--text-muted)]">
                      {feasibility.reason}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
