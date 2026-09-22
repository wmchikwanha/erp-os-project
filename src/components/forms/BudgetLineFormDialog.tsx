import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NumberInput } from '@/components/ui/number-input';
import { BUDGET_EXPENSE_CATEGORIES, BUDGET_INCOME_CATEGORIES } from '@/hooks/useBudget';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (data: any) => void;
  loading?: boolean;
  defaultPeriod: string;
  projects: any[];
  initial?: any;
}

export function BudgetLineFormDialog({ open, onOpenChange, onSubmit, loading, defaultPeriod, projects, initial }: Props) {
  const blank = { kind: 'expense', category: 'payroll', label: '', planned_amount: '', currency: 'USD', project_id: '', notes: '' };
  const [form, setForm] = useState<any>(blank);

  useEffect(() => {
    if (open) {
      setForm(initial
        ? { ...initial, planned_amount: String(initial.planned_amount ?? ''), project_id: initial.project_id || '', label: initial.label || '', notes: initial.notes || '' }
        : blank);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial]);

  const categories = form.kind === 'income' ? BUDGET_INCOME_CATEGORIES : BUDGET_EXPENSE_CATEGORIES;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{initial ? 'Edit budget line' : 'New budget line'}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Type</Label>
            <Select value={form.kind} onValueChange={v => setForm({ ...form, kind: v, category: v === 'income' ? BUDGET_INCOME_CATEGORIES[0] : BUDGET_EXPENSE_CATEGORIES[0] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Category</Label>
            <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Description</Label><Input value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} placeholder="e.g. Site crew wages" /></div>
          <div><Label>Planned amount</Label><NumberInput value={form.planned_amount} onValueChange={(_n, raw) => setForm({ ...form, planned_amount: raw })} /></div>
          <div>
            <Label>Project (optional)</Label>
            <Select value={form.project_id || 'none'} onValueChange={v => setForm({ ...form, project_id: v === 'none' ? '' : v })}>
              <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {projects.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
          <Button className="w-full" disabled={loading || !form.planned_amount}
            onClick={() => onSubmit({ ...form, period: initial?.period || defaultPeriod })}>
            {loading ? 'Saving...' : 'Save budget line'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
