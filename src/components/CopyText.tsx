import { Check, Copy } from 'lucide-react';
import * as React from 'react';
import { cn } from '@/lib/cn';
import { COPY_FEEDBACK_MS } from '@/lib/constants';

export interface CopyTextProps {
  value: string;
  label?: string;
  className?: string;
}

/**
 * Displays a monospace identifier with a one-click clipboard copy button.
 */
export function CopyText({ value, label, className }: CopyTextProps): React.ReactElement {
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (!copied) {
      return undefined;
    }
    const timer = window.setTimeout(() => {
      setCopied(false);
    }, COPY_FEEDBACK_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [copied]);

  const handleCopy = (): void => {
    void navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
    });
  };

  return (
    <span className={cn('inline-flex max-w-full items-center gap-1.5', className)}>
      <code className="min-w-0 truncate rounded border border-[var(--border-default)] bg-[var(--bg-muted)] px-1.5 py-0.5 font-mono text-xs text-[var(--text-primary)]">
        {value}
      </code>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={label ? `Copy ${label}: ${value}` : `Copy ${value}`}
        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded border border-transparent text-[var(--text-muted)] transition-colors duration-150 hover:border-[var(--border-default)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] cursor-pointer"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-[var(--status-ok)]" aria-hidden="true" />
        ) : (
          <Copy className="h-3.5 w-3.5" aria-hidden="true" />
        )}
      </button>
    </span>
  );
}
