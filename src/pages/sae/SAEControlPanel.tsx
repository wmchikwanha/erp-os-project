import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Rate { id: string; currency: string; official_rate: number; parallel_rate: number; effective_date: string; source: string | null }
interface Tax { id: string; name: string; authority: string; amount: number; currency: string; due_date: string; status: string }

export default function SAEControlPanel() {
  const { user } = useAuth();
  const [rates, setRates] = useState<Rate[]>([]);
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [newRate, setNewRate] = useState({ currency: 'USD', official_rate: 1, parallel_rate: 1, source: 'manual' });
  const [newTax, setNewTax] = useState({ name: '', authority: 'ZIMRA', amount: 0, currency: 'USD', due_date: '' });

  const reload = async () => {
    const [{ data: r }, { data: t }] = await Promise.all([
      supabase.from('currency_rates').select('*').order('effective_date', { ascending: false }),
      supabase.from('tax_obligations').select('*').eq('user_id', user!.id).order('due_date'),
    ]);
    setRates((r as Rate[]) || []);
    setTaxes((t as Tax[]) || []);
  };
  useEffect(() => { if (user) reload(); }, [user]);

  const addRate = async () => {
    const { error } = await supabase.from('currency_rates').insert({ ...newRate, effective_date: new Date().toISOString().slice(0, 10) });
    if (error) return toast({ title: 'Could not save', description: error.message, variant: 'destructive' });
    setNewRate({ currency: 'USD', official_rate: 1, parallel_rate: 1, source: 'manual' });
    reload();
  };
  const addTax = async () => {
    if (!newTax.name || !newTax.due_date) return;
    const { error } = await supabase.from('tax_obligations').insert({ ...newTax, user_id: user!.id });
    if (error) return toast({ title: 'Could not save', description: error.message, variant: 'destructive' });
    setNewTax({ name: '', authority: 'ZIMRA', amount: 0, currency: 'USD', due_date: '' });
    reload();
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">SAE Control Panel</h1>
        <p className="text-sm text-muted-foreground">Feed the Situational Awareness Engine with the data only you can know: parallel-market rates and statutory obligations.</p>
      </header>

      <Card>
        <CardHeader><CardTitle className="text-sm">Currency Rates</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <Input value={newRate.currency} onChange={(e) => setNewRate({ ...newRate, currency: e.target.value.toUpperCase() })} placeholder="USD" />
            <Input type="number" step="0.01" value={newRate.official_rate} onChange={(e) => setNewRate({ ...newRate, official_rate: Number(e.target.value) })} placeholder="Official" />
            <Input type="number" step="0.01" value={newRate.parallel_rate} onChange={(e) => setNewRate({ ...newRate, parallel_rate: Number(e.target.value) })} placeholder="Parallel" />
            <Input value={newRate.source} onChange={(e) => setNewRate({ ...newRate, source: e.target.value })} placeholder="Source" />
            <Button onClick={addRate} size="sm">Add rate</Button>
          </div>
          <table className="w-full text-xs">
            <thead className="text-muted-foreground"><tr><th className="text-left py-1">Currency</th><th>Official</th><th>Parallel</th><th>Date</th><th>Source</th><th /></tr></thead>
            <tbody>
              {rates.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="py-1.5 font-medium">{r.currency}</td>
                  <td className="text-center">{Number(r.official_rate).toFixed(2)}</td>
                  <td className="text-center">{Number(r.parallel_rate).toFixed(2)}</td>
                  <td className="text-center">{r.effective_date}</td>
                  <td className="text-center text-muted-foreground">{r.source}</td>
                  <td className="text-right">
                    <button onClick={async () => { await supabase.from('currency_rates').delete().eq('id', r.id); reload(); }} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Tax & Statutory Obligations</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
            <Input value={newTax.name} onChange={(e) => setNewTax({ ...newTax, name: e.target.value })} placeholder="e.g. PAYE June" className="md:col-span-2" />
            <Input value={newTax.authority} onChange={(e) => setNewTax({ ...newTax, authority: e.target.value })} placeholder="ZIMRA" />
            <Input type="number" value={newTax.amount} onChange={(e) => setNewTax({ ...newTax, amount: Number(e.target.value) })} placeholder="Amount" />
            <Input type="date" value={newTax.due_date} onChange={(e) => setNewTax({ ...newTax, due_date: e.target.value })} />
            <Button onClick={addTax} size="sm">Add</Button>
          </div>
          <table className="w-full text-xs">
            <thead className="text-muted-foreground"><tr><th className="text-left py-1">Name</th><th>Authority</th><th>Amount</th><th>Due</th><th>Status</th><th /></tr></thead>
            <tbody>
              {taxes.map((t) => (
                <tr key={t.id} className="border-t border-border">
                  <td className="py-1.5 font-medium">{t.name}</td>
                  <td className="text-center">{t.authority}</td>
                  <td className="text-center">{t.currency} {Number(t.amount).toLocaleString()}</td>
                  <td className="text-center">{t.due_date}</td>
                  <td className="text-center">
                    <select value={t.status} onChange={async (e) => { await supabase.from('tax_obligations').update({ status: e.target.value }).eq('id', t.id); reload(); }} className="bg-transparent text-xs">
                      <option value="pending">pending</option>
                      <option value="paid">paid</option>
                      <option value="overdue">overdue</option>
                    </select>
                  </td>
                  <td className="text-right">
                    <button onClick={async () => { await supabase.from('tax_obligations').delete().eq('id', t.id); reload(); }} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
