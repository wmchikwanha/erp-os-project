import { useNavigate } from 'react-router-dom';
import { Package, Shield, AlertTriangle, ChevronRight, Zap } from 'lucide-react';
import { usePriceSentinel } from '@/hooks/usePriceSentinel';
import { useRegulatoryDigest } from '@/hooks/useRegulatoryDigest';
import { useLoadSheddingPlanner } from '@/hooks/useLoadSheddingPlanner';

export default function SAESnapshot() {
  const navigate = useNavigate();
  const { data: scout } = usePriceSentinel();
  const { data: digest } = useRegulatoryDigest();
  const { data: planner } = useLoadSheddingPlanner();

  const topProc = (scout?.recommendations || []).filter((r) => !r.flags.includes('no_quotes')).slice(0, 3);
  const topUrgent = (digest?.urgent || []).slice(0, 3);
  const topOps = (planner?.recommendations || []).filter((r) => r.severity !== 'info').slice(0, 3);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <button onClick={() => navigate('/sae/procurement')} className="text-left bg-card border border-border rounded-lg p-4 hover:border-primary transition-colors">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2"><Package className="w-4 h-4 text-primary" /><h3 className="text-sm font-semibold">Procurement actions</h3></div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>
        {topProc.length ? (
          <ul className="space-y-1.5">
            {topProc.map((r) => (
              <li key={r.recommendation_key} className="text-xs flex items-start gap-2">
                {r.flags.includes('price_spike') && <AlertTriangle className="w-3 h-3 text-destructive shrink-0 mt-0.5" />}
                <span className="line-clamp-2">{r.item}: {r.action}</span>
              </li>
            ))}
          </ul>
        ) : <p className="text-xs text-muted-foreground">Add a basket + quotes to see procurement signals.</p>}
      </button>

      <button onClick={() => navigate('/sae/compliance')} className="text-left bg-card border border-border rounded-lg p-4 hover:border-primary transition-colors">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2"><Shield className="w-4 h-4 text-destructive" /><h3 className="text-sm font-semibold">Compliance — {digest?.urgent.length || 0} urgent, {digest?.upcoming.length || 0} upcoming</h3></div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>
        {topUrgent.length ? (
          <ul className="space-y-1.5">
            {topUrgent.map((c) => (
              <li key={c.recommendation_key} className="text-xs flex items-start gap-2">
                <span className="text-destructive font-semibold shrink-0">{c.days_until}d</span>
                <span className="line-clamp-2">{c.title} — {c.action}</span>
              </li>
            ))}
          </ul>
        ) : <p className="text-xs text-muted-foreground">No urgent deadlines.</p>}
      </button>

      <button onClick={() => navigate('/sae/operations')} className="text-left bg-card border border-border rounded-lg p-4 hover:border-primary transition-colors">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2"><Zap className="w-4 h-4 text-amber-500" /><h3 className="text-sm font-semibold">Load-shedding — {planner?.total_outage_hours || 0}h next 7d</h3></div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>
        {topOps.length ? (
          <ul className="space-y-1.5">
            {topOps.map((r) => (
              <li key={r.recommendation_key} className="text-xs flex items-start gap-2">
                {r.severity === 'urgent' && <AlertTriangle className="w-3 h-3 text-destructive shrink-0 mt-0.5" />}
                <span className="line-clamp-2">{r.title} — {r.action}</span>
              </li>
            ))}
          </ul>
        ) : <p className="text-xs text-muted-foreground">No outage clashes detected this week.</p>}
      </button>
    </div>
  );
}
