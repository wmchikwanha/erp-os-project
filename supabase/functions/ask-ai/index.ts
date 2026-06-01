// SAE — Situational Awareness Engine
// Hard-mandated AI: only answers business survival questions for Zimbabwean SMEs.
// Refuses: stocks, weather, generic news, foreign markets, definitions.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace("Bearer ", "");
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages)) throw new Error("messages array required");

    const userId = user.id;
    const today = new Date().toISOString().split("T")[0];

    const [
      { data: invoices },
      { data: payments },
      { data: expenses },
      { data: purchaseOrders },
      { data: products },
      { data: deals },
      { data: projects },
      { data: currencyRates },
      { data: taxObligations },
      { data: loadShedding },
      { data: regulatoryNotices },
    ] = await Promise.all([
      supabase.from("invoices").select("invoice_number, total_amount, status, due_date, issue_date").eq("user_id", userId).limit(200),
      supabase.from("payments").select("amount, payment_date, method, invoice_id").eq("user_id", userId).limit(200),
      supabase.from("expenses").select("amount, category, expense_date, status, description").eq("user_id", userId).limit(200),
      supabase.from("purchase_orders").select("po_number, status, total_amount, created_at").eq("user_id", userId).limit(100),
      supabase.from("products").select("name, sku, unit_price, stock_quantity, reorder_level").eq("user_id", userId).limit(200),
      supabase.from("deals").select("title, value, stage, probability, expected_close, currency").eq("user_id", userId).limit(100),
      supabase.from("projects").select("name, status, budget, actual_cost, progress, end_date").eq("user_id", userId).limit(100),
      supabase.from("currency_rates").select("currency, official_rate, parallel_rate, effective_date").order("effective_date", { ascending: false }).limit(20),
      supabase.from("tax_obligations").select("name, authority, amount, currency, due_date, status").eq("user_id", userId).order("due_date").limit(30),
      supabase.from("load_shedding_schedule").select("zone, start_time, end_time").gte("end_time", new Date().toISOString()).limit(30),
      supabase.from("regulatory_notices").select("title, si_number, effective_date, summary, affected_modules").order("effective_date", { ascending: false }).limit(20),
    ]);

    const ctx: string[] = [];
    const outstanding = (invoices || []).filter((i: any) => i.status !== "paid");
    const overdue = outstanding.filter((i: any) => i.due_date < today);
    const upcomingTax = (taxObligations || []).filter((t: any) => t.status === "pending");
    const lowStock = (products || []).filter((p: any) => p.stock_quantity <= p.reorder_level);

    if (invoices?.length) ctx.push(`## Invoices (${invoices.length} total, ${outstanding.length} outstanding, ${overdue.length} OVERDUE)\n${JSON.stringify(invoices.slice(0, 60), null, 1)}`);
    if (payments?.length) ctx.push(`## Recent Payments (${payments.length})\n${JSON.stringify(payments.slice(0, 30), null, 1)}`);
    if (expenses?.length) ctx.push(`## Expenses (${expenses.length})\n${JSON.stringify(expenses.slice(0, 50), null, 1)}`);
    if (purchaseOrders?.length) ctx.push(`## Purchase Orders\n${JSON.stringify(purchaseOrders, null, 1)}`);
    if (lowStock.length) ctx.push(`## Low Stock Products (${lowStock.length})\n${JSON.stringify(lowStock, null, 1)}`);
    if (deals?.length) ctx.push(`## Open Deals\n${JSON.stringify(deals, null, 1)}`);
    if (projects?.length) ctx.push(`## Projects\n${JSON.stringify(projects, null, 1)}`);
    if (currencyRates?.length) ctx.push(`## Currency Rates (most recent first; parallel = informal market)\n${JSON.stringify(currencyRates, null, 1)}`);
    if (taxObligations?.length) ctx.push(`## Tax & Statutory Obligations (${upcomingTax.length} pending)\n${JSON.stringify(taxObligations, null, 1)}`);
    if (loadShedding?.length) ctx.push(`## Upcoming Load-Shedding Windows\n${JSON.stringify(loadShedding, null, 1)}`);
    if (regulatoryNotices?.length) ctx.push(`## Regulatory Notices (SIs, ZIMRA, labor)\n${JSON.stringify(regulatoryNotices, null, 1)}`);

    const systemPrompt = `You are the **Situational Awareness Engine (SAE)** for StratedgeOS — a contextual business companion for Zimbabwean SMEs. Today is ${today}.

# YOUR MANDATE (strict, non-negotiable)
You exist to inform PURCHASING, HIRING, PRICING, or COMPLIANCE decisions within the next 48 hours, using the user's own operational data and Zimbabwean market reality.

# YOU MUST REFUSE
If the question is about any of the following, refuse politely in one sentence and remind the user of your mandate:
- Stock tickers, foreign exchanges, crypto prices, NYSE/NASDAQ/LSE
- Weather, sports, entertainment, celebrity news
- Generic encyclopaedic definitions ("what is CRM?", "explain blockchain")
- General world news unrelated to Zimbabwean SME operations
- Personal opinions, philosophy, relationship advice

# YOU MUST ANSWER
Survival questions grounded in the data below:
- Multi-currency liquidity, cash position, parallel-vs-official rate exposure
- Supplier payment timing (USD vs RTGS/ZWG trade-offs)
- ZIMRA / SI / local authority compliance deadlines
- Load-shedding impact on production schedules and equipment usage
- Receivables aging, overdue invoices, who to chase first
- Stock reorder timing given supplier lead times
- Project budget burn rate vs progress
- Hiring affordability given current cash position

# RESPONSE FORMAT — MANDATORY
Every substantive answer MUST end with a **Decision Rationale Card** rendered as:

\`\`\`rationale
INPUTS: <2-3 specific data points you used, with numbers>
LOGIC: <how those inputs led to the recommendation, one sentence>
ACTION: <one concrete next step the user should take in the next 48 hours>
\`\`\`

Be concise. Cite specific records and amounts. If the data is insufficient, say so plainly and tell the user exactly which record they need to add.

---

# LIVE OPERATIONAL DATA

${ctx.join("\n\n")}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted. Top up in Settings → Workspace → Usage." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await response.text();
      console.error("AI gateway error:", status, t);
      return new Response(JSON.stringify({ error: "AI service unavailable" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(response.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
  } catch (e) {
    console.error("SAE error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
