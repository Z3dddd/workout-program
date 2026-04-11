import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

type SyncEntry = {
  week: number;
  day: number;
  exercise: number;
  set: number;
  weight: number | null;
  updatedAt?: string;
};

type SyncCardioEntry = {
  week: number;
  day: number;
  stairMinutes: number;
  treadmillMinutes: number;
  totalMinutes: number;
  stairsClimbed: number;
  treadmillDistance: number;
  clear?: boolean;
  updatedAt?: string;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-sync-pin",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

function unauthorized(message = "Invalid PIN") {
  return new Response(JSON.stringify({ error: message }), {
    status: 401,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}

function badRequest(message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status: 400,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}

function normalizeEntry(entry: SyncEntry) {
  return {
    week_num: entry.week,
    day_idx: entry.day,
    exercise_idx: entry.exercise,
    set_num: entry.set,
    weight: entry.weight,
    updated_at: entry.updatedAt ?? new Date().toISOString()
  };
}

function isValidSyncEntry(entry: SyncEntry) {
  const hasIndices = Number.isInteger(entry.week)
    && Number.isInteger(entry.day)
    && Number.isInteger(entry.exercise)
    && Number.isInteger(entry.set);
  if (!hasIndices) return false;
  if (entry.week < 1 || entry.week > 12) return false;
  if (entry.day < 0 || entry.day > 5) return false;
  if (entry.exercise < 0 || entry.set < 1) return false;
  if (entry.weight !== null && !Number.isFinite(entry.weight)) return false;
  return true;
}

function toNumberOrZero(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function normalizeCardioEntry(entry: SyncCardioEntry) {
  return {
    week_num: entry.week,
    day_idx: entry.day,
    stair_minutes: toNumberOrZero(entry.stairMinutes),
    treadmill_minutes: toNumberOrZero(entry.treadmillMinutes),
    total_minutes: toNumberOrZero(entry.totalMinutes),
    stairs_climbed: Math.trunc(toNumberOrZero(entry.stairsClimbed)),
    treadmill_distance: toNumberOrZero(entry.treadmillDistance),
    updated_at: entry.updatedAt ?? new Date().toISOString()
  };
}

function isValidSyncCardioEntry(entry: SyncCardioEntry) {
  const hasIndices = Number.isInteger(entry.week) && Number.isInteger(entry.day);
  if (!hasIndices) return false;
  if (entry.week < 1 || entry.week > 12) return false;
  if (entry.day < 1 || entry.day > 6) return false;

  const values = [
    entry.stairMinutes,
    entry.treadmillMinutes,
    entry.totalMinutes,
    entry.stairsClimbed,
    entry.treadmillDistance
  ];
  return values.every((value) => Number.isFinite(value));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return badRequest("Only POST is supported");
  }

  const expectedPin = Deno.env.get("SYNC_PIN");
  const providedPin = req.headers.get("x-sync-pin");
  if (!expectedPin || !providedPin || providedPin !== expectedPin) {
    return unauthorized();
  }

  const supabaseUrl = Deno.env.get("PROJECT_URL") ?? Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: "Missing Supabase secrets" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  let body: { action?: string; entries?: SyncEntry[]; cardioEntries?: SyncCardioEntry[] };
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON payload");
  }

  const action = body.action;
  if (!action || (action !== "pull" && action !== "push")) {
    return badRequest("action must be pull or push");
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false }
  });

  if (action === "pull") {
    const { data, error } = await supabase
      .from("workout_entries")
      .select("week_num,day_idx,exercise_idx,set_num,weight,updated_at")
      .order("week_num", { ascending: true })
      .order("day_idx", { ascending: true })
      .order("exercise_idx", { ascending: true })
      .order("set_num", { ascending: true });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const { data: cardioData, error: cardioError } = await supabase
      .from("cardio_entries")
      .select("week_num,day_idx,stair_minutes,treadmill_minutes,total_minutes,stairs_climbed,treadmill_distance,updated_at")
      .order("week_num", { ascending: true })
      .order("day_idx", { ascending: true });

    if (cardioError) {
      return new Response(JSON.stringify({ error: cardioError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({
      entries: (data ?? []).map((row) => ({
        week: row.week_num,
        day: row.day_idx,
        exercise: row.exercise_idx,
        set: row.set_num,
        weight: Number(row.weight),
        updatedAt: row.updated_at
      })),
      cardioEntries: (cardioData ?? []).map((row) => ({
        week: row.week_num,
        day: row.day_idx,
        stairMinutes: Number(row.stair_minutes ?? 0),
        treadmillMinutes: Number(row.treadmill_minutes ?? 0),
        totalMinutes: Number(row.total_minutes ?? 0),
        stairsClimbed: Number(row.stairs_climbed ?? 0),
        treadmillDistance: Number(row.treadmill_distance ?? 0),
        updatedAt: row.updated_at
      }))
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  const entries = Array.isArray(body.entries) ? body.entries : [];
  const cardioEntries = Array.isArray(body.cardioEntries) ? body.cardioEntries : [];
  if (!entries.length && !cardioEntries.length) {
    return badRequest("entries or cardioEntries are required for push");
  }

  for (const entry of entries) {
    if (!isValidSyncEntry(entry)) {
      return badRequest("One or more entries are invalid");
    }
  }
  for (const entry of cardioEntries) {
    if (!isValidSyncCardioEntry(entry)) {
      return badRequest("One or more cardio entries are invalid");
    }
  }

  const toUpsert = entries.filter((entry) => entry.weight !== null).map(normalizeEntry);
  const toDelete = entries.filter((entry) => entry.weight === null);
  const cardioToUpsert = cardioEntries
    .filter((entry) => entry.clear !== true)
    .map(normalizeCardioEntry);
  const cardioToDelete = cardioEntries.filter((entry) => entry.clear === true);

  if (toUpsert.length) {
    const { error } = await supabase
      .from("workout_entries")
      .upsert(toUpsert, { onConflict: "week_num,day_idx,exercise_idx,set_num" });
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
  }

  for (const item of toDelete) {
    const { error } = await supabase
      .from("workout_entries")
      .delete()
      .eq("week_num", item.week)
      .eq("day_idx", item.day)
      .eq("exercise_idx", item.exercise)
      .eq("set_num", item.set);
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
  }

  if (cardioToUpsert.length) {
    const { error } = await supabase
      .from("cardio_entries")
      .upsert(cardioToUpsert, { onConflict: "week_num,day_idx" });
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
  }

  for (const item of cardioToDelete) {
    const { error } = await supabase
      .from("cardio_entries")
      .delete()
      .eq("week_num", item.week)
      .eq("day_idx", item.day);
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
  }

  await supabase
    .from("sync_meta")
    .upsert({ id: 1, last_synced_at: new Date().toISOString() }, { onConflict: "id" });

  return new Response(JSON.stringify({
    ok: true,
    upserted: toUpsert.length,
    deleted: toDelete.length,
    cardioUpserted: cardioToUpsert.length,
    cardioDeleted: cardioToDelete.length
  }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
});
