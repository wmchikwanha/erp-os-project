import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (data: any) => void;
  loading?: boolean;
  defaultDate: string;
  employees: { id: string; name: string }[];
  sites: { id: string; name: string }[];
  projects: { id: string; name: string }[];
}

export function ScheduleFormDialog({ open, onOpenChange, onSubmit, loading, defaultDate, employees, sites, projects }: Props) {
  const [form, setForm] = useState({ employee_id: '', site_id: '', project_id: '', schedule_date: defaultDate, shift_start: '07:00', shift_end: '15:00', notes: '' });

  useEffect(() => { setForm(f => ({ ...f, schedule_date: defaultDate, employee_id: '', site_id: '', project_id: '', notes: '' })); }, [open, defaultDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...form, site_id: form.site_id || null, project_id: form.project_id || null });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Assign Worker</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label>Worker *</Label>
            <Select value={form.employee_id} onValueChange={v => setForm(f => ({ ...f, employee_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Select worker" /></SelectTrigger>
              <SelectContent>{employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Date</Label><Input type="date" value={form.schedule_date} onChange={e => setForm(f => ({ ...f, schedule_date: e.target.value }))} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Shift Start</Label><Input type="time" value={form.shift_start} onChange={e => setForm(f => ({ ...f, shift_start: e.target.value }))} /></div>
            <div><Label>Shift End</Label><Input type="time" value={form.shift_end} onChange={e => setForm(f => ({ ...f, shift_end: e.target.value }))} /></div>
          </div>
          <div>
            <Label>Site</Label>
            <Select value={form.site_id} onValueChange={v => setForm(f => ({ ...f, site_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
              <SelectContent>{sites.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Project</Label>
            <Select value={form.project_id} onValueChange={v => setForm(f => ({ ...f, project_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
              <SelectContent>{projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading || !form.employee_id}>{loading ? 'Saving...' : 'Assign'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
