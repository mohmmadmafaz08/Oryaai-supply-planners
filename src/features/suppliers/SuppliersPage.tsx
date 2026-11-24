import * as React from 'react';
import { AsyncBoundary } from '@/components/AsyncBoundary';
import { SuppliersTable } from './SuppliersTable';
import { useSuppliersData } from './useSuppliersData';

/**
 * Suppliers screen showing weekly capacity utilisation, reliability, MOQs, and lead times.
 */
export function SuppliersPage(): React.ReactElement {
  const state = useSuppliersData();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">
          Suppliers
        </h1>
        <p className="text-xs text-[var(--text-muted)]">
          Monitor weekly supplier capacity utilisation, contract MOQs, reliability, and lead times.
        </p>
      </div>

      <AsyncBoundary
        isLoading={state.isLoading}
        error={state.error}
        onRetry={state.refetchAll}
        isEmpty={!state.isLoading && !state.error && state.summaries.length === 0}
        emptyTitle="No suppliers loaded"
        emptyDescription="The loaded suppliers dataset contains zero records."
      >
        <SuppliersTable summaries={state.summaries} />
      </AsyncBoundary>
    </div>
  );
}
