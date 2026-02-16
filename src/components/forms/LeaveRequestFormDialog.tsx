import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const LEAVE_TYPES = ['Annual Leave', 'Sick Leave', 'Personal Leave', 'Maternity/Paternity', 'Unpaid Leave', 'Other'];

interface LeaveRequestFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { type: string; start_date: string; end_date: string; reason?: string }) => void;
  loading?: boolean;
}

export function LeaveRequestFormDialog({ open, onOpenChange, onSubmit, loading }: LeaveRequestFormProps) {
  const [type, setType] = useState('Annual Leave');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ type, start_date: startDate, end_date: endDate, reason: reason || undefined });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setType('Annual Leave'); setStartDate(''); setEndDate(''); setReason(''); } onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request Leave</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label>Leave Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {LEAVE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Start Date *</Label><Input required type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
            <div><Label>End Date *</Label><Input required type="date" value={endDate} onChange={e => setEndDate(e.target.value)} /></div>
          </div>
          <div><Label>Reason</Label><Textarea rows={2} value={reason} onChange={e => setReason(e.target.value)} placeholder="Optional reason..." /></div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading || !startDate || !endDate}>{loading ? 'Submitting...' : 'Submit Request'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
