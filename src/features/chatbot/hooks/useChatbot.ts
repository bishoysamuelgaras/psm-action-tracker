import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  askChatbot,
  getChatbotSuggestions,
  sendChatbotFeedback
} from "@/features/chatbot/api/chatbot.api";
import type {
  ChatLocale,
  ChatMessage,
  ChatPageKey,
  ChatbotAnswer,
  ChatbotSuggestion
} from "@/features/chatbot/lib/chatbot.types";

const LOCALE_STORAGE_KEY = "anrpc-chatbot-locale";

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function inferPageKey(pathname: string): ChatPageKey {
  if (pathname.startsWith("/dashboard")) return "dashboard";
  if (pathname.startsWith("/sources")) return "sources";
  if (pathname.startsWith("/recommendations")) return "recommendations";
  if (/^\/actions\/[^/]+/.test(pathname)) return "action_details";
  if (pathname.startsWith("/actions")) return "actions";
  if (pathname.startsWith("/reports")) return "reports";
  if (pathname.startsWith("/logs")) return "logs";
  if (pathname.startsWith("/settings")) return "settings";
  return "general";
}

function buildBotMessage(answer: ChatbotAnswer): ChatMessage {
  return {
    id: createId(),
    sender: "bot",
    text: answer.shortAnswer.trim(),
    answer,
    createdAt: new Date().toISOString(),
    meta: { kind: "answer" }
  };
}

