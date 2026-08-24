import { TrendingUp, DollarSign, Handshake, FileWarning, Clock, FolderKanban, Users, PackageCheck, Wrench, Package, AlertTriangle, CalendarDays, Plus, Receipt, CreditCard, Briefcase, UserPlus, BarChart3, ArrowRight } from 'lucide-react';
import { useDeals, useActivities, useInvoices, useLeaveRequests, useProjects, useEquipmentCheckouts, useMaintenanceLogs, useWorkSchedules, useProducts, useEmployees, useAssets, usePayments, useTimesheets, useExpenses, useJobPositions, useCandidates } from '@/hooks/useCrmData';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import SAESnapshot from '@/components/sae/SAESnapshot';

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: deals = [], isLoading: ld } = useDeals();
  const { data: activities = [], isLoading: la } = useActivities();
  const { data: invoices = [], isLoading: li } = useInvoices();
  const { data: leaveRequests = [], isLoading: ll } = useLeaveRequests();
  const { data: projects = [], isLoading: lpr } = useProjects();
  const { data: checkouts = [], isLoading: lco } = useEquipmentCheckouts();
  const { data: maintenance = [], isLoading: lm } = useMaintenanceLogs();
  const { data: schedules = [] } = useWorkSchedules(new Date().toISOString().slice(0, 10));
  const { data: products = [] } = useProducts();
  const { data: employees = [] } = useEmployees();
  const { data: assets = [] } = useAssets();
  const { data: payments = [] } = usePayments();
  const { data: timesheets = [] } = useTimesheets();
  const { data: expenses = [] } = useExpenses();
  const { data: positions = [] } = useJobPositions();
  const { data: candidates = [] } = useCandidates();

  const loading = ld || la || li || ll || lpr || lco || lm;
  if (loading) return <div className="py-12 text-center text-muted-foreground text-sm">Loading dashboard...</div>;

  const today = new Date().toISOString().slice(0, 10);
  const revenue = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.total_amount), 0);
  const totalExpenses = expenses.filter((e: any) => e.status === 'approved').reduce((s: number, e: any) => s + Number(e.amount), 0);
  const netMargin = revenue - totalExpenses;
  const openDeals = deals.filter(d => d.stage !== 'closed-lost' && d.stage !== 'closed-won');
  const overdueInvoices = invoices.filter(i => i.status === 'overdue');
  const activeProjects = projects.filter((p: any) => p.status === 'active');
  const pendingLeave = leaveRequests.filter((l: any) => l.status === 'pending').length;
  const checkedOutCount = checkouts.filter((c: any) => c.status === 'checked-out').length;
  const overdueMaintenance = maintenance.filter((m: any) => m.status === 'scheduled' && m.next_due_date && m.next_due_date < today).length;
  const lowStockItems = products.filter((p: any) => p.stock_quantity <= p.reorder_level);
  const workersToday = schedules.length;
  const overdueEquipment = checkouts.filter((c: any) => c.status === 'checked-out' && c.expected_return_date && c.expected_return_date < today);

  const kpis = [
    { label: 'Total Revenue', value: `$${revenue.toLocaleString()}`, icon: DollarSign, color: 'text-success', path: '/invoices' },
    { label: 'Net Margin', value: `$${netMargin.toLocaleString()}`, subtext: netMargin >= 0 ? 'Profitable' : 'Loss', icon: TrendingUp, color: netMargin >= 0 ? 'text-success' : 'text-destructive', path: '/reports' },
    { label: 'Open Deals', value: String(openDeals.length), subtext: `$${openDeals.reduce((s, d) => s + Number(d.value), 0).toLocaleString()} pipeline`, icon: Handshake, color: 'text-info', path: '/deals' },
    { label: 'Active Projects', value: String(activeProjects.length), subtext: `${projects.length} total`, icon: FolderKanban, color: 'text-primary', path: '/projects' },
    { label: 'Overdue Invoices', value: String(overdueInvoices.length), subtext: `$${overdueInvoices.reduce((s, i) => s + Number(i.total_amount), 0).toLocaleString()} outstanding`, icon: FileWarning, color: 'text-destructive', path: '/invoices' },
  ];

  const opsKpis = [
    { label: 'Workers On Site', value: String(workersToday), icon: CalendarDays, color: 'text-primary', path: '/scheduling' },
    { label: 'Equipment Out', value: String(checkedOutCount), subtext: `${assets.length} total assets`, icon: PackageCheck, color: 'text-info', path: '/equipment' },
    { label: 'Pending Leave', value: String(pendingLeave), icon: Clock, color: 'text-warning', path: '/hr' },
    { label: 'Low Stock Items', value: String(lowStockItems.length), icon: Package, color: lowStockItems.length > 0 ? 'text-destructive' : 'text-success', path: '/procurement' },
    { label: 'Overdue Maintenance', value: String(overdueMaintenance), icon: Wrench, color: overdueMaintenance > 0 ? 'text-destructive' : 'text-success', path: '/maintenance' },
    { label: 'Employees', value: String(employees.length), icon: Users, color: 'text-primary', path: '/hr' },
  ];


  // Quick actions
  const quickActions = [
    { label: 'New Invoice', icon: Receipt, path: '/invoices' },
    { label: 'Log Expense', icon: CreditCard, path: '/expenses' },
    { label: 'Record Payment', icon: DollarSign, path: '/payments' },
    { label: 'Create Deal', icon: Briefcase, path: '/deals' },
    { label: 'Add Employee', icon: UserPlus, path: '/hr' },
    { label: 'View Reports', icon: BarChart3, path: '/reports' },
  ];

  // Revenue trend: monthly from paid invoices
  const monthlyRevenue: Record<string, number> = {};
  invoices.filter(i => i.status === 'paid').forEach(i => {
    const month = i.issue_date?.slice(0, 7) || i.created_at?.slice(0, 7);
    if (month) monthlyRevenue[month] = (monthlyRevenue[month] || 0) + Number(i.total_amount);
  });
  const revenueTrend = Object.entries(monthlyRevenue).sort(([a], [b]) => a.localeCompare(b)).slice(-6).map(([month, total]) => ({ month, total }));

  // Project budget vs actual
  const projectBudgetData = activeProjects.slice(0, 6).map((p: any) => ({
    name: p.name?.length > 15 ? p.name.slice(0, 15) + '…' : p.name,
    budget: Number(p.budget || 0),
    actual: Number(p.actual_cost || 0),
  }));

  // AR Aging buckets
  const now = new Date();
  const agingBuckets = { current: 0, days30: 0, days60: 0, days90: 0 };
  invoices.filter(i => i.status !== 'paid' && i.status !== 'draft').forEach(inv => {
    const due = new Date(inv.due_date);
    const daysOverdue = Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
    const amt = Number(inv.total_amount);
    if (daysOverdue <= 0) agingBuckets.current += amt;
    else if (daysOverdue <= 30) agingBuckets.days30 += amt;
    else if (daysOverdue <= 60) agingBuckets.days60 += amt;
    else agingBuckets.days90 += amt;
  });

  // Cash flow forecast (next 90 days)
  const d30 = new Date(now); d30.setDate(d30.getDate() + 30);
  const d60 = new Date(now); d60.setDate(d60.getDate() + 60);
  const d90 = new Date(now); d90.setDate(d90.getDate() + 90);
  const cashFlow = [
    { period: '0-30d', inflow: 0, outflow: 0 },
    { period: '31-60d', inflow: 0, outflow: 0 },
    { period: '61-90d', inflow: 0, outflow: 0 },
  ];
  invoices.filter(i => i.status !== 'paid' && i.status !== 'draft').forEach(inv => {
    const due = new Date(inv.due_date);
    const amt = Number(inv.total_amount);
    if (due >= now && due <= d30) cashFlow[0].inflow += amt;
    else if (due > d30 && due <= d60) cashFlow[1].inflow += amt;
    else if (due > d60 && due <= d90) cashFlow[2].inflow += amt;
  });
  // Approximate outflows from pending expenses
  expenses.filter((e: any) => e.status === 'pending').forEach((e: any) => {
    cashFlow[0].outflow += Number(e.amount);
  });

  // Recruitment snapshot
  const openPositions = positions.filter((p: any) => p.status === 'open').length;
  const newCandidates = candidates.filter((c: any) => c.status === 'new').length;
  const shortlisted = candidates.filter((c: any) => c.status === 'shortlisted').length;

  // Workforce utilization
  const scheduledHours = schedules.reduce((s: number, sch: any) => {
    if (sch.shift_start && sch.shift_end) {
      const start = sch.shift_start.split(':').map(Number);
      const end = sch.shift_end.split(':').map(Number);
      return s + (end[0] + end[1] / 60) - (start[0] + start[1] / 60);
    }
    return s + 8; // default 8hr shift
  }, 0);
  const loggedHours = timesheets.filter((t: any) => t.work_date === today).reduce((s: number, t: any) => s + Number(t.hours_worked), 0);

  const recentActivities = activities.slice(0, 5);
  const topDeals = openDeals.sort((a, b) => Number(b.value) - Number(a.value)).slice(0, 4);

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        {quickActions.map(action => (
          <Button key={action.label} variant="outline" size="sm" className="gap-1.5" onClick={() => navigate(action.path)}>
            <action.icon className="w-3.5 h-3.5" />
            {action.label}
          </Button>
        ))}
      </div>

      {/* SAE — Situational Awareness snapshot */}
      <SAESnapshot />

      {/* Primary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map((kpi) => (
          <button key={kpi.label} type="button" onClick={() => navigate(kpi.path)} className="kpi-card text-left group hover:border-primary/40 hover:shadow-elevated transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{kpi.label}</span>
              <kpi.icon className={cn('w-4 h-4', kpi.color)} />
            </div>
            <div className="text-2xl font-bold">{kpi.value}</div>
            {kpi.subtext && <p className="text-xs text-muted-foreground mt-1">{kpi.subtext}</p>}
            <span className="mt-2 inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
              Open <ArrowRight className="w-3 h-3" />
            </span>
          </button>
        ))}
      </div>

      {/* Operations KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {opsKpis.map((kpi) => (
          <button key={kpi.label} type="button" onClick={() => navigate(kpi.path)} className="bg-card border border-border rounded-lg p-3 text-left hover:border-primary/40 hover:shadow-subtle transition-all">
            <div className="flex items-center gap-2 mb-1">
              <kpi.icon className={cn('w-3.5 h-3.5', kpi.color)} />
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground truncate">{kpi.label}</span>
            </div>
            <p className="text-lg font-bold">{kpi.value}</p>
            {kpi.subtext && <p className="text-[10px] text-muted-foreground">{kpi.subtext}</p>}
          </button>
        ))}
      </div>


      {/* AR Aging + Recruitment + Workforce Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* AR Aging */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">Receivables Aging</h3>
          <div className="space-y-2">
            {[
              { label: 'Current', value: agingBuckets.current, color: 'bg-success' },
              { label: '1-30 days', value: agingBuckets.days30, color: 'bg-warning' },
              { label: '31-60 days', value: agingBuckets.days60, color: 'bg-orange-500' },
              { label: '90+ days', value: agingBuckets.days90, color: 'bg-destructive' },
            ].map(b => (
              <div key={b.label} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className={cn('w-2.5 h-2.5 rounded-full', b.color)} />
                  <span className="text-muted-foreground">{b.label}</span>
                </div>
                <span className="font-medium">${b.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recruitment Snapshot */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">Recruitment Pipeline</h3>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">{openPositions}</p>
              <p className="text-[10px] uppercase text-muted-foreground mt-1">Open Roles</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-info">{newCandidates}</p>
              <p className="text-[10px] uppercase text-muted-foreground mt-1">New CVs</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-success">{shortlisted}</p>
              <p className="text-[10px] uppercase text-muted-foreground mt-1">Shortlisted</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-3">{candidates.length} total candidates</p>
        </div>

        {/* Workforce Utilization */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">Today's Workforce</h3>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div>
              <p className="text-2xl font-bold">{scheduledHours.toFixed(1)}h</p>
              <p className="text-[10px] uppercase text-muted-foreground mt-1">Scheduled</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{loggedHours.toFixed(1)}h</p>
              <p className="text-[10px] uppercase text-muted-foreground mt-1">Logged</p>
            </div>
          </div>
          {scheduledHours > 0 && (
            <div className="mt-3">
              <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                <span>Utilization</span>
                <span>{Math.min(100, Math.round((loggedHours / scheduledHours) * 100))}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, (loggedHours / scheduledHours) * 100)}%` }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cash Flow Forecast */}
      <div className="bg-card border border-border rounded-lg p-5">
        <h3 className="text-sm font-semibold mb-4">Cash Flow Forecast (Next 90 Days)</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={cashFlow}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="period" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
            <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
            <Bar dataKey="inflow" fill="hsl(152, 60%, 38%)" radius={[4, 4, 0, 0]} name="Inflows" />
            <Bar dataKey="outflow" fill="hsl(0, 72%, 51%)" radius={[4, 4, 0, 0]} name="Outflows" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-semibold mb-4">Revenue Trend (Monthly)</h3>
          {revenueTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-muted-foreground py-8 text-center">No revenue data yet</p>}
        </div>

        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-semibold mb-4">Project Budget vs Actual</h3>
          {projectBudgetData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={projectBudgetData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis type="number" tick={{ fontSize: 11 }} className="fill-muted-foreground" tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
                <Bar dataKey="budget" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Budget" />
                <Bar dataKey="actual" fill="hsl(var(--destructive))" radius={[0, 4, 4, 0]} name="Actual" />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-muted-foreground py-8 text-center">No active projects</p>}
        </div>
      </div>

      {/* Activity + Deals Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-lg">
          <div className="px-5 py-4 border-b border-border"><h3 className="text-sm font-semibold">Recent Activities</h3></div>
          <div className="divide-y divide-border">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="px-5 py-3 flex items-start gap-3">
                <div className={cn('w-2 h-2 rounded-full mt-1.5 shrink-0', activity.completed_at ? 'bg-success' : 'bg-warning')} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="status-badge bg-muted text-muted-foreground capitalize">{activity.type}</span>
                    <span className="text-xs text-muted-foreground">{activity.due_date}</span>
                  </div>
                  <p className="text-sm mt-1 truncate">{activity.notes}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{(activity as any).contact_name} · {activity.created_by}</p>
                </div>
              </div>
            ))}
            {recentActivities.length === 0 && <div className="py-8 text-center text-muted-foreground text-sm">No activities yet</div>}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg">
          <div className="px-5 py-4 border-b border-border"><h3 className="text-sm font-semibold">Top Active Deals</h3></div>
          <div className="divide-y divide-border">
            {topDeals.map((deal) => (
              <div key={deal.id} className="px-5 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{deal.title}</p>
                    <p className="text-xs text-muted-foreground">{(deal as any).contact_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">${Number(deal.value).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{deal.probability}% · {deal.expected_close}</p>
                  </div>
                </div>
                <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${deal.probability}%` }} />
                </div>
              </div>
            ))}
            {topDeals.length === 0 && <div className="py-8 text-center text-muted-foreground text-sm">No deals yet</div>}
          </div>
        </div>
      </div>

      {/* Alerts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {lowStockItems.length > 0 && (
          <div className="bg-warning/5 border border-warning/20 rounded-lg">
            <div className="px-5 py-3 border-b border-warning/20 flex items-center gap-2">
              <Package className="w-4 h-4 text-warning" />
              <h3 className="text-sm font-semibold">Low Stock Alerts</h3>
            </div>
            <div className="divide-y divide-warning/10">
              {lowStockItems.slice(0, 5).map((p: any) => (
                <div key={p.id} className="px-5 py-2.5 flex items-center justify-between">
                  <span className="text-sm">{p.name}</span>
                  <span className="text-sm font-semibold text-destructive">{p.stock_quantity} left (reorder: {p.reorder_level})</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {overdueEquipment.length > 0 && (
          <div className="bg-destructive/5 border border-destructive/20 rounded-lg">
            <div className="px-5 py-3 border-b border-destructive/20 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <h3 className="text-sm font-semibold">Overdue Equipment Returns</h3>
            </div>
            <div className="divide-y divide-destructive/10">
              {overdueEquipment.slice(0, 5).map((c: any) => (
                <div key={c.id} className="px-5 py-2.5 flex items-center justify-between">
                  <span className="text-sm">Asset #{c.asset_id?.slice(0, 8)}</span>
                  <span className="text-xs text-destructive">Due: {c.expected_return_date}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {overdueInvoices.length > 0 && (
        <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 flex items-center gap-3">
          <FileWarning className="w-5 h-5 text-destructive shrink-0" />
          <div>
            <p className="text-sm font-medium">Overdue invoices require attention</p>
            <p className="text-xs text-muted-foreground">{overdueInvoices.length} invoice(s) past due date totalling ${overdueInvoices.reduce((s, i) => s + Number(i.total_amount), 0).toLocaleString()}</p>
          </div>
        </div>
      )}
    </div>
  );
}
