import { AlertTriangle, RotateCcw } from 'lucide-react';
import * as React from 'react';
import { Button } from '@/components/ui/button';

interface LayoutErrorBoundaryProps {
  children: React.ReactNode;
}

interface LayoutErrorBoundaryState {
  error: Error | null;
}

/**
 * Catches unexpected runtime errors at the application shell level.
 */
export class LayoutErrorBoundary extends React.Component<
  LayoutErrorBoundaryProps,
  LayoutErrorBoundaryState
> {
  constructor(props: LayoutErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): LayoutErrorBoundaryState {
    return { error };
  }

  private handleReset = (): void => {
    this.setState({ error: null });
  };

  override render(): React.ReactNode {
    if (this.state.error) {
      return (
        <div
          role="alert"
          className="flex min-h-screen items-center justify-center bg-[var(--bg-canvas)] p-6"
        >
          <div className="max-w-md space-y-4 rounded-lg border border-[var(--status-critical-border)] bg-[var(--bg-surface)] p-6">
            <div className="flex items-center gap-2 text-[var(--status-critical)]">
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              <h1 className="text-base font-semibold text-[var(--text-primary)]">
                Application render error
              </h1>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">{this.state.error.message}</p>
            <Button variant="outline" size="sm" onClick={this.handleReset}>
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Recover view</span>
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
