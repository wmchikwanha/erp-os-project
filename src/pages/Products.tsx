import { useState } from 'react';
import { useProducts, useUpsertProduct, useDeleteProduct, useBulkImportProducts } from '@/hooks/useCrmData';
import { AlertTriangle, Plus, Pencil, Trash2, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ProductFormDialog } from '@/components/forms/ProductFormDialog';
import { DeleteConfirmDialog } from '@/components/forms/DeleteConfirmDialog';
import { CsvImportDialog } from '@/components/forms/CsvImportDialog';

export default function Products() {
  const { data: products = [], isLoading } = useProducts();
  const upsert = useUpsertProduct();
  const remove = useDeleteProduct();
  const bulkImport = useBulkImportProducts();
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [csvOpen, setCsvOpen] = useState(false);

  if (isLoading) return <div className="py-12 text-center text-muted-foreground text-sm">Loading products...</div>;

  return (
    <div className="space-y-4 animate-slide-in">
      <div className="flex justify-end">
      <div className="flex gap-2 justify-end">
        <Button size="sm" variant="outline" onClick={() => setCsvOpen(true)}><Upload className="w-4 h-4 mr-1" />Import CSV</Button>
        <Button size="sm" onClick={() => { setEditItem(null); setFormOpen(true); }}><Plus className="w-4 h-4 mr-1" />Add Product</Button>
      </div>
      </div>
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="table-header text-left px-4 py-3">Product</th>
                <th className="table-header text-left px-4 py-3">SKU</th>
                <th className="table-header text-right px-4 py-3">Price</th>
                <th className="table-header text-right px-4 py-3">Stock</th>
                <th className="table-header text-left px-4 py-3">Status</th>
                <th className="table-header text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.map((product) => {
                const lowStock = product.reorder_level > 0 && product.stock_quantity <= product.reorder_level;
                return (
                  <tr key={product.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.description}</p>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-muted-foreground">{product.sku}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium">${Number(product.unit_price).toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-right">{product.stock_quantity}</td>
                    <td className="px-4 py-3">
                      {lowStock ? (
                        <span className="status-badge bg-destructive/10 text-destructive flex items-center gap-1 w-fit"><AlertTriangle className="w-3 h-3" />Low Stock</span>
                      ) : (
                        <span className="status-badge bg-success/10 text-success">In Stock</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditItem(product); setFormOpen(true); }}><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(product.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {products.length === 0 && <div className="py-12 text-center text-muted-foreground text-sm">No products yet</div>}
      </div>

      <ProductFormDialog open={formOpen} onOpenChange={setFormOpen} initialData={editItem} loading={upsert.isPending} onSubmit={(data) => { upsert.mutate(data, { onSuccess: () => setFormOpen(false) }); }} />
      <DeleteConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} loading={remove.isPending} onConfirm={() => { if (deleteId) remove.mutate(deleteId, { onSuccess: () => setDeleteId(null) }); }} title="Delete Product" />
      <CsvImportDialog open={csvOpen} onOpenChange={setCsvOpen} title="Import Products CSV" expectedColumns={['name', 'sku', 'description', 'unit_price', 'stock_quantity', 'reorder_level']} loading={bulkImport.isPending} onImport={(rows) => { bulkImport.mutate(rows, { onSuccess: () => setCsvOpen(false) }); }} />
    </div>
  );
}
