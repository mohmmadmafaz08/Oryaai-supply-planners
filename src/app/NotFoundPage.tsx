import * as React from 'react';
import { Link } from '@/lib/router-compat';
import { Button } from '@/components/ui/button';
import { ROUTE_PATHS } from '@/lib/constants';

/**
 * Fallback 404 screen for unmatched application routes.
 */
export function NotFoundPage(): React.ReactElement {
  return (
    <div className="flex flex-col items-start gap-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-6">
      <p className="font-mono text-xs text-[var(--text-muted)]">404</p>
      <h1 className="text-base font-semibold text-[var(--text-primary)]">Route not found</h1>
      <p className="text-xs text-[var(--text-secondary)]">
        The requested planning workspace path does not exist.
      </p>
      <Button asChild variant="outline" size="sm">
        <Link to={ROUTE_PATHS.COMMAND_CENTER}>Return to Command Center</Link>
      </Button>
    </div>
  );
}
