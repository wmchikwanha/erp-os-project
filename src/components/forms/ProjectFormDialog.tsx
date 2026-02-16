import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const STATUSES = ['planning', 'active', 'on-hold', 'completed', 'cancelled'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];

interface ProjectFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  loading?: boolean;
  deals: { id: string; title: string }[];
  employees: { id: string; name: string }[];
}

export function ProjectFormDialog({ open, onOpenChange, onSubmit, initialData, loading, deals, employees }: ProjectFormProps) {
  const [form, setForm] = useState({
    name: '', description: '', deal_id: '', status: 'planning', priority: 'medium',
    start_date: '', end_date: '', budget: 0, actual_cost: 0, progress: 0, manager_id: '',
  });

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name ?? '', description: initialData.description ?? '', deal_id: initialData.deal_id ?? '',
        status: initialData.status ?? 'planning', priority: initialData.priority ?? 'medium',
        start_date: initialData.start_date ?? '', end_date: initialData.end_date ?? '',
        budget: Number(initialData.budget) || 0, actual_cost: Number(initialData.actual_cost) || 0,
        progress: initialData.progress ?? 0, manager_id: initialData.manager_id ?? '',
      });
    } else {
      setForm({ name: '', description: '', deal_id: '', status: 'planning', priority: 'medium', start_date: '', end_date: '', budget: 0, actual_cost: 0, progress: 0, manager_id: '' });
    }
  }, [initialData, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...form, deal_id: form.deal_id || null, manager_id: form.manager_id || null };
    onSubmit({ ...data, ...(initialData?.id ? { id: initialData.id } : {}) });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>{initialData ? 'Edit Project' : 'New Project'}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div><Label>Name *</Label><Input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
          <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Linked Deal</Label>
              <Select value={form.deal_id} onValueChange={v => setForm(f => ({ ...f, deal_id: v }))}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>{deals.map(d => <SelectItem key={d.id} value={d.id}>{d.title}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Manager</Label>
              <Select value={form.manager_id} onValueChange={v => setForm(f => ({ ...f, manager_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent>{employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace('-', ' ')}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PRIORITIES.map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Start Date</Label><Input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} /></div>
            <div><Label>End Date</Label><Input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>Budget</Label><Input type="number" min={0} step={0.01} value={form.budget} onChange={e => setForm(f => ({ ...f, budget: Number(e.target.value) }))} /></div>
            <div><Label>Actual Cost</Label><Input type="number" min={0} step={0.01} value={form.actual_cost} onChange={e => setForm(f => ({ ...f, actual_cost: Number(e.target.value) }))} /></div>
            <div><Label>Progress %</Label><Input type="number" min={0} max={100} value={form.progress} onChange={e => setForm(f => ({ ...f, progress: Number(e.target.value) }))} /></div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
