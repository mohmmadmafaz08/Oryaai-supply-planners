import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { fetchValidatedJson } from './client';
import { GroundTruthFileSchema, type GroundTruthRecord } from './schemas';

const GROUND_TRUTH_QUERY_KEY = ['orbit', 'ground_truth'] as const;

/**
 * Isolated query hook for ground_truth.json.
 * Permitted ONLY inside the Data Quality feature.
 */
export function useGroundTruthQuery(): UseQueryResult<GroundTruthRecord[]> {
  return useQuery({
    queryKey: GROUND_TRUTH_QUERY_KEY,
    queryFn: () => fetchValidatedJson('ground_truth.json', GroundTruthFileSchema),
  });
}
