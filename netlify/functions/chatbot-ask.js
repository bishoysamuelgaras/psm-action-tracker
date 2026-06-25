import { requireAuth } from "./_shared/require-auth.js";

function json(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  };
}

function normalizeArabic(text) {
  return text
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ة/g, "ه");
}

function normalizeText(text) {
  return normalizeArabic(String(text || "").toLowerCase())
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text) {
  return normalizeText(text).split(" ").filter(Boolean);
}

function detectTextMix(text) {
  const value = String(text || "");
  const hasArabic = /[؀-ۿ]/.test(value);
  const hasEnglish = /[A-Za-z]/.test(value);
  if (hasArabic && hasEnglish) return "mixed";
  if (hasEnglish) return "en";
  return "ar";
}

function scoreQuestion(question, phrase, priorityBoost = 0, pageBoost = 0, localeBoost = 0) {
  const normalizedQuestion = normalizeText(question);
  const normalizedPhrase = normalizeText(phrase);

  if (!normalizedQuestion || !normalizedPhrase) return 0;
  if (normalizedQuestion === normalizedPhrase) return 108 + priorityBoost + pageBoost + localeBoost;
  if (normalizedQuestion.includes(normalizedPhrase)) return 95 + priorityBoost + pageBoost + localeBoost;
  if (normalizedPhrase.includes(normalizedQuestion)) return 91 + priorityBoost + pageBoost + localeBoost;

  const questionTokens = tokenize(question);
  const phraseTokens = tokenize(phrase);
  const questionSet = new Set(questionTokens);
  const overlap = phraseTokens.filter((token) => questionSet.has(token)).length;
  const ratio = overlap / Math.max(questionTokens.length, phraseTokens.length, 1);

  const questionBigrams = new Set(
    questionTokens.slice(0, -1).map((token, index) => `${token} ${questionTokens[index + 1]}`)
  );
  const phraseBigrams = phraseTokens.slice(0, -1).map((token, index) => `${token} ${phraseTokens[index + 1]}`);
  const bigramOverlap = phraseBigrams.filter((token) => questionBigrams.has(token)).length;
  const bigramRatio = bigramOverlap / Math.max(phraseBigrams.length, 1);

  const startsStrong = phraseTokens.length && questionTokens.length && phraseTokens[0] === questionTokens[0] ? 5 : 0;

  return ratio * 64 + bigramRatio * 22 + startsStrong + priorityBoost + pageBoost + localeBoost;
}

function toSuggestion(intent, locale) {
  return {
    intentKey: intent.intent_key,
    label: locale === "ar" ? intent.title_ar : intent.title_en
  };
}

function buildFallback(locale, suggestions = []) {
  return {
    ok: true,
    answerType: "fallback",
    scope: "product_only",
    matchedIntentKey: null,
    confidence: 0.22,
    title: locale === "ar" ? "ضمن نطاق النظام فقط" : "Inside the product scope only",
    shortAnswer:
      locale === "ar"
        ? "أقدر أساعدك في استخدام Action Tracker فقط، مثل Sources وRecommendations وActions وReports والصلاحيات."
        : "I can help only with Action Tracker usage, such as Sources, Recommendations, Actions, Reports, and permissions.",
    detailedAnswer: "",
    steps: [],
    note:
      locale === "ar"
        ? "جرّب سؤالًا عن الصفحة الحالية أو اختر من الأسئلة المقترحة."
        : "Try asking about the current page or choose one of the suggested questions.",
    warning: null,
    relatedQuestions: suggestions,
    quickActions: []
  };
}

function pickBestSuggestions(intents, pageContexts, pageKey, locale, limit = 4) {
  const sortMap = new Map();
  for (const row of pageContexts || []) {
    if (row.page_key === pageKey) {
      sortMap.set(row.intent_id, Number(row.sort_order || 0));
    }
  }

  const pageSpecific = (intents || [])
    .filter((intent) => sortMap.has(intent.id))
    .sort((a, b) => {
      const sortDiff = (sortMap.get(a.id) ?? 999) - (sortMap.get(b.id) ?? 999);
      if (sortDiff !== 0) return sortDiff;
      return Number(a.priority || 100) - Number(b.priority || 100);
    })
    .slice(0, limit)
    .map((intent) => toSuggestion(intent, locale));

  if (pageSpecific.length >= limit) return pageSpecific;

  const used = new Set(pageSpecific.map((item) => item.intentKey));
  const fillers = (intents || [])
    .sort((a, b) => Number(a.priority || 100) - Number(b.priority || 100))
    .filter((intent) => !used.has(intent.intent_key))
    .slice(0, limit - pageSpecific.length)
    .map((intent) => toSuggestion(intent, locale));

  return [...pageSpecific, ...fillers];
}

