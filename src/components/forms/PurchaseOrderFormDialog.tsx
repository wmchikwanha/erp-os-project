import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { NumberInput } from '@/components/ui/number-input';

interface POFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { po: any; items: any[] }) => void;
  initialData?: any;
  loading?: boolean;
  suppliers: { id: string; name: string }[];
  products: { id: string; name: string; unit_price: number }[];
}

interface LineItem {
  product_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export function PurchaseOrderFormDialog({ open, onOpenChange, onSubmit, initialData, loading, suppliers, products }: POFormProps) {
  const [form, setForm] = useState({ po_number: '', supplier_id: '', requested_by: '', notes: '' });
  const [items, setItems] = useState<LineItem[]>([{ product_id: null, description: '', quantity: 1, unit_price: 0, total: 0 }]);

  useEffect(() => {
    if (initialData) {
      setForm({
        po_number: initialData.po_number ?? '',
        supplier_id: initialData.supplier_id ?? '',
        requested_by: initialData.requested_by ?? '',
        notes: initialData.notes ?? '',
      });
      // Items would need to be loaded separately
    } else {
      setForm({ po_number: `PO-${Date.now().toString(36).toUpperCase()}`, supplier_id: '', requested_by: '', notes: '' });
      setItems([{ product_id: null, description: '', quantity: 1, unit_price: 0, total: 0 }]);
    }
  }, [initialData, open]);

  const updateItem = (index: number, field: string, value: any) => {
    setItems(prev => {
      const updated = [...prev];
      (updated[index] as any)[field] = value;
      if (field === 'product_id' && value) {
        const prod = products.find(p => p.id === value);
        if (prod) {
          updated[index].description = prod.name;
          updated[index].unit_price = Number(prod.unit_price);
        }
      }
      updated[index].total = updated[index].quantity * updated[index].unit_price;
      return updated;
    });
  };

  const addItem = () => setItems(prev => [...prev, { product_id: null, description: '', quantity: 1, unit_price: 0, total: 0 }]);
  const removeItem = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i));

  const total = items.reduce((s, i) => s + i.total, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      po: { ...form, total_amount: total, ...(initialData?.id ? { id: initialData.id } : {}) },
      items: items.filter(i => i.description),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Purchase Order' : 'New Purchase Order'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>PO Number *</Label><Input required value={form.po_number} onChange={e => setForm(f => ({ ...f, po_number: e.target.value }))} /></div>
            <div>
              <Label>Supplier</Label>
              <Select value={form.supplier_id} onValueChange={v => setForm(f => ({ ...f, supplier_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
                <SelectContent>
                  {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Requested By</Label><Input value={form.requested_by} onChange={e => setForm(f => ({ ...f, requested_by: e.target.value }))} /></div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-semibold">Line Items</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}><Plus className="w-3 h-3 mr-1" />Add</Button>
            </div>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-4">
                    <Select value={item.product_id ?? ''} onValueChange={v => updateItem(i, 'product_id', v)}>
                      <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Product" /></SelectTrigger>
                      <SelectContent>
                        {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-3"><Input className="h-9 text-xs" placeholder="Description" value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} /></div>
                  <div className="col-span-1"><NumberInput className="h-9 text-xs"  min={1} value={item.quantity} onValueChange={n => updateItem(i, 'quantity', n)} /></div>
                  <div className="col-span-2"><NumberInput className="h-9 text-xs"  min={0} step={0.01} value={item.unit_price} onValueChange={n => updateItem(i, 'unit_price', n)} /></div>
                  <div className="col-span-1 text-xs font-medium text-right py-2">${item.total.toFixed(2)}</div>
                  <div className="col-span-1">
                    {items.length > 1 && <Button type="button" variant="ghost" size="icon" className="h-9 w-9" onClick={() => removeItem(i)}><Trash2 className="w-3 h-3" /></Button>}
                  </div>
                </div>
              ))}
            </div>
            <div className="text-right mt-2 text-sm font-semibold">Total: ${total.toFixed(2)}</div>
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
