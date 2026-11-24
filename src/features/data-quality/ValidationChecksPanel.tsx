import * as React from 'react';
import type { ValidationCheck } from '@/data/schemas';
import { formatCount } from '@/lib/format';
import { ValidationGroupCard } from './ValidationGroupCard';

export interface ValidationChecksPanelProps {
  cleanBaselineChecks: ValidationCheck[];
  injectedAnomalyChecks: ValidationCheck[];
}

/**
 * Displays dataset validation checks split into Clean Baseline invariants and Injected Anomalies.
 */
export function ValidationChecksPanel({
  cleanBaselineChecks,
  injectedAnomalyChecks,
}: ValidationChecksPanelProps): React.ReactElement {
  const cleanPassed = cleanBaselineChecks.filter((c) => c.status === 'PASS').length;
  const anomaliesDetected = injectedAnomalyChecks.filter((c) => c.status === 'FAIL').length;

  return (
    <div className="space-y-4">
      <ValidationGroupCard
        title="Clean baseline"
        description="Core relational, schema, date-ordering, and lifecycle invariants expected to pass unconditionally"
        badgeLabel={`${formatCount(cleanPassed)}/${formatCount(cleanBaselineChecks.length)} PASS`}
        badgeTone={cleanPassed === cleanBaselineChecks.length ? 'ok' : 'critical'}
        checks={cleanBaselineChecks}
      />

      <ValidationGroupCard
        title="Injected anomalies"
        description="Deterministic QA edge-case checks verifying expected failure detection across seeded defects"
        badgeLabel={`${formatCount(anomaliesDetected)}/${formatCount(injectedAnomalyChecks.length)} detected`}
        badgeTone={anomaliesDetected === injectedAnomalyChecks.length ? 'info' : 'warning'}
        checks={injectedAnomalyChecks}
      />
    </div>
  );
}
