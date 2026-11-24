import { useSignOut } from '@/app/useSignOut';
import { LogOut, Moon, Search, Sun, X, User } from 'lucide-react';
import { useAuth, UserButton } from '@/integrations/clerk';
import * as React from 'react';
import { useTheme } from '@/app/providers';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useManifestQuery } from '@/data/queries';
import { formatCount } from '@/lib/format';
import { useGlobalSearch } from './useGlobalSearch';

/**
 * Top application bar with global shortage search, dataset provenance badge, theme toggle, and Clerk user session.
 */
export function TopBar(): React.ReactElement {
  const { theme, toggleTheme } = useTheme();
  const manifestQuery = useManifestQuery();
  const search = useGlobalSearch();
  const { user, isClerkConfigured } = useAuth();
  const email = user?.email || '';
  const fullName = user?.fullName || 'Planner';

  const signOut = useSignOut();

  const manifest = manifestQuery.data;
  const totalGeneratedRows = manifest
    ? Object.values(manifest.row_counts).reduce((sum, n) => sum + n, 0)
    : 0;

  return (
    <header className="flex h-13 shrink-0 items-center justify-between gap-4 border-b border-[var(--border-default)] bg-[var(--bg-surface)] px-4">
      <form onSubmit={search.handleSubmit} className="relative flex w-full max-w-md items-center">
        <label htmlFor="global-shortage-search" className="sr-only">
          Search shortages by shortage ID, SKU ID, or supplier ID
        </label>
        <Search
          className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-[var(--text-muted)]"
          aria-hidden="true"
        />
        <input
          id="global-shortage-search"
          type="search"
          value={search.displayedQuery}
          onChange={(event) => {
            search.handleInputChange(event.target.value);
          }}
          placeholder="Search shortage ID, SKU ID, or supplier ID..."
          className="h-8 w-full rounded-md border border-[var(--border-default)] bg-[var(--bg-subtle)] pl-8 pr-8 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none"
        />
        {search.displayedQuery.length > 0 ? (
          <button
            type="button"
            aria-label="Clear search"
            onClick={search.handleClear}
            className="absolute right-2 inline-flex h-5 w-5 items-center justify-center rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        ) : null}
      </form>

      <div className="flex items-center gap-2.5 shrink-0">
        {manifest ? (
          <Badge variant="neutral" className="hidden tabular-nums sm:inline-flex">
            <span>Seed {String(manifest.seed)}</span>
            <span aria-hidden="true">·</span>
            <span>{formatCount(totalGeneratedRows)} rows</span>
          </Badge>
        ) : null}

        <Button
          variant="outline"
          size="icon"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          className="cursor-pointer"
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Moon className="h-4 w-4" aria-hidden="true" />
          )}
        </Button>

        <div className="flex items-center gap-2 border-l border-[var(--border-default)] pl-2.5">
          {isClerkConfigured ? (
            <div className="flex items-center gap-2">
              <UserButton afterSignOutUrl="/auth" />
              <span className="hidden text-xs text-muted-foreground md:inline-block max-w-[120px] truncate">
                {fullName}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span
                className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent-subtle)] text-xs font-semibold uppercase text-[var(--accent)]"
                title={email || fullName}
              >
                {fullName.slice(0, 1) || <User className="h-3.5 w-3.5" />}
              </span>
              <span className="hidden text-xs text-muted-foreground md:inline-block max-w-[120px] truncate">
                {fullName}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void signOut()}
                aria-label="Sign out"
                className="cursor-pointer text-xs"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                <span className="hidden lg:inline">Sign out</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
