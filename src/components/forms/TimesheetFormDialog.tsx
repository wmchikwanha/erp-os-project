import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NumberInput } from '@/components/ui/number-input';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (data: any) => void;
  loading?: boolean;
  employees: any[];
  projects: any[];
  sites: any[];
  initial?: any;
}

export function TimesheetFormDialog({ open, onOpenChange, onSubmit, loading, employees, projects, sites, initial }: Props) {
  const [form, setForm] = useState({
    employee_id: '', project_id: '', site_id: '', work_date: new Date().toISOString().slice(0, 10),
    hours_worked: '8', description: '', status: 'draft',
  });

  useEffect(() => {
    if (open) {
      if (initial) setForm({ ...initial, hours_worked: String(initial.hours_worked) });
      else setForm({ employee_id: '', project_id: '', site_id: '', work_date: new Date().toISOString().slice(0, 10), hours_worked: '8', description: '', status: 'draft' });
    }
  }, [open, initial]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{initial ? 'Edit Timesheet' : 'Log Hours'}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Employee</Label>
            <Select value={form.employee_id} onValueChange={v => setForm({ ...form, employee_id: v })}>
              <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
              <SelectContent>{employees.map((e: any) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Date</Label><Input type="date" value={form.work_date} onChange={e => setForm({ ...form, work_date: e.target.value })} /></div>
          <div><Label>Hours Worked</Label><NumberInput  step="0.5" value={form.hours_worked} onValueChange={(n, raw) => setForm({ ...form, hours_worked: raw })} /></div>
          <div>
            <Label>Project (optional)</Label>
            <Select value={form.project_id} onValueChange={v => setForm({ ...form, project_id: v })}>
              <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>{projects.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Site (optional)</Label>
            <Select value={form.site_id} onValueChange={v => setForm({ ...form, site_id: v })}>
              <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>{sites.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} /></div>
          <div>
            <Label>Status</Label>
            <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="w-full" disabled={loading || !form.employee_id || !form.hours_worked} onClick={() => onSubmit({ ...form, hours_worked: parseFloat(form.hours_worked) })}>
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
