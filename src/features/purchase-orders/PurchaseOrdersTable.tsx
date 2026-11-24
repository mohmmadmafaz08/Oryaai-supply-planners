import * as React from 'react';
import { StatusBadge, type SemanticTone } from '@/components/StatusBadge';
import { TablePaginationBar } from '@/components/TablePaginationBar';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { PoStatus, PurchaseOrder } from '@/data/schemas';
import { validatePoDateOrdering } from '@/domain/supply';
import { cn } from '@/lib/cn';
import { DEFAULT_PAGE_SIZE, PO_STATUS_LABELS } from '@/lib/constants';
import { formatDays, formatUnits } from '@/lib/format';

const PO_STATUS_TONE: Record<PoStatus, SemanticTone> = {
  DRAFT: 'neutral',
  CONFIRMED: 'info',
  SHIPPED: 'info',
  IN_TRANSIT: 'info',
  DELAYED: 'warning',
  RECEIVED: 'ok',
  CANCELLED: 'neutral',
};

export interface PurchaseOrdersTableProps {
  purchaseOrders: PurchaseOrder[];
  supplierNameById: Map<string, string>;
  pageIndex: number;
  selectedPoId: string | null;
  onPageChange: (page: number) => void;
  onSelectPo: (poId: string) => void;
}

/**
 * Paginated Purchase Orders table displaying planned vs actual dates, delay days, and date-ordering checks.
 */
export function PurchaseOrdersTable({
  purchaseOrders,
  supplierNameById,
  pageIndex,
  selectedPoId,
  onPageChange,
  onSelectPo,
}: PurchaseOrdersTableProps): React.ReactElement {
  const pageCount = Math.max(1, Math.ceil(purchaseOrders.length / DEFAULT_PAGE_SIZE));
  const safePageIndex = Math.min(pageIndex, pageCount - 1);
  const rows = purchaseOrders.slice(
    safePageIndex * DEFAULT_PAGE_SIZE,
    (safePageIndex + 1) * DEFAULT_PAGE_SIZE,
  );

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>PO ID</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>SKU / Location</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Order Date</TableHead>
              <TableHead>Promised</TableHead>
              <TableHead>Actual Receipt</TableHead>
              <TableHead className="text-right">Delay</TableHead>
              <TableHead>Date Check</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((po) => {
              const dateCheck = validatePoDateOrdering(po);
              const isSelected = po.po_id === selectedPoId;
              return (
                <TableRow
                  key={po.po_id}
                  onClick={() => {
                    onSelectPo(po.po_id);
                  }}
                  className={cn(
                    'cursor-pointer hover:bg-[var(--bg-hover)]',
                    isSelected && 'bg-[var(--accent-subtle)]',
                  )}
                >
                  <TableCell className="font-mono">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onSelectPo(po.po_id);
                      }}
                      className="font-medium text-[var(--accent)] hover:underline cursor-pointer"
                    >
                      {po.po_id}
                    </button>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs font-medium">
                      {supplierNameById.get(po.supplier_id) ?? po.supplier_id}
                    </div>
                    <div className="font-mono text-[11px] text-[var(--text-muted)]">
                      {po.supplier_id}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {po.sku_id} · {po.location_id}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatUnits(po.ordered_qty, po.uom)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      tone={PO_STATUS_TONE[po.status]}
                      label={PO_STATUS_LABELS[po.status]}
                    />
                  </TableCell>
                  <TableCell className="font-mono text-xs">{po.order_date}</TableCell>
                  <TableCell className="font-mono text-xs">{po.promised_date}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {po.actual_receipt_date ?? 'Pending'}
                  </TableCell>
                  <TableCell
                    className={cn(
                      'text-right tabular-nums',
                      po.transport_delay_days > 0 && 'font-medium text-[var(--status-warning)]',
                    )}
                  >
                    {formatDays(po.transport_delay_days)}
                  </TableCell>
                  <TableCell>
                    {dateCheck.valid ? (
                      <StatusBadge tone="ok" label="Valid" />
                    ) : (
                      <StatusBadge tone="critical" label={dateCheck.violations[0] ?? 'Violation'} />
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <TablePaginationBar
        totalRows={purchaseOrders.length}
        pageIndex={safePageIndex}
        pageCount={pageCount}
        canPrevious={safePageIndex > 0}
        canNext={safePageIndex + 1 < pageCount}
        onPrevious={() => {
          onPageChange(Math.max(0, safePageIndex - 1));
        }}
        onNext={() => {
          onPageChange(Math.min(pageCount - 1, safePageIndex + 1));
        }}
        itemLabel="purchase orders"
      />
    </Card>
  );
}
