import { useDeals, useProducts, useEmployees, useProjects, usePurchaseOrders, useAssets } from '@/hooks/useCrmData';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['hsl(210, 70%, 50%)', 'hsl(38, 92%, 50%)', 'hsl(152, 60%, 38%)', 'hsl(0, 72%, 51%)'];

export default function Reports() {
  const { data: deals = [], isLoading: ld } = useDeals();
  const { data: products = [], isLoading: lp } = useProducts();
  const { data: employees = [], isLoading: le } = useEmployees();
  const { data: projects = [], isLoading: lpr } = useProjects();
  const { data: purchaseOrders = [], isLoading: lpo } = usePurchaseOrders();
  const { data: assets = [], isLoading: la } = useAssets();

  if (ld || lp || le || lpr || lpo || la) return <div className="py-12 text-center text-muted-foreground text-sm">Loading reports...</div>;

  const pipelineData = [
    { name: 'Prospecting', value: deals.filter(d => d.stage === 'prospecting').reduce((s, d) => s + Number(d.value), 0) },
    { name: 'Negotiation', value: deals.filter(d => d.stage === 'negotiation').reduce((s, d) => s + Number(d.value), 0) },
    { name: 'Closed Won', value: deals.filter(d => d.stage === 'closed-won').reduce((s, d) => s + Number(d.value), 0) },
    { name: 'Closed Lost', value: deals.filter(d => d.stage === 'closed-lost').reduce((s, d) => s + Number(d.value), 0) },
  ];

  const closedWon = deals.filter(d => d.stage === 'closed-won').length;
  const closedLost = deals.filter(d => d.stage === 'closed-lost').length;
  const winRate = closedWon + closedLost > 0 ? Math.round(closedWon / (closedWon + closedLost) * 100) : 0;

  const departments = [...new Set(employees.map(e => e.department).filter(Boolean))];

  const totalAssetValue = assets.reduce((s: number, a: any) => s + Number(a.current_value || 0), 0);
  const totalPOSpend = purchaseOrders.filter((po: any) => po.status === 'received').reduce((s: number, po: any) => s + Number(po.total_amount || 0), 0);
  const activeProjects = projects.filter((p: any) => p.status === 'active').length;
  const totalBudget = projects.reduce((s: number, p: any) => s + Number(p.budget || 0), 0);
  const totalActual = projects.reduce((s: number, p: any) => s + Number(p.actual_cost || 0), 0);

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-semibold mb-4">Sales Pipeline</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={pipelineData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value">
                {pipelineData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 mt-2 justify-center">
            {pipelineData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                <span className="text-muted-foreground">{d.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-semibold mb-4">Summary</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="kpi-card"><p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Deals</p><p className="text-xl font-bold mt-1">{deals.length}</p></div>
            <div className="kpi-card"><p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Win Rate</p><p className="text-xl font-bold mt-1">{winRate}%</p></div>
            <div className="kpi-card"><p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Products</p><p className="text-xl font-bold mt-1">{products.length}</p></div>
            <div className="kpi-card"><p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Employees</p><p className="text-xl font-bold mt-1">{employees.length}</p></div>
          </div>
        </div>
      </div>

      {/* Procurement & Projects Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-semibold mb-4">Procurement Overview</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="kpi-card"><p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Purchase Orders</p><p className="text-xl font-bold mt-1">{purchaseOrders.length}</p></div>
            <div className="kpi-card"><p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">PO Spend (Received)</p><p className="text-xl font-bold mt-1">${totalPOSpend.toLocaleString()}</p></div>
            <div className="kpi-card"><p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Assets</p><p className="text-xl font-bold mt-1">{assets.length}</p></div>
            <div className="kpi-card"><p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Asset Value</p><p className="text-xl font-bold mt-1">${totalAssetValue.toLocaleString()}</p></div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-semibold mb-4">Projects Overview</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="kpi-card"><p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Active Projects</p><p className="text-xl font-bold mt-1">{activeProjects}</p></div>
            <div className="kpi-card"><p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Projects</p><p className="text-xl font-bold mt-1">{projects.length}</p></div>
            <div className="kpi-card"><p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Budget</p><p className="text-xl font-bold mt-1">${totalBudget.toLocaleString()}</p></div>
            <div className="kpi-card"><p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Actual Spend</p><p className={`text-xl font-bold mt-1 ${totalActual > totalBudget && totalBudget > 0 ? 'text-destructive' : ''}`}>${totalActual.toLocaleString()}</p></div>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-5">
        <h3 className="text-sm font-semibold mb-3">Leave Balances by Department</h3>
        <div className="space-y-3">
          {departments.map((dept) => {
            const deptEmps = employees.filter(e => e.department === dept);
            const avgLeave = deptEmps.reduce((s, e) => s + e.leave_balance, 0) / deptEmps.length;
            return (
              <div key={dept} className="flex items-center justify-between">
                <span className="text-sm">{dept}</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${(avgLeave / 25) * 100}%` }} />
                  </div>
                  <span className="text-sm font-medium w-16 text-right">{avgLeave.toFixed(0)} days</span>
                </div>
              </div>
            );
          })}
          {departments.length === 0 && <p className="text-sm text-muted-foreground">No employee data yet</p>}
        </div>
      </div>
    </div>
  );
}
