import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import * as React from 'react';
import {
  Activity, AlertOctagon, ArrowRight, Boxes, CheckCircle2, Database, FileCheck2, GitBranch,
  Lock, MessageSquare, Sparkles, Truck, Users, Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/integrations/clerk';

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: 'Oryva AI — Supply planning for teams that ship' },
      { name: 'description', content: 'Oryva AI ranks every shortage, explains its cause and lets planners approve recovery actions together — with data you can audit.' },
      { property: 'og:title', content: 'Oryva AI — Supply planning for teams that ship' },
      { property: 'og:description', content: 'Rank shortages, explain causes and approve mitigations together, with reproducible, auditable data.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
  }),
  component: Landing,
});

const SHORTAGES = [
  { id: 'SHORT-2026-000001', sku: 'SKU-000001', loc: 'LOC-NA-01', cause: 'Late inbound', week: 'W42', score: 17.16, tone: 'crit' },
  { id: 'SHORT-2026-000014', sku: 'SKU-000212', loc: 'LOC-EU-03', cause: 'Supplier capacity', week: 'W38', score: 15.02, tone: 'crit' },
  { id: 'SHORT-2026-000027', sku: 'SKU-001045', loc: 'LOC-AP-02', cause: 'Demand spike', week: 'W44', score: 11.4, tone: 'warn' },
  { id: 'SHORT-2026-000031', sku: 'SKU-000877', loc: 'LOC-NA-04', cause: 'Lead-time gap', week: 'W47', score: 8.73, tone: 'warn' },
] as const;

const MORE = [
  'Projected balance', 'Root-cause tagging', 'Priority scoring', 'Mitigation compare', 'Approval workflow', 'Activity log',
  'Invite codes', 'Org workspaces', 'Row-level security', 'Seeded generator', 'Reproducibility check', 'SHA-256 checksums',
  'Ground-truth scoring', 'JSON import', 'Gemini Copilot', 'AI recommendations', 'Supplier view', 'Purchase orders',
  'Production & BOM', 'Data dictionary', 'Scenario simulator', 'Dark mode',
];

