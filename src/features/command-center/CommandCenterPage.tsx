import * as React from 'react';
import { AsyncBoundary } from '@/components/AsyncBoundary';
import { KpiCard } from '@/components/KpiCard';
import { ShortageDetailSheet } from '@/features/shortages/ShortageDetailSheet';
import { formatCount, formatPercent } from '@/lib/format';
import { CommandCenterCharts } from './CommandCenterCharts';
import { DatabaseOverview } from './DatabaseOverview';
import { TopShortagesTable } from './TopShortagesTable';
import { useCommandCenterData } from './useCommandCenterData';

/**
 * Command Center overview displaying KPI derivations, shortage distributions, and priority queue.
 */
export function CommandCenterPage(): React.ReactElement {
  const {
    isLoading,
    error,
    refetchAll,
    metrics,
    topShortages,
    mitigations,
    selectedShortage,
    setSelectedShortageId,
    isEmpty,
  } = useCommandCenterData();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">
          Command Center
        </h1>
        <p className="text-xs text-[var(--text-muted)]">
          Network-wide supply exposure, inbound adherence, and policy-compliant mitigation
          readiness.
        </p>
      </div>

      <DatabaseOverview />

      <p className="text-xs font-medium text-muted-foreground">Interactive workspace — open any shortage to see causes, source records and mitigations.</p>

      <AsyncBoundary
        isLoading={isLoading}
        error={error}
        onRetry={refetchAll}
        isEmpty={isEmpty}
        emptyTitle="No shortage records loaded"
        emptyDescription="The loaded planning dataset contains zero shortage events."
      >
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <KpiCard
              label="Open shortages"
              value={formatCount(metrics.openShortageCount)}
              unit="shortages"
              derivation="Count of shortage records currently in OPEN status."
              tone={metrics.openShortageCount > 0 ? 'critical' : 'ok'}
            />
            <KpiCard
              label="Units at risk"
              value={formatCount(metrics.unitsAtRisk)}
              unit="units"
              derivation="Sum of shortage_qty across OPEN and MITIGATING records."
              tone={metrics.unitsAtRisk > 0 ? 'warning' : 'ok'}
            />
            <KpiCard
              label="Expected service level"
              value={formatPercent(metrics.expectedServiceLevel)}
              unit=""
              derivation="Clamped ratio of fulfilled demand to total 52-week demand."
              tone="info"
            />
            <KpiCard
              label="Avg supplier reliability"
              value={formatPercent(metrics.avgSupplierReliability)}
              unit=""
              derivation="Arithmetic mean of supplier reliability_score values."
              tone="neutral"
            />
            <KpiCard
              label="On-time inbound rate"
              value={formatPercent(metrics.onTimeInboundRate)}
              unit=""
              derivation="Share of evaluated POs received on or before promised_date with 0 delay."
              tone={metrics.onTimeInboundRate >= 0.85 ? 'ok' : 'warning'}
            />
            <KpiCard
              label="Shortages with a policy-compliant mitigation"
              value={formatPercent(metrics.shortagesWithCompliantMitigationRate)}
              unit=""
              derivation="Share of shortages having at least one feasible, policy-compliant option."
              tone={metrics.shortagesWithCompliantMitigationRate >= 0.75 ? 'ok' : 'warning'}
            />
          </div>

          <CommandCenterCharts
            weeklyShortageUnits={metrics.weeklyShortageUnits}
            causeBreakdown={metrics.causeBreakdown}
          />

          <TopShortagesTable
            shortages={topShortages}
            onSelectShortage={(shortageId) => {
              setSelectedShortageId(shortageId);
            }}
          />
        </div>
      </AsyncBoundary>

      <ShortageDetailSheet
        shortage={selectedShortage}
        mitigations={mitigations}
        onClose={() => {
          setSelectedShortageId(null);
        }}
      />
    </div>
  );
}
