import { RotateCcw } from 'lucide-react';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CauseCodeSchema,
  ShortageStatusSchema,
  type CauseCode,
  type ShortageStatus,
} from '@/data/schemas';
import { CAUSE_CODE_LABELS, SHORTAGE_STATUS_LABELS } from '@/lib/constants';
import { WeekRangeInputs } from './WeekRangeInputs';

export interface ShortageFiltersBarProps {
  status: ShortageStatus | 'ALL';
  cause: CauseCode | 'ALL';
  weekMin: number;
  weekMax: number;
  onStatusChange: (status: ShortageStatus | 'ALL') => void;
  onCauseChange: (cause: CauseCode | 'ALL') => void;
  onWeekMinChange: (week: number) => void;
  onWeekMaxChange: (week: number) => void;
  onReset: () => void;
}

/**
 * Filter bar for narrowing shortages by status, root cause, and inclusive week range.
 */
export function ShortageFiltersBar({
  status,
  cause,
  weekMin,
  weekMax,
  onStatusChange,
  onCauseChange,
  onWeekMinChange,
  onWeekMaxChange,
  onReset,
}: ShortageFiltersBarProps): React.ReactElement {
  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-3">
      <div className="w-40 space-y-1">
        <label
          htmlFor="filter-status"
          className="block text-xs font-medium text-[var(--text-secondary)]"
        >
          Status
        </label>
        <Select
          value={status}
          onValueChange={(value) => {
            if (value === 'ALL') {
              onStatusChange('ALL');
              return;
            }
            const parsed = ShortageStatusSchema.safeParse(value);
            if (parsed.success) {
              onStatusChange(parsed.data);
            }
          }}
        >
          <SelectTrigger id="filter-status" aria-label="Filter by status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {ShortageStatusSchema.options.map((option) => (
              <SelectItem key={option} value={option}>
                {SHORTAGE_STATUS_LABELS[option]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-48 space-y-1">
        <label
          htmlFor="filter-cause"
          className="block text-xs font-medium text-[var(--text-secondary)]"
        >
          Cause Code
        </label>
        <Select
          value={cause}
          onValueChange={(value) => {
            if (value === 'ALL') {
              onCauseChange('ALL');
              return;
            }
            const parsed = CauseCodeSchema.safeParse(value);
            if (parsed.success) {
              onCauseChange(parsed.data);
            }
          }}
        >
          <SelectTrigger id="filter-cause" aria-label="Filter by cause code">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All causes</SelectItem>
            {CauseCodeSchema.options.map((option) => (
              <SelectItem key={option} value={option}>
                {CAUSE_CODE_LABELS[option]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <WeekRangeInputs
        weekMin={weekMin}
        weekMax={weekMax}
        onWeekMinChange={onWeekMinChange}
        onWeekMaxChange={onWeekMaxChange}
      />

      <Button variant="outline" size="sm" onClick={onReset} className="ml-auto">
        <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
        <span>Reset filters</span>
      </Button>
    </div>
  );
}
