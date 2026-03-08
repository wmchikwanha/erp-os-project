import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CONDITIONS = ['New', 'Good', 'Fair', 'Poor', 'Damaged'];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (data: { id: string; return_condition: string; return_notes?: string }) => void;
  loading?: boolean;
  item?: any;
}

export function ReturnFormDialog({ open, onOpenChange, onSubmit, loading, item }: Props) {
  const [condition, setCondition] = useState('Good');
  const [notes, setNotes] = useState('');

  useEffect(() => { if (open) { setCondition(item?.checkout_condition ?? 'Good'); setNotes(''); } }, [open, item]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (item) onSubmit({ id: item.id, return_condition: condition, return_notes: notes || undefined });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>Return Equipment</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          {item && <p className="text-sm text-muted-foreground">Returning: <strong>{item.asset_name}</strong> from {item.worker_name}</p>}
          <div>
            <Label>Condition on Return *</Label>
            <Select value={condition} onValueChange={setCondition}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CONDITIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Return Notes</Label><Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Any damage or issues..." /></div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Processing...' : 'Confirm Return'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
