// SAE Compliance Monitor — surfaces upcoming regulatory + tax deadlines
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Card {
  recommendation_key: string;
  kind: "notice" | "tax";
  id: string;
  title: string;
  authority?: string;
  due_date: string;
  days_until: number;
  affected_modules: string[];
  amount?: number;
  currency?: string;
  inputs: string;
  logic: string;
  action: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");
    const url = Deno.env.get("SUPABASE_URL")!;
    const service = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const anon = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error } = await anon.auth.getUser(authHeader.replace("Bearer ", ""));
    if (error || !user) throw new Error("Unauthorized");

    const today = new Date();
    const sixty = new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10);
    const thirtyAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);

    const [
      { data: notices },
      { data: taxes },
      { data: acks },
      { count: empCount },
      { count: prodCount },
      { count: invCount },
    ] = await Promise.all([
      service.from("regulatory_notices").select("*").gte("effective_date", thirtyAgo).lte("effective_date", sixty).order("effective_date"),
      service.from("tax_obligations").select("*").eq("user_id", user.id).eq("status", "pending").lte("due_date", sixty).order("due_date"),
      service.from("notice_acknowledgements").select("notice_id").eq("user_id", user.id),
      service.from("employees").select("*", { count: "exact", head: true }),
      service.from("products").select("*", { count: "exact", head: true }).eq("user_id", user.id),
      service.from("invoices").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    ]);

    const ackSet = new Set((acks || []).map((a: any) => a.notice_id));
    const moduleHas = (m: string) => {
      if (m === "payroll" || m === "hr") return (empCount || 0) > 0;
      if (m === "inventory" || m === "imports") return (prodCount || 0) > 0;
      if (m === "vat" || m === "invoicing") return (invCount || 0) > 0;
      return true;
    };

    const cards: Card[] = [];
    for (const n of notices || []) {
      if (ackSet.has(n.id)) continue;
      const mods: string[] = Array.isArray(n.affected_modules) ? n.affected_modules : [];
      const relevant = mods.length === 0 || mods.some(moduleHas);
      if (!relevant) continue;
      const due = new Date(n.effective_date);
      const days = Math.ceil((due.getTime() - today.getTime()) / 86400000);
      cards.push({
        recommendation_key: `notice-${n.id}`,
        kind: "notice",
        id: n.id,
        title: n.title,
        authority: n.si_number ? `SI ${n.si_number}` : undefined,
        due_date: n.effective_date,
        days_until: days,
        affected_modules: mods,
        inputs: `Regulatory notice${n.si_number ? ` (SI ${n.si_number})` : ""} effective ${n.effective_date}. Affects: ${mods.join(", ") || "all"}.`,
        logic: `You have ${mods.map((m) => `${m}=${moduleHas(m)}`).join(", ") || "general exposure"}; deadline in ${days} day(s).`,
        action: n.summary || `Review the notice and update affected processes before ${n.effective_date}.`,
      });
    }
    for (const t of taxes || []) {
      const due = new Date(t.due_date);
      const days = Math.ceil((due.getTime() - today.getTime()) / 86400000);
      cards.push({
        recommendation_key: `tax-${t.id}`,
        kind: "tax",
        id: t.id,
        title: t.name,
        authority: t.authority,
        due_date: t.due_date,
        days_until: days,
        affected_modules: ["cashflow"],
        amount: Number(t.amount),
        currency: t.currency,
        inputs: `${t.authority} obligation "${t.name}", ${t.currency} ${Number(t.amount).toLocaleString()}, due ${t.due_date}.`,
        logic: `${days} day(s) until due; status pending.`,
        action: days <= 7
          ? `Settle ${t.currency} ${Number(t.amount).toLocaleString()} to ${t.authority} this week — penalties accrue after ${t.due_date}.`
          : `Reserve ${t.currency} ${Number(t.amount).toLocaleString()} for ${t.authority} by ${t.due_date}; do not commit it to other outflows.`,
      });
    }

    cards.sort((a, b) => a.days_until - b.days_until);
    const urgent = cards.filter((c) => c.days_until <= 14);
    const upcoming = cards.filter((c) => c.days_until > 14);

    return new Response(JSON.stringify({
      generated_at: new Date().toISOString(),
      urgent,
      upcoming,
      dismissed_count: ackSet.size,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("regulatory-digest error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
