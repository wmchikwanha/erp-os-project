import { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, TrendingUp, TrendingDown, Wallet, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { useBudgetLines, useUpsertBudgetLine, useDeleteBudgetLine, monthKey } from '@/hooks/useBudget';
import { useExpenses, usePayments, useProjects } from '@/hooks/useCrmData';
import { BudgetLineFormDialog } from '@/components/forms/BudgetLineFormDialog';
import { cn } from '@/lib/utils';

const money = (n: number) => `$${Math.round(n).toLocaleString()}`;

function monthLabel(period: string) {
  return new Date(period).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
}

export default function Budget() {
  const { data: lines = [], isLoading } = useBudgetLines();
  const { data: expenses = [] } = useExpenses();
  const { data: payments = [] } = usePayments();
  const { data: projects = [] } = useProjects();
  const upsert = useUpsertBudgetLine();
  const remove = useDeleteBudgetLine();

  const [period, setPeriod] = useState(monthKey(new Date()).slice(0, 7));
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const periodStart = `${period}-01`;

  const monthLines = lines.filter((l: any) => String(l.period).slice(0, 7) === period);
  const plannedIncome = monthLines.filter((l: any) => l.kind === 'income').reduce((s: number, l: any) => s + Number(l.planned_amount), 0);
  const plannedExpense = monthLines.filter((l: any) => l.kind === 'expense').reduce((s: number, l: any) => s + Number(l.planned_amount), 0);

  const actualIncome = payments
    .filter((p: any) => String(p.payment_date).slice(0, 7) === period)
    .reduce((s: number, p: any) => s + Number(p.amount), 0);
  const actualExpense = expenses
    .filter((e: any) => e.status === 'approved' && String(e.expense_date).slice(0, 7) === period)
    .reduce((s: number, e: any) => s + Number(e.amount), 0);

  const plannedNet = plannedIncome - plannedExpense;
  const actualNet = actualIncome - actualExpense;

  // 6-month planned vs actual cash flow
  const trend = useMemo(() => {
    const out: any[] = [];
    const base = new Date(`${period}-01T00:00:00`);
    for (let i = 5; i >= 0; i--) {
      const d = new Date(base.getFullYear(), base.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const pl = lines.filter((l: any) => String(l.period).slice(0, 7) === key);
      const planned = pl.filter((l: any) => l.kind === 'income').reduce((s: number, l: any) => s + Number(l.planned_amount), 0)
        - pl.filter((l: any) => l.kind === 'expense').reduce((s: number, l: any) => s + Number(l.planned_amount), 0);
      const inc = payments.filter((p: any) => String(p.payment_date).slice(0, 7) === key).reduce((s: number, p: any) => s + Number(p.amount), 0);
      const exp = expenses.filter((e: any) => e.status === 'approved' && String(e.expense_date).slice(0, 7) === key).reduce((s: number, e: any) => s + Number(e.amount), 0);
      out.push({ month: d.toLocaleDateString(undefined, { month: 'short' }), Planned: Math.round(planned), Actual: Math.round(inc - exp) });
    }
    return out;
  }, [lines, payments, expenses, period]);

  // Expense category variance
  const categoryRows = useMemo(() => {
    const cats = Array.from(new Set(monthLines.filter((l: any) => l.kind === 'expense').map((l: any) => l.category)));
    return cats.map(cat => {
      const planned = monthLines.filter((l: any) => l.kind === 'expense' && l.category === cat).reduce((s: number, l: any) => s + Number(l.planned_amount), 0);
      const actual = expenses
        .filter((e: any) => e.status === 'approved' && String(e.expense_date).slice(0, 7) === period && String(e.category).toLowerCase() === String(cat).toLowerCase())
        .reduce((s: number, e: any) => s + Number(e.amount), 0);
      return { cat, planned, actual, variance: planned - actual };
    });
  }, [monthLines, expenses, period]);

  const kpis = [
    { label: 'Planned Income', value: money(plannedIncome), sub: `${money(actualIncome)} actual`, icon: TrendingUp, color: 'text-success' },
    { label: 'Planned Spend', value: money(plannedExpense), sub: `${money(actualExpense)} actual`, icon: TrendingDown, color: 'text-warning' },
    { label: 'Planned Cash Flow', value: money(plannedNet), sub: monthLabel(periodStart), icon: Target, color: plannedNet >= 0 ? 'text-success' : 'text-destructive' },
    { label: 'Actual Cash Flow', value: money(actualNet), sub: actualNet >= plannedNet ? 'On or above plan' : 'Behind plan', icon: Wallet, color: actualNet >= 0 ? 'text-success' : 'text-destructive' },
  ];

  if (isLoading) return <div className="py-12 text-center text-muted-foreground text-sm">Loading budget...</div>;

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Budget</h2>
          <p className="text-sm text-muted-foreground">Plan income and spend, then track it against what actually happened</p>
        </div>
        <div className="flex items-center gap-2">
          <Input type="month" value={period} onChange={e => setPeriod(e.target.value)} className="w-40" />
          <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}><Plus className="w-4 h-4 mr-1" />Add Line</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => (
          <div key={k.label} className="kpi-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{k.label}</p>
                <p className={cn('text-2xl font-bold mt-1', k.color)}>{k.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{k.sub}</p>
              </div>
              <k.icon className={cn('w-4 h-4', k.color)} />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-3">Cash flow — planned vs actual</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={trend}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v: any) => money(Number(v))} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="Planned" fill="hsl(var(--muted-foreground))" radius={[3, 3, 0, 0]} />
            <Bar dataKey="Actual" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold">Budget lines — {monthLabel(periodStart)}</h3>
        </div>
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border bg-muted/50">
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Category</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Description</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Project</th>
            <th className="text-right px-4 py-3 font-medium text-muted-foreground">Planned</th>
            <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
          </tr></thead>
          <tbody>
            {monthLines.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground text-sm">No budget lines for this month yet. Add one to start planning.</td></tr>
            )}
            {monthLines.map((l: any) => (
              <tr key={l.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3">
                  <span className={cn('status-badge', l.kind === 'income' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning')}>{l.kind}</span>
                </td>
                <td className="px-4 py-3 capitalize">{l.category}</td>
                <td className="px-4 py-3 text-muted-foreground">{l.label || '—'}</td>
                <td className="px-4 py-3 text-muted-foreground">{projects.find((p: any) => p.id === l.project_id)?.name || '—'}</td>
                <td className="px-4 py-3 text-right font-medium">{money(Number(l.planned_amount))}</td>
                <td className="px-4 py-3 text-right">
                  <button className="p-1.5 rounded-md hover:bg-muted text-muted-foreground" onClick={() => { setEditing(l); setFormOpen(true); }}><Pencil className="w-3.5 h-3.5" /></button>
                  <button className="p-1.5 rounded-md hover:bg-muted text-destructive" onClick={() => remove.mutate(l.id)}><Trash2 className="w-3.5 h-3.5" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {categoryRows.length > 0 && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-border"><h3 className="text-sm font-semibold">Spend variance by category</h3></div>
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-muted/50">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Category</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Planned</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actual</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Variance</th>
            </tr></thead>
            <tbody>
              {categoryRows.map(r => (
                <tr key={r.cat} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 capitalize">{r.cat}</td>
                  <td className="px-4 py-3 text-right">{money(r.planned)}</td>
                  <td className="px-4 py-3 text-right">{money(r.actual)}</td>
                  <td className={cn('px-4 py-3 text-right font-medium', r.variance >= 0 ? 'text-success' : 'text-destructive')}>
                    {r.variance >= 0 ? 'Under by ' : 'Over by '}{money(Math.abs(r.variance))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <BudgetLineFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        initial={editing}
        defaultPeriod={periodStart}
        projects={projects}
        loading={upsert.isPending}
        onSubmit={(data) => upsert.mutate(data, { onSuccess: () => setFormOpen(false) })}
      />
    </div>
  );
}
