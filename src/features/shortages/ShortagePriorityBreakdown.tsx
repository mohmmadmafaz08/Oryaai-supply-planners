import * as React from 'react';
import type { PriorityComponents, PriorityWeights } from '@/data/schemas';
import { computePriorityBreakdown } from '@/domain/shortage';
import { formatScore } from '@/lib/format';

export interface ShortagePriorityBreakdownProps {
  components: PriorityComponents;
  weights: PriorityWeights | undefined;
  reportedScore: number;
}

/**
 * Renders priority_components weighted by manifest.priority_weights and sums to priority_score.
 */
export function ShortagePriorityBreakdown({
  components,
  weights,
  reportedScore,
}: ShortagePriorityBreakdownProps): React.ReactElement {
  if (!weights) {
    return (
      <section className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 text-xs text-[var(--text-muted)]">
        Manifest priority weights unavailable. Reported score: {formatScore(reportedScore)}
      </section>
    );
  }

  const breakdown = computePriorityBreakdown(components, weights);

  return (
    <section className="space-y-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold text-[var(--text-primary)]">Priority Breakdown</h3>
        <span className="font-mono text-xs font-semibold tabular-nums text-[var(--text-primary)]">
          Score {formatScore(reportedScore)} (sum {formatScore(breakdown.computedScore)})
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {breakdown.rows.map((row) => (
          <div
            key={row.key}
            className="flex items-center justify-between rounded border border-[var(--border-default)] bg-[var(--bg-subtle)] px-3 py-2 text-xs"
          >
            <div>
              <div className="font-medium text-[var(--text-primary)]">{row.label}</div>
              <div className="font-mono text-[11px] tabular-nums text-[var(--text-muted)]">
                {row.rawValue.toFixed(2)} × weight {row.weight.toFixed(2)}
              </div>
            </div>
            <span className="font-mono font-semibold tabular-nums text-[var(--accent)]">
              +{formatScore(row.weightedPoints)} pts
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
