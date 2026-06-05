import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateOutageActionPlan } from '@/hooks/useOutageActionPlans';
import { supabase } from '@/integrations/supabase/client';
import type { LoadShedRec } from '@/hooks/useLoadSheddingPlanner';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  recommendation: LoadShedRec | null;
}

export default function CreateActionPlanDialog({ open, onOpenChange, recommendation }: Props) {
  const create = useCreateOutageActionPlan();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState<string>('none');
  const [dueDate, setDueDate] = useState('');
  const [employees, setEmployees] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (!open || !recommendation) return;
    setTitle(recommendation.title);
    setDescription(recommendation.action);
    setAssignedTo('none');
    setDueDate('');
    supabase.from('employees').select('id, name').order('name').then(({ data }) => {
      setEmployees(data || []);
    });
  }, [open, recommendation]);

  const submit = async () => {
    if (!recommendation || !title.trim()) return;
    await create.mutateAsync({
      recommendation_key: recommendation.recommendation_key,
      title: title.trim(),
      description: description.trim() || null,
      severity: recommendation.severity,
      status: 'pending',
      assigned_to: assignedTo === 'none' ? null : assignedTo,
      due_date: dueDate || null,
      source_collision_id: recommendation.source_collision_id || null,
      rationale_inputs: recommendation.inputs,
      rationale_logic: recommendation.logic,
      rationale_action: recommendation.action,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create outage action plan</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Description</Label>
            <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Assign to</Label>
              <Select value={assignedTo} onValueChange={setAssignedTo}>
                <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Due date</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
          {recommendation && (
            <div className="rounded-md border border-border bg-muted/30 p-2 text-[11px] space-y-1">
              <p><span className="font-semibold">Inputs:</span> {recommendation.inputs}</p>
              <p><span className="font-semibold">Logic:</span> {recommendation.logic}</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={create.isPending || !title.trim()}>Create plan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
