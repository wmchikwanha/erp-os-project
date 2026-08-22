import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  employees: any[];
  projects: any[];
  sites: any[];
  categories: string[];
}

export function ExpenseFormDialog({ open, onOpenChange, onSubmit, loading, employees, projects, sites, categories }: Props) {
  const [form, setForm] = useState({
    employee_id: '', project_id: '', site_id: '', category: 'general',
    amount: '', expense_date: new Date().toISOString().slice(0, 10), description: '',
  });

  useEffect(() => {
    if (open) setForm({ employee_id: '', project_id: '', site_id: '', category: 'general', amount: '', expense_date: new Date().toISOString().slice(0, 10), description: '' });
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Add Expense</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Employee</Label>
            <Select value={form.employee_id} onValueChange={v => setForm({ ...form, employee_id: v })}>
              <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
              <SelectContent>{employees.map((e: any) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Category</Label>
            <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Amount</Label><NumberInput  value={form.amount} onValueChange={(n, raw) => setForm({ ...form, amount: raw })} /></div>
          <div><Label>Date</Label><Input type="date" value={form.expense_date} onChange={e => setForm({ ...form, expense_date: e.target.value })} /></div>
          <div>
            <Label>Project (optional)</Label>
            <Select value={form.project_id} onValueChange={v => setForm({ ...form, project_id: v })}>
              <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>{projects.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Site (optional)</Label>
            <Select value={form.site_id} onValueChange={v => setForm({ ...form, site_id: v })}>
              <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>{sites.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} /></div>
          <Button className="w-full" disabled={loading || !form.amount || !form.employee_id} onClick={() => onSubmit({ ...form, amount: parseFloat(form.amount) })}>
            {loading ? 'Saving...' : 'Submit Expense'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