function assembleAnswer({ intent, answerRow, relatedRows, intents, locale }) {
  const relatedQuestions = (relatedRows || [])
    .filter((row) => row.source_intent_id === intent.id)
    .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
    .map((row) => (intents || []).find((candidate) => candidate.id === row.related_intent_id))
    .filter(Boolean)
    .slice(0, 4)
    .map((candidate) => toSuggestion(candidate, locale));

  const fallbackRelated = Array.isArray(answerRow.related_question_labels)
    ? answerRow.related_question_labels
    : [];

  return {
    ok: true,
    answerType: "faq",
    scope: "product_only",
    matchedIntentKey: intent.intent_key,
    confidence: 0.98,
    title: locale === "ar" ? intent.title_ar : intent.title_en,
    shortAnswer: answerRow.short_answer || "",
    detailedAnswer: answerRow.detailed_answer || "",
    steps: Array.isArray(answerRow.steps) ? answerRow.steps : [],
    note: answerRow.note_text || null,
    warning: answerRow.warning_text || null,
    relatedQuestions: relatedQuestions.length ? relatedQuestions : fallbackRelated,
    quickActions: Array.isArray(answerRow.quick_actions) ? answerRow.quick_actions : []
  };
}

export async function handler(event) {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  try {
    const { adminClient } = await requireAuth(event);
    const body = JSON.parse(event.body || "{}");
    const message = String(body.message || "").trim();
    const requestedLocale = body.locale === "en" ? "en" : "ar";
    const pageKey = String(body.pageKey || "general").trim() || "general";
    const directIntentKey = String(body.intentKey || "").trim() || null;

    if (!message && !directIntentKey) {
      return json(400, { error: requestedLocale === "ar" ? "السؤال مطلوب." : "Question is required." });
    }

    const textMix = detectTextMix(message);
    const { data: intents, error: intentsError } = await adminClient
      .from("help_intents")
      .select("id, intent_key, title_ar, title_en, priority")
      .eq("is_active", true);
    if (intentsError) throw intentsError;

    const intentIds = (intents || []).map((intent) => intent.id);
    if (!intentIds.length) {
      return json(200, buildFallback(requestedLocale));
    }

    const [
      { data: phrases, error: phrasesError },
      { data: answers, error: answersError },
      { data: pageContexts, error: pageContextsError },
      { data: relatedRows, error: relatedRowsError }
    ] = await Promise.all([
      adminClient
        .from("help_intent_phrases")
        .select("intent_id, phrase, weight, locale")
        .eq("is_active", true)
        .in("intent_id", intentIds),
      adminClient
        .from("help_answers")
        .select("intent_id, locale, short_answer, detailed_answer, steps, note_text, warning_text, related_question_labels, quick_actions")
        .eq("is_active", true)
        .eq("locale", requestedLocale)
        .in("intent_id", intentIds),
      adminClient
        .from("help_page_contexts")
        .select("intent_id, page_key, sort_order")
        .in("intent_id", intentIds),
      adminClient
        .from("help_related_intents")
        .select("source_intent_id, related_intent_id, sort_order")
        .in("source_intent_id", intentIds)
    ]);

    if (phrasesError) throw phrasesError;
    if (answersError) throw answersError;
    if (pageContextsError) throw pageContextsError;
    if (relatedRowsError) throw relatedRowsError;

    const suggestionPool = pickBestSuggestions(intents, pageContexts, pageKey, requestedLocale, 4);

    if (directIntentKey) {
      const directIntent = (intents || []).find((intent) => intent.intent_key === directIntentKey);
      const answerRow = (answers || []).find((item) => item.intent_id === directIntent?.id);
      if (directIntent && answerRow) {
        return json(200, assembleAnswer({ intent: directIntent, answerRow, relatedRows, intents, locale: requestedLocale }));
      }
    }

    const pageIntentSet = new Set(
      (pageContexts || []).filter((item) => item.page_key === pageKey).map((item) => item.intent_id)
    );

    let best = null;

    for (const phraseRow of phrases || []) {
      const intent = (intents || []).find((item) => item.id === phraseRow.intent_id);
      if (!intent) continue;

      const priorityBoost = Math.max(0, 20 - Number(intent.priority || 100) / 10);
      const pageBoost = pageIntentSet.has(intent.id) ? 16 : 0;
      const localeBoost =
        phraseRow.locale === requestedLocale ? 10 : textMix === "mixed" ? 5 : phraseRow.locale === textMix ? 8 : 0;

      const rawScore = scoreQuestion(message, phraseRow.phrase, priorityBoost, pageBoost, localeBoost) * Number(phraseRow.weight || 1);

      if (!best || rawScore > best.score) {
        best = { intent, score: rawScore };
      }
    }

    if (!best || best.score < 33) {
      return json(200, buildFallback(requestedLocale, suggestionPool));
    }

    const answerRow = (answers || []).find((item) => item.intent_id === best.intent.id);
    if (!answerRow) {
      return json(200, buildFallback(requestedLocale, suggestionPool));
    }

    const payload = assembleAnswer({ intent: best.intent, answerRow, relatedRows, intents, locale: requestedLocale });
    payload.confidence = Math.min(0.99, Number((best.score / 100).toFixed(2)));

    return json(200, payload);
  } catch (error) {
    return json(error.statusCode || 500, {
      error: error.message || "Unexpected error"
    });
  }
}
