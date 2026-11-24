import { useTable, type SortingState } from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import * as React from 'react';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TablePaginationBar } from '@/components/TablePaginationBar';
import type { Shortage } from '@/data/schemas';
import { cn } from '@/lib/cn';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';
import { shortageTableColumns, shortageTableFeatures } from './shortageColumns';

export interface ShortageDataGridProps {
  data: Shortage[];
  pageIndex: number;
  selectedShortageId: string | null;
  onPageIndexChange: (pageIndex: number) => void;
  onSelectShortage: (shortageId: string) => void;
}

/**
 * Sortable, paginated TanStack Table v9 shortage grid with keyboard row activation.
 */
export function ShortageDataGrid({
  data,
  pageIndex,
  selectedShortageId,
  onPageIndexChange,
  onSelectShortage,
}: ShortageDataGridProps): React.ReactElement {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'priority_score', desc: true },
  ]);

  const table = useTable({
    features: shortageTableFeatures,
    columns: shortageTableColumns,
    data,
    state: { sorting, pagination: { pageIndex, pageSize: DEFAULT_PAGE_SIZE } },
    onSortingChange: setSorting,
    onPaginationChange: (updater) => {
      const current = { pageIndex, pageSize: DEFAULT_PAGE_SIZE };
      const next = typeof updater === 'function' ? updater(current) : updater;
      onPageIndexChange(next.pageIndex);
    },
  });

  return (
    <Card className="overflow-hidden">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const sortDir = header.column.getIsSorted();
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : (
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        className="inline-flex items-center gap-1 font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                      >
                        <table.FlexRender header={header} />
                        {sortDir === 'asc' ? (
                          <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                        ) : sortDir === 'desc' ? (
                          <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-50" aria-hidden="true" />
                        )}
                      </button>
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => {
            const isSelected = row.original.shortage_id === selectedShortageId;
            return (
              <TableRow
                key={row.id}
                tabIndex={0}
                aria-selected={isSelected}
                onClick={() => {
                  onSelectShortage(row.original.shortage_id);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onSelectShortage(row.original.shortage_id);
                  }
                }}
                className={cn('cursor-pointer', isSelected && 'bg-[var(--accent-subtle)]')}
              >
                {row.getAllCells().map((cell) => (
                  <TableCell key={cell.id}>
                    <table.FlexRender cell={cell} />
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <TablePaginationBar
        totalRows={data.length}
        pageIndex={pageIndex}
        pageCount={Math.max(1, table.getPageCount())}
        canPrevious={table.getCanPreviousPage()}
        canNext={table.getCanNextPage()}
        onPrevious={() => {
          table.previousPage();
        }}
        onNext={() => {
          table.nextPage();
        }}
      />
    </Card>
  );
}
