import { callReservedNumberRpc } from "@/lib/rpc";
import { supabase } from "@/lib/supabase";
import { getSourceDisplayNo } from "@/lib/source-display";
import { getPriorityDisplayLabel } from "@/lib/priority";

const ACTION_EVIDENCE_BUCKET = "action-evidence";

export type ActionFilters = {
  search?: string;
  statusCode?: string;
  priorityCode?: string;
  responsibleUserId?: string;
  responsibleManualName?: string;
  responsibleDepartmentId?: string;
  dashboardFilter?: string;
  recommendationId?: string;
  sourceId?: string;
  overdueOnly?: boolean;
};

export type ActionListItem = {
  id: string;
  recommendationId: string;
  recommendationNo: string;
  sourceId: string;
  sourceNo: string;
  actionNo: string;
  title: string;
  description: string | null;
  responsibleUserId: string | null;
  responsibleNameManual: string | null;
  responsibleUserName: string;
  responsibleDepartmentId: string | null;
  responsibleDepartmentName: string | null;
  ownerUserId: string | null;
  ownerNameManual: string | null;
  ownerUserName: string;
  verifierUserId: string | null;
  verifierNameManual: string | null;
  verifierUserName: string;
  priorityCode: string;
  priorityName: string;
  priorityTone: string;
  statusCode: string;
  statusName: string;
  statusTone: string;
  startDate: string | null;
  dueDate: string;
  completedDate: string | null;
  verifiedDate: string | null;
  latestExtensionUntil: string | null;
  progressPercent: number;
  createdAt: string;
  updatedAt: string;
};

export type ActionLookups = {
  recommendations: Array<{
    id: string;
    sourceId: string;
    sourceNo: string;
    recommendationNo: string;
    recommendationText: string;
    label: string;
  }>;
  users: Array<{
    id: string;
    fullName: string;
    roleCode: string;
    departmentId: string | null;
    label: string;
  }>;
  departments: Array<{
    id: string;
    name: string;
    label: string;
  }>;
  priorities: Array<{
    code: string;
    name: string;
    tone: string;
  }>;
  statuses: Array<{
    code: string;
    name: string;
    tone: string;
  }>;
  sources: Array<{
    id: string;
    sourceNo: string;
    title: string;
    label: string;
  }>;
};

export type SaveActionInput = {
  recommendationId: string;
  actionNo: string;
  title: string;
  description?: string | null;
  responsibleUserId?: string | null;
  responsibleNameManual?: string | null;
  ownerUserId?: string | null;
  ownerNameManual?: string | null;
  verifierUserId?: string | null;
  verifierNameManual?: string | null;
  priorityCode: string;
  statusCode: string;
  startDate?: string | null;
  dueDate: string;
  completedDate?: string | null;
  verifiedDate?: string | null;
  progressPercent?: number;
  latestExtensionUntil?: string | null;
  extensionReason?: string | null;
  evidenceSummary?: string | null;
  createdBy?: string | null;
};

export type SaveActionUpdateInput = {
  actionId: string;
  progressNote: string;
  progressPercent?: number | null;
  statusCode?: string | null;
  nextFollowUpDate?: string | null;
};

export type SaveExtensionRequestInput = {
  actionId: string;
  requestedUntil: string;
  reason: string;
};

export type ExtensionDecisionInput = {
  requestId: string;
  requestStatus: "approved" | "rejected" | "cancelled";
  decisionNote?: string | null;
  decidedBy?: string | null;
};

export type UploadActionAttachmentInput = {
  actionId: string;
  file: File;
  description?: string | null;
  uploadedBy?: string | null;
};

