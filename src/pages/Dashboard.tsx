import { TrendingUp, DollarSign, Handshake, FileWarning, Clock, FolderKanban } from 'lucide-react';
import { useDeals, useActivities, useInvoices, useLeaveRequests, useProjects } from '@/hooks/useCrmData';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const { data: deals = [], isLoading: ld } = useDeals();
  const { data: activities = [], isLoading: la } = useActivities();
  const { data: invoices = [], isLoading: li } = useInvoices();
  const { data: leaveRequests = [], isLoading: ll } = useLeaveRequests();
  const { data: projects = [], isLoading: lpr } = useProjects();

  const loading = ld || la || li || ll || lpr;
  if (loading) return <div className="py-12 text-center text-muted-foreground text-sm">Loading dashboard...</div>;

  const revenue = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.total_amount), 0);
  const openDeals = deals.filter(d => d.stage !== 'closed-lost' && d.stage !== 'closed-won');
  const overdueInvoices = invoices.filter(i => i.status === 'overdue');
  const activeProjects = projects.filter((p: any) => p.status === 'active');

  const kpis = [
    { label: 'Total Revenue', value: `$${revenue.toLocaleString()}`, icon: DollarSign, color: 'text-success' },
    { label: 'Open Deals', value: String(openDeals.length), subtext: `$${openDeals.reduce((s, d) => s + Number(d.value), 0).toLocaleString()} pipeline`, icon: Handshake, color: 'text-info' },
    { label: 'Active Projects', value: String(activeProjects.length), subtext: `${projects.length} total`, icon: FolderKanban, color: 'text-primary' },
    { label: 'Overdue Invoices', value: String(overdueInvoices.length), subtext: `$${overdueInvoices.reduce((s, i) => s + Number(i.total_amount), 0).toLocaleString()} outstanding`, icon: FileWarning, color: 'text-destructive' },
  ];

  const recentActivities = activities.slice(0, 5);
  const topDeals = openDeals.sort((a, b) => Number(b.value) - Number(a.value)).slice(0, 4);

  return (
    <div className="space-y-6 animate-slide-in">
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
                  <p className="text-xs text-muted-foreground mt-0.5">{activity.contact_name} · {activity.created_by}</p>
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
                    <p className="text-xs text-muted-foreground">{deal.contact_name}</p>
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
