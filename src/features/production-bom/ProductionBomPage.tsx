import * as React from 'react';
import { AsyncBoundary } from '@/components/AsyncBoundary';
import { SearchableCombobox } from '@/components/SearchableCombobox';
import { BomLimitingPanel } from './BomLimitingPanel';
import { ProductionPlansCard } from './ProductionPlansCard';
import { SubstitutesTable } from './SubstitutesTable';
import { useProductionBomData } from './useProductionBomData';

/**
 * Production & BOM screen combining finished-good production schedules,
 * BOM component constraint detection, and engineering substitute rules.
 */
export function ProductionBomPage(): React.ReactElement {
  const state = useProductionBomData();

  const parentSkuOptions = React.useMemo(
    () =>
      state.parentSkus.map((s) => ({
        value: s.sku_id,
        label: `${s.sku_id} — ${s.description}`,
        keywords: s.uom,
      })),
    [state.parentSkus],
  );

  const locationOptions = React.useMemo(
    () => [
      { value: 'ALL', label: 'All locations (network sum)', keywords: 'all network' },
      ...state.locations.map((l) => ({
        value: l.location_id,
        label: `${l.location_id} — ${l.name}`,
        keywords: l.region,
      })),
    ],
    [state.locations],
  );

  const isEmpty = !state.isLoading && !state.error && state.parentSkus.length === 0;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">
          Production & BOM
        </h1>
        <p className="text-xs text-[var(--text-muted)]">
          Inspect finished-good production plans, limiting BOM components, and approved substitutes.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-3">
        <div className="w-80 space-y-1">
          <label
            htmlFor="bom-parent-sku"
            className="block text-xs font-medium text-[var(--text-secondary)]"
          >
            Finished-Good SKU
          </label>
          <SearchableCombobox
            id="bom-parent-sku"
            ariaLabel="Select finished-good SKU"
            options={parentSkuOptions}
            value={state.selectedParentSkuId}
            onChange={state.setSelectedParentSkuId}
            placeholder="Select finished good"
            searchPlaceholder="Search finished-good SKU..."
          />
        </div>
        <div className="w-72 space-y-1">
          <label
            htmlFor="bom-location-select"
            className="block text-xs font-medium text-[var(--text-secondary)]"
          >
            Location Scope
          </label>
          <SearchableCombobox
            id="bom-location-select"
            ariaLabel="Select location scope"
            options={locationOptions}
            value={state.selectedLocationId}
            onChange={state.setSelectedLocationId}
            placeholder="All locations"
            searchPlaceholder="Search location..."
          />
        </div>
      </div>

      <AsyncBoundary
        isLoading={state.isLoading}
        error={state.error}
        onRetry={state.refetchAll}
        isEmpty={isEmpty}
        emptyTitle="No BOM structures found"
        emptyDescription="The loaded BOM dataset contains zero finished-good assemblies."
      >
        <div className="space-y-4">
          <BomLimitingPanel
            parentSkuId={state.selectedParentSkuId}
            components={state.bomComponents}
          />
          <ProductionPlansCard parentSkuId={state.selectedParentSkuId} plans={state.plans} />
          <SubstitutesTable substitutes={state.substitutes} skuDescById={state.skuDescById} />
        </div>
      </AsyncBoundary>
    </div>
  );
}
