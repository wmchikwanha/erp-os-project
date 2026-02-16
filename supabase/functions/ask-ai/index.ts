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

    const [
      { data: contacts },
      { data: deals },
      { data: invoices },
      { data: employees },
      { data: products },
      { data: leaveRequests },
      { data: reviews },
      { data: activities },
      { data: purchaseOrders },
      { data: assets },
      { data: projects },
    ] = await Promise.all([
      supabase.from("contacts").select("name, email, company, type, status, phone").eq("user_id", userId).limit(200),
      supabase.from("deals").select("title, value, stage, probability, expected_close, currency, contacts(name)").eq("user_id", userId).limit(200),
      supabase.from("invoices").select("invoice_number, total_amount, status, due_date, issue_date, contacts(name), line_items").eq("user_id", userId).limit(200),
      supabase.from("employees").select("name, email, department, job_title, role, leave_balance, start_date").eq("user_id", userId).limit(200),
      supabase.from("products").select("name, sku, unit_price, stock_quantity, reorder_level, description").eq("user_id", userId).limit(200),
      supabase.from("leave_requests").select("type, status, start_date, end_date, employees(name)").eq("user_id", userId).limit(100),
      supabase.from("performance_reviews").select("rating, review_period, strengths, areas_for_improvement, goals, comments, employees(name)").eq("user_id", userId).limit(100),
      supabase.from("activities").select("type, notes, due_date, completed_at, contacts(name)").eq("user_id", userId).limit(100),
      supabase.from("purchase_orders").select("po_number, status, total_amount, requested_by, approved_by, notes, created_at, contacts(name)").eq("user_id", userId).limit(200),
      supabase.from("assets").select("name, asset_tag, category, condition, purchase_price, current_value, location, employees(name)").eq("user_id", userId).limit(200),
      supabase.from("projects").select("name, description, status, priority, start_date, end_date, budget, actual_cost, progress, deals(title), employees(name)").eq("user_id", userId).limit(200),
    ]);

    const today = new Date().toISOString().split("T")[0];

    const contextParts: string[] = [];

    if (contacts?.length) contextParts.push(`## Contacts (${contacts.length})\n${JSON.stringify(contacts.slice(0, 100), null, 1)}`);
    if (deals?.length) contextParts.push(`## Deals (${deals.length})\n${JSON.stringify(deals, null, 1)}`);
    if (invoices?.length) {
      const outstanding = invoices.filter((i: any) => i.status !== "paid");
      const overdue = invoices.filter((i: any) => i.status !== "paid" && i.due_date < today);
      contextParts.push(`## Invoices (${invoices.length} total, ${outstanding.length} outstanding, ${overdue.length} overdue)\n${JSON.stringify(invoices, null, 1)}`);
    }
    if (employees?.length) contextParts.push(`## Employees (${employees.length})\n${JSON.stringify(employees, null, 1)}`);
    if (products?.length) {
      const lowStock = products.filter((p: any) => p.stock_quantity <= p.reorder_level);
      contextParts.push(`## Products (${products.length} total, ${lowStock.length} low stock)\n${JSON.stringify(products, null, 1)}`);
    }
    if (leaveRequests?.length) contextParts.push(`## Leave Requests (${leaveRequests.length})\n${JSON.stringify(leaveRequests, null, 1)}`);
    if (reviews?.length) contextParts.push(`## Performance Reviews (${reviews.length})\n${JSON.stringify(reviews, null, 1)}`);
    if (activities?.length) contextParts.push(`## Activities (${activities.length})\n${JSON.stringify(activities.slice(0, 50), null, 1)}`);
    if (purchaseOrders?.length) {
      const pending = purchaseOrders.filter((po: any) => po.status === "submitted");
      contextParts.push(`## Purchase Orders (${purchaseOrders.length} total, ${pending.length} awaiting approval)\n${JSON.stringify(purchaseOrders, null, 1)}`);
    }
    if (assets?.length) {
      const totalValue = assets.reduce((s: number, a: any) => s + Number(a.current_value || 0), 0);
      contextParts.push(`## Assets (${assets.length} total, $${totalValue.toLocaleString()} value)\n${JSON.stringify(assets, null, 1)}`);
    }
    if (projects?.length) {
      const active = projects.filter((p: any) => p.status === "active");
      const overBudget = projects.filter((p: any) => Number(p.actual_cost) > Number(p.budget) && Number(p.budget) > 0);
      contextParts.push(`## Projects (${projects.length} total, ${active.length} active, ${overBudget.length} over budget)\n${JSON.stringify(projects, null, 1)}`);
    }

    const systemPrompt = `You are StratedgeOS AI — a senior business analyst embedded in the StratedgeOS CRM platform. Today is ${today}.

You have FULL access to the organization's live data below. Use it to give precise, data-driven answers. When referencing numbers, cite specific records. When asked for assessments, be candid and actionable.

Your capabilities include:
- Employee assessment: evaluate suitability for roles based on their profiles, department, tenure, and performance reviews
- Financial insights: outstanding invoices, revenue pipeline, cash flow analysis, aging reports
- Product intelligence: stock levels, reorder alerts, pricing analysis, margin insights
- Deal pipeline: win rates, stage distribution, forecast accuracy, risk flags
- HR analytics: leave patterns, headcount by department, performance trends
- Procurement: purchase order status, approval workflows, spend analysis, supplier performance
- Asset management: asset register, depreciation tracking, assignment analysis, condition monitoring
- Project intelligence: budget vs actual, progress tracking, risk identification, resource allocation
- Strategic advice: cross-module insights connecting HR, finance, sales, procurement, and projects

Be concise, use tables/bullets when helpful, and always ground answers in the actual data. If data is insufficient for a conclusion, say so clearly.

---

# LIVE ORGANIZATION DATA

${contextParts.join("\n\n")}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please top up in Settings → Workspace → Usage." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", status, t);
      return new Response(JSON.stringify({ error: "AI service unavailable" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ask-ai error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
