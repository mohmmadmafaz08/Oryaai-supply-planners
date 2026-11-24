import * as React from 'react';
import { MAX_WEEK, MIN_WEEK } from '@/lib/constants';

export interface WeekRangeInputsProps {
  weekMin: number;
  weekMax: number;
  onWeekMinChange: (week: number) => void;
  onWeekMaxChange: (week: number) => void;
}

/**
 * Numeric week-range filter inputs bounded to the 52-week planning horizon.
 */
export function WeekRangeInputs({
  weekMin,
  weekMax,
  onWeekMinChange,
  onWeekMaxChange,
}: WeekRangeInputsProps): React.ReactElement {
  return (
    <>
      <div className="w-28 space-y-1">
        <label
          htmlFor="filter-week-min"
          className="block text-xs font-medium text-[var(--text-secondary)]"
        >
          From Week
        </label>
        <input
          id="filter-week-min"
          type="number"
          min={MIN_WEEK}
          max={weekMax}
          value={weekMin}
          onChange={(event) => {
            const val = Number.parseInt(event.target.value, 10);
            if (!Number.isNaN(val)) {
              onWeekMinChange(val);
            }
          }}
          className="h-9 w-full rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] px-2.5 text-[13px] tabular-nums text-[var(--text-primary)]"
        />
      </div>

      <div className="w-28 space-y-1">
        <label
          htmlFor="filter-week-max"
          className="block text-xs font-medium text-[var(--text-secondary)]"
        >
          To Week
        </label>
        <input
          id="filter-week-max"
          type="number"
          min={weekMin}
          max={MAX_WEEK}
          value={weekMax}
          onChange={(event) => {
            const val = Number.parseInt(event.target.value, 10);
            if (!Number.isNaN(val)) {
              onWeekMaxChange(val);
            }
          }}
          className="h-9 w-full rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] px-2.5 text-[13px] tabular-nums text-[var(--text-primary)]"
        />
      </div>
    </>
  );
}
