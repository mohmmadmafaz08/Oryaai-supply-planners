import * as React from 'react';
import { StatusBadge } from '@/components/StatusBadge';
import { TablePaginationBar } from '@/components/TablePaginationBar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { SkuSubstitute } from '@/data/schemas';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';

export interface SubstitutesTableProps {
  substitutes: SkuSubstitute[];
  skuDescById: Map<string, string>;
}

/**
 * Paginated engineering substitute relationships table showing Approved vs Unapproved pairs.
 */
export function SubstitutesTable({
  substitutes,
  skuDescById,
}: SubstitutesTableProps): React.ReactElement {
  const [pageIndex, setPageIndex] = React.useState(0);
  const pageCount = Math.max(1, Math.ceil(substitutes.length / DEFAULT_PAGE_SIZE));
  const safePageIndex = Math.min(pageIndex, pageCount - 1);
  const visibleRows = substitutes.slice(
    safePageIndex * DEFAULT_PAGE_SIZE,
    (safePageIndex + 1) * DEFAULT_PAGE_SIZE,
  );

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Engineering SKU Substitutes</CardTitle>
        <CardDescription>
          Approved and unapproved alternate components governed by engineering change policy
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Primary SKU</TableHead>
              <TableHead>Substitute SKU</TableHead>
              <TableHead>Approval Status</TableHead>
              <TableHead>Approved On</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleRows.map((sub) => (
              <TableRow key={`${sub.sku_id}__${sub.substitute_sku_id}`}>
                <TableCell>
                  <div className="font-mono font-medium">{sub.sku_id}</div>
                  <div className="text-xs text-[var(--text-muted)]">
                    {skuDescById.get(sub.sku_id) ?? sub.sku_id}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-mono font-medium">{sub.substitute_sku_id}</div>
                  <div className="text-xs text-[var(--text-muted)]">
                    {skuDescById.get(sub.substitute_sku_id) ?? sub.substitute_sku_id}
                  </div>
                </TableCell>
                <TableCell>
                  <StatusBadge
                    tone={sub.approved ? 'ok' : 'critical'}
                    label={sub.approved ? 'Approved' : 'Not Approved'}
                  />
                </TableCell>
                <TableCell className="font-mono text-xs">{sub.approved_on ?? '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePaginationBar
          totalRows={substitutes.length}
          pageIndex={safePageIndex}
          pageCount={pageCount}
          canPrevious={safePageIndex > 0}
          canNext={safePageIndex + 1 < pageCount}
          onPrevious={() => {
            setPageIndex((p) => Math.max(0, p - 1));
          }}
          onNext={() => {
            setPageIndex((p) => Math.min(pageCount - 1, p + 1));
          }}
          itemLabel="relationships"
        />
      </CardContent>
    </Card>
  );
}
