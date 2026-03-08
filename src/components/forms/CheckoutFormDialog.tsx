import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CONDITIONS = ['New', 'Good', 'Fair', 'Poor'];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (data: any) => void;
  loading?: boolean;
  assets: { id: string; name: string; tag?: string }[];
  employees: { id: string; name: string }[];
  sites: { id: string; name: string }[];
  projects: { id: string; name: string }[];
}

export function CheckoutFormDialog({ open, onOpenChange, onSubmit, loading, assets, employees, sites, projects }: Props) {
  const [form, setForm] = useState({ asset_id: '', checked_out_to: '', site_id: '', project_id: '', expected_return_date: '', checkout_condition: 'Good', checkout_notes: '' });

  useEffect(() => { if (open) setForm({ asset_id: '', checked_out_to: '', site_id: '', project_id: '', expected_return_date: '', checkout_condition: 'Good', checkout_notes: '' }); }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...form, site_id: form.site_id || null, project_id: form.project_id || null, expected_return_date: form.expected_return_date || null });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Check Out Equipment</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label>Equipment *</Label>
            <Select value={form.asset_id} onValueChange={v => setForm(f => ({ ...f, asset_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Select asset" /></SelectTrigger>
              <SelectContent>{assets.map(a => <SelectItem key={a.id} value={a.id}>{a.name}{a.tag ? ` (${a.tag})` : ''}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Assign To *</Label>
            <Select value={form.checked_out_to} onValueChange={v => setForm(f => ({ ...f, checked_out_to: v }))}>
              <SelectTrigger><SelectValue placeholder="Select worker" /></SelectTrigger>
              <SelectContent>{employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
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
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Expected Return</Label><Input type="date" value={form.expected_return_date} onChange={e => setForm(f => ({ ...f, expected_return_date: e.target.value }))} /></div>
            <div>
              <Label>Condition at Checkout</Label>
              <Select value={form.checkout_condition} onValueChange={v => setForm(f => ({ ...f, checkout_condition: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CONDITIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Notes</Label><Textarea value={form.checkout_notes} onChange={e => setForm(f => ({ ...f, checkout_notes: e.target.value }))} rows={2} /></div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading || !form.asset_id || !form.checked_out_to}>{loading ? 'Processing...' : 'Check Out'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
