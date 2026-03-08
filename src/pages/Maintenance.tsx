import { useState } from 'react';
import { useMaintenanceLogs, useUpsertMaintenanceLog, useDeleteMaintenanceLog, useAssets } from '@/hooks/useCrmData';
import { Plus, Pencil, Trash2, Wrench, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MaintenanceFormDialog } from '@/components/forms/MaintenanceFormDialog';
import { DeleteConfirmDialog } from '@/components/forms/DeleteConfirmDialog';

const statusColors: Record<string, string> = {
  scheduled: 'bg-info/10 text-info',
  'in-progress': 'bg-warning/10 text-warning',
  completed: 'bg-success/10 text-success',
};

const typeColors: Record<string, string> = {
  scheduled: 'bg-primary/10 text-primary',
  repair: 'bg-destructive/10 text-destructive',
  inspection: 'bg-muted text-muted-foreground',
};

export default function Maintenance() {
  const { data: logs = [], isLoading } = useMaintenanceLogs();
  const { data: assets = [] } = useAssets();
  const upsert = useUpsertMaintenanceLog();
  const remove = useDeleteMaintenanceLog();
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (isLoading) return <div className="py-12 text-center text-muted-foreground text-sm">Loading maintenance logs...</div>;

  const overdue = logs.filter((l: any) => l.next_due_date && new Date(l.next_due_date) < new Date() && l.status !== 'completed');

  return (
    <div className="space-y-4 animate-slide-in">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          {overdue.length > 0 && (
            <Badge variant="destructive" className="text-xs"><AlertTriangle className="w-3 h-3 mr-1" />{overdue.length} overdue</Badge>
          )}
          <span className="text-xs text-muted-foreground">{logs.length} log{logs.length !== 1 ? 's' : ''}</span>
        </div>
        <Button size="sm" onClick={() => { setEditItem(null); setFormOpen(true); }}><Plus className="w-4 h-4 mr-1" />Log Maintenance</Button>
      </div>

      {logs.length === 0 ? (
        <div className="py-16 text-center">
          <Wrench className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">No maintenance logs yet.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg divide-y divide-border">
          {logs.map((log: any) => {
            const isOverdue = log.next_due_date && new Date(log.next_due_date) < new Date() && log.status !== 'completed';
            return (
              <div key={log.id} className={`px-4 py-3 flex items-center justify-between ${isOverdue ? 'bg-destructive/5' : ''}`}>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{log.asset_name}{log.asset_tag ? ` (${log.asset_tag})` : ''}</p>
                    <Badge className={`${typeColors[log.maintenance_type] || ''} text-[10px] capitalize`}>{log.maintenance_type}</Badge>
                    <Badge className={`${statusColors[log.status] || ''} text-[10px] capitalize`}>{log.status}</Badge>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-3">
                    <span>Date: {log.performed_date}</span>
                    {log.next_due_date && <span className={isOverdue ? 'text-destructive font-medium' : ''}>Next due: {log.next_due_date}</span>}
                    {log.cost > 0 && <span>Cost: ${Number(log.cost).toLocaleString()}</span>}
                    {log.downtime_hours > 0 && <span>Downtime: {log.downtime_hours}h</span>}
                  </div>
                  {log.description && <p className="text-[11px] text-muted-foreground/70 mt-0.5 truncate">{log.description}</p>}
                </div>
                <div className="flex gap-1 shrink-0 ml-2">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditItem(log); setFormOpen(true); }}><Pencil className="w-3.5 h-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(log.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <MaintenanceFormDialog open={formOpen} onOpenChange={setFormOpen} initialData={editItem} loading={upsert.isPending} assets={assets.map((a: any) => ({ id: a.id, name: a.name, tag: a.asset_tag }))} onSubmit={(data) => upsert.mutate(data, { onSuccess: () => setFormOpen(false) })} />
      <DeleteConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} loading={remove.isPending} onConfirm={() => { if (deleteId) remove.mutate(deleteId, { onSuccess: () => setDeleteId(null) }); }} title="Delete Maintenance Log" />
    </div>
  );
}
