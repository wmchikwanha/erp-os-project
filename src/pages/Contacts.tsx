import { useState, useMemo } from 'react';
import { Search, Plus, Pencil, Trash2 } from 'lucide-react';
import { useContacts, useUpsertContact, useDeleteContact } from '@/hooks/useCrmData';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ContactFormDialog } from '@/components/forms/ContactFormDialog';
import { DeleteConfirmDialog } from '@/components/forms/DeleteConfirmDialog';

const typeColors: Record<string, string> = {
  lead: 'bg-warning/10 text-warning',
  customer: 'bg-success/10 text-success',
  supplier: 'bg-info/10 text-info',
  employee: 'bg-primary/10 text-primary',
};

export default function Contacts() {
  const { data: contacts = [], isLoading } = useContacts();
  const upsert = useUpsertContact();
  const remove = useDeleteContact();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return contacts.filter((c) => {
      const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || (c.company ?? '').toLowerCase().includes(search.toLowerCase()) || (c.email ?? '').toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === 'all' || c.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [contacts, search, typeFilter]);

  if (isLoading) return <div className="py-12 text-center text-muted-foreground text-sm">Loading contacts...</div>;

  return (
    <div className="space-y-4 animate-slide-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search contacts..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1 bg-muted rounded-md p-0.5">
            {(['all', 'lead', 'customer', 'supplier', 'employee'] as const).map((t) => (
              <button key={t} onClick={() => setTypeFilter(t)} className={cn('px-2.5 py-1 text-xs font-medium rounded capitalize transition-colors', typeFilter === t ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>{t}</button>
            ))}
          </div>
          <Button size="sm" className="ml-auto sm:ml-0" onClick={() => { setEditItem(null); setFormOpen(true); }}><Plus className="w-4 h-4 mr-1" />Add</Button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="table-header text-left px-4 py-3">Name</th>
                <th className="table-header text-left px-4 py-3">Type</th>
                <th className="table-header text-left px-4 py-3 hidden md:table-cell">Company</th>
                <th className="table-header text-left px-4 py-3 hidden lg:table-cell">Email</th>
                <th className="table-header text-left px-4 py-3 hidden lg:table-cell">Assigned To</th>
                <th className="table-header text-left px-4 py-3">Status</th>
                <th className="table-header text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((contact) => (
                <tr key={contact.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-xs font-medium text-primary">{contact.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{contact.name}</p>
                        <p className="text-xs text-muted-foreground md:hidden">{contact.company}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><span className={cn('status-badge capitalize', typeColors[contact.type] ?? 'bg-muted text-muted-foreground')}>{contact.type}</span></td>
                  <td className="px-4 py-3 text-sm hidden md:table-cell">{contact.company}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground hidden lg:table-cell">{contact.email}</td>
                  <td className="px-4 py-3 text-sm hidden lg:table-cell">{contact.assigned_to}</td>
                  <td className="px-4 py-3">
                    <span className={cn('status-badge', contact.status === 'active' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground')}>{contact.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditItem(contact); setFormOpen(true); }}><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(contact.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <div className="py-12 text-center text-muted-foreground text-sm">No contacts found</div>}
      </div>

      <ContactFormDialog open={formOpen} onOpenChange={setFormOpen} initialData={editItem} loading={upsert.isPending} onSubmit={(data) => { upsert.mutate(data, { onSuccess: () => setFormOpen(false) }); }} />
      <DeleteConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} loading={remove.isPending} onConfirm={() => { if (deleteId) remove.mutate(deleteId, { onSuccess: () => setDeleteId(null) }); }} title="Delete Contact" />
    </div>
  );
}
