import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { NumberInput } from '@/components/ui/number-input';
import { Textarea } from '@/components/ui/textarea';
import { ZESA_REGIONS, generateFromTimetable, parsePastedSchedule } from '@/data/zesaSchedule';

interface Rate { id: string; currency: string; official_rate: number; parallel_rate: number; effective_date: string; source: string | null }
interface Tax { id: string; name: string; authority: string; amount: number; currency: string; due_date: string; status: string }
interface Outage { id: string; zone: string; start_time: string; end_time: string; source: string | null }

const localToIso = (v: string) => new Date(v).toISOString();
const fmt = (iso: string) => new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

export default function SAEControlPanel() {
  const { user } = useAuth();
  const [rates, setRates] = useState<Rate[]>([]);
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [outages, setOutages] = useState<Outage[]>([]);
  const [newRate, setNewRate] = useState({ currency: 'USD', official_rate: 1, parallel_rate: 1, source: 'manual' });
  const [newTax, setNewTax] = useState({ name: '', authority: 'ZIMRA', amount: 0, currency: 'USD', due_date: '' });
  const [newOutage, setNewOutage] = useState({ zone: 'Zone A', start_time: '', end_time: '', source: 'ZESA' });
  const [regionId, setRegionId] = useState(ZESA_REGIONS[0].id);
  const [areaCode, setAreaCode] = useState(ZESA_REGIONS[0].areas[0].code);
  const [pasted, setPasted] = useState('');
  const region = ZESA_REGIONS.find((r) => r.id === regionId)!;

  const reload = async () => {
    const [{ data: r }, { data: t }, { data: o }] = await Promise.all([
      supabase.from('currency_rates').select('*').order('effective_date', { ascending: false }),
      supabase.from('tax_obligations').select('*').eq('user_id', user!.id).order('due_date'),
      supabase.from('load_shedding_schedule').select('*').gte('end_time', new Date().toISOString()).order('start_time'),
    ]);
    setRates((r as Rate[]) || []);
    setTaxes((t as Tax[]) || []);
    setOutages((o as Outage[]) || []);
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

  const addOutage = async () => {
    if (!newOutage.zone || !newOutage.start_time || !newOutage.end_time) return;
    if (new Date(newOutage.end_time) <= new Date(newOutage.start_time)) {
      return toast({ title: 'End time must be after start time', variant: 'destructive' });
    }
    const { error } = await supabase.from('load_shedding_schedule').insert({
      zone: newOutage.zone,
      start_time: localToIso(newOutage.start_time),
      end_time: localToIso(newOutage.end_time),
      source: newOutage.source || 'manual',
    });
    if (error) return toast({ title: 'Could not save', description: error.message, variant: 'destructive' });
    setNewOutage({ ...newOutage, start_time: '', end_time: '' });
    toast({ title: 'Outage window added' });
    reload();
  };

  const addTypicalWeek = async () => {
    const rows: { zone: string; start_time: string; end_time: string; source: string }[] = [];
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    for (let d = 0; d < 7; d++) {
      const day = new Date(base.getTime() + d * 86400000);
      const morning = new Date(day); morning.setHours(5, 0, 0, 0);
      const mEnd = new Date(day); mEnd.setHours(9, 0, 0, 0);
      const evening = new Date(day); evening.setHours(17, 0, 0, 0);
      const eEnd = new Date(day); eEnd.setHours(21, 0, 0, 0);
      rows.push({ zone: newOutage.zone, start_time: morning.toISOString(), end_time: mEnd.toISOString(), source: 'ZESA (typical week)' });
      rows.push({ zone: newOutage.zone, start_time: evening.toISOString(), end_time: eEnd.toISOString(), source: 'ZESA (typical week)' });
    }
    const { error } = await supabase.from('load_shedding_schedule').insert(rows);
    if (error) return toast({ title: 'Could not save', description: error.message, variant: 'destructive' });
    toast({ title: 'Typical 7-day schedule added', description: `${rows.length} windows for ${newOutage.zone}` });
    reload();
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">SAE Control Panel</h1>
        <p className="text-sm text-muted-foreground">Feed the Situational Awareness Engine with the data only you can know: ZESA outage windows, parallel-market rates and statutory obligations.</p>
      </header>

      <Card>
        <CardHeader><CardTitle className="text-sm">ZESA Load-Shedding Schedule</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-[11px] text-muted-foreground">
            Add each outage window. The Load-Shedding Planner matches these against shifts and power-sensitive equipment.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <Input value={newOutage.zone} onChange={(e) => setNewOutage({ ...newOutage, zone: e.target.value })} placeholder="Zone / suburb" />
            <Input type="datetime-local" value={newOutage.start_time} onChange={(e) => setNewOutage({ ...newOutage, start_time: e.target.value })} />
            <Input type="datetime-local" value={newOutage.end_time} onChange={(e) => setNewOutage({ ...newOutage, end_time: e.target.value })} />
            <Input value={newOutage.source} onChange={(e) => setNewOutage({ ...newOutage, source: e.target.value })} placeholder="Source" />
            <div className="flex gap-2">
              <Button onClick={addOutage} size="sm">Add window</Button>
              <Button onClick={addTypicalWeek} size="sm" variant="outline">Typical week</Button>
            </div>
          </div>
          {outages.length === 0 ? (
            <p className="text-xs text-muted-foreground">No upcoming outage windows logged yet.</p>
          ) : (
            <table className="w-full text-xs">
              <thead className="text-muted-foreground"><tr><th className="text-left py-1">Zone</th><th>Start</th><th>End</th><th>Hours</th><th>Source</th><th /></tr></thead>
              <tbody>
                {outages.map((o) => (
                  <tr key={o.id} className="border-t border-border">
                    <td className="py-1.5 font-medium">{o.zone}</td>
                    <td className="text-center">{fmt(o.start_time)}</td>
                    <td className="text-center">{fmt(o.end_time)}</td>
                    <td className="text-center">{((new Date(o.end_time).getTime() - new Date(o.start_time).getTime()) / 3600000).toFixed(1)}h</td>
                    <td className="text-center text-muted-foreground">{o.source}</td>
                    <td className="text-right">
                      <button onClick={async () => { await supabase.from('load_shedding_schedule').delete().eq('id', o.id); reload(); }} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>


      <Card>
        <CardHeader><CardTitle className="text-sm">Currency Rates</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <Input value={newRate.currency} onChange={(e) => setNewRate({ ...newRate, currency: e.target.value.toUpperCase() })} placeholder="USD" />
            <NumberInput  step="0.01" value={newRate.official_rate}  placeholder="Official" onValueChange={n => setNewRate({ ...newRate, official_rate: n })} />
            <NumberInput  step="0.01" value={newRate.parallel_rate}  placeholder="Parallel" onValueChange={n => setNewRate({ ...newRate, parallel_rate: n })} />
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
            <NumberInput  value={newTax.amount}  placeholder="Amount" onValueChange={n => setNewTax({ ...newTax, amount: n })} />
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
