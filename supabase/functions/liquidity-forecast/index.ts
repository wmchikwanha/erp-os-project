// SAE Liquidity Guardian — multi-currency forward cash position
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type Bucket = { label: string; days: number };
const BUCKETS: Bucket[] = [
  { label: "7d", days: 7 },
  { label: "14d", days: 14 },
  { label: "30d", days: 30 },
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const url = Deno.env.get("SUPABASE_URL")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anon = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error } = await anon.auth.getUser(authHeader.replace("Bearer ", ""));
    if (error || !user) throw new Error("Unauthorized");

    const supabase = createClient(url, service);
    const today = new Date();
    const horizon = new Date();
    horizon.setDate(today.getDate() + 30);

    const [
      { data: invoices },
      { data: expenses },
      { data: taxes },
      { data: rates },
    ] = await Promise.all([
      supabase.from("invoices").select("total_amount, due_date, status").eq("user_id", user.id).neq("status", "paid").lte("due_date", horizon.toISOString().slice(0, 10)),
      supabase.from("expenses").select("amount, expense_date, status, category").eq("user_id", user.id).gte("expense_date", today.toISOString().slice(0, 10)),
      supabase.from("tax_obligations").select("amount, currency, due_date, status").eq("user_id", user.id).neq("status", "paid").lte("due_date", horizon.toISOString().slice(0, 10)),
      supabase.from("currency_rates").select("currency, official_rate, parallel_rate, effective_date").order("effective_date", { ascending: false }),
    ]);

    // Latest rate per currency
    const rateMap: Record<string, { official: number; parallel: number }> = {};
    (rates || []).forEach((r: any) => {
      if (!rateMap[r.currency]) rateMap[r.currency] = { official: Number(r.official_rate), parallel: Number(r.parallel_rate) };
    });

    const result = BUCKETS.map((b) => {
      const cutoff = new Date();
      cutoff.setDate(today.getDate() + b.days);
      const inflows = (invoices || []).filter((i: any) => new Date(i.due_date) <= cutoff).reduce((s: number, i: any) => s + Number(i.total_amount || 0), 0);
      const outflowsExp = (expenses || []).filter((e: any) => new Date(e.expense_date) <= cutoff).reduce((s: number, e: any) => s + Number(e.amount || 0), 0);
      const outflowsTax = (taxes || []).filter((t: any) => new Date(t.due_date) <= cutoff).reduce((s: number, t: any) => s + Number(t.amount || 0), 0);
      const net = inflows - outflowsExp - outflowsTax;
      return { bucket: b.label, days: b.days, inflows, outflows: outflowsExp + outflowsTax, net, shortfall: net < 0 };
    });

    return new Response(JSON.stringify({
      generated_at: today.toISOString(),
      rates: rateMap,
      forecast: result,
      raw: { invoice_count: invoices?.length || 0, expense_count: expenses?.length || 0, tax_count: taxes?.length || 0 },
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
