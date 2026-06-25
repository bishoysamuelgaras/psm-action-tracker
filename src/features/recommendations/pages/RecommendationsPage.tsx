import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { BidiBlock, BidiCode, BidiText } from "@/components/ui/bidi";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PriorityInfoTooltip } from "@/components/ui/priority-info-tooltip";
import { SortableHeader } from "@/components/ui/sortable-header";
import { useRoleAccess } from "@/features/auth/hooks/useRoleAccess";
import { useAuth } from "@/features/auth/hooks/useAuth";
import {
  createRecommendation,
  deleteRecommendation,
  listRecommendationLookups,
  listRecommendations,
  reserveRecommendationNumber,
  updateRecommendation,
  type RecommendationFormLookups,
  type RecommendationListItem,
  type SaveRecommendationInput
} from "@/features/recommendations/api/recommendations.api";
import { formatDateLabel } from "@/lib/utils";
import { rewriteRecommendationTextWithGroq } from "@/features/recommendations/api/recommendations.api";
import { getPriorityBadgeLabel } from "@/lib/priority";
import { nextSortConfig, sortByConfig, type SortConfig } from "@/lib/sorting";

type RecommendationSortKey = "no" | "source" | "recommendation" | "category" | "priority" | "created";

type RecommendationFormState = {
  sourceId: string;
  recommendationNo: string;
  recommendationText: string;
  categoryId: string;
  priorityCode: string;
};

const DEFAULT_FORM: RecommendationFormState = {
  sourceId: "",
  recommendationNo: "",
  recommendationText: "",
  categoryId: "",
  priorityCode: "medium"
};

type BrowserSpeechRecognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: { resultIndex?: number; results?: ArrayLike<ArrayLike<{ transcript?: string }>> }) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

type VoiceLanguageMode = "auto" | "ar-EG" | "en-US";

type RewritePreviewState = {
  originalText: string;
  rewrittenText: string;
} | null;

const PROFESSIONAL_REWRITE_HINT =
  "Magic AI sends the current text to Groq and returns a cleaner professional PSM-style rewrite for review before replacement.";

const priorityBadgeTone: Record<string, "slate" | "amber" | "red" | "green" | "blue"> = {
  low: "green",
  medium: "blue",
  high: "amber",
  critical: "red"
};

const VOICE_LANGUAGE_OPTIONS: Array<{ value: VoiceLanguageMode; label: string }> = [
  { value: "auto", label: "Auto" },
  { value: "ar-EG", label: "Arabic" },
  { value: "en-US", label: "English" }
];

function detectSpeechRecognitionLanguage(text: string, caretPosition?: number): "ar-EG" | "en-US" {
  const maxWindow = 60;
  const normalizedCaret = typeof caretPosition === "number" ? Math.max(0, Math.min(caretPosition, text.length)) : text.length;
  const primaryContext = text.slice(Math.max(0, normalizedCaret - maxWindow), normalizedCaret);
  const fallbackContext = text.slice(Math.max(0, text.length - maxWindow));
  const sample = (primaryContext || fallbackContext || text).trim();

  const arabicMatches = sample.match(/[؀-ۿݐ-ݿࢠ-ࣿ]/g) ?? [];
  const latinMatches = sample.match(/[A-Za-z]/g) ?? [];

  if (arabicMatches.length === 0 && latinMatches.length === 0) {
    return "ar-EG";
  }

  if (latinMatches.length > arabicMatches.length) {
    return "en-US";
  }

  return "ar-EG";
}

