import { useState } from 'react';
import { useProjects, useUpsertProject, useDeleteProject, useDeals, useEmployees } from '@/hooks/useCrmData';
import { Plus, Pencil, Trash2, FolderKanban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProjectFormDialog } from '@/components/forms/ProjectFormDialog';
import { DeleteConfirmDialog } from '@/components/forms/DeleteConfirmDialog';

const statusColors: Record<string, string> = {
  planning: 'bg-muted text-muted-foreground',
  active: 'bg-success/10 text-success',
  'on-hold': 'bg-warning/10 text-warning',
  completed: 'bg-primary/10 text-primary',
  cancelled: 'bg-destructive/10 text-destructive',
};

const priorityColors: Record<string, string> = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-info/10 text-info',
  high: 'bg-warning/10 text-warning',
  critical: 'bg-destructive/10 text-destructive',
};

export default function Projects() {
  const { data: projects = [], isLoading } = useProjects();
  const { data: deals = [] } = useDeals();
  const { data: employees = [] } = useEmployees();
  const upsert = useUpsertProject();
  const remove = useDeleteProject();
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (isLoading) return <div className="py-12 text-center text-muted-foreground text-sm">Loading projects...</div>;

  const closedWonDeals = deals.filter((d: any) => d.stage === 'closed-won');

  return (
    <div className="space-y-4 animate-slide-in">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => { setEditItem(null); setFormOpen(true); }}><Plus className="w-4 h-4 mr-1" />New Project</Button>
      </div>

      {projects.length === 0 ? (
        <div className="py-16 text-center">
          <FolderKanban className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">No projects yet. Create one from a closed deal or start fresh.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map((project: any) => {
            const overBudget = Number(project.actual_cost) > Number(project.budget) && Number(project.budget) > 0;
            return (
              <div key={project.id} className="bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold truncate">{project.name}</h3>
                    {project.deal_name && <p className="text-xs text-muted-foreground mt-0.5">Deal: {project.deal_name}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0 ml-2">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditItem(project); setFormOpen(true); }}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(project.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>

                <div className="flex gap-2 mb-3">
                  <span className={`status-badge ${statusColors[project.status] || ''} capitalize text-xs`}>{project.status.replace('-', ' ')}</span>
                  <span className={`status-badge ${priorityColors[project.priority] || ''} capitalize text-xs`}>{project.priority}</span>
                </div>

                {project.description && <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{project.description}</p>}

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{project.progress}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${project.progress}%` }} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                  <div>
                    <span className="text-muted-foreground">Budget</span>
                    <p className="font-medium">${Number(project.budget).toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Actual</span>
                    <p className={`font-medium ${overBudget ? 'text-destructive' : ''}`}>${Number(project.actual_cost).toLocaleString()}</p>
                  </div>
                </div>

                {project.manager_name && (
                  <div className="mt-3 pt-2 border-t border-border text-xs text-muted-foreground">
                    Manager: {project.manager_name}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ProjectFormDialog open={formOpen} onOpenChange={setFormOpen} initialData={editItem} loading={upsert.isPending} deals={closedWonDeals.map((d: any) => ({ id: d.id, title: d.title }))} employees={employees.map((e: any) => ({ id: e.id, name: e.name }))} onSubmit={(data) => upsert.mutate(data, { onSuccess: () => setFormOpen(false) })} />
      <DeleteConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} loading={remove.isPending} onConfirm={() => { if (deleteId) remove.mutate(deleteId, { onSuccess: () => setDeleteId(null) }); }} title="Delete Project" />
    </div>
  );
}
