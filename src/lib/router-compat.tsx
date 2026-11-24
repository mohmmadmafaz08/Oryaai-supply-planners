/**
 * Thin adapter exposing the small react-router surface Oryva used, implemented on TanStack Router.
 * Keeps feature modules router-agnostic (URL search params remain the source of truth for filters).
 */
import * as React from 'react';
import { Outlet, useNavigate as useTanNavigate, useRouterState } from '@tanstack/react-router';

export { Outlet };

type NextParams = URLSearchParams | Record<string, string> | ((prev: URLSearchParams) => URLSearchParams);

export function useLocation(): { pathname: string; search: string } {
  const loc = useRouterState({ select: (s) => s.location });
  return { pathname: loc.pathname, search: loc.searchStr };
}

export function useSearchParams(): [
  URLSearchParams,
  (next: NextParams, opts?: { replace?: boolean }) => void,
] {
  const { pathname, search } = useLocation();
  const navigate = useTanNavigate();
  const params = React.useMemo(() => new URLSearchParams(search), [search]);
  const setParams = React.useCallback(
    (next: NextParams, opts?: { replace?: boolean }) => {
      const resolved =
        typeof next === 'function'
          ? next(new URLSearchParams(window.location.search))
          : next instanceof URLSearchParams
            ? next
            : new URLSearchParams(next);
      const qs = resolved.toString();
      void navigate({ href: qs ? `${pathname}?${qs}` : pathname, replace: opts?.replace ?? false });
    },
    [navigate, pathname],
  );
  return [params, setParams];
}

export function useNavigate(): (to: string, opts?: { replace?: boolean }) => Promise<void> {
  const navigate = useTanNavigate();
  return React.useCallback(
    (to: string, opts?: { replace?: boolean }) =>
      navigate({ href: to, replace: opts?.replace ?? false }),
    [navigate],
  );
}

interface LinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'className'> {
  to: string;
  className?: string;
}

function useLinkClick(to: string, onClick?: React.MouseEventHandler<HTMLAnchorElement>) {
  const navigate = useNavigate();
  return (e: React.MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    void navigate(to);
  };
}

export function Link({ to, onClick, ...rest }: LinkProps): React.ReactElement {
  const handle = useLinkClick(to, onClick);
  return <a href={to} onClick={handle} {...rest} />;
}

interface NavLinkProps extends Omit<LinkProps, 'className'> {
  end?: boolean;
  className?: string | ((s: { isActive: boolean }) => string);
}

export function NavLink({ to, end, className, onClick, ...rest }: NavLinkProps): React.ReactElement {
  const { pathname } = useLocation();
  const isActive = end ? pathname === to : pathname === to || pathname.startsWith(`${to}/`);
  const handle = useLinkClick(to, onClick);
  return (
    <a
      href={to}
      onClick={handle}
      aria-current={isActive ? 'page' : undefined}
      className={typeof className === 'function' ? className({ isActive }) : className}
      {...rest}
    />
  );
}
