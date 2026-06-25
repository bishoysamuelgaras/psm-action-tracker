import { supabase } from "@/lib/supabase";
import { getSourceDisplayNo } from "@/lib/source-display";
import type { Database } from "@/types/database";

type ActionSummaryRow = Database["public"]["Views"]["v_action_summary"]["Row"];
type OverdueActionRow = Database["public"]["Views"]["v_overdue_actions"]["Row"];
type SourceProgressRow = Database["public"]["Views"]["v_source_progress_summary"]["Row"];
type SourceRow = Database["public"]["Tables"]["sources"]["Row"];
type RecommendationRow = Database["public"]["Tables"]["recommendations"]["Row"];
type ActionUpdateRow = Database["public"]["Tables"]["action_updates"]["Row"];
type ActionAttachmentRow = Database["public"]["Tables"]["action_attachments"]["Row"];
type ActionExtensionRequestRow = Database["public"]["Tables"]["action_extension_requests"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type DepartmentRow = Database["public"]["Tables"]["departments"]["Row"];
type SourceTypeRow = Database["public"]["Tables"]["source_types"]["Row"];
type RecommendationCategoryRow = Database["public"]["Tables"]["recommendation_categories"]["Row"];
type PriorityLevelRow = Database["public"]["Tables"]["priority_levels"]["Row"];

export type ReportsFilters = {
  search?: string;
  departmentCode?: string;
  statusCode?: string;
  priorityCode?: string;
  sourceTypeCode?: string;
  sourceId?: string;
  overdueOnly?: boolean;
};

export type ReportSourceOption = {
  id: string;
  sourceNo: string;
  title: string;
  sourceDate: string;
  referenceNo: string | null;
  departmentName: string | null;
  sourceTypeCode: string;
  sourceTypeName: string | null;
};

export type ReportsLookups = {
  departments: Array<{ id: string; code: string; name: string }>;
  statuses: Array<{ code: string; name: string }>;
  priorities: Array<{ code: string; name: string }>;
  sourceTypes: Array<{ code: string; name: string }>;
};

export type ReportsSnapshot = {
  filters: ReportsLookups;
  actionSummaryRows: ActionSummaryRow[];
  sourceProgressRows: SourceProgressRow[];
  overdueRows: OverdueActionRow[];
  kpis: {
    totalActions: number;
    openActions: number;
    closedOrVerifiedActions: number;
    closedActions: number;
    overdueActions: number;
    averageProgress: number;
    incidentCount: number;
  };
};

export type IncidentSourceOption = ReportSourceOption;

export type IncidentReportPerson = {
  id: string;
  fullName: string;
  email: string | null;
  jobTitle: string | null;
};

export type IncidentReportActionUpdate = {
  id: string;
  updateDate: string;
  progressNote: string;
  progressPercent: number | null;
  statusCode: string | null;
  nextFollowUpDate: string | null;
  updatedBy: IncidentReportPerson | null;
  createdAt: string;
};

export type IncidentReportActionAttachment = {
  id: string;
  fileName: string;
  description: string | null;
  mimeType: string | null;
  fileSizeBytes: number | null;
  uploadedAt: string;
  uploadedBy: IncidentReportPerson | null;
};

export type IncidentReportExtensionRequest = {
  id: string;
  requestedUntil: string;
  reason: string;
  requestStatus: ActionExtensionRequestRow["request_status"];
  requestedBy: IncidentReportPerson | null;
  decidedBy: IncidentReportPerson | null;
  decidedAt: string | null;
  decisionNote: string | null;
  createdAt: string;
};

export type IncidentReportAction = {
  id: string;
  actionNo: string;
  title: string;
  description: string | null;
  statusCode: string;
  statusName: string | null;
  priorityCode: string;
  priorityName: string | null;
  progressPercent: number;
  startDate: string | null;
  dueDate: string;
  latestExtensionUntil: string | null;
  completedDate: string | null;
  verifiedDate: string | null;
  extensionReason: string | null;
  evidenceSummary: string | null;
  isOverdue: boolean;
  daysToDue: number | null;
  responsible: IncidentReportPerson | null;
  owner: IncidentReportPerson | null;
  verifier: IncidentReportPerson | null;
  updates: IncidentReportActionUpdate[];
  attachments: IncidentReportActionAttachment[];
  extensionRequests: IncidentReportExtensionRequest[];
};

export type IncidentReportRecommendation = {
  id: string;
  recommendationNo: string;
  recommendationText: string;
  categoryName: string | null;
  priorityCode: string | null;
  priorityName: string | null;
  actions: IncidentReportAction[];
};

export type IncidentFullReport = {
  source: {
    id: string;
    sourceNo: string;
    title: string;
    referenceNo: string | null;
    sourceDate: string;
    summary: string | null;
    departmentName: string | null;
    sourceTypeName: string | null;
    createdBy: IncidentReportPerson | null;
  };
  recommendations: IncidentReportRecommendation[];
  stats: {
    totalRecommendations: number;
    totalActions: number;
    openActions: number;
    closedActions: number;
    verifiedActions: number;
    overdueActions: number;
  };
};

export type FilteredActionReportItem = IncidentReportAction & {
  sourceId: string;
  sourceNo: string;
  sourceTitle: string;
  referenceNo: string | null;
  sourceDate: string;
  sourceTypeCode: string;
  sourceTypeName: string | null;
  departmentCode: string | null;
  departmentName: string | null;
  responsibleDepartmentCode: string | null;
  responsibleDepartmentName: string | null;
  recommendationId: string;
  recommendationNo: string;
  recommendationText: string;
  categoryName: string | null;
};

export type FilteredActionsReport = {
  generatedAt: string;
  filterLabels: {
    search: string | null;
    departmentName: string | null;
    statusName: string | null;
    priorityName: string | null;
    sourceTypeName: string | null;
    sourceLabel: string | null;
    overdueOnly: boolean;
  };
  stats: ReportsSnapshot["kpis"];
  actions: FilteredActionReportItem[];
};

function normalizeSearchValue(value: string) {
  return value.replace(/[%_,]/g, " ").trim();
}

function normalizeResponsibleLookupValue(value: string | null | undefined) {
  return (value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase();
}

function isClosedStatus(statusCode: string | null | undefined) {
  return ["closed", "verified", "cancelled"].includes(statusCode ?? "");
}

function isClosedOnly(statusCode: string | null | undefined) {
  return statusCode === "closed";
}

function isIncidentSourceType(sourceTypeCode: string | null | undefined, sourceTypeName: string | null | undefined) {
  const code = (sourceTypeCode ?? "").toLocaleLowerCase();
  const name = (sourceTypeName ?? "").toLocaleLowerCase();
  return code.includes("incident") || name.includes("incident");
}

function resolveResponsibleDepartmentCode(
  row: ActionSummaryRow,
  profileDepartmentMap: Map<string, string | null>,
  departmentCodeById: Map<string, string>,
  departmentCodeByName: Map<string, string>
) {
  const profileDepartmentId = row.responsible_user_id
    ? profileDepartmentMap.get(row.responsible_user_id) ?? null
    : null;

  if (profileDepartmentId) {
    const profileDepartmentCode = departmentCodeById.get(profileDepartmentId);
    if (profileDepartmentCode) return profileDepartmentCode;
  }

  const manualDepartmentCode = departmentCodeByName.get(normalizeResponsibleLookupValue(row.responsible_name));
  return manualDepartmentCode ?? null;
}

async function filterRowsByResponsibleDepartment(
  rows: ActionSummaryRow[],
  departmentCode: string,
  departments: ReportsLookups["departments"]
) {
  if (!departmentCode || !rows.length) return rows;

  const responsibleUserIds = Array.from(
    new Set(
      rows
        .map((row) => row.responsible_user_id)
        .filter((value): value is string => Boolean(value))
    )
  );

  const profilesResult = responsibleUserIds.length
    ? await supabase
        .from("profiles")
        .select("id, department_id")
        .in("id", responsibleUserIds)
    : { data: [] as Pick<ProfileRow, "id" | "department_id">[], error: null };

  if (profilesResult.error) throw profilesResult.error;

  const profileDepartmentMap = new Map<string, string | null>(
    ((profilesResult.data ?? []) as Pick<ProfileRow, "id" | "department_id">[]).map((row) => [
      row.id,
      row.department_id
    ])
  );
  const departmentCodeById = new Map(departments.map((row) => [row.id, row.code]));
  const departmentCodeByName = new Map(
    departments.map((row) => [normalizeResponsibleLookupValue(row.name), row.code])
  );

  return rows.filter(
    (row) =>
      resolveResponsibleDepartmentCode(
        row,
        profileDepartmentMap,
        departmentCodeById,
        departmentCodeByName
      ) === departmentCode
  );
}

function groupBy<T extends { [key: string]: unknown }>(
  rows: T[],
  key: keyof T
): Record<string, T[]> {
  return rows.reduce<Record<string, T[]>>((acc, row) => {
    const value = row[key];
    if (!value) return acc;

    const bucketKey = String(value);
    acc[bucketKey] ??= [];
    acc[bucketKey].push(row);
    return acc;
  }, {});
}

function buildPeopleMap(rows: ProfileRow[] | null | undefined) {
  return new Map<string, IncidentReportPerson>(
    (rows ?? []).map((row) => [
      row.id,
      {
        id: row.id,
        fullName: row.full_name,
        email: row.email,
        jobTitle: row.job_title
      }
    ])
  );
}

function buildManualPerson(fullName: string, key: string): IncidentReportPerson {
  return {
    id: `manual:${key}`,
    fullName,
    email: null,
    jobTitle: null
  };
}

export async function listReportsLookups(): Promise<ReportsLookups> {
  const [departmentsResult, statusesResult, prioritiesResult, sourceTypesResult] = await Promise.all([
    supabase
      .from("departments")
      .select("id, code, name")
      .eq("is_active", true)
      .order("name", { ascending: true }),
    supabase
      .from("action_statuses")
      .select("code, name")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("priority_levels")
      .select("code, name")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("source_types")
      .select("code, name")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
  ]);

  if (departmentsResult.error) throw departmentsResult.error;
  if (statusesResult.error) throw statusesResult.error;
  if (prioritiesResult.error) throw prioritiesResult.error;
  if (sourceTypesResult.error) throw sourceTypesResult.error;

  return {
    departments: (departmentsResult.data ?? []) as Array<{ id: string; code: string; name: string }>,
    statuses: (statusesResult.data ?? []) as Array<{ code: string; name: string }>,
    priorities: (prioritiesResult.data ?? []) as Array<{ code: string; name: string }>,
    sourceTypes: (sourceTypesResult.data ?? []) as Array<{ code: string; name: string }>
  };
}

export async function getReportsSnapshot(filters: ReportsFilters = {}): Promise<ReportsSnapshot> {
  const lookupsPromise = listReportsLookups();

  let actionSummaryQuery = supabase
    .from("v_action_summary")
    .select("*")
    .order("created_at", { ascending: false });

  let sourceProgressQuery = supabase
    .from("v_source_progress_summary")
    .select("*")
    .order("source_date", { ascending: false });

  if (filters.statusCode) {
    actionSummaryQuery = actionSummaryQuery.eq("status_code", filters.statusCode);
  }

  if (filters.priorityCode) {
    actionSummaryQuery = actionSummaryQuery.eq("priority_code", filters.priorityCode);
  }

  if (filters.sourceTypeCode) {
    actionSummaryQuery = actionSummaryQuery.eq("source_type_code", filters.sourceTypeCode);
    sourceProgressQuery = sourceProgressQuery.eq("source_type_code", filters.sourceTypeCode);
  }

  if (filters.sourceId) {
    actionSummaryQuery = actionSummaryQuery.eq("source_id", filters.sourceId);
    sourceProgressQuery = sourceProgressQuery.eq("source_id", filters.sourceId);
  }

  if (filters.overdueOnly) {
    actionSummaryQuery = actionSummaryQuery.eq("is_overdue", true);
  }

  const normalizedSearch = filters.search ? normalizeSearchValue(filters.search) : "";
  if (normalizedSearch) {
    const filterExpression =
      `action_no.ilike.%${normalizedSearch}%,` +
      `action_title.ilike.%${normalizedSearch}%,` +
      `action_description.ilike.%${normalizedSearch}%,` +
      `source_no.ilike.%${normalizedSearch}%,` +
      `source_title.ilike.%${normalizedSearch}%,` +
      `reference_no.ilike.%${normalizedSearch}%,` +
      `recommendation_no.ilike.%${normalizedSearch}%,` +
      `recommendation_text.ilike.%${normalizedSearch}%,` +
      `responsible_name.ilike.%${normalizedSearch}%,` +
      `owner_name.ilike.%${normalizedSearch}%,` +
      `verifier_name.ilike.%${normalizedSearch}%`;

    actionSummaryQuery = actionSummaryQuery.or(filterExpression);
    sourceProgressQuery = sourceProgressQuery.or(
      `source_no.ilike.%${normalizedSearch}%,source_title.ilike.%${normalizedSearch}%`
    );
  }

  const [lookups, actionSummaryResult, sourceProgressResult] = await Promise.all([
    lookupsPromise,
    actionSummaryQuery,
    sourceProgressQuery
  ]);

  if (actionSummaryResult.error) throw actionSummaryResult.error;
  if (sourceProgressResult.error) throw sourceProgressResult.error;

  const rawActionSummaryRows = (actionSummaryResult.data ?? []) as ActionSummaryRow[];
  const actionSummaryRows = filters.departmentCode
    ? await filterRowsByResponsibleDepartment(rawActionSummaryRows, filters.departmentCode, lookups.departments)
    : rawActionSummaryRows;
  const sourceProgressRows = (sourceProgressResult.data ?? []) as SourceProgressRow[];
  const overdueRows = actionSummaryRows.filter((row) => Boolean(row.is_overdue)) as OverdueActionRow[];

  const openActions = actionSummaryRows.filter((row) => !isClosedStatus(row.status_code)).length;

  const closedActions = actionSummaryRows.filter((row) => isClosedOnly(row.status_code)).length;
  const closedOrVerifiedActions = closedActions;
  const incidentCount = new Set(
    actionSummaryRows
      .filter((row) => isIncidentSourceType(row.source_type_code, row.source_type_name))
      .map((row) => row.source_id)
  ).size;

  const averageProgress = actionSummaryRows.length
    ? Number(((closedActions / actionSummaryRows.length) * 100).toFixed(1))
    : 0;

  return {
    filters: lookups,
    actionSummaryRows,
    sourceProgressRows,
    overdueRows,
    kpis: {
      totalActions: actionSummaryRows.length,
      openActions,
      closedOrVerifiedActions,
      closedActions,
      overdueActions: overdueRows.length,
      averageProgress,
      incidentCount
    }
  };
}

function buildFilterLabels(filters: ReportsFilters, lookups: ReportsLookups, rows: ActionSummaryRow[]) {
  const sourceRow = filters.sourceId
    ? rows.find((row) => row.source_id === filters.sourceId)
    : undefined;

  return {
    search: filters.search?.trim() || null,
    departmentName: filters.departmentCode
      ? lookups.departments.find((item) => item.code === filters.departmentCode)?.name ?? filters.departmentCode
      : null,
    statusName: filters.statusCode
      ? lookups.statuses.find((item) => item.code === filters.statusCode)?.name ?? filters.statusCode
      : null,
    priorityName: filters.priorityCode
      ? lookups.priorities.find((item) => item.code === filters.priorityCode)?.name ?? filters.priorityCode
      : null,
    sourceTypeName: filters.sourceTypeCode
      ? lookups.sourceTypes.find((item) => item.code === filters.sourceTypeCode)?.name ?? filters.sourceTypeCode
      : null,
    sourceLabel: sourceRow ? `${getSourceDisplayNo(sourceRow.source_no, sourceRow.reference_no)} — ${sourceRow.source_title}` : filters.sourceId ? filters.sourceId : null,
    overdueOnly: Boolean(filters.overdueOnly)
  };
}

export async function getFilteredActionsReport(
  filters: ReportsFilters = {}
): Promise<FilteredActionsReport> {
  const snapshot = await getReportsSnapshot(filters);
  const actionSummaryRows = snapshot.actionSummaryRows;
  const actionIds = actionSummaryRows.map((row) => row.action_id);

  const [updatesResult, attachmentsResult, extensionRequestsResult] = actionIds.length
    ? await Promise.all([
        supabase
          .from("action_updates")
          .select("*")
          .in("action_id", actionIds)
          .order("update_date", { ascending: false }),
        supabase
          .from("action_attachments")
          .select("*")
          .in("action_id", actionIds)
          .order("uploaded_at", { ascending: false }),
        supabase
          .from("action_extension_requests")
          .select("*")
          .in("action_id", actionIds)
          .order("created_at", { ascending: false })
      ])
    : [
        { data: [] as ActionUpdateRow[], error: null },
        { data: [] as ActionAttachmentRow[], error: null },
        { data: [] as ActionExtensionRequestRow[], error: null }
      ];

  if (updatesResult.error) throw updatesResult.error;
  if (attachmentsResult.error) throw attachmentsResult.error;
  if (extensionRequestsResult.error) throw extensionRequestsResult.error;

  const updates = (updatesResult.data ?? []) as ActionUpdateRow[];
  const attachments = (attachmentsResult.data ?? []) as ActionAttachmentRow[];
  const extensionRequests = (extensionRequestsResult.data ?? []) as ActionExtensionRequestRow[];

  const peopleIds = new Set<string>();
  const collectId = (value: string | null | undefined) => {
    if (value) peopleIds.add(value);
  };

  actionSummaryRows.forEach((row) => {
    collectId(row.responsible_user_id);
    collectId(row.owner_user_id);
    collectId(row.verifier_user_id);
  });
  updates.forEach((row) => collectId(row.updated_by));
  attachments.forEach((row) => collectId(row.uploaded_by));
  extensionRequests.forEach((row) => {
    collectId(row.requested_by);
    collectId(row.decided_by);
  });

  const profilesResult = peopleIds.size
    ? await supabase
        .from("profiles")
        .select("id, full_name, email, job_title, department_id")
        .in("id", Array.from(peopleIds))
    : { data: [] as Pick<ProfileRow, "id" | "full_name" | "email" | "job_title">[], error: null };

  if (profilesResult.error) throw profilesResult.error;

  const profileDepartmentIdMap = new Map<string, string | null>(
    ((profilesResult.data ?? []) as Pick<ProfileRow, "id" | "department_id">[]).map((profile) => [
      profile.id,
      profile.department_id
    ])
  );
  const departmentCodeById = new Map(snapshot.filters.departments.map((department) => [department.id, department.code]));
  const departmentNameByCode = new Map(snapshot.filters.departments.map((department) => [department.code, department.name]));
  const departmentCodeByName = new Map(
    snapshot.filters.departments.map((department) => [normalizeResponsibleLookupValue(department.name), department.code])
  );
  const resolveReportResponsibleDepartment = (row: ActionSummaryRow) => {
    const profileDepartmentId = row.responsible_user_id ? profileDepartmentIdMap.get(row.responsible_user_id) ?? null : null;
    const profileDepartmentCode = profileDepartmentId ? departmentCodeById.get(profileDepartmentId) ?? null : null;
    const manualDepartmentCode = departmentCodeByName.get(normalizeResponsibleLookupValue(row.responsible_name));
    const code = profileDepartmentCode ?? manualDepartmentCode ?? null;
    return {
      code,
      name: code ? departmentNameByCode.get(code) ?? code : null
    };
  };

  const peopleMap = buildPeopleMap(profilesResult.data as ProfileRow[]);
  const updatesByActionId = groupBy(updates, "action_id");
  const attachmentsByActionId = groupBy(attachments, "action_id");
  const extensionRequestsByActionId = groupBy(extensionRequests, "action_id");

  const actions: FilteredActionReportItem[] = actionSummaryRows.map((row) => ({
    id: row.action_id,
    actionNo: row.action_no,
    title: row.action_title,
    description: row.action_description,
    statusCode: row.status_code,
    statusName: row.status_name,
    priorityCode: row.priority_code,
    priorityName: row.priority_name,
    progressPercent: row.progress_percent,
    startDate: row.start_date,
    dueDate: row.due_date,
    latestExtensionUntil: row.latest_extension_until,
    completedDate: row.completed_date,
    verifiedDate: row.verified_date,
    extensionReason: row.extension_reason,
    evidenceSummary: row.evidence_summary,
    isOverdue: Boolean(row.is_overdue),
    daysToDue: row.days_to_due,
    responsible: row.responsible_user_id
      ? peopleMap.get(row.responsible_user_id) ?? (row.responsible_name ? buildManualPerson(row.responsible_name, `responsible:${row.action_id}`) : null)
      : row.responsible_name
        ? buildManualPerson(row.responsible_name, `responsible:${row.action_id}`)
        : null,
    owner: row.owner_user_id
      ? peopleMap.get(row.owner_user_id) ?? (row.owner_name ? buildManualPerson(row.owner_name, `owner:${row.action_id}`) : null)
      : row.owner_name
        ? buildManualPerson(row.owner_name, `owner:${row.action_id}`)
        : null,
    verifier: row.verifier_user_id
      ? peopleMap.get(row.verifier_user_id) ?? (row.verifier_name ? buildManualPerson(row.verifier_name, `verifier:${row.action_id}`) : null)
      : row.verifier_name
        ? buildManualPerson(row.verifier_name, `verifier:${row.action_id}`)
        : null,
    updates: (updatesByActionId[row.action_id] ?? []).map((updateRow) => ({
      id: updateRow.id,
      updateDate: updateRow.update_date,
      progressNote: updateRow.progress_note,
      progressPercent: updateRow.progress_percent,
      statusCode: updateRow.status_code,
      nextFollowUpDate: updateRow.next_follow_up_date,
      updatedBy: updateRow.updated_by ? peopleMap.get(updateRow.updated_by) ?? null : null,
      createdAt: updateRow.created_at
    })),
    attachments: (attachmentsByActionId[row.action_id] ?? []).map((attachmentRow) => ({
      id: attachmentRow.id,
      fileName: attachmentRow.file_name,
      description: attachmentRow.description,
      mimeType: attachmentRow.mime_type,
      fileSizeBytes: attachmentRow.file_size_bytes,
      uploadedAt: attachmentRow.uploaded_at,
      uploadedBy: attachmentRow.uploaded_by ? peopleMap.get(attachmentRow.uploaded_by) ?? null : null
    })),
    extensionRequests: (extensionRequestsByActionId[row.action_id] ?? []).map((requestRow) => ({
      id: requestRow.id,
      requestedUntil: requestRow.requested_until,
      reason: requestRow.reason,
      requestStatus: requestRow.request_status,
      requestedBy: requestRow.requested_by ? peopleMap.get(requestRow.requested_by) ?? null : null,
      decidedBy: requestRow.decided_by ? peopleMap.get(requestRow.decided_by) ?? null : null,
      decidedAt: requestRow.decided_at,
      decisionNote: requestRow.decision_note,
      createdAt: requestRow.created_at
    })),
    sourceId: row.source_id,
    sourceNo: getSourceDisplayNo(row.source_no, row.reference_no),
    sourceTitle: row.source_title,
    referenceNo: row.reference_no,
    sourceDate: row.source_date,
    sourceTypeCode: row.source_type_code,
    sourceTypeName: row.source_type_name,
    departmentCode: row.department_code,
    departmentName: row.department_name,
    responsibleDepartmentCode: resolveReportResponsibleDepartment(row).code,
    responsibleDepartmentName: resolveReportResponsibleDepartment(row).name,
    recommendationId: row.recommendation_id,
    recommendationNo: row.recommendation_no,
    recommendationText: row.recommendation_text,
    categoryName: row.category_name
  }));

  return {
    generatedAt: new Date().toISOString(),
    filterLabels: buildFilterLabels(filters, snapshot.filters, actionSummaryRows),
    stats: snapshot.kpis,
    actions
  };
}

export async function listIncidentSources(
  search = "",
  sourceTypeCode = ""
): Promise<IncidentSourceOption[]> {
  let sourcesQuery = supabase
    .from("sources")
    .select("id, source_no, title, source_date, reference_no, department_id, source_type_code")
    .order("source_date", { ascending: false });

  if (sourceTypeCode) {
    sourcesQuery = sourcesQuery.eq("source_type_code", sourceTypeCode);
  }

  const normalizedSearch = normalizeSearchValue(search);
  if (normalizedSearch) {
    sourcesQuery = sourcesQuery.or(
      `source_no.ilike.%${normalizedSearch}%,title.ilike.%${normalizedSearch}%,reference_no.ilike.%${normalizedSearch}%`
    );
  }

  const [sourcesResult, departmentsResult, sourceTypesResult] = await Promise.all([
    sourcesQuery,
    supabase.from("departments").select("id, name"),
    supabase.from("source_types").select("code, name")
  ]);

  if (sourcesResult.error) throw sourcesResult.error;
  if (departmentsResult.error) throw departmentsResult.error;
  if (sourceTypesResult.error) throw sourceTypesResult.error;

  const departmentsMap = new Map<string, string>(
    ((departmentsResult.data ?? []) as Pick<DepartmentRow, "id" | "name">[]).map((row) => [
      row.id,
      row.name
    ])
  );
  const sourceTypesMap = new Map<string, string>(
    ((sourceTypesResult.data ?? []) as Pick<SourceTypeRow, "code" | "name">[]).map((row) => [
      row.code,
      row.name
    ])
  );

  return ((sourcesResult.data ?? []) as Array<
    Pick<SourceRow, "id" | "source_no" | "title" | "source_date" | "reference_no" | "department_id" | "source_type_code">
  >).map((row) => ({
    id: row.id,
    sourceNo: getSourceDisplayNo(row.source_no, row.reference_no),
    title: row.title,
    sourceDate: row.source_date,
    referenceNo: row.reference_no,
    departmentName: row.department_id ? departmentsMap.get(row.department_id) ?? null : null,
    sourceTypeCode: row.source_type_code,
    sourceTypeName: sourceTypesMap.get(row.source_type_code) ?? null
  }));
}

export async function getIncidentFullReport(sourceId: string): Promise<IncidentFullReport> {
  const lookupsPromise = Promise.all([
    supabase.from("departments").select("id, name"),
    supabase.from("source_types").select("code, name"),
    supabase.from("recommendation_categories").select("id, name"),
    supabase.from("priority_levels").select("code, name")
  ]);

  const sourcePromise = supabase.from("sources").select("*").eq("id", sourceId).single();
  const recommendationsPromise = supabase
    .from("recommendations")
    .select("*")
    .eq("source_id", sourceId)
    .order("created_at", { ascending: true });
  const actionSummaryPromise = supabase
    .from("v_action_summary")
    .select("*")
    .eq("source_id", sourceId)
    .order("priority_sort_order", { ascending: true })
    .order("due_date", { ascending: true });

  const [[departmentsResult, sourceTypesResult, categoriesResult, prioritiesResult], sourceResult, recommendationsResult, actionSummaryResult] =
    await Promise.all([lookupsPromise, sourcePromise, recommendationsPromise, actionSummaryPromise]);

  if (departmentsResult.error) throw departmentsResult.error;
  if (sourceTypesResult.error) throw sourceTypesResult.error;
  if (categoriesResult.error) throw categoriesResult.error;
  if (prioritiesResult.error) throw prioritiesResult.error;
  if (sourceResult.error) throw sourceResult.error;
  if (recommendationsResult.error) throw recommendationsResult.error;
  if (actionSummaryResult.error) throw actionSummaryResult.error;

  const source = sourceResult.data as SourceRow;
  const recommendations = (recommendationsResult.data ?? []) as RecommendationRow[];
  const actionSummaryRows = (actionSummaryResult.data ?? []) as ActionSummaryRow[];
  const actionIds = actionSummaryRows.map((row) => row.action_id);

  const [updatesResult, attachmentsResult, extensionRequestsResult] = actionIds.length
    ? await Promise.all([
        supabase
          .from("action_updates")
          .select("*")
          .in("action_id", actionIds)
          .order("update_date", { ascending: false }),
        supabase
          .from("action_attachments")
          .select("*")
          .in("action_id", actionIds)
          .order("uploaded_at", { ascending: false }),
        supabase
          .from("action_extension_requests")
          .select("*")
          .in("action_id", actionIds)
          .order("created_at", { ascending: false })
      ])
    : [
        { data: [] as ActionUpdateRow[], error: null },
        { data: [] as ActionAttachmentRow[], error: null },
        { data: [] as ActionExtensionRequestRow[], error: null }
      ];

  if (updatesResult.error) throw updatesResult.error;
  if (attachmentsResult.error) throw attachmentsResult.error;
  if (extensionRequestsResult.error) throw extensionRequestsResult.error;

  const updates = (updatesResult.data ?? []) as ActionUpdateRow[];
  const attachments = (attachmentsResult.data ?? []) as ActionAttachmentRow[];
  const extensionRequests = (extensionRequestsResult.data ?? []) as ActionExtensionRequestRow[];

  const peopleIds = new Set<string>();
  const collectId = (value: string | null | undefined) => {
    if (value) peopleIds.add(value);
  };

  collectId(source.created_by);
  recommendations.forEach((row) => collectId(row.created_by));
  actionSummaryRows.forEach((row) => {
    collectId(row.responsible_user_id);
    collectId(row.owner_user_id);
    collectId(row.verifier_user_id);
  });
  updates.forEach((row) => collectId(row.updated_by));
  attachments.forEach((row) => collectId(row.uploaded_by));
  extensionRequests.forEach((row) => {
    collectId(row.requested_by);
    collectId(row.decided_by);
  });

  const profilesResult = peopleIds.size
    ? await supabase
        .from("profiles")
        .select("id, full_name, email, job_title, department_id")
        .in("id", Array.from(peopleIds))
    : { data: [] as Pick<ProfileRow, "id" | "full_name" | "email" | "job_title">[], error: null };

  if (profilesResult.error) throw profilesResult.error;

  const peopleMap = buildPeopleMap(profilesResult.data as ProfileRow[]);
  const departmentsMap = new Map<string, string>(
    ((departmentsResult.data ?? []) as Pick<DepartmentRow, "id" | "name">[]).map((row) => [
      row.id,
      row.name
    ])
  );
  const sourceTypesMap = new Map<string, string>(
    ((sourceTypesResult.data ?? []) as Pick<SourceTypeRow, "code" | "name">[]).map((row) => [
      row.code,
      row.name
    ])
  );
  const categoriesMap = new Map<string, string>(
    ((categoriesResult.data ?? []) as Pick<RecommendationCategoryRow, "id" | "name">[]).map((row) => [
      row.id,
      row.name
    ])
  );
  const prioritiesMap = new Map<string, string>(
    ((prioritiesResult.data ?? []) as Pick<PriorityLevelRow, "code" | "name">[]).map((row) => [
      row.code,
      row.name
    ])
  );

  const updatesByActionId = groupBy(updates, "action_id");
  const attachmentsByActionId = groupBy(attachments, "action_id");
  const extensionRequestsByActionId = groupBy(extensionRequests, "action_id");

  const actionsByRecommendationId = actionSummaryRows.reduce<Record<string, IncidentReportAction[]>>(
    (acc, row) => {
      const action: IncidentReportAction = {
        id: row.action_id,
        actionNo: row.action_no,
        title: row.action_title,
        description: row.action_description,
        statusCode: row.status_code,
        statusName: row.status_name,
        priorityCode: row.priority_code,
        priorityName: row.priority_name,
        progressPercent: row.progress_percent,
        startDate: row.start_date,
        dueDate: row.due_date,
        latestExtensionUntil: row.latest_extension_until,
        completedDate: row.completed_date,
        verifiedDate: row.verified_date,
        extensionReason: row.extension_reason,
        evidenceSummary: row.evidence_summary,
        isOverdue: Boolean(row.is_overdue),
        daysToDue: row.days_to_due,
        responsible: row.responsible_user_id
          ? peopleMap.get(row.responsible_user_id) ?? (row.responsible_name ? buildManualPerson(row.responsible_name, `responsible:${row.action_id}`) : null)
          : row.responsible_name
            ? buildManualPerson(row.responsible_name, `responsible:${row.action_id}`)
            : null,
        owner: row.owner_user_id
          ? peopleMap.get(row.owner_user_id) ?? (row.owner_name ? buildManualPerson(row.owner_name, `owner:${row.action_id}`) : null)
          : row.owner_name
            ? buildManualPerson(row.owner_name, `owner:${row.action_id}`)
            : null,
        verifier: row.verifier_user_id
          ? peopleMap.get(row.verifier_user_id) ?? (row.verifier_name ? buildManualPerson(row.verifier_name, `verifier:${row.action_id}`) : null)
          : row.verifier_name
            ? buildManualPerson(row.verifier_name, `verifier:${row.action_id}`)
            : null,
        updates: (updatesByActionId[row.action_id] ?? []).map((updateRow) => ({
          id: updateRow.id,
          updateDate: updateRow.update_date,
          progressNote: updateRow.progress_note,
          progressPercent: updateRow.progress_percent,
          statusCode: updateRow.status_code,
          nextFollowUpDate: updateRow.next_follow_up_date,
          updatedBy: updateRow.updated_by ? peopleMap.get(updateRow.updated_by) ?? null : null,
          createdAt: updateRow.created_at
        })),
        attachments: (attachmentsByActionId[row.action_id] ?? []).map((attachmentRow) => ({
          id: attachmentRow.id,
          fileName: attachmentRow.file_name,
          description: attachmentRow.description,
          mimeType: attachmentRow.mime_type,
          fileSizeBytes: attachmentRow.file_size_bytes,
          uploadedAt: attachmentRow.uploaded_at,
          uploadedBy: attachmentRow.uploaded_by
            ? peopleMap.get(attachmentRow.uploaded_by) ?? null
            : null
        })),
        extensionRequests: (extensionRequestsByActionId[row.action_id] ?? []).map((requestRow) => ({
          id: requestRow.id,
          requestedUntil: requestRow.requested_until,
          reason: requestRow.reason,
          requestStatus: requestRow.request_status,
          requestedBy: requestRow.requested_by
            ? peopleMap.get(requestRow.requested_by) ?? null
            : null,
          decidedBy: requestRow.decided_by ? peopleMap.get(requestRow.decided_by) ?? null : null,
          decidedAt: requestRow.decided_at,
          decisionNote: requestRow.decision_note,
          createdAt: requestRow.created_at
        }))
      };

      acc[row.recommendation_id] ??= [];
      acc[row.recommendation_id].push(action);
      return acc;
    },
    {}
  );

  const reportRecommendations: IncidentReportRecommendation[] = recommendations.map((row) => ({
    id: row.id,
    recommendationNo: row.recommendation_no,
    recommendationText: row.recommendation_text,
    categoryName: row.category_id ? categoriesMap.get(row.category_id) ?? null : null,
    priorityCode: row.priority_code,
    priorityName: row.priority_code ? prioritiesMap.get(row.priority_code) ?? null : null,
    actions: actionsByRecommendationId[row.id] ?? []
  }));

  const totalActions = actionSummaryRows.length;
  const openActions = actionSummaryRows.filter(
    (row) => !["closed", "verified", "cancelled"].includes(row.status_code)
  ).length;
  const closedActions = actionSummaryRows.filter((row) => row.status_code === "closed").length;
  const verifiedActions = actionSummaryRows.filter((row) => row.status_code === "verified").length;
  const overdueActions = actionSummaryRows.filter((row) => Boolean(row.is_overdue)).length;

  return {
    source: {
      id: source.id,
      sourceNo: getSourceDisplayNo(source.source_no, source.reference_no),
      title: source.title,
      referenceNo: source.reference_no,
      sourceDate: source.source_date,
      summary: source.summary,
      departmentName: source.department_id ? departmentsMap.get(source.department_id) ?? null : null,
      sourceTypeName: sourceTypesMap.get(source.source_type_code) ?? null,
      createdBy: source.created_by ? peopleMap.get(source.created_by) ?? null : null
    },
    recommendations: reportRecommendations,
    stats: {
      totalRecommendations: reportRecommendations.length,
      totalActions,
      openActions,
      closedActions,
      verifiedActions,
      overdueActions
    }
  };
}
