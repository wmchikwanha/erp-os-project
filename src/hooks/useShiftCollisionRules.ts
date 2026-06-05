import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export interface ShiftCollisionRules {
  id: string;
  user_id: string;
  min_overlap_hours: number;
  severity_threshold_hours: number;
  urgent_collision_count: number;
  auto_shift_minutes: number;
  ignore_zones: string[];
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export const DEFAULT_RULES = {
  min_overlap_hours: 1,
  severity_threshold_hours: 4,
  urgent_collision_count: 3,
  auto_shift_minutes: 60,
  ignore_zones: [] as string[],
  enabled: true,
};

export function useShiftCollisionRules() {
  const { session, user } = useAuth();
  return useQuery<ShiftCollisionRules | null>({
    queryKey: ['shift-collision-rules', user?.id],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shift_collision_rules')
        .select('*')
        .maybeSingle();
      if (error) throw error;
      return data as ShiftCollisionRules | null;
    },
  });
}

export function useUpsertShiftCollisionRules() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<ShiftCollisionRules>) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('shift_collision_rules')
        .upsert({ ...DEFAULT_RULES, ...patch, user_id: user.id }, { onConflict: 'user_id' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shift-collision-rules'] });
      qc.invalidateQueries({ queryKey: ['load-shedding-planner'] });
      toast({ title: 'Collision rules saved' });
    },
    onError: (e: Error) => toast({ title: 'Could not save rules', description: e.message, variant: 'destructive' }),
  });
}
