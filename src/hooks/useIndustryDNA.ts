import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type IndustryDNA = 'general' | 'manufacturing' | 'construction' | 'retail';

export function useIndustryDNA() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const query = useQuery<IndustryDNA>({
    queryKey: ['industry-dna', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('industry_dna')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return ((data?.industry_dna as IndustryDNA) || 'general');
    },
  });

  const setDNA = useMutation({
    mutationFn: async (dna: IndustryDNA) => {
      const { error } = await supabase
        .from('profiles')
        .update({ industry_dna: dna })
        .eq('user_id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['industry-dna'] }),
  });

  return { dna: query.data || 'general', isLoading: query.isLoading, setDNA: setDNA.mutate, saving: setDNA.isPending };
}

export const DNA_LABELS: Record<IndustryDNA, string> = {
  general: 'General Business',
  manufacturing: 'Manufacturing (The Floor Manager)',
  construction: 'Construction (The Quantity Surveyor)',
  retail: 'Retail (The Shop Whisperer)',
};
