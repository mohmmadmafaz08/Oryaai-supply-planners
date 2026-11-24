import * as React from 'react';
import { useSearchParams } from '@/lib/router-compat';
import {
  CauseCodeSchema,
  ShortageStatusSchema,
  type CauseCode,
  type ShortageStatus,
} from '@/data/schemas';
import { MAX_WEEK, MIN_WEEK, QUERY_PARAM_KEYS } from '@/lib/constants';

export interface ShortageUrlState {
  search: string;
  status: ShortageStatus | 'ALL';
  cause: CauseCode | 'ALL';
  weekMin: number;
  weekMax: number;
  pageIndex: number;
  selectedShortageId: string | null;
  setStatus: (status: ShortageStatus | 'ALL') => void;
  setCause: (cause: CauseCode | 'ALL') => void;
  setWeekMin: (week: number) => void;
  setWeekMax: (week: number) => void;
  setPageIndex: (pageIndex: number) => void;
  setSelectedShortageId: (shortageId: string | null) => void;
  resetFilters: () => void;
}

function parseWeekParam(raw: string | null, fallback: number): number {
  if (!raw) {
    return fallback;
  }
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed)) {
    return fallback;
  }
  return Math.min(MAX_WEEK, Math.max(MIN_WEEK, parsed));
}

/**
 * Synchronizes shortage screen filters, pagination, and selected drawer row with URL search params.
 */
export function useShortageUrlFilters(): ShortageUrlState {
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get(QUERY_PARAM_KEYS.SEARCH) ?? '';
  const rawStatus = searchParams.get(QUERY_PARAM_KEYS.STATUS);
  const parsedStatus = ShortageStatusSchema.safeParse(rawStatus);
  const status: ShortageStatus | 'ALL' = parsedStatus.success ? parsedStatus.data : 'ALL';

  const rawCause = searchParams.get(QUERY_PARAM_KEYS.CAUSE);
  const parsedCause = CauseCodeSchema.safeParse(rawCause);
  const cause: CauseCode | 'ALL' = parsedCause.success ? parsedCause.data : 'ALL';

  const weekMin = parseWeekParam(searchParams.get(QUERY_PARAM_KEYS.WEEK_MIN), MIN_WEEK);
  const weekMax = Math.max(
    weekMin,
    parseWeekParam(searchParams.get(QUERY_PARAM_KEYS.WEEK_MAX), MAX_WEEK),
  );

  const rawPage = Number.parseInt(searchParams.get(QUERY_PARAM_KEYS.PAGE) ?? '1', 10);
  const pageIndex = Number.isNaN(rawPage) || rawPage < 1 ? 0 : rawPage - 1;
  const selectedShortageId = searchParams.get(QUERY_PARAM_KEYS.SELECTED_SHORTAGE);

  const updateParams = React.useCallback(
    (mutate: (next: URLSearchParams) => void) => {
      const next = new URLSearchParams(searchParams);
      mutate(next);
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const setStatus = React.useCallback(
    (nextStatus: ShortageStatus | 'ALL') => {
      updateParams((next) => {
        if (nextStatus === 'ALL') {
          next.delete(QUERY_PARAM_KEYS.STATUS);
        } else {
          next.set(QUERY_PARAM_KEYS.STATUS, nextStatus);
        }
        next.delete(QUERY_PARAM_KEYS.PAGE);
      });
    },
    [updateParams],
  );

  const setCause = React.useCallback(
    (nextCause: CauseCode | 'ALL') => {
      updateParams((next) => {
        if (nextCause === 'ALL') {
          next.delete(QUERY_PARAM_KEYS.CAUSE);
        } else {
          next.set(QUERY_PARAM_KEYS.CAUSE, nextCause);
        }
        next.delete(QUERY_PARAM_KEYS.PAGE);
      });
    },
    [updateParams],
  );

  const setWeekMin = React.useCallback(
    (week: number) => {
      const clamped = Math.min(MAX_WEEK, Math.max(MIN_WEEK, week));
      updateParams((next) => {
        if (clamped === MIN_WEEK) {
          next.delete(QUERY_PARAM_KEYS.WEEK_MIN);
        } else {
          next.set(QUERY_PARAM_KEYS.WEEK_MIN, String(clamped));
        }
        next.delete(QUERY_PARAM_KEYS.PAGE);
      });
    },
    [updateParams],
  );

  const setWeekMax = React.useCallback(
    (week: number) => {
      const clamped = Math.min(MAX_WEEK, Math.max(MIN_WEEK, week));
      updateParams((next) => {
        if (clamped === MAX_WEEK) {
          next.delete(QUERY_PARAM_KEYS.WEEK_MAX);
        } else {
          next.set(QUERY_PARAM_KEYS.WEEK_MAX, String(clamped));
        }
        next.delete(QUERY_PARAM_KEYS.PAGE);
      });
    },
    [updateParams],
  );

  const setPageIndex = React.useCallback(
    (nextIndex: number) => {
      updateParams((next) => {
        if (nextIndex <= 0) {
          next.delete(QUERY_PARAM_KEYS.PAGE);
        } else {
          next.set(QUERY_PARAM_KEYS.PAGE, String(nextIndex + 1));
        }
      });
    },
    [updateParams],
  );

  const setSelectedShortageId = React.useCallback(
    (shortageId: string | null) => {
      updateParams((next) => {
        if (!shortageId) {
          next.delete(QUERY_PARAM_KEYS.SELECTED_SHORTAGE);
        } else {
          next.set(QUERY_PARAM_KEYS.SELECTED_SHORTAGE, shortageId);
        }
      });
    },
    [updateParams],
  );

  const resetFilters = React.useCallback(() => {
    updateParams((next) => {
      next.delete(QUERY_PARAM_KEYS.SEARCH);
      next.delete(QUERY_PARAM_KEYS.STATUS);
      next.delete(QUERY_PARAM_KEYS.CAUSE);
      next.delete(QUERY_PARAM_KEYS.WEEK_MIN);
      next.delete(QUERY_PARAM_KEYS.WEEK_MAX);
      next.delete(QUERY_PARAM_KEYS.PAGE);
    });
  }, [updateParams]);

  return {
    search,
    status,
    cause,
    weekMin,
    weekMax,
    pageIndex,
    selectedShortageId,
    setStatus,
    setCause,
    setWeekMin,
    setWeekMax,
    setPageIndex,
    setSelectedShortageId,
    resetFilters,
  };
}
