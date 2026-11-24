import * as React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Mitigation } from '@/data/schemas';
import { MITIGATION_TYPE_LABELS } from '@/lib/constants';
import { formatUnits, formatUsd } from '@/lib/format';

export interface SimulatorMitigationSelectProps {
  availableMitigations: Mitigation[];
  selectedMitigationId: string | null;
  onMitigationChange: (mitigationId: string | null) => void;
}

/**
 * Policy-compliant mitigation selector overlaid onto the Simulator scenario series.
 */
export function SimulatorMitigationSelect({
  availableMitigations,
  selectedMitigationId,
  onMitigationChange,
}: SimulatorMitigationSelectProps): React.ReactElement {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[var(--border-default)] bg-[var(--bg-subtle)] p-3">
      <div className="min-w-[260px] flex-1 space-y-1">
        <label
          htmlFor="sim-mitigation"
          className="block text-xs font-medium text-[var(--text-secondary)]"
        >
          Apply mitigation
        </label>
        <Select
          value={selectedMitigationId ?? 'NONE'}
          onValueChange={(val) => {
            onMitigationChange(val === 'NONE' ? null : val);
          }}
        >
          <SelectTrigger id="sim-mitigation" aria-label="Apply mitigation">
            <SelectValue placeholder="None" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="NONE">None (scenario only)</SelectItem>
            {availableMitigations.map((m) => (
              <SelectItem key={m.mitigation_id} value={m.mitigation_id}>
                {MITIGATION_TYPE_LABELS[m.type]} ({m.mitigation_id}) · +
                {formatUnits(m.recovered_units)} · {formatUsd(m.cost_usd)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {availableMitigations.length === 0 ? (
        <span className="text-xs text-[var(--text-muted)]">
          No policy-compliant mitigations tied to this SKU-location.
        </span>
      ) : null}
    </div>
  );
}
