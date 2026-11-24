import * as React from 'react';
import { cn } from '@/lib/cn';

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): React.ReactElement {
  return (
    <div
      className={cn(
        'rounded-2xl border border-[var(--border-default)]/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] bg-[var(--bg-surface)] text-[var(--text-primary)]',
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): React.ReactElement {
  return <div className={cn('flex flex-col gap-1 px-4 pt-4 pb-2', className)} {...props} />;
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>): React.ReactElement {
  return (
    <h2
      className={cn('text-sm font-semibold tracking-tight text-[var(--text-primary)]', className)}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>): React.ReactElement {
  return <p className={cn('text-xs text-[var(--text-muted)]', className)} {...props} />;
}

export function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): React.ReactElement {
  return <div className={cn('px-4 pb-4', className)} {...props} />;
}
