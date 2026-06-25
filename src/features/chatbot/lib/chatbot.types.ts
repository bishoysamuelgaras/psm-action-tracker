export type ChatLocale = "ar" | "en";

export type ChatPageKey =
  | "dashboard"
  | "sources"
  | "recommendations"
  | "actions"
  | "action_details"
  | "reports"
  | "logs"
  | "settings"
  | "general";

export type ChatQuickAction = {
  type: "navigate" | "faq";
  label: string;
  target?: string;
  intentKey?: string;
};

export type ChatRelatedQuestion = {
  label: string;
  intentKey: string;
};

export type ChatbotAnswer = {
  ok: boolean;
  answerType: "faq" | "fallback";
  scope: string;
  matchedIntentKey: string | null;
  confidence: number;
  title: string;
  shortAnswer: string;
  detailedAnswer: string;
  steps: string[];
  note: string | null;
  warning: string | null;
  relatedQuestions: ChatRelatedQuestion[];
  quickActions: ChatQuickAction[];
};

export type ChatbotSuggestion = {
  label: string;
  intentKey: string;
};

export type ChatbotAskRequest = {
  message: string;
  locale: ChatLocale;
  pageKey: ChatPageKey;
  currentPath: string;
  sessionId?: string;
  intentKey?: string;
  context?: {
    actionId?: string | null;
    recommendationId?: string | null;
    sourceId?: string | null;
  };
};

export type ChatbotFeedbackRequest = {
  sessionId?: string;
  pageKey: ChatPageKey;
  locale: ChatLocale;
  userQuestion: string;
  matchedIntentKey: string | null;
  confidence: number;
  wasHelpful: boolean;
  feedbackNote?: string;
};

export type ChatMessage = {
  id: string;
  sender: "user" | "bot";
  text: string;
  answer?: ChatbotAnswer;
  createdAt: string;
  meta?: {
    kind?: "intro" | "answer" | "user";
    pageKey?: ChatPageKey;
  };
};
