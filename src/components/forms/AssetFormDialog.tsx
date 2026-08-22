import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NumberInput } from '@/components/ui/number-input';

const CATEGORIES = ['Equipment', 'Vehicle', 'IT', 'Furniture', 'Other'];
const CONDITIONS = ['New', 'Good', 'Fair', 'Poor', 'Decommissioned'];

interface AssetFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  loading?: boolean;
  employees: { id: string; name: string }[];
}

export function AssetFormDialog({ open, onOpenChange, onSubmit, initialData, loading, employees }: AssetFormProps) {
  const [form, setForm] = useState({
    name: '', asset_tag: '', category: 'Equipment', purchase_date: '', purchase_price: 0, current_value: 0,
    condition: 'New', location: '', assigned_to: '', notes: '',
  });

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name ?? '', asset_tag: initialData.asset_tag ?? '', category: initialData.category ?? 'Equipment',
        purchase_date: initialData.purchase_date ?? '', purchase_price: Number(initialData.purchase_price) || 0,
        current_value: Number(initialData.current_value) || 0, condition: initialData.condition ?? 'New',
        location: initialData.location ?? '', assigned_to: initialData.assigned_to ?? '', notes: initialData.notes ?? '',
      });
    } else {
      setForm({ name: '', asset_tag: '', category: 'Equipment', purchase_date: '', purchase_price: 0, current_value: 0, condition: 'New', location: '', assigned_to: '', notes: '' });
    }
  }, [initialData, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...form, assigned_to: form.assigned_to || null };
    onSubmit({ ...data, ...(initialData?.id ? { id: initialData.id } : {}) });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>{initialData ? 'Edit Asset' : 'Add Asset'}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Name *</Label><Input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><Label>Asset Tag</Label><Input value={form.asset_tag} onChange={e => setForm(f => ({ ...f, asset_tag: e.target.value }))} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Category</Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Condition</Label>
              <Select value={form.condition} onValueChange={v => setForm(f => ({ ...f, condition: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CONDITIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>Purchase Date</Label><Input type="date" value={form.purchase_date} onChange={e => setForm(f => ({ ...f, purchase_date: e.target.value }))} /></div>
            <div><Label>Purchase Price</Label><NumberInput  min={0} step={0.01} value={form.purchase_price} onValueChange={n => setForm(f => ({ ...f, purchase_price: n }))} /></div>
            <div><Label>Current Value</Label><NumberInput  min={0} step={0.01} value={form.current_value} onValueChange={n => setForm(f => ({ ...f, current_value: n }))} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Location</Label><Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} /></div>
            <div>
              <Label>Assigned To</Label>
              <Select value={form.assigned_to} onValueChange={v => setForm(f => ({ ...f, assigned_to: v }))}>
                <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent>{employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
