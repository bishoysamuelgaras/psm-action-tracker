import { supabase } from "@/lib/supabase";

export type MasterDataEntityKey =
  | "departments"
  | "source_types"
  | "recommendation_categories"
  | "priority_levels"
  | "action_statuses";

export type MasterDataRecord = {
  rowKey: string;
  id?: string;
  code: string;
  name: string;
  sortOrder?: number;
  tone?: string;
  slaDays?: number | null;
  isActive: boolean;
  isTerminal?: boolean;
  requiresCompletionDate?: boolean;
  requiresVerificationDate?: boolean;
};

export type MasterDataSection = {
  key: MasterDataEntityKey;
  label: string;
  description: string;
  supportsSortOrder: boolean;
  supportsTone: boolean;
  supportsSlaDays: boolean;
  supportsStatusFlags: boolean;
};

export const MASTER_DATA_SECTIONS: MasterDataSection[] = [
  {
    key: "departments",
    label: "Departments",
    description: "Departments responsible for actions, ownership, and reporting filters.",
    supportsSortOrder: false,
    supportsTone: false,
    supportsSlaDays: false,
    supportsStatusFlags: false
  },
  {
    key: "source_types",
    label: "Source types",
    description: "Origin of recommendations such as incidents, audits, or committees.",
    supportsSortOrder: true,
    supportsTone: false,
    supportsSlaDays: false,
    supportsStatusFlags: false
  },
  {
    key: "recommendation_categories",
    label: "Recommendation categories",
    description: "Classification buckets for recommendation analysis and reporting.",
    supportsSortOrder: true,
    supportsTone: false,
    supportsSlaDays: false,
    supportsStatusFlags: false
  },
  {
    key: "priority_levels",
    label: "Priority levels",
    description: "Priority logic used by actions, dashboards, and escalation discussions.",
    supportsSortOrder: true,
    supportsTone: true,
    supportsSlaDays: true,
    supportsStatusFlags: false
  },
  {
    key: "action_statuses",
    label: "Action statuses",
    description: "Workflow stages that control completion and verification behavior.",
    supportsSortOrder: true,
    supportsTone: true,
    supportsSlaDays: false,
    supportsStatusFlags: true
  }
];

