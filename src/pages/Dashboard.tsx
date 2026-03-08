import { TrendingUp, DollarSign, Handshake, FileWarning, Clock, FolderKanban, Users, PackageCheck, Wrench, Package, AlertTriangle, CalendarDays } from 'lucide-react';
import { useDeals, useActivities, useInvoices, useLeaveRequests, useProjects, useEquipmentCheckouts, useMaintenanceLogs, useWorkSchedules, useProducts, useEmployees, useAssets } from '@/hooks/useCrmData';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function Dashboard() {
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

  const loading = ld || la || li || ll || lpr || lco || lm;
  if (loading) return <div className="py-12 text-center text-muted-foreground text-sm">Loading dashboard...</div>;

  const today = new Date().toISOString().slice(0, 10);
  const revenue = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.total_amount), 0);
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
    { label: 'Total Revenue', value: `$${revenue.toLocaleString()}`, icon: DollarSign, color: 'text-success' },
    { label: 'Open Deals', value: String(openDeals.length), subtext: `$${openDeals.reduce((s, d) => s + Number(d.value), 0).toLocaleString()} pipeline`, icon: Handshake, color: 'text-info' },
    { label: 'Active Projects', value: String(activeProjects.length), subtext: `${projects.length} total`, icon: FolderKanban, color: 'text-primary' },
    { label: 'Overdue Invoices', value: String(overdueInvoices.length), subtext: `$${overdueInvoices.reduce((s, i) => s + Number(i.total_amount), 0).toLocaleString()} outstanding`, icon: FileWarning, color: 'text-destructive' },
  ];

  const opsKpis = [
    { label: 'Workers On Site', value: String(workersToday), icon: CalendarDays, color: 'text-primary' },
    { label: 'Equipment Out', value: String(checkedOutCount), subtext: `${assets.length} total assets`, icon: PackageCheck, color: 'text-info' },
    { label: 'Pending Leave', value: String(pendingLeave), icon: Clock, color: 'text-warning' },
    { label: 'Low Stock Items', value: String(lowStockItems.length), icon: Package, color: lowStockItems.length > 0 ? 'text-destructive' : 'text-success' },
    { label: 'Overdue Maintenance', value: String(overdueMaintenance), icon: Wrench, color: overdueMaintenance > 0 ? 'text-destructive' : 'text-success' },
    { label: 'Employees', value: String(employees.length), icon: Users, color: 'text-primary' },
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

  const recentActivities = activities.slice(0, 5);
  const topDeals = openDeals.sort((a, b) => Number(b.value) - Number(a.value)).slice(0, 4);

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Primary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="kpi-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{kpi.label}</span>
              <kpi.icon className={cn('w-4 h-4', kpi.color)} />
            </div>
            <div className="text-2xl font-bold">{kpi.value}</div>
            {kpi.subtext && <p className="text-xs text-muted-foreground mt-1">{kpi.subtext}</p>}
          </div>
        ))}
      </div>

      {/* Operations KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {opsKpis.map((kpi) => (
          <div key={kpi.label} className="bg-card border border-border rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <kpi.icon className={cn('w-3.5 h-3.5', kpi.color)} />
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground truncate">{kpi.label}</span>
            </div>
            <p className="text-lg font-bold">{kpi.value}</p>
            {kpi.subtext && <p className="text-[10px] text-muted-foreground">{kpi.subtext}</p>}
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
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

        {/* Project Budget vs Actual */}
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
        {/* Low Stock Alerts */}
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

        {/* Overdue Equipment */}
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
