import { useState } from 'react';
import { useInventoryConsumption, useLogConsumption, useProducts, useSites, useProjects, useEmployees } from '@/hooks/useCrmData';
import { Plus, AlertTriangle, PackageX, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConsumptionFormDialog } from '@/components/forms/ConsumptionFormDialog';

export default function Consumption() {
  const { data: consumption = [], isLoading } = useInventoryConsumption();
  const { data: products = [] } = useProducts();
  const { data: sites = [] } = useSites();
  const { data: projects = [] } = useProjects();
  const { data: employees = [] } = useEmployees();
  const log = useLogConsumption();
  const [formOpen, setFormOpen] = useState(false);

  if (isLoading) return <div className="py-12 text-center text-muted-foreground text-sm">Loading consumption data...</div>;

  // Products needing restock
  const lowStock = products.filter((p: any) => p.stock_quantity <= p.reorder_level && p.reorder_level > 0);

  return (
    <div className="space-y-4 animate-slide-in">
      {lowStock.length > 0 && (
        <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            <span className="text-sm font-medium text-destructive">{lowStock.length} product{lowStock.length > 1 ? 's' : ''} below reorder level</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStock.map((p: any) => (
              <Badge key={p.id} variant="destructive" className="text-xs">{p.name}: {p.stock_quantity}/{p.reorder_level}</Badge>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <span className="text-xs text-muted-foreground">{consumption.length} consumption record{consumption.length !== 1 ? 's' : ''}</span>
        <Button size="sm" onClick={() => setFormOpen(true)}><Plus className="w-4 h-4 mr-1" />Log Consumption</Button>
      </div>

      {consumption.length === 0 ? (
        <div className="py-16 text-center">
          <PackageX className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">No consumption recorded yet.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg divide-y divide-border">
          {consumption.map((c: any) => (
            <div key={c.id} className="px-4 py-3 flex items-center justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-3.5 h-3.5 text-muted-foreground" />
                  <p className="text-sm font-medium truncate">{c.product_name}{c.product_sku ? ` (${c.product_sku})` : ''}</p>
                  <Badge variant="outline" className="text-[10px]">-{c.quantity}</Badge>
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-3">
                  <span>{c.consumption_date}</span>
                  {c.employee_name && <span>By: {c.employee_name}</span>}
                  {c.site_name && <span>@ {c.site_name}</span>}
                  {c.project_name && <span>• {c.project_name}</span>}
                </div>
                {c.notes && <p className="text-[10px] text-muted-foreground/60 mt-0.5">{c.notes}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      <ConsumptionFormDialog open={formOpen} onOpenChange={setFormOpen} loading={log.isPending} products={products.map((p: any) => ({ id: p.id, name: p.name, sku: p.sku, stock: p.stock_quantity }))} sites={sites.map((s: any) => ({ id: s.id, name: s.name }))} projects={projects.map((p: any) => ({ id: p.id, name: p.name }))} employees={employees.map((e: any) => ({ id: e.id, name: e.name }))} onSubmit={(data) => log.mutate(data, { onSuccess: () => setFormOpen(false) })} />
    </div>
  );
}
