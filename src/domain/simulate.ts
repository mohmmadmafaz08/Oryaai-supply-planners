import type { Mitigation } from '@/data/schemas';
import { MAX_WEEK } from '@/lib/constants';
import { projectBalance, type PabInputWeek, type ProjectedBalanceRow } from './pab';
import { computeShortageSeriesMetrics } from './shortage';

export interface SimulationAdjustments {
  demandMultiplier: number;
  inboundDelayWeeks: number;
  supplierCapacityMultiplier: number;
  onHandDelta: number;
}

export interface SimulationOptions {
  capacityPerWeek?: number | null;
  mitigation?: Mitigation | null;
  mitigationWeek?: number | null;
}

export interface SimulationSeriesSummary {
  rows: ProjectedBalanceRow[];
  totalShortageUnits: number;
  peakBacklog: number;
  weeksInShortage: number;
  fillRate: number;
  endingBalance: number;
}

export interface SimulationOutcome {
  baseline: SimulationSeriesSummary;
  scenario: SimulationSeriesSummary;
  mitigated: SimulationSeriesSummary | null;
  droppedInboundUnits: number;
  capacityLostUnits: number;
  mitigationCostUsd: number;
}

function summarizeSeries(rows: readonly ProjectedBalanceRow[]): SimulationSeriesSummary {
  if (rows.length === 0) {
    return {
      rows: [],
      totalShortageUnits: 0,
      peakBacklog: 0,
      weeksInShortage: 0,
      fillRate: 1,
      endingBalance: 0,
    };
  }

  const metrics = computeShortageSeriesMetrics(rows);
  const lastRow = rows[rows.length - 1];

  return {
    rows: [...rows],
    totalShortageUnits: metrics.totalShortageUnits,
    peakBacklog: metrics.peakBacklog,
    weeksInShortage: metrics.weeksInShortage,
    fillRate: metrics.fillRate,
    endingBalance: lastRow ? lastRow.closing : 0,
  };
}

/**
 * Runs a what-if supply/demand simulation against baseline weekly PAB rows without mutating inputs.
 * Business rule:
 * - When capacityPerWeek is provided, clips each week's inbound to round(capacityPerWeek * multiplier)
 *   and accumulates any clipped units into capacityLostUnits; otherwise scales inbound by multiplier.
 * - Shifts clipped inbound by inboundDelayWeeks; any inbound shifted past MAX_WEEK (52) is added to droppedInboundUnits.
 * - Scales each week's demand by demandMultiplier (rounded, floored at 0) and adds onHandDelta to week 0 opening.
 * - Summarizes baseline, scenario, and optional mitigated series using non-double-counting D1 shortage metrics.
 */
export function simulate(
  baselineWeeks: readonly PabInputWeek[],
  adjustments: SimulationAdjustments,
  options: SimulationOptions = {},
): SimulationOutcome {
  if (baselineWeeks.length === 0) {
    const empty = summarizeSeries([]);
    return {
      baseline: empty,
      scenario: empty,
      mitigated: options.mitigation ? empty : null,
      droppedInboundUnits: 0,
      capacityLostUnits: 0,
      mitigationCostUsd: options.mitigation?.cost_usd ?? 0,
    };
  }

  const sorted = [...baselineWeeks].sort((a, b) => a.week - b.week);
  const baselineProjected = projectBalance(sorted);

  const delayWeeks = Math.max(0, Math.round(adjustments.inboundDelayWeeks));
  const capacityMult = Math.max(0, adjustments.supplierCapacityMultiplier);
  const demandMult = Math.max(0, adjustments.demandMultiplier);
  const onHandDelta = Math.round(adjustments.onHandDelta);
  const hasExplicitCapacity =
    options.capacityPerWeek !== undefined && options.capacityPerWeek !== null;
  const effectiveWeeklyCap = hasExplicitCapacity
    ? Math.max(0, Math.round((options.capacityPerWeek ?? 0) * capacityMult))
    : null;

  const delayedInboundByWeek = new Map<number, number>();
  let droppedInboundUnits = 0;
  let capacityLostUnits = 0;

  for (const row of sorted) {
    const clippedInbound =
      effectiveWeeklyCap !== null
        ? Math.min(Math.max(0, row.inbound), effectiveWeeklyCap)
        : Math.max(0, Math.round(row.inbound * capacityMult));
    capacityLostUnits += Math.max(0, row.inbound - clippedInbound);

    const targetWeek = row.week + delayWeeks;
    if (targetWeek > MAX_WEEK) {
      droppedInboundUnits += clippedInbound;
    } else {
      const existing = delayedInboundByWeek.get(targetWeek) ?? 0;
      delayedInboundByWeek.set(targetWeek, existing + clippedInbound);
    }
  }

  const scenarioInputs: PabInputWeek[] = sorted.map((row, index) => ({
    week: row.week,
    opening: index === 0 ? row.opening + onHandDelta : row.opening,
    inbound: delayedInboundByWeek.get(row.week) ?? 0,
    demand: Math.max(0, Math.round(row.demand * demandMult)),
  }));

  const scenarioProjected = projectBalance(scenarioInputs);
  const baselineSummary = summarizeSeries(baselineProjected.rows);
  const scenarioSummary = summarizeSeries(scenarioProjected.rows);

  let mitigatedSummary: SimulationSeriesSummary | null = null;
  if (options.mitigation) {
    const firstShortageWeek =
      scenarioProjected.rows.find((r) => r.closing < 0)?.week ?? sorted[0]?.week ?? 1;
    const applyWeek = options.mitigationWeek ?? firstShortageWeek;
    const mitigationRecovered = options.mitigation.recovered_units;

    const mitigatedInputs = scenarioInputs.map((row) =>
      row.week === applyWeek ? { ...row, inbound: row.inbound + mitigationRecovered } : row,
    );
    mitigatedSummary = summarizeSeries(projectBalance(mitigatedInputs).rows);
  }

  return {
    baseline: baselineSummary,
    scenario: scenarioSummary,
    mitigated: mitigatedSummary,
    droppedInboundUnits,
    capacityLostUnits,
    mitigationCostUsd: options.mitigation?.cost_usd ?? 0,
  };
}