type ActionRow = {
  id: string;
  recommendation_id: string;
  action_no: string;
  title: string;
  description: string | null;
  responsible_user_id: string | null;
  responsible_name_manual: string | null;
  owner_user_id: string | null;
  owner_name_manual: string | null;
  verifier_user_id: string | null;
  verifier_name_manual: string | null;
  priority_code: string;
  status_code: string;
  start_date: string | null;
  due_date: string;
  completed_date: string | null;
  verified_date: string | null;
  progress_percent: number;
  latest_extension_until: string | null;
  extension_reason: string | null;
  evidence_summary: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

type RecommendationRow = {
  id: string;
  source_id: string;
  recommendation_no: string;
  recommendation_text: string;
};

type SourceRow = {
  id: string;
  source_no: string | null;
  reference_no: string | null;
  title: string;
};

type ProfileRow = {
  id: string;
  full_name: string;
  role_code: string;
  department_id: string | null;
};

type DepartmentRow = {
  id: string;
  name: string;
};

type PriorityRow = {
  code: string;
  name: string;
  tone: string;
};

type StatusRow = {
  code: string;
  name: string;
  tone: string;
};

type ActionUpdateRow = {
  id: string;
  action_id: string;
  update_date: string;
  progress_note: string;
  progress_percent: number | null;
  status_code: string | null;
  next_follow_up_date: string | null;
  updated_by: string | null;
  created_at: string;
};

type ActionHistoryRow = {
  id: number;
  action_id: string;
  field_name: string;
  old_value: unknown;
  new_value: unknown;
  changed_by: string | null;
  changed_at: string;
  change_source: string;
};

type ActionExtensionRow = {
  id: string;
  action_id: string;
  requested_until: string;
  previous_due_date: string | null;
  reason: string;
  request_status: string;
  requested_by: string | null;
  decided_by: string | null;
  decided_at: string | null;
  decision_note: string | null;
  created_at: string;
  updated_at: string;
};

type ActionAttachmentRow = {
  id: string;
  action_id: string;
  bucket_name: string;
  file_name: string;
  file_path: string;
  mime_type: string | null;
  file_size_bytes: number | null;
  description: string | null;
  uploaded_by: string | null;
  uploaded_at: string;
};

export type ActionUpdateItem = {
  id: string;
  updateDate: string;
  progressNote: string;
  progressPercent: number | null;
  statusCode: string | null;
  statusName: string;
  updatedByName: string;
  nextFollowUpDate: string | null;
  createdAt: string;
};

export type ActionHistoryItem = {
  id: number;
  fieldName: string;
  oldValue: string;
  newValue: string;
  changedByName: string;
  changedAt: string;
  changeSource: string;
};

export type ActionExtensionItem = {
  id: string;
  requestedUntil: string;
  previousDueDate: string | null;
  reason: string;
  requestStatus: string;
  requestedByName: string;
  decidedByName: string;
  decidedAt: string | null;
  decisionNote: string | null;
  createdAt: string;
};

export type ActionAttachmentItem = {
  id: string;
  bucketName: string;
  fileName: string;
  filePath: string;
  mimeType: string | null;
  fileSizeBytes: number | null;
  description: string | null;
  uploadedById: string | null;
  uploadedByName: string;
  uploadedAt: string;
};

export type PendingExtensionQueueItem = {
  requestId: string;
  actionId: string;
  actionNo: string;
  sourceId: string;
  sourceNo: string;
  recommendationId: string;
  recommendationNo: string;
  title: string;
  responsibleName: string;
  requestedByName: string;
  requestedUntil: string;
  reason: string;
  createdAt: string;
};

export type VerificationQueueItem = {
  actionId: string;
  actionNo: string;
  sourceId: string;
  sourceNo: string;
  recommendationId: string;
  recommendationNo: string;
  title: string;
  responsibleName: string;
  ownerName: string;
  completedDate: string;
  dueDate: string;
  latestExtensionUntil: string | null;
  statusCode: string;
  statusName: string;
  statusTone: string;
};

export type ActionDetails = {
  action: ActionListItem & {
    extensionReason: string | null;
    evidenceSummary: string | null;
    recommendationText: string;
    sourceTitle: string;
  };
  updates: ActionUpdateItem[];
  history: ActionHistoryItem[];
  extensionRequests: ActionExtensionItem[];
  attachments: ActionAttachmentItem[];
};

function normalizeSearchValue(value: string) {
  return value.replace(/[%_,]/g, " ").trim();
}

function normalizeResponsibleKey(value: string | null | undefined) {
  return normalizeSearchValue(value ?? "")
    .replace(/\s+/g, " ")
    .toLocaleLowerCase();
}

function toTone(value: string | null | undefined): string {
  return value || "slate";
}

function formatJsonish(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return "—";
  }
}

function isActionOpenLike(statusCode: string) {
  return !["closed", "verified", "cancelled"].includes(statusCode);
}

function sanitizeFileName(input: string) {
  return input.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function cleanManualName(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function getParticipantDisplayName(profileName: string | null | undefined, manualName: string | null | undefined, fallback: string) {
  return cleanManualName(profileName) ?? cleanManualName(manualName) ?? fallback;
}

async function fetchProfilesMap(userIds: string[]) {
  if (!userIds.length) return new Map<string, ProfileRow>();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role_code, department_id")
    .in("id", userIds);

  if (error) throw error;

  return new Map<string, ProfileRow>(((data ?? []) as ProfileRow[]).map((row) => [row.id, row]));
}

async function fetchDepartmentsMap() {
  const { data, error } = await supabase
    .from("departments")
    .select("id, name")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) throw error;

  const rows = (data ?? []) as DepartmentRow[];
  return {
    byId: new Map<string, DepartmentRow>(rows.map((row) => [row.id, row])),
    byName: new Map<string, DepartmentRow>(rows.map((row) => [normalizeResponsibleKey(row.name), row]))
  };
}

async function fetchRecommendationsMap(recommendationIds: string[]) {
  if (!recommendationIds.length) return new Map<string, RecommendationRow>();

  const { data, error } = await supabase
    .from("recommendations")
    .select("id, source_id, recommendation_no, recommendation_text")
    .in("id", recommendationIds);

  if (error) throw error;

  return new Map<string, RecommendationRow>(
    ((data ?? []) as RecommendationRow[]).map((row) => [row.id, row])
  );
}

async function fetchSourcesMap(sourceIds: string[]) {
  if (!sourceIds.length) return new Map<string, SourceRow>();

  const { data, error } = await supabase
    .from("sources")
    .select("id, source_no, reference_no, title")
    .in("id", sourceIds);

  if (error) throw error;

  return new Map<string, SourceRow>(((data ?? []) as SourceRow[]).map((row) => [row.id, row]));
}

async function fetchPriorityMap() {
  const { data, error } = await supabase
    .from("priority_levels")
    .select("code, name, tone")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) throw error;

  return new Map<string, PriorityRow>(((data ?? []) as PriorityRow[]).map((row) => [row.code, row]));
}

