import * as React from 'react';
import { AsyncBoundary } from '@/components/AsyncBoundary';
import { PabBalanceChart } from './PabBalanceChart';
import { PabReconciliationTable } from './PabReconciliationTable';
import { PabSelectors } from './PabSelectors';
import { useProjectedBalance } from './useProjectedBalance';

/**
 * Projected Balance screen displaying SKU-location PAB trajectory and weekly arithmetic audit.
 */
export function ProjectedBalancePage(): React.ReactElement {
  const state = useProjectedBalance();
  const isEmpty = !state.isLoading && !state.error && state.projection.rows.length === 0;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">
          Projected Balance
        </h1>
        <p className="text-xs text-[var(--text-muted)]">
          Inspect weekly opening, inbound, demand, and closing balance carry-forward arithmetic.
        </p>
      </div>

      <PabSelectors
        skus={state.skus}
        locations={state.locations}
        selectedSkuId={state.selectedSkuId}
        selectedLocationId={state.selectedLocationId}
        onSkuChange={state.setSelectedSkuId}
        onLocationChange={state.setSelectedLocationId}
      />

      <AsyncBoundary
        isLoading={state.isLoading}
        error={state.error}
        onRetry={state.refetchAll}
        isEmpty={isEmpty}
        emptyTitle="No weekly balance rows found"
        emptyDescription="Select a different SKU and location pair to inspect projected available balance."
      >
        <div className="space-y-4">
          <PabBalanceChart
            rows={state.projection.rows}
            skuId={state.selectedSkuId}
            locationId={state.selectedLocationId}
          />
          <PabReconciliationTable
            rows={state.projection.rows}
            errorCount={state.projection.reconciliationErrors.length}
          />
        </div>
      </AsyncBoundary>
    </div>
  );
}
