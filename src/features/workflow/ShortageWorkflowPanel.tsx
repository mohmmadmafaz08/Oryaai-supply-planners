import { Check, Loader2, Sparkles, Trash2, X } from 'lucide-react';
import { useCopilot } from '@/features/assistant/useCopilot';
import { Markdownish } from '@/features/assistant/Markdownish';
import * as React from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import type { Mitigation, Shortage, ShortageStatus } from '@/data/schemas';
import { useComments, useDecisions, useProfiles, useWorkflowMutations, useWorkflowRows } from '@/data/workflow';
import { useAuth } from '@/integrations/clerk';
import { validateStatusChange } from '@/domain/workflow';
import { MITIGATION_TYPE_LABELS, SHORTAGE_STATUS_LABELS } from '@/lib/constants';
import { cn } from '@/lib/cn';
import { formatUsd } from '@/lib/format';

const STATUSES: ShortageStatus[] = ['OPEN', 'MITIGATING', 'RESOLVED'];

function errMsg(e: unknown) {
  return e instanceof Error ? e.message : 'Something went wrong';
}

export function ShortageWorkflowPanel({ shortage, mitigations }: { shortage: Shortage; mitigations: Mitigation[] }) {
  const m = useWorkflowMutations();
  const decisions = useDecisions();
  const wf = useWorkflowRows();
  const comments = useComments(shortage.shortage_id);
  const profiles = useProfiles();
  const { userId } = useAuth();
  const me = userId;
  const [draft, setDraft] = React.useState('');
  const copilot = useCopilot();
  const [aiText, setAiText] = React.useState<string | null>(null);
  React.useEffect(() => {
    setAiText(null);
  }, [shortage.shortage_id]);

  function recommend() {
    copilot.mutation.mutate(
      {
        focusShortageId: shortage.shortage_id,
        messages: [{ role: 'user', content: `For ${shortage.shortage_id}: explain the root cause in two sentences, then recommend the best policy-compliant mitigation and one alternative, with trade-offs (cost, lead time, recovered units).` }],
      },
      { onSuccess: (r) => setAiText(r.answer), onError: (e) => toast.error(errMsg(e)) },
    );
  }

  const row = wf.data?.find((r) => r.shortage_id === shortage.shortage_id);
  const own = mitigations.filter((x) => x.shortage_id === shortage.shortage_id);
  const decisionMap = new Map((decisions.data ?? []).map((d) => [d.mitigation_id, d]));
  const approved = own.filter((x) => decisionMap.get(x.mitigation_id)?.decision === 'APPROVED').length;

  function setStatus(status: ShortageStatus) {
    const rule = validateStatusChange(status, approved);
    if (rule) {
      toast.error(rule);
      return;
    }
    m.setStatus.mutate(
      { shortageId: shortage.shortage_id, status },
      { onSuccess: () => toast.success(`Marked ${SHORTAGE_STATUS_LABELS[status]}`), onError: (e) => toast.error(errMsg(e)) },
    );
  }

  function decide(mit: Mitigation, decision: 'APPROVED' | 'REJECTED') {
    const reason = decision === 'REJECTED' ? (window.prompt('Reason for rejecting?') ?? '') : '';
    m.decide.mutate(
      { mitigationId: mit.mitigation_id, shortageId: shortage.shortage_id, decision, reason },
      { onSuccess: () => toast.success(decision === 'APPROVED' ? 'Mitigation approved' : 'Mitigation rejected'), onError: (e) => toast.error(errMsg(e)) },
    );
  }

  return (
    <section className="space-y-4 rounded-lg border border-border bg-muted/40 p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider">Team workflow</h3>
        {row ? (
          <span className="text-[11px] text-muted-foreground">
            Updated by {profiles.data?.get(row.updated_by) ?? 'Planner'} · {new Date(row.updated_at).toLocaleString()}
          </span>
        ) : <span className="text-[11px] text-muted-foreground">No changes yet</span>}
      </div>

      <div className="inline-flex rounded-md border border-border bg-card p-0.5" role="radiogroup" aria-label="Shortage status">
        {STATUSES.map((s) => (
          <button
            key={s}
            role="radio"
            aria-checked={shortage.status === s}
            disabled={m.setStatus.isPending}
            onClick={() => setStatus(s)}
            className={cn('rounded px-3 py-1 text-xs font-medium transition-colors', shortage.status === s ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}
          >
            {SHORTAGE_STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">Mitigation decisions ({approved} approved)</p>
        {own.length === 0 ? <p className="text-xs text-muted-foreground">No mitigation options.</p> : null}
        {own.map((mit) => {
          const d = decisionMap.get(mit.mitigation_id);
          return (
            <div key={mit.mitigation_id} className="flex items-center justify-between gap-2 rounded-md border border-border bg-card px-3 py-2">
              <div className="min-w-0">
                <p className="text-xs font-medium">{MITIGATION_TYPE_LABELS[mit.type]} <span className="font-mono text-[11px] text-muted-foreground">{formatUsd(mit.cost_usd)} · {mit.lead_time_days}d</span></p>
                {d ? (
                  <p className={cn('text-[11px]', d.decision === 'APPROVED' ? 'text-ok' : 'text-crit')}>
                    {d.decision === 'APPROVED' ? 'Approved' : 'Rejected'} by {profiles.data?.get(d.decided_by) ?? 'Planner'}{d.reason ? ` — ${d.reason}` : ''}
                  </p>
                ) : !mit.policy_compliant ? <p className="text-[11px] text-warn">Policy: {mit.policy_notes}</p> : null}
              </div>
              <div className="flex shrink-0 gap-1">
                {d ? (
                  d.decided_by === me ? (
                    <Button size="sm" variant="ghost" onClick={() => m.clearDecision.mutate(mit.mitigation_id, { onError: (e) => toast.error(errMsg(e)) })}>Undo</Button>
                  ) : null
                ) : (
                  <>
                    <Button size="icon" variant="outline" aria-label="Approve" disabled={!mit.policy_compliant} title={mit.policy_compliant ? 'Approve' : 'Not policy compliant'} onClick={() => decide(mit, 'APPROVED')}><Check className="h-4 w-4" /></Button>
                    <Button size="icon" variant="outline" aria-label="Reject" onClick={() => decide(mit, 'REJECTED')}><X className="h-4 w-4" /></Button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-2 rounded-md border border-border bg-card p-3">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-xs font-medium"><Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden /> AI recommendation</p>
          <Button size="sm" variant="outline" disabled={!copilot.ready || copilot.mutation.isPending} onClick={recommend}>
            {copilot.mutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : null}
            {aiText ? 'Regenerate' : 'Ask Gemini'}
          </Button>
        </div>
        {aiText ? <Markdownish text={aiText} /> : <p className="text-xs text-muted-foreground">Get a suggested next step based on this shortage's data.</p>}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Comments</p>
        <ul className="space-y-2">
          {(comments.data ?? []).map((c) => (
            <li key={c.id} className="group rounded-md border border-border bg-card px-3 py-2 text-sm">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="font-medium text-foreground">{profiles.data?.get(c.author_id) ?? 'Planner'}</span>
                <span className="flex items-center gap-2">
                  {new Date(c.created_at).toLocaleString()}
                  {c.author_id === me ? (
                    <button aria-label="Delete comment" onClick={() => m.deleteComment.mutate(c.id, { onError: (e) => toast.error(errMsg(e)) })} className="opacity-60 hover:opacity-100"><Trash2 className="h-3 w-3" /></button>
                  ) : null}
                </span>
              </div>
              <p className="mt-1 whitespace-pre-wrap">{c.body}</p>
            </li>
          ))}
        </ul>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!draft.trim()) return;
            m.addComment.mutate({ shortageId: shortage.shortage_id, body: draft }, { onSuccess: () => setDraft(''), onError: (er) => toast.error(errMsg(er)) });
          }}
        >
          <input value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={2000} placeholder="Add a note for the team…" aria-label="New comment" className="h-8 flex-1 rounded-md border border-border bg-card px-2.5 text-sm focus:border-primary focus:outline-none" />
          <Button size="sm" type="submit" disabled={m.addComment.isPending || !draft.trim()}>Post</Button>
        </form>
      </div>
    </section>
  );
}
