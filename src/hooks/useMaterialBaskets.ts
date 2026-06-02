import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface BasketItem { name: string; qty: number; unit: string }
export interface MaterialBasket {
  id: string;
  user_id: string;
  name: string;
  items: BasketItem[];
  created_at: string;
  updated_at: string;
}

export function useMaterialBaskets() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery<MaterialBasket[]>({
    queryKey: ['material-baskets', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from('material_baskets').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((b: any) => ({ ...b, items: Array.isArray(b.items) ? b.items : [] }));
    },
  });

  const upsert = useMutation({
    mutationFn: async (basket: Partial<MaterialBasket>) => {
      const payload = { ...basket, user_id: user!.id, items: basket.items || [] } as any;
      const { error } = basket.id
        ? await supabase.from('material_baskets').update(payload).eq('id', basket.id)
        : await supabase.from('material_baskets').insert(payload);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['material-baskets'] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('material_baskets').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['material-baskets'] }),
  });

  return { baskets: query.data || [], isLoading: query.isLoading, upsert, remove };
}
