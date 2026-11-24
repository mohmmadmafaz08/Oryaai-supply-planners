import * as React from 'react';
import { AsyncBoundary } from '@/components/AsyncBoundary';
import { Button } from '@/components/ui/button';
import { useMitigationsQuery, useShortagesQuery } from '@/data/queries';
import {
  buildShortageSearchIndex,
  filterIndexedShortages,
  rankShortages,
} from '@/domain/shortage';
import { ShortageDataGrid } from './ShortageDataGrid';
import { ShortageDetailSheet } from './ShortageDetailSheet';
import { ShortageFiltersBar } from './ShortageFiltersBar';
import { useShortageUrlFilters } from './useShortageUrlFilters';

/**
 * Shortages workbench featuring pre-indexed filtering, sortable TanStack Table grid, and detail drawer.
 */
export function ShortagesPage(): React.ReactElement {
  const shortagesQuery = useShortagesQuery();
  const mitigationsQuery = useMitigationsQuery();
  const filters = useShortageUrlFilters();

  const isLoading = shortagesQuery.isLoading || mitigationsQuery.isLoading;
  const error = shortagesQuery.error ?? mitigationsQuery.error ?? null;

  const searchIndex = React.useMemo(
    () => buildShortageSearchIndex(shortagesQuery.data ?? []),
    [shortagesQuery.data],
  );

  const filteredRows = React.useMemo(() => {
    return rankShortages(
      filterIndexedShortages(searchIndex, {
        search: filters.search,
        status: filters.status,
        cause: filters.cause,
        weekMin: filters.weekMin,
        weekMax: filters.weekMax,
      }),
    );
  }, [
    searchIndex,
    filters.search,
    filters.status,
    filters.cause,
    filters.weekMin,
    filters.weekMax,
  ]);

  const selectedShortage = React.useMemo(() => {
    if (!filters.selectedShortageId || !shortagesQuery.data) {
      return null;
    }
    return (
      shortagesQuery.data.find((item) => item.shortage_id === filters.selectedShortageId) ?? null
    );
  }, [filters.selectedShortageId, shortagesQuery.data]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">
          Shortages
        </h1>
        <p className="text-xs text-[var(--text-muted)]">
          Filter, sort, and inspect shortage root causes alongside policy-compliant mitigations.
        </p>
      </div>

      <ShortageFiltersBar
        status={filters.status}
        cause={filters.cause}
        weekMin={filters.weekMin}
        weekMax={filters.weekMax}
        onStatusChange={filters.setStatus}
        onCauseChange={filters.setCause}
        onWeekMinChange={filters.setWeekMin}
        onWeekMaxChange={filters.setWeekMax}
        onReset={filters.resetFilters}
      />

      <AsyncBoundary
        isLoading={isLoading}
        error={error}
        onRetry={() => {
          void shortagesQuery.refetch();
          void mitigationsQuery.refetch();
        }}
        isEmpty={!isLoading && !error && filteredRows.length === 0}
        emptyTitle="No shortages match current filters"
        emptyDescription="Clear the search query or widen the status, cause, or week range filters."
        emptyAction={
          <Button variant="outline" size="sm" onClick={filters.resetFilters}>
            Reset filters
          </Button>
        }
      >
        <ShortageDataGrid
          data={filteredRows}
          pageIndex={filters.pageIndex}
          selectedShortageId={filters.selectedShortageId}
          onPageIndexChange={filters.setPageIndex}
          onSelectShortage={filters.setSelectedShortageId}
        />
      </AsyncBoundary>

      <ShortageDetailSheet
        shortage={selectedShortage}
        mitigations={mitigationsQuery.data ?? []}
        onClose={() => {
          filters.setSelectedShortageId(null);
        }}
      />
    </div>
  );
}
