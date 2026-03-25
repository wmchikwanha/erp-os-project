import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const DEPARTMENTS = ['Engineering', 'Marketing', 'Sales', 'Finance', 'HR', 'Operations', 'Admin', 'Other'];
const STATUSES = ['open', 'on-hold', 'closed'];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: any;
  loading?: boolean;
  onSubmit: (data: any) => void;
}

export function PositionFormDialog({ open, onOpenChange, initialData, loading, onSubmit }: Props) {
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  const [status, setStatus] = useState('open');

  useEffect(() => {
    if (open) {
      setTitle(initialData?.title ?? '');
      setDepartment(initialData?.department ?? 'Engineering');
      setDescription(initialData?.description ?? '');
      setRequirements(initialData?.requirements ?? '');
      setStatus(initialData?.status ?? 'open');
    }
  }, [open, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({ id: initialData?.id, title: title.trim(), department, description: description || undefined, requirements: requirements || undefined, status });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>{initialData ? 'Edit Position' : 'New Position'}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Job Title *</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Senior Developer" required />
          </div>
          <div className="space-y-2">
            <Label>Department</Label>
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Job Description</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the role..." rows={4} />
          </div>
          <div className="space-y-2">
            <Label>Requirements</Label>
            <Textarea value={requirements} onChange={e => setRequirements(e.target.value)} placeholder="Skills, experience, qualifications..." rows={3} />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
            </Select>
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
