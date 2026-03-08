import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const TYPES = ['inspection', 'scheduled', 'repair'];
const STATUSES = ['scheduled', 'in-progress', 'completed'];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  loading?: boolean;
  assets: { id: string; name: string; tag?: string }[];
}

export function MaintenanceFormDialog({ open, onOpenChange, onSubmit, initialData, loading, assets }: Props) {
  const [form, setForm] = useState({ asset_id: '', maintenance_type: 'inspection', description: '', performed_by: '', performed_date: new Date().toISOString().split('T')[0], next_due_date: '', cost: 0, downtime_hours: 0, status: 'scheduled', notes: '' });

  useEffect(() => {
    if (initialData) {
      setForm({ asset_id: initialData.asset_id ?? '', maintenance_type: initialData.maintenance_type ?? 'inspection', description: initialData.description ?? '', performed_by: initialData.performed_by ?? '', performed_date: initialData.performed_date ?? '', next_due_date: initialData.next_due_date ?? '', cost: Number(initialData.cost) || 0, downtime_hours: Number(initialData.downtime_hours) || 0, status: initialData.status ?? 'scheduled', notes: initialData.notes ?? '' });
    } else {
      setForm({ asset_id: '', maintenance_type: 'inspection', description: '', performed_by: '', performed_date: new Date().toISOString().split('T')[0], next_due_date: '', cost: 0, downtime_hours: 0, status: 'scheduled', notes: '' });
    }
  }, [initialData, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...form, next_due_date: form.next_due_date || null, ...(initialData?.id ? { id: initialData.id } : {}) });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>{initialData ? 'Edit Maintenance Log' : 'Log Maintenance'}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label>Asset *</Label>
            <Select value={form.asset_id} onValueChange={v => setForm(f => ({ ...f, asset_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Select asset" /></SelectTrigger>
              <SelectContent>{assets.map(a => <SelectItem key={a.id} value={a.id}>{a.name}{a.tag ? ` (${a.tag})` : ''}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Type</Label>
              <Select value={form.maintenance_type} onValueChange={v => setForm(f => ({ ...f, maintenance_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Performed Date</Label><Input type="date" value={form.performed_date} onChange={e => setForm(f => ({ ...f, performed_date: e.target.value }))} /></div>
            <div><Label>Next Due Date</Label><Input type="date" value={form.next_due_date} onChange={e => setForm(f => ({ ...f, next_due_date: e.target.value }))} /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>Performed By</Label><Input value={form.performed_by} onChange={e => setForm(f => ({ ...f, performed_by: e.target.value }))} /></div>
            <div><Label>Cost ($)</Label><Input type="number" min={0} step={0.01} value={form.cost} onChange={e => setForm(f => ({ ...f, cost: Number(e.target.value) }))} /></div>
            <div><Label>Downtime (hrs)</Label><Input type="number" min={0} step={0.5} value={form.downtime_hours} onChange={e => setForm(f => ({ ...f, downtime_hours: Number(e.target.value) }))} /></div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading || !form.asset_id}>{loading ? 'Saving...' : 'Save'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
