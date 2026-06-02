import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, AlertTriangle, Plus, X, Calendar } from 'lucide-react';
import RationaleCard from '@/components/sae/RationaleCard';
import { useRegulatoryDigest, useAcknowledgeNotice, type ComplianceCard } from '@/hooks/useRegulatoryDigest';
import { useIsAdmin, useRole } from '@/hooks/useRole';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

function Countdown({ days }: { days: number }) {
  const tone = days <= 3 ? 'bg-destructive text-destructive-foreground'
    : days <= 7 ? 'bg-amber-500 text-white'
    : days <= 14 ? 'bg-warning text-warning-foreground'
    : 'bg-muted text-muted-foreground';
  return <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${tone}`}>{days <= 0 ? 'DUE NOW' : `${days}d left`}</span>;
}

function CardItem({ c, onAck }: { c: ComplianceCard; onAck: () => void }) {
  return (
    <div className="space-y-2 border border-border rounded-lg p-3 bg-card">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-semibold">{c.title}</div>
          <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
            {c.authority && <span>{c.authority}</span>}
            <span>· {c.due_date}</span>
            {c.amount !== undefined && <span>· {c.currency} {c.amount.toLocaleString()}</span>}
          </div>
          {c.affected_modules.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {c.affected_modules.map((m) => <span key={m} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{m}</span>)}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <Countdown days={c.days_until} />
          {c.kind === 'notice' && (
            <button onClick={onAck} className="text-[10px] text-muted-foreground hover:text-destructive flex items-center gap-1">
              <X className="w-3 h-3" /> Not applicable
            </button>
          )}
        </div>
      </div>
      <RationaleCard recommendationKey={c.recommendation_key} inputs={c.inputs} logic={c.logic} action={c.action} />
    </div>
  );
}

function NoticeAdmin() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: notices = [] } = useQuery({
    queryKey: ['regulatory_notices_admin'],
    queryFn: async () => {
      const { data, error } = await supabase.from('regulatory_notices').select('*').order('effective_date', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const [draft, setDraft] = useState({ title: '', si_number: '', effective_date: '', summary: '', modules: '' });
  const onCreate = async () => {
    if (!draft.title) return;
    const { error } = await supabase.from('regulatory_notices').insert({
      title: draft.title, si_number: draft.si_number || null, effective_date: draft.effective_date || null,
      summary: draft.summary || null,
      affected_modules: draft.modules.split(',').map((s) => s.trim()).filter(Boolean),
    });
    if (error) { toast({ title: error.message, variant: 'destructive' }); return; }
    setDraft({ title: '', si_number: '', effective_date: '', summary: '', modules: '' });
    qc.invalidateQueries({ queryKey: ['regulatory_notices_admin'] });
    qc.invalidateQueries({ queryKey: ['regulatory-digest'] });
    toast({ title: 'Notice added' });
  };
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end">
        <div><Label className="text-xs">Title</Label><Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></div>
        <div><Label className="text-xs">SI #</Label><Input value={draft.si_number} onChange={(e) => setDraft({ ...draft, si_number: e.target.value })} /></div>
        <div><Label className="text-xs">Effective date</Label><Input type="date" value={draft.effective_date} onChange={(e) => setDraft({ ...draft, effective_date: e.target.value })} /></div>
        <div><Label className="text-xs">Affected modules (comma)</Label><Input value={draft.modules} onChange={(e) => setDraft({ ...draft, modules: e.target.value })} placeholder="payroll, vat" /></div>
        <Button size="sm" onClick={onCreate}><Plus className="w-4 h-4 mr-1" />Add</Button>
      </div>
      <Input value={draft.summary} onChange={(e) => setDraft({ ...draft, summary: e.target.value })} placeholder="One-line action summary (becomes the recommended action)" />
      <div className="space-y-1 max-h-64 overflow-auto">
        {notices.map((n: any) => (
          <div key={n.id} className="flex items-center justify-between text-xs bg-muted/30 rounded px-2 py-1">
            <span>{n.effective_date || '—'} · <b>{n.title}</b> {n.si_number && `(SI ${n.si_number})`} · {(n.affected_modules || []).join(', ')}</span>
            <button onClick={async () => { await supabase.from('regulatory_notices').delete().eq('id', n.id); qc.invalidateQueries({ queryKey: ['regulatory_notices_admin'] }); qc.invalidateQueries({ queryKey: ['regulatory-digest'] }); }} className="text-destructive hover:underline">remove</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function TaxCalendar() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: taxes = [] } = useQuery({
    queryKey: ['tax_obligations'],
    queryFn: async () => {
      const { data, error } = await supabase.from('tax_obligations').select('*').order('due_date');
      if (error) throw error;
      return data;
    },
  });
  const [draft, setDraft] = useState({ name: '', authority: 'ZIMRA', amount: 0, currency: 'USD', due_date: '', recurrence: 'none' });
  const onCreate = async () => {
    if (!draft.name || !draft.due_date) return;
    const { error } = await supabase.from('tax_obligations').insert({ ...draft, user_id: user!.id });
    if (error) { toast({ title: error.message, variant: 'destructive' }); return; }
    setDraft({ name: '', authority: 'ZIMRA', amount: 0, currency: 'USD', due_date: '', recurrence: 'none' });
    qc.invalidateQueries({ queryKey: ['tax_obligations'] });
    qc.invalidateQueries({ queryKey: ['regulatory-digest'] });
  };
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-7 gap-2 items-end">
        <div className="col-span-2"><Label className="text-xs">Name</Label><Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="VAT Aug" /></div>
        <div><Label className="text-xs">Authority</Label><Input value={draft.authority} onChange={(e) => setDraft({ ...draft, authority: e.target.value })} /></div>
        <div><Label className="text-xs">Amount</Label><Input type="number" value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: Number(e.target.value) })} /></div>
        <div>
          <Label className="text-xs">Ccy</Label>
          <Select value={draft.currency} onValueChange={(v) => setDraft({ ...draft, currency: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{['USD','ZWG','ZAR','RTGS'].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label className="text-xs">Due</Label><Input type="date" value={draft.due_date} onChange={(e) => setDraft({ ...draft, due_date: e.target.value })} /></div>
        <div>
          <Label className="text-xs">Recurrence</Label>
          <Select value={draft.recurrence} onValueChange={(v) => setDraft({ ...draft, recurrence: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{['none','monthly','quarterly','annual'].map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <Button size="sm" onClick={onCreate}><Plus className="w-4 h-4 mr-1" />Add obligation</Button>
      <div className="space-y-1 max-h-64 overflow-auto">
        {taxes.map((t: any) => (
          <div key={t.id} className="flex items-center justify-between text-xs bg-muted/30 rounded px-2 py-1">
            <span>{t.due_date} · <b>{t.name}</b> · {t.authority} · {t.currency} {Number(t.amount).toLocaleString()} · {t.status} · {t.recurrence}</span>
            <div className="flex gap-2">
              {t.status === 'pending' && <button onClick={async () => { await supabase.from('tax_obligations').update({ status: 'paid' }).eq('id', t.id); qc.invalidateQueries({ queryKey: ['tax_obligations'] }); qc.invalidateQueries({ queryKey: ['regulatory-digest'] }); }} className="text-emerald-500 hover:underline">mark paid</button>}
              <button onClick={async () => { await supabase.from('tax_obligations').delete().eq('id', t.id); qc.invalidateQueries({ queryKey: ['tax_obligations'] }); qc.invalidateQueries({ queryKey: ['regulatory-digest'] }); }} className="text-destructive hover:underline">remove</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ComplianceMonitor() {
  const { data, isLoading } = useRegulatoryDigest();
  const ack = useAcknowledgeNotice();
  const { isAdmin } = useIsAdmin();
  const { data: role } = useRole();
  const canManageTax = isAdmin || role === 'finance_manager';

  return (
    <div className="space-y-6 max-w-6xl">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Shield className="w-6 h-6" /> Compliance Monitor</h1>
        <p className="text-sm text-muted-foreground">ZIMRA, SIs, and statutory deadlines — ranked by what hits you first.</p>
      </header>

      <Tabs defaultValue="dashboard">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          {isAdmin && <TabsTrigger value="notices">Manage Notices</TabsTrigger>}
          {canManageTax && <TabsTrigger value="tax">Tax Calendar</TabsTrigger>}
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4 pt-4">
          {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2 text-destructive"><AlertTriangle className="w-4 h-4" />Next 14 days ({data?.urgent.length || 0})</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {data?.urgent.length ? data.urgent.map((c) => <CardItem key={c.recommendation_key} c={c} onAck={() => ack.mutate(c.id)} />)
                    : <p className="text-xs text-muted-foreground">Nothing urgent. Stay vigilant.</p>}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Calendar className="w-4 h-4" />15–60 days ({data?.upcoming.length || 0})</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {data?.upcoming.length ? data.upcoming.map((c) => <CardItem key={c.recommendation_key} c={c} onAck={() => ack.mutate(c.id)} />)
                    : <p className="text-xs text-muted-foreground">No upcoming deadlines in this window.</p>}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {isAdmin && <TabsContent value="notices" className="pt-4"><Card><CardContent className="pt-4"><NoticeAdmin /></CardContent></Card></TabsContent>}
        {canManageTax && <TabsContent value="tax" className="pt-4"><Card><CardContent className="pt-4"><TaxCalendar /></CardContent></Card></TabsContent>}
      </Tabs>
    </div>
  );
}
