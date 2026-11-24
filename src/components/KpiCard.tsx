import * as React from 'react';
import { Card, CardContent, CardHeader } from './ui/card';

export interface KpiCardProps {
  label: string;
  value: string;
  unit: string;
  derivation: string;
  tone?: 'neutral' | 'critical' | 'warning' | 'ok' | 'info';
}

const TONE_VALUE_CLASS: Record<NonNullable<KpiCardProps['tone']>, string> = {
  neutral: 'text-[var(--text-primary)]',
  critical: 'text-[var(--status-critical)]',
  warning: 'text-[var(--status-warning)]',
  ok: 'text-[var(--status-ok)]',
  info: 'text-[var(--status-info)]',
};

/**
 * Displays a single planner KPI with explicit unit and one-line derivation rule.
 */
export function KpiCard({
  label,
  value,
  unit,
  derivation,
  tone = 'neutral',
}: KpiCardProps): React.ReactElement {
  const showUnit = unit.length > 0 && !value.endsWith(unit);

  return (
    <Card>
      <CardHeader className="pb-1">
        <span className="text-xs font-medium text-[var(--text-secondary)]">{label}</span>
      </CardHeader>
      <CardContent className="space-y-1.5">
        <div className="flex items-baseline gap-1.5">
          <span
            className={`text-2xl font-semibold tracking-tight tabular-nums ${TONE_VALUE_CLASS[tone]}`}
          >
            {value}
          </span>
          {showUnit ? <span className="text-xs text-[var(--text-muted)]">{unit}</span> : null}
        </div>
        <p className="text-xs text-[var(--text-muted)]">{derivation}</p>
      </CardContent>
    </Card>
  );
}
