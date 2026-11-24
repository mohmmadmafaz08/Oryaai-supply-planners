import { describe, expect, it } from 'vitest';
import { EvaluationMetricsSchema } from '@/data/schemas';

describe('EvaluationMetricsSchema', () => {
  it('rejects out-of-bounds recall/precision ratios', () => {
    expect(
      EvaluationMetricsSchema.safeParse({
        evaluated_at_label: 'Run',
        total_injected: 5,
        detected_count: 5,
        detection_recall: 1.5,
        detection_precision: 1,
        unexpected_failures: 0,
        explained_shortage_share: 1,
      }).success,
    ).toBe(false);
  });
});
