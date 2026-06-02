import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface ProcurementRec {
  basket_id: string;
  basket_name: string;
  item: string;
  qty: number;
  unit: string;
  best_supplier: string | null;
  best_price_usd: number | null;
  best_total_usd: number | null;
  trend_pct: number;
  flags: string[];
  inputs: string;
  logic: string;
  action: string;
  recommendation_key: string;
}

export interface PriceSentinelResponse {
  generated_at: string;
  rates: Record<string, { official: number; parallel: number }>;
  recommendations: ProcurementRec[];
}

export function usePriceSentinel(basketId?: string) {
  const { session } = useAuth();
  return useQuery<PriceSentinelResponse>({
    queryKey: ['price-sentinel', basketId || 'all'],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('price-sentinel', { body: basketId ? { basket_id: basketId } : {} });
      if (error) throw error;
      return data;
    },
    staleTime: 60_000,
  });
}
