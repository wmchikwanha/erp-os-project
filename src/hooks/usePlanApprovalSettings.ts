import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { toast } from '@/hooks/use-toast';
import type { AppRole } from '@/hooks/useRole';

export interface PlanApprovalSetting {
  department: string;
  label: string;
  allowed_roles: AppRole[];
  allowed_user_ids: string[];
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export function usePlanApprovalSettings() {
  const { session } = useAuth();
  return useQuery<PlanApprovalSetting[]>({
    queryKey: ['plan-approval-settings'],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plan_approval_settings')
        .select('*')
        .order('label');
      if (error) throw error;
      return (data || []) as PlanApprovalSetting[];
    },
  });
}

export function useUpdatePlanApprovalSetting() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({
      department,
      allowed_roles,
      allowed_user_ids,
    }: {
      department: string;
      allowed_roles: AppRole[];
      allowed_user_ids: string[];
    }) => {
      const { data, error } = await supabase
        .from('plan_approval_settings')
        .update({ allowed_roles, allowed_user_ids, updated_by: user?.id ?? null })
        .eq('department', department)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plan-approval-settings'] });
      qc.invalidateQueries({ queryKey: ['can-approve-plan'] });
      qc.invalidateQueries({ queryKey: ['sae-audit-log'] });
      toast({ title: 'Approval settings updated' });
    },
    onError: (e: Error) =>
      toast({ title: 'Could not save settings', description: e.message, variant: 'destructive' }),
  });
}

/**
 * Returns whether the current user is allowed to approve plans for the given department.
 * Uses the can_approve_plan SECURITY DEFINER RPC so the check matches what the DB enforces.
 */
export function useCanApprovePlan(department: string) {
  const { user } = useAuth();
  const { data: role } = useRole();
  return useQuery({
    queryKey: ['can-approve-plan', department, user?.id],
    enabled: !!user && !!department,
    queryFn: async () => {
      if (role === 'admin') return true;
      const { data, error } = await supabase.rpc('can_approve_plan', {
        _department: department,
        _user_id: user!.id,
      });
      if (error) throw error;
      return !!data;
    },
  });
}
