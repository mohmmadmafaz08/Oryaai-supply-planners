import * as React from 'react';
import { StatusBadge } from '@/components/StatusBadge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { PoEvent, PurchaseOrder } from '@/data/schemas';
import { validatePoDateOrdering } from '@/domain/supply';
import { ACTOR_ROLE_LABELS, PO_STATUS_LABELS } from '@/lib/constants';
import { formatDays, formatUnits } from '@/lib/format';

export interface PoDetailSheetProps {
  po: PurchaseOrder | null;
  events: PoEvent[];
  supplierName: string;
  onClose: () => void;
}

/**
 * Right-side drawer showing purchase order metadata, date checks, and chronological po_events timeline.
 */
export function PoDetailSheet({
  po,
  events,
  supplierName,
  onClose,
}: PoDetailSheetProps): React.ReactElement {
  const dateCheck = po ? validatePoDateOrdering(po) : null;

  return (
    <Sheet
      open={Boolean(po)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent>
        {po ? (
          <>
            <SheetHeader>
              <div className="flex flex-wrap items-center gap-2">
                <SheetTitle className="font-mono">{po.po_id}</SheetTitle>
                <StatusBadge
                  tone={
                    po.status === 'DELAYED' ? 'warning' : po.status === 'RECEIVED' ? 'ok' : 'info'
                  }
                  label={PO_STATUS_LABELS[po.status]}
                />
              </div>
              <SheetDescription>
                {supplierName} ({po.supplier_id}) · {po.sku_id} at {po.location_id} ·{' '}
                {formatUnits(po.ordered_qty, po.uom)}
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 space-y-5 overflow-y-auto p-5">
              <section className="space-y-2 rounded-md border border-[var(--border-default)] bg-[var(--bg-subtle)] p-3 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[var(--text-muted)]">Order date: </span>
                    <span className="font-mono text-[var(--text-primary)]">{po.order_date}</span>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)]">Promised date: </span>
                    <span className="font-mono text-[var(--text-primary)]">{po.promised_date}</span>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)]">Actual receipt: </span>
                    <span className="font-mono text-[var(--text-primary)]">
                      {po.actual_receipt_date ?? 'Pending'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)]">Transport delay: </span>
                    <span className="font-mono tabular-nums text-[var(--text-primary)]">
                      {formatDays(po.transport_delay_days)}
                    </span>
                  </div>
                </div>
                {dateCheck && !dateCheck.valid ? (
                  <p className="font-medium text-[var(--status-critical)]">
                    Date violation: {dateCheck.violations.join(' ')}
                  </p>
                ) : null}
              </section>

              <section className="space-y-2.5">
                <h3 className="text-xs font-semibold text-[var(--text-primary)]">
                  Purchase Order Event Timeline
                </h3>
                {events.length === 0 ? (
                  <p className="rounded-md border border-[var(--border-default)] bg-[var(--bg-subtle)] p-3 text-xs text-[var(--text-muted)]">
                    No lifecycle events recorded for this purchase order.
                  </p>
                ) : (
                  <ol className="space-y-2">
                    {events.map((evt) => (
                      <li
                        key={evt.event_id}
                        className="flex items-center justify-between gap-3 rounded-md border border-[var(--border-default)] bg-[var(--bg-subtle)] px-3 py-2 text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2 font-medium text-[var(--text-primary)]">
                            <span>
                              {evt.from_status ? PO_STATUS_LABELS[evt.from_status] : 'Created'} →{' '}
                              {PO_STATUS_LABELS[evt.to_status]}
                            </span>
                          </div>
                          <div className="font-mono text-[11px] text-[var(--text-muted)]">
                            {evt.event_id} · {ACTOR_ROLE_LABELS[evt.actor_role]}
                          </div>
                        </div>
                        <span className="font-mono text-xs tabular-nums text-[var(--text-secondary)]">
                          {evt.occurred_on}
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
