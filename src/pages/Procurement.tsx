import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, AlertTriangle, CheckCircle, Clock, XCircle, PackageCheck, ArrowRight } from 'lucide-react';
import { useProducts, useUpsertProduct, useDeleteProduct, useContacts, usePurchaseOrders, useUpsertPurchaseOrder, useDeletePurchaseOrder, useUpdatePOStatus, useAssets, useUpsertAsset, useDeleteAsset, useEmployees } from '@/hooks/useCrmData';
import { useAuth } from '@/hooks/useAuth';
import { ProductFormDialog } from '@/components/forms/ProductFormDialog';
import { PurchaseOrderFormDialog } from '@/components/forms/PurchaseOrderFormDialog';
import { AssetFormDialog } from '@/components/forms/AssetFormDialog';
import { DeleteConfirmDialog } from '@/components/forms/DeleteConfirmDialog';

const poStatusConfig: Record<string, { label: string; color: string; icon: any }> = {
  draft: { label: 'Draft', color: 'bg-muted text-muted-foreground', icon: Clock },
  submitted: { label: 'Submitted', color: 'bg-info/10 text-info', icon: ArrowRight },
  approved: { label: 'Approved', color: 'bg-success/10 text-success', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'bg-destructive/10 text-destructive', icon: XCircle },
  received: { label: 'Received', color: 'bg-primary/10 text-primary', icon: PackageCheck },
};

const conditionColors: Record<string, string> = {
  New: 'bg-success/10 text-success',
  Good: 'bg-info/10 text-info',
  Fair: 'bg-warning/10 text-warning',
  Poor: 'bg-destructive/10 text-destructive',
  Decommissioned: 'bg-muted text-muted-foreground',
};

