import { useMemo, useRef, useState, type KeyboardEventHandler } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ChatbotMessageList } from "@/features/chatbot/components/ChatbotMessageList";
import { SmartRobotIcon } from "@/features/chatbot/components/SmartRobotIcon";
import { useChatbot } from "@/features/chatbot/hooks/useChatbot";

export function ChatbotDrawer() {
  const {
    isOpen,
    setIsOpen,
    locale,
    setLocale,
    pageKey,
    messages,
    input,
    setInput,
    isBusy,
    error,
    sendCurrentInput,
    handleRelatedQuestion,
    submitFeedback,
  } = useChatbot();

  const [feedbackMemo, setFeedbackMemo] = useState<Record<string, boolean>>({});
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const pageLabel = useMemo(() => {
    const labels: Record<string, { ar: string; en: string }> = {
      dashboard: { ar: "Dashboard", en: "Dashboard" },
      sources: { ar: "Sources", en: "Sources" },
      recommendations: { ar: "Recommendations", en: "Recommendations" },
      actions: { ar: "Actions", en: "Actions" },
      action_details: { ar: "Action details", en: "Action details" },
      reports: { ar: "Reports", en: "Reports" },
      logs: { ar: "Logs", en: "Logs" },
      settings: { ar: "Settings", en: "Settings" },
      general: { ar: "General", en: "General" }
    };

    return labels[pageKey] ?? labels.general;
  }, [pageKey]);

  const scrollMessagesToBottom = () => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    });
  };

  const handleKeyDown: KeyboardEventHandler<HTMLInputElement> = async (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      await sendCurrentInput();
      scrollMessagesToBottom();
    }
  };

  const handleSendClick = async () => {
    await sendCurrentInput();
    scrollMessagesToBottom();
  };

  const handleFeedback = async (messageId: string, helpful: boolean) => {
    if (feedbackMemo[messageId]) return;

    const message = messages.find((item) => item.id === messageId);
    if (!message?.answer) return;

    setFeedbackMemo((current) => ({ ...current, [messageId]: true }));
    await submitFeedback(message.answer, helpful);
  };

  const localeLabel = locale === "ar" ? "العربية" : "English";

  return (
    <>
      {!isOpen ? (
        <button
          type="button"
          data-chatbot-root="true"
          className="no-print chatbot-print-hidden fixed bottom-4 right-4 z-[60] inline-flex items-center gap-3 rounded-full border border-slate-200/70 bg-white px-3 py-2 text-left shadow-[0_18px_40px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:bg-slate-50"
          onClick={() => setIsOpen(true)}
          aria-label={locale === "ar" ? "افتح مساعد النظام" : "Open system assistant"}
        >
          <span className="relative">
            <SmartRobotIcon className="h-11 w-11 rounded-2xl border-slate-200 bg-slate-950/95" eyeClassName="fill-cyan-300" />
            <span className="absolute -right-0.5 -top-0.5 inline-flex h-3 w-3 rounded-full border-2 border-white bg-emerald-400" />
          </span>
          <span className="hidden min-w-0 sm:block">
            <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Robot Help
            </span>
            <span className="block text-sm font-semibold text-slate-900">
              {locale === "ar" ? "مساعد Action Tracker" : "Action Tracker Assistant"}
            </span>
          </span>
        </button>
      ) : null}

      {isOpen ? (
        <div data-chatbot-root="true"
          className="no-print chatbot-print-hidden fixed inset-0 z-[70] bg-slate-950/20 backdrop-blur-[1px]" onClick={() => setIsOpen(false)}>
          <div className="absolute bottom-4 left-4 right-4 top-4 sm:bottom-5 sm:left-auto sm:right-5 sm:top-auto sm:w-[420px] lg:w-[440px]">
            <Card
              className="flex h-full max-h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-[28px] border-slate-200 shadow-[0_24px_60px_rgba(15,23,42,0.18)] sm:h-[min(82vh,760px)]"
              onClick={(event) => event.stopPropagation()}
            >
              <CardHeader className="shrink-0 border-b border-slate-200/80 bg-[linear-gradient(135deg,#f8fafc_0%,#eff6ff_100%)] pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <SmartRobotIcon className="h-11 w-11 shrink-0 rounded-[18px] border-slate-200 bg-slate-950/95" eyeClassName="fill-cyan-300" />
                    <div className="min-w-0">
                      <CardTitle className="truncate text-base text-slate-900 sm:text-lg">
                        {locale === "ar" ? "مساعد Action Tracker" : "Action Tracker Assistant"}
                      </CardTitle>
                      <p className="mt-1 text-[11px] text-slate-500 sm:text-xs">
                        {locale === "ar" ? `الصفحة الحالية: ${pageLabel.ar}` : `Current page: ${pageLabel.en}`}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-600 sm:text-[11px]">
                          {locale === "ar" ? "داخل نطاق البرنامج فقط" : "Inside product scope only"}
                        </span>
                        <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[10px] font-semibold text-sky-700 sm:text-[11px]">
                          {locale === "ar" ? `اللغة: ${localeLabel}` : `Language: ${localeLabel}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="rounded-full p-2 text-slate-500 transition hover:bg-white hover:text-slate-800"
                    onClick={() => setIsOpen(false)}
                  >
                    ✕
                  </button>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                      locale === "ar"
                        ? "bg-slate-950 text-white"
                        : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                    onClick={() => setLocale("ar")}
                  >
                    العربية
                  </button>
                  <button
                    type="button"
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                      locale === "en"
                        ? "bg-slate-950 text-white"
                        : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                    onClick={() => setLocale("en")}
                  >
                    English
                  </button>
                </div>
              </CardHeader>

              <CardContent className="flex min-h-0 flex-1 flex-col gap-3 p-3 sm:p-4">

                <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
                  <ChatbotMessageList
                    messages={messages}
                    locale={locale}
                    onRelatedQuestion={handleRelatedQuestion}
                    onFeedback={handleFeedback}
                  />
                </div>

                {error ? (
                  <div className="shrink-0 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
                    {error}
                  </div>
                ) : null}

                <div className="shrink-0 rounded-[24px] border border-slate-200 bg-slate-50 p-2">
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <Input
                        value={input}
                        onChange={(event) => setInput(event.target.value)}
                        onKeyDown={handleKeyDown}
                        className="border-0 bg-transparent text-sm shadow-none focus-visible:ring-0"
                        placeholder={
                          locale === "ar"
                            ? "اسأل عن الخطوة الحالية أو أي جزء داخل النظام..."
                            : "Ask about the current step or any part of the system..."
                        }
                      />
                    </div>
                    <Button
                      className="shrink-0 rounded-full px-4"
                      onClick={() => void handleSendClick()}
                      disabled={isBusy || !input.trim()}
                    >
                      {isBusy ? (locale === "ar" ? "جاري..." : "...") : locale === "ar" ? "إرسال" : "Send"}
                    </Button>
                  </div>
                  <p className="px-2 pt-2 text-[11px] text-slate-500">
                    {locale === "ar"
                      ? "هذا المساعد يشرح استخدام النظام فقط ولا يجيب عن موضوعات خارج البرنامج."
                      : "This assistant explains product usage only and does not answer outside-product questions."}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}
    </>
  );
}
