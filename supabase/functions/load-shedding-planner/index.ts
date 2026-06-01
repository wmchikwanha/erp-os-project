// SAE Load-Shedding Operations Planner — Sprint 2 stub
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
serve((req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  return new Response(JSON.stringify({ status: "scaffolded", message: "Load-Shedding Planner activates in Sprint 2." }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
