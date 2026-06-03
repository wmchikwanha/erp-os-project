import { useLoadSheddingPlanner } from '@/hooks/useLoadSheddingPlanner';
import RationaleCard from '@/components/sae/RationaleCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { AlertTriangle, Zap, Clock, Battery } from 'lucide-react';

export default function LoadSheddingPlanner() {
  const { data, isLoading, error } = useLoadSheddingPlanner();

  if (isLoading) return <div className="p-6 text-sm text-muted-foreground">Mapping outage exposure…</div>;
  if (error) return <div className="p-6 text-sm text-destructive">Could not load planner: {(error as Error).message}</div>;
  if (!data) return null;

  const urgent = data.recommendations.filter((r) => r.severity === 'urgent');
  const upcoming = data.recommendations.filter((r) => r.severity !== 'urgent');

  return (
    <div className="space-y-6 max-w-5xl">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Load-Shedding Planner</h1>
        <p className="text-sm text-muted-foreground">
          Next 7 days of outage exposure mapped against your shift & equipment plan. Updated {new Date(data.generated_at).toLocaleString()}.
        </p>
      </header>

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
              No outage windows logged. Add this week's ZESA schedule in SAE Control to activate the planner.
            </div>
          )}
        </CardContent>
      </Card>

      {urgent.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-destructive uppercase tracking-wider">Urgent</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {urgent.map((r) => (
              <div key={r.recommendation_key} className="space-y-2">
                <div className="flex items-center gap-2"><Badge variant="destructive">{r.title}</Badge></div>
                <RationaleCard recommendationKey={r.recommendation_key} inputs={r.inputs} logic={r.logic} action={r.action} />
              </div>
            ))}
          </div>
        </section>
      )}

      {upcoming.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Watch-list</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {upcoming.map((r) => (
              <div key={r.recommendation_key} className="space-y-2">
                <div className="flex items-center gap-2"><Badge variant="secondary">{r.title}</Badge></div>
                <RationaleCard recommendationKey={r.recommendation_key} inputs={r.inputs} logic={r.logic} action={r.action} />
              </div>
            ))}
          </div>
        </section>
      )}

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
    </div>
  );
}
