import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, AlertTriangle, TrendingUp, TrendingDown, Package } from 'lucide-react';
import RationaleCard from '@/components/sae/RationaleCard';
import { useMaterialBaskets, type BasketItem } from '@/hooks/useMaterialBaskets';
import { useSupplierQuotes } from '@/hooks/useSupplierQuotes';
import { usePriceSentinel } from '@/hooks/usePriceSentinel';
import { toast } from '@/hooks/use-toast';
import { NumberInput } from '@/components/ui/number-input';

const CCY = ['USD', 'ZWG', 'ZAR', 'RTGS'];

export default function ProcurementScout() {
  const { baskets, isLoading: lb, upsert: upsertBasket, remove: removeBasket } = useMaterialBaskets();
  const { quotes, isLoading: lq, add: addQuote, remove: removeQuote } = useSupplierQuotes();
  const [activeBasketId, setActiveBasketId] = useState<string | undefined>();
  const activeBasket = useMemo(() => baskets.find((b) => b.id === (activeBasketId || baskets[0]?.id)), [baskets, activeBasketId]);
  const { data: scout, isLoading: ls, refetch } = usePriceSentinel(activeBasket?.id);

  const [newBasketName, setNewBasketName] = useState('');
  const [itemDraft, setItemDraft] = useState<BasketItem>({ name: '', qty: 1, unit: 'unit' });
  const [quoteDraft, setQuoteDraft] = useState({
    item: '', supplier_name: '', unit_price: 0, currency: 'USD', lead_time_days: 7, valid_until: '',
  });

  const onCreateBasket = async () => {
    if (!newBasketName.trim()) return;
    await upsertBasket.mutateAsync({ name: newBasketName.trim(), items: [] });
    setNewBasketName('');
    toast({ title: 'Basket created' });
  };

  const onAddItem = async () => {
    if (!activeBasket || !itemDraft.name.trim()) return;
    const items = [...activeBasket.items, { ...itemDraft, name: itemDraft.name.trim() }];
    await upsertBasket.mutateAsync({ id: activeBasket.id, name: activeBasket.name, items });
    setItemDraft({ name: '', qty: 1, unit: 'unit' });
  };

  const onRemoveItem = async (idx: number) => {
    if (!activeBasket) return;
    const items = activeBasket.items.filter((_, i) => i !== idx);
    await upsertBasket.mutateAsync({ id: activeBasket.id, name: activeBasket.name, items });
  };

  const onAddQuote = async () => {
    if (!quoteDraft.item.trim() || !quoteDraft.supplier_name.trim()) {
      toast({ title: 'Item and supplier required', variant: 'destructive' }); return;
    }
    await addQuote.mutateAsync({
      ...quoteDraft,
      item: quoteDraft.item.trim(),
      supplier_name: quoteDraft.supplier_name.trim(),
      valid_until: quoteDraft.valid_until || null,
    } as any);
    setQuoteDraft({ ...quoteDraft, item: '', supplier_name: '', unit_price: 0 });
    refetch();
  };

  if (lb) return <div className="p-6 text-sm text-muted-foreground">Loading baskets…</div>;

  return (
    <div className="space-y-6 max-w-6xl">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Package className="w-6 h-6" /> Procurement Scout</h1>
        <p className="text-sm text-muted-foreground">Pick the right supplier, currency, and week — parallel-rate aware.</p>
      </header>

      {/* Basket selector + create */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Material baskets</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2 items-end">
            <div className="flex-1 min-w-[200px]">
              <Label className="text-xs">Active basket</Label>
              <Select value={activeBasket?.id} onValueChange={setActiveBasketId}>
                <SelectTrigger><SelectValue placeholder="Choose a basket…" /></SelectTrigger>
                <SelectContent>{baskets.map((b) => <SelectItem key={b.id} value={b.id}>{b.name} ({b.items.length})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <Label className="text-xs">New basket</Label>
              <Input value={newBasketName} onChange={(e) => setNewBasketName(e.target.value)} placeholder="e.g. Steel works Q3" />
            </div>
            <Button onClick={onCreateBasket} size="sm"><Plus className="w-4 h-4 mr-1" />Create</Button>
            {activeBasket && (
              <Button variant="outline" size="sm" onClick={() => removeBasket.mutate(activeBasket.id)}>
                <Trash2 className="w-4 h-4 mr-1" />Delete basket
              </Button>
            )}
          </div>

          {activeBasket && (
            <div className="border-t border-border pt-3 space-y-2">
              <Label className="text-xs">Items in "{activeBasket.name}"</Label>
              <div className="flex flex-wrap gap-2 items-end">
                <Input className="flex-1 min-w-[160px]" placeholder="Item name (e.g. Rebar 12mm)" value={itemDraft.name} onChange={(e) => setItemDraft({ ...itemDraft, name: e.target.value })} />
                <NumberInput  className="w-20" placeholder="Qty" value={itemDraft.qty} onValueChange={n => setItemDraft({ ...itemDraft, qty: n })} />
                <Input className="w-24" placeholder="unit" value={itemDraft.unit} onChange={(e) => setItemDraft({ ...itemDraft, unit: e.target.value })} />
                <Button size="sm" onClick={onAddItem}><Plus className="w-4 h-4" /></Button>
              </div>
              <div className="space-y-1">
                {activeBasket.items.map((it, i) => (
                  <div key={i} className="flex items-center justify-between text-xs bg-muted/30 rounded px-2 py-1">
                    <span>{it.name} — {it.qty} {it.unit}</span>
                    <button onClick={() => onRemoveItem(i)} className="text-destructive hover:underline">remove</button>
                  </div>
                ))}
                {activeBasket.items.length === 0 && <p className="text-xs text-muted-foreground">No items yet.</p>}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quotes capture */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Add supplier quote</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2 items-end">
            <div><Label className="text-xs">Item</Label><Input value={quoteDraft.item} onChange={(e) => setQuoteDraft({ ...quoteDraft, item: e.target.value })} placeholder="Rebar 12mm" /></div>
            <div><Label className="text-xs">Supplier</Label><Input value={quoteDraft.supplier_name} onChange={(e) => setQuoteDraft({ ...quoteDraft, supplier_name: e.target.value })} /></div>
            <div><Label className="text-xs">Unit price</Label><NumberInput  value={quoteDraft.unit_price} onValueChange={n => setQuoteDraft({ ...quoteDraft, unit_price: n })} /></div>
            <div>
              <Label className="text-xs">Currency</Label>
              <Select value={quoteDraft.currency} onValueChange={(v) => setQuoteDraft({ ...quoteDraft, currency: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CCY.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Lead time (d)</Label><NumberInput  value={quoteDraft.lead_time_days} onValueChange={n => setQuoteDraft({ ...quoteDraft, lead_time_days: n })} /></div>
            <div><Label className="text-xs">Valid until</Label><Input type="date" value={quoteDraft.valid_until} onChange={(e) => setQuoteDraft({ ...quoteDraft, valid_until: e.target.value })} /></div>
          </div>
          <Button size="sm" onClick={onAddQuote}><Plus className="w-4 h-4 mr-1" />Add quote</Button>

          {quotes.length > 0 && (
            <div className="border-t border-border pt-2">
              <p className="text-xs text-muted-foreground mb-1">Recent quotes</p>
              <div className="space-y-1 max-h-48 overflow-auto">
                {quotes.slice(0, 20).map((q) => (
                  <div key={q.id} className="flex items-center justify-between text-xs bg-muted/30 rounded px-2 py-1">
                    <span>{q.quoted_at} · <b>{q.item}</b> · {q.supplier_name || 'unknown'} · {q.currency} {Number(q.unit_price).toFixed(2)} · lead {q.lead_time_days}d</span>
                    <button onClick={() => removeQuote.mutate(q.id)} className="text-destructive hover:underline">remove</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Procurement recommendations</CardTitle></CardHeader>
        <CardContent>
          {ls ? <p className="text-xs text-muted-foreground">Computing…</p> : (
            scout?.recommendations?.length ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {scout.recommendations.map((r) => (
                  <div key={r.recommendation_key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold">{r.item} <span className="text-xs text-muted-foreground">({r.basket_name})</span></div>
                      <div className="flex items-center gap-1.5 text-xs">
                        {r.flags.includes('price_spike') && <span className="flex items-center gap-1 text-destructive"><TrendingUp className="w-3 h-3" />+{r.trend_pct.toFixed(1)}%</span>}
                        {r.flags.includes('price_drop') && <span className="flex items-center gap-1 text-emerald-500"><TrendingDown className="w-3 h-3" />{r.trend_pct.toFixed(1)}%</span>}
                        {r.flags.includes('single_source') && <span className="flex items-center gap-1 text-amber-500"><AlertTriangle className="w-3 h-3" />Single source</span>}
                        {r.flags.includes('quote_expiring') && <span className="text-amber-500">Quote expiring</span>}
                        {r.flags.includes('no_quotes') && <span className="text-muted-foreground">No quotes</span>}
                      </div>
                    </div>
                    <RationaleCard recommendationKey={r.recommendation_key} inputs={r.inputs} logic={r.logic} action={r.action} />
                  </div>
                ))}
              </div>
            ) : <p className="text-xs text-muted-foreground">Add a basket with items and quotes to see recommendations.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
