import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (data: any) => void;
  loading?: boolean;
  invoices: any[];
}

export function PaymentFormDialog({ open, onOpenChange, onSubmit, loading, invoices }: Props) {
  const [form, setForm] = useState({ invoice_id: '', amount: '', payment_date: new Date().toISOString().slice(0, 10), method: 'bank', reference: '' });

  useEffect(() => {
    if (open) setForm({ invoice_id: '', amount: '', payment_date: new Date().toISOString().slice(0, 10), method: 'bank', reference: '' });
  }, [open]);

  const unpaidInvoices = invoices.filter((i: any) => i.status !== 'paid');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Invoice</Label>
            <Select value={form.invoice_id} onValueChange={v => {
              const inv = invoices.find((i: any) => i.id === v);
              setForm({ ...form, invoice_id: v, amount: inv ? String(inv.total_amount) : form.amount });
            }}>
              <SelectTrigger><SelectValue placeholder="Select invoice" /></SelectTrigger>
              <SelectContent>
                {unpaidInvoices.map((i: any) => (
                  <SelectItem key={i.id} value={i.id}>{i.invoice_number} — ${Number(i.total_amount).toLocaleString()}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Amount</Label><Input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></div>
          <div><Label>Date</Label><Input type="date" value={form.payment_date} onChange={e => setForm({ ...form, payment_date: e.target.value })} /></div>
          <div>
            <Label>Method</Label>
            <Select value={form.method} onValueChange={v => setForm({ ...form, method: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="bank">Bank Transfer</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="check">Check</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Reference</Label><Input value={form.reference} onChange={e => setForm({ ...form, reference: e.target.value })} placeholder="Ref #" /></div>
          <Button className="w-full" disabled={loading || !form.amount} onClick={() => onSubmit(form)}>
            {loading ? 'Saving...' : 'Record Payment'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
