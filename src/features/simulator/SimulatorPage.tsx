import * as React from 'react';
import { AsyncBoundary } from '@/components/AsyncBoundary';
import { PabSelectors } from '@/features/projected-balance/PabSelectors';
import { SimulatorBalanceChart } from './SimulatorBalanceChart';
import { SimulatorComparisonCards } from './SimulatorComparisonCards';
import { SimulatorControlsPanel } from './SimulatorControlsPanel';
import { useSimulatorControls } from './useSimulatorControls';
import { SaveScenarioButton } from '@/features/scenarios/SaveScenarioButton';

/**
 * Simulator screen for running interactive browser-side supply and demand stress scenarios.
 */
export function SimulatorPage(): React.ReactElement {
  const sim = useSimulatorControls();
  const isEmpty = !sim.isLoading && !sim.error && sim.outcome.baseline.rows.length === 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">
            Simulator
          </h1>
          <p className="text-xs text-[var(--text-muted)]">
            Stress-test demand spikes, inbound delays, supplier capacity clipping, and mitigations.
          </p>
        </div>
        <SaveScenarioButton skuId={sim.selectedSkuId} locationId={sim.selectedLocationId} />
      </div>

      <PabSelectors
        skus={sim.skus}
        locations={sim.locations}
        selectedSkuId={sim.selectedSkuId}
        selectedLocationId={sim.selectedLocationId}
        onSkuChange={sim.setSelectedSkuId}
        onLocationChange={sim.setSelectedLocationId}
      />

      <AsyncBoundary
        isLoading={sim.isLoading}
        error={sim.error}
        onRetry={sim.refetchAll}
        isEmpty={isEmpty}
        emptyTitle="No baseline balance series"
        emptyDescription="Select a SKU and location pair with weekly planning buckets to run simulations."
      >
        <div className="space-y-4">
          <SimulatorControlsPanel
            adjustments={sim.adjustments}
            availableMitigations={sim.availableMitigations}
            selectedMitigationId={sim.selectedMitigationId}
            droppedInboundUnits={sim.outcome.droppedInboundUnits}
            capacityLostUnits={sim.outcome.capacityLostUnits}
            onUpdate={sim.updateAdjustment}
            onMitigationChange={sim.setSelectedMitigationId}
            onResetAll={sim.resetAll}
          />
          <SimulatorComparisonCards
            baseline={sim.outcome.baseline}
            scenario={sim.outcome.scenario}
            mitigated={sim.outcome.mitigated}
            mitigationCostUsd={sim.outcome.mitigationCostUsd}
          />
          <SimulatorBalanceChart
            outcome={sim.outcome}
            skuId={sim.selectedSkuId}
            locationId={sim.selectedLocationId}
          />
        </div>
      </AsyncBoundary>
    </div>
  );
}
