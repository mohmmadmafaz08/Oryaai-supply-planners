import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '@/lib/cn';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium whitespace-nowrap shrink-0 border',
  {
    variants: {
      variant: {
        neutral: 'border-[var(--border-default)] bg-[var(--bg-muted)] text-[var(--text-secondary)]',
        critical:
          'border-[var(--status-critical-border)] bg-[var(--status-critical-bg)] text-[var(--status-critical)]',
        warning:
          'border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] text-[var(--status-warning)]',
        ok: 'border-[var(--status-ok-border)] bg-[var(--status-ok-bg)] text-[var(--status-ok)]',
        info: 'border-[var(--status-info-border)] bg-[var(--status-info-bg)] text-[var(--status-info)]',
      },
    },
    defaultVariants: {
      variant: 'neutral',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps): React.ReactElement {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
