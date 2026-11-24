import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { fetchValidatedJson } from './client';
import { EvaluationMetricsSchema, type EvaluationMetrics } from './schemas';

const EVALUATION_METRICS_QUERY_KEY = ['orbit', 'evaluation_metrics'] as const;

/**
 * Isolated query hook for evaluation_metrics.json.
 * Permitted ONLY inside the Data Quality feature.
 */
export function useEvaluationMetricsQuery(): UseQueryResult<EvaluationMetrics> {
  return useQuery({
    queryKey: EVALUATION_METRICS_QUERY_KEY,
    queryFn: () => fetchValidatedJson('evaluation_metrics.json', EvaluationMetricsSchema),
  });
}
