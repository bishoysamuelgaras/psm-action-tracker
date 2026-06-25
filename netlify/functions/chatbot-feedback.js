import { requireAuth } from "./_shared/require-auth.js";

function json(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  };
}

export async function handler(event) {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  try {
    const { adminClient, currentUserId } = await requireAuth(event);
    const body = JSON.parse(event.body || "{}");

    const payload = {
      user_id: currentUserId,
      session_id: body.sessionId ? String(body.sessionId) : null,
      page_key: body.pageKey ? String(body.pageKey) : "general",
      locale: body.locale === "en" ? "en" : "ar",
      user_question: body.userQuestion ? String(body.userQuestion) : "",
      matched_intent_key: body.matchedIntentKey ? String(body.matchedIntentKey) : null,
      confidence: Number.isFinite(Number(body.confidence)) ? Number(body.confidence) : null,
      was_helpful: typeof body.wasHelpful === "boolean" ? body.wasHelpful : null,
      feedback_note: body.feedbackNote ? String(body.feedbackNote) : null
    };

    const { error } = await adminClient.from("chatbot_feedback").insert(payload);
    if (error) throw error;

    return json(200, { ok: true });
  } catch (error) {
    return json(error.statusCode || 500, {
      error: error.message || "Unexpected error"
    });
  }
}