export async function listMasterData(section: MasterDataEntityKey): Promise<MasterDataRecord[]> {
  switch (section) {
    case "departments": {
      const { data, error } = await supabase
        .from("departments")
        .select("id, code, name, is_active")
        .order("name", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((row) => ({
        rowKey: row.id,
        id: row.id,
        code: row.code,
        name: row.name,
        isActive: row.is_active
      }));
    }
    case "source_types": {
      const { data, error } = await supabase
        .from("source_types")
        .select("code, name, sort_order, is_active")
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((row) => ({
        rowKey: row.code,
        code: row.code,
        name: row.name,
        sortOrder: row.sort_order,
        isActive: row.is_active
      }));
    }
    case "recommendation_categories": {
      const { data, error } = await supabase
        .from("recommendation_categories")
        .select("id, code, name, sort_order, is_active")
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((row) => ({
        rowKey: row.id,
        id: row.id,
        code: row.code,
        name: row.name,
        sortOrder: row.sort_order,
        isActive: row.is_active
      }));
    }
    case "priority_levels": {
      const { data, error } = await supabase
        .from("priority_levels")
        .select("code, name, sort_order, tone, sla_days, is_active")
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((row) => ({
        rowKey: row.code,
        code: row.code,
        name: row.name,
        sortOrder: row.sort_order,
        tone: row.tone,
        slaDays: row.sla_days,
        isActive: row.is_active
      }));
    }
    case "action_statuses": {
      const { data, error } = await supabase
        .from("action_statuses")
        .select(
          "code, name, sort_order, tone, is_terminal, requires_completion_date, requires_verification_date, is_active"
        )
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((row) => ({
        rowKey: row.code,
        code: row.code,
        name: row.name,
        sortOrder: row.sort_order,
        tone: row.tone,
        isTerminal: row.is_terminal,
        requiresCompletionDate: row.requires_completion_date,
        requiresVerificationDate: row.requires_verification_date,
        isActive: row.is_active
      }));
    }
  }
}

export type SaveMasterDataInput = {
  /**
   * Explicit save mode protects create operations from accidentally updating
   * a previous row if an old id/originalRowKey is still present in UI state.
   */
  mode?: "create" | "update";
  originalRowKey?: string;
  id?: string;
  code: string;
  name: string;
  sortOrder?: number;
  tone?: string;
  slaDays?: number | null;
  isActive: boolean;
  isTerminal?: boolean;
  requiresCompletionDate?: boolean;
  requiresVerificationDate?: boolean;
};

export async function saveMasterData(
  section: MasterDataEntityKey,
  input: SaveMasterDataInput
): Promise<void> {
  const saveMode = input.mode ?? (input.id || input.originalRowKey ? "update" : "create");

  switch (section) {
    case "departments": {
      const payload = {
        code: input.code.trim(),
        name: input.name.trim(),
        is_active: input.isActive
      };

      const query = saveMode === "update" && input.id
        ? supabase.from("departments").update(payload).eq("id", input.id)
        : supabase.from("departments").insert(payload);

      const { error } = await query;
      if (error) throw error;
      return;
    }

    case "source_types": {
      const payload = {
        code: input.code.trim(),
        name: input.name.trim(),
        sort_order: input.sortOrder ?? 0,
        is_active: input.isActive
      };

      const query = saveMode === "update" && input.originalRowKey
        ? supabase.from("source_types").update(payload).eq("code", input.originalRowKey)
        : supabase.from("source_types").insert(payload);

      const { error } = await query;
      if (error) throw error;
      return;
    }

    case "recommendation_categories": {
      const payload = {
        code: input.code.trim(),
        name: input.name.trim(),
        sort_order: input.sortOrder ?? 0,
        is_active: input.isActive
      };

      const query = saveMode === "update" && input.id
        ? supabase.from("recommendation_categories").update(payload).eq("id", input.id)
        : supabase.from("recommendation_categories").insert(payload);

      const { error } = await query;
      if (error) throw error;
      return;
    }

    case "priority_levels": {
      const payload = {
        code: input.code.trim(),
        name: input.name.trim(),
        sort_order: input.sortOrder ?? 0,
        tone: input.tone?.trim() || "slate",
        sla_days: input.slaDays ?? null,
        is_active: input.isActive
      };

      const query = saveMode === "update" && input.originalRowKey
        ? supabase.from("priority_levels").update(payload).eq("code", input.originalRowKey)
        : supabase.from("priority_levels").insert(payload);

      const { error } = await query;
      if (error) throw error;
      return;
    }

    case "action_statuses": {
      const payload = {
        code: input.code.trim(),
        name: input.name.trim(),
        sort_order: input.sortOrder ?? 0,
        tone: input.tone?.trim() || "slate",
        is_terminal: Boolean(input.isTerminal),
        requires_completion_date: Boolean(input.requiresCompletionDate),
        requires_verification_date: Boolean(input.requiresVerificationDate),
        is_active: input.isActive
      };

      const query = saveMode === "update" && input.originalRowKey
        ? supabase.from("action_statuses").update(payload).eq("code", input.originalRowKey)
        : supabase.from("action_statuses").insert(payload);

      const { error } = await query;
      if (error) throw error;
      return;
    }
  }
}

export async function deleteMasterData(
  section: MasterDataEntityKey,
  record: MasterDataRecord
): Promise<void> {
  switch (section) {
    case "departments": {
      if (!record.id) throw new Error("Department id is missing.");
      const { error } = await supabase.from("departments").delete().eq("id", record.id);
      if (error) throw error;
      return;
    }
    case "source_types": {
      const { error } = await supabase.from("source_types").delete().eq("code", record.code);
      if (error) throw error;
      return;
    }
    case "recommendation_categories": {
      if (!record.id) throw new Error("Category id is missing.");
      const { error } = await supabase
        .from("recommendation_categories")
        .delete()
        .eq("id", record.id);
      if (error) throw error;
      return;
    }
    case "priority_levels": {
      const { error } = await supabase.from("priority_levels").delete().eq("code", record.code);
      if (error) throw error;
      return;
    }
    case "action_statuses": {
      const { error } = await supabase.from("action_statuses").delete().eq("code", record.code);
      if (error) throw error;
      return;
    }
  }
}
