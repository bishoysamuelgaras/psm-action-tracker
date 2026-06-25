import { supabase } from "@/lib/supabase";
import type {
  ChatLocale,
  ChatPageKey,
  ChatbotAnswer,
  ChatbotAskRequest,
  ChatbotFeedbackRequest,
  ChatbotSuggestion
} from "@/features/chatbot/lib/chatbot.types";

async function buildHeaders() {
  const {
    data: { session }
  } = await supabase.auth.getSession();

  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };

  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  return headers;
}

async function parseJson<T>(response: Response): Promise<T> {
  const data = (await response.json().catch(() => ({}))) as T & { error?: string };

  if (!response.ok) {
    throw new Error((data as { error?: string }).error || "Request failed.");
  }

  return data;
}

export async function getChatbotSuggestions(
  locale: ChatLocale,
  pageKey: ChatPageKey
): Promise<ChatbotSuggestion[]> {
  const response = await fetch("/.netlify/functions/chatbot-suggestions", {
    method: "POST",
    headers: await buildHeaders(),
    body: JSON.stringify({ locale, pageKey })
  });

  const data = await parseJson<{ ok: boolean; suggestions: ChatbotSuggestion[] }>(response);
  return data.suggestions ?? [];
}

export async function askChatbot(payload: ChatbotAskRequest): Promise<ChatbotAnswer> {
  const response = await fetch("/.netlify/functions/chatbot-ask", {
    method: "POST",
    headers: await buildHeaders(),
    body: JSON.stringify(payload)
  });

  return parseJson<ChatbotAnswer>(response);
}

export async function sendChatbotFeedback(payload: ChatbotFeedbackRequest) {
  const response = await fetch("/.netlify/functions/chatbot-feedback", {
    method: "POST",
    headers: await buildHeaders(),
    body: JSON.stringify(payload)
  });

  return parseJson<{ ok: boolean }>(response);
}
