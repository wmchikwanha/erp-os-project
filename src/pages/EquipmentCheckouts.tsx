import { useState } from 'react';
import { useEquipmentCheckouts, useCreateCheckout, useReturnCheckout, useAcknowledgeCheckout, useAssets, useEmployees, useSites, useProjects } from '@/hooks/useCrmData';
import { Plus, RotateCcw, CheckCircle2, AlertTriangle, PackageCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckoutFormDialog } from '@/components/forms/CheckoutFormDialog';
import { ReturnFormDialog } from '@/components/forms/ReturnFormDialog';

const statusConfig: Record<string, { color: string; icon: any }> = {
  'checked-out': { color: 'bg-warning/10 text-warning', icon: AlertTriangle },
  returned: { color: 'bg-success/10 text-success', icon: CheckCircle2 },
  overdue: { color: 'bg-destructive/10 text-destructive', icon: AlertTriangle },
};

export default function EquipmentCheckouts() {
  const { data: checkouts = [], isLoading } = useEquipmentCheckouts();
  const { data: assets = [] } = useAssets();
  const { data: employees = [] } = useEmployees();
  const { data: sites = [] } = useSites();
  const { data: projects = [] } = useProjects();
  const create = useCreateCheckout();
  const returnCheckout = useReturnCheckout();
  const acknowledge = useAcknowledgeCheckout();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [returnItem, setReturnItem] = useState<any>(null);

  if (isLoading) return <div className="py-12 text-center text-muted-foreground text-sm">Loading checkouts...</div>;

  const active = checkouts.filter((c: any) => c.status === 'checked-out');
  const returned = checkouts.filter((c: any) => c.status === 'returned');

  return (
    <div className="space-y-4 animate-slide-in">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-xs">{active.length} active</Badge>
          <Badge variant="secondary" className="text-xs">{returned.length} returned</Badge>
        </div>
        <Button size="sm" onClick={() => setCheckoutOpen(true)}><Plus className="w-4 h-4 mr-1" />Check Out Equipment</Button>
      </div>

      {checkouts.length === 0 ? (
        <div className="py-16 text-center">
          <PackageCheck className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">No equipment checkouts yet.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg divide-y divide-border">
          {checkouts.map((c: any) => {
            const cfg = statusConfig[c.status] || statusConfig['checked-out'];
            const Icon = cfg.icon;
            return (
              <div key={c.id} className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className="w-4 h-4 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{c.asset_name}{c.asset_tag ? ` (${c.asset_tag})` : ''}</p>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5 flex-wrap">
                      <span>→ {c.worker_name}</span>
                      {c.site_name && <span>@ {c.site_name}</span>}
                      {c.project_name && <span>• {c.project_name}</span>}
                      <span>• {new Date(c.checkout_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge className={`${cfg.color} capitalize text-[10px]`}>{c.status}</Badge>
                  {!c.acknowledged_by_worker && c.status === 'checked-out' && (
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => acknowledge.mutate(c.id)}>
                      <CheckCircle2 className="w-3 h-3 mr-1" />Acknowledge
                    </Button>
                  )}
                  {c.acknowledged_by_worker && !c.actual_return_date && (
                    <span className="text-[10px] text-success">✓ Signed</span>
                  )}
                  {c.status === 'checked-out' && (
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setReturnItem(c)}>
                      <RotateCcw className="w-3 h-3 mr-1" />Return
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CheckoutFormDialog open={checkoutOpen} onOpenChange={setCheckoutOpen} loading={create.isPending} assets={assets.map((a: any) => ({ id: a.id, name: a.name, tag: a.asset_tag }))} employees={employees.map((e: any) => ({ id: e.id, name: e.name }))} sites={sites.map((s: any) => ({ id: s.id, name: s.name }))} projects={projects.map((p: any) => ({ id: p.id, name: p.name }))} onSubmit={(data) => create.mutate(data, { onSuccess: () => setCheckoutOpen(false) })} />
      <ReturnFormDialog open={!!returnItem} onOpenChange={() => setReturnItem(null)} loading={returnCheckout.isPending} item={returnItem} onSubmit={(data) => returnCheckout.mutate(data, { onSuccess: () => setReturnItem(null) })} />
    </div>
  );
}
