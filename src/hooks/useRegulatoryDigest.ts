import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface ComplianceCard {
  recommendation_key: string;
  kind: 'notice' | 'tax';
  id: string;
  title: string;
  authority?: string;
  due_date: string;
  days_until: number;
  affected_modules: string[];
  amount?: number;
  currency?: string;
  inputs: string;
  logic: string;
  action: string;
}

export interface RegulatoryDigest {
  generated_at: string;
  urgent: ComplianceCard[];
  upcoming: ComplianceCard[];
  dismissed_count: number;
}

export function useRegulatoryDigest() {
  const { session } = useAuth();
  return useQuery<RegulatoryDigest>({
    queryKey: ['regulatory-digest'],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('regulatory-digest', { body: {} });
      if (error) throw error;
      return data;
    },
    staleTime: 60_000,
  });
}

export function useAcknowledgeNotice() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (notice_id: string) => {
      const { error } = await supabase.from('notice_acknowledgements').insert({ user_id: user!.id, notice_id });
      if (error && !error.message.includes('duplicate')) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['regulatory-digest'] }),
  });
}
