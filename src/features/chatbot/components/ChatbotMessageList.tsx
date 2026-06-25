import { Button } from "@/components/ui/button";
import { SmartRobotIcon } from "@/features/chatbot/components/SmartRobotIcon";
import type { ChatMessage, ChatbotSuggestion } from "@/features/chatbot/lib/chatbot.types";
import { cn } from "@/lib/utils";

type ChatbotMessageListProps = {
  messages: ChatMessage[];
  locale: "ar" | "en";
  onRelatedQuestion: (question: ChatbotSuggestion) => void | Promise<void>;
  onFeedback: (messageId: string, helpful: boolean) => void;
};

export function ChatbotMessageList({
  messages,
  locale,
  onRelatedQuestion,
  onFeedback
}: ChatbotMessageListProps) {
  if (!messages.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600">
        {locale === "ar"
          ? "اسأل عن أي خطوة داخل النظام مثل Sources أو Recommendations أو Actions أو Reports."
          : "Ask about any workflow step inside the system, such as Sources, Recommendations, Actions, or Reports."}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {messages.map((message) => {
        const isBot = message.sender === "bot";
        const answer = message.answer;
        const isIntro = message.meta?.kind === "intro";

        return (
          <div key={message.id} className={cn("flex gap-2", isBot ? "justify-start" : "justify-end")}>
            {isBot ? (
              <SmartRobotIcon className="mt-1 h-8 w-8 shrink-0 rounded-2xl border border-slate-200 bg-white sm:h-9 sm:w-9" />
            ) : null}

            <div
              className={cn(
                "max-w-[88%] rounded-[22px] px-3.5 py-3 text-[13px] leading-6 shadow-sm sm:max-w-[86%] sm:text-sm",
                locale === "ar" ? "text-right" : "text-left",
                isBot
                  ? isIntro
                    ? "border border-sky-100 bg-sky-50/80 text-slate-800"
                    : "border border-slate-200 bg-white text-slate-800"
                  : "bg-slate-950 text-white"
              )}
            >
              {!isBot ? <div className="whitespace-pre-line break-words">{message.text}</div> : null}

              {isBot && answer ? (
                <div className="space-y-3">
                  <div>
                    {answer.title ? (
                      <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 sm:text-xs">
                        {answer.title}
                      </div>
                    ) : null}
                    {answer.shortAnswer ? (
                      <div className="whitespace-pre-line break-words font-medium text-slate-900">
                        {answer.shortAnswer}
                      </div>
                    ) : null}
                    {answer.detailedAnswer ? (
                      <div className="mt-2 whitespace-pre-line break-words text-slate-600">
                        {answer.detailedAnswer}
                      </div>
                    ) : null}
                  </div>

                  {answer.steps?.length ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                      <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 sm:text-xs">
                        {locale === "ar" ? "الخطوات" : "Steps"}
                      </div>
                      <ol className="space-y-1.5 text-slate-700">
                        {answer.steps.map((step, index) => (
                          <li key={`${message.id}-step-${index}`} className="flex gap-2">
                            <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white">
                              {index + 1}
                            </span>
                            <span className="min-w-0 break-words">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  ) : null}

                  {answer.note ? (
                    <div className="rounded-2xl border border-sky-200 bg-sky-50 px-3 py-2 text-[12px] text-sky-800 sm:text-xs">
                      <span className="font-semibold">{locale === "ar" ? "ملاحظة:" : "Note:"}</span> {answer.note}
                    </div>
                  ) : null}

                  {answer.warning ? (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] font-medium text-amber-800 sm:text-xs">
                      <span className="font-semibold">{locale === "ar" ? "تنبيه:" : "Warning:"}</span> {answer.warning}
                    </div>
                  ) : null}

                  {answer.relatedQuestions?.length ? (
                    <div>
                      <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 sm:text-xs">
                        {locale === "ar" ? "أسئلة مرتبطة" : "Related questions"}
                      </div>
                      <div className="flex flex-wrap gap-2">
                          {answer.relatedQuestions.map((question, index) => (
                            <Button
                              key={`${message.id}-related-${index}`}
                              variant="outline"
                              className="h-auto shrink-0 rounded-full border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 sm:text-xs"
                              onClick={() => void onRelatedQuestion(question)}
                            >
                              {question.label}
                            </Button>
                          ))}
                        </div>
                    </div>
                  ) : null}

                  {!isIntro ? (
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 sm:text-xs">
                      <span>{locale === "ar" ? "هل أفادتك الإجابة؟" : "Was this helpful?"}</span>
                      <button
                        type="button"
                        className="rounded-full border border-slate-200 px-2 py-1 transition hover:bg-slate-50"
                        onClick={() => onFeedback(message.id, true)}
                      >
                        👍
                      </button>
                      <button
                        type="button"
                        className="rounded-full border border-slate-200 px-2 py-1 transition hover:bg-slate-50"
                        onClick={() => onFeedback(message.id, false)}
                      >
                        👎
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
