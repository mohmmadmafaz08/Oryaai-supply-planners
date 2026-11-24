export interface PabInputWeek {
  week: number;
  opening: number;
  inbound: number;
  demand: number;
  closing?: number;
}

export interface ProjectedBalanceRow {
  week: number;
  opening: number;
  inbound: number;
  demand: number;
  closing: number;
  suppliedClosing: number | undefined;
  hasReconciliationError: boolean;
  shortageQty: number;
  coverage: number;
}

export interface ReconciliationError {
  week: number;
  suppliedClosing: number;
  expectedClosing: number;
  delta: number;
}

export interface ProjectBalanceResult {
  rows: ProjectedBalanceRow[];
  reconciliationErrors: ReconciliationError[];
}

/**
 * Computes weekly shortage units from a projected closing balance.
 * Business rule: Any negative closing balance represents an unfulfilled shortage of -closing;
 * zero or positive balances produce 0 shortage units.
 */
export function computeShortage(closing: number): number {
  if (closing >= 0) {
    return 0;
  }
  return -closing;
}

/**
 * Computes demand coverage ratio clamped to [0, 1].
 * Business rule: When demand is 0 or negative, full coverage (1) is achieved;
 * otherwise coverage equals clamp(available / demand, 0, 1).
 */
export function coverageRatio(demand: number, available: number): number {
  if (demand <= 0) {
    return 1;
  }
  const raw = available / demand;
  if (raw <= 0) {
    return 0;
  }
  if (raw >= 1) {
    return 1;
  }
  return raw;
}

/**
 * Projects weekly available balance (PAB) forward without mutating input rows.
 * Business rule: For each week sorted chronologically, closing = opening + inbound - demand
 * and opening(week n) = closing(week n - 1). Negative closing balances are carried forward.
 * Any supplied closing balance differing from the computed value is recorded as a reconciliation error.
 */
export function projectBalance(weeks: readonly PabInputWeek[]): ProjectBalanceResult {
  if (weeks.length === 0) {
    return { rows: [], reconciliationErrors: [] };
  }

  const sorted = [...weeks].sort((a, b) => a.week - b.week);
  const rows: ProjectedBalanceRow[] = [];
  const reconciliationErrors: ReconciliationError[] = [];

  let carriedOpening = sorted[0]?.opening ?? 0;

  for (let index = 0; index < sorted.length; index += 1) {
    const entry = sorted[index];
    if (!entry) {
      continue;
    }

    const opening = index === 0 ? entry.opening : carriedOpening;
    const closing = opening + entry.inbound - entry.demand;
    const hasReconciliationError = entry.closing !== undefined && entry.closing !== closing;

    if (hasReconciliationError && entry.closing !== undefined) {
      reconciliationErrors.push({
        week: entry.week,
        suppliedClosing: entry.closing,
        expectedClosing: closing,
        delta: entry.closing - closing,
      });
    }

    const availableForDemand = Math.max(0, opening + entry.inbound);

    rows.push({
      week: entry.week,
      opening,
      inbound: entry.inbound,
      demand: entry.demand,
      closing,
      suppliedClosing: entry.closing,
      hasReconciliationError,
      shortageQty: computeShortage(closing),
      coverage: coverageRatio(entry.demand, availableForDemand),
    });

    carriedOpening = closing;
  }

  return { rows, reconciliationErrors };
}
