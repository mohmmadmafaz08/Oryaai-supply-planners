import { describe, expect, it } from 'vitest';
import type { Mitigation } from '@/data/schemas';
import { SIMULATION_DEFAULTS } from '@/lib/constants';
import type { PabInputWeek } from './pab';
import { simulate } from './simulate';

describe('simulate', () => {
  it('returns identical scenario to baseline under default adjustments without mutating inputs', () => {
    const baseline: PabInputWeek[] = [
      { week: 1, opening: 100, inbound: 50, demand: 80, closing: 70 },
      { week: 2, opening: 70, inbound: 0, demand: 100, closing: -30 },
    ];
    const snapshot = structuredClone(baseline);

    const outcome = simulate(baseline, SIMULATION_DEFAULTS);

    expect(baseline).toEqual(snapshot);
    expect(outcome.droppedInboundUnits).toBe(0);
    expect(outcome.capacityLostUnits).toBe(0);
    expect(outcome.scenario.totalShortageUnits).toBe(30);
    expect(outcome.scenario.peakBacklog).toBe(30);
    expect(outcome.scenario.endingBalance).toBe(-30);
    expect(outcome.mitigated).toBeNull();
  });

  it('drops inbound units shifted past week 52 when inbound delay crosses horizon boundary', () => {
    const baseline: PabInputWeek[] = [
      { week: 50, opening: 100, inbound: 200, demand: 100 },
      { week: 51, opening: 200, inbound: 300, demand: 100 },
      { week: 52, opening: 400, inbound: 400, demand: 100 },
    ];

    const outcome = simulate(baseline, {
      demandMultiplier: 1,
      inboundDelayWeeks: 2,
      supplierCapacityMultiplier: 1,
      onHandDelta: 0,
    });

    expect(outcome.droppedInboundUnits).toBe(700);
    expect(outcome.scenario.rows.map((r) => r.inbound)).toEqual([0, 0, 200]);
    expect(outcome.scenario.rows[2]?.closing).toBe(0);
  });

  it('clips inbound lines to capacity_per_week * multiplier and reports units lost to capacity', () => {
    const baseline: PabInputWeek[] = [
      { week: 1, opening: 50, inbound: 400, demand: 300 },
      { week: 2, opening: 150, inbound: 200, demand: 250 },
    ];

    const outcome = simulate(
      baseline,
      {
        demandMultiplier: 1,
        inboundDelayWeeks: 0,
        supplierCapacityMultiplier: 0.6,
        onHandDelta: 0,
      },
      { capacityPerWeek: 500 },
    );

    // Cap = 500 * 0.6 = 300/wk -> Week 1 inbound 400 clipped to 300 (100 lost); Week 2 200 <= 300 (0 lost)
    expect(outcome.capacityLostUnits).toBe(100);
    expect(outcome.scenario.rows.map((r) => r.inbound)).toEqual([300, 200]);
    expect(outcome.scenario.rows[0]?.closing).toBe(50);
    expect(outcome.scenario.rows[1]?.closing).toBe(0);
  });

  it('overlays mitigation recovered_units and tracks incremental mitigation cost without double-counting carried backlog', () => {
    const baseline: PabInputWeek[] = [
      { week: 1, opening: 0, inbound: 0, demand: 200 },
      { week: 2, opening: -200, inbound: 100, demand: 100 },
      { week: 3, opening: -200, inbound: 100, demand: 100 },
    ];
    const mitigation: Mitigation = {
      mitigation_id: 'MIT-SHORT-2026-000001-01',
      shortage_id: 'SHORT-2026-000001',
      type: 'EXPEDITE',
      cost_usd: 4500,
      lead_time_days: 4,
      recovered_units: 150,
      service_level_after: 0.9,
      policy_compliant: true,
      policy_notes: 'Approved.',
    };

    const outcome = simulate(baseline, SIMULATION_DEFAULTS, {
      mitigation,
      mitigationWeek: 1,
    });

    // Baseline carried 200-unit backlog for 3 weeks = 200 totalShortageUnits (not 600)
    expect(outcome.baseline.totalShortageUnits).toBe(200);
    expect(outcome.baseline.peakBacklog).toBe(200);
    expect(outcome.baseline.weeksInShortage).toBe(3);

    // With 150 recovered in W1, closing stays -50 across W1..W3 -> totalShortageUnits = 50
    expect(outcome.mitigated?.totalShortageUnits).toBe(50);
    expect(outcome.mitigated?.peakBacklog).toBe(50);
    expect(outcome.mitigationCostUsd).toBe(4500);
  });

  it('handles empty baseline array safely', () => {
    const outcome = simulate([], SIMULATION_DEFAULTS);
    expect(outcome.baseline.rows).toEqual([]);
    expect(outcome.scenario.rows).toEqual([]);
    expect(outcome.droppedInboundUnits).toBe(0);
    expect(outcome.capacityLostUnits).toBe(0);
  });
});
