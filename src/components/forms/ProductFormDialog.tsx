import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { NumberInput } from '@/components/ui/number-input';

interface ProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  loading?: boolean;
}

export function ProductFormDialog({ open, onOpenChange, onSubmit, initialData, loading }: ProductFormProps) {
  const [form, setForm] = useState({ name: '', sku: '', description: '', unit_price: 0, stock_quantity: 0, reorder_level: 0 });

  useEffect(() => {
    if (initialData) {
      setForm({ name: initialData.name ?? '', sku: initialData.sku ?? '', description: initialData.description ?? '', unit_price: Number(initialData.unit_price) || 0, stock_quantity: initialData.stock_quantity ?? 0, reorder_level: initialData.reorder_level ?? 0 });
    } else {
      setForm({ name: '', sku: '', description: '', unit_price: 0, stock_quantity: 0, reorder_level: 0 });
    }
  }, [initialData, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...form, ...(initialData?.id ? { id: initialData.id } : {}) });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Product' : 'New Product'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div><Label>Name *</Label><Input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>SKU</Label><Input value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} /></div>
            <div><Label>Unit Price</Label><NumberInput  min={0} step={0.01} value={form.unit_price} onValueChange={n => setForm(f => ({ ...f, unit_price: n }))} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Stock Qty</Label><NumberInput  min={0} value={form.stock_quantity} onValueChange={n => setForm(f => ({ ...f, stock_quantity: n }))} /></div>
            <div><Label>Reorder Level</Label><NumberInput  min={0} value={form.reorder_level} onValueChange={n => setForm(f => ({ ...f, reorder_level: n }))} /></div>
          </div>
          <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} /></div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
