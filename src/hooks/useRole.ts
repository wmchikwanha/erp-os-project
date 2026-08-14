
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
  // Demo mode: the active role is chosen by the visitor, not looked up from the database.
  const role = (typeof localStorage !== 'undefined'
    ? (localStorage.getItem('stratedge_demo_role') as AppRole | null)
    : null);
  return { data: role, isLoading: false } as { data: AppRole | null; isLoading: boolean };
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
