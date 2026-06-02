import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface SupplierQuote {
  id: string;
  user_id: string;
  supplier_id: string | null;
  supplier_name: string | null;
  item: string;
  unit_price: number;
  currency: string;
  quoted_at: string;
  valid_until: string | null;
  lead_time_days: number;
  notes: string | null;
}

export function useSupplierQuotes() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery<SupplierQuote[]>({
    queryKey: ['supplier-quotes', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('supplier_quotes').select('*').order('quoted_at', { ascending: false });
      if (error) throw error;
      return (data || []) as any;
    },
  });

  const add = useMutation({
    mutationFn: async (q: Partial<SupplierQuote>) => {
      const { error } = await supabase.from('supplier_quotes').insert({ ...q, user_id: user!.id } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['supplier-quotes'] });
      qc.invalidateQueries({ queryKey: ['price-sentinel'] });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('supplier_quotes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['supplier-quotes'] });
      qc.invalidateQueries({ queryKey: ['price-sentinel'] });
    },
  });

  return { quotes: query.data || [], isLoading: query.isLoading, add, remove };
}
