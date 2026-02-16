import { useState } from 'react';
import { useDeals, useUpsertDeal, useDeleteDeal, useContacts } from '@/hooks/useCrmData';
import { cn } from '@/lib/utils';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DealFormDialog } from '@/components/forms/DealFormDialog';
import { DeleteConfirmDialog } from '@/components/forms/DeleteConfirmDialog';

const stages = [
  { key: 'prospecting', label: 'Prospecting', color: 'border-t-info' },
  { key: 'negotiation', label: 'Negotiation', color: 'border-t-warning' },
  { key: 'closed-won', label: 'Closed Won', color: 'border-t-success' },
  { key: 'closed-lost', label: 'Closed Lost', color: 'border-t-destructive' },
];

export default function Deals() {
  const { data: deals = [], isLoading } = useDeals();
  const { data: contacts = [] } = useContacts();
  const upsert = useUpsertDeal();
  const remove = useDeleteDeal();
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const dealsByStage = (stage: string) => deals.filter((d) => d.stage === stage);
  const stageTotal = (stage: string) => dealsByStage(stage).reduce((s, d) => s + Number(d.value), 0);

  if (isLoading) return <div className="py-12 text-center text-muted-foreground text-sm">Loading deals...</div>;

  return (
    <div className="space-y-4 animate-slide-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6 text-sm">
          <div>
            <span className="text-muted-foreground">Pipeline Value: </span>
            <span className="font-semibold">${deals.filter(d => d.stage !== 'closed-lost').reduce((s, d) => s + Number(d.value), 0).toLocaleString()}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Weighted: </span>
            <span className="font-semibold">${deals.reduce((s, d) => s + Number(d.value) * d.probability / 100, 0).toLocaleString()}</span>
          </div>
        </div>
        <Button size="sm" onClick={() => { setEditItem(null); setFormOpen(true); }}><Plus className="w-4 h-4 mr-1" />Add Deal</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {stages.map((stage) => (
          <div key={stage.key} className={cn('kanban-column border-t-2', stage.color)}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{stage.label}</h3>
              <span className="text-xs text-muted-foreground">${stageTotal(stage.key).toLocaleString()}</span>
            </div>
            <div className="space-y-2">
              {dealsByStage(stage.key).map((deal) => (
                <div key={deal.id} className="kanban-card group">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{deal.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{deal.contact_name}</p>
                    </div>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setEditItem(deal); setFormOpen(true); }}><Pencil className="w-3 h-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => setDeleteId(deal.id)}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm font-semibold">${Number(deal.value).toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground">{deal.probability}%</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">Close: {deal.expected_close}</p>
                </div>
              ))}
              {dealsByStage(stage.key).length === 0 && <p className="text-xs text-muted-foreground text-center py-8">No deals</p>}
            </div>
          </div>
        ))}
      </div>

      <DealFormDialog open={formOpen} onOpenChange={setFormOpen} initialData={editItem} contacts={contacts.map(c => ({ id: c.id, name: c.name }))} loading={upsert.isPending} onSubmit={(data) => { upsert.mutate(data, { onSuccess: () => setFormOpen(false) }); }} />
      <DeleteConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} loading={remove.isPending} onConfirm={() => { if (deleteId) remove.mutate(deleteId, { onSuccess: () => setDeleteId(null) }); }} title="Delete Deal" />
    </div>
  );
}
