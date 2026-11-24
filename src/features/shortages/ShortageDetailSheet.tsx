import * as React from 'react';
import { StatusBadge, type SemanticTone } from '@/components/StatusBadge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  useLeadTimesQuery,
  useManifestQuery,
  usePabShardQuery,
  usePurchaseOrdersQuery,
  useShortageEventsQuery,
  useSuppliersQuery,
} from '@/data/queries';
import type { Mitigation, Shortage, ShortageStatus } from '@/data/schemas';
import {
  computeSupplierRemainingCapacity,
  groupMitigationsByPolicy,
} from '@/domain/mitigation';
import { projectBalance } from '@/domain/pab';
import { SHORTAGE_STATUS_LABELS } from '@/lib/constants';
import { formatUnits, formatWeekLabel } from '@/lib/format';
import { MitigationComparisonPanel } from './MitigationComparisonPanel';
import { MitigationOptionsTable } from './MitigationOptionsTable';
import { ShortageCauseSection } from './ShortageCauseSection';
import { ShortageMiniPabChart } from './ShortageMiniPabChart';
import { ShortagePriorityBreakdown } from './ShortagePriorityBreakdown';
import { ShortageTimelineSection } from './ShortageTimelineSection';
import { ShortageWorkflowPanel } from '@/features/workflow/ShortageWorkflowPanel';

const STATUS_TONE: Record<ShortageStatus, SemanticTone> = {
  OPEN: 'critical',
  MITIGATING: 'warning',
  RESOLVED: 'ok',
};

export interface ShortageDetailSheetProps {
  shortage: Shortage | null;
  mitigations: Mitigation[];
  onClose: () => void;
}

/**
 * Right-side drawer presenting all 7 required shortage inspection sections using sharded PAB loading.
 */
export function ShortageDetailSheet({
  shortage,
  mitigations,
  onClose,
}: ShortageDetailSheetProps): React.ReactElement {
  const [manualSelection, setManualSelection] = React.useState<{
    shortageId: string;
    mitigationId: string;
  } | null>(null);

  const shardQuery = usePabShardQuery(shortage?.sku_id ?? '', shortage?.location_id ?? '');
  const suppliersQuery = useSuppliersQuery();
  const purchaseOrdersQuery = usePurchaseOrdersQuery();
  const leadTimesQuery = useLeadTimesQuery();
  const shortageEventsQuery = useShortageEventsQuery();
  const manifestQuery = useManifestQuery();

  const supplier = React.useMemo(() => {
    if (!shortage || !suppliersQuery.data) return undefined;
    return suppliersQuery.data.find((s) => s.supplier_id === shortage.source_refs.supplier_id);
  }, [shortage, suppliersQuery.data]);

  const supplierRemainingCapacity = React.useMemo(() => {
    if (!shortage || !supplier || !purchaseOrdersQuery.data) return null;
    return computeSupplierRemainingCapacity(supplier, purchaseOrdersQuery.data, shortage.week);
  }, [shortage, supplier, purchaseOrdersQuery.data]);

  const grouped = React.useMemo(() => {
    if (!shortage) return { compliant: [], nonCompliant: [] };
    return groupMitigationsByPolicy(
      mitigations.filter((m) => m.shortage_id === shortage.shortage_id),
      supplierRemainingCapacity,
    );
  }, [mitigations, shortage, supplierRemainingCapacity]);

  const selectedMitigationId =
    shortage && manualSelection?.shortageId === shortage.shortage_id
      ? manualSelection.mitigationId
      : (grouped.compliant[0]?.mitigation_id ?? null);

  const pabRows = React.useMemo(() => shardQuery.data?.pab_weekly ?? [], [shardQuery.data]);
  const forecastRow = React.useMemo(() => {
    if (!shortage || !shardQuery.data) return undefined;
    return shardQuery.data.forecast_demand.find(
      (f) => f.demand_id === shortage.source_refs.demand_id,
    );
  }, [shortage, shardQuery.data]);

  const linkedPos = React.useMemo(() => {
    if (!shortage || !purchaseOrdersQuery.data) return [];
    const poSet = new Set(shortage.source_refs.po_ids);
    return purchaseOrdersQuery.data.filter((po) => poSet.has(po.po_id));
  }, [shortage, purchaseOrdersQuery.data]);

  const leadTimeRecord = React.useMemo(() => {
    if (!shortage || !leadTimesQuery.data) return undefined;
    return leadTimesQuery.data.find(
      (lt) =>
        lt.supplier_id === shortage.source_refs.supplier_id &&
        lt.sku_id === shortage.sku_id &&
        lt.location_id === shortage.location_id,
    );
  }, [shortage, leadTimesQuery.data]);

  const events = React.useMemo(() => {
    if (!shortage || !shortageEventsQuery.data) return [];
    return shortageEventsQuery.data.filter((e) => e.entity_id === shortage.shortage_id);
  }, [shortage, shortageEventsQuery.data]);

  const baselineServiceLevel = React.useMemo(() => {
    if (!shortage || pabRows.length === 0) return 1;
    const weekRow = projectBalance(pabRows).rows.find((r) => r.week === shortage.week);
    return weekRow ? weekRow.coverage : 0.7;
  }, [pabRows, shortage]);

  const selectedMitigation = grouped.compliant.find(
    (m) => m.mitigation_id === selectedMitigationId,
  );

  return (
    <Sheet
      open={Boolean(shortage)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent>
        {shortage ? (
          <>
            <SheetHeader>
              <div className="flex flex-wrap items-center gap-2">
                <SheetTitle className="font-mono">{shortage.shortage_id}</SheetTitle>
                <StatusBadge
                  tone={STATUS_TONE[shortage.status]}
                  label={SHORTAGE_STATUS_LABELS[shortage.status]}
                />
              </div>
              <SheetDescription>
                {shortage.sku_id} at {shortage.location_id} · {formatWeekLabel(shortage.week)} ·{' '}
                {formatUnits(shortage.shortage_qty)} deficit
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 space-y-5 overflow-y-auto p-5">
              <ShortageWorkflowPanel shortage={shortage} mitigations={mitigations} />
              <ShortageCauseSection
                shortage={shortage}
                supplier={supplier}
                linkedPos={linkedPos}
                leadTimeRecord={leadTimeRecord}
                forecastRow={forecastRow}
              />

              <ShortagePriorityBreakdown
                components={shortage.priority_components}
                weights={manifestQuery.data?.priority_weights}
                reportedScore={shortage.priority_score}
              />

              <ShortageMiniPabChart
                skuId={shortage.sku_id}
                locationId={shortage.location_id}
                focusWeek={shortage.week}
                pabRows={pabRows}
              />

              <section className="space-y-2.5">
                <h3 className="text-xs font-semibold text-[var(--text-primary)]">
                  Mitigation Options
                </h3>
                <MitigationOptionsTable
                  compliant={grouped.compliant}
                  nonCompliant={grouped.nonCompliant}
                  supplierRemainingCapacity={supplierRemainingCapacity}
                  selectedMitigationId={selectedMitigationId}
                  onSelectMitigation={(mitigationId) => {
                    setManualSelection({ shortageId: shortage.shortage_id, mitigationId });
                  }}
                />
              </section>

              {selectedMitigation ? (
                <MitigationComparisonPanel
                  shortage={shortage}
                  baselineServiceLevel={baselineServiceLevel}
                  selectedMitigation={selectedMitigation}
                />
              ) : null}

              <ShortageTimelineSection events={events} />
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
