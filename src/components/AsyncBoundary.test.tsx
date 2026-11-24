import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AsyncBoundary } from './AsyncBoundary';

describe('AsyncBoundary', () => {
  it('renders loading skeleton when isLoading is true', () => {
    render(
      <AsyncBoundary isLoading error={null}>
        <div>Loaded content</div>
      </AsyncBoundary>,
    );

    expect(screen.getByLabelText('Loading data')).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryByText('Loaded content')).not.toBeInTheDocument();
  });

  it('renders error message and retry handler when error is present', () => {
    const onRetry = vi.fn();
    render(
      <AsyncBoundary isLoading={false} error={new Error('Network timeout')} onRetry={onRetry}>
        <div>Loaded content</div>
      </AsyncBoundary>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Network timeout');
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders empty state when isEmpty is true', () => {
    render(
      <AsyncBoundary
        isLoading={false}
        error={null}
        isEmpty
        emptyTitle="No rows"
        emptyDescription="Nothing matched."
      >
        <div>Loaded content</div>
      </AsyncBoundary>,
    );

    expect(screen.getByText('No rows')).toBeInTheDocument();
    expect(screen.getByText('Nothing matched.')).toBeInTheDocument();
  });

  it('renders children when loaded and non-empty', () => {
    render(
      <AsyncBoundary isLoading={false} error={null}>
        <div>Loaded content</div>
      </AsyncBoundary>,
    );

    expect(screen.getByText('Loaded content')).toBeInTheDocument();
  });
});
