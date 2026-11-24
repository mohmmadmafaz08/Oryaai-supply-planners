import { RotateCcw } from 'lucide-react';
import * as React from 'react';
import { SearchableCombobox } from '@/components/SearchableCombobox';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { PoStatus, Supplier } from '@/data/schemas';
import { PO_STATUS_LABELS } from '@/lib/constants';

export interface PurchaseOrdersFiltersProps {
  suppliers: Supplier[];
  statusFilter: PoStatus | 'ALL';
  supplierFilter: string;
  delayedOnly: boolean;
  onStatusChange: (status: PoStatus | 'ALL') => void;
  onSupplierChange: (supplierId: string) => void;
  onDelayedChange: (delayed: boolean) => void;
  onReset: () => void;
}

const PO_STATUS_KEYS: readonly PoStatus[] = [
  'DRAFT',
  'CONFIRMED',
  'SHIPPED',
  'IN_TRANSIT',
  'DELAYED',
  'RECEIVED',
  'CANCELLED',
];

/**
 * Filter bar for Purchase Orders featuring status select, searchable supplier combobox, and delayed-only toggle.
 */
export function PurchaseOrdersFilters({
  suppliers,
  statusFilter,
  supplierFilter,
  delayedOnly,
  onStatusChange,
  onSupplierChange,
  onDelayedChange,
  onReset,
}: PurchaseOrdersFiltersProps): React.ReactElement {
  const supplierOptions = React.useMemo(
    () => [
      { value: 'ALL', label: 'All suppliers', keywords: 'all' },
      ...suppliers.map((s) => ({
        value: s.supplier_id,
        label: `${s.supplier_id} — ${s.name}`,
        keywords: s.name,
      })),
    ],
    [suppliers],
  );

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-3">
      <div className="w-44 space-y-1">
        <label
          htmlFor="po-status-select"
          className="block text-xs font-medium text-[var(--text-secondary)]"
        >
          Status
        </label>
        <Select
          value={statusFilter}
          onValueChange={(value) => {
            const matched = PO_STATUS_KEYS.find((k) => k === value);
            onStatusChange(matched ?? 'ALL');
          }}
        >
          <SelectTrigger id="po-status-select" aria-label="Filter by PO status">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {PO_STATUS_KEYS.map((status) => (
              <SelectItem key={status} value={status}>
                {PO_STATUS_LABELS[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-72 space-y-1">
        <label
          htmlFor="po-supplier-select"
          className="block text-xs font-medium text-[var(--text-secondary)]"
        >
          Supplier
        </label>
        <SearchableCombobox
          id="po-supplier-select"
          ariaLabel="Filter by supplier"
          options={supplierOptions}
          value={supplierFilter}
          onChange={onSupplierChange}
          placeholder="All suppliers"
          searchPlaceholder="Search supplier ID or name..."
        />
      </div>

      <label className="inline-flex h-9 cursor-pointer select-none items-center gap-2 rounded-md border border-[var(--border-default)] px-3 text-xs text-[var(--text-primary)]">
        <input
          type="checkbox"
          checked={delayedOnly}
          onChange={(e) => {
            onDelayedChange(e.target.checked);
          }}
          className="h-3.5 w-3.5 accent-[var(--accent)]"
        />
        <span>Delayed only</span>
      </label>

      <Button variant="outline" size="sm" onClick={onReset} className="h-9">
        <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
        <span>Reset</span>
      </Button>
    </div>
  );
}
