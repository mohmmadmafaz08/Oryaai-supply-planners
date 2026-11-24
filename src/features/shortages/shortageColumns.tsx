import {
  createColumnHelper,
  createPaginatedRowModel,
  createSortedRowModel,
  rowPaginationFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_basic,
  tableFeatures,
} from '@tanstack/react-table';
import { StatusBadge, type SemanticTone } from '@/components/StatusBadge';
import type { Shortage, ShortageStatus } from '@/data/schemas';
import { CAUSE_CODE_LABELS, SHORTAGE_STATUS_LABELS } from '@/lib/constants';
import { formatScore, formatUnits, formatWeekLabel } from '@/lib/format';

const STATUS_TONE: Record<ShortageStatus, SemanticTone> = {
  OPEN: 'critical',
  MITIGATING: 'warning',
  RESOLVED: 'ok',
};

export const shortageTableFeatures = tableFeatures({
  rowSortingFeature,
  rowPaginationFeature,
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortFns: {
    alphanumeric: sortFn_alphanumeric,
    basic: sortFn_basic,
  },
});

const columnHelper = createColumnHelper<typeof shortageTableFeatures, Shortage>();

export const shortageTableColumns = columnHelper.columns([
  columnHelper.accessor('shortage_id', {
    header: 'Shortage ID',
    cell: (info) => <span className="font-mono font-medium">{info.getValue()}</span>,
  }),
  columnHelper.accessor('sku_id', {
    header: 'SKU ID',
    cell: (info) => <span className="font-mono">{info.getValue()}</span>,
  }),
  columnHelper.accessor('location_id', {
    header: 'Location',
  }),
  columnHelper.accessor((row) => row.source_refs.supplier_id, {
    id: 'supplier_id',
    header: 'Supplier',
    cell: (info) => <span className="font-mono">{info.getValue()}</span>,
  }),
  columnHelper.accessor('week', {
    header: 'Week',
    cell: (info) => <span className="font-mono">{formatWeekLabel(info.getValue())}</span>,
  }),
  columnHelper.accessor('cause_code', {
    header: 'Cause',
    cell: (info) => CAUSE_CODE_LABELS[info.getValue()],
  }),
  columnHelper.accessor('status', {
    header: 'Status',
    cell: (info) => {
      const status = info.getValue();
      return <StatusBadge tone={STATUS_TONE[status]} label={SHORTAGE_STATUS_LABELS[status]} />;
    },
  }),
  columnHelper.accessor('priority_score', {
    header: 'Priority',
    cell: (info) => (
      <span className="block text-right tabular-nums">{formatScore(info.getValue())}</span>
    ),
  }),
  columnHelper.accessor('shortage_qty', {
    header: 'Shortage Qty',
    cell: (info) => (
      <span className="block text-right tabular-nums">{formatUnits(info.getValue())}</span>
    ),
  }),
]);
