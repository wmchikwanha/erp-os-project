import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface LiquidityBucket {
  bucket: string;
  days: number;
  inflows: number;
  outflows: number;
  net: number;
  shortfall: boolean;
}

export interface LiquidityForecast {
  generated_at: string;
  rates: Record<string, { official: number; parallel: number }>;
  forecast: LiquidityBucket[];
  raw: { invoice_count: number; expense_count: number; tax_count: number };
}

export function useLiquidityForecast() {
  const { session } = useAuth();
  return useQuery<LiquidityForecast>({
    queryKey: ['liquidity-forecast'],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('liquidity-forecast', { body: {} });
      if (error) throw error;
      return data;
    },
    staleTime: 60_000,
  });
}
