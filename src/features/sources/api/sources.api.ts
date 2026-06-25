import { callReservedNumberRpc } from "@/lib/rpc";
import { supabase } from "@/lib/supabase";
import { getSourceDisplayNo } from "@/lib/source-display";
import type { Database } from "@/types/database";

type SourceRow = Database["public"]["Tables"]["sources"]["Row"];
type SourceInsert = Database["public"]["Tables"]["sources"]["Insert"];
type SourceUpdate = Database["public"]["Tables"]["sources"]["Update"];
type DepartmentRow = Database["public"]["Tables"]["departments"]["Row"];
type SourceTypeRow = Database["public"]["Tables"]["source_types"]["Row"];

type ProfileLite = {
  id: string;
  full_name: string;
};

export type SourceListItem = {
  id: string;
  sourceNo: string;
  sourceTypeCode: string;
  title: string;
  referenceNo: string | null;
  sourceDate: string;
  departmentId: string | null;
  summary: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SourceFormValues = {
  sourceNo: string;
  sourceTypeCode: string;
  title: string;
  referenceNo: string;
  sourceDate: string;
  departmentId: string;
  summary: string;
};

export type SourceOption = {
  value: string;
  label: string;
};

function mapSource(row: SourceRow): SourceListItem {
  return {
    id: row.id,
    sourceNo: getSourceDisplayNo(row.source_no, row.reference_no),
    sourceTypeCode: row.source_type_code,
    title: row.title,
    referenceNo: row.reference_no,
    sourceDate: row.source_date,
    departmentId: row.department_id,
    summary: row.summary,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function fetchSources(): Promise<SourceListItem[]> {
  const { data, error } = await supabase
    .from("sources")
    .select(
      "id, source_no, source_type_code, title, reference_no, source_date, department_id, summary, created_by, created_at, updated_at"
    )
    .order("source_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => mapSource(row as SourceRow));
}

export async function fetchSourceTypes(): Promise<SourceOption[]> {
  const { data, error } = await supabase
    .from("source_types")
    .select("code, name")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) throw error;

  return (data as Pick<SourceTypeRow, "code" | "name">[] | null)?.map((row) => ({
    value: row.code,
    label: row.name
  })) ?? [];
}

export async function fetchDepartments(): Promise<SourceOption[]> {
  const { data, error } = await supabase
    .from("departments")
    .select("id, name")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) throw error;

  return (data as Pick<DepartmentRow, "id" | "name">[] | null)?.map((row) => ({
    value: row.id,
    label: row.name
  })) ?? [];
}

export async function reserveSourceNumber(sourceTypeCode: string, sourceDate: string): Promise<string> {
  if (!sourceTypeCode || !sourceDate) return "";

  return callReservedNumberRpc(
    [
      {
        fn: "preview_source_number_v2",
        args: {
          p_source_date: sourceDate,
          p_source_type_code: sourceTypeCode
        }
      },
      {
        fn: "preview_source_number",
        args: {
          p_source_type_code: sourceTypeCode,
          p_source_date: sourceDate
        }
      }
    ],
    "source number preview"
  );
}

export async function createSource(payload: SourceInsert): Promise<SourceListItem> {
  const createPayload: SourceInsert = {
    ...payload,
    source_no: ""
  };

  const { data, error } = await supabase
    .from("sources")
    .insert(createPayload)
    .select(
      "id, source_no, source_type_code, title, reference_no, source_date, department_id, summary, created_by, created_at, updated_at"
    )
    .single();

  if (error) throw error;

  return mapSource(data as SourceRow);
}

export async function updateSource(id: string, payload: SourceUpdate): Promise<SourceListItem> {
  const { data, error } = await supabase
    .from("sources")
    .update(payload)
    .eq("id", id)
    .select(
      "id, source_no, source_type_code, title, reference_no, source_date, department_id, summary, created_by, created_at, updated_at"
    )
    .single();

  if (error) throw error;

  return mapSource(data as SourceRow);
}

export async function deleteSource(id: string): Promise<void> {
  const { error } = await supabase.from("sources").delete().eq("id", id);

  if (error) throw error;
}

export async function fetchSourceCreatorName(createdBy: string | null): Promise<string | null> {
  if (!createdBy) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("id", createdBy)
    .single();

  if (error) return null;

  return (data as ProfileLite).full_name;
}