async function fetchStatusMap() {
  const { data, error } = await supabase
    .from("action_statuses")
    .select("code, name, tone")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) throw error;

  return new Map<string, StatusRow>(((data ?? []) as StatusRow[]).map((row) => [row.code, row]));
}

async function fetchPendingExtensionActionIdSet() {
  const { data, error } = await supabase
    .from("action_extension_requests")
    .select("action_id")
    .eq("request_status", "pending");

  if (error) throw error;

  return new Set(((data ?? []) as Array<{ action_id: string }>).map((row) => row.action_id));
}

function mapActionRow(
  row: ActionRow,
  recommendationsMap: Map<string, RecommendationRow>,
  sourcesMap: Map<string, SourceRow>,
  profilesMap: Map<string, ProfileRow>,
  priorityMap: Map<string, PriorityRow>,
  statusMap: Map<string, StatusRow>,
  departmentById: Map<string, DepartmentRow> = new Map(),
  departmentByName: Map<string, DepartmentRow> = new Map()
): ActionListItem {
  const recommendation = recommendationsMap.get(row.recommendation_id);
  const source = recommendation ? sourcesMap.get(recommendation.source_id) : undefined;
  const responsible = row.responsible_user_id ? profilesMap.get(row.responsible_user_id) : undefined;
  const owner = row.owner_user_id ? profilesMap.get(row.owner_user_id) : undefined;
  const verifier = row.verifier_user_id ? profilesMap.get(row.verifier_user_id) : undefined;
  const priority = priorityMap.get(row.priority_code);
  const status = statusMap.get(row.status_code);
  const departmentFromProfile = responsible?.department_id ? departmentById.get(responsible.department_id) : undefined;
  const departmentFromManualName = !departmentFromProfile
    ? departmentByName.get(normalizeResponsibleKey(row.responsible_name_manual))
    : undefined;
  const responsibleDepartment = departmentFromProfile ?? departmentFromManualName;

  return {
    id: row.id,
    recommendationId: row.recommendation_id,
    recommendationNo: recommendation?.recommendation_no ?? "—",
    sourceId: recommendation?.source_id ?? "",
    sourceNo: source ? getSourceDisplayNo(source.source_no, source.reference_no) : "—",
    actionNo: row.action_no,
    title: row.title,
    description: row.description,
    responsibleUserId: row.responsible_user_id,
    responsibleNameManual: cleanManualName(row.responsible_name_manual),
    responsibleUserName: getParticipantDisplayName(responsible?.full_name, row.responsible_name_manual, "Unassigned"),
    responsibleDepartmentId: responsibleDepartment?.id ?? null,
    responsibleDepartmentName: responsibleDepartment?.name ?? null,
    ownerUserId: row.owner_user_id,
    ownerNameManual: cleanManualName(row.owner_name_manual),
    ownerUserName: getParticipantDisplayName(owner?.full_name, row.owner_name_manual, "—"),
    verifierUserId: row.verifier_user_id,
    verifierNameManual: cleanManualName(row.verifier_name_manual),
    verifierUserName: getParticipantDisplayName(verifier?.full_name, row.verifier_name_manual, "—"),
    priorityCode: row.priority_code,
    priorityName: getPriorityDisplayLabel(row.priority_code, priority?.name ?? row.priority_code),
    priorityTone: toTone(priority?.tone),
    statusCode: row.status_code,
    statusName: status?.name ?? row.status_code,
    statusTone: toTone(status?.tone),
    startDate: row.start_date,
    dueDate: row.due_date,
    completedDate: row.completed_date,
    verifiedDate: row.verified_date,
    latestExtensionUntil: row.latest_extension_until,
    progressPercent: Number(row.progress_percent ?? 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function listActionLookups(): Promise<ActionLookups> {
  const [recommendationsResult, usersResult, prioritiesResult, statusesResult, sourcesResult, departmentsResult] =
    await Promise.all([
      supabase
        .from("recommendations")
        .select("id, source_id, recommendation_no, recommendation_text")
        .order("created_at", { ascending: false }),
      supabase
        .from("profiles")
        .select("id, full_name, role_code, department_id")
        .eq("is_active", true)
        .order("full_name", { ascending: true }),
      supabase
        .from("priority_levels")
        .select("code, name, tone")
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
      supabase
        .from("action_statuses")
        .select("code, name, tone")
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
      supabase
        .from("sources")
        .select("id, source_no, reference_no, title")
        .order("source_date", { ascending: false }),
      supabase
        .from("departments")
        .select("id, name")
        .eq("is_active", true)
        .order("name", { ascending: true })
    ]);

  if (recommendationsResult.error) throw recommendationsResult.error;
  if (usersResult.error) throw usersResult.error;
  if (prioritiesResult.error) throw prioritiesResult.error;
  if (statusesResult.error) throw statusesResult.error;
  if (sourcesResult.error) throw sourcesResult.error;
  if (departmentsResult.error) throw departmentsResult.error;

  const recommendationsRows = (recommendationsResult.data ?? []) as RecommendationRow[];
  const sourcesRows = (sourcesResult.data ?? []) as SourceRow[];
  const sourceMap = new Map<string, SourceRow>(sourcesRows.map((row) => [row.id, row]));

  return {
    recommendations: recommendationsRows.map((row) => {
      const source = sourceMap.get(row.source_id);
      const recommendationText =
        row.recommendation_text.length > 70
          ? `${row.recommendation_text.slice(0, 70)}…`
          : row.recommendation_text;

      return {
        id: row.id,
        sourceId: row.source_id,
        sourceNo: source ? getSourceDisplayNo(source.source_no, source.reference_no) : "—",
        recommendationNo: row.recommendation_no,
        recommendationText: row.recommendation_text,
        label: `${source ? getSourceDisplayNo(source.source_no, source.reference_no) : "—"} / ${row.recommendation_no} — ${recommendationText}`
      };
    }),
    users: ((usersResult.data ?? []) as ProfileRow[]).map((row) => ({
      id: row.id,
      fullName: row.full_name,
      roleCode: row.role_code,
      departmentId: row.department_id,
      label: row.full_name
    })),
    departments: ((departmentsResult.data ?? []) as DepartmentRow[]).map((row) => ({
      id: row.id,
      name: row.name,
      label: row.name
    })),
    priorities: ((prioritiesResult.data ?? []) as PriorityRow[]).map((row) => ({
      code: row.code,
      name: getPriorityDisplayLabel(row.code, row.name),
      tone: toTone(row.tone)
    })),
    statuses: ((statusesResult.data ?? []) as StatusRow[]).map((row) => ({
      code: row.code,
      name: row.name,
      tone: toTone(row.tone)
    })),
    sources: sourcesRows.map((row) => ({
      id: row.id,
      sourceNo: getSourceDisplayNo(row.source_no, row.reference_no),
      title: row.title,
      label: `${getSourceDisplayNo(row.source_no, row.reference_no)} — ${row.title}`
    }))
  };
}

export async function listActions(filters: ActionFilters = {}): Promise<ActionListItem[]> {
  let query = supabase
    .from("actions")
    .select(
      "id, recommendation_id, action_no, title, description, responsible_user_id, responsible_name_manual, owner_user_id, owner_name_manual, verifier_user_id, verifier_name_manual, priority_code, status_code, start_date, due_date, completed_date, verified_date, progress_percent, latest_extension_until, extension_reason, evidence_summary, created_by, updated_by, created_at, updated_at"
    )
    .order("created_at", { ascending: false });

  if (filters.statusCode) query = query.eq("status_code", filters.statusCode);
  if (filters.priorityCode) query = query.eq("priority_code", filters.priorityCode);
  if (filters.responsibleUserId) query = query.eq("responsible_user_id", filters.responsibleUserId);

  const { data, error } = await query;
  if (error) throw error;

  const rows = (data ?? []) as ActionRow[];
  const recommendationIds = Array.from(new Set(rows.map((row) => row.recommendation_id).filter(Boolean)));
  const recommendationsMap = await fetchRecommendationsMap(recommendationIds);
  const sourceIds = Array.from(
    new Set(Array.from(recommendationsMap.values()).map((row) => row.source_id).filter(Boolean))
  );
  const sourcesMap = await fetchSourcesMap(sourceIds);
  const userIds = Array.from(
    new Set(
      rows
        .flatMap((row) => [row.responsible_user_id, row.owner_user_id, row.verifier_user_id])
        .filter((value): value is string => Boolean(value))
    )
  );

  const [profilesMap, priorityMap, statusMap, departmentsMap] = await Promise.all([
    fetchProfilesMap(userIds),
    fetchPriorityMap(),
    fetchStatusMap(),
    fetchDepartmentsMap()
  ]);

  const today = new Date();
  const plus7 = new Date(today);
  plus7.setDate(plus7.getDate() + 7);
  const todayIso = today.toISOString().slice(0, 10);
  const next7Iso = plus7.toISOString().slice(0, 10);
  const normalizedSearch = normalizeSearchValue(filters.search ?? "").toLowerCase();
  const pendingExtensionActionIds =
    filters.dashboardFilter === "pending_extensions" || filters.dashboardFilter === "attention"
      ? await fetchPendingExtensionActionIdSet()
      : new Set<string>();

  return rows
    .map((row) =>
      mapActionRow(
        row,
        recommendationsMap,
        sourcesMap,
        profilesMap,
        priorityMap,
        statusMap,
        departmentsMap.byId,
        departmentsMap.byName
      )
    )
    .filter((item) => {
      const effectiveDueDate = item.latestExtensionUntil || item.dueDate;

      if (filters.dashboardFilter === "active" && !isActionOpenLike(item.statusCode)) return false;
      if (filters.dashboardFilter === "closed" && isActionOpenLike(item.statusCode)) return false;
      if (filters.dashboardFilter === "verified" && item.statusCode !== "verified") return false;
      if (filters.dashboardFilter === "overdue" && !(isActionOpenLike(item.statusCode) && effectiveDueDate < todayIso)) return false;
      if (filters.dashboardFilter === "due_soon" && !(isActionOpenLike(item.statusCode) && effectiveDueDate >= todayIso && effectiveDueDate <= next7Iso)) return false;
      if (filters.dashboardFilter === "pending_verification" && item.statusCode !== "pending_verification") return false;
      if (filters.dashboardFilter === "pending_extensions" && !pendingExtensionActionIds.has(item.id)) return false;
      if (filters.dashboardFilter === "attention") {
        const isOverdue = isActionOpenLike(item.statusCode) && effectiveDueDate < todayIso;
        const isDueSoon = isActionOpenLike(item.statusCode) && effectiveDueDate >= todayIso && effectiveDueDate <= next7Iso;
        const isPendingVerification = item.statusCode === "pending_verification";
        const hasPendingExtension = pendingExtensionActionIds.has(item.id);
        if (!(isOverdue || isDueSoon || isPendingVerification || hasPendingExtension)) return false;
      }

      if (filters.sourceId && item.sourceId !== filters.sourceId) return false;
      if (filters.recommendationId && item.recommendationId !== filters.recommendationId) return false;
      if (filters.responsibleManualName) {
        const selectedResponsible = normalizeSearchValue(filters.responsibleManualName).toLowerCase();
        const itemResponsible = normalizeSearchValue(item.responsibleUserName).toLowerCase();
        if (itemResponsible !== selectedResponsible) return false;
      }
      if (filters.responsibleDepartmentId === "__unassigned__" && item.responsibleDepartmentId) {
        return false;
      }
      if (filters.responsibleDepartmentId && filters.responsibleDepartmentId !== "__unassigned__" && item.responsibleDepartmentId !== filters.responsibleDepartmentId) {
        return false;
      }
      if (filters.overdueOnly && !(isActionOpenLike(item.statusCode) && effectiveDueDate < todayIso)) {
        return false;
      }
      if (!normalizedSearch) return true;

      const haystack = [
        item.actionNo,
        item.title,
        item.description ?? "",
        item.sourceNo,
        item.recommendationNo,
        item.responsibleUserName,
        item.responsibleDepartmentName ?? "",
        item.ownerUserName,
        item.verifierUserName,
        item.priorityName,
        item.statusName
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
}

export async function getActionDetails(actionId: string): Promise<ActionDetails> {
  const { data, error } = await supabase
    .from("actions")
    .select(
      "id, recommendation_id, action_no, title, description, responsible_user_id, responsible_name_manual, owner_user_id, owner_name_manual, verifier_user_id, verifier_name_manual, priority_code, status_code, start_date, due_date, completed_date, verified_date, progress_percent, latest_extension_until, extension_reason, evidence_summary, created_by, updated_by, created_at, updated_at"
    )
    .eq("id", actionId)
    .single();

  if (error) throw error;

  const row = data as ActionRow;

  const [
    recommendationsMap,
    priorityMap,
    statusMap,
    updatesResult,
    historyResult,
    extensionsResult,
    attachmentsResult
  ] = await Promise.all([
    fetchRecommendationsMap([row.recommendation_id]),
    fetchPriorityMap(),
    fetchStatusMap(),
    supabase
      .from("action_updates")
      .select(
        "id, action_id, update_date, progress_note, progress_percent, status_code, next_follow_up_date, updated_by, created_at"
      )
      .eq("action_id", actionId)
      .order("update_date", { ascending: false }),
    supabase
      .from("action_history")
      .select("id, action_id, field_name, old_value, new_value, changed_by, changed_at, change_source")
      .eq("action_id", actionId)
      .order("changed_at", { ascending: false }),
    supabase
      .from("action_extension_requests")
      .select(
        "id, action_id, requested_until, previous_due_date, reason, request_status, requested_by, decided_by, decided_at, decision_note, created_at, updated_at"
      )
      .eq("action_id", actionId)
      .order("created_at", { ascending: false }),
    supabase
      .from("action_attachments")
      .select(
        "id, action_id, bucket_name, file_name, file_path, mime_type, file_size_bytes, description, uploaded_by, uploaded_at"
      )
      .eq("action_id", actionId)
      .order("uploaded_at", { ascending: false })
  ]);

  if (updatesResult.error) throw updatesResult.error;
  if (historyResult.error) throw historyResult.error;
  if (extensionsResult.error) throw extensionsResult.error;
  if (attachmentsResult.error) throw attachmentsResult.error;

  const recommendation = recommendationsMap.get(row.recommendation_id);
  const sourcesMap = await fetchSourcesMap(recommendation ? [recommendation.source_id] : []);
  const source = recommendation ? sourcesMap.get(recommendation.source_id) : undefined;

  const updatesRows = (updatesResult.data ?? []) as ActionUpdateRow[];
  const historyRows = (historyResult.data ?? []) as ActionHistoryRow[];
  const extensionRows = (extensionsResult.data ?? []) as ActionExtensionRow[];
  const attachmentRows = (attachmentsResult.data ?? []) as ActionAttachmentRow[];

  const userIds = Array.from(
    new Set(
      [
        row.responsible_user_id,
        row.owner_user_id,
        row.verifier_user_id,
        ...updatesRows.map((item) => item.updated_by),
        ...historyRows.map((item) => item.changed_by),
        ...extensionRows.map((item) => item.requested_by),
        ...extensionRows.map((item) => item.decided_by),
        ...attachmentRows.map((item) => item.uploaded_by)
      ].filter((value): value is string => Boolean(value))
    )
  );

  const profilesMap = await fetchProfilesMap(userIds);

  const action = {
    ...mapActionRow(row, recommendationsMap, sourcesMap, profilesMap, priorityMap, statusMap),
    extensionReason: row.extension_reason,
    evidenceSummary: row.evidence_summary,
    recommendationText: recommendation?.recommendation_text ?? "—",
    sourceTitle: source?.title ?? "—"
  };

  return {
    action,
    updates: updatesRows.map((item) => ({
      id: item.id,
      updateDate: item.update_date,
      progressNote: item.progress_note,
      progressPercent: item.progress_percent,
      statusCode: item.status_code,
      statusName: item.status_code ? statusMap.get(item.status_code)?.name ?? item.status_code : "—",
      updatedByName: item.updated_by ? profilesMap.get(item.updated_by)?.full_name ?? "Unknown" : "System",
      nextFollowUpDate: item.next_follow_up_date,
      createdAt: item.created_at
    })),
    history: historyRows.map((item) => ({
      id: item.id,
      fieldName: item.field_name,
      oldValue: formatJsonish(item.old_value),
      newValue: formatJsonish(item.new_value),
      changedByName: item.changed_by ? profilesMap.get(item.changed_by)?.full_name ?? "Unknown" : "System",
      changedAt: item.changed_at,
      changeSource: item.change_source
    })),
    extensionRequests: extensionRows.map((item) => ({
      id: item.id,
      requestedUntil: item.requested_until,
      previousDueDate: item.previous_due_date,
      reason: item.reason,
      requestStatus: item.request_status,
      requestedByName: item.requested_by
        ? profilesMap.get(item.requested_by)?.full_name ?? "Unknown"
        : "Unknown",
      decidedByName: item.decided_by ? profilesMap.get(item.decided_by)?.full_name ?? "—" : "—",
      decidedAt: item.decided_at,
      decisionNote: item.decision_note,
      createdAt: item.created_at
    })),
    attachments: attachmentRows.map((item) => ({
      id: item.id,
      bucketName: item.bucket_name,
      fileName: item.file_name,
      filePath: item.file_path,
      mimeType: item.mime_type,
      fileSizeBytes: item.file_size_bytes,
      description: item.description,
      uploadedById: item.uploaded_by,
      uploadedByName: item.uploaded_by
        ? profilesMap.get(item.uploaded_by)?.full_name ?? "Unknown"
        : "Unknown",
      uploadedAt: item.uploaded_at
    }))
  };
}

export async function listPendingExtensionApprovals(): Promise<PendingExtensionQueueItem[]> {
  const { data, error } = await supabase
    .from("action_extension_requests")
    .select(
      "id, action_id, requested_until, reason, request_status, requested_by, created_at"
    )
    .eq("request_status", "pending")
    .order("created_at", { ascending: false });

  if (error) throw error;

  const extensionRows = (data ?? []) as Pick<
    ActionExtensionRow,
    "id" | "action_id" | "requested_until" | "reason" | "requested_by" | "created_at"
  >[];

  if (!extensionRows.length) return [];

  const actionIds = Array.from(new Set(extensionRows.map((item) => item.action_id)));
  const { data: actionData, error: actionError } = await supabase
    .from("actions")
    .select(
      "id, recommendation_id, action_no, title, responsible_user_id, responsible_name_manual, owner_user_id, owner_name_manual, verifier_user_id, verifier_name_manual, priority_code, status_code, start_date, due_date, completed_date, verified_date, progress_percent, latest_extension_until, extension_reason, evidence_summary, created_by, updated_by, created_at, updated_at"
    )
    .in("id", actionIds);

  if (actionError) throw actionError;

  const actionRows = (actionData ?? []) as ActionRow[];
  const recommendationIds = Array.from(new Set(actionRows.map((row) => row.recommendation_id)));
  const recommendationsMap = await fetchRecommendationsMap(recommendationIds);
  const sourceIds = Array.from(new Set(Array.from(recommendationsMap.values()).map((row) => row.source_id)));
  const sourcesMap = await fetchSourcesMap(sourceIds);

  const userIds = Array.from(
    new Set(
      [
        ...actionRows.flatMap((row) => [row.responsible_user_id]),
        ...extensionRows.map((item) => item.requested_by)
      ].filter((value): value is string => Boolean(value))
    )
  );
  const profilesMap = await fetchProfilesMap(userIds);

  const actionMap = new Map(actionRows.map((row) => [row.id, row]));

  return extensionRows
    .map((item) => {
      const actionRow = actionMap.get(item.action_id);
      if (!actionRow) return null;
      const recommendation = recommendationsMap.get(actionRow.recommendation_id);
      const source = recommendation ? sourcesMap.get(recommendation.source_id) : null;
      const responsible = actionRow.responsible_user_id ? profilesMap.get(actionRow.responsible_user_id) : null;
      const requestedBy = item.requested_by ? profilesMap.get(item.requested_by) : null;

      return {
        requestId: item.id,
        actionId: actionRow.id,
        actionNo: actionRow.action_no,
        sourceId: recommendation?.source_id ?? "",
        sourceNo: source ? getSourceDisplayNo(source.source_no, source.reference_no) : "—",
        recommendationId: actionRow.recommendation_id,
        recommendationNo: recommendation?.recommendation_no ?? "—",
        title: actionRow.title,
        responsibleName: getParticipantDisplayName(responsible?.full_name, actionRow.responsible_name_manual, "Unassigned"),
        requestedByName: requestedBy?.full_name ?? "Unknown",
        requestedUntil: item.requested_until,
        reason: item.reason,
        createdAt: item.created_at
      } satisfies PendingExtensionQueueItem;
    })
    .filter(Boolean) as PendingExtensionQueueItem[];
}

export async function listActionsNeedingVerification(): Promise<VerificationQueueItem[]> {
  const { data, error } = await supabase
    .from("actions")
    .select(
      "id, recommendation_id, action_no, title, description, responsible_user_id, responsible_name_manual, owner_user_id, owner_name_manual, verifier_user_id, verifier_name_manual, priority_code, status_code, start_date, due_date, completed_date, verified_date, progress_percent, latest_extension_until, extension_reason, evidence_summary, created_by, updated_by, created_at, updated_at"
    )
    .not("completed_date", "is", null)
    .is("verified_date", null)
    .neq("status_code", "verified")
    .neq("status_code", "cancelled")
    .order("completed_date", { ascending: false });

  if (error) throw error;

  const rows = (data ?? []) as ActionRow[];
  if (!rows.length) return [];

  const recommendationIds = Array.from(new Set(rows.map((row) => row.recommendation_id)));
  const recommendationsMap = await fetchRecommendationsMap(recommendationIds);
  const sourceIds = Array.from(new Set(Array.from(recommendationsMap.values()).map((row) => row.source_id)));
  const sourcesMap = await fetchSourcesMap(sourceIds);
  const userIds = Array.from(
    new Set(
      rows
        .flatMap((row) => [row.responsible_user_id, row.owner_user_id])
        .filter((value): value is string => Boolean(value))
    )
  );

  const [profilesMap, statusMap] = await Promise.all([fetchProfilesMap(userIds), fetchStatusMap()]);

  return rows.map((row) => {
    const recommendation = recommendationsMap.get(row.recommendation_id);
    const source = recommendation ? sourcesMap.get(recommendation.source_id) : null;
    const responsible = row.responsible_user_id ? profilesMap.get(row.responsible_user_id) : null;
    const owner = row.owner_user_id ? profilesMap.get(row.owner_user_id) : null;
    const status = statusMap.get(row.status_code);

    return {
      actionId: row.id,
      actionNo: row.action_no,
      sourceId: recommendation?.source_id ?? "",
      sourceNo: source ? getSourceDisplayNo(source.source_no, source.reference_no) : "—",
      recommendationId: row.recommendation_id,
      recommendationNo: recommendation?.recommendation_no ?? "—",
      title: row.title,
      responsibleName: getParticipantDisplayName(responsible?.full_name, row.responsible_name_manual, "Unassigned"),
      ownerName: getParticipantDisplayName(owner?.full_name, row.owner_name_manual, "—"),
      completedDate: row.completed_date ?? "",
      dueDate: row.due_date,
      latestExtensionUntil: row.latest_extension_until,
      statusCode: row.status_code,
      statusName: status?.name ?? row.status_code,
      statusTone: toTone(status?.tone)
    } satisfies VerificationQueueItem;
  });
}

export async function reserveActionNumber(recommendationId: string): Promise<string> {
  if (!recommendationId) return "";

  return callReservedNumberRpc(
    [
      {
        fn: "reserve_action_number_v2",
        args: {
          p_recommendation_id: recommendationId
        }
      },
      {
        fn: "reserve_action_number",
        args: {
          p_recommendation_id: recommendationId
        }
      }
    ],
    "action number"
  );
}

export async function createAction(input: SaveActionInput) {
  const payload = {
    recommendation_id: input.recommendationId,
    action_no: input.actionNo.trim(),
    title: input.title.trim(),
    description: input.description?.trim() || null,
    responsible_user_id: input.responsibleUserId || null,
    responsible_name_manual: input.responsibleUserId ? null : cleanManualName(input.responsibleNameManual),
    owner_user_id: input.ownerUserId || null,
    owner_name_manual: input.ownerUserId ? null : cleanManualName(input.ownerNameManual),
    verifier_user_id: input.verifierUserId || null,
    verifier_name_manual: input.verifierUserId ? null : cleanManualName(input.verifierNameManual),
    priority_code: input.priorityCode,
    status_code: input.statusCode,
    start_date: input.startDate || null,
    due_date: input.dueDate,
    completed_date: input.completedDate || null,
    verified_date: input.verifiedDate || null,
    progress_percent: input.progressPercent ?? 0,
    latest_extension_until: input.latestExtensionUntil || null,
    extension_reason: input.extensionReason?.trim() || null,
    evidence_summary: input.evidenceSummary?.trim() || null,
    created_by: input.createdBy || null
  };

  const { data, error } = await supabase.from("actions").insert(payload).select("id").single();
  if (error) throw error;
  return data;
}

export async function updateAction(actionId: string, input: SaveActionInput) {
  const payload = {
    recommendation_id: input.recommendationId,
    title: input.title.trim(),
    description: input.description?.trim() || null,
    responsible_user_id: input.responsibleUserId || null,
    responsible_name_manual: input.responsibleUserId ? null : cleanManualName(input.responsibleNameManual),
    owner_user_id: input.ownerUserId || null,
    owner_name_manual: input.ownerUserId ? null : cleanManualName(input.ownerNameManual),
    verifier_user_id: input.verifierUserId || null,
    verifier_name_manual: input.verifierUserId ? null : cleanManualName(input.verifierNameManual),
    priority_code: input.priorityCode,
    status_code: input.statusCode,
    start_date: input.startDate || null,
    due_date: input.dueDate,
    completed_date: input.completedDate || null,
    verified_date: input.verifiedDate || null,
    progress_percent: input.progressPercent ?? 0,
    latest_extension_until: input.latestExtensionUntil || null,
    extension_reason: input.extensionReason?.trim() || null,
    evidence_summary: input.evidenceSummary?.trim() || null
  };

  const { data, error } = await supabase
    .from("actions")
    .update(payload)
    .eq("id", actionId)
    .select("id")
    .single();

  if (error) throw error;
  return data;
}

export async function deleteAction(actionId: string) {
  const { error } = await supabase.from("actions").delete().eq("id", actionId);
  if (error) throw error;
}

export async function createActionUpdate(input: SaveActionUpdateInput) {
  const payload = {
    action_id: input.actionId,
    progress_note: input.progressNote.trim(),
    progress_percent: input.progressPercent ?? null,
    status_code: input.statusCode || null,
    next_follow_up_date: input.nextFollowUpDate || null
  };

  const { data, error } = await supabase.from("action_updates").insert(payload).select("id").single();
  if (error) throw error;
  return data;
}

export async function createExtensionRequest(input: SaveExtensionRequestInput) {
  const payload = {
    action_id: input.actionId,
    requested_until: input.requestedUntil,
    reason: input.reason.trim()
  };

  const { data, error } = await supabase
    .from("action_extension_requests")
    .insert(payload)
    .select("id")
    .single();

  if (error) throw error;
  return data;
}

export async function decideExtensionRequest(input: ExtensionDecisionInput) {
  const payload = {
    request_status: input.requestStatus,
    decision_note: input.decisionNote?.trim() || null,
    decided_by: input.decidedBy || null,
    decided_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from("action_extension_requests")
    .update(payload)
    .eq("id", input.requestId)
    .select("id")
    .single();

  if (error) throw error;
  return data;
}

export async function uploadActionAttachment(input: UploadActionAttachmentInput) {
  const safeFileName = sanitizeFileName(input.file.name);
  const filePath = `${input.actionId}/${Date.now()}-${safeFileName}`;

  const { error: uploadError } = await supabase.storage
    .from(ACTION_EVIDENCE_BUCKET)
    .upload(filePath, input.file, {
      cacheControl: "3600",
      upsert: false,
      contentType: input.file.type || undefined
    });

  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from("action_attachments")
    .insert({
      action_id: input.actionId,
      bucket_name: ACTION_EVIDENCE_BUCKET,
      file_name: input.file.name,
      file_path: filePath,
      mime_type: input.file.type || null,
      file_size_bytes: input.file.size,
      description: input.description?.trim() || null,
      uploaded_by: input.uploadedBy || null
    })
    .select("id")
    .single();

  if (error) {
    await supabase.storage.from(ACTION_EVIDENCE_BUCKET).remove([filePath]);
    throw error;
  }

  return data;
}

export async function deleteActionAttachment(attachmentId: string) {
  const { data: attachment, error: attachmentError } = await supabase
    .from("action_attachments")
    .select("id, bucket_name, file_path")
    .eq("id", attachmentId)
    .single();

  if (attachmentError) throw attachmentError;

  const attachmentRow = attachment as { bucket_name: string; file_path: string };
  const bucketName = attachmentRow.bucket_name;
  const filePath = attachmentRow.file_path;

  const { error: storageError } = await supabase.storage.from(bucketName).remove([filePath]);
  if (storageError) throw storageError;

  const { error: deleteError } = await supabase.from("action_attachments").delete().eq("id", attachmentId);
  if (deleteError) throw deleteError;
}

export async function getActionAttachmentDownloadUrl(attachment: Pick<ActionAttachmentItem, "bucketName" | "filePath">) {
  const { data, error } = await supabase.storage
    .from(attachment.bucketName)
    .createSignedUrl(attachment.filePath, 60);

  if (error) throw error;

  return data.signedUrl;
}

export function getEffectiveDueDate(item: Pick<ActionListItem, "dueDate" | "latestExtensionUntil">) {
  return item.latestExtensionUntil || item.dueDate;
}

export function getIsOverdue(item: Pick<ActionListItem, "statusCode" | "dueDate" | "latestExtensionUntil">) {
  const todayIso = new Date().toISOString().slice(0, 10);
  return isActionOpenLike(item.statusCode) && getEffectiveDueDate(item) < todayIso;
}
