import * as React from 'react';
import { useLocation, useNavigate, useSearchParams } from '@/lib/router-compat';
import { QUERY_PARAM_KEYS, ROUTE_PATHS, SEARCH_DEBOUNCE_MS } from '@/lib/constants';

export interface GlobalSearchState {
  displayedQuery: string;
  handleInputChange: (value: string) => void;
  handleSubmit: (event: React.SyntheticEvent<HTMLFormElement>) => void;
  handleClear: () => void;
}

/**
 * Coordinates top-bar global shortage search with 200ms debounced URL synchronization on /shortages.
 */
export function useGlobalSearch(): GlobalSearchState {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const isOnShortages = location.pathname === ROUTE_PATHS.SHORTAGES;
  const urlQuery = searchParams.get(QUERY_PARAM_KEYS.SEARCH) ?? '';

  const [draftQuery, setDraftQuery] = React.useState<string | null>(null);
  const [offRouteQuery, setOffRouteQuery] = React.useState(urlQuery);
  const debounceTimerRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    return () => {
      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const displayedQuery = isOnShortages ? (draftQuery ?? urlQuery) : offRouteQuery;

  const updateShortagesQuery = React.useCallback(
    (nextValue: string) => {
      const next = new URLSearchParams(searchParams);
      if (nextValue.length > 0) {
        next.set(QUERY_PARAM_KEYS.SEARCH, nextValue);
      } else {
        next.delete(QUERY_PARAM_KEYS.SEARCH);
      }
      next.delete(QUERY_PARAM_KEYS.PAGE);
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const handleSubmit = (event: React.SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (debounceTimerRef.current !== null) {
      window.clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    const trimmed = displayedQuery.trim();
    if (isOnShortages) {
      setDraftQuery(null);
      updateShortagesQuery(trimmed);
      return;
    }
    const targetParams = new URLSearchParams();
    if (trimmed.length > 0) {
      targetParams.set(QUERY_PARAM_KEYS.SEARCH, trimmed);
    }
    const suffix = targetParams.toString();
    void navigate(suffix ? `${ROUTE_PATHS.SHORTAGES}?${suffix}` : ROUTE_PATHS.SHORTAGES);
  };

  const handleInputChange = (value: string): void => {
    if (!isOnShortages) {
      setOffRouteQuery(value);
      return;
    }
    setDraftQuery(value);
    if (debounceTimerRef.current !== null) {
      window.clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = window.setTimeout(() => {
      updateShortagesQuery(value);
      setDraftQuery(null);
      debounceTimerRef.current = null;
    }, SEARCH_DEBOUNCE_MS);
  };

  const handleClear = (): void => {
    if (debounceTimerRef.current !== null) {
      window.clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    if (isOnShortages) {
      setDraftQuery(null);
      updateShortagesQuery('');
    } else {
      setOffRouteQuery('');
    }
  };

  return { displayedQuery, handleInputChange, handleSubmit, handleClear };
}
