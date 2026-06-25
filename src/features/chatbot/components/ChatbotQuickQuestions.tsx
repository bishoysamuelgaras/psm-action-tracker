import { Button } from "@/components/ui/button";
import type { ChatbotSuggestion } from "@/features/chatbot/lib/chatbot.types";

type ChatbotQuickQuestionsProps = {
  suggestions: ChatbotSuggestion[];
  onPick: (suggestion: ChatbotSuggestion) => void | Promise<void>;
  locale: "ar" | "en";
  pageLabel?: string;
};

export function ChatbotQuickQuestions({
  suggestions,
  onPick,
  locale,
  pageLabel
}: ChatbotQuickQuestionsProps) {
  if (!suggestions.length) {
    return null;
  }

  const visibleSuggestions = suggestions.slice(0, 8);

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 sm:text-xs">
          {locale === "ar" ? "أسئلة سريعة" : "Quick questions"}
        </h3>
        {pageLabel ? (
          <span className="hidden text-[11px] font-medium text-slate-400 sm:block">
            {locale === "ar" ? `مرتبطة بصفحة ${pageLabel}` : `Based on ${pageLabel}`}
          </span>
        ) : null}
      </div>

      <div className="-mx-1 overflow-x-auto pb-1">
        <div className="flex min-w-max gap-2 px-1">
          {visibleSuggestions.map((suggestion) => (
            <Button
              key={suggestion.intentKey}
              variant="outline"
              className="h-auto min-h-0 shrink-0 rounded-full border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 sm:text-xs"
              onClick={() => void onPick(suggestion)}
            >
              {suggestion.label}
            </Button>
          ))}
        </div>
      </div>
    </section>
  );
}
