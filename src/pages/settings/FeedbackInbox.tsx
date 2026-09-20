import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Inbox } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';

type Feedback = {
  id: string;
  name: string | null;
  email: string | null;
  type: string;
  message: string;
  page: string | null;
  role_context: string | null;
  status: string;
  created_at: string;
};

const TYPE_LABEL: Record<string, string> = {
  bug: 'Fault',
  feature: 'Change request',
  general: 'Opinion',
};

export default function FeedbackInbox() {
  const [statusFilter, setStatusFilter] = useState('all');
  const qc = useQueryClient();

  const { data = [], isLoading, error } = useQuery({
    queryKey: ['feedback'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Feedback[];
    },
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('feedback').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feedback'] });
      toast({ title: 'Status updated' });
    },
    onError: (e: Error) => toast({ title: 'Update failed', description: e.message, variant: 'destructive' }),
  });

  const rows = statusFilter === 'all' ? data : data.filter((f) => f.status === statusFilter);
  const newCount = data.filter((f) => f.status === 'new').length;

  return (
    <div className="space-y-6 max-w-4xl">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Inbox className="w-5 h-5" /> Feedback Inbox
          </h1>
          <p className="text-sm text-muted-foreground">
            Faults, change requests and opinions sent by people using the app. {newCount} new.
          </p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="reviewing">Reviewing</SelectItem>
            <SelectItem value="done">Done</SelectItem>
          </SelectContent>
        </Select>
      </header>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {error && <p className="text-sm text-destructive">{(error as Error).message}</p>}
      {!isLoading && !rows.length && <p className="text-sm text-muted-foreground">No messages yet.</p>}

      <div className="space-y-2">
        {rows.map((f) => (
          <Card key={f.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={f.type === 'bug' ? 'destructive' : f.type === 'feature' ? 'default' : 'secondary'}>
                      {TYPE_LABEL[f.type] ?? f.type}
                    </Badge>
                    {f.page && <Badge variant="outline" className="text-[10px] font-mono">{f.page}</Badge>}
                    {f.role_context && <Badge variant="outline" className="text-[10px]">{f.role_context}</Badge>}
                    <span className="text-[10px] text-muted-foreground">{new Date(f.created_at).toLocaleString()}</span>
                  </div>
                  <CardTitle className="text-sm font-normal whitespace-pre-wrap">{f.message}</CardTitle>
                  <p className="text-[10px] text-muted-foreground">
                    {f.name || 'Anonymous'}{f.email ? ` · ${f.email}` : ''}
                  </p>
                </div>
                <Select value={f.status} onValueChange={(status) => setStatus.mutate({ id: f.id, status })}>
                  <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="reviewing">Reviewing</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="pt-0" />
          </Card>
        ))}
      </div>
    </div>
  );
}
