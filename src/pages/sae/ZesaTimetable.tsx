import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Trash2, Upload, CalendarDays, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  ZESA_REGIONS,
  generateFromTimetable,
  parsePastedSchedule,
  type GeneratedWindow,
} from '@/data/zesaSchedule';

interface Outage { id: string; zone: string; start_time: string; end_time: string; source: string | null }

const fmtDay = (iso: string) => new Date(iso).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const hours = (a: string, b: string) => (new Date(b).getTime() - new Date(a).getTime()) / 36e5;

export default function ZesaTimetable() {
  const qc = useQueryClient();
  const [outages, setOutages] = useState<Outage[]>([]);
  const [pasted, setPasted] = useState('');
  const [fallbackZone, setFallbackZone] = useState('Unspecified zone');
  const [preview, setPreview] = useState<GeneratedWindow[] | null>(null);
  const [regionId, setRegionId] = useState(ZESA_REGIONS[0].id);
  const [areaCode, setAreaCode] = useState(ZESA_REGIONS[0].areas[0].code);
  const [saving, setSaving] = useState(false);

  const region = ZESA_REGIONS.find((r) => r.id === regionId)!;

  const reload = async () => {
    const { data } = await supabase
      .from('load_shedding_schedule')
      .select('*')
      .gte('end_time', new Date().toISOString())
      .order('start_time');
    setOutages((data as Outage[]) || []);
  };
  useEffect(() => { reload(); }, []);

  const refreshPlanner = () => qc.invalidateQueries({ queryKey: ['load-shedding-planner'] });

  const save = async (rows: GeneratedWindow[], label: string) => {
    if (!rows.length) {
      toast({ title: 'Nothing to save', description: 'No outage windows were recognised.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('load_shedding_schedule').insert(rows);
    setSaving(false);
    if (error) return toast({ title: 'Could not save', description: error.message, variant: 'destructive' });
    toast({ title: label, description: `${rows.length} window(s) now feeding the planner` });
    setPreview(null);
    setPasted('');
    await reload();
    refreshPlanner();
  };

  const remove = async (id: string) => {
    await supabase.from('load_shedding_schedule').delete().eq('id', id);
    await reload();
    refreshPlanner();
  };

  const clearAll = async () => {
    const ids = outages.map((o) => o.id);
    if (!ids.length) return;
    await supabase.from('load_shedding_schedule').delete().in('id', ids);
    toast({ title: 'Upcoming schedule cleared' });
    await reload();
    refreshPlanner();
  };

  const grouped = useMemo(() => {
    const map: Record<string, Outage[]> = {};
    for (const o of outages) (map[o.start_time.slice(0, 10)] ||= []).push(o);
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [outages]);

  const totalHours = outages.reduce((s, o) => s + hours(o.start_time, o.end_time), 0);

  return (
    <div className="space-y-6 max-w-5xl">
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">ZESA Timetable</h1>
          <p className="text-sm text-muted-foreground">
            Paste ZESA's published schedule or load the ZETDC timetable for your area. Saved windows feed the Load-Shedding Planner immediately.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/sae/operations"><Zap className="w-3.5 h-3.5 mr-1.5" /> Open planner</Link>
        </Button>
      </header>

      <div className="grid grid-cols-3 gap-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Upcoming windows</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{outages.length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Total outage</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{Math.round(totalHours * 10) / 10}h</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Zones covered</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{new Set(outages.map((o) => o.zone)).size}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Upload className="w-4 h-4" /> Paste published schedule</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-[11px] text-muted-foreground">
            One window per line: zone, then a date or weekday, then the time range. Examples:
            <span className="font-mono"> Borrowdale 2026-09-22 08:00-11:00</span> ·
            <span className="font-mono"> H12 Monday 17:00 - 21:00</span>
          </p>
          <Textarea
            rows={8}
            value={pasted}
            onChange={(e) => { setPasted(e.target.value); setPreview(null); }}
            placeholder={'Borrowdale  2026-09-22  08:00-11:00\nMsasa industrial  Tuesday  17:00-21:00'}
            className="text-xs font-mono"
          />
          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={fallbackZone}
              onChange={(e) => setFallbackZone(e.target.value)}
              placeholder="Zone to use when a line has none"
              className="max-w-xs text-xs"
            />
            <Button size="sm" variant="outline" disabled={!pasted.trim()} onClick={() => setPreview(parsePastedSchedule(pasted, fallbackZone))}>
              Preview
            </Button>
            <Button size="sm" disabled={!preview?.length || saving} onClick={() => preview && save(preview, 'Schedule imported')}>
              Save {preview?.length ? `${preview.length} window(s)` : ''}
            </Button>
          </div>

          {preview && (
            preview.length ? (
              <div className="rounded-md border border-border">
                <table className="w-full text-xs">
                  <thead className="text-muted-foreground"><tr><th className="text-left p-2">Zone</th><th className="text-left">Day</th><th className="text-left">Window</th><th className="text-right p-2">Hours</th></tr></thead>
                  <tbody>
                    {preview.map((p, i) => (
                      <tr key={i} className="border-t border-border">
                        <td className="p-2 font-medium">{p.zone}</td>
                        <td>{fmtDay(p.start_time)}</td>
                        <td>{fmtTime(p.start_time)}–{fmtTime(p.end_time)}</td>
                        <td className="text-right p-2">{(Math.round(hours(p.start_time, p.end_time) * 10) / 10)}h</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-destructive">No windows recognised — check each line has a time range like 08:00-11:00.</p>
            )
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><CalendarDays className="w-4 h-4" /> Or load the ZETDC timetable for your area</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <select
              className="h-9 rounded-md border border-input bg-background px-2 text-xs"
              value={regionId}
              onChange={(e) => { const r = ZESA_REGIONS.find((x) => x.id === e.target.value)!; setRegionId(r.id); setAreaCode(r.areas[0].code); }}
            >
              {ZESA_REGIONS.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <select className="h-9 rounded-md border border-input bg-background px-2 text-xs" value={areaCode} onChange={(e) => setAreaCode(e.target.value)}>
              {region.areas.map((a) => <option key={a.code} value={a.code}>{a.code} · {a.name}</option>)}
            </select>
            <Button size="sm" disabled={saving} onClick={() => save(generateFromTimetable(regionId, areaCode), 'Published timetable loaded')}>
              Load next 7 days
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Peak periods follow ZETDC's published programme: 08:00–11:00 morning and 17:00–21:00 evening, rotating by area group.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm">Live schedule feeding the planner</CardTitle>
          {outages.length > 0 && <Button size="sm" variant="ghost" className="text-xs text-muted-foreground" onClick={clearAll}>Clear all</Button>}
        </CardHeader>
        <CardContent className="space-y-4">
          {grouped.length === 0 ? (
            <p className="text-xs text-muted-foreground">No upcoming outage windows yet. Paste a schedule above to activate the planner.</p>
          ) : grouped.map(([day, rows]) => (
            <div key={day} className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold">{fmtDay(rows[0].start_time)}</p>
                <Badge variant="secondary" className="text-[10px]">
                  {Math.round(rows.reduce((s, r) => s + hours(r.start_time, r.end_time), 0) * 10) / 10}h
                </Badge>
              </div>
              <table className="w-full text-xs">
                <tbody>
                  {rows.map((o) => (
                    <tr key={o.id} className="border-t border-border">
                      <td className="py-1.5 font-medium">{o.zone}</td>
                      <td>{fmtTime(o.start_time)}–{fmtTime(o.end_time)}</td>
                      <td className="text-muted-foreground">{o.source}</td>
                      <td className="text-right">
                        <button onClick={() => remove(o.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-3 h-3" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
