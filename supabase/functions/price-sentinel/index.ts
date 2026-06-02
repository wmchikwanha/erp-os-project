// SAE Procurement Scout — picks the right supplier/currency this week
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Quote {
  id: string;
  item: string;
  supplier_id: string | null;
  supplier_name: string | null;
  unit_price: number;
  currency: string;
  quoted_at: string;
  valid_until: string | null;
  lead_time_days: number;
}

interface Rec {
  basket_id: string;
  basket_name: string;
  item: string;
  qty: number;
  unit: string;
  best_supplier: string | null;
  best_price_usd: number | null;
  best_total_usd: number | null;
  trend_pct: number;
  flags: string[];
  inputs: string;
  logic: string;
  action: string;
  recommendation_key: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const service = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const anon = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authErr } = await anon.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authErr || !user) throw new Error("Unauthorized");

    const body = await req.json().catch(() => ({}));
    const basketId: string | undefined = body.basket_id;

    const basketQuery = service.from("material_baskets").select("*").eq("user_id", user.id);
    if (basketId) basketQuery.eq("id", basketId);
    const { data: baskets } = await basketQuery;

    const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);
    const today = new Date().toISOString().slice(0, 10);
    const fourteenDaysAgo = new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10);

    const { data: quotes } = await service
      .from("supplier_quotes")
      .select("*")
      .eq("user_id", user.id)
      .gte("quoted_at", ninetyDaysAgo)
      .order("quoted_at", { ascending: false });

    const { data: rates } = await service
      .from("currency_rates")
      .select("currency, official_rate, parallel_rate, effective_date")
      .order("effective_date", { ascending: false })
      .limit(40);

    // Latest rate per currency
    const rateMap: Record<string, { official: number; parallel: number }> = { USD: { official: 1, parallel: 1 } };
    for (const r of rates || []) {
      if (!rateMap[r.currency]) rateMap[r.currency] = { official: Number(r.official_rate), parallel: Number(r.parallel_rate) };
    }
    const toUSD = (price: number, ccy: string) => {
      const r = rateMap[ccy];
      if (!r) return price; // assume already USD
      // rate stored as units of currency per 1 USD (or local convention) — use parallel by default
      if (ccy === "USD") return price;
      return r.parallel > 0 ? price / r.parallel : price;
    };

    const recs: Rec[] = [];

    for (const basket of baskets || []) {
      const items: Array<{ name: string; qty?: number; unit?: string }> = Array.isArray(basket.items) ? basket.items : [];
      for (const it of items) {
        const itemQuotes = (quotes || []).filter((q: any) => q.item.toLowerCase() === it.name.toLowerCase()) as Quote[];
        const flags: string[] = [];
        if (itemQuotes.length === 0) {
          recs.push({
            basket_id: basket.id,
            basket_name: basket.name,
            item: it.name,
            qty: it.qty || 1,
            unit: it.unit || "unit",
            best_supplier: null,
            best_price_usd: null,
            best_total_usd: null,
            trend_pct: 0,
            flags: ["no_quotes"],
            inputs: "No supplier quotes recorded for this item in the last 90 days.",
            logic: "Cannot compare prices without quotes.",
            action: `Add at least two supplier quotes for "${it.name}" to activate the Procurement Scout.`,
            recommendation_key: `proc-${basket.id}-${it.name}`,
          });
          continue;
        }

        // Normalize to USD
        const withUsd = itemQuotes.map((q) => ({ ...q, usd: toUSD(Number(q.unit_price), q.currency) }));
        // Cheapest current quote (most recent per supplier, then min)
        const latestPerSupplier = new Map<string, typeof withUsd[number]>();
        for (const q of withUsd) {
          const key = q.supplier_id || q.supplier_name || "unknown";
          if (!latestPerSupplier.has(key)) latestPerSupplier.set(key, q);
        }
        const candidates = [...latestPerSupplier.values()].sort((a, b) => a.usd - b.usd);
        const best = candidates[0];
        const qty = it.qty || 1;
        const bestTotal = best.usd * qty;

        // 14d trend
        const recent = withUsd.find((q) => q.quoted_at >= fourteenDaysAgo);
        const older = withUsd.find((q) => q.quoted_at < fourteenDaysAgo);
        const trend = recent && older && older.usd > 0 ? ((recent.usd - older.usd) / older.usd) * 100 : 0;
        if (Math.abs(trend) > 10) flags.push(trend > 0 ? "price_spike" : "price_drop");
        if (latestPerSupplier.size === 1) flags.push("single_source");
        const expiring = withUsd.filter((q) => q.valid_until && q.valid_until < new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));
        if (expiring.length) flags.push("quote_expiring");

        const action = flags.includes("price_spike")
          ? `Hold off — prices up ${trend.toFixed(1)}% in 14 days. Lock in ${best.supplier_name || "best supplier"} at $${best.usd.toFixed(2)}/unit only if you cannot wait 7 days.`
          : flags.includes("single_source")
          ? `Source a second quote for "${it.name}" before ordering — concentration risk. Current best: ${best.supplier_name || "supplier"} at $${best.usd.toFixed(2)}/unit.`
          : `Order ${qty} ${it.unit || "units"} from ${best.supplier_name || "best supplier"} at $${best.usd.toFixed(2)}/unit (total $${bestTotal.toFixed(2)} USD, lead time ${best.lead_time_days}d).`;

        recs.push({
          basket_id: basket.id,
          basket_name: basket.name,
          item: it.name,
          qty,
          unit: it.unit || "unit",
          best_supplier: best.supplier_name,
          best_price_usd: best.usd,
          best_total_usd: bestTotal,
          trend_pct: trend,
          flags,
          inputs: `${latestPerSupplier.size} supplier(s), ${withUsd.length} quotes in 90d, latest parallel rate spread used.`,
          logic: `Cheapest USD-equivalent is ${best.supplier_name || "supplier"} at $${best.usd.toFixed(2)}/unit; 14d trend ${trend >= 0 ? "+" : ""}${trend.toFixed(1)}%.`,
          action,
          recommendation_key: `proc-${basket.id}-${it.name}`,
        });
      }
    }

    return new Response(JSON.stringify({
      generated_at: new Date().toISOString(),
      rates: rateMap,
      recommendations: recs,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("price-sentinel error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
