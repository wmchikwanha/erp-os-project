import { useState } from 'react';
import { useActivities, useUpsertActivity, useDeleteActivity, useToggleActivity, useContacts } from '@/hooks/useCrmData';
import { cn } from '@/lib/utils';
import { Phone, Video, Mail, CheckSquare, Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ActivityFormDialog } from '@/components/forms/ActivityFormDialog';
import { DeleteConfirmDialog } from '@/components/forms/DeleteConfirmDialog';

const typeIcons: Record<string, any> = { call: Phone, meeting: Video, email: Mail, task: CheckSquare };

export default function Activities() {
  const { data: activities = [], isLoading } = useActivities();
  const { data: contacts = [] } = useContacts();
  const upsert = useUpsertActivity();
  const remove = useDeleteActivity();
  const toggle = useToggleActivity();
  const [typeFilter, setTypeFilter] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = typeFilter === 'all' ? activities : activities.filter(a => a.type === typeFilter);

  if (isLoading) return <div className="py-12 text-center text-muted-foreground text-sm">Loading activities...</div>;

  return (
    <div className="space-y-4 animate-slide-in">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-muted rounded-md p-0.5">
          {['all', 'call', 'meeting', 'email', 'task'].map((t) => (
            <button key={t} onClick={() => setTypeFilter(t)} className={cn('px-2.5 py-1 text-xs font-medium rounded capitalize transition-colors', typeFilter === t ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>{t}</button>
          ))}
        </div>
        <Button size="sm" onClick={() => { setEditItem(null); setFormOpen(true); }}><Plus className="w-4 h-4 mr-1" />Add</Button>
      </div>

      <div className="bg-card border border-border rounded-lg divide-y divide-border">
        {filtered.map((activity) => {
          const Icon = typeIcons[activity.type] ?? CheckSquare;
          const isDone = !!activity.completed_at;
          return (
            <div key={activity.id} className="px-5 py-4 flex items-start gap-4 hover:bg-muted/30 transition-colors group">
              <Checkbox checked={isDone} onCheckedChange={(checked) => toggle.mutate({ id: activity.id, completed: !!checked })} className="mt-1" />
              <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', isDone ? 'bg-success/10' : 'bg-muted')}>
                <Icon className={cn('w-4 h-4', isDone ? 'text-success' : 'text-muted-foreground')} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn('text-sm font-medium', isDone && 'line-through text-muted-foreground')}>{activity.contact_name}</span>
                  <span className="status-badge bg-muted text-muted-foreground capitalize">{activity.type}</span>
                  {isDone && <span className="status-badge bg-success/10 text-success">Completed</span>}
                </div>
                <p className="text-sm text-muted-foreground mt-1">{activity.notes}</p>
                <p className="text-xs text-muted-foreground mt-1">Due: {activity.due_date} · By: {activity.created_by}</p>
              </div>
              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditItem(activity); setFormOpen(true); }}><Pencil className="w-3.5 h-3.5" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(activity.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <div className="py-12 text-center text-muted-foreground text-sm">No activities yet</div>}
      </div>

      <ActivityFormDialog open={formOpen} onOpenChange={setFormOpen} initialData={editItem} contacts={contacts.map(c => ({ id: c.id, name: c.name }))} loading={upsert.isPending} onSubmit={(data) => { upsert.mutate(data, { onSuccess: () => setFormOpen(false) }); }} />
      <DeleteConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} loading={remove.isPending} onConfirm={() => { if (deleteId) remove.mutate(deleteId, { onSuccess: () => setDeleteId(null) }); }} title="Delete Activity" />
    </div>
  );
}
