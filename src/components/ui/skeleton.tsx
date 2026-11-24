import * as React from 'react';
import { cn } from '@/lib/cn';

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): React.ReactElement {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded bg-[var(--bg-muted)]', className)}
      {...props}
    />
  );
}
