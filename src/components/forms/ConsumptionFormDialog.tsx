import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
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
  products: { id: string; name: string; sku?: string; stock: number }[];
  sites: { id: string; name: string }[];
  projects: { id: string; name: string }[];
  employees: { id: string; name: string }[];
}

export function ConsumptionFormDialog({ open, onOpenChange, onSubmit, loading, products, sites, projects, employees }: Props) {
  const [form, setForm] = useState({ product_id: '', site_id: '', project_id: '', consumed_by: '', quantity: 1, consumption_date: new Date().toISOString().split('T')[0], notes: '' });

  useEffect(() => { if (open) setForm({ product_id: '', site_id: '', project_id: '', consumed_by: '', quantity: 1, consumption_date: new Date().toISOString().split('T')[0], notes: '' }); }, [open]);

  const selectedProduct = products.find(p => p.id === form.product_id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...form, site_id: form.site_id || null, project_id: form.project_id || null, consumed_by: form.consumed_by || null });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Log Consumption</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label>Product *</Label>
            <Select value={form.product_id} onValueChange={v => setForm(f => ({ ...f, product_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
              <SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}{p.sku ? ` (${p.sku})` : ''} — {p.stock} in stock</SelectItem>)}</SelectContent>
            </Select>
            {selectedProduct && <p className="text-[10px] text-muted-foreground mt-1">Current stock: {selectedProduct.stock}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Quantity *</Label><NumberInput  min={1} max={selectedProduct?.stock ?? 9999} value={form.quantity} onValueChange={n => setForm(f => ({ ...f, quantity: n }))} /></div>
            <div><Label>Date</Label><Input type="date" value={form.consumption_date} onChange={e => setForm(f => ({ ...f, consumption_date: e.target.value }))} /></div>
          </div>
          <div>
            <Label>Used By</Label>
            <Select value={form.consumed_by} onValueChange={v => setForm(f => ({ ...f, consumed_by: v }))}>
              <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
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
          <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading || !form.product_id || form.quantity < 1}>{loading ? 'Logging...' : 'Log Consumption'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