function buildPageIntro(pageKey: ChatPageKey, locale: ChatLocale): ChatMessage {
  const defs: Record<
    ChatPageKey,
    {
      ar: { title: string; body: string; quickActions: { label: string; intentKey: string }[] };
      en: { title: string; body: string; quickActions: { label: string; intentKey: string }[] };
    }
  > = {
    dashboard: {
      ar: {
        title: "أنا موجود أساعدك في Dashboard.",
        body: "اسألني عن الـ workflow، معنى الأرقام preview، أو أين تبدأ داخل النظام.",
        quickActions: [
          { label: "ما هو الـ workflow؟", intentKey: "workflow_overview" },
          { label: "ما أول خطوة في النظام؟", intentKey: "workflow_first_step" }
        ]
      },
      en: {
        title: "I can help you in the Dashboard.",
        body: "Ask me about the workflow, preview numbering, or where to start inside the system.",
        quickActions: [
          { label: "What is the workflow?", intentKey: "workflow_overview" },
          { label: "What is the first step in the system?", intentKey: "workflow_first_step" }
        ]
      }
    },
    sources: {
      ar: {
        title: "أنت الآن في Sources.",
        body: "أقدر أشرح لك إنشاء Source، معنى reference no.، وطريقة استخدام القائمة أو الإدخال اليدوي.",
        quickActions: [
          { label: "كيف أنشئ Source؟", intentKey: "source_create_how" },
          { label: "ما معنى reference no.؟", intentKey: "source_reference_no_meaning" },
          { label: "هل Reference No يمكن أن يكون يدويًا؟", intentKey: "source_reference_manual_or_existing" }
        ]
      },
      en: {
        title: "You are now in Sources.",
        body: "I can explain Source creation, reference no., and when to use the dropdown or manual entry.",
        quickActions: [
          { label: "How do I create a Source?", intentKey: "source_create_how" },
          { label: "What does reference no. mean?", intentKey: "source_reference_no_meaning" },
          { label: "Can the reference number be manual?", intentKey: "source_reference_manual_or_existing" }
        ]
      }
    },
    recommendations: {
      ar: {
        title: "أنت داخل Recommendations.",
        body: "اسألني عن كتابة التوصية، المايك، أو الفرق بين النص الأصلي وميزة rewrite.",
        quickActions: [
          { label: "كيف أنشئ Recommendation؟", intentKey: "recommendation_create_how" },
          { label: "كيف أستخدم المايك؟", intentKey: "recommendation_voice_input_how" },
          { label: "ما وظيفة rewrite؟", intentKey: "recommendation_rewrite_meaning" }
        ]
      },
      en: {
        title: "You are in Recommendations.",
        body: "Ask me about writing recommendations, voice input, or what rewrite changes inside the product.",
        quickActions: [
          { label: "How do I create a Recommendation?", intentKey: "recommendation_create_how" },
          { label: "How do I use voice input?", intentKey: "recommendation_voice_input_how" },
          { label: "What does rewrite do?", intentKey: "recommendation_rewrite_meaning" }
        ]
      }
    },
    actions: {
      ar: {
        title: "أنا جاهز أساعدك في Actions.",
        body: "أهم قاعدة هنا: اختَر Source أولًا، ثم Recommendation. واسألني عن الفلاتر والحقول والتمديدات والتحقق.",
        quickActions: [
          { label: "كيف أنشئ Action؟", intentKey: "action_create_how" },
          { label: "لماذا يجب اختيار Source أولًا؟", intentKey: "action_source_first_why" },
          { label: "كيف تعمل فلاتر Actions؟", intentKey: "action_filtering_logic" }
        ]
      },
      en: {
        title: "I’m ready to help in Actions.",
        body: "The key rule here is Source first, then Recommendation. You can also ask about filters, hidden fields, extensions, and verification.",
        quickActions: [
          { label: "How do I create an Action?", intentKey: "action_create_how" },
          { label: "Why must I choose Source first?", intentKey: "action_source_first_why" },
          { label: "How do Actions filters work?", intentKey: "action_filtering_logic" }
        ]
      }
    },
    action_details: {
      ar: {
        title: "أنت داخل Action details.",
        body: "هنا أقدر أساعدك في التعديل، المرفقات، طلبات التمديد، وما الذي يحدث بعد الاعتماد.",
        quickActions: [
          { label: "كيف أرفع attachment؟", intentKey: "action_attachment_how" },
          { label: "من يقدر يطلب Extension Request؟", intentKey: "extension_who_can_request" },
          { label: "من يوافق على Extension Request؟", intentKey: "extension_who_can_approve" }
        ]
      },
      en: {
        title: "You are inside Action details.",
        body: "I can help with editing, attachments, extension requests, and what happens after approval.",
        quickActions: [
          { label: "How do I add attachments?", intentKey: "action_attachment_how" },
          { label: "Who can request an extension?", intentKey: "extension_who_can_request" },
          { label: "Who can approve an extension request?", intentKey: "extension_who_can_approve" }
        ]
      }
    },
    reports: {
      ar: {
        title: "أنت داخل Reports.",
        body: "اسألني عن Source Type، اختيار All أو Source محدد، وطريقة قراءة التقرير أو طباعته.",
        quickActions: [
          { label: "كيف تعمل فلترة Reports؟", intentKey: "reports_filter_source_type" },
          { label: "كيف أستخدم Reports؟", intentKey: "reports_how_to_use" },
          { label: "كيف أطبع أو أراجع التقرير؟", intentKey: "reports_review_and_print" }
        ]
      },
      en: {
        title: "You are in Reports.",
        body: "Ask me about source type filtering, All versus a specific source, and how to review or print the report.",
        quickActions: [
          { label: "How does Reports filtering work?", intentKey: "reports_filter_source_type" },
          { label: "How do I use Reports?", intentKey: "reports_how_to_use" },
          { label: "How do I review or print the report?", intentKey: "reports_review_and_print" }
        ]
      }
    },
    logs: {
      ar: {
        title: "أنت داخل Logs.",
        body: "أقدر أوضح لك ما الذي يتم تسجيله، لماذا قد لا تظهر الصفحة، وكيف تستخدم الفلاتر والصفحات.",
        quickActions: [
          { label: "ما الذي تسجله Logs؟", intentKey: "logs_what_is_tracked" },
          { label: "لماذا لا تظهر لي Logs؟", intentKey: "logs_why_not_visible" },
          { label: "كيف أستخدم الفلاتر وpagination في Logs؟", intentKey: "logs_filters_and_pagination" }
        ]
      },
      en: {
        title: "You are in Logs.",
        body: "I can explain what is tracked, why the page may be hidden, and how to use filters and pagination.",
        quickActions: [
          { label: "What is tracked in Logs?", intentKey: "logs_what_is_tracked" },
          { label: "Why can’t I see Logs?", intentKey: "logs_why_not_visible" },
          { label: "How do I use filters and pagination in Logs?", intentKey: "logs_filters_and_pagination" }
        ]
      }
    },
    settings: {
      ar: {
        title: "أنت داخل Settings.",
        body: "اسألني عن المستخدمين، الأدوار، الصلاحيات، ولماذا بعض الأزرار لا تظهر لبعض المستخدمين.",
        quickActions: [
          { label: "ما الفرق بين Responsible و Owner و Verifier؟", intentKey: "roles_difference_responsible_owner_verifier" },
          { label: "لماذا لا أرى بعض الأزرار؟", intentKey: "permissions_why_button_hidden" },
          { label: "ما الذي أفعله في صفحة Settings؟", intentKey: "settings_users_roles_help" }
        ]
      },
      en: {
        title: "You are in Settings.",
        body: "Ask me about users, roles, permissions, and why some controls are hidden for certain users.",
        quickActions: [
          { label: "What is the difference between Responsible, Owner, and Verifier?", intentKey: "roles_difference_responsible_owner_verifier" },
          { label: "Why are some buttons hidden?", intentKey: "permissions_why_button_hidden" },
          { label: "What can I do in Settings?", intentKey: "settings_users_roles_help" }
        ]
      }
    },
    general: {
      ar: {
        title: "مرحبًا، أنا مساعد Action Tracker.",
        body: "أشرح استخدام النظام فقط: workflow، الصفحات، الصلاحيات، التقارير، التمديدات، والتحقق.",
        quickActions: [
          { label: "ما هو الـ workflow؟", intentKey: "workflow_overview" },
          { label: "ما أول خطوة في النظام؟", intentKey: "workflow_first_step" },
          { label: "من يوافق على Extension Request؟", intentKey: "extension_who_can_approve" }
        ]
      },
      en: {
        title: "Hi, I’m the Action Tracker Assistant.",
        body: "I explain product usage only: workflow, pages, permissions, reports, extensions, and verification.",
        quickActions: [
          { label: "What is the workflow?", intentKey: "workflow_overview" },
          { label: "What is the first step in the system?", intentKey: "workflow_first_step" },
          { label: "Who approves extension requests?", intentKey: "extension_who_can_approve" }
        ]
      }
    }
  };

  const content = defs[pageKey][locale];
  return {
    id: createId(),
    sender: "bot",
    text: `${content.title}\n\n${content.body}`,
    createdAt: new Date().toISOString(),
    meta: { kind: "intro", pageKey },
    answer: {
      ok: true,
      answerType: "faq",
      scope: "product_only",
      matchedIntentKey: null,
      confidence: 0.98,
      title: content.title,
      shortAnswer: content.body,
      detailedAnswer: "",
      steps: [],
      note: null,
      warning: null,
      relatedQuestions: content.quickActions.map((item) => ({ label: item.label, intentKey: item.intentKey })),
      quickActions: content.quickActions.map((item) => ({ type: "faq", label: item.label, intentKey: item.intentKey }))
    }
  };
}

