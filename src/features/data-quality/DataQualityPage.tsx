import * as React from 'react';
import { AsyncBoundary } from '@/components/AsyncBoundary';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DATA_QUALITY_TABS } from '@/lib/constants';
import { GenerationRunCard } from '@/features/command-center/DatabaseOverview';
import { EdgeCasesTable } from './EdgeCasesTable';
import { EvaluationMetricsCards } from './EvaluationMetricsCards';
import { ProvenancePanel } from './ProvenancePanel';
import { ReproducibilityTable } from './ReproducibilityTable';
import { useDataQuality, type DataQualityTab } from './useDataQuality';
import { ValidationChecksPanel } from './ValidationChecksPanel';

/**
 * Data Quality screen organized into Validation, Edge cases, and Provenance & Reproducibility tabs.
 */
export function DataQualityPage(): React.ReactElement {
  const dq = useDataQuality();
  const isEmpty = !dq.isLoading && !dq.error && dq.checks.length === 0;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">
          Data Quality
        </h1>
        <p className="text-xs text-[var(--text-muted)]">
          Audit clean-baseline invariants, injected QA edge cases, and reproducible checksums.
        </p>
      </div>

      <GenerationRunCard />

      <AsyncBoundary
        isLoading={dq.isLoading}
        error={dq.error}
        onRetry={dq.refetchAll}
        isEmpty={isEmpty}
        emptyTitle="No validation checks available"
        emptyDescription="The loaded validation_report.json file contains zero checks."
      >
        <Tabs
          value={dq.activeTab}
          onValueChange={(value) => {
            const tab: DataQualityTab =
              value === DATA_QUALITY_TABS.EDGE_CASES
                ? DATA_QUALITY_TABS.EDGE_CASES
                : value === DATA_QUALITY_TABS.PROVENANCE
                  ? DATA_QUALITY_TABS.PROVENANCE
                  : DATA_QUALITY_TABS.VALIDATION;
            dq.setActiveTab(tab);
          }}
        >
          <TabsList>
            <TabsTrigger value={DATA_QUALITY_TABS.VALIDATION}>Validation</TabsTrigger>
            <TabsTrigger value={DATA_QUALITY_TABS.EDGE_CASES}>Edge cases</TabsTrigger>
            <TabsTrigger value={DATA_QUALITY_TABS.PROVENANCE}>
              Provenance and reproducibility
            </TabsTrigger>
          </TabsList>

          <TabsContent value={DATA_QUALITY_TABS.VALIDATION}>
            <ValidationChecksPanel
              cleanBaselineChecks={dq.cleanBaselineChecks}
              injectedAnomalyChecks={dq.injectedAnomalyChecks}
            />
          </TabsContent>

          <TabsContent value={DATA_QUALITY_TABS.EDGE_CASES} className="space-y-4">
            <EvaluationMetricsCards metrics={dq.evaluationMetrics} />
            <EdgeCasesTable edgeCases={dq.edgeCases} />
          </TabsContent>

          <TabsContent value={DATA_QUALITY_TABS.PROVENANCE} className="space-y-4">
            <ProvenancePanel manifest={dq.manifest} />
            <ReproducibilityTable report={dq.reproducibility} />
          </TabsContent>
        </Tabs>
      </AsyncBoundary>
    </div>
  );
}
