import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useOutageActionPlans, useUpdateOutageActionPlan, useDeleteOutageActionPlan, type PlanStatus, type OutageActionPlan } from '@/hooks/useOutageActionPlans';
import { Trash2, ChevronDown, ChevronUp, Undo2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
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
  const { user } = useAuth();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const onStatus = (p: OutageActionPlan, status: PlanStatus) => {
    update.mutate({ id: p.id, status, completion_notes: status === 'done' ? (notes[p.id] ?? p.completion_notes ?? '') : p.completion_notes });
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

  if (isLoading) return <p className="text-xs text-muted-foreground">Loading plans…</p>;
  if (!plans.length) {
    return <p className="text-xs text-muted-foreground">No action plans yet. Create one from a recommendation above.</p>;
  }

  return (
    <div className="space-y-2">
      {plans.map((p) => {
        const isOpen = expanded === p.id;
        return (
          <Card key={p.id} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={STATUS_VARIANT[p.status]}>{STATUS_LABELS[p.status]}</Badge>
                    {p.severity === 'urgent' && <Badge variant="destructive">Urgent</Badge>}
                    {p.due_date && <span className="text-[10px] text-muted-foreground">Due {p.due_date}</span>}
                  </div>
                  <CardTitle className="text-sm">{p.title}</CardTitle>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Select value={p.status} onValueChange={(v) => onStatus(p, v as PlanStatus)}>
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
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Completion notes</label>
                  <Textarea
                    rows={2}
                    placeholder="What was done, blockers, follow-ups…"
                    defaultValue={p.completion_notes || ''}
                    onChange={(e) => setNotes((n) => ({ ...n, [p.id]: e.target.value }))}
                    onBlur={(e) => {
                      if (e.target.value !== (p.completion_notes || '')) {
                        update.mutate({ id: p.id, completion_notes: e.target.value });
                      }
                    }}
                  />
                </div>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => overrideRec(p)}>
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
