import { useState } from 'react';
import { Plus, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useExpenses, useUpsertExpense, useEmployees, useProjects, useSites } from '@/hooks/useCrmData';
import { useRole } from '@/hooks/useRole';
import { ExpenseFormDialog } from '@/components/forms/ExpenseFormDialog';
import { cn } from '@/lib/utils';

const statusStyle: Record<string, string> = {
  pending: 'bg-warning/10 text-warning',
  approved: 'bg-success/10 text-success',
  rejected: 'bg-destructive/10 text-destructive',
};

const CATEGORIES = ['general', 'travel', 'materials', 'equipment', 'meals', 'transport', 'other'];

export default function Expenses() {
  const { data: expenses = [], isLoading } = useExpenses();
  const { data: employees = [] } = useEmployees();
  const { data: projects = [] } = useProjects();
  const { data: sites = [] } = useSites();
  const upsert = useUpsertExpense();
  const { data: role } = useRole();
  const [formOpen, setFormOpen] = useState(false);

  if (isLoading) return <div className="py-12 text-center text-muted-foreground text-sm">Loading expenses...</div>;

  const empMap = Object.fromEntries(employees.map((e: any) => [e.id, e.name]));
  const totalExpenses = expenses.reduce((s, e: any) => s + Number(e.amount), 0);
  const pendingAmount = expenses.filter((e: any) => e.status === 'pending').reduce((s, e: any) => s + Number(e.amount), 0);

  const isManager = role === 'admin' || role === 'finance_manager';
  const handleApprove = (exp: any) => upsert.mutate({ ...exp, status: 'approved' });
  const handleReject = (exp: any) => upsert.mutate({ ...exp, status: 'rejected' });

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Expenses</h2>
          <p className="text-sm text-muted-foreground">Submit and track operational expenses</p>
        </div>
        <Button size="sm" onClick={() => setFormOpen(true)}><Plus className="w-4 h-4 mr-1" />Add Expense</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="kpi-card"><p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Expenses</p><p className="text-2xl font-bold mt-1">${totalExpenses.toLocaleString()}</p></div>
        <div className="kpi-card"><p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Pending Approval</p><p className="text-2xl font-bold text-warning mt-1">${pendingAmount.toLocaleString()}</p></div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border bg-muted/50">
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Employee</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Category</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Description</th>
            <th className="text-right px-4 py-3 font-medium text-muted-foreground">Amount</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
            {isManager && <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>}
          </tr></thead>
          <tbody className="divide-y divide-border">
            {expenses.map((e: any) => (
              <tr key={e.id} className="hover:bg-muted/30">
                <td className="px-4 py-3">{e.expense_date}</td>
                <td className="px-4 py-3">{empMap[e.employee_id] || '—'}</td>
                <td className="px-4 py-3 capitalize">{e.category}</td>
                <td className="px-4 py-3 truncate max-w-[200px]">{e.description || '—'}</td>
                <td className="px-4 py-3 text-right font-medium">${Number(e.amount).toLocaleString()}</td>
                <td className="px-4 py-3"><span className={cn('status-badge capitalize', statusStyle[e.status])}>{e.status}</span></td>
                {isManager && (
                  <td className="px-4 py-3 text-right">
                    {e.status === 'pending' && (
                      <div className="flex justify-end gap-1">
                        <button onClick={() => handleApprove(e)} className="p-1 rounded hover:bg-success/10 text-success"><Check className="w-4 h-4" /></button>
                        <button onClick={() => handleReject(e)} className="p-1 rounded hover:bg-destructive/10 text-destructive"><X className="w-4 h-4" /></button>
                      </div>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {expenses.length === 0 && <p className="text-sm text-muted-foreground py-8 text-center">No expenses recorded</p>}
      </div>

      <ExpenseFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        loading={upsert.isPending}
        employees={employees}
        projects={projects}
        sites={sites}
        categories={CATEGORIES}
        onSubmit={(data) => upsert.mutate(data, { onSuccess: () => setFormOpen(false) })}
      />
    </div>
  );
}
