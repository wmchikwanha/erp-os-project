import { useLiquidityForecast } from '@/hooks/useLiquidityForecast';
import RationaleCard from '@/components/sae/RationaleCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';

const fmt = (n: number) => `$${Math.round(n).toLocaleString()}`;

export default function LiquidityGuardian() {
  const { data, isLoading, error } = useLiquidityForecast();

  if (isLoading) return <div className="p-6 text-sm text-muted-foreground">Computing forward cash position…</div>;
  if (error) return <div className="p-6 text-sm text-destructive">Could not load forecast: {(error as Error).message}</div>;
  if (!data) return null;

  const worst = data.forecast.reduce((w, f) => (f.net < w.net ? f : w), data.forecast[0]);
  const action = worst.shortfall
    ? `Shortfall of ${fmt(Math.abs(worst.net))} expected within ${worst.days} days — chase the largest overdue invoice or defer a discretionary expense today.`
    : `Cushion of ${fmt(worst.net)} across the 30-day horizon — safe to settle one supplier early to capture goodwill.`;

  return (
    <div className="space-y-6 max-w-5xl">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Liquidity Guardian</h1>
        <p className="text-sm text-muted-foreground">Forward cash position, parallel-rate aware. Updated {new Date(data.generated_at).toLocaleString()}.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {data.forecast.map((b) => (
          <Card key={b.bucket} className={b.shortfall ? 'border-destructive/50' : ''}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                Next {b.bucket}
                {b.shortfall && <AlertTriangle className="w-3.5 h-3.5 text-destructive" />}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${b.shortfall ? 'text-destructive' : 'text-foreground'}`}>{fmt(b.net)}</div>
              <div className="flex gap-3 text-[11px] text-muted-foreground mt-1">
                <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3 text-emerald-500" />{fmt(b.inflows)}</span>
                <span className="flex items-center gap-1"><TrendingDown className="w-3 h-3 text-destructive" />{fmt(b.outflows)}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Inflows vs Outflows</CardTitle></CardHeader>
        <CardContent style={{ height: 260 }}>
          <ResponsiveContainer>
            <BarChart data={data.forecast}>
              <XAxis dataKey="bucket" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <ReferenceLine y={0} stroke="hsl(var(--border))" />
              <Bar dataKey="inflows" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="outflows" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <RationaleCard
        recommendationKey={`liquidity-${worst.bucket}-${data.generated_at.slice(0, 10)}`}
        inputs={`${data.raw.invoice_count} unpaid invoices, ${data.raw.expense_count} upcoming expenses, ${data.raw.tax_count} pending tax obligations.`}
        logic={`Worst forward bucket is ${worst.bucket} with a net position of ${fmt(worst.net)}.`}
        action={action}
      />

      {Object.keys(data.rates).length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Latest Currency Rates</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-xs">
              <thead className="text-muted-foreground">
                <tr><th className="text-left py-1">Currency</th><th className="text-right">Official</th><th className="text-right">Parallel</th><th className="text-right">Spread</th></tr>
              </thead>
              <tbody>
                {Object.entries(data.rates).map(([c, r]) => {
                  const spread = r.official > 0 ? ((r.parallel - r.official) / r.official) * 100 : 0;
                  return (
                    <tr key={c} className="border-t border-border">
                      <td className="py-1.5 font-medium">{c}</td>
                      <td className="text-right">{r.official.toFixed(2)}</td>
                      <td className="text-right">{r.parallel.toFixed(2)}</td>
                      <td className={`text-right ${Math.abs(spread) > 10 ? 'text-amber-500' : ''}`}>{spread.toFixed(1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
