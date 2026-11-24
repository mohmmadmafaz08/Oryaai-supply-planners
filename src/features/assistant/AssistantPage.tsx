import { Link } from '@/lib/router-compat';
import {
  Bot,
  Check,
  Copy,
  Database,
  Flame,
  KeyRound,
  Layers,
  Loader2,
  RefreshCw,
  SendHorizontal,
  Settings2,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Upload,
  User,
  Zap,
} from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Markdownish } from './Markdownish';
import { useCopilot, type ChatMessage } from './useCopilot';

const QUICK_ACTIONS = [
  {
    icon: Flame,
    label: 'Triage Top 5 Shortages',
    prompt: 'What are the top 5 most critical shortages and how do we resolve them?',
    mode: 'action_plan' as const,
  },
  {
    icon: Zap,
    label: 'Run Full Health Audit',
    prompt: 'Run a full workspace health audit and generate a prioritized 5-step action plan.',
    mode: 'action_plan' as const,
  },
  {
    icon: Layers,
    label: 'Root Cause & Supplier Risks',
    prompt: 'Analyze root causes and identify which suppliers are driving the highest delivery delay risks.',
    mode: 'root_cause' as const,
  },
  {
    icon: ShieldCheck,
    label: 'Cost & Policy Optimization',
    prompt: 'Show me the most cost-effective policy-compliant mitigations ranked by cost per recovered unit.',
    mode: 'cost_optimizer' as const,
  },
  {
    icon: TrendingUp,
    label: 'Executive VP Briefing',
    prompt: 'Generate an executive briefing for leadership summarizing our supply chain risk posture.',
    mode: 'executive' as const,
  },
];

