import { useDeals, useProducts, useEmployees, useProjects, usePurchaseOrders, useAssets, useInvoices, usePayments, useExpenses, useTimesheets } from '@/hooks/useCrmData';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const COLORS = ['hsl(210, 70%, 50%)', 'hsl(38, 92%, 50%)', 'hsl(152, 60%, 38%)', 'hsl(0, 72%, 51%)', 'hsl(270, 60%, 55%)', 'hsl(190, 70%, 45%)'];

export default function Reports() {
  const { data: deals = [], isLoading: ld } = useDeals();
  const { data: products = [], isLoading: lp } = useProducts();
  const { data: employees = [], isLoading: le } = useEmployees();
  const { data: projects = [], isLoading: lpr } = useProjects();
  const { data: purchaseOrders = [], isLoading: lpo } = usePurchaseOrders();
  const { data: assets = [], isLoading: la } = useAssets();
  const { data: invoices = [], isLoading: linv } = useInvoices();
  const { data: payments = [] } = usePayments();
  const { data: expenses = [] } = useExpenses();
  const { data: timesheets = [] } = useTimesheets();

  if (ld || lp || le || lpr || lpo || la || linv) return <div className="py-12 text-center text-muted-foreground text-sm">Loading reports...</div>;

  // Sales Pipeline
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

  // AR Aging
  const now = new Date();
  const agingData = [
    { bucket: 'Current', amount: 0 },
    { bucket: '1-30', amount: 0 },
    { bucket: '31-60', amount: 0 },
    { bucket: '61-90', amount: 0 },
    { bucket: '90+', amount: 0 },
  ];
  invoices.filter(i => i.status !== 'paid' && i.status !== 'draft').forEach(inv => {
    const daysOverdue = Math.floor((now.getTime() - new Date(inv.due_date).getTime()) / 86400000);
    const amt = Number(inv.total_amount);
    if (daysOverdue <= 0) agingData[0].amount += amt;
    else if (daysOverdue <= 30) agingData[1].amount += amt;
    else if (daysOverdue <= 60) agingData[2].amount += amt;
    else if (daysOverdue <= 90) agingData[3].amount += amt;
    else agingData[4].amount += amt;
  });

  // Deal conversion funnel
  const prospecting = deals.filter(d => d.stage === 'prospecting').length;
  const negotiation = deals.filter(d => d.stage === 'negotiation').length;
  const funnelData = [
    { name: 'Prospecting', value: prospecting + negotiation + closedWon + closedLost, fill: COLORS[0] },
    { name: 'Negotiation', value: negotiation + closedWon + closedLost, fill: COLORS[1] },
    { name: 'Closed Won', value: closedWon, fill: COLORS[2] },
  ];

  // Asset Depreciation by category
  const assetCategories: Record<string, { purchase: number; current: number }> = {};
  assets.forEach((a: any) => {
    const cat = a.category || 'Other';
    if (!assetCategories[cat]) assetCategories[cat] = { purchase: 0, current: 0 };
    assetCategories[cat].purchase += Number(a.purchase_price || 0);
    assetCategories[cat].current += Number(a.current_value || 0);
  });
  const depreciationData = Object.entries(assetCategories).map(([cat, v]) => ({ category: cat, purchase: v.purchase, current: v.current }));

  // Asset allocation pie
  const assetAllocation = Object.entries(assetCategories).map(([cat, v]) => ({ name: cat, value: v.current }));

  // Timesheet by project
  const tsByProject: Record<string, number> = {};
  timesheets.forEach((t: any) => {
    const key = t.project_id || 'Unassigned';
    tsByProject[key] = (tsByProject[key] || 0) + Number(t.hours_worked);
  });
  const projectMap = Object.fromEntries(projects.map((p: any) => [p.id, p.name]));
  const tsProjectData = Object.entries(tsByProject).map(([pid, hours]) => ({
    project: projectMap[pid] || 'Unassigned',
    hours: Math.round(hours * 10) / 10,
  })).sort((a, b) => b.hours - a.hours).slice(0, 8);

  // Expense by category
  const expByCategory: Record<string, number> = {};
  expenses.forEach((e: any) => {
    const cat = e.category || 'general';
    expByCategory[cat] = (expByCategory[cat] || 0) + Number(e.amount);
  });
  const expCategoryData = Object.entries(expByCategory).map(([cat, amount]) => ({ name: cat, value: amount }));

  // Monthly P&L
  const monthlyPL: Record<string, { revenue: number; costs: number }> = {};
  invoices.filter(i => i.status === 'paid').forEach(i => {
    const m = (i.issue_date || i.created_at)?.slice(0, 7);
    if (m) { if (!monthlyPL[m]) monthlyPL[m] = { revenue: 0, costs: 0 }; monthlyPL[m].revenue += Number(i.total_amount); }
  });
  expenses.filter((e: any) => e.status === 'approved').forEach((e: any) => {
    const m = e.expense_date?.slice(0, 7);
    if (m) { if (!monthlyPL[m]) monthlyPL[m] = { revenue: 0, costs: 0 }; monthlyPL[m].costs += Number(e.amount); }
  });
  const plData = Object.entries(monthlyPL).sort(([a], [b]) => a.localeCompare(b)).slice(-6).map(([month, v]) => ({ month, revenue: v.revenue, costs: v.costs }));

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Row 1: Pipeline + Summary */}
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

      {/* Row 2: AR Aging + Deal Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-semibold mb-4">Invoice Aging Analysis</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={agingData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="bucket" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
              <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
              <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                {agingData.map((_, i) => <Cell key={i} fill={['hsl(152,60%,38%)', 'hsl(38,92%,50%)', 'hsl(25,90%,50%)', 'hsl(0,72%,51%)', 'hsl(0,72%,40%)'][i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-semibold mb-4">Deal Conversion Funnel</h3>
          {deals.length > 0 ? (
            <div className="space-y-3 mt-4">
              {funnelData.map((stage, i) => (
                <div key={stage.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">{stage.name}</span>
                    <span className="font-medium">{stage.value} deals</span>
                  </div>
                  <div className="h-6 bg-muted rounded-md overflow-hidden">
                    <div className="h-full rounded-md transition-all" style={{
                      width: `${funnelData[0].value > 0 ? (stage.value / funnelData[0].value) * 100 : 0}%`,
                      backgroundColor: stage.fill,
                    }} />
                  </div>
                  {i < funnelData.length - 1 && funnelData[i].value > 0 && (
                    <p className="text-[10px] text-muted-foreground mt-0.5 text-right">
                      {Math.round((funnelData[i + 1].value / funnelData[i].value) * 100)}% conversion →
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-muted-foreground py-8 text-center">No deals yet</p>}
        </div>
      </div>

      {/* Row 3: Procurement & Projects */}
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

      {/* Row 4: Asset Depreciation + Allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-semibold mb-4">Asset Depreciation by Category</h3>
          {depreciationData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={depreciationData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="category" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
                <Bar dataKey="purchase" fill="hsl(210, 70%, 50%)" radius={[4, 4, 0, 0]} name="Purchase Price" />
                <Bar dataKey="current" fill="hsl(152, 60%, 38%)" radius={[4, 4, 0, 0]} name="Current Value" />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-muted-foreground py-8 text-center">No asset data</p>}
        </div>

        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-semibold mb-4">Asset Allocation</h3>
          {assetAllocation.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={assetAllocation} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                    {assetAllocation.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-3 justify-center">
                {assetAllocation.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-muted-foreground">{d.name}</span>
                  </div>
                ))}
              </div>
            </>
          ) : <p className="text-sm text-muted-foreground py-8 text-center">No asset data</p>}
        </div>
      </div>

      {/* Row 5: Timesheet Summary + Expense Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-semibold mb-4">Hours by Project</h3>
          {tsProjectData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={tsProjectData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis type="number" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <YAxis type="category" dataKey="project" width={120} tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                <Tooltip />
                <Bar dataKey="hours" fill="hsl(210, 70%, 50%)" radius={[0, 4, 4, 0]} name="Hours" />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-muted-foreground py-8 text-center">No timesheet data</p>}
        </div>

        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-semibold mb-4">Expense Breakdown</h3>
          {expCategoryData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={expCategoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                    {expCategoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-3 justify-center">
                {expCategoryData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-muted-foreground capitalize">{d.name} — ${d.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </>
          ) : <p className="text-sm text-muted-foreground py-8 text-center">No expense data</p>}
        </div>
      </div>

      {/* Row 6: Monthly P&L */}
      <div className="bg-card border border-border rounded-lg p-5">
        <h3 className="text-sm font-semibold mb-4">Monthly Profit & Loss</h3>
        {plData.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={plData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
              <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
              <Bar dataKey="revenue" fill="hsl(152, 60%, 38%)" radius={[4, 4, 0, 0]} name="Revenue" />
              <Bar dataKey="costs" fill="hsl(0, 72%, 51%)" radius={[4, 4, 0, 0]} name="Costs" />
            </BarChart>
          </ResponsiveContainer>
        ) : <p className="text-sm text-muted-foreground py-8 text-center">No P&L data yet</p>}
      </div>

      {/* Leave Balances */}
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
