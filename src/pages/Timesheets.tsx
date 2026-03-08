import { useState } from 'react';
import { Plus, Clock, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTimesheets, useUpsertTimesheet, useEmployees, useProjects, useSites } from '@/hooks/useCrmData';
import { useRole } from '@/hooks/useRole';
import { TimesheetFormDialog } from '@/components/forms/TimesheetFormDialog';
import { cn } from '@/lib/utils';

const statusStyle: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  submitted: 'bg-warning/10 text-warning',
  approved: 'bg-success/10 text-success',
  rejected: 'bg-destructive/10 text-destructive',
};

export default function Timesheets() {
  const { data: timesheets = [], isLoading } = useTimesheets();
  const { data: employees = [] } = useEmployees();
  const { data: projects = [] } = useProjects();
  const { data: sites = [] } = useSites();
  const upsert = useUpsertTimesheet();
  const { data: role } = useRole();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  if (isLoading) return <div className="py-12 text-center text-muted-foreground text-sm">Loading timesheets...</div>;

  const empMap = Object.fromEntries(employees.map((e: any) => [e.id, e.name]));
  const projMap = Object.fromEntries(projects.map((p: any) => [p.id, p.name]));
  const siteMap = Object.fromEntries(sites.map((s: any) => [s.id, s.name]));

  const totalHours = timesheets.reduce((s, t: any) => s + Number(t.hours_worked), 0);
  const approvedHours = timesheets.filter((t: any) => t.status === 'approved').reduce((s, t: any) => s + Number(t.hours_worked), 0);

  const isManager = role === 'admin' || role === 'project_manager';

  const handleApprove = (ts: any) => upsert.mutate({ ...ts, status: 'approved' });
  const handleReject = (ts: any) => upsert.mutate({ ...ts, status: 'rejected' });

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Timesheets</h2>
          <p className="text-sm text-muted-foreground">Track and approve work hours</p>
        </div>
        <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}><Plus className="w-4 h-4 mr-1" />Log Hours</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="kpi-card"><p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Hours</p><p className="text-2xl font-bold mt-1">{totalHours.toFixed(1)}</p></div>
        <div className="kpi-card"><p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Approved Hours</p><p className="text-2xl font-bold text-success mt-1">{approvedHours.toFixed(1)}</p></div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border bg-muted/50">
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Employee</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Project</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Site</th>
            <th className="text-right px-4 py-3 font-medium text-muted-foreground">Hours</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
            {isManager && <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>}
          </tr></thead>
          <tbody className="divide-y divide-border">
            {timesheets.map((t: any) => (
              <tr key={t.id} className="hover:bg-muted/30">
                <td className="px-4 py-3">{t.work_date}</td>
                <td className="px-4 py-3">{empMap[t.employee_id] || '—'}</td>
                <td className="px-4 py-3">{projMap[t.project_id] || '—'}</td>
                <td className="px-4 py-3">{siteMap[t.site_id] || '—'}</td>
                <td className="px-4 py-3 text-right font-medium">{Number(t.hours_worked).toFixed(1)}</td>
                <td className="px-4 py-3"><span className={cn('status-badge capitalize', statusStyle[t.status])}>{t.status}</span></td>
                {isManager && (
                  <td className="px-4 py-3 text-right">
                    {t.status === 'submitted' && (
                      <div className="flex justify-end gap-1">
                        <button onClick={() => handleApprove(t)} className="p-1 rounded hover:bg-success/10 text-success"><Check className="w-4 h-4" /></button>
                        <button onClick={() => handleReject(t)} className="p-1 rounded hover:bg-destructive/10 text-destructive"><X className="w-4 h-4" /></button>
                      </div>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {timesheets.length === 0 && <p className="text-sm text-muted-foreground py-8 text-center">No timesheets logged</p>}
      </div>

      <TimesheetFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        loading={upsert.isPending}
        employees={employees}
        projects={projects}
        sites={sites}
        initial={editing}
        onSubmit={(data) => upsert.mutate(data, { onSuccess: () => setFormOpen(false) })}
      />
    </div>
  );
}
