import { useState } from 'react';
import { useInvoices, useUpsertInvoice, useDeleteInvoice, useContacts } from '@/hooks/useCrmData';
import { cn } from '@/lib/utils';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InvoiceFormDialog } from '@/components/forms/InvoiceFormDialog';
import { DeleteConfirmDialog } from '@/components/forms/DeleteConfirmDialog';

const statusStyles: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  sent: 'bg-info/10 text-info',
  paid: 'bg-success/10 text-success',
  overdue: 'bg-destructive/10 text-destructive',
};

export default function Invoices() {
  const { data: invoices = [], isLoading } = useInvoices();
  const { data: contacts = [] } = useContacts();
  const upsert = useUpsertInvoice();
  const remove = useDeleteInvoice();
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (isLoading) return <div className="py-12 text-center text-muted-foreground text-sm">Loading invoices...</div>;

  const totals = {
    paid: invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.total_amount), 0),
    outstanding: invoices.filter(i => i.status === 'sent' || i.status === 'overdue').reduce((s, i) => s + Number(i.total_amount), 0),
  };

  return (
    <div className="space-y-4 animate-slide-in">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="kpi-card">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Invoiced</p>
          <p className="text-xl font-bold mt-1">${invoices.reduce((s, i) => s + Number(i.total_amount), 0).toLocaleString()}</p>
        </div>
        <div className="kpi-card">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Collected</p>
          <p className="text-xl font-bold mt-1 text-success">${totals.paid.toLocaleString()}</p>
        </div>
        <div className="kpi-card">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Outstanding</p>
          <p className="text-xl font-bold mt-1 text-destructive">${totals.outstanding.toLocaleString()}</p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button size="sm" onClick={() => { setEditItem(null); setFormOpen(true); }}><Plus className="w-4 h-4 mr-1" />New Invoice</Button>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="table-header text-left px-4 py-3">Invoice</th>
                <th className="table-header text-left px-4 py-3">Client</th>
                <th className="table-header text-left px-4 py-3 hidden md:table-cell">Issue Date</th>
                <th className="table-header text-left px-4 py-3 hidden md:table-cell">Due Date</th>
                <th className="table-header text-right px-4 py-3">Amount</th>
                <th className="table-header text-left px-4 py-3">Status</th>
                <th className="table-header text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-sm font-mono font-medium">{inv.invoice_number}</td>
                  <td className="px-4 py-3 text-sm">{inv.contact_name}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">{inv.issue_date}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">{inv.due_date}</td>
                  <td className="px-4 py-3 text-sm font-medium text-right">${Number(inv.total_amount).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={cn('status-badge capitalize', statusStyles[inv.status] ?? 'bg-muted text-muted-foreground')}>{inv.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditItem(inv); setFormOpen(true); }}><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(inv.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {invoices.length === 0 && <div className="py-12 text-center text-muted-foreground text-sm">No invoices yet</div>}
      </div>

      <InvoiceFormDialog open={formOpen} onOpenChange={setFormOpen} initialData={editItem} contacts={contacts.map(c => ({ id: c.id, name: c.name }))} loading={upsert.isPending} onSubmit={(data) => { upsert.mutate(data, { onSuccess: () => setFormOpen(false) }); }} />
      <DeleteConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} loading={remove.isPending} onConfirm={() => { if (deleteId) remove.mutate(deleteId, { onSuccess: () => setDeleteId(null) }); }} title="Delete Invoice" />
    </div>
  );
}
