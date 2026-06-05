// SAE — Load-Shedding Operations Planner (Sprint 4)
// Cross-references upcoming outage windows against work schedules + checked-out
// equipment to surface the next 7 days of disruptions, ranked by impact.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type Window = { id: string; zone: string; start_time: string; end_time: string };

function hoursBetween(a: string, b: string) {
  return (new Date(b).getTime() - new Date(a).getTime()) / 36e5;
}

function dayKey(iso: string) {
  return new Date(iso).toISOString().slice(0, 10);
}

function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return new Date(aStart) < new Date(bEnd) && new Date(bStart) < new Date(aEnd);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const anon = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authErr } = await anon.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authErr || !user) throw new Error("Unauthorized");
    const userId = user.id;

    const now = new Date();
    const horizon = new Date(now.getTime() + 7 * 86400_000);

    const [
      { data: windows },
      { data: schedules },
      { data: checkouts },
      { data: assets },
      { data: rulesRow },
    ] = await Promise.all([
      supabase
        .from("load_shedding_schedule")
        .select("id, zone, start_time, end_time")
        .gte("end_time", now.toISOString())
        .lte("start_time", horizon.toISOString())
        .order("start_time"),
      supabase
        .from("work_schedules")
        .select("id, work_date, shift_start, shift_end, site_id, employee_id")
        .eq("user_id", userId)
        .gte("work_date", now.toISOString().slice(0, 10))
        .lte("work_date", horizon.toISOString().slice(0, 10)),
      supabase
        .from("equipment_checkouts")
        .select("id, asset_id, status, expected_return_date")
        .eq("user_id", userId)
        .eq("status", "checked-out"),
      supabase
        .from("assets")
        .select("id, name, category")
        .eq("user_id", userId),
      supabase
        .from("shift_collision_rules")
        .select("min_overlap_hours, severity_threshold_hours, urgent_collision_count, auto_shift_minutes, ignore_zones, enabled")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

    const rules = {
      min_overlap_hours: rulesRow?.min_overlap_hours ?? 1,
      severity_threshold_hours: rulesRow?.severity_threshold_hours ?? 4,
      urgent_collision_count: rulesRow?.urgent_collision_count ?? 3,
      auto_shift_minutes: rulesRow?.auto_shift_minutes ?? 60,
      ignore_zones: (rulesRow?.ignore_zones ?? []) as string[],
      enabled: rulesRow?.enabled ?? true,
    };


    const ignoreZones = new Set(rules.ignore_zones.map((z) => z.toLowerCase()));
    const allWindows = ((windows || []) as Window[]).filter((w) => !ignoreZones.has(w.zone.toLowerCase()));

    // Daily roll-up of outage hours (per zone, summed)
    const dayMap: Record<string, { hours: number; zones: Set<string>; windows: Window[] }> = {};
    for (const w of allWindows) {
      const day = dayKey(w.start_time);
      const bucket = (dayMap[day] ||= { hours: 0, zones: new Set(), windows: [] });
      bucket.hours += hoursBetween(w.start_time, w.end_time);
      bucket.zones.add(w.zone);
      bucket.windows.push(w);
    }

    const daily = Object.entries(dayMap)
      .map(([date, b]) => ({
        date,
        outage_hours: Math.round(b.hours * 10) / 10,
        zones: Array.from(b.zones),
        window_count: b.windows.length,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Find shift collisions: scheduled work that overlaps with an outage window,
    // filtered by configurable minimum overlap.
    const collisions: Array<{
      schedule_id: string;
      work_date: string;
      shift: string;
      zone: string;
      outage_window: string;
      overlap_hours: number;
      severity: 'urgent' | 'upcoming';
    }> = [];

    for (const s of (schedules || []) as any[]) {
      if (!s.shift_start || !s.shift_end) continue;
      const shiftStart = new Date(`${s.work_date}T${s.shift_start}`).toISOString();
      const shiftEnd = new Date(`${s.work_date}T${s.shift_end}`).toISOString();
      for (const w of allWindows) {
        if (overlaps(shiftStart, shiftEnd, w.start_time, w.end_time)) {
          const ovStart = new Date(Math.max(+new Date(shiftStart), +new Date(w.start_time))).toISOString();
          const ovEnd = new Date(Math.min(+new Date(shiftEnd), +new Date(w.end_time))).toISOString();
          const overlap_hours = Math.round(hoursBetween(ovStart, ovEnd) * 10) / 10;
          if (overlap_hours < rules.min_overlap_hours) continue;
          collisions.push({
            schedule_id: s.id,
            work_date: s.work_date,
            shift: `${s.shift_start}–${s.shift_end}`,
            zone: w.zone,
            outage_window: `${new Date(w.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}–${new Date(w.end_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
            overlap_hours,
            severity: overlap_hours >= rules.severity_threshold_hours ? 'urgent' : 'upcoming',
          });
        }
      }
    }


    // Equipment exposure: count checked-out battery / power-sensitive assets
    const powerAssets = (assets || []).filter((a: any) =>
      /battery|charger|laptop|tool|drill|compressor|pump|saw/i.test(`${a.name} ${a.category || ""}`),
    );
    const exposedAssets = (checkouts || []).filter((c: any) =>
      powerAssets.some((a: any) => a.id === c.asset_id),
    ).length;

    const totalHours = daily.reduce((s, d) => s + d.outage_hours, 0);
    const worstDay = daily.reduce<typeof daily[0] | null>((w, d) => (!w || d.outage_hours > w.outage_hours ? d : w), null);

    const recommendations = [];

    if (worstDay) {
      recommendations.push({
        recommendation_key: `loadshed-worst-${worstDay.date}`,
        severity: worstDay.outage_hours >= 8 ? "urgent" : "upcoming",
        title: `Heaviest outage: ${worstDay.date}`,
        inputs: `${worstDay.outage_hours}h across ${worstDay.window_count} window(s), zones: ${worstDay.zones.join(", ")}.`,
        logic: `Single-day cumulative downtime exceeds typical shift recovery capacity.`,
        action: worstDay.outage_hours >= 8
          ? `Reschedule non-urgent site work on ${worstDay.date} or pre-fuel the generator the evening before.`
          : `Move power-hungry tasks (welding, compressor) outside the outage windows on ${worstDay.date}.`,
      });
    }

    if (collisions.length) {
      const c = collisions[0];
      recommendations.push({
        recommendation_key: `loadshed-collision-${c.schedule_id}`,
        severity: collisions.length >= 3 ? "urgent" : "upcoming",
        title: `${collisions.length} shift(s) overlap an outage`,
        inputs: `First clash: ${c.work_date} shift ${c.shift} hit by ${c.zone} outage ${c.outage_window} (${c.overlap_hours}h lost).`,
        logic: `Crews on site without power lose billable hours and risk safety lighting gaps.`,
        action: `Shift the affected crew earlier/later by ${Math.ceil(c.overlap_hours)}h or stage battery lighting before the window.`,
      });
    }

    if (exposedAssets > 0) {
      recommendations.push({
        recommendation_key: `loadshed-equipment-${new Date().toISOString().slice(0, 10)}`,
        severity: "upcoming",
        title: `${exposedAssets} power-sensitive asset(s) checked out`,
        inputs: `${exposedAssets} battery/charger-dependent units in the field across ${(checkouts || []).length} active checkouts.`,
        logic: `Mid-week outages will leave field crews without working tools if batteries are not topped up tonight.`,
        action: `Recall the units for an overnight charge or issue spare batteries before the next outage window.`,
      });
    }

    if (!recommendations.length) {
      recommendations.push({
        recommendation_key: `loadshed-clear-${new Date().toISOString().slice(0, 10)}`,
        severity: "info",
        title: "No load-shedding clashes detected",
        inputs: `${allWindows.length} outage window(s) in the next 7 days, no shift collisions.`,
        logic: `Either the schedule is light or your operations are already clear of the affected zones.`,
        action: `Add this week's ZESA schedule via the SAE Control Panel to keep the planner accurate.`,
      });
    }

    return new Response(
      JSON.stringify({
        generated_at: new Date().toISOString(),
        total_outage_hours: Math.round(totalHours * 10) / 10,
        window_count: allWindows.length,
        collision_count: collisions.length,
        exposed_assets: exposedAssets,
        daily,
        collisions: collisions.slice(0, 20),
        windows: allWindows.slice(0, 50),
        recommendations,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("load-shedding-planner error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
