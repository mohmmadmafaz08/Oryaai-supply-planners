import * as React from 'react';
import { SearchableCombobox } from '@/components/SearchableCombobox';
import type { Location, Sku } from '@/data/schemas';

export interface PabSelectorsProps {
  skus: Sku[];
  locations: Location[];
  selectedSkuId: string;
  selectedLocationId: string;
  onSkuChange: (skuId: string) => void;
  onLocationChange: (locationId: string) => void;
}

/**
 * Searchable SKU and location combobox selector bar capped at 50 rendered matches.
 */
export function PabSelectors({
  skus,
  locations,
  selectedSkuId,
  selectedLocationId,
  onSkuChange,
  onLocationChange,
}: PabSelectorsProps): React.ReactElement {
  const skuOptions = React.useMemo(
    () =>
      skus.map((sku) => ({
        value: sku.sku_id,
        label: `${sku.sku_id} — ${sku.description}`,
        keywords: `${sku.uom} ${sku.sku_id}`,
      })),
    [skus],
  );

  const locationOptions = React.useMemo(
    () =>
      locations.map((loc) => ({
        value: loc.location_id,
        label: `${loc.location_id} — ${loc.name}`,
        keywords: loc.region,
      })),
    [locations],
  );

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-3">
      <div className="w-80 space-y-1">
        <label
          htmlFor="pab-sku-select"
          className="block text-xs font-medium text-[var(--text-secondary)]"
        >
          SKU
        </label>
        <SearchableCombobox
          id="pab-sku-select"
          ariaLabel="Select SKU"
          options={skuOptions}
          value={selectedSkuId}
          onChange={onSkuChange}
          placeholder="Choose SKU"
          searchPlaceholder="Search SKU ID or description..."
        />
      </div>

      <div className="w-72 space-y-1">
        <label
          htmlFor="pab-location-select"
          className="block text-xs font-medium text-[var(--text-secondary)]"
        >
          Location
        </label>
        <SearchableCombobox
          id="pab-location-select"
          ariaLabel="Select Location"
          options={locationOptions}
          value={selectedLocationId}
          onChange={onLocationChange}
          placeholder="Choose location"
          searchPlaceholder="Search location ID or name..."
        />
      </div>
    </div>
  );
}
