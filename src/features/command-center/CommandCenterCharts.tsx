import * as React from 'react';
import type { CauseBreakdownItem, WeeklyShortageTotal } from '@/domain/shortage';
import { CauseBreakdownChart } from './CauseBreakdownChart';
import { WeeklyShortagesChart } from './WeeklyShortagesChart';

export interface CommandCenterChartsProps {
  weeklyShortageUnits: WeeklyShortageTotal[];
  causeBreakdown: CauseBreakdownItem[];
}

/**
 * Arranges the Command Center weekly and cause-code charts side by side.
 */
export function CommandCenterCharts({
  weeklyShortageUnits,
  causeBreakdown,
}: CommandCenterChartsProps): React.ReactElement {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <WeeklyShortagesChart weeklyShortageUnits={weeklyShortageUnits} />
      <CauseBreakdownChart causeBreakdown={causeBreakdown} />
    </div>
  );
}
