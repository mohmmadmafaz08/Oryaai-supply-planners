import { ChevronLeft, ChevronRight } from 'lucide-react';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { formatCount } from '@/lib/format';

export interface TablePaginationBarProps {
  totalRows: number;
  pageIndex: number;
  pageCount: number;
  canPrevious: boolean;
  canNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  itemLabel?: string;
}

/**
 * Compact shared pagination footer bar for paginated tables across Oryva screens.
 */
export function TablePaginationBar({
  totalRows,
  pageIndex,
  pageCount,
  canPrevious,
  canNext,
  onPrevious,
  onNext,
  itemLabel = 'rows',
}: TablePaginationBarProps): React.ReactElement {
  return (
    <div className="flex items-center justify-between border-t border-[var(--border-default)] px-4 py-2.5 text-xs text-[var(--text-secondary)]">
      <span className="tabular-nums">
        {formatCount(totalRows)} {itemLabel} · Page {formatCount(pageIndex + 1)} of{' '}
        {formatCount(pageCount)}
      </span>
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          onClick={onPrevious}
          disabled={!canPrevious}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Prev</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onNext}
          disabled={!canNext}
          aria-label="Next page"
        >
          <span>Next</span>
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
