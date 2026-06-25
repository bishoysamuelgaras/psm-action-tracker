import { callReservedNumberRpc } from "@/lib/rpc";
import { supabase } from "@/lib/supabase";
import { getPriorityDisplayLabel } from "@/lib/priority";
import { getSourceDisplayNo } from "@/lib/source-display";

type RecommendationRow = {
  id: string;
  source_id: string;
  recommendation_no: string;
  recommendation_text: string;
  category_id: string | null;
  priority_code: string | null;
  created_at: string;
  updated_at: string;
};

type SourceLookupRow = {
  id: string;
  source_no: string | null;
  reference_no: string | null;
  title: string;
  source_date: string;
};

type CategoryLookupRow = {
  id: string;
  code: string;
  name: string;
  sort_order: number;
};

type PriorityLookupRow = {
  code: string;
  name: string;
  tone: string;
  sort_order: number;
};

export type RecommendationListFilters = {
  search?: string;
  sourceId?: string;
  categoryId?: string;
  priorityCode?: string;
};

export type RecommendationListItem = {
  id: string;
  sourceId: string;
  sourceNo: string;
  sourceTitle: string;
  sourceDate: string;
  recommendationNo: string;
  recommendationText: string;
  categoryId: string | null;
  categoryName: string;
  priorityCode: string;
  createdAt: string;
  updatedAt: string;
};

export type RecommendationFormLookups = {
  sources: Array<{
    id: string;
    sourceNo: string;
    title: string;
    sourceDate: string;
    label: string;
  }>;
  categories: Array<{
    id: string;
    code: string;
    name: string;
  }>;
  priorities: Array<{
    code: string;
    name: string;
    tone: string;
  }>;
};

export type SaveRecommendationInput = {
  sourceId: string;
  recommendationNo: string;
  recommendationText: string;
  categoryId?: string | null;
  priorityCode?: string | null;
  createdBy?: string;
};

function normalizeSearchValue(value: string) {
  return value.replace(/[%_,]/g, " ").trim();
}

