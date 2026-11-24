import * as React from 'react';
import { KpiCard } from '@/components/KpiCard';
import type { EvaluationMetrics } from '@/data/schemas';
import { formatCount, formatPercent } from '@/lib/format';

export interface EvaluationMetricsCardsProps {
  metrics: EvaluationMetrics | undefined;
}

/**
 * Displays ground-truth QA evaluation metrics (recall, precision, unexpected failures, explained share).
 */
export function EvaluationMetricsCards({
  metrics,
}: EvaluationMetricsCardsProps): React.ReactElement | null {
  if (!metrics) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        label="Detection recall"
        value={formatPercent(metrics.detection_recall)}
        unit=""
        derivation={`${formatCount(metrics.detected_count)} of ${formatCount(metrics.total_injected)} injected defects caught.`}
        tone={metrics.detection_recall === 1 ? 'ok' : 'warning'}
      />
      <KpiCard
        label="Detection precision"
        value={formatPercent(metrics.detection_precision)}
        unit=""
        derivation="Share of raised anomaly flags matching true injected defects."
        tone={metrics.detection_precision === 1 ? 'ok' : 'warning'}
      />
      <KpiCard
        label="Unexpected failures"
        value={formatCount(metrics.unexpected_failures)}
        unit="failures"
        derivation="Clean-baseline checks failing outside injected edge cases."
        tone={metrics.unexpected_failures === 0 ? 'ok' : 'critical'}
      />
      <KpiCard
        label="Explained shortage share"
        value={formatPercent(metrics.explained_shortage_share)}
        unit=""
        derivation="Share of shortages linked to valid demand/PO/lead-time evidence."
        tone={metrics.explained_shortage_share >= 0.95 ? 'ok' : 'warning'}
      />
    </div>
  );
}
