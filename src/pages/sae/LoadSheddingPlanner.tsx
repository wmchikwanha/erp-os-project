import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLoadSheddingPlanner, type LoadShedRec } from '@/hooks/useLoadSheddingPlanner';
import RationaleCard from '@/components/sae/RationaleCard';
import CreateActionPlanDialog from '@/components/sae/CreateActionPlanDialog';
import CollisionRulesDialog from '@/components/sae/CollisionRulesDialog';
import OutageActionPlansBoard from '@/components/sae/OutageActionPlansBoard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { AlertTriangle, Zap, Clock, Battery, Plus, Settings2, ClipboardList } from 'lucide-react';

export default function LoadSheddingPlanner() {
  const { data, isLoading, error } = useLoadSheddingPlanner();
  const [planFor, setPlanFor] = useState<LoadShedRec | null>(null);
  const [rulesOpen, setRulesOpen] = useState(false);

  if (isLoading) return <div className="p-6 text-sm text-muted-foreground">Mapping outage exposure…</div>;
  if (error) return <div className="p-6 text-sm text-destructive">Could not load planner: {(error as Error).message}</div>;
  if (!data) return null;

  const urgent = data.recommendations.filter((r) => r.severity === 'urgent');
  const upcoming = data.recommendations.filter((r) => r.severity !== 'urgent');

  const renderRec = (r: LoadShedRec) => (
    <div key={r.recommendation_key} className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant={r.severity === 'urgent' ? 'destructive' : 'secondary'}>{r.title}</Badge>
        <Button size="sm" variant="outline" className="h-6 text-[11px] px-2" onClick={() => setPlanFor(r)}>
          <Plus className="w-3 h-3 mr-1" /> Create plan
        </Button>
      </div>
      <RationaleCard recommendationKey={r.recommendation_key} inputs={r.inputs} logic={r.logic} action={r.action} />
    </div>
  );

  return (
    <div className="space-y-6 max-w-5xl">
      <header className="space-y-1 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Load-Shedding Planner</h1>
          <p className="text-sm text-muted-foreground">
            Next 7 days of outage exposure mapped against your shift &amp; equipment plan. Updated {new Date(data.generated_at).toLocaleString()}.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/sae/zesa-timetable">ZESA timetable</Link>
          </Button>
          <Button variant="outline" size="sm" onClick={() => setRulesOpen(true)}>
            <Settings2 className="w-3.5 h-3.5 mr-1.5" /> Collision rules
          </Button>
        </div>
      </header>

      {data.rules && (
        <div className="text-[11px] text-muted-foreground flex flex-wrap gap-x-3 gap-y-1">
          <span>Min overlap: <strong>{data.rules.min_overlap_hours}h</strong></span>
          <span>Urgent ≥ <strong>{data.rules.severity_threshold_hours}h</strong></span>
          <span>Urgent count: <strong>{data.rules.urgent_collision_count}</strong></span>
          <span>Suggested shift: <strong>{data.rules.auto_shift_minutes}m</strong></span>
          {data.rules.ignore_zones.length > 0 && <span>Ignored: <strong>{data.rules.ignore_zones.join(', ')}</strong></span>}
          {!data.rules.enabled && <Badge variant="destructive" className="text-[9px]">Detection off</Badge>}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2"><Zap className="w-3.5 h-3.5" /> Total outage</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{data.total_outage_hours}h</div><p className="text-[11px] text-muted-foreground mt-1">{data.window_count} windows</p></CardContent>
        </Card>
        <Card className={data.collision_count > 0 ? 'border-destructive/50' : ''}>
          <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2"><Clock className="w-3.5 h-3.5" /> Shift clashes</CardTitle></CardHeader>
          <CardContent><div className={`text-2xl font-bold ${data.collision_count > 0 ? 'text-destructive' : ''}`}>{data.collision_count}</div><p className="text-[11px] text-muted-foreground mt-1">overlapping shifts</p></CardContent>
        </Card>
        <Card className={data.exposed_assets > 0 ? 'border-amber-500/40' : ''}>
          <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2"><Battery className="w-3.5 h-3.5" /> Power-sensitive kit</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{data.exposed_assets}</div><p className="text-[11px] text-muted-foreground mt-1">checked out</p></CardContent>
        </Card>
        <Card className={urgent.length > 0 ? 'border-destructive/50' : ''}>
          <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2"><AlertTriangle className="w-3.5 h-3.5" /> Urgent actions</CardTitle></CardHeader>
          <CardContent><div className={`text-2xl font-bold ${urgent.length > 0 ? 'text-destructive' : ''}`}>{urgent.length}</div><p className="text-[11px] text-muted-foreground mt-1">in next 7 days</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Daily outage hours</CardTitle></CardHeader>
        <CardContent style={{ height: 240 }}>
          {data.daily.length ? (
            <ResponsiveContainer>
              <BarChart data={data.daily}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}h`} />
                <Tooltip formatter={(v: number) => `${v}h`} />
                <Bar dataKey="outage_hours" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
              No outage windows logged. <Link to="/sae/zesa-timetable" className="underline ml-1">Paste ZESA's published schedule</Link> to activate the planner.
            </div>
          )}
        </CardContent>
      </Card>

      {urgent.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-destructive uppercase tracking-wider">Urgent</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{urgent.map(renderRec)}</div>
        </section>
      )}

      {upcoming.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Watch-list</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{upcoming.map(renderRec)}</div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <ClipboardList className="w-3.5 h-3.5" /> Action plans
        </h2>
        <OutageActionPlansBoard />
      </section>

      {data.collisions.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Shift collisions ({data.collisions.length})</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-xs">
              <thead className="text-muted-foreground">
                <tr><th className="text-left py-1">Date</th><th className="text-left">Shift</th><th className="text-left">Zone</th><th className="text-left">Outage</th><th className="text-right">Lost</th></tr>
              </thead>
              <tbody>
                {data.collisions.map((c) => (
                  <tr key={c.schedule_id + c.zone} className="border-t border-border">
                    <td className="py-1.5">{c.work_date}</td>
                    <td>{c.shift}</td>
                    <td>{c.zone}</td>
                    <td>{c.outage_window}</td>
                    <td className="text-right font-medium text-destructive">{c.overlap_hours}h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <CreateActionPlanDialog open={!!planFor} onOpenChange={(v) => !v && setPlanFor(null)} recommendation={planFor} />
      <CollisionRulesDialog open={rulesOpen} onOpenChange={setRulesOpen} />
    </div>
  );
}
