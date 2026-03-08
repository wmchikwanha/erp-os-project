import { useState } from 'react';
import { Plus, DollarSign, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePayments, useRecordPayment, useInvoices } from '@/hooks/useCrmData';
import { PaymentFormDialog } from '@/components/forms/PaymentFormDialog';
import { DeleteConfirmDialog } from '@/components/forms/DeleteConfirmDialog';
import { cn } from '@/lib/utils';

export default function Payments() {
  const { data: payments = [], isLoading } = usePayments();
  const { data: invoices = [] } = useInvoices();
  const recordPayment = useRecordPayment();
  const [formOpen, setFormOpen] = useState(false);

  if (isLoading) return <div className="py-12 text-center text-muted-foreground text-sm">Loading payments...</div>;

  const totalCollected = payments.reduce((s, p: any) => s + Number(p.amount), 0);
  const totalOutstanding = invoices.filter((i: any) => i.status !== 'paid').reduce((s, i: any) => s + Number(i.total_amount), 0);

  const invoiceMap = Object.fromEntries(invoices.map((i: any) => [i.id, i]));

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Payments</h2>
          <p className="text-sm text-muted-foreground">Track payments against invoices</p>
        </div>
        <Button size="sm" onClick={() => setFormOpen(true)}><Plus className="w-4 h-4 mr-1" />Record Payment</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="kpi-card">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Collected</p>
          <p className="text-2xl font-bold text-success mt-1">${totalCollected.toLocaleString()}</p>
        </div>
        <div className="kpi-card">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Outstanding Receivables</p>
          <p className="text-2xl font-bold text-destructive mt-1">${totalOutstanding.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border bg-muted/50">
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Invoice</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Method</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Reference</th>
            <th className="text-right px-4 py-3 font-medium text-muted-foreground">Amount</th>
          </tr></thead>
          <tbody className="divide-y divide-border">
            {payments.map((p: any) => {
              const inv = invoiceMap[p.invoice_id];
              return (
                <tr key={p.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">{p.payment_date}</td>
                  <td className="px-4 py-3">{inv ? inv.invoice_number : '—'}</td>
                  <td className="px-4 py-3 capitalize">{p.method || '—'}</td>
                  <td className="px-4 py-3">{p.reference || '—'}</td>
                  <td className="px-4 py-3 text-right font-medium">${Number(p.amount).toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {payments.length === 0 && <p className="text-sm text-muted-foreground py-8 text-center">No payments recorded</p>}
      </div>

      <PaymentFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        loading={recordPayment.isPending}
        invoices={invoices}
        onSubmit={(data) => recordPayment.mutate(data, { onSuccess: () => setFormOpen(false) })}
      />
    </div>
  );
}
