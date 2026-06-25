import { supabase } from "@/lib/supabase";
import type { Json } from "@/types/database";

export type AuditLogEntityType =
  | "auth"
  | "source"
  | "recommendation"
  | "action"
  | "action_update"
  | "extension_request"
  | "profile"
  | "other";

export type AuditLogEventType =
  | "login"
  | "logout"
  | "create"
  | "update"
  | "delete"
  | "request"
  | "decision"
  | "other";

export type AuditLogListFilters = {
  search?: string;
  entityType?: string;
  eventType?: string;
  page?: number;
  pageSize?: number;
};

export type AuditLogRow = {
  id: number;
  occurredAt: string;
  actorId: string | null;
  actorName: string | null;
  actorEmail: string | null;
  actorRole: string | null;
  entityType: string;
  entityId: string | null;
  entityLabel: string | null;
  eventType: string;
  message: string;
  details: Json;
  source: string;
};

export type AuditLogListResult = {
  rows: AuditLogRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

type AuditLogDbRow = {
  id: number;
  occurred_at: string;
  actor_id: string | null;
  actor_name: string | null;
  actor_email: string | null;
  actor_role: string | null;
  entity_type: string;
  entity_id: string | null;
  entity_label: string | null;
  event_type: string;
  message: string;
  details: Json;
  source: string;
};

function mapLog(row: AuditLogDbRow): AuditLogRow {
  return {
    id: row.id,
    occurredAt: row.occurred_at,
    actorId: row.actor_id,
    actorName: row.actor_name,
    actorEmail: row.actor_email,
    actorRole: row.actor_role,
    entityType: row.entity_type,
    entityId: row.entity_id,
    entityLabel: row.entity_label,
    eventType: row.event_type,
    message: row.message,
    details: row.details,
    source: row.source,
  };
}

export async function listAuditLogs(filters: AuditLogListFilters = {}): Promise<AuditLogListResult> {
  const page = Math.max(filters.page ?? 1, 1);
  const pageSize = Math.min(Math.max(filters.pageSize ?? 25, 10), 100);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("audit_logs")
    .select(
      "id, occurred_at, actor_id, actor_name, actor_email, actor_role, entity_type, entity_id, entity_label, event_type, message, details, source",
      { count: "exact" }
    )
    .order("occurred_at", { ascending: false })
    .range(from, to);

  if (filters.entityType && filters.entityType !== "all") {
    query = query.eq("entity_type", filters.entityType);
  }

  if (filters.eventType && filters.eventType !== "all") {
    query = query.eq("event_type", filters.eventType);
  }

  if (filters.search?.trim()) {
    const safe = filters.search.trim().replace(/[,:]/g, " ");
    query = query.or(
      `message.ilike.%${safe}%,entity_label.ilike.%${safe}%,actor_name.ilike.%${safe}%,actor_email.ilike.%${safe}%`
    );
  }

  const { data, error, count } = await query;
  if (error) throw error;

  const total = count ?? 0;
  return {
    rows: ((data ?? []) as AuditLogDbRow[]).map(mapLog),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function writeAuditLog(input: {
  entityType: AuditLogEntityType;
  eventType: AuditLogEventType;
  entityId?: string | null;
  entityLabel?: string | null;
  message?: string | null;
  details?: Json;
}) {
  const { error } = await supabase.rpc("write_audit_log", {
    p_entity_type: input.entityType,
    p_event_type: input.eventType,
    p_entity_id: input.entityId ?? null,
    p_entity_label: input.entityLabel ?? null,
    p_message: input.message ?? null,
    p_details: input.details ?? {},
  });

  if (error) {
    throw error;
  }
}
