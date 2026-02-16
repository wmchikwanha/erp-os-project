import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { AppRole } from '@/hooks/useRole';

const ROLE_OPTIONS: { value: AppRole; label: string }[] = [
  { value: 'employee', label: 'Employee' },
  { value: 'procurement_manager', label: 'Procurement Manager' },
  { value: 'hr_manager', label: 'HR Manager' },
  { value: 'project_manager', label: 'Project Manager' },
  { value: 'finance_manager', label: 'Finance Manager' },
];

interface InviteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (email: string, role: AppRole) => void;
  loading?: boolean;
}

export function InviteEmployeeDialog({ open, onOpenChange, onSubmit, loading }: InviteProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<AppRole>('employee');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(email, role);
    setEmail('');
    setRole('employee');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Invite Employee</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label>Email Address *</Label>
            <Input type="email" required placeholder="employee@company.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
            <Label>Role *</Label>
            <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">The employee will get access based on their assigned role.</p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading || !email}>{loading ? 'Sending...' : 'Send Invite'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
