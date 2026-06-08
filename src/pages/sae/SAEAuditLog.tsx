import { useState } from 'react';
import { useSaeAuditLog, type SaeAuditEntry } from '@/hooks/useSaeAuditLog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollText, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ENTITY_LABELS: Record<string, string> = {
  outage_action_plan: 'Action plan',
  shift_collision_rules: 'Collision rules',
  sae_override: 'Override',
};

const ACTION_VARIANT = (action: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  if (action.includes('deleted') || action.includes('rejected')) return 'destructive';
  if (action.includes('approved') || action.includes('created')) return 'default';
  return 'secondary';
};

export default function SAEAuditLog() {
  const [entityType, setEntityType] = useState<string>('all');
  const filter = entityType === 'all' ? undefined : { entity_type: entityType };
  const { data: entries = [], isLoading, error } = useSaeAuditLog(filter);
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-6 max-w-4xl">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ScrollText className="w-5 h-5" /> SAE Audit Log
          </h1>
          <p className="text-sm text-muted-foreground">
            Every rule change, override decision, and plan update — captured automatically with timestamp and user.
          </p>
        </div>
        <Select value={entityType} onValueChange={setEntityType}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All entities</SelectItem>
            <SelectItem value="outage_action_plan">Action plans</SelectItem>
            <SelectItem value="shift_collision_rules">Collision rules</SelectItem>
            <SelectItem value="sae_override">Overrides</SelectItem>
          </SelectContent>
        </Select>
      </header>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {error && <p className="text-sm text-destructive">{(error as Error).message}</p>}
      {!isLoading && !entries.length && (
        <p className="text-sm text-muted-foreground">No audit entries yet.</p>
      )}

      <div className="space-y-2">
        {entries.map((e: SaeAuditEntry) => {
          const isOpen = expanded === e.id;
          return (
            <Card key={e.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={ACTION_VARIANT(e.action)} className="font-mono text-[10px]">{e.action}</Badge>
                      <Badge variant="outline" className="text-[10px]">{ENTITY_LABELS[e.entity_type] ?? e.entity_type}</Badge>
                      <span className="text-[10px] text-muted-foreground">{new Date(e.created_at).toLocaleString()}</span>
                    </div>
                    <CardTitle className="text-sm font-normal">{e.summary ?? '(no summary)'}</CardTitle>
                    <p className="text-[10px] text-muted-foreground font-mono truncate">
                      actor: {e.actor_id ?? 'system'} · entity: {e.entity_id ?? '—'}
                    </p>
                  </div>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setExpanded(isOpen ? null : e.id)}>
                    {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              </CardHeader>
              {isOpen && (
                <CardContent className="pt-0 space-y-2">
                  {e.before_data ? (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Before</p>
                      <pre className="text-[10px] bg-muted/40 rounded p-2 overflow-x-auto max-h-48">{JSON.stringify(e.before_data, null, 2)}</pre>
                    </div>
                  ) : null}
                  {e.after_data ? (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">After</p>
                      <pre className="text-[10px] bg-muted/40 rounded p-2 overflow-x-auto max-h-48">{JSON.stringify(e.after_data, null, 2)}</pre>
                    </div>
                  ) : null}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
