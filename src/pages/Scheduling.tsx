import { useState } from 'react';
import { useWorkSchedules, useUpsertWorkSchedule, useDeleteWorkSchedule, useEmployees, useSites, useProjects } from '@/hooks/useCrmData';
import { Plus, Trash2, CalendarDays, Clock, MapPin, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScheduleFormDialog } from '@/components/forms/ScheduleFormDialog';
import { DeleteConfirmDialog } from '@/components/forms/DeleteConfirmDialog';

const statusColors: Record<string, string> = {
  scheduled: 'bg-info/10 text-info',
  'checked-in': 'bg-success/10 text-success',
  completed: 'bg-primary/10 text-primary',
  absent: 'bg-destructive/10 text-destructive',
};

export default function Scheduling() {
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const { data: schedules = [], isLoading } = useWorkSchedules(selectedDate);
  const { data: employees = [] } = useEmployees();
  const { data: sites = [] } = useSites();
  const { data: projects = [] } = useProjects();
  const upsert = useUpsertWorkSchedule();
  const remove = useDeleteWorkSchedule();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  return (
    <div className="space-y-4 animate-slide-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <CalendarDays className="w-5 h-5 text-primary" />
          <Input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="w-44" />
          <span className="text-xs text-muted-foreground">{schedules.length} assignment{schedules.length !== 1 ? 's' : ''}</span>
        </div>
        <Button size="sm" onClick={() => setFormOpen(true)}><Plus className="w-4 h-4 mr-1" />Assign Worker</Button>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground text-sm">Loading schedules...</div>
      ) : schedules.length === 0 ? (
        <div className="py-16 text-center">
          <CalendarDays className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">No workers scheduled for {selectedDate}.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg divide-y divide-border">
          {schedules.map((ws: any) => (
            <div key={ws.id} className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{ws.employee_name}</p>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
                    {ws.site_name && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{ws.site_name}</span>}
                    {ws.shift_start && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{ws.shift_start}–{ws.shift_end}</span>}
                    {ws.project_name && <span>Project: {ws.project_name}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={`${statusColors[ws.status] || ''} capitalize text-[10px]`}>{ws.status}</Badge>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(ws.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ScheduleFormDialog open={formOpen} onOpenChange={setFormOpen} loading={upsert.isPending} defaultDate={selectedDate} employees={employees.map((e: any) => ({ id: e.id, name: e.name }))} sites={sites.map((s: any) => ({ id: s.id, name: s.name }))} projects={projects.map((p: any) => ({ id: p.id, name: p.name }))} onSubmit={(data) => upsert.mutate(data, { onSuccess: () => setFormOpen(false) })} />
      <DeleteConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} loading={remove.isPending} onConfirm={() => { if (deleteId) remove.mutate(deleteId, { onSuccess: () => setDeleteId(null) }); }} title="Remove Schedule" />
    </div>
  );
}
