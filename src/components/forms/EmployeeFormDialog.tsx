import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, Eye, EyeOff } from 'lucide-react';
import type { AppRole } from '@/hooks/useRole';

const ROLE_OPTIONS: { value: AppRole; label: string }[] = [
  { value: 'employee', label: 'Employee' },
  { value: 'procurement_manager', label: 'Procurement Manager' },
  { value: 'hr_manager', label: 'HR Manager' },
  { value: 'project_manager', label: 'Project Manager' },
  { value: 'finance_manager', label: 'Finance Manager' },
];

function generatePassword(): string {
  const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const symbols = '!@#$%&*';
  let pw = '';
  for (let i = 0; i < 10; i++) pw += chars[Math.floor(Math.random() * chars.length)];
  pw += symbols[Math.floor(Math.random() * symbols.length)];
  pw += Math.floor(Math.random() * 10);
  return pw;
}

interface EmployeeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  loading?: boolean;
  employees?: { id: string; name: string }[];
}

export function EmployeeFormDialog({ open, onOpenChange, onSubmit, initialData, loading, employees = [] }: EmployeeFormProps) {
  const [form, setForm] = useState({
    name: '', role: '', department: '', start_date: '', leave_balance: 20,
    email: '', job_title: '', app_role: 'employee' as AppRole, password: '',
    manager_id: '' as string,
  });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name ?? '', role: initialData.role ?? '',
        department: initialData.department ?? '', start_date: initialData.start_date ?? '',
        leave_balance: initialData.leave_balance ?? 20, email: initialData.email ?? '',
        job_title: initialData.job_title ?? '', app_role: initialData.app_role ?? 'employee',
        password: '', manager_id: initialData.manager_id ?? '',
      });
    } else {
      setForm({ name: '', role: '', department: '', start_date: '', leave_balance: 20, email: '', job_title: '', app_role: 'employee', password: generatePassword(), manager_id: '' });
    }
    setShowPassword(false);
  }, [initialData, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = { ...form, manager_id: form.manager_id || null, ...(initialData?.id ? { id: initialData.id } : {}) };
    onSubmit(submitData);
  };

  const isNew = !initialData?.id;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Employee' : 'New Employee'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div><Label>Name *</Label><Input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Email {isNew ? '*' : ''}</Label>
              <Input type="email" required={isNew} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="employee@company.com" />
            </div>
            <div>
              <Label>Access Role {isNew ? '*' : ''}</Label>
              <Select value={form.app_role} onValueChange={(v) => setForm(f => ({ ...f, app_role: v as AppRole }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {isNew && (
            <div>
              <Label>Initial Password *</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="Min 6 characters"
                    className="pr-10"
                  />
                  <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-10 w-10" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                <Button type="button" variant="outline" size="icon" onClick={() => setForm(f => ({ ...f, password: generatePassword() }))} title="Generate password">
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Job Title</Label><Input value={form.job_title} onChange={e => setForm(f => ({ ...f, job_title: e.target.value }))} placeholder="e.g. HR Manager, Supervisor" /></div>
            <div><Label>Department</Label><Input value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Role</Label><Input value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} /></div>
            <div><Label>Start Date</Label><Input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Leave Balance</Label><Input type="number" min={0} value={form.leave_balance} onChange={e => setForm(f => ({ ...f, leave_balance: Number(e.target.value) }))} /></div>
            <div>
              <Label>Manager</Label>
              <Select value={form.manager_id} onValueChange={(v) => setForm(f => ({ ...f, manager_id: v === '_none' ? '' : v }))}>
                <SelectTrigger><SelectValue placeholder="Select manager" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">No manager</SelectItem>
                  {employees.filter(e => e.id !== initialData?.id).map(e => (
                    <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {isNew && (
            <p className="text-xs text-muted-foreground">Share the login credentials with the employee after creation.</p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
