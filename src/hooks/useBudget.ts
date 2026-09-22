import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface BudgetLine {
  id: string;
  user_id: string;
  period: string;
  kind: 'income' | 'expense';
  category: string;
  label: string | null;
  planned_amount: number;
  currency: string;
  project_id: string | null;
  notes: string | null;
}

export const BUDGET_INCOME_CATEGORIES = ['sales', 'services', 'contracts', 'grants', 'other income'];
export const BUDGET_EXPENSE_CATEGORIES = ['payroll', 'materials', 'equipment', 'transport', 'rent', 'utilities', 'fuel & power', 'taxes', 'other'];

export function monthKey(d: Date | string) {
  const date = typeof d === 'string' ? new Date(d) : d;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
}

export function useBudgetLines() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['budget_lines', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budget_lines')
        .select('*')
        .order('period', { ascending: true });
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!user,
  });
}

export function useUpsertBudgetLine() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (line: any) => {
      const payload = {
        period: line.period,
        kind: line.kind || 'expense',
        category: line.category,
        label: line.label || null,
        planned_amount: Number(line.planned_amount) || 0,
        currency: line.currency || 'USD',
        project_id: line.project_id || null,
        notes: line.notes || null,
        user_id: user!.id,
      };
      if (line.id) {
        const { error } = await supabase.from('budget_lines').update(payload).eq('id', line.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('budget_lines').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['budget_lines'] }); toast.success('Budget line saved'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteBudgetLine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('budget_lines').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['budget_lines'] }); toast.success('Budget line removed'); },
    onError: (e: Error) => toast.error(e.message),
  });
}