export function useChatbot() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [locale, setLocaleState] = useState<ChatLocale>(() => {
    if (typeof window === "undefined") return "ar";
    const saved = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    return saved === "en" ? "en" : "ar";
  });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [suggestions, setSuggestions] = useState<ChatbotSuggestion[]>([]);
  const [input, setInput] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState("");
  const sessionIdRef = useRef(`session-${createId()}`);
  const introSeenRef = useRef(new Set<string>());

  const pageKey = useMemo(() => inferPageKey(location.pathname), [location.pathname]);

  const setLocale = useCallback((nextLocale: ChatLocale) => {
    setLocaleState(nextLocale);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
    }
  }, []);

  const refreshSuggestions = useCallback(async () => {
    try {
      const nextSuggestions = await getChatbotSuggestions(locale, pageKey);
      setSuggestions(nextSuggestions);
      setError("");
    } catch (requestError) {
      setSuggestions([]);
      setError(
        requestError instanceof Error
          ? requestError.message
          : locale === "ar"
            ? "تعذر تحميل الأسئلة المقترحة."
            : "Could not load suggested questions."
      );
    }
  }, [locale, pageKey]);

  useEffect(() => {
    void refreshSuggestions();
  }, [refreshSuggestions]);

  useEffect(() => {
    if (!isOpen) return;

    const introKey = `${locale}:${pageKey}`;
    if (introSeenRef.current.has(introKey)) return;

    introSeenRef.current.add(introKey);
    setMessages((current) => [...current, buildPageIntro(pageKey, locale)]);
  }, [isOpen, locale, pageKey]);

  const submitQuestion = useCallback(
    async (questionText: string, directIntentKey?: string) => {
      const normalized = questionText.trim();
      if (!normalized || isBusy) return;

      const userMessage: ChatMessage = {
        id: createId(),
        sender: "user",
        text: normalized,
        createdAt: new Date().toISOString(),
        meta: { kind: "user" }
      };

      setMessages((current) => [...current, userMessage]);
      setInput("");
      setError("");
      setIsBusy(true);

      try {
        const answer = await askChatbot({
          message: normalized,
          locale,
          pageKey,
          currentPath: location.pathname,
          sessionId: sessionIdRef.current,
          intentKey: directIntentKey,
          context: {}
        });

        setMessages((current) => [...current, buildBotMessage(answer)]);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : locale === "ar"
              ? "حدث خطأ أثناء التواصل مع البوت."
              : "Something went wrong while contacting the bot."
        );
      } finally {
        setIsBusy(false);
      }
    },
    [isBusy, locale, location.pathname, pageKey]
  );

  const sendCurrentInput = useCallback(async () => {
    await submitQuestion(input);
  }, [input, submitQuestion]);

  const handleQuickQuestion = useCallback(
    async (suggestion: ChatbotSuggestion) => {
      await submitQuestion(suggestion.label, suggestion.intentKey);
    },
    [submitQuestion]
  );

  const handleQuickAction = useCallback(
    async (action: { type: "navigate" | "faq"; target?: string; label: string; intentKey?: string }) => {
      if (action.type === "navigate" && action.target) {
        navigate(action.target);
        setIsOpen(false);
        return;
      }

      await submitQuestion(action.label, action.intentKey);
    },
    [navigate, submitQuestion]
  );

  const handleRelatedQuestion = useCallback(
    async (related: ChatbotSuggestion) => {
      await submitQuestion(related.label, related.intentKey);
    },
    [submitQuestion]
  );

  const submitFeedback = useCallback(
    async (answer: ChatbotAnswer, wasHelpful: boolean) => {
      try {
        await sendChatbotFeedback({
          sessionId: sessionIdRef.current,
          pageKey,
          locale,
          userQuestion: messages.filter((message) => message.sender === "user").at(-1)?.text ?? "",
          matchedIntentKey: answer.matchedIntentKey,
          confidence: answer.confidence,
          wasHelpful
        });
      } catch {
        // Feedback is non-blocking.
      }
    },
    [locale, messages, pageKey]
  );

  const hasUserMessages = messages.some((message) => message.sender === "user");

  return {
    isOpen,
    setIsOpen,
    locale,
    setLocale,
    pageKey,
    messages,
    suggestions,
    input,
    setInput,
    isBusy,
    error,
    sendCurrentInput,
    handleQuickQuestion,
    handleQuickAction,
    handleRelatedQuestion,
    submitFeedback,
    refreshSuggestions,
    hasUserMessages
  };
}
