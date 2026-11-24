import { describe, expect, it } from 'vitest';
import { computeShortage, coverageRatio, projectBalance } from './pab';

describe('computeShortage', () => {
  it('returns 0 for positive and exactly-zero closing balances', () => {
    expect(computeShortage(250)).toBe(0);
    expect(computeShortage(0)).toBe(0);
    expect(Object.is(computeShortage(0), 0)).toBe(true);
  });

  it('returns absolute deficit for negative closing balances', () => {
    expect(computeShortage(-1)).toBe(1);
    expect(computeShortage(-425)).toBe(425);
  });
});

describe('coverageRatio', () => {
  it('returns 1 when demand is 0 or negative', () => {
    expect(coverageRatio(0, 0)).toBe(1);
    expect(coverageRatio(0, 100)).toBe(1);
    expect(coverageRatio(-20, 50)).toBe(1);
  });

  it('clamps ratio between 0 and 1', () => {
    expect(coverageRatio(100, 150)).toBe(1);
    expect(coverageRatio(100, 75)).toBe(0.75);
    expect(coverageRatio(100, 0)).toBe(0);
    expect(coverageRatio(100, -40)).toBe(0);
  });
});

describe('projectBalance', () => {
  it('handles empty inputs safely', () => {
    expect(projectBalance([])).toEqual({ rows: [], reconciliationErrors: [] });
  });

  it('handles zero demand and exactly-zero closing balance', () => {
    const result = projectBalance([
      { week: 1, opening: 100, inbound: 0, demand: 100, closing: 0 },
      { week: 2, opening: 0, inbound: 50, demand: 0, closing: 50 },
    ]);

    expect(result.reconciliationErrors).toEqual([]);
    expect(result.rows[0]?.closing).toBe(0);
    expect(result.rows[0]?.shortageQty).toBe(0);
    expect(result.rows[1]?.opening).toBe(0);
    expect(result.rows[1]?.closing).toBe(50);
    expect(result.rows[1]?.coverage).toBe(1);
  });

  it('carries negative closing balances forward across 3 weeks without mutating inputs', () => {
    const input = [
      { week: 3, opening: 999, inbound: 50, demand: 100 },
      { week: 1, opening: 100, inbound: 0, demand: 160 },
      { week: 2, opening: 999, inbound: 20, demand: 80 },
    ];
    const snapshot = structuredClone(input);

    const result = projectBalance(input);

    expect(input).toEqual(snapshot);
    expect(result.rows.map((r) => r.week)).toEqual([1, 2, 3]);
    expect(result.rows[0]?.closing).toBe(-60);
    expect(result.rows[0]?.shortageQty).toBe(60);

    expect(result.rows[1]?.opening).toBe(-60);
    expect(result.rows[1]?.closing).toBe(-120);
    expect(result.rows[1]?.shortageQty).toBe(120);

    expect(result.rows[2]?.opening).toBe(-120);
    expect(result.rows[2]?.closing).toBe(-170);
    expect(result.rows[2]?.shortageQty).toBe(170);
  });

  it('records reconciliation errors when supplied closing differs from computed closing', () => {
    const result = projectBalance([
      { week: 1, opening: 200, inbound: 100, demand: 50, closing: 250 },
      { week: 2, opening: 250, inbound: 100, demand: 150, closing: 500 },
    ]);

    expect(result.reconciliationErrors).toEqual([
      {
        week: 2,
        suppliedClosing: 500,
        expectedClosing: 200,
        delta: 300,
      },
    ]);
    expect(result.rows[0]?.hasReconciliationError).toBe(false);
    expect(result.rows[1]?.hasReconciliationError).toBe(true);
    expect(result.rows[1]?.closing).toBe(200);
  });
});