export default function Procurement() {
  const { user } = useAuth();
  const { data: products = [], isLoading: lp } = useProducts();
  const upsertProduct = useUpsertProduct();
  const removeProduct = useDeleteProduct();
  const { data: contacts = [] } = useContacts();
  const { data: purchaseOrders = [], isLoading: lpo } = usePurchaseOrders();
  const upsertPO = useUpsertPurchaseOrder();
  const removePO = useDeletePurchaseOrder();
  const updatePOStatus = useUpdatePOStatus();
  const { data: assets = [], isLoading: la } = useAssets();
  const upsertAsset = useUpsertAsset();
  const removeAsset = useDeleteAsset();
  const { data: employees = [] } = useEmployees();

  const [productFormOpen, setProductFormOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);

  const [poFormOpen, setPOFormOpen] = useState(false);
  const [editPO, setEditPO] = useState<any>(null);
  const [deletePOId, setDeletePOId] = useState<string | null>(null);

  const [assetFormOpen, setAssetFormOpen] = useState(false);
  const [editAsset, setEditAsset] = useState<any>(null);
  const [deleteAssetId, setDeleteAssetId] = useState<string | null>(null);

  const suppliers = contacts.filter((c: any) => c.type === 'supplier');

  const loading = lp || lpo || la;
  if (loading) return <div className="py-12 text-center text-muted-foreground text-sm">Loading procurement...</div>;

  return (
    <div className="space-y-4 animate-slide-in">
      <Tabs defaultValue="inventory">
        <TabsList>
          <TabsTrigger value="inventory">Inventory ({products.length})</TabsTrigger>
          <TabsTrigger value="purchase-orders">Purchase Orders ({purchaseOrders.length})</TabsTrigger>
          <TabsTrigger value="assets">Asset Register ({assets.length})</TabsTrigger>
        </TabsList>

        {/* ── Inventory Tab ── */}
        <TabsContent value="inventory">
          <div className="flex justify-end mb-3">
            <Button size="sm" onClick={() => { setEditProduct(null); setProductFormOpen(true); }}><Plus className="w-4 h-4 mr-1" />Add Product</Button>
          </div>
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-border bg-muted/30">
                  <th className="table-header text-left px-4 py-3">Product</th>
                  <th className="table-header text-left px-4 py-3">SKU</th>
                  <th className="table-header text-right px-4 py-3">Price</th>
                  <th className="table-header text-right px-4 py-3">Stock</th>
                  <th className="table-header text-left px-4 py-3">Status</th>
                  <th className="table-header text-right px-4 py-3">Actions</th>
                </tr></thead>
                <tbody className="divide-y divide-border">
                  {products.map((product: any) => {
                    const lowStock = product.reorder_level > 0 && product.stock_quantity <= product.reorder_level;
                    return (
                      <tr key={product.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3"><p className="text-sm font-medium">{product.name}</p><p className="text-xs text-muted-foreground">{product.description}</p></td>
                        <td className="px-4 py-3 text-sm font-mono text-muted-foreground">{product.sku}</td>
                        <td className="px-4 py-3 text-sm text-right font-medium">${Number(product.unit_price).toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-right">{product.stock_quantity}</td>
                        <td className="px-4 py-3">{lowStock ? <span className="status-badge bg-destructive/10 text-destructive flex items-center gap-1 w-fit"><AlertTriangle className="w-3 h-3" />Low Stock</span> : <span className="status-badge bg-success/10 text-success">In Stock</span>}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditProduct(product); setProductFormOpen(true); }}><Pencil className="w-3.5 h-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteProductId(product.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
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
        </TabsContent>

        {/* ── Purchase Orders Tab ── */}
        <TabsContent value="purchase-orders">
          <div className="flex justify-end mb-3">
            <Button size="sm" onClick={() => { setEditPO(null); setPOFormOpen(true); }}><Plus className="w-4 h-4 mr-1" />New PO</Button>
          </div>
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-border bg-muted/30">
                  <th className="table-header text-left px-4 py-3">PO #</th>
                  <th className="table-header text-left px-4 py-3">Supplier</th>
                  <th className="table-header text-left px-4 py-3">Status</th>
                  <th className="table-header text-right px-4 py-3">Total</th>
                  <th className="table-header text-left px-4 py-3">Date</th>
                  <th className="table-header text-right px-4 py-3">Actions</th>
                </tr></thead>
                <tbody className="divide-y divide-border">
                  {purchaseOrders.map((po: any) => {
                    const config = poStatusConfig[po.status] || poStatusConfig.draft;
                    const StatusIcon = config.icon;
                    return (
                      <tr key={po.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 text-sm font-mono font-medium">{po.po_number}</td>
                        <td className="px-4 py-3 text-sm">{po.supplier_name}</td>
                        <td className="px-4 py-3"><span className={`status-badge ${config.color} flex items-center gap-1 w-fit`}><StatusIcon className="w-3 h-3" />{config.label}</span></td>
                        <td className="px-4 py-3 text-sm text-right font-medium">${Number(po.total_amount).toLocaleString()}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(po.created_at).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {po.status === 'draft' && <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => updatePOStatus.mutate({ id: po.id, status: 'submitted' })}>Submit</Button>}
                            {po.status === 'submitted' && (
                              <>
                                <Button variant="outline" size="sm" className="h-7 text-xs text-success" onClick={() => updatePOStatus.mutate({ id: po.id, status: 'approved', approved_by: user?.user_metadata?.full_name || user?.email || '' })}>Approve</Button>
                                <Button variant="outline" size="sm" className="h-7 text-xs text-destructive" onClick={() => updatePOStatus.mutate({ id: po.id, status: 'rejected' })}>Reject</Button>
                              </>
                            )}
                            {po.status === 'approved' && <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => updatePOStatus.mutate({ id: po.id, status: 'received' })}>Received</Button>}
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeletePOId(po.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {purchaseOrders.length === 0 && <div className="py-12 text-center text-muted-foreground text-sm">No purchase orders yet</div>}
          </div>
        </TabsContent>

        {/* ── Asset Register Tab ── */}
        <TabsContent value="assets">
          <div className="flex justify-end mb-3">
            <Button size="sm" onClick={() => { setEditAsset(null); setAssetFormOpen(true); }}><Plus className="w-4 h-4 mr-1" />Add Asset</Button>
          </div>
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-border bg-muted/30">
                  <th className="table-header text-left px-4 py-3">Asset</th>
                  <th className="table-header text-left px-4 py-3">Tag</th>
                  <th className="table-header text-left px-4 py-3">Category</th>
                  <th className="table-header text-left px-4 py-3">Condition</th>
                  <th className="table-header text-right px-4 py-3">Value</th>
                  <th className="table-header text-left px-4 py-3">Assigned</th>
                  <th className="table-header text-right px-4 py-3">Actions</th>
                </tr></thead>
                <tbody className="divide-y divide-border">
                  {assets.map((asset: any) => (
                    <tr key={asset.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3"><p className="text-sm font-medium">{asset.name}</p><p className="text-xs text-muted-foreground">{asset.location}</p></td>
                      <td className="px-4 py-3 text-sm font-mono text-muted-foreground">{asset.asset_tag || '—'}</td>
                      <td className="px-4 py-3"><Badge variant="outline" className="text-xs">{asset.category}</Badge></td>
                      <td className="px-4 py-3"><span className={`status-badge ${conditionColors[asset.condition] || ''} text-xs`}>{asset.condition}</span></td>
                      <td className="px-4 py-3 text-sm text-right font-medium">${Number(asset.current_value).toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm">{asset.assigned_employee_name || '—'}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditAsset(asset); setAssetFormOpen(true); }}><Pencil className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteAssetId(asset.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {assets.length === 0 && <div className="py-12 text-center text-muted-foreground text-sm">No assets registered yet</div>}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <ProductFormDialog open={productFormOpen} onOpenChange={setProductFormOpen} initialData={editProduct} loading={upsertProduct.isPending} onSubmit={(data) => upsertProduct.mutate(data, { onSuccess: () => setProductFormOpen(false) })} />
      <PurchaseOrderFormDialog open={poFormOpen} onOpenChange={setPOFormOpen} initialData={editPO} loading={upsertPO.isPending} suppliers={suppliers.map((s: any) => ({ id: s.id, name: s.name }))} products={products.map((p: any) => ({ id: p.id, name: p.name, unit_price: p.unit_price }))} onSubmit={(data) => upsertPO.mutate(data, { onSuccess: () => setPOFormOpen(false) })} />
      <AssetFormDialog open={assetFormOpen} onOpenChange={setAssetFormOpen} initialData={editAsset} loading={upsertAsset.isPending} employees={employees.map((e: any) => ({ id: e.id, name: e.name }))} onSubmit={(data) => upsertAsset.mutate(data, { onSuccess: () => setAssetFormOpen(false) })} />
      <DeleteConfirmDialog open={!!deleteProductId} onOpenChange={() => setDeleteProductId(null)} loading={removeProduct.isPending} onConfirm={() => { if (deleteProductId) removeProduct.mutate(deleteProductId, { onSuccess: () => setDeleteProductId(null) }); }} title="Delete Product" />
      <DeleteConfirmDialog open={!!deletePOId} onOpenChange={() => setDeletePOId(null)} loading={removePO.isPending} onConfirm={() => { if (deletePOId) removePO.mutate(deletePOId, { onSuccess: () => setDeletePOId(null) }); }} title="Delete Purchase Order" />
      <DeleteConfirmDialog open={!!deleteAssetId} onOpenChange={() => setDeleteAssetId(null)} loading={removeAsset.isPending} onConfirm={() => { if (deleteAssetId) removeAsset.mutate(deleteAssetId, { onSuccess: () => setDeleteAssetId(null) }); }} title="Delete Asset" />
    </div>
  );
}
