import { createClient } from "@supabase/supabase-js";

export const config = {
  schedule: "0 7 */5 * *",
};

function json(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

export async function handler() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return json(500, {
      ok: false,
      error: "Missing Supabase environment variables for scheduled pulse.",
    });
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const now = new Date().toISOString();
  const { error } = await adminClient.from("audit_logs").insert({
    actor_id: null,
    actor_name: "System pulse",
    actor_email: null,
    actor_role: "system",
    entity_type: "other",
    entity_id: null,
    entity_label: "Supabase scheduled pulse",
    event_type: "other",
    message: "Scheduled 5-day Supabase pulse to keep the project warm.",
    details: {
      purpose: "avoid_free_tier_pause_due_to_inactivity",
      executed_at: now,
      source: "netlify_scheduled_function",
    },
    source: "netlify-scheduled-pulse",
  });

  if (error) {
    return json(500, { ok: false, error: error.message });
  }

  return json(200, { ok: true, executedAt: now });
}
