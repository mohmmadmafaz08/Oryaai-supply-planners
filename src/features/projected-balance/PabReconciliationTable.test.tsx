import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ProjectedBalanceRow } from '@/domain/pab';
import { PabReconciliationTable } from './PabReconciliationTable';

function buildRows(): ProjectedBalanceRow[] {
  return Array.from({ length: 20 }, (_, idx) => {
    const week = idx + 1;
    const isMismatch = week === 12;
    return {
      sku_id: 'SKU-000002',
      location_id: 'LOC-NA-01',
      week,
      opening: 400,
      inbound: 100,
      demand: 300,
      closing: 200,
      shortageQty: 0,
      coverage: 1,
      suppliedClosing: isMismatch ? 500 : 200,
      hasReconciliationError: isMismatch,
    };
  });
}

describe('PabReconciliationTable', () => {
  it('sorts mismatches first, paginates at 13 rows/page, filters mismatches only, and jumps on badge click', () => {
    render(<PabReconciliationTable rows={buildRows()} errorCount={1} />);

    // 13 body rows + 1 header row = 14 rows on page 1
    const tableRows = screen.getAllByRole('row');
    expect(tableRows).toHaveLength(14);
    expect(tableRows[1]).toHaveTextContent('W12');
    expect(tableRows[1]).toHaveTextContent('+300 units');
    expect(screen.getByText('20 weeks · Page 1 of 2')).toBeInTheDocument();

    // Advance to page 2, then click mismatch badge to jump back and highlight W12
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(screen.getByText('20 weeks · Page 2 of 2')).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: /Jump to first of 1 reconciliation mismatches/i }),
    );
    const afterJumpRows = screen.getAllByRole('row');
    expect(afterJumpRows[1]).toHaveTextContent('W12');
    expect(afterJumpRows[1]).toHaveAttribute('data-highlighted', 'true');

    // Toggle "Show mismatches only"
    fireEvent.click(screen.getByLabelText('Show mismatches only'));
    expect(screen.getAllByRole('row')).toHaveLength(2);
    expect(screen.getByText('1 weeks · Page 1 of 1')).toBeInTheDocument();
  });
});