export function RecommendationsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { canManageRecommendations } = useRoleAccess();

  const [rows, setRows] = useState<RecommendationListItem[]>([]);
  const [lookups, setLookups] = useState<RecommendationFormLookups>({
    sources: [],
    categories: [],
    priorities: []
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [searchText, setSearchText] = useState("");
  const [sourceFilter, setSourceFilter] = useState(searchParams.get("sourceId") ?? "");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<RecommendationFormState>({
    ...DEFAULT_FORM,
    sourceId: searchParams.get("sourceId") ?? ""
  });

  const [numberBusy, setNumberBusy] = useState(false);
  const [numberHint, setNumberHint] = useState("Select source to preview recommendation number.");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const selectionRef = useRef<{ start: number; end: number } | null>(null);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [voiceLanguageMode, setVoiceLanguageMode] = useState<VoiceLanguageMode>("auto");
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [rewriteBusy, setRewriteBusy] = useState(false);
  const [rewriteError, setRewriteError] = useState("");
  const [rewritePreview, setRewritePreview] = useState<RewritePreviewState>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig<RecommendationSortKey>>({ key: "created", direction: "desc" });

  const sortedRows = useMemo(
    () =>
      sortByConfig(rows, sortConfig, (row, key) => {
        switch (key) {
          case "no":
            return row.recommendationNo;
          case "source":
            return `${row.sourceNo} ${row.sourceTitle}`;
          case "recommendation":
            return row.recommendationText;
          case "category":
            return row.categoryName;
          case "priority":
            return row.priorityCode;
          case "created":
            return row.createdAt;
          default:
            return "";
        }
      }),
    [rows, sortConfig]
  );

  const activeSource = useMemo(
    () => lookups.sources.find((item) => item.id === sourceFilter) ?? null,
    [lookups.sources, sourceFilter]
  );

  const selectedRow = useMemo(
    () => rows.find((item) => item.id === editingId) ?? null,
    [editingId, rows]
  );

  const selectedSource = useMemo(
    () => lookups.sources.find((item) => item.id === form.sourceId) ?? null,
    [form.sourceId, lookups.sources]
  );

  useEffect(() => {
    const candidate = (
      window as Window & {
        SpeechRecognition?: BrowserSpeechRecognitionConstructor;
        webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
      }
    ).SpeechRecognition ?? (
      window as Window & {
        SpeechRecognition?: BrowserSpeechRecognitionConstructor;
        webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
      }
    ).webkitSpeechRecognition;

    setVoiceSupported(Boolean(candidate));
  }, []);

  useEffect(() => () => {
    recognitionRef.current?.stop();
  }, []);

  const loadPageData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [listData, lookupData] = await Promise.all([
        listRecommendations({
          search: searchText,
          sourceId: sourceFilter || undefined,
          categoryId: categoryFilter || undefined,
          priorityCode: priorityFilter || undefined
        }),
        listRecommendationLookups()
      ]);

      setRows(listData);
      setLookups(lookupData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load recommendations.");
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, priorityFilter, searchText, sourceFilter]);

  useEffect(() => {
    void loadPageData();
  }, [loadPageData]);

  useEffect(() => {
    if (sourceFilter) {
      setSearchParams({ sourceId: sourceFilter });
      setForm((current) => ({ ...current, sourceId: current.sourceId || sourceFilter }));
      return;
    }

    setSearchParams({});
  }, [setSearchParams, sourceFilter]);

  useEffect(() => {
    if (editingId) {
      setNumberBusy(false);
      setNumberHint("This number is locked after creation.");
      return;
    }

    if (!canManageRecommendations) return;

    if (!form.sourceId) {
      setForm((current) => ({ ...current, recommendationNo: "" }));
      setNumberBusy(false);
      setNumberHint("Select source to preview recommendation number.");
      return;
    }

    let active = true;
    setNumberBusy(true);
    setNumberHint("Loading next number preview...");

    void reserveRecommendationNumber(form.sourceId)
      .then((recommendationNo) => {
        if (!active) return;
        setForm((current) => {
          if (current.sourceId !== form.sourceId || editingId) return current;
          return { ...current, recommendationNo };
        });
        setNumberHint("Preview only. The final number is assigned only after Save.");
      })
      .catch((err) => {
        if (!active) return;
        setForm((current) => ({ ...current, recommendationNo: "" }));
        setNumberHint(err instanceof Error ? err.message : "Failed to load recommendation number preview.");
      })
      .finally(() => {
        if (active) setNumberBusy(false);
      });

    return () => {
      active = false;
    };
  }, [canManageRecommendations, editingId, form.sourceId]);

  const stats = useMemo(() => {
    const criticalAndHigh = rows.filter((row) => ["critical", "high"].includes(row.priorityCode)).length;
    const distinctSources = new Set(rows.map((row) => row.sourceId)).size;

    return {
      total: rows.length,
      criticalAndHigh,
      distinctSources
    };
  }, [rows]);

  const resetForm = useCallback(() => {
    setEditingId(null);
    setForm({
      ...DEFAULT_FORM,
      sourceId: sourceFilter || ""
    });
    setNumberHint("Select source to preview recommendation number.");
    setNotice("");
    setVoiceError("");
    setRewriteError("");
    setRewritePreview(null);
    recognitionRef.current?.stop();
    setIsListening(false);
  }, [sourceFilter]);

  const startEdit = useCallback((row: RecommendationListItem) => {
    setEditingId(row.id);
    setForm({
      sourceId: row.sourceId,
      recommendationNo: row.recommendationNo ?? "",
      recommendationText: row.recommendationText,
      categoryId: row.categoryId || "",
      priorityCode: row.priorityCode || "medium"
    });
    setNumberHint("This number is locked after creation.");
    setNotice("");
    setVoiceError("");
    setRewriteError("");
    setRewritePreview(null);
    recognitionRef.current?.stop();
    setIsListening(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  function insertTextAtCursor(nextText: string) {
    const textarea = textareaRef.current;
    const fallbackText = form.recommendationText;
    const start = selectionRef.current?.start ?? textarea?.selectionStart ?? fallbackText.length;
    const end = selectionRef.current?.end ?? textarea?.selectionEnd ?? fallbackText.length;
    const safeStart = Math.max(0, start);
    const safeEnd = Math.max(safeStart, end);
    const prefix = fallbackText.slice(0, safeStart);
    const suffix = fallbackText.slice(safeEnd);
    const spacerBefore = prefix && !/\s$/.test(prefix) ? " " : "";
    const spacerAfter = suffix && !/^\s/.test(suffix) ? " " : "";
    const merged = `${prefix}${spacerBefore}${nextText.trim()}${spacerAfter}${suffix}`.replace(/\s{2,}/g, " ").trim();

    setForm((current) => ({ ...current, recommendationText: merged }));
    setTimeout(() => {
      textareaRef.current?.focus();
      const caret = (prefix + spacerBefore + nextText.trim()).length;
      textareaRef.current?.setSelectionRange(caret, caret);
    }, 0);
  }

  function handleVoiceToggle() {
    if (!canManageRecommendations || saving || rewriteBusy) return;

    const SpeechRecognitionCtor = (
      window as Window & {
        SpeechRecognition?: BrowserSpeechRecognitionConstructor;
        webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
      }
    ).SpeechRecognition ?? (
      window as Window & {
        SpeechRecognition?: BrowserSpeechRecognitionConstructor;
        webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
      }
    ).webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      setVoiceError("Voice input works best on supported Chrome / Edge browsers.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    try {
      const recognition = new SpeechRecognitionCtor();
      const selectionStart = textareaRef.current?.selectionStart ?? form.recommendationText.length;
      const recognitionLanguage =
        voiceLanguageMode === "auto"
          ? detectSpeechRecognitionLanguage(form.recommendationText, selectionStart)
          : voiceLanguageMode;

      recognition.lang = recognitionLanguage;
      recognition.interimResults = true;
      recognition.continuous = false;
      recognition.onresult = (event) => {
        const results = event.results ? Array.from(event.results) : [];
        const transcript = results
          .slice(event.resultIndex ?? 0)
          .flatMap((result) => Array.from(result))
          .map((part) => part.transcript ?? "")
          .join(" ")
          .trim();

        if (transcript) {
          insertTextAtCursor(transcript);
          setVoiceError("");
        }
      };
      recognition.onerror = (event) => {
        const code = event.error || "unknown";
        const nextMessage =
          code === "not-allowed"
            ? "Microphone permission was denied."
            : code === "no-speech"
              ? "No speech was detected."
              : "Voice input failed. Please try again.";
        setVoiceError(nextMessage);
      };
      recognition.onend = () => {
        setIsListening(false);
        recognitionRef.current = null;
      };

      selectionRef.current = {
        start: textareaRef.current?.selectionStart ?? form.recommendationText.length,
        end: textareaRef.current?.selectionEnd ?? form.recommendationText.length
      };
      recognitionRef.current = recognition;
      setVoiceError("");
      setIsListening(true);
      recognition.start();
    } catch {
      setIsListening(false);
      setVoiceError("Voice input is not available on this browser.");
    }
  }

  async function handleMagicAiPreview() {
    if (!canManageRecommendations || saving || rewriteBusy) return;

    const currentText = form.recommendationText.trim();
    if (!currentText) {
      setRewriteError("Write or dictate recommendation text first.");
      return;
    }

    setRewriteBusy(true);
    setRewriteError("");

    try {
      const result = await rewriteRecommendationTextWithGroq(currentText);
      setRewritePreview({ originalText: currentText, rewrittenText: result.rewrittenText });
    } catch (err) {
      setRewritePreview(null);
      setRewriteError(err instanceof Error ? err.message : "Failed to improve the recommendation text.");
    } finally {
      setRewriteBusy(false);
    }
  }

  function applyRewritePreview() {
    if (!rewritePreview) return;
    setForm((current) => ({ ...current, recommendationText: rewritePreview.rewrittenText }));
    setRewritePreview(null);
    setRewriteError("");
    setTimeout(() => {
      textareaRef.current?.focus();
      const length = rewritePreview.rewrittenText.length;
      textareaRef.current?.setSelectionRange(length, length);
    }, 0);
  }

  function clearRewritePreview() {
    setRewritePreview(null);
    setRewriteError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canManageRecommendations) return;

    const payload: SaveRecommendationInput = {
      sourceId: form.sourceId,
      recommendationNo: form.recommendationNo,
      recommendationText: form.recommendationText,
      categoryId: form.categoryId || null,
      priorityCode: form.priorityCode || null,
      createdBy: user?.id
    };

    if (!payload.sourceId || !payload.recommendationText.trim()) {
      setError("Source and recommendation text are required.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      if (editingId) {
        await updateRecommendation(editingId, payload);
        setNotice("Recommendation updated successfully.");
      } else {
        await createRecommendation(payload);
        setNotice("Recommendation created successfully.");
      }

      resetForm();
      await loadPageData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save recommendation.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!canManageRecommendations) return;

    const confirmed = window.confirm(
      "Delete this recommendation? Any linked actions will also be affected if they already exist."
    );

    if (!confirmed) return;

    setSaving(true);
    setError("");
    setNotice("");

    try {
      await deleteRecommendation(id);
      if (editingId === id) {
        resetForm();
      }
      setNotice("Recommendation deleted successfully.");
      await loadPageData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete recommendation.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Filtered recommendations" value={String(stats.total)} tone="blue" />
        <MetricCard label="P1 + P2" value={String(stats.criticalAndHigh)} tone="amber" />
        <MetricCard label="Covered sources" value={String(stats.distinctSources)} tone="green" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[460px_minmax(0,1fr)]">
        <Card className="h-fit xl:sticky xl:top-24">
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>{editingId ? "Edit recommendation" : "Add recommendation"}</CardTitle>
                <CardDescription>
                  Pick the source first, review the next number preview, then save the recommendation text.
                </CardDescription>
              </div>
              <Badge tone={canManageRecommendations ? "green" : "slate"}>
                {canManageRecommendations ? "Manage" : "Read only"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5">
                <div className="flex items-center gap-3">
                  <Badge tone="blue">Step 1</Badge>
                  <div className="text-lg font-semibold text-slate-900">Identification and numbering</div>
                </div>

                <div className="mt-5 space-y-4">
                  <FormField label="Source" required>
                    <Select
                      value={form.sourceId}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          sourceId: event.target.value,
                          recommendationNo: ""
                        }))
                      }
                      disabled={!canManageRecommendations || saving || Boolean(editingId)}
                    >
                      <option value="">Select source</option>
                      {lookups.sources.map((source) => (
                        <option key={source.id} value={source.id}>
                          {source.label}
                        </option>
                      ))}
                    </Select>
                  </FormField>

                  <FormField label="Recommendation no." required hint={numberBusy ? "Loading next number preview..." : numberHint}>
                    <Input
                      value={editingId ? (selectedRow?.recommendationNo ?? form.recommendationNo) : form.recommendationNo}
                      placeholder="Preview only — final number on save"
                      disabled
                    />
                  </FormField>

                  <FormField label="Category">
                    <Select
                      value={form.categoryId}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, categoryId: event.target.value }))
                      }
                      disabled={!canManageRecommendations || saving}
                    >
                      <option value="">Uncategorized</option>
                      {lookups.categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </Select>
                  </FormField>

                  <FormField label={<span className="inline-flex items-center gap-2">Priority <PriorityInfoTooltip /></span>}>
                    <Select
                      value={form.priorityCode}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, priorityCode: event.target.value }))
                      }
                      disabled={!canManageRecommendations || saving}
                    >
                      {lookups.priorities.map((priority) => (
                        <option key={priority.code} value={priority.code}>
                          {priority.name}
                        </option>
                      ))}
                    </Select>
                  </FormField>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                <div className="flex items-center gap-3">
                  <Badge tone="slate">Preview</Badge>
                  <div className="text-lg font-semibold text-slate-900">Recommendation snapshot</div>
                </div>
                <div className="mt-5 space-y-3">
                  <SnapshotBlock
                    label="Recommendation no."
                    value={(editingId ? (selectedRow?.recommendationNo ?? form.recommendationNo) : form.recommendationNo) || "Will appear after source"}
                  />
                  <SnapshotBlock
                    label="Source"
                    value={selectedSource?.label || "Not selected"}
                    helper={!form.sourceId ? "Choose one source first." : undefined}
                  />
                  <SnapshotBlock
                    label="Source date"
                    value={selectedSource?.sourceDate ? formatDateLabel(selectedSource.sourceDate) : "—"}
                  />
                  <SnapshotBlock
                    label="Priority"
                    value={lookups.priorities.find((item) => item.code === form.priorityCode)?.name || "Not selected"}
                  />
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5">
                <div className="flex items-center gap-3">
                  <Badge tone="green">Step 2</Badge>
                  <div className="text-lg font-semibold text-slate-900">Recommendation details</div>
                </div>
                <div className="mt-5 space-y-4">
                  <FormField label="Recommendation text" required>
                    <Textarea
                      ref={textareaRef}
                      value={form.recommendationText}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, recommendationText: event.target.value }))
                      }
                      onSelect={(event) => {
                        const target = event.currentTarget;
                        selectionRef.current = {
                          start: target.selectionStart ?? 0,
                          end: target.selectionEnd ?? 0
                        };
                      }}
                      onKeyUp={(event) => {
                        const target = event.currentTarget;
                        selectionRef.current = {
                          start: target.selectionStart ?? 0,
                          end: target.selectionEnd ?? 0
                        };
                      }}
                      onClick={(event) => {
                        const target = event.currentTarget;
                        selectionRef.current = {
                          start: target.selectionStart ?? 0,
                          end: target.selectionEnd ?? 0
                        };
                      }}
                      placeholder="Write the recommendation exactly as issued by the investigation or audit team"
                      disabled={!canManageRecommendations || saving}
                      rows={5}
                    />
                  </FormField>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={handleVoiceToggle}
                      disabled={!canManageRecommendations || saving || !voiceSupported}
                      className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-300 bg-white text-slate-900 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                      aria-label={isListening ? "Stop voice input" : "Start voice input"}
                      title={voiceSupported ? (isListening ? "Stop voice input" : "Start voice input") : "Voice input works best on Chrome / Edge"}
                    >
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 1 0 6 0V6a3 3 0 0 0-3-3Z" />
                        <path d="M19 11a7 7 0 0 1-14 0" />
                        <path d="M12 18v3" />
                        <path d="M8 21h8" />
                      </svg>
                      {isListening ? <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_0_3px_rgba(239,68,68,0.16)]" /> : null}
                    </button>

                    <div className="w-[132px] min-w-[132px]">
                      <Select
                        value={voiceLanguageMode}
                        onChange={(event) => setVoiceLanguageMode(event.target.value as VoiceLanguageMode)}
                        disabled={!canManageRecommendations || saving || isListening || !voiceSupported}
                        aria-label="Voice input language"
                        title="Voice input language"
                      >
                        {VOICE_LANGUAGE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </Select>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void handleMagicAiPreview()}
                      disabled={!canManageRecommendations || saving || rewriteBusy || !form.recommendationText.trim()}
                    >
                      {rewriteBusy ? "Magic AI..." : "Magic AI"}
                    </Button>

                    {isListening ? <span className="text-sm font-medium text-red-600">Listening...</span> : null}
                    {!isListening && rewriteBusy ? <span className="text-sm font-medium text-blue-700">Sending text to Groq...</span> : null}
                  </div>

                  <div className="space-y-2 text-xs text-slate-500">
                    <div>Voice input inserts the spoken text into the recommendation field.</div>
                    <div>Auto follows the text near the cursor. For mixed Arabic + English in one sentence, switch the language manually for better accuracy.</div>
                    <div>{PROFESSIONAL_REWRITE_HINT}</div>
                  </div>

                  {voiceError ? (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                      {voiceError}
                    </div>
                  ) : null}

                  {rewriteError ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {rewriteError}
                    </div>
                  ) : null}

                  {rewritePreview ? (
                    <div className="rounded-3xl border border-blue-200 bg-blue-50/60 p-4 sm:p-5">
                      <div className="flex items-center gap-3">
                        <Badge tone="blue">Magic AI</Badge>
                        <div>
                          <div className="text-base font-semibold text-slate-900">Groq rewrite preview</div>
                          <div className="text-sm text-slate-600">Review the improved wording before replacing the current text.</div>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-4 lg:grid-cols-2">
                        <div className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Current text</div>
                          <BidiBlock className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">{rewritePreview.originalText}</BidiBlock>
                        </div>
                        <div className="rounded-3xl border border-blue-200 bg-white p-4 shadow-sm">
                          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Professional PSM-style rewrite</div>
                          <BidiBlock className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-900">{rewritePreview.rewrittenText}</BidiBlock>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-3">
                        <Button type="button" onClick={applyRewritePreview}>Use rewritten text</Button>
                        <Button type="button" variant="outline" onClick={clearRewritePreview}>Keep original</Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              {error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              {notice ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {notice}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <Button type="submit" disabled={!canManageRecommendations || saving || (!editingId && (!form.recommendationNo || numberBusy))}>
                  {saving ? "Saving..." : editingId ? "Update recommendation" : "Create recommendation"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  disabled={saving}
                >
                  {editingId ? "Cancel edit" : "Reset"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <CardTitle>Recommendations register</CardTitle>
                <CardDescription>
                  Search and filter recommendations across incident investigations, audits, and committee outputs.
                </CardDescription>
              </div>

              {activeSource ? (
                <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                  <div className="font-semibold">Source filter active</div>
                  <BidiText className="mt-1 block">{activeSource.label}</BidiText>
                </div>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_repeat(3,minmax(0,0.8fr))]">
              <Input
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Search by number or text"
              />

              <Select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)}>
                <option value="">All sources</option>
                {lookups.sources.map((source) => (
                  <option key={source.id} value={source.id}>
                    {source.label}
                  </option>
                ))}
              </Select>

              <Select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                <option value="">All categories</option>
                {lookups.categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>

              <Select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}>
                <option value="">All priorities</option>
                {lookups.priorities.map((priority) => (
                  <option key={priority.code} value={priority.code}>
                    {priority.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button type="button" onClick={() => void loadPageData()} disabled={loading}>
                {loading ? "Refreshing..." : "Refresh list"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSearchText("");
                  setSourceFilter("");
                  setCategoryFilter("");
                  setPriorityFilter("");
                }}
              >
                Clear filters
              </Button>
            </div>

            {loading ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-sm text-slate-600">
                Loading recommendations...
              </div>
            ) : rows.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-sm leading-7 text-slate-600">
                No recommendations match the current filters. Start by creating the first recommendation or clear the filters.
              </div>
            ) : (
              <>
                <div className="hidden overflow-x-auto lg:block">
                  <table className="min-w-full border-separate border-spacing-y-2 text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-[0.14em] text-slate-500">
                        <SortableHeader sortKey="no" sortConfig={sortConfig} onSort={(key) => setSortConfig((current) => nextSortConfig(current, key))}>No.</SortableHeader>
                        <SortableHeader sortKey="source" sortConfig={sortConfig} onSort={(key) => setSortConfig((current) => nextSortConfig(current, key))}>Source</SortableHeader>
                        <SortableHeader sortKey="recommendation" sortConfig={sortConfig} onSort={(key) => setSortConfig((current) => nextSortConfig(current, key))}>Recommendation</SortableHeader>
                        <SortableHeader sortKey="category" sortConfig={sortConfig} onSort={(key) => setSortConfig((current) => nextSortConfig(current, key))}>Category</SortableHeader>
                        <SortableHeader sortKey="priority" sortConfig={sortConfig} onSort={(key) => setSortConfig((current) => nextSortConfig(current, key))}>
                          <span className="inline-flex items-center gap-2">Priority <PriorityInfoTooltip /></span>
                        </SortableHeader>
                        <SortableHeader sortKey="created" sortConfig={sortConfig} onSort={(key) => setSortConfig((current) => nextSortConfig(current, key))}>Created</SortableHeader>
                        <th className="px-3 py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedRows.map((row) => (
                        <tr key={row.id} className="rounded-2xl bg-slate-50 align-top text-slate-700">
                          <td className="rounded-l-2xl px-3 py-4 font-semibold text-slate-900">
                            <BidiCode>{row.recommendationNo}</BidiCode>
                          </td>
                          <td className="px-3 py-4">
                            <BidiCode className="font-semibold text-slate-900">{row.sourceNo}</BidiCode>
                            <BidiText className="mt-1 block text-xs text-slate-500">{row.sourceTitle}</BidiText>
                          </td>
                          <td className="max-w-xl px-3 py-4 leading-7 text-slate-700">
                            <BidiBlock>{row.recommendationText}</BidiBlock>
                          </td>
                          <td className="px-3 py-4"><BidiText>{row.categoryName}</BidiText></td>
                          <td className="px-3 py-4">
                            <Badge tone={priorityBadgeTone[row.priorityCode] ?? "slate"}>
                              {getPriorityBadgeLabel(row.priorityCode)}
                            </Badge>
                          </td>
                          <td className="px-3 py-4 text-slate-500">{formatDateLabel(row.createdAt)}</td>
                          <td className="rounded-r-2xl px-3 py-4">
                            <div className="flex flex-wrap gap-2">
                              {canManageRecommendations ? (
                                <>
                                  <Button type="button" variant="outline" onClick={() => startEdit(row)}>
                                    Edit
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                    onClick={() => void handleDelete(row.id)}
                                  >
                                    Delete
                                  </Button>
                                </>
                              ) : (
                                <span className="text-xs text-slate-500">Read only</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="grid gap-3 lg:hidden">
                  {sortedRows.map((row) => (
                    <div key={row.id} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <BidiCode className="text-sm font-semibold text-slate-900">{row.recommendationNo}</BidiCode>
                          <div className="mt-1 text-xs text-slate-500"><BidiCode>{row.sourceNo}</BidiCode> — <BidiText>{row.sourceTitle}</BidiText></div>
                        </div>
                        <Badge tone={priorityBadgeTone[row.priorityCode] ?? "slate"}>
                          {getPriorityBadgeLabel(row.priorityCode)}
                        </Badge>
                      </div>
                      <BidiBlock className="mt-3 text-sm leading-7 text-slate-700">{row.recommendationText}</BidiBlock>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <BidiText>{row.categoryName}</BidiText>
                        <span>•</span>
                        <span>{formatDateLabel(row.createdAt)}</span>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {canManageRecommendations ? (
                          <>
                            <Button type="button" variant="outline" onClick={() => startEdit(row)}>
                              Edit
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              className="text-red-600 hover:bg-red-50 hover:text-red-700"
                              onClick={() => void handleDelete(row.id)}
                            >
                              Delete
                            </Button>
                          </>
                        ) : (
                          <Badge tone="slate">Read only</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usage notes</CardTitle>
          <CardDescription>
            Keep the source numbering and recommendation numbering exactly aligned with the original report for cleaner traceability.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-600">
            <div className="font-semibold text-slate-900">1. One source, many recommendations</div>
            <p className="mt-2">
              Use one source for each investigation, audit, or committee report, then register all official recommendations underneath it.
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-600">
            <div className="font-semibold text-slate-900">2. Preserve original wording</div>
            <p className="mt-2">
              Avoid paraphrasing the recommendation text. This keeps later action verification and report reviews much stronger.
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-600">
            <div className="font-semibold text-slate-900">3. Next workflow step</div>
            <p className="mt-2">
              After recommendations are ready, the next module will create one or many executable actions for each recommendation.
            </p>
            <Link to="/actions" className="mt-3 inline-flex text-sm font-semibold text-blue-700 hover:text-blue-800">
              Open actions workspace →
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SnapshotBlock({ label, value, helper }: { label: string; value: string; helper?: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</div>
      <BidiText className="mt-2 block text-lg font-semibold leading-7 text-slate-900">{value}</BidiText>
      {helper ? <div className="mt-1 text-sm text-slate-500">{helper}</div> : null}
    </div>
  );
}

function MetricCard({
  label,
  value,
  tone
}: {
  label: string;
  value: string;
  tone: "blue" | "amber" | "green";
}) {
  const toneClasses = {
    blue: "border-blue-200 bg-blue-50 text-blue-900",
    amber: "border-amber-200 bg-amber-50 text-amber-900",
    green: "border-emerald-200 bg-emerald-50 text-emerald-900"
  } as const;

  return (
    <div className={`rounded-3xl border p-5 ${toneClasses[tone]}`}>
      <div className="text-sm font-medium opacity-80">{label}</div>
      <div className="mt-3 text-3xl font-bold">{value}</div>
    </div>
  );
}

