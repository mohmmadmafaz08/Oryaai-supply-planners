import * as React from 'react';
import { useSearchParams } from '@/lib/router-compat';
import { useEvaluationMetricsQuery } from '@/data/evaluationMetrics';
import { useGroundTruthQuery } from '@/data/groundTruth';
import {
  useManifestQuery,
  useReproducibilityQuery,
  useValidationReportQuery,
} from '@/data/queries';
import type {
  EvaluationMetrics,
  GroundTruthRecord,
  Manifest,
  ReproducibilityReport,
  ValidationCheck,
} from '@/data/schemas';
import { DATA_QUALITY_TABS, QUERY_PARAM_KEYS } from '@/lib/constants';

export type DataQualityTab = (typeof DATA_QUALITY_TABS)[keyof typeof DATA_QUALITY_TABS];

export interface JoinedEdgeCase extends GroundTruthRecord {
  matchedCheck: ValidationCheck | undefined;
}

export interface DataQualityState {
  isLoading: boolean;
  error: Error | null;
  refetchAll: () => void;
  activeTab: DataQualityTab;
  setActiveTab: (tab: DataQualityTab) => void;
  checks: ValidationCheck[];
  cleanBaselineChecks: ValidationCheck[];
  injectedAnomalyChecks: ValidationCheck[];
  edgeCases: JoinedEdgeCase[];
  evaluationMetrics: EvaluationMetrics | undefined;
  manifest: Manifest | undefined;
  reproducibility: ReproducibilityReport | undefined;
}

function parseTab(raw: string | null): DataQualityTab {
  if (raw === DATA_QUALITY_TABS.EDGE_CASES) return DATA_QUALITY_TABS.EDGE_CASES;
  if (raw === DATA_QUALITY_TABS.PROVENANCE) return DATA_QUALITY_TABS.PROVENANCE;
  return DATA_QUALITY_TABS.VALIDATION;
}

/**
 * Loads validation report, dataset manifest, reproducibility report, isolated ground-truth
 * edge cases, and evaluation metrics for the Data Quality feature only.
 */
export function useDataQuality(): DataQualityState {
  const reportQuery = useValidationReportQuery();
  const groundTruthQuery = useGroundTruthQuery();
  const evaluationQuery = useEvaluationMetricsQuery();
  const manifestQuery = useManifestQuery();
  const reproducibilityQuery = useReproducibilityQuery();
  const [searchParams, setSearchParams] = useSearchParams();

  const isLoading =
    reportQuery.isLoading ||
    groundTruthQuery.isLoading ||
    evaluationQuery.isLoading ||
    manifestQuery.isLoading ||
    reproducibilityQuery.isLoading;

  const error =
    reportQuery.error ??
    groundTruthQuery.error ??
    evaluationQuery.error ??
    manifestQuery.error ??
    reproducibilityQuery.error ??
    null;

  const checks = React.useMemo(() => reportQuery.data?.checks ?? [], [reportQuery.data?.checks]);

  const cleanBaselineChecks = React.useMemo(
    () => checks.filter((c) => c.group !== 'INJECTED_ANOMALY'),
    [checks],
  );

  const injectedAnomalyChecks = React.useMemo(
    () => checks.filter((c) => c.group === 'INJECTED_ANOMALY'),
    [checks],
  );

  const edgeCases = React.useMemo<JoinedEdgeCase[]>(() => {
    const records = groundTruthQuery.data ?? [];
    const checkByName = new Map(checks.map((check) => [check.name, check]));
    return records.map((record) => ({
      ...record,
      matchedCheck: checkByName.get(record.expected_detection),
    }));
  }, [groundTruthQuery.data, checks]);

  const activeTab = parseTab(searchParams.get(QUERY_PARAM_KEYS.DATA_QUALITY_TAB));

  const setActiveTab = React.useCallback(
    (tab: DataQualityTab) => {
      const next = new URLSearchParams(searchParams);
      if (tab === DATA_QUALITY_TABS.VALIDATION) {
        next.delete(QUERY_PARAM_KEYS.DATA_QUALITY_TAB);
      } else {
        next.set(QUERY_PARAM_KEYS.DATA_QUALITY_TAB, tab);
      }
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const refetchAll = React.useCallback(() => {
    void reportQuery.refetch();
    void groundTruthQuery.refetch();
    void evaluationQuery.refetch();
    void manifestQuery.refetch();
    void reproducibilityQuery.refetch();
  }, [reportQuery, groundTruthQuery, evaluationQuery, manifestQuery, reproducibilityQuery]);

  return {
    isLoading,
    error,
    refetchAll,
    activeTab,
    setActiveTab,
    checks,
    cleanBaselineChecks,
    injectedAnomalyChecks,
    edgeCases,
    evaluationMetrics: evaluationQuery.data,
    manifest: manifestQuery.data,
    reproducibility: reproducibilityQuery.data,
  };
}
