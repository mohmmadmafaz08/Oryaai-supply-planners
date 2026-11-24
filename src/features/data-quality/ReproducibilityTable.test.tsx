import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ReproducibilityReport } from '@/data/schemas';
import { ReproducibilityTable } from './ReproducibilityTable';

const SHA_A = 'a'.repeat(64);
const SHA_B = 'b'.repeat(64);

const matchingReport: ReproducibilityReport = {
  run_a: {
    run_label: 'Run A',
    seed: 20260401,
    row_counts: { skus: 10, shortages: 14 },
    checksums: { 'skus.json': SHA_A, 'shortages.json': SHA_A },
  },
  run_b: {
    run_label: 'Run B',
    seed: 20260401,
    row_counts: { skus: 10, shortages: 14 },
    checksums: { 'skus.json': SHA_A, 'shortages.json': SHA_A },
  },
};

const mismatchedReport: ReproducibilityReport = {
  run_a: {
    run_label: 'Run A',
    seed: 20260401,
    row_counts: { skus: 10, shortages: 14 },
    checksums: { 'skus.json': SHA_A, 'shortages.json': SHA_A },
  },
  run_b: {
    run_label: 'Run B',
    seed: 20260401,
    row_counts: { skus: 10, shortages: 15 },
    checksums: { 'skus.json': SHA_A, 'shortages.json': SHA_B },
  },
};

describe('ReproducibilityTable', () => {
  it('renders MATCH badges when Run A and Run B row counts and checksums agree', () => {
    render(<ReproducibilityTable report={matchingReport} />);

    expect(screen.getByText('All Files Match')).toBeInTheDocument();
    expect(screen.getAllByText('MATCH')).toHaveLength(2);
    expect(screen.queryByText('MISMATCH')).not.toBeInTheDocument();
  });

  it('renders MISMATCH badge when Run A and Run B differ', () => {
    render(<ReproducibilityTable report={mismatchedReport} />);

    expect(screen.getByText('Drift Detected')).toBeInTheDocument();
    expect(screen.getByText('MATCH')).toBeInTheDocument();
    expect(screen.getByText('MISMATCH')).toBeInTheDocument();
  });
});
