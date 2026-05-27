import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

type AccessCodeRow = {
  id: string;
  code: string;
  is_admin: boolean;
};

// Tiny in-memory cache to avoid hitting access_codes on every request
const codeCache = new Map<string, { row: AccessCodeRow; until: number }>();
const CACHE_MS = 60_000;

async function resolveAccessCode(
  sb: ReturnType<typeof createClient>,
  rawCode: unknown,
): Promise<AccessCodeRow | null> {
  if (typeof rawCode !== "string") return null;
  const code = rawCode.trim().toUpperCase();
  if (!/^[A-Z0-9]{8}$/.test(code)) return null;

  const now = Date.now();
  const cached = codeCache.get(code);
  if (cached && cached.until > now) return cached.row;

  const { data, error } = await sb
    .from("access_codes")
    .select("id, code, is_admin")
    .eq("code", code)
    .maybeSingle();

  if (error || !data) return null;
  const row = data as AccessCodeRow;
  codeCache.set(code, { row, until: now + CACHE_MS });
  return row;
}

// --- handlers ---

async function handleLogbook(
  sb: ReturnType<typeof createClient>,
  user: AccessCodeRow,
  action: string,
  payload: any,
) {
  switch (action) {
    case "list": {
      const from = Number(payload?.from ?? 0);
      const to = Number(payload?.to ?? from + 999);
      const { data, error } = await sb
        .from("logbook_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: true })
        .range(from, to);
      if (error) return json({ error: error.message }, 500);
      return json({ data });
    }
    case "insert": {
      const rows = Array.isArray(payload?.rows) ? payload.rows : [payload?.row];
      if (!rows || rows.length === 0) return json({ error: "no rows" }, 400);
      const sanitized = rows.map((r: any) => ({ ...r, user_id: user.id }));
      const { data, error } = await sb
        .from("logbook_entries")
        .insert(sanitized)
        .select();
      if (error) return json({ error: error.message }, 500);
      return json({ data });
    }
    case "update": {
      const id = payload?.id;
      const patch = payload?.patch ?? {};
      if (!id) return json({ error: "id required" }, 400);
      delete patch.user_id;
      delete patch.id;
      const { error } = await sb
        .from("logbook_entries")
        .update(patch)
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) return json({ error: error.message }, 500);
      return json({ data: { id } });
    }
    case "delete": {
      const id = payload?.id;
      if (!id) return json({ error: "id required" }, 400);
      const { error } = await sb
        .from("logbook_entries")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) return json({ error: error.message }, 500);
      return json({ data: { id } });
    }
    case "delete_many": {
      const ids = Array.isArray(payload?.ids) ? payload.ids : [];
      if (ids.length === 0) return json({ data: { count: 0 } });
      const { error } = await sb
        .from("logbook_entries")
        .delete()
        .eq("user_id", user.id)
        .in("id", ids);
      if (error) return json({ error: error.message }, 500);
      return json({ data: { count: ids.length } });
    }
  }
  return json({ error: "unknown action" }, 400);
}

async function handleFlightPlans(
  sb: ReturnType<typeof createClient>,
  user: AccessCodeRow,
  action: string,
  payload: any,
) {
  switch (action) {
    case "list": {
      const { data, error } = await sb
        .from("flight_plans")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });
      if (error) return json({ error: error.message }, 500);
      return json({ data });
    }
    case "insert": {
      const row = { ...(payload?.row ?? {}), user_id: user.id };
      delete row.id;
      const { data, error } = await sb
        .from("flight_plans")
        .insert(row)
        .select("id")
        .single();
      if (error) return json({ error: error.message }, 500);
      return json({ data });
    }
    case "update": {
      const id = payload?.id;
      const patch = { ...(payload?.patch ?? {}) };
      if (!id) return json({ error: "id required" }, 400);
      delete patch.user_id;
      delete patch.id;
      const { error } = await sb
        .from("flight_plans")
        .update(patch)
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) return json({ error: error.message }, 500);
      return json({ data: { id } });
    }
    case "delete": {
      const id = payload?.id;
      if (!id) return json({ error: "id required" }, 400);
      const { error } = await sb
        .from("flight_plans")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) return json({ error: error.message }, 500);
      return json({ data: { id } });
    }
  }
  return json({ error: "unknown action" }, 400);
}

async function handleColumnTemplates(
  sb: ReturnType<typeof createClient>,
  user: AccessCodeRow,
  action: string,
  payload: any,
) {
  switch (action) {
    case "list": {
      const { data, error } = await sb
        .from("column_templates")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) return json({ error: error.message }, 500);
      return json({ data });
    }
    case "insert": {
      const row = { ...(payload?.row ?? {}), user_id: user.id };
      delete row.id;
      const { data, error } = await sb
        .from("column_templates")
        .insert(row)
        .select()
        .single();
      if (error) return json({ error: error.message }, 500);
      return json({ data });
    }
    case "delete": {
      const id = payload?.id;
      if (!id) return json({ error: "id required" }, 400);
      const { error } = await sb
        .from("column_templates")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) return json({ error: error.message }, 500);
      return json({ data: { id } });
    }
  }
  return json({ error: "unknown action" }, 400);
}

async function handleAiUsage(
  sb: ReturnType<typeof createClient>,
  user: AccessCodeRow,
  action: string,
) {
  if (action === "count") {
    const { count, error } = await sb
      .from("ai_usage")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);
    if (error) return json({ error: error.message }, 500);
    return json({ data: { count: count ?? 0 } });
  }
  return json({ error: "unknown action" }, 400);
}

async function handleCreditRequests(
  sb: ReturnType<typeof createClient>,
  user: AccessCodeRow,
  action: string,
  payload: any,
) {
  switch (action) {
    case "list_pending": {
      if (!user.is_admin) return json({ error: "forbidden" }, 403);
      const { data, error } = await sb
        .from("credit_requests")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: true });
      if (error) return json({ error: error.message }, 500);
      return json({ data });
    }
    case "insert": {
      const amount = Number(payload?.requested_amount);
      if (!Number.isFinite(amount) || amount < 1 || amount > 1000) {
        return json({ error: "invalid amount" }, 400);
      }
      // user_name is looked up from access_codes to avoid client spoofing
      const { data: code } = await sb
        .from("access_codes")
        .select("display_name")
        .eq("id", user.id)
        .maybeSingle();
      const { error } = await sb.from("credit_requests").insert({
        user_id: user.id,
        user_name: code?.display_name ?? "",
        requested_amount: amount,
      });
      if (error) return json({ error: error.message, code: (error as any).code }, 500);
      return json({ data: { ok: true } });
    }
  }
  return json({ error: "unknown action" }, 400);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { accessCode, table, action, payload } = body ?? {};

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const user = await resolveAccessCode(sb, accessCode);
    if (!user) return json({ error: "invalid access code" }, 401);

    switch (table) {
      case "logbook_entries":
        return await handleLogbook(sb, user, action, payload);
      case "flight_plans":
        return await handleFlightPlans(sb, user, action, payload);
      case "column_templates":
        return await handleColumnTemplates(sb, user, action, payload);
      case "ai_usage":
        return await handleAiUsage(sb, user, action);
      case "credit_requests":
        return await handleCreditRequests(sb, user, action, payload);
    }
    return json({ error: "unknown table" }, 400);
  } catch (err) {
    console.error("data-proxy error", err);
    return json({ error: "server error" }, 500);
  }
});