export function AssistantPage(): React.ReactElement {
  const { ready, mutation, stats } = useCopilot();
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [draft, setDraft] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);
  const [showApiKeyModal, setShowApiKeyModal] = React.useState(false);
  const [geminiKeyInput, setGeminiKeyInput] = React.useState(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('oryva_custom_gemini_key') || '' : '';
  });

  const endRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, mutation.isPending]);

  function send(text: string, mode?: 'action_plan' | 'root_cause' | 'cost_optimizer' | 'executive' | 'general') {
    const q = text.trim();
    if (!q || mutation.isPending) return;
    const next: ChatMessage[] = [...messages, { role: 'user', content: q.slice(0, 4000) }];
    setMessages(next);
    setDraft('');
    setError(null);
    mutation.mutate(
      { messages: next, mode },
      {
        onSuccess: (r) => setMessages((m) => [...m, { role: 'assistant', content: r.answer }]),
        onError: (e) => setError(e instanceof Error ? e.message : 'Something went wrong.'),
      },
    );
  }

  function handleCopy(text: string, index: number) {
    void navigator.clipboard.writeText(text).then(() => {
      setCopiedIndex(index);
      toast.success('Response copied to clipboard');
      setTimeout(() => setCopiedIndex(null), 2000);
    });
  }

  function handleSaveApiKey(e: React.FormEvent) {
    e.preventDefault();
    const clean = geminiKeyInput.trim();
    if (clean) {
      localStorage.setItem('oryva_custom_gemini_key', clean);
      toast.success('Custom Gemini API Key saved!');
    } else {
      localStorage.removeItem('oryva_custom_gemini_key');
      toast.success('Switched to Oryva built-in neural reasoning engine.');
    }
    setShowApiKeyModal(false);
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-7rem)] max-w-4xl flex-col gap-3">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
              <Sparkles className="h-4 w-4 text-primary" aria-hidden /> Oryva Supply Intelligence Copilot
            </h1>
            <Badge variant="ok" className="text-[10px] uppercase font-mono tracking-wider">
              Trained on Workspace
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Grounded on active shortages, BOM explosion, supplier reliability, and mitigation trade-offs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {messages.length > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMessages([])}
              className="h-8 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <RefreshCw className="h-3 w-3 mr-1" /> Clear Chat
            </Button>
          ) : null}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowApiKeyModal(true)}
            className="h-8 text-xs cursor-pointer"
          >
            <Settings2 className="h-3.5 w-3.5 mr-1 text-primary" /> AI Engine Settings
          </Button>

          <Button asChild variant="outline" size="sm" className="h-8 text-xs shrink-0 cursor-pointer">
            <Link to="/data-sources">
              <Upload className="h-3.5 w-3.5 mr-1" aria-hidden /> Data Sources
            </Link>
          </Button>
        </div>
      </div>

      {/* Active Grounding Stats Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-card/60 px-3 py-2 border border-border/60 text-xs">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Database className="h-3.5 w-3.5 text-primary" />
          <span>Active Grounding:</span>
          <span className="font-mono text-foreground font-medium">
            {stats.shortageCount} Shortages · {stats.mitigationCount} Mitigations · {stats.supplierCount} Suppliers · {stats.poCount} POs
          </span>
        </div>
        <span className="text-[11px] text-muted-foreground hidden sm:inline">
          Deterministic Domain Grounding & Policy Adherence Active
        </span>
      </div>

      {/* API Key Modal */}
      {showApiKeyModal ? (
        <Card className="border-primary/30 shadow-lg bg-card">
          <CardHeader className="py-3 px-4 border-b border-border">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-primary" /> Configure AI Engine Key (Optional)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <p className="text-xs text-muted-foreground">
              By default, Oryva runs on its instant built-in neural reasoning engine trained on supply chain planning logic.
              Optionally enter a Google Gemini API Key to run cloud-augmented generative completions.
            </p>
            <form onSubmit={handleSaveApiKey} className="space-y-3">
              <input
                type="password"
                placeholder="AIzaSy... (leave blank to use built-in engine)"
                value={geminiKeyInput}
                onChange={(e) => setGeminiKeyInput(e.target.value)}
                className="h-9 w-full rounded-md border border-border bg-background px-3 text-xs focus:border-primary focus:outline-none"
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowApiKeyModal(false)}
                  className="cursor-pointer text-xs"
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="cursor-pointer text-xs">
                  Save Configuration
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {/* Main Chat Area */}
      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden border-border/80 shadow-sm">
        <CardContent className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-5 text-center max-w-2xl mx-auto py-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Sparkles className="h-6 w-6" aria-hidden />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-foreground">Supply Chain Planning Copilot</h3>
                <p className="text-xs text-muted-foreground max-w-md">
                  Ask high-level strategic questions or drill down into individual shortage root causes, supplier bottleneck
                  evaluations, and policy-compliant mitigations.
                </p>
              </div>

              {/* Quick Action Cards */}
              <div className="grid w-full gap-2 sm:grid-cols-2 text-left pt-2">
                {QUICK_ACTIONS.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.label}
                      disabled={!ready}
                      onClick={() => send(action.prompt, action.mode)}
                      className="group flex items-start gap-2.5 rounded-lg border border-border bg-card/60 p-3 text-left transition-all hover:border-primary/40 hover:bg-card hover:shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-foreground">{action.label}</p>
                        <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{action.prompt}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            messages.map((m, i) => (
              <div
                key={i}
                className={`flex gap-3 rounded-lg p-3.5 transition-colors ${m.role === 'assistant' ? 'bg-card/70 border border-border/60' : 'bg-muted/40'
                  }`}
              >
                <span
                  className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${m.role === 'user' ? 'bg-primary/15 text-primary' : 'bg-primary text-primary-foreground'
                    }`}
                >
                  {m.role === 'user' ? <User className="h-3.5 w-3.5" aria-hidden /> : <Bot className="h-3.5 w-3.5" aria-hidden />}
                </span>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-foreground">
                      {m.role === 'user' ? 'Planner' : 'Oryva Copilot'}
                    </p>
                    {m.role === 'assistant' ? (
                      <button
                        onClick={() => handleCopy(m.content, i)}
                        aria-label="Copy response"
                        className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground cursor-pointer px-1.5 py-0.5 rounded hover:bg-muted"
                      >
                        {copiedIndex === i ? (
                          <>
                            <Check className="h-3 w-3 text-primary" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" /> Copy
                          </>
                        )}
                      </button>
                    ) : null}
                  </div>
                  {m.role === 'user' ? (
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{m.content}</p>
                  ) : (
                    <div className="prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed">
                      <Markdownish text={m.content} />
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {mutation.isPending ? (
            <div className="flex items-center gap-2.5 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-primary">
              <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden />
              <span>Analyzing supply chain graph, evaluating mitigation tradeoffs and policy compliance…</span>
            </div>
          ) : null}

          {error ? (
            <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          ) : null}
          <div ref={endRef} />
        </CardContent>

        {/* Input Form with Quick Suggestion Chips */}
        <div className="border-t border-border bg-card/40 p-3 space-y-2">
          {messages.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1">
              {QUICK_ACTIONS.slice(0, 3).map((a) => (
                <button
                  key={a.label}
                  disabled={!ready || mutation.isPending}
                  onClick={() => send(a.prompt, a.mode)}
                  className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] text-muted-foreground hover:border-primary/40 hover:text-foreground cursor-pointer disabled:opacity-50"
                >
                  {a.label}
                </button>
              ))}
            </div>
          ) : null}

          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              send(draft);
            }}
          >
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={4000}
              placeholder={ready ? 'Ask Copilot about shortages, suppliers, or mitigations (or cite SHORT-...)...' : 'Loading workspace data…'}
              aria-label="Message"
              disabled={!ready || mutation.isPending}
              className="h-10 flex-1 rounded-md border border-border bg-background px-3.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
            <Button
              type="submit"
              size="default"
              disabled={!ready || !draft.trim() || mutation.isPending}
              className="h-10 px-4 cursor-pointer"
            >
              <SendHorizontal className="h-4 w-4 mr-1.5" aria-hidden /> Send
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
