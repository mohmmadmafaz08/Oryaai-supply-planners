import { Logo } from '@/components/Logo';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import * as React from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import { useAuth, SignIn, SignUp } from '@/integrations/clerk';
import { Button } from '@/components/ui/button';
import { Sparkles, ShieldCheck } from 'lucide-react';

const search = z.object({ redirect: z.string().optional() });

export const Route = createFileRoute('/auth')({
  validateSearch: search,
  head: () => ({
    meta: [
      { title: 'Sign in · Oryva' },
      { name: 'description', content: 'Sign in to the Oryva supply planning workbench.' },
      { property: 'og:title', content: 'Sign in · Oryva' },
      { property: 'og:description', content: 'Sign in to the Oryva supply planning workbench.' },
    ],
  }),
  component: AuthPage,
});

function safePath(p: string | undefined): string {
  if (!p || p === '/' || p === '/auth') return '/dashboard';
  try {
    const u = new URL(p, window.location.origin);
    if (u.pathname === '/' || u.pathname === '/auth') return '/dashboard';
    return u.pathname + u.search;
  } catch {
    return '/dashboard';
  }
}

const inputCls =
  'h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none';

function AuthPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const { isLoaded, isSignedIn, isClerkConfigured, signInDemo } = useAuth();

  const [mode, setMode] = React.useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = React.useState('');
  const [name, setName] = React.useState('');

  React.useEffect(() => {
    if (isLoaded && isSignedIn) {
      void navigate({ to: safePath(redirect) as any, replace: true });
    }
  }, [isLoaded, isSignedIn, redirect, navigate]);

  function handleDemoLogin(customEmail?: string, customName?: string) {
    signInDemo(customEmail || 'planner@oryva.ai', customName || 'Lead Planner');
    toast.success('Signed in as Lead Supply Planner');
    void navigate({ to: safePath(redirect) as any, replace: true });
  }

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden border-r border-border bg-card p-10 lg:flex">
        <div className="absolute inset-0 bg-hero opacity-30 pointer-events-none" aria-hidden />
        <a href="/" className="relative z-10" aria-label="Oryva AI home">
          <Logo />
        </a>
        <div className="relative z-10 max-w-md space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 font-mono text-xs uppercase tracking-widest text-primary">
            <Sparkles className="h-3 w-3" /> Supply planning workbench
          </div>
          <h1 className="font-display text-4xl font-semibold leading-tight text-foreground">
            Catch the shortage before it catches you.
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Multi-tier shortage triage, mitigation approvals, projected available balance reconciliation, and scenario
            simulations for your entire planning team.
          </p>
          <div className="grid grid-cols-2 gap-3 pt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-primary" /> Enterprise SSO & MFA
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-primary" /> Audited Tenancy Boundary
            </div>
          </div>
        </div>
        <p className="relative z-10 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Oryva Systems Inc. Enterprise Supply Chain Intelligence.
        </p>
      </div>

      <div className="flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md space-y-6">
          <div className="flex items-center justify-between lg:hidden">
            <Logo />
          </div>

          {isClerkConfigured ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight">
                    {mode === 'signin' ? 'Sign in to Oryva' : 'Create an account'}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter your organization credentials to access the workbench
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                  className="text-xs cursor-pointer"
                >
                  {mode === 'signin' ? 'Sign up instead' : 'Sign in instead'}
                </Button>
              </div>

              <div className="flex justify-center rounded-lg border border-border bg-card p-4 shadow-xs">
                {mode === 'signin' ? (
                  <SignIn
                    routing="virtual"
                    fallbackRedirectUrl={safePath(redirect)}
                    forceRedirectUrl={safePath(redirect)}
                  />
                ) : (
                  <SignUp
                    routing="virtual"
                    fallbackRedirectUrl="/onboarding"
                    forceRedirectUrl="/onboarding"
                  />
                )}
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => handleDemoLogin()}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors underline cursor-pointer"
                >
                  Explore sample workspace as Lead Planner →
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">Sign in to Oryva</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Enter your organization email to access the supply planning workbench
                </p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!email) return;
                  handleDemoLogin(email, name || email.split('@')[0]);
                }}
                className="space-y-4 rounded-lg border border-border p-5 bg-card"
              >
                <div className="space-y-2">
                  <label className="text-xs font-medium text-foreground">Work Email</label>
                  <input
                    type="email"
                    className={inputCls}
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-foreground">Full Name (optional)</label>
                  <input
                    type="text"
                    className={inputCls}
                    placeholder="Jane Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full h-10 text-sm cursor-pointer">
                  Continue with Work Email
                </Button>
              </form>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => handleDemoLogin()}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors underline cursor-pointer"
                >
                  Explore sample workspace as Lead Planner →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
