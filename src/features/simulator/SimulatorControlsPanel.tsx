import { Info, RotateCcw } from 'lucide-react';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Mitigation } from '@/data/schemas';
import type { SimulationAdjustments } from '@/domain/simulate';
import { SIMULATION_BOUNDS, SIMULATION_DEFAULTS } from '@/lib/constants';
import { formatCount, formatMultiplier, formatSignedUnits } from '@/lib/format';
import { SimulatorControlRow } from './SimulatorControlRow';
import { SimulatorMitigationSelect } from './SimulatorMitigationSelect';

export interface SimulatorControlsPanelProps {
  adjustments: SimulationAdjustments;
  availableMitigations: Mitigation[];
  selectedMitigationId: string | null;
  droppedInboundUnits: number;
  capacityLostUnits: number;
  onUpdate: <K extends keyof SimulationAdjustments>(
    key: K,
    value: SimulationAdjustments[K],
  ) => void;
  onMitigationChange: (mitigationId: string | null) => void;
  onResetAll: () => void;
}

/**
 * Scenario controls: 4 parameter sliders, Apply Mitigation select, and capacity/W52 drop notices.
 */
export function SimulatorControlsPanel({
  adjustments,
  availableMitigations,
  selectedMitigationId,
  droppedInboundUnits,
  capacityLostUnits,
  onUpdate,
  onMitigationChange,
  onResetAll,
}: SimulatorControlsPanelProps): React.ReactElement {
  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-2">
        <div>
          <CardTitle>Scenario Parameters</CardTitle>
          <CardDescription>
            Adjust demand, inbound timing, capacity, starting stock, and optional mitigation
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={onResetAll}>
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Reset all</span>
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <SimulatorControlRow
            id="sim-demand"
            label="Demand Multiplier"
            formattedValue={formatMultiplier(adjustments.demandMultiplier)}
            value={adjustments.demandMultiplier}
            defaultValue={SIMULATION_DEFAULTS.demandMultiplier}
            min={SIMULATION_BOUNDS.demandMultiplier.min}
            max={SIMULATION_BOUNDS.demandMultiplier.max}
            step={SIMULATION_BOUNDS.demandMultiplier.step}
            onChange={(val) => {
              onUpdate('demandMultiplier', val);
            }}
          />
          <SimulatorControlRow
            id="sim-delay"
            label="Inbound Delay"
            formattedValue={`${formatCount(adjustments.inboundDelayWeeks)} weeks`}
            value={adjustments.inboundDelayWeeks}
            defaultValue={SIMULATION_DEFAULTS.inboundDelayWeeks}
            min={SIMULATION_BOUNDS.inboundDelayWeeks.min}
            max={SIMULATION_BOUNDS.inboundDelayWeeks.max}
            step={SIMULATION_BOUNDS.inboundDelayWeeks.step}
            onChange={(val) => {
              onUpdate('inboundDelayWeeks', val);
            }}
          />
          <SimulatorControlRow
            id="sim-capacity"
            label="Supplier Capacity Multiplier"
            formattedValue={formatMultiplier(adjustments.supplierCapacityMultiplier)}
            value={adjustments.supplierCapacityMultiplier}
            defaultValue={SIMULATION_DEFAULTS.supplierCapacityMultiplier}
            min={SIMULATION_BOUNDS.supplierCapacityMultiplier.min}
            max={SIMULATION_BOUNDS.supplierCapacityMultiplier.max}
            step={SIMULATION_BOUNDS.supplierCapacityMultiplier.step}
            onChange={(val) => {
              onUpdate('supplierCapacityMultiplier', val);
            }}
          />
          <SimulatorControlRow
            id="sim-onhand"
            label="On-Hand Adjustment"
            formattedValue={formatSignedUnits(adjustments.onHandDelta)}
            value={adjustments.onHandDelta}
            defaultValue={SIMULATION_DEFAULTS.onHandDelta}
            min={SIMULATION_BOUNDS.onHandDelta.min}
            max={SIMULATION_BOUNDS.onHandDelta.max}
            step={SIMULATION_BOUNDS.onHandDelta.step}
            onChange={(val) => {
              onUpdate('onHandDelta', val);
            }}
          />
        </div>

        <SimulatorMitigationSelect
          availableMitigations={availableMitigations}
          selectedMitigationId={selectedMitigationId}
          onMitigationChange={onMitigationChange}
        />

        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-[var(--border-default)] bg-[var(--bg-muted)] px-3 py-2 text-xs text-[var(--text-secondary)]">
          <span className="inline-flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 shrink-0 text-[var(--status-info)]" aria-hidden="true" />
            <span>
              Scenario results are computed in the browser using the same rules as the planning
              engine.
            </span>
          </span>
          <div className="flex flex-wrap items-center gap-3 tabular-nums">
            {capacityLostUnits > 0 ? (
              <span className="font-medium text-[var(--status-warning)]">
                {formatCount(capacityLostUnits)} inbound units lost to capacity
              </span>
            ) : null}
            {droppedInboundUnits > 0 ? (
              <span className="font-medium text-[var(--status-warning)]">
                {formatCount(droppedInboundUnits)} inbound units shifted past W52
              </span>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
