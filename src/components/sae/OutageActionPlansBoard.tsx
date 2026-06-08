import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  useOutageActionPlans,
  useUpdateOutageActionPlan,
  useDeleteOutageActionPlan,
  useApproveOutageActionPlan,
  type PlanStatus,
  type OutageActionPlan,
} from '@/hooks/useOutageActionPlans';
import { Trash2, ChevronDown, ChevronUp, Undo2, Check, X, ShieldCheck, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRole, isDepartmentManager } from '@/hooks/useRole';
import { toast } from '@/hooks/use-toast';

const STATUS_LABELS: Record<PlanStatus, string> = {
  pending: 'Pending',
  in_progress: 'In progress',
  done: 'Done',
  skipped: 'Skipped',
};

const STATUS_VARIANT: Record<PlanStatus, 'secondary' | 'default' | 'outline' | 'destructive'> = {
  pending: 'secondary',
  in_progress: 'default',
  done: 'outline',
  skipped: 'destructive',
};

export default function OutageActionPlansBoard() {
  const { data: plans = [], isLoading } = useOutageActionPlans();
  const update = useUpdateOutageActionPlan();
  const del = useDeleteOutageActionPlan();
  const approve = useApproveOutageActionPlan();
  const { user } = useAuth();
  const { data: role } = useRole();
  const canApprove = role === 'admin' || isDepartmentManager(role);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const onStatus = (p: OutageActionPlan, status: PlanStatus) => {
    if (p.approval_status !== 'approved') {
      toast({ title: 'Awaiting approval', description: 'A manager must approve this plan before work can start.', variant: 'destructive' });
      return;
    }
    update.mutate({
      id: p.id,
      status,
      completion_notes: status === 'done' ? (notes[p.id] ?? p.completion_notes ?? '') : p.completion_notes,
    });
  };

  const overrideRec = async (p: OutageActionPlan) => {
    if (!user) return;
    const reason = window.prompt('Why override this recommendation?') || '';
    const { error } = await supabase.from('sae_overrides').insert({
      user_id: user.id,
      recommendation_key: p.recommendation_key,
      original_action: p.rationale_action || p.title,
      override_action: 'do_the_opposite',
      reason,
    });
    if (error) {
      toast({ title: 'Could not log override', description: error.message, variant: 'destructive' });
      return;
    }
    update.mutate({ id: p.id, status: 'skipped', completion_notes: `Overridden: ${reason}` });
    toast({ title: 'Override logged', description: 'SAE will weight this signal next time.' });
  };

  const onReject = (p: OutageActionPlan) => {
    const reason = window.prompt('Reason for rejection?') || '';
    if (!reason) return;
    approve.mutate({ id: p.id, decision: 'rejected', reason });
  };

  if (isLoading) return <p className="text-xs text-muted-foreground">Loading plans…</p>;
  if (!plans.length) {
    return <p className="text-xs text-muted-foreground">No action plans yet. Create one from a recommendation above.</p>;
  }

  return (
    <div className="space-y-2">
      {plans.map((p) => {
        const isOpen = expanded === p.id;
        const locked = p.approval_status !== 'approved';
        return (
          <Card key={p.id} className={`overflow-hidden ${p.approval_status === 'pending_approval' ? 'border-amber-500/40' : ''} ${p.approval_status === 'rejected' ? 'border-destructive/50 opacity-70' : ''}`}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={STATUS_VARIANT[p.status]}>{STATUS_LABELS[p.status]}</Badge>
                    {p.approval_status === 'pending_approval' && (
                      <Badge variant="outline" className="border-amber-500/60 text-amber-600 dark:text-amber-400">
                        <Lock className="w-3 h-3 mr-1" /> Awaiting approval
                      </Badge>
                    )}
                    {p.approval_status === 'approved' && (
                      <Badge variant="outline" className="border-emerald-500/60 text-emerald-600 dark:text-emerald-400">
                        <ShieldCheck className="w-3 h-3 mr-1" /> Approved
                      </Badge>
                    )}
                    {p.approval_status === 'rejected' && <Badge variant="destructive">Rejected</Badge>}
                    {p.severity === 'urgent' && <Badge variant="destructive">Urgent</Badge>}
                    {p.due_date && <span className="text-[10px] text-muted-foreground">Due {p.due_date}</span>}
                  </div>
                  <CardTitle className="text-sm">{p.title}</CardTitle>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Select value={p.status} onValueChange={(v) => onStatus(p, v as PlanStatus)} disabled={locked}>
                    <SelectTrigger className="h-7 w-32 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(STATUS_LABELS) as PlanStatus[]).map((s) =>
                        <SelectItem key={s} value={s} className="text-xs">{STATUS_LABELS[s]}</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setExpanded(isOpen ? null : p.id)}>
                    {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              </div>
            </CardHeader>
            {isOpen && (
              <CardContent className="space-y-3 pt-0">
                {p.description && <p className="text-xs">{p.description}</p>}
                {(p.rationale_inputs || p.rationale_logic) && (
                  <div className="rounded-md border border-border bg-muted/30 p-2 text-[11px] space-y-1">
                    {p.rationale_inputs && <p><span className="font-semibold">Inputs:</span> {p.rationale_inputs}</p>}
                    {p.rationale_logic && <p><span className="font-semibold">Logic:</span> {p.rationale_logic}</p>}
                    {p.rationale_action && <p><span className="font-semibold text-primary">Action:</span> {p.rationale_action}</p>}
                  </div>
                )}

                {p.approval_status === 'pending_approval' && (
                  <div className="rounded-md border border-amber-500/40 bg-amber-500/5 p-2 text-[11px] space-y-2">
                    <p className="font-semibold text-amber-700 dark:text-amber-400">Manager sign-off required before this plan can be assigned or worked.</p>
                    {canApprove ? (
                      <div className="flex gap-2">
                        <Button size="sm" className="h-7 text-xs" onClick={() => approve.mutate({ id: p.id, decision: 'approved' })}>
                          <Check className="w-3 h-3 mr-1" /> Approve
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onReject(p)}>
                          <X className="w-3 h-3 mr-1" /> Reject
                        </Button>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Only managers or admins can approve.</p>
                    )}
                  </div>
                )}

                {p.approval_status === 'approved' && p.approved_at && (
                  <p className="text-[10px] text-muted-foreground">
                    Approved {new Date(p.approved_at).toLocaleString()} by {p.approved_by?.slice(0, 8) ?? 'manager'}
                  </p>
                )}
                {p.approval_status === 'rejected' && (
                  <p className="text-[10px] text-destructive">Rejected: {p.rejection_reason || '(no reason given)'}</p>
                )}

                <div>
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Completion notes</label>
                  <Textarea
                    rows={2}
                    placeholder="What was done, blockers, follow-ups…"
                    defaultValue={p.completion_notes || ''}
                    disabled={locked}
                    onChange={(e) => setNotes((n) => ({ ...n, [p.id]: e.target.value }))}
                    onBlur={(e) => {
                      if (e.target.value !== (p.completion_notes || '')) {
                        update.mutate({ id: p.id, completion_notes: e.target.value });
                      }
                    }}
                  />
                </div>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => overrideRec(p)} disabled={locked}>
                    <Undo2 className="w-3 h-3 mr-1" /> Override & skip
                  </Button>
                  <Button size="sm" variant="ghost" className="text-xs h-7 text-destructive" onClick={() => del.mutate(p.id)}>
                    <Trash2 className="w-3 h-3 mr-1" /> Delete
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
