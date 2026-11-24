import * as React from 'react';
import { CopyText } from '@/components/CopyText';
import { StatusBadge, type SemanticTone } from '@/components/StatusBadge';
import type {
  ForecastDemandRow,
  LeadTimeRow,
  PoStatus,
  PurchaseOrder,
  Shortage,
  Supplier,
} from '@/data/schemas';
import { CAUSE_CODE_EXPLANATIONS, CAUSE_CODE_LABELS, PO_STATUS_LABELS } from '@/lib/constants';
import { formatPercent, formatUnits } from '@/lib/format';

const PO_STATUS_TONE: Record<PoStatus, SemanticTone> = {
  DRAFT: 'neutral',
  CONFIRMED: 'info',
  SHIPPED: 'info',
  IN_TRANSIT: 'info',
  DELAYED: 'critical',
  RECEIVED: 'ok',
  CANCELLED: 'neutral',
};

export interface ShortageCauseSectionProps {
  shortage: Shortage;
  supplier: Supplier | undefined;
  linkedPos: PurchaseOrder[];
  leadTimeRecord: LeadTimeRow | undefined;
  forecastRow: ForecastDemandRow | undefined;
}

/**
 * Displays plain-language shortage cause, evidence list, and copyable source records.
 */
export function ShortageCauseSection({
  shortage,
  supplier,
  linkedPos,
  leadTimeRecord,
  forecastRow,
}: ShortageCauseSectionProps): React.ReactElement {
  const poMap = new Map(linkedPos.map((p) => [p.po_id, p]));

  return (
    <section className="space-y-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-subtle)] p-4">
      <div className="space-y-1">
        <h3 className="text-xs font-semibold text-[var(--text-primary)]">
          Why it happened — {CAUSE_CODE_LABELS[shortage.cause_code]}
        </h3>
        <p className="text-xs text-[var(--text-secondary)]">
          {CAUSE_CODE_EXPLANATIONS[shortage.cause_code]}
        </p>
        <ul className="list-disc space-y-0.5 pl-4 text-xs text-[var(--text-secondary)]">
          <li>
            Demand reference <span className="font-mono">{shortage.source_refs.demand_id}</span>
            {forecastRow
              ? ` (${formatUnits(forecastRow.forecast_qty)}${forecastRow.is_spike ? ', spike flagged' : ''})`
              : ''}
          </li>
          <li>
            {String(shortage.source_refs.po_ids.length)} replenishment PO(s) traced to supplier{' '}
            <span className="font-mono">{shortage.source_refs.supplier_id}</span>
          </li>
          <li>
            Quoted lead-time basis: {String(shortage.lead_time_basis_days)} days
            {leadTimeRecord ? ` (${leadTimeRecord.lead_time_id})` : ''}
          </li>
        </ul>
      </div>

      <div className="space-y-2 border-t border-[var(--border-default)] pt-2.5 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[var(--text-muted)]">Demand:</span>
            <CopyText value={shortage.source_refs.demand_id} label="Demand ID" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[var(--text-muted)]">Supplier:</span>
            <CopyText value={shortage.source_refs.supplier_id} label="Supplier ID" />
            {supplier ? (
              <span className="text-[var(--text-secondary)] tabular-nums">
                ({formatUnits(supplier.capacity_per_week)}/wk ·{' '}
                {formatPercent(supplier.reliability_score)} rel.)
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[var(--text-muted)]">Lead-time record:</span>
            {leadTimeRecord ? (
              <CopyText value={leadTimeRecord.lead_time_id} label="Lead Time ID" />
            ) : null}
            <span className="tabular-nums text-[var(--text-secondary)]">
              {String(shortage.lead_time_basis_days)} days
            </span>
          </div>
        </div>

        <div className="space-y-1.5">
          <span className="block text-[var(--text-muted)]">Purchase Orders:</span>
          {shortage.source_refs.po_ids.map((poId) => {
            const po = poMap.get(poId);
            return (
              <div
                key={poId}
                className="flex flex-wrap items-center justify-between gap-2 rounded border border-[var(--border-default)] bg-[var(--bg-surface)] px-2.5 py-1.5"
              >
                <div className="flex items-center gap-2">
                  <CopyText value={poId} label="Purchase Order ID" />
                  {po ? (
                    <StatusBadge
                      tone={PO_STATUS_TONE[po.status]}
                      label={PO_STATUS_LABELS[po.status]}
                    />
                  ) : null}
                </div>
                {po ? (
                  <span className="font-mono text-[11px] tabular-nums text-[var(--text-secondary)]">
                    Promised {po.promised_date} · Actual {po.actual_receipt_date ?? 'Pending'}
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