function Landing() {
  const { isLoaded, isSignedIn } = useAuth();
  const navigate = useNavigate();

  // If already authenticated and reopening the app root, automatically navigate to dashboard
  React.useEffect(() => {
    if (isLoaded && isSignedIn) {
      void navigate({ to: '/dashboard', replace: true });
    }
  }, [isLoaded, isSignedIn, navigate]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="sticky top-0 z-30 border-b border-border/60 bg-background/75 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link to="/" aria-label="Oryva AI home"><Logo /></Link>
          <div className="flex items-center gap-7 text-[13px] text-muted-foreground">
            <a href="#platform" className="hidden hover:text-foreground md:inline">Platform</a>
            <a href="#workflow" className="hidden hover:text-foreground md:inline">Workflow</a>
            <a href="#trust" className="hidden hover:text-foreground md:inline">Trust</a>
            {isSignedIn ? (
              <Button asChild size="sm"><Link to="/dashboard">Go to Workbench</Link></Button>
            ) : (
              <>
                <Link to="/auth" className="hover:text-foreground">Sign in</Link>
                <Button asChild size="sm"><Link to="/auth">Get started</Link></Button>
              </>
            )}
          </div>
        </div>
      </nav>

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-5xl px-6 pb-16 pt-24 text-center md:pt-32">
          <a href="#platform" className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground hover:text-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden /> Now with Gemini-grounded recommendations
          </a>
          <h1 className="mx-auto mt-6 max-w-4xl text-5xl font-semibold leading-[1.02] md:text-[80px]">
            Superpowers for<br />supply planners.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            Oryva AI ranks every shortage, explains why it happened, and gets your team to an approved
            recovery plan — on data you can prove.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            {isSignedIn ? (
              <Button asChild className="h-11 px-6"><Link to="/dashboard">Open Workbench</Link></Button>
            ) : (
              <>
                <Button asChild className="h-11 px-6"><Link to="/auth">Start free workspace</Link></Button>
                <Button asChild variant="outline" className="h-11 px-6"><Link to="/auth">View live workbench</Link></Button>
              </>
            )}
          </div>
        </section>

        {/* Three pillars */}
        <section className="mx-auto grid max-w-5xl gap-10 px-6 pb-24 md:grid-cols-3">
          {[
            { icon: Boxes, t: 'Demand', b: '52 weeks of weekly demand across 3,000 SKUs and 50 locations, generated from a fixed seed.' },
            { icon: Truck, t: 'Supply', b: 'Purchase orders, supplier capacity and lead times linked to every projected balance.' },
            { icon: GitBranch, t: 'Decisions', b: 'Mitigations compared on cost, speed and recovered units — approved with a reason.' },
          ].map((p) => (
            <div key={p.t}>
              <p.icon className="h-5 w-5 text-primary" aria-hidden />
              <h3 className="mt-4 text-lg font-semibold">{p.t}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{p.b}</p>
            </div>
          ))}
        </section>

        {/* Product band */}
        <section id="platform" className="relative overflow-hidden bg-primary py-24 text-primary-foreground">
          <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_0%,var(--brand-to),transparent)] opacity-40" aria-hidden />
          <div className="relative mx-auto max-w-6xl px-6">
            <div className="text-center">
              <h2 className="text-4xl font-semibold md:text-6xl">Groundbreaking<br />shortage triage.</h2>
              <p className="mx-auto mt-5 max-w-xl opacity-80">One ranked queue. Every row traced back to the order, supplier or demand spike that caused it.</p>
            </div>
            <ProductWindow />
          </div>
        </section>

        {/* Dark feature card */}
        <section id="workflow" className="mx-auto max-w-6xl px-6 py-24">
          <div className="rounded-[28px] bg-ink p-8 text-ink-foreground md:p-14">
            <div className="text-center">
              <h2 className="text-4xl font-semibold md:text-5xl">One-click recovery plans.</h2>
              <p className="mx-auto mt-4 max-w-lg opacity-70">Compare every mitigation side by side, pick one, and resolve the shortage — with the audit trail written for you.</p>
            </div>
            <div className="mt-12 grid gap-px overflow-hidden rounded-2xl bg-ink-foreground/10 md:grid-cols-3">
              {[
                { t: 'Alternate supplier', c: '$101.34', d: 'Recommended · cheapest', on: true },
                { t: 'Stock transfer', c: '$185.60', d: 'Fastest · 4 days' },
                { t: 'Expedite PO', c: '$266.29', d: 'Recovers full qty' },
              ].map((m) => (
                <div key={m.t} className="bg-ink p-6">
                  <div className="flex items-center justify-between text-sm opacity-70">{m.t}{m.on && <CheckCircle2 className="h-4 w-4 text-ok" aria-hidden />}</div>
                  <div className="mt-3 text-3xl font-semibold tracking-tight">{m.c}</div>
                  <div className="mt-1 text-xs opacity-60">{m.d}</div>
                </div>
              ))}
            </div>
            <div className="mt-10 grid gap-8 md:grid-cols-3">
              {[
                { icon: Zap, t: 'Priority scoring', b: 'Units short × lead time × service impact, computed by rule.' },
                { icon: MessageSquare, t: 'Threaded comments', b: 'Discuss each shortage where the data lives.' },
                { icon: Activity, t: 'Full activity log', b: 'Every status change and decision, timestamped.' },
              ].map((f) => (
                <div key={f.t}>
                  <f.icon className="h-5 w-5 opacity-80" aria-hidden />
                  <h3 className="mt-3 font-semibold">{f.t}</h3>
                  <p className="mt-1 text-sm opacity-60">{f.b}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team grid */}
        <section className="mx-auto max-w-6xl px-6 pb-24">
          <h2 className="max-w-md text-4xl font-semibold md:text-5xl">Finally, your team on the same page.</h2>
          <p className="mt-4 max-w-md text-muted-foreground">Planners, buyers and leads work one queue — inside a private workspace for your organisation.</p>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            <div className="rounded-3xl bg-gradient-to-br from-brand to-brand-2 p-8 text-primary-foreground md:col-span-2">
              <Users className="h-6 w-6" aria-hidden />
              <h3 className="mt-6 text-2xl font-semibold">Organisation workspaces</h3>
              <p className="mt-2 max-w-md opacity-80">Create a workspace, share an invite code, and every member sees the same live queue.</p>
            </div>
            <div className="rounded-3xl bg-ink p-8 text-ink-foreground">
              <Sparkles className="h-6 w-6" aria-hidden />
              <h3 className="mt-6 text-2xl font-semibold">Copilot</h3>
              <p className="mt-2 opacity-70">Ask anything about your plan. Answers cite your own data.</p>
            </div>
            <div id="trust" className="rounded-3xl border border-border bg-card p-8">
              <Lock className="h-6 w-6 text-primary" aria-hidden />
              <h3 className="mt-6 text-2xl font-semibold">Private by default</h3>
              <p className="mt-2 text-muted-foreground">Database-level security isolates every organisation.</p>
            </div>
            <div className="rounded-3xl border border-border bg-card p-8 md:col-span-2">
              <div className="grid grid-cols-3 gap-6 text-center">
                {[['100%', 'edge cases caught'], ['1.00', 'precision & recall'], ['18', 'linked tables']].map(([n, l]) => (
                  <div key={l}><div className="text-4xl font-semibold tracking-tight">{n}</div><div className="mt-1 text-xs text-muted-foreground">{l}</div></div>
                ))}
              </div>
              <div className="mt-8 flex items-center gap-2 text-sm text-muted-foreground"><FileCheck2 className="h-4 w-4 text-ok" aria-hidden /> Every run is reproduced twice and checksum-verified.</div>
            </div>
          </div>
        </section>

        {/* And much more */}
        <section className="border-t border-border py-24 text-center">
          <h2 className="text-4xl font-semibold md:text-5xl">…and much,<br />much more.</h2>
          <ul className="mx-auto mt-12 flex max-w-4xl flex-wrap justify-center gap-x-6 gap-y-3 px-6 text-sm text-muted-foreground">
            {MORE.map((m) => <li key={m}>{m}</li>)}
          </ul>
        </section>

        <section className="pb-28 text-center">
          <Database className="mx-auto h-10 w-10 text-primary" aria-hidden />
          <h2 className="mt-6 text-3xl font-semibold md:text-4xl">Your plan, finally provable.</h2>
          <Button asChild className="mt-8 h-11 px-7"><Link to="/auth">Create your workspace <ArrowRight className="h-4 w-4" aria-hidden /></Link></Button>
        </section>
      </main>

      <footer className="bg-ink py-10 text-ink-foreground">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 text-sm opacity-80">
          <Logo />
          <span className="text-xs opacity-70">© 2026 Oryva AI · Supply planning workbench</span>
        </div>
      </footer>
    </div>
  );
}

