import { AlertCircle, RefreshCw } from 'lucide-react';
import * as React from 'react';
import { Button } from './ui/button';
import { Skeleton } from './ui/skeleton';
import { EmptyState } from './EmptyState';

export interface AsyncBoundaryProps {
  isLoading: boolean;
  error: Error | null;
  onRetry?: () => void;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  skeleton?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Enforces explicit loading, error, empty, and success states across async views.
 */
export function AsyncBoundary({
  isLoading,
  error,
  onRetry,
  isEmpty = false,
  emptyTitle = 'No matching records',
  emptyDescription = 'Adjust the active filters or verify the loaded planning dataset.',
  emptyAction,
  skeleton,
  children,
}: AsyncBoundaryProps): React.ReactElement {
  if (isLoading) {
    return (
      <div aria-busy="true" aria-label="Loading data">
        {skeleton ?? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="flex flex-col items-start justify-between gap-3 rounded-lg border border-[var(--status-critical-border)] bg-[var(--status-critical-bg)] p-4 sm:flex-row sm:items-center"
      >
        <div className="flex items-start gap-2.5">
          <AlertCircle
            className="mt-0.5 h-4 w-4 shrink-0 text-[var(--status-critical)]"
            aria-hidden="true"
          />
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">
              Unable to load planning data
            </p>
            <p className="text-xs text-[var(--text-secondary)]">{error.message}</p>
          </div>
        </div>
        {onRetry ? (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Retry</span>
          </Button>
        ) : null}
      </div>
    );
  }

  if (isEmpty) {
    return <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />;
  }

  return <>{children}</>;
}
