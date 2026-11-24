import { Inbox } from 'lucide-react';
import * as React from 'react';

export interface EmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
}

/**
 * Displays a clear, calm empty-state explanation with optional recovery action.
 */
export function EmptyState({ title, description, action }: EmptyStateProps): React.ReactElement {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--border-default)] bg-[var(--bg-surface)] px-6 py-10 text-center">
      <Inbox className="h-6 w-6 text-[var(--text-muted)]" aria-hidden="true" />
      <p className="text-sm font-medium text-[var(--text-primary)]">{title}</p>
      <p className="max-w-md text-xs text-[var(--text-muted)]">{description}</p>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
