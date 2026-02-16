import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type AppRole = 'admin' | 'employee' | 'procurement_manager' | 'hr_manager' | 'project_manager' | 'finance_manager';

const ROLE_ROUTES: Record<string, string[]> = {
  admin: ['/', '/contacts', '/deals', '/projects', '/activities', '/procurement', '/invoices', '/hr', '/reports'],
  procurement_manager: ['/', '/procurement'],
  hr_manager: ['/', '/hr'],
  project_manager: ['/', '/projects'],
  finance_manager: ['/', '/invoices'],
  employee: ['/'],
};

export function useRole() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['user_role', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user!.id)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data?.role as AppRole) ?? null;
    },
    enabled: !!user,
  });
}

export function useIsAdmin() {
  const { data: role, isLoading } = useRole();
  return { isAdmin: role === 'admin', isLoading };
}

export function useAllowedRoutes() {
  const { data: role } = useRole();
  if (!role) return [];
  return ROLE_ROUTES[role] ?? ['/'];
}

export function isDepartmentManager(role: AppRole | null | undefined): boolean {
  return role === 'procurement_manager' || role === 'hr_manager' || role === 'project_manager' || role === 'finance_manager';
}
