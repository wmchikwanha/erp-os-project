import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReviewFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  employees: { id: string; name: string }[];
  initialData?: any;
  loading?: boolean;
}

export function ReviewFormDialog({ open, onOpenChange, onSubmit, employees, initialData, loading }: ReviewFormProps) {
  const [form, setForm] = useState({
    employee_id: '',
    review_period: '',
    rating: 3,
    strengths: '',
    areas_for_improvement: '',
    goals: '',
    comments: '',
    review_date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (initialData) {
      setForm({
        employee_id: initialData.employee_id ?? '',
        review_period: initialData.review_period ?? '',
        rating: initialData.rating ?? 3,
        strengths: initialData.strengths ?? '',
        areas_for_improvement: initialData.areas_for_improvement ?? '',
        goals: initialData.goals ?? '',
        comments: initialData.comments ?? '',
        review_date: initialData.review_date ?? new Date().toISOString().split('T')[0],
      });
    } else {
      setForm({
        employee_id: '',
        review_period: '',
        rating: 3,
        strengths: '',
        areas_for_improvement: '',
        goals: '',
        comments: '',
        review_date: new Date().toISOString().split('T')[0],
      });
    }
  }, [initialData, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...form, ...(initialData?.id ? { id: initialData.id } : {}) });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Review' : 'New Performance Review'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Employee *</Label>
              <Select value={form.employee_id} onValueChange={v => setForm(f => ({ ...f, employee_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>
                  {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Review Period *</Label>
              <Input required placeholder="e.g. Q1 2026" value={form.review_period} onChange={e => setForm(f => ({ ...f, review_period: e.target.value }))} />
            </div>
          </div>

          <div>
            <Label>Rating *</Label>
            <div className="flex gap-1 mt-1">
              {[1, 2, 3, 4, 5].map(star => (
                <button key={star} type="button" onClick={() => setForm(f => ({ ...f, rating: star }))}>
                  <Star className={cn('w-6 h-6 transition-colors', star <= form.rating ? 'fill-accent text-accent' : 'text-muted-foreground/30')} />
                </button>
              ))}
            </div>
          </div>

          <div><Label>Strengths</Label><Textarea rows={2} value={form.strengths} onChange={e => setForm(f => ({ ...f, strengths: e.target.value }))} /></div>
          <div><Label>Areas for Improvement</Label><Textarea rows={2} value={form.areas_for_improvement} onChange={e => setForm(f => ({ ...f, areas_for_improvement: e.target.value }))} /></div>
          <div><Label>Goals</Label><Textarea rows={2} value={form.goals} onChange={e => setForm(f => ({ ...f, goals: e.target.value }))} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Review Date</Label><Input type="date" value={form.review_date} onChange={e => setForm(f => ({ ...f, review_date: e.target.value }))} /></div>
            <div><Label>Comments</Label><Input value={form.comments} onChange={e => setForm(f => ({ ...f, comments: e.target.value }))} /></div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading || !form.employee_id || !form.review_period}>{loading ? 'Saving...' : 'Save'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
