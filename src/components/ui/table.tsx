import * as React from 'react';
import { cn } from '@/lib/cn';

export function Table({
  className,
  ...props
}: React.TableHTMLAttributes<HTMLTableElement>): React.ReactElement {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn('w-full border-collapse text-left text-[13px]', className)} {...props} />
    </div>
  );
}

export function TableHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>): React.ReactElement {
  return (
    <thead
      className={cn(
        'border-b border-[var(--border-default)] bg-[var(--bg-subtle)] text-xs font-medium text-[var(--text-secondary)]',
        className,
      )}
      {...props}
    />
  );
}

export function TableBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>): React.ReactElement {
  return <tbody className={cn('divide-y divide-[var(--border-default)]', className)} {...props} />;
}

export const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn('transition-colors duration-150 hover:bg-[var(--bg-hover)]', className)}
    {...props}
  />
));
TableRow.displayName = 'TableRow';

export function TableHead({
  className,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>): React.ReactElement {
  return (
    <th
      className={cn(
        'h-9 px-3 text-left align-middle font-medium whitespace-nowrap text-[var(--text-secondary)]',
        className,
      )}
      {...props}
    />
  );
}

export function TableCell({
  className,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>): React.ReactElement {
  return (
    <td className={cn('px-3 py-2 align-middle text-[var(--text-primary)]', className)} {...props} />
  );
}
