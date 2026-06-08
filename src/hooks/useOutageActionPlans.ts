import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export type PlanStatus = 'pending' | 'in_progress' | 'done' | 'skipped';
export type ApprovalStatus = 'pending_approval' | 'approved' | 'rejected';

export interface OutageActionPlan {
  id: string;
  user_id: string;
  recommendation_key: string;
  title: string;
  description: string | null;
  severity: string;
  status: PlanStatus;
  approval_status: ApprovalStatus;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  assigned_to: string | null;
  due_date: string | null;
  completion_notes: string | null;
  source_collision_id: string | null;
  rationale_inputs: string | null;
  rationale_logic: string | null;
  rationale_action: string | null;
  created_at: string;
  updated_at: string;
}

export function useApproveOutageActionPlan() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, decision, reason }: { id: string; decision: 'approved' | 'rejected'; reason?: string }) => {
      if (!user) throw new Error('Not authenticated');
      const patch: Record<string, unknown> = {
        approval_status: decision,
        approved_by: user.id,
        approved_at: new Date().toISOString(),
      };
      if (decision === 'rejected') patch.rejection_reason = reason ?? null;
      const { data, error } = await supabase
        .from('outage_action_plans')
        .update(patch)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['outage-action-plans'] });
      qc.invalidateQueries({ queryKey: ['sae-audit-log'] });
      toast({ title: vars.decision === 'approved' ? 'Plan approved' : 'Plan rejected' });
    },
    onError: (e: Error) => toast({ title: 'Could not update approval', description: e.message, variant: 'destructive' }),
  });
}

export function useOutageActionPlans() {
  const { session } = useAuth();
  return useQuery<OutageActionPlan[]>({
    queryKey: ['outage-action-plans'],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('outage_action_plans')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as OutageActionPlan[];
    },
  });
}

export function useCreateOutageActionPlan() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<OutageActionPlan> & { title: string; recommendation_key: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('outage_action_plans')
        .insert({ ...input, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['outage-action-plans'] });
      toast({ title: 'Action plan created' });
    },
    onError: (e: Error) => toast({ title: 'Could not create plan', description: e.message, variant: 'destructive' }),
  });
}

export function useUpdateOutageActionPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<OutageActionPlan> & { id: string }) => {
      const { data, error } = await supabase
        .from('outage_action_plans')
        .update(patch)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['outage-action-plans'] }),
    onError: (e: Error) => toast({ title: 'Could not update plan', description: e.message, variant: 'destructive' }),
  });
}

export function useDeleteOutageActionPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('outage_action_plans').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['outage-action-plans'] });
      toast({ title: 'Plan removed' });
    },
  });
}
