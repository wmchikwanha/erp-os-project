import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface SaeAuditEntry {
  id: string;
  entity_type: string;
  entity_id: string | null;
  action: string;
  actor_id: string | null;
  summary: string | null;
  before_data: unknown;
  after_data: unknown;
  created_at: string;
}

export function useSaeAuditLog(filter?: { entity_type?: string; entity_id?: string; limit?: number }) {
  const { session } = useAuth();
  return useQuery<SaeAuditEntry[]>({
    queryKey: ['sae-audit-log', filter],
    enabled: !!session,
    queryFn: async () => {
      let q = supabase
        .from('sae_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(filter?.limit ?? 200);
      if (filter?.entity_type) q = q.eq('entity_type', filter.entity_type);
      if (filter?.entity_id) q = q.eq('entity_id', filter.entity_id);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as SaeAuditEntry[];
    },
  });
}
