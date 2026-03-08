import { useState } from 'react';
import { useSites, useUpsertSite, useDeleteSite, useEmployees } from '@/hooks/useCrmData';
import { Plus, Pencil, Trash2, MapPin, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SiteFormDialog } from '@/components/forms/SiteFormDialog';
import { DeleteConfirmDialog } from '@/components/forms/DeleteConfirmDialog';

export default function Sites() {
  const { data: sites = [], isLoading } = useSites();
  const { data: employees = [] } = useEmployees();
  const upsert = useUpsertSite();
  const remove = useDeleteSite();
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (isLoading) return <div className="py-12 text-center text-muted-foreground text-sm">Loading sites...</div>;

  return (
    <div className="space-y-4 animate-slide-in">
      <div className="flex justify-between items-center">
        <p className="text-xs text-muted-foreground">{sites.length} site{sites.length !== 1 ? 's' : ''}</p>
        <Button size="sm" onClick={() => { setEditItem(null); setFormOpen(true); }}><Plus className="w-4 h-4 mr-1" />New Site</Button>
      </div>

      {sites.length === 0 ? (
        <div className="py-16 text-center">
          <Building2 className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">No sites yet. Add your first job site or location.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sites.map((site: any) => (
            <div key={site.id} className="bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold truncate">{site.name}</h3>
                  {site.address && (
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />{site.address}{site.city ? `, ${site.city}` : ''}{site.state ? ` ${site.state}` : ''}
                    </p>
                  )}
                </div>
                <div className="flex gap-1 shrink-0 ml-2">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditItem(site); setFormOpen(true); }}><Pencil className="w-3.5 h-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(site.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
              <Badge variant={site.status === 'active' ? 'default' : 'secondary'} className="text-[10px] capitalize">{site.status}</Badge>
              {site.manager_name && <p className="text-xs text-muted-foreground mt-2">Manager: {site.manager_name}</p>}
              {site.start_date && <p className="text-[10px] text-muted-foreground/60 mt-1">Since {site.start_date}</p>}
            </div>
          ))}
        </div>
      )}

      <SiteFormDialog open={formOpen} onOpenChange={setFormOpen} initialData={editItem} loading={upsert.isPending} employees={employees.map((e: any) => ({ id: e.id, name: e.name }))} onSubmit={(data) => upsert.mutate(data, { onSuccess: () => setFormOpen(false) })} />
      <DeleteConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} loading={remove.isPending} onConfirm={() => { if (deleteId) remove.mutate(deleteId, { onSuccess: () => setDeleteId(null) }); }} title="Delete Site" />
    </div>
  );
}
