import { requireAuth } from "./_shared/require-auth.js";

function json(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  };
}

function mapSuggestion(intent, locale) {
  return {
    intentKey: intent.intent_key,
    label: locale === "ar" ? intent.title_ar : intent.title_en
  };
}

export async function handler(event) {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  try {
    const { adminClient } = await requireAuth(event);
    const body = JSON.parse(event.body || "{}");
    const locale = body.locale === "en" ? "en" : "ar";
    const pageKey = String(body.pageKey || "general").trim() || "general";

    const [{ data: pageRows, error: pageError }, { data: intents, error: intentsError }] = await Promise.all([
      adminClient
        .from("help_page_contexts")
        .select("intent_id, sort_order, is_primary")
        .eq("page_key", pageKey)
        .order("sort_order", { ascending: true }),
      adminClient
        .from("help_intents")
        .select("id, intent_key, title_ar, title_en, priority")
        .eq("is_active", true)
        .order("priority", { ascending: true })
        .limit(60)
    ]);

    if (pageError) throw pageError;
    if (intentsError) throw intentsError;

    const intentMap = new Map((intents || []).map((item) => [item.id, item]));

    const pageSpecific = (pageRows || [])
      .map((row) => ({
        intent: intentMap.get(row.intent_id),
        sortOrder: Number(row.sort_order || 0),
        isPrimary: Boolean(row.is_primary)
      }))
      .filter((row) => row.intent)
      .sort((a, b) => {
        if (Number(b.isPrimary) !== Number(a.isPrimary)) return Number(b.isPrimary) - Number(a.isPrimary);
        if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
        return Number(a.intent.priority || 100) - Number(b.intent.priority || 100);
      })
      .slice(0, 6)
      .map((row) => mapSuggestion(row.intent, locale));

    const used = new Set(pageSpecific.map((item) => item.intentKey));
    const fillers = (intents || [])
      .filter((item) => !used.has(item.intent_key))
      .slice(0, Math.max(0, 6 - pageSpecific.length))
      .map((item) => mapSuggestion(item, locale));

    return json(200, {
      ok: true,
      suggestions: [...pageSpecific, ...fillers].slice(0, 6)
    });
  } catch (error) {
    return json(error.statusCode || 500, {
      error: error.message || "Unexpected error"
    });
  }
}