export async function listRecommendationLookups(): Promise<RecommendationFormLookups> {
  const [sourcesResult, categoriesResult, prioritiesResult] = await Promise.all([
    supabase
      .from("sources")
      .select("id, source_no, reference_no, title, source_date")
      .order("source_date", { ascending: false })
      .order("source_no", { ascending: true }),
    supabase
      .from("recommendation_categories")
      .select("id, code, name, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("priority_levels")
      .select("code, name, tone, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
  ]);

  if (sourcesResult.error) throw sourcesResult.error;
  if (categoriesResult.error) throw categoriesResult.error;
  if (prioritiesResult.error) throw prioritiesResult.error;

  const sources = (sourcesResult.data as SourceLookupRow[]).map((row) => {
    const sourceNo = getSourceDisplayNo(row.source_no, row.reference_no);
    return {
      id: row.id,
      sourceNo,
      title: row.title,
      sourceDate: row.source_date,
      label: `${sourceNo} — ${row.title}`
    };
  });

  const categories = (categoriesResult.data as CategoryLookupRow[]).map((row) => ({
    id: row.id,
    code: row.code,
    name: row.name
  }));

  const priorities = (prioritiesResult.data as PriorityLookupRow[]).map((row) => ({
    code: row.code,
    name: getPriorityDisplayLabel(row.code, row.name),
    tone: row.tone || "slate"
  }));

  return { sources, categories, priorities };
}

export async function listRecommendations(
  filters: RecommendationListFilters = {}
): Promise<RecommendationListItem[]> {
  let query = supabase
    .from("recommendations")
    .select(
      "id, source_id, recommendation_no, recommendation_text, category_id, priority_code, created_at, updated_at"
    )
    .order("created_at", { ascending: false });

  if (filters.sourceId) {
    query = query.eq("source_id", filters.sourceId);
  }

  if (filters.categoryId) {
    query = query.eq("category_id", filters.categoryId);
  }

  if (filters.priorityCode) {
    query = query.eq("priority_code", filters.priorityCode);
  }

  const normalizedSearch = filters.search ? normalizeSearchValue(filters.search) : "";
  if (normalizedSearch) {
    query = query.or(
      `recommendation_no.ilike.%${normalizedSearch}%,recommendation_text.ilike.%${normalizedSearch}%`
    );
  }

  const { data, error } = await query;
  if (error) throw error;

  const rows = (data ?? []) as RecommendationRow[];
  const sourceIds = Array.from(new Set(rows.map((row) => row.source_id).filter(Boolean)));
  const categoryIds = Array.from(
    new Set(rows.map((row) => row.category_id).filter((value): value is string => Boolean(value)))
  );

  const [sourcesResult, categoriesResult] = await Promise.all([
    sourceIds.length
      ? supabase
          .from("sources")
          .select("id, source_no, reference_no, title, source_date")
          .in("id", sourceIds)
      : Promise.resolve({ data: [], error: null }),
    categoryIds.length
      ? supabase
          .from("recommendation_categories")
          .select("id, code, name, sort_order")
          .in("id", categoryIds)
      : Promise.resolve({ data: [], error: null })
  ]);

  if (sourcesResult.error) throw sourcesResult.error;
  if (categoriesResult.error) throw categoriesResult.error;

  const sourcesMap = new Map<string, SourceLookupRow>(
    ((sourcesResult.data ?? []) as SourceLookupRow[]).map((row) => [row.id, row])
  );
  const categoriesMap = new Map<string, CategoryLookupRow>(
    ((categoriesResult.data ?? []) as CategoryLookupRow[]).map((row) => [row.id, row])
  );

  return rows.map((row) => {
    const source = sourcesMap.get(row.source_id);
    const category = row.category_id ? categoriesMap.get(row.category_id) : null;

    return {
      id: row.id,
      sourceId: row.source_id,
      sourceNo: source ? getSourceDisplayNo(source.source_no, source.reference_no) : "—",
      sourceTitle: source?.title ?? "Unknown source",
      sourceDate: source?.source_date ?? "",
      recommendationNo: row.recommendation_no,
      recommendationText: row.recommendation_text,
      categoryId: row.category_id,
      categoryName: category?.name ?? "Uncategorized",
      priorityCode: row.priority_code ?? "medium",
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  });
}

export async function reserveRecommendationNumber(sourceId: string): Promise<string> {
  if (!sourceId) return "";

  return callReservedNumberRpc(
    [
      {
        fn: "preview_recommendation_number_v2",
        args: {
          p_source_id: sourceId
        }
      },
      {
        fn: "preview_recommendation_number",
        args: {
          p_source_id: sourceId
        }
      }
    ],
    "recommendation number preview"
  );
}

export async function createRecommendation(input: SaveRecommendationInput) {
  const payload = {
    source_id: input.sourceId,
    recommendation_no: "",
    recommendation_text: input.recommendationText.trim(),
    category_id: input.categoryId || null,
    priority_code: input.priorityCode || null,
    created_by: input.createdBy ?? null
  };

  const { data, error } = await supabase.from("recommendations").insert(payload).select("id").single();
  if (error) throw error;
  return data;
}

export async function updateRecommendation(id: string, input: SaveRecommendationInput) {
  const payload = {
    source_id: input.sourceId,
    recommendation_text: input.recommendationText.trim(),
    category_id: input.categoryId || null,
    priority_code: input.priorityCode || null
  };

  const { data, error } = await supabase
    .from("recommendations")
    .update(payload)
    .eq("id", id)
    .select("id")
    .single();

  if (error) throw error;
  return data;
}

export async function deleteRecommendation(id: string) {
  const { error } = await supabase.from("recommendations").delete().eq("id", id);
  if (error) throw error;
}


export type RewriteRecommendationResponse = {
  rewrittenText?: string;
  provider?: string;
  model?: string;
  error?: string;
};

export async function rewriteRecommendationTextWithGroq(inputText: string) {
  const text = inputText.trim();
  if (!text) {
    throw new Error("Recommendation text is required.");
  }

  const response = await fetch("/.netlify/functions/rewrite-recommendation", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ text })
  });

  const rawBody = await response.text();
  let payload: RewriteRecommendationResponse = {};

  if (rawBody) {
    try {
      payload = JSON.parse(rawBody) as RewriteRecommendationResponse;
    } catch {
      if (!response.ok && response.status === 404) {
        throw new Error(
          "Function rewrite-recommendation was not found. Run the updated Netlify functions with netlify dev or deploy them first."
        );
      }
      throw new Error("Groq rewrite returned an unreadable response.");
    }
  }

  if (!response.ok) {
    throw new Error(payload.error || "Failed to rewrite recommendation.");
  }

  const rewrittenText = String(payload.rewrittenText || "").trim();
  if (!rewrittenText) {
    throw new Error("Groq rewrite returned an empty result.");
  }

  return {
    rewrittenText,
    provider: payload.provider || "groq",
    model: payload.model || ""
  };
}
