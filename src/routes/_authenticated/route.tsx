import { Outlet, createFileRoute, useNavigate, useRouterState } from '@tanstack/react-router';
import * as React from 'react';
import { useAuth } from '@/integrations/clerk';
import { AppProviders } from '@/app/providers';
import { AppShell } from '@/app/layout/AppShell';
import { OrgProvider } from '@/app/org';
import { Loader2 } from 'lucide-react';

export const Route = createFileRoute('/_authenticated')({
  ssr: false,
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  React.useEffect(() => {
    if (isLoaded && !isSignedIn) {
      const redirectTarget = pathname && pathname !== '/' && pathname !== '/auth' ? pathname : '/dashboard';
      void navigate({ to: '/auth', search: { redirect: redirectTarget }, replace: true });
    }
  }, [isLoaded, isSignedIn, navigate, pathname]);

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground gap-2">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span>Authenticating planner session…</span>
      </div>
    );
  }

  if (!isSignedIn) {
    return null;
  }

  return (
    <AppProviders>
      <OrgProvider>{pathname === '/onboarding' ? <Outlet /> : <AppShell />}</OrgProvider>
    </AppProviders>
  );
}
