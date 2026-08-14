import { useDemoRole } from '@/hooks/useDemoRole';
import type { AppRole } from '@/hooks/useRole';
import { Shield, ShoppingCart, Users, FolderKanban, Wallet, User } from 'lucide-react';

const ROLES: { role: AppRole; label: string; desc: string; icon: any }[] = [
  { role: 'admin', label: 'Administrator', desc: 'Full access to every module, reports and settings', icon: Shield },
  { role: 'procurement_manager', label: 'Procurement Manager', desc: 'Purchasing, suppliers, sites, equipment & consumption', icon: ShoppingCart },
  { role: 'hr_manager', label: 'HR Manager', desc: 'Employees, recruitment, leave and compliance', icon: Users },
  { role: 'project_manager', label: 'Project Manager', desc: 'Projects, sites, scheduling and timesheets', icon: FolderKanban },
  { role: 'finance_manager', label: 'Finance Manager', desc: 'Invoices, payments, expenses and liquidity', icon: Wallet },
  { role: 'employee', label: 'Employee', desc: 'Personal portal: timesheets, leave and tasks', icon: User },
];

export default function RoleSelect() {
  const { setRole } = useDemoRole();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center mx-auto mb-4">
            <span className="text-lg font-bold text-primary-foreground">S</span>
          </div>
          <h1 className="text-xl font-semibold">StratedgeOS CRM — Live Demo</h1>
          <p className="text-sm text-muted-foreground mt-1">
            No sign-up required. Pick a role to explore the suite from that perspective.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ROLES.map(({ role, label, desc, icon: Icon }) => (
            <button
              key={role}
              onClick={() => setRole(role)}
              className="text-left bg-card border border-border rounded-lg p-4 hover:border-primary hover:shadow-md transition-all"
            >
              <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center mb-3">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <h2 className="text-sm font-semibold">{label}</h2>
              <p className="text-xs text-muted-foreground mt-1">{desc}</p>
            </button>
          ))}
        </div>

        <p className="text-[10px] text-muted-foreground/60 text-center mt-8">
          Demo data only · © 2026 StratedgeAI · Developed by Walter C.
        </p>
      </div>
    </div>
  );
}
