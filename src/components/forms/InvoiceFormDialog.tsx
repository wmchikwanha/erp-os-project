import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NumberInput } from '@/components/ui/number-input';

interface InvoiceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  contacts?: { id: string; name: string }[];
  loading?: boolean;
}

export function InvoiceFormDialog({ open, onOpenChange, onSubmit, initialData, contacts = [], loading }: InvoiceFormProps) {
  const [form, setForm] = useState({ invoice_number: '', contact_id: '', total_amount: 0, due_date: '', status: 'draft' });
  const [newClient, setNewClient] = useState(false);
  const [client, setClient] = useState({ name: '', email: '', company: '' });
  const upsertContact = useUpsertContact();


  useEffect(() => {
    if (initialData) {
      setForm({ invoice_number: initialData.invoice_number ?? '', contact_id: initialData.contact_id ?? '', total_amount: Number(initialData.total_amount) || 0, due_date: initialData.due_date ?? '', status: initialData.status ?? 'draft' });
    } else {
      setForm({ invoice_number: '', contact_id: '', total_amount: 0, due_date: '', status: 'draft' });
    }
  }, [initialData, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...form, contact_id: form.contact_id || null, ...(initialData?.id ? { id: initialData.id } : {}) });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Invoice' : 'New Invoice'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Invoice # *</Label><Input required value={form.invoice_number} onChange={e => setForm(f => ({ ...f, invoice_number: e.target.value }))} /></div>
            <div><Label>Amount</Label><NumberInput  min={0} step={0.01} value={form.total_amount} onValueChange={n => setForm(f => ({ ...f, total_amount: n }))} /></div>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <Label>Client</Label>
              <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setNewClient(v => !v)}>
                {newClient ? 'Pick existing' : '+ New client'}
              </Button>
            </div>
            {newClient ? (
              <div className="space-y-2 rounded-md border border-border p-2">
                <Input placeholder="Client name *" value={client.name} onChange={e => setClient(c => ({ ...c, name: e.target.value }))} />
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Email" type="email" value={client.email} onChange={e => setClient(c => ({ ...c, email: e.target.value }))} />
                  <Input placeholder="Company" value={client.company} onChange={e => setClient(c => ({ ...c, company: e.target.value }))} />
                </div>
                <Button
                  type="button"
                  size="sm"
                  className="w-full"
                  disabled={!client.name.trim() || upsertContact.isPending}
                  onClick={() => {
                    upsertContact.mutate(
                      { name: client.name.trim(), email: client.email || undefined, company: client.company || undefined, type: 'customer', status: 'active' },
                      { onSuccess: (id) => { setForm(f => ({ ...f, contact_id: id })); setNewClient(false); setClient({ name: '', email: '', company: '' }); } },
                    );
                  }}
                >
                  {upsertContact.isPending ? 'Creating...' : 'Create & select'}
                </Button>
              </div>
            ) : (
              <Select value={form.contact_id} onValueChange={v => setForm(f => ({ ...f, contact_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                <SelectContent>
                  {contacts.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div><Label>Due Date *</Label><Input type="date" required value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} /></div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
