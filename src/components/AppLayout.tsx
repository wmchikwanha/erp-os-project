import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Handshake, CalendarCheck, Package,
  FileText, UserCog, BarChart3, Settings, ChevronLeft, Menu, Repeat, Home, FolderKanban,
  Building2, CalendarDays, PackageCheck, Wrench, TrendingDown, CreditCard, Timer, Receipt,
  Activity, Sparkles, ShoppingCart, Shield, Zap, ScrollText, ShieldCheck,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useDemoRole } from '@/hooks/useDemoRole';

import AskAIPanel from '@/components/AskAIPanel';
import NotificationsPanel from '@/components/NotificationsPanel';
import HelpDialog from '@/components/HelpDialog';
import OfflineIndicator from '@/components/OfflineIndicator';
import type { AppRole } from '@/hooks/useRole';

const ALL_NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin'] },
  { to: '/', icon: Home, label: 'Dashboard', roles: ['employee', 'procurement_manager', 'hr_manager', 'project_manager', 'finance_manager'] },
  { to: '/contacts', icon: Users, label: 'Contacts', roles: ['admin'] },
  { to: '/deals', icon: Handshake, label: 'Deals', roles: ['admin'] },
  { to: '/projects', icon: FolderKanban, label: 'Projects', roles: ['admin', 'project_manager'] },
  { to: '/sites', icon: Building2, label: 'Sites', roles: ['admin', 'project_manager', 'procurement_manager'] },
  { to: '/scheduling', icon: CalendarDays, label: 'Scheduling', roles: ['admin', 'project_manager'] },
  { to: '/timesheets', icon: Timer, label: 'Timesheets', roles: ['admin', 'project_manager'] },
  { to: '/equipment', icon: PackageCheck, label: 'Equipment', roles: ['admin', 'procurement_manager'] },
  { to: '/maintenance', icon: Wrench, label: 'Maintenance', roles: ['admin', 'procurement_manager'] },
  { to: '/consumption', icon: TrendingDown, label: 'Consumption', roles: ['admin', 'procurement_manager'] },
  { to: '/activities', icon: CalendarCheck, label: 'Activities', roles: ['admin'] },
  { to: '/procurement', icon: Package, label: 'Procurement', roles: ['admin', 'procurement_manager'] },
  { to: '/invoices', icon: FileText, label: 'Invoices', roles: ['admin', 'finance_manager'] },
  { to: '/payments', icon: CreditCard, label: 'Payments', roles: ['admin', 'finance_manager'] },
  { to: '/expenses', icon: Receipt, label: 'Expenses', roles: ['admin', 'finance_manager'] },
  { to: '/hr', icon: UserCog, label: 'HR', roles: ['admin', 'hr_manager'] },
  { to: '/reports', icon: BarChart3, label: 'Reports', roles: ['admin'] },
  { to: '/sae/liquidity', icon: Activity, label: 'Liquidity Guardian', roles: ['admin', 'finance_manager'] },
  { to: '/sae/procurement', icon: ShoppingCart, label: 'Procurement Scout', roles: ['admin', 'procurement_manager'] },
  { to: '/sae/compliance', icon: Shield, label: 'Compliance Monitor', roles: ['admin', 'finance_manager', 'hr_manager'] },
  { to: '/sae/operations', icon: Zap, label: 'Load-Shedding Planner', roles: ['admin', 'procurement_manager', 'project_manager'] },
  { to: '/sae/control', icon: Sparkles, label: 'SAE Control', roles: ['admin', 'finance_manager'] },
  { to: '/sae/audit', icon: ScrollText, label: 'SAE Audit Log', roles: ['admin', 'procurement_manager', 'hr_manager', 'project_manager', 'finance_manager'] },
  { to: '/settings/approvals', icon: ShieldCheck, label: 'Approval Settings', roles: ['admin'] },
];

function getNavItems(role: string) {
  return ALL_NAV_ITEMS.filter(item => item.roles.includes(role));
}

function getRoleLabel(role: string) {
  const labels: Record<string, string> = {
    employee: 'Employee',
    procurement_manager: 'Procurement Mgr',
    hr_manager: 'HR Manager',
    project_manager: 'Project Mgr',
    finance_manager: 'Finance Mgr',
  };
  return labels[role] || null;
}

export default function AppLayout({ children, role = 'admin' }: { children: React.ReactNode; role?: AppRole | 'admin' | 'employee' }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { setRole } = useDemoRole();

  const navItems = getNavItems(role);
  const roleLabel = getRoleLabel(role);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={cn(
        'fixed lg:static inset-y-0 left-0 z-50 flex flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out',
        collapsed ? 'w-16' : 'w-60',
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        <div className={cn('flex items-center h-16 px-4 border-b border-sidebar-border', collapsed ? 'justify-center' : 'gap-3')}>
          <div className="w-8 h-8 rounded-md bg-sidebar-primary flex items-center justify-center">
            <span className="text-sm font-bold text-sidebar-primary-foreground">S</span>
          </div>
          {!collapsed && (
            <div className="animate-fade-in">
              <h1 className="text-sm font-semibold text-sidebar-accent-foreground">StratedgeOS CRM</h1>
              <p className="text-[10px] text-sidebar-foreground/60">{role === 'admin' ? 'Enterprise Suite' : 'Employee Portal'}</p>
            </div>
          )}
        </div>

        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <NavLink key={item.to + item.label} to={item.to} onClick={() => setMobileOpen(false)}
                className={cn('nav-item', isActive ? 'nav-item-active' : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground', collapsed && 'justify-center px-2')}>
                <item.icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span className="animate-fade-in">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        <div className="hidden lg:flex p-3 border-t border-sidebar-border">
          <button onClick={() => setCollapsed(!collapsed)} className="nav-item w-full text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground justify-center">
            <ChevronLeft className={cn('w-4 h-4 transition-transform', collapsed && 'rotate-180')} />
          </button>
        </div>

        {!collapsed && (
          <div className="p-4 border-t border-sidebar-border animate-fade-in">
            <p className="text-[10px] text-sidebar-foreground/40 text-center">Build · Operate · It's Yours™</p>
          </div>
        )}
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b border-border flex items-center justify-between px-4 lg:px-6 bg-card shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden p-1.5 rounded-md hover:bg-muted text-muted-foreground">
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-sm font-semibold">
              {navItems.find((n) => n.to === location.pathname)?.label || 'StratedgeOS CRM'}
            </h2>
            {roleLabel && <span className="status-badge bg-info/10 text-info text-[10px]">{roleLabel}</span>}
          </div>
          <div className="flex items-center gap-2">
            <OfflineIndicator />
            <HelpDialog />
            <NotificationsPanel />
            <NavLink to="/settings" className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"><Settings className="w-4 h-4" /></NavLink>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-xs font-medium text-primary-foreground">
                {(roleLabel || 'Demo').charAt(0)}
              </span>
            </div>
            <button onClick={() => setRole(null)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground" title="Switch role">
              <Repeat className="w-4 h-4" />
            </button>

          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
        <footer className="shrink-0 border-t border-border bg-card px-4 py-2 text-center">
          <p className="text-[10px] text-muted-foreground/60">
            © 2026 StratedgeAI · <span className="text-muted-foreground/70">Developed by Walter C.</span>
          </p>
        </footer>
      </div>

      {role === 'admin' && <AskAIPanel />}
    </div>
  );
}