function ProductWindow() {
  return (
    <div className="mx-auto mt-14 max-w-5xl overflow-hidden rounded-2xl bg-card text-left text-foreground shadow-2xl">
      <div className="flex items-center gap-1.5 border-b border-border px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-crit" /><span className="h-2.5 w-2.5 rounded-full bg-warn" /><span className="h-2.5 w-2.5 rounded-full bg-ok" />
        <span className="ml-4 text-xs text-muted-foreground">Shortages · ranked by priority</span>
      </div>
      <div className="grid md:grid-cols-[180px_1fr]">
        <aside className="hidden border-r border-border p-3 text-[13px] md:block">
          {['Command Center', 'Shortages', 'Projected balance', 'Purchase orders', 'Suppliers', 'Copilot'].map((n, i) => (
            <div key={n} className={i === 1 ? 'rounded-lg bg-accent px-2.5 py-1.5 font-medium' : 'px-2.5 py-1.5 text-muted-foreground'}>{n}</div>
          ))}
        </aside>
        <div className="overflow-x-auto p-4">
          <table className="w-full min-w-[560px]">
            <thead className="text-left text-xs text-muted-foreground">
              <tr><th className="pb-2 font-medium">Shortage</th><th className="pb-2 font-medium">SKU @ location</th><th className="pb-2 font-medium">Cause</th><th className="pb-2 font-medium">Week</th><th className="pb-2 text-right font-medium">Priority</th></tr>
            </thead>
            <tbody>
              {SHORTAGES.map((s) => (
                <tr key={s.id} className="border-t border-border">
                  <td className="py-2.5 font-mono text-xs">{s.id}</td>
                  <td className="py-2.5">{s.sku} <span className="text-muted-foreground">@ {s.loc}</span></td>
                  <td className="py-2.5"><span className="inline-flex items-center gap-1.5"><AlertOctagon className={s.tone === 'crit' ? 'h-3.5 w-3.5 text-crit' : 'h-3.5 w-3.5 text-warn'} aria-hidden />{s.cause}</span></td>
                  <td className="py-2.5 text-muted-foreground">{s.week}</td>
                  <td className="py-2.5 text-right font-medium tabular-nums">{s.score.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
