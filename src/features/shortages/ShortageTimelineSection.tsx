import * as React from 'react';
import { StatusBadge, type SemanticTone } from '@/components/StatusBadge';
import type { ShortageEvent, ShortageStatus } from '@/data/schemas';
import { ACTOR_ROLE_LABELS, SHORTAGE_STATUS_LABELS } from '@/lib/constants';

const STATUS_TONE: Record<ShortageStatus, SemanticTone> = {
  OPEN: 'critical',
  MITIGATING: 'warning',
  RESOLVED: 'ok',
};

export interface ShortageTimelineSectionProps {
  events: ShortageEvent[];
}

/**
 * Renders chronological shortage lifecycle events from shortage_events.json.
 */
export function ShortageTimelineSection({
  events,
}: ShortageTimelineSectionProps): React.ReactElement {
  const ordered = React.useMemo(
    () => [...events].sort((a, b) => a.occurred_on.localeCompare(b.occurred_on)),
    [events],
  );

  return (
    <section className="space-y-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-4">
      <h3 className="text-xs font-semibold text-[var(--text-primary)]">Event Timeline</h3>
      {ordered.length === 0 ? (
        <p className="text-xs text-[var(--text-muted)]">No lifecycle events recorded.</p>
      ) : (
        <ol className="space-y-2">
          {ordered.map((evt) => (
            <li
              key={evt.event_id}
              className="flex flex-wrap items-center justify-between gap-2 rounded border border-[var(--border-default)] bg-[var(--bg-subtle)] px-3 py-2 text-xs"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[11px] text-[var(--text-muted)]">
                  {evt.event_id}
                </span>
                <span className="text-[var(--text-secondary)]">
                  {evt.from_status ? SHORTAGE_STATUS_LABELS[evt.from_status] : 'Created'} →
                </span>
                <StatusBadge
                  tone={STATUS_TONE[evt.to_status]}
                  label={SHORTAGE_STATUS_LABELS[evt.to_status]}
                />
              </div>
              <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
                <span>{ACTOR_ROLE_LABELS[evt.actor_role]}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">{evt.occurred_on}</span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
