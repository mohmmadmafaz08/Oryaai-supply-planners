import * as React from 'react';
import { AsyncBoundary } from '@/components/AsyncBoundary';
import { Button } from '@/components/ui/button';
import { PoDetailSheet } from './PoDetailSheet';
import { PurchaseOrdersFilters } from './PurchaseOrdersFilters';
import { PurchaseOrdersTable } from './PurchaseOrdersTable';
import { usePurchaseOrdersData } from './usePurchaseOrdersData';

/**
 * Purchase Orders screen with status/supplier/delayed filters, date validation, and event drawer.
 */
export function PurchaseOrdersPage(): React.ReactElement {
  const po = usePurchaseOrdersData();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">
          Purchase Orders
        </h1>
        <p className="text-xs text-[var(--text-muted)]">
          Track planned vs actual inbound receipts, transport delays, date ordering, and PO events.
        </p>
      </div>

      <PurchaseOrdersFilters
        suppliers={po.suppliers}
        statusFilter={po.statusFilter}
        supplierFilter={po.supplierFilter}
        delayedOnly={po.delayedOnly}
        onStatusChange={po.setStatusFilter}
        onSupplierChange={po.setSupplierFilter}
        onDelayedChange={po.setDelayedOnly}
        onReset={po.resetFilters}
      />

      <AsyncBoundary
        isLoading={po.isLoading}
        error={po.error}
        onRetry={po.refetchAll}
        isEmpty={!po.isLoading && !po.error && po.filteredPos.length === 0}
        emptyTitle="No purchase orders match filters"
        emptyDescription="Clear the status, supplier, or delayed-only filter to inspect all orders."
        emptyAction={
          <Button variant="outline" size="sm" onClick={po.resetFilters}>
            Reset filters
          </Button>
        }
      >
        <PurchaseOrdersTable
          purchaseOrders={po.filteredPos}
          supplierNameById={po.supplierNameById}
          pageIndex={po.pageIndex}
          selectedPoId={po.selectedPo?.po_id ?? null}
          onPageChange={po.setPageIndex}
          onSelectPo={po.setSelectedPoId}
        />
      </AsyncBoundary>

      <PoDetailSheet
        po={po.selectedPo}
        events={po.selectedPoEvents}
        supplierName={
          po.selectedPo
            ? (po.supplierNameById.get(po.selectedPo.supplier_id) ?? po.selectedPo.supplier_id)
            : ''
        }
        onClose={() => {
          po.setSelectedPoId(null);
        }}
      />
    </div>
  );
}
