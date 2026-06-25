import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database";

type ActionSummaryRow = Database["public"]["Views"]["v_action_summary"]["Row"];
type PendingExtensionRow = {
  id: string;
  action_id: string;
  requested_until: string;
  created_at: string;
};

type DepartmentLookupRow = {
  id: string;
  code: string | null;
  name: string;
};

type ProfileDepartmentLookupRow = {
  id: string;
  department_id: string | null;
};

type DashboardKpis = {
  totalActions: number;
  openActions: number;
  closedActions: number;
  overdueActions: number;
  dueIn7Days: number;
  pendingVerification: number;
  verifiedActions: number;
  pendingExtensions: number;
  completionRate: number;
};

export type DashboardUpcomingAction = {
  id: string;
  actionNo: string;
  title: string;
  dueDate: string;
  statusCode: string;
  priorityCode: string;
  responsibleName: string | null;
};

export type DashboardOwnerWorkload = {
  responsibleUserId: string | null;
  responsibleManualName: string | null;
  responsibleName: string;
  openCount: number;
  overdueCount: number;
  dueSoonCount: number;
  criticalCount: number;
};

export type DashboardDepartmentSnapshot = {
  departmentId: string | null;
  departmentName: string;
  totalCount: number;
  openCount: number;
  closedCount: number;
  overdueCount: number;
  closurePercent: number;
};

export type DashboardPrioritySnapshot = {
  priorityCode: string;
  priorityName: string;
  totalCount: number;
  openCount: number;
  closedCount: number;
  overdueCount: number;
  closurePercent: number;
};

export type DashboardStatusSnapshot = {
  statusCode: string;
  statusName: string;
  totalCount: number;
  closureRelatedCount: number;
};

export type DashboardTrendSnapshot = {
  monthKey: string;
  monthLabel: string;
  createdCount: number;
  closedCount: number;
};

export type DashboardDepartmentDirectoryItem = {
  id: string;
  name: string;
};

export type DashboardAlertAction = {
  actionId: string;
  actionNo: string;
  title: string;
  responsibleName: string | null;
  dueDate: string;
  statusCode: string;
  priorityCode: string;
};

export type DashboardExtensionAlert = {
  requestId: string;
  actionId: string;
  actionNo: string;
  title: string;
  responsibleName: string | null;
  requestedUntil: string;
  createdAt: string;
};

export type DashboardNotifications = {
  overdueCount: number;
  dueSoonCount: number;
  pendingVerificationCount: number;
  pendingExtensionApprovals: number;
  overdueItems: DashboardAlertAction[];
  dueSoonItems: DashboardAlertAction[];
  pendingVerificationItems: DashboardAlertAction[];
  pendingExtensionItems: DashboardExtensionAlert[];
};

export type DashboardOverview = {
  kpis: DashboardKpis;
  upcomingActions: DashboardUpcomingAction[];
  ownerWorkload: DashboardOwnerWorkload[];
  departmentSnapshots: DashboardDepartmentSnapshot[];
  prioritySnapshots: DashboardPrioritySnapshot[];
  statusSnapshots: DashboardStatusSnapshot[];
  trendSnapshots: DashboardTrendSnapshot[];
  departmentDirectory: DashboardDepartmentDirectoryItem[];
  notifications: DashboardNotifications;
};

function toDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getEffectiveDueDate(row: ActionSummaryRow) {
  return row.latest_extension_until || row.due_date;
}

function getMonthKey(value: string | null | undefined) {
  if (!value) return "";
  return value.slice(0, 7);
}

function getMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function isClosed(row: ActionSummaryRow) {
  return ["closed", "verified", "cancelled"].includes(row.status_code);
}

function normalizeResponsibleName(value: string | null | undefined) {
  return (value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase();
}

function mapActionAlert(row: ActionSummaryRow): DashboardAlertAction {
  return {
    actionId: row.action_id,
    actionNo: row.action_no,
    title: row.action_title,
    responsibleName: row.responsible_name,
    dueDate: getEffectiveDueDate(row),
    statusCode: row.status_code,
    priorityCode: row.priority_code,
  };
}

export async function fetchDashboardOverview(): Promise<DashboardOverview> {
  const today = new Date();
  const plus7 = new Date(today);
  plus7.setDate(plus7.getDate() + 7);

  const [actionsResult, departmentsResult, profilesResult, pendingExtensionsResult] = await Promise.all([
    supabase.from("v_action_summary").select("*"),
    supabase
      .from("departments")
      .select("id, code, name")
      .eq("is_active", true)
      .order("name", { ascending: true }),
    supabase.from("profiles").select("id, department_id"),
    supabase
      .from("action_extension_requests")
      .select("id, action_id, requested_until, created_at")
      .eq("request_status", "pending")
      .order("created_at", { ascending: false }),
  ]);

  if (actionsResult.error) throw actionsResult.error;
  if (departmentsResult.error) throw departmentsResult.error;
  if (profilesResult.error) throw profilesResult.error;
  if (pendingExtensionsResult.error) throw pendingExtensionsResult.error;

  const actionRows = (actionsResult.data ?? []) as ActionSummaryRow[];
  const departmentRows = (departmentsResult.data ?? []) as DepartmentLookupRow[];
  const profileRows = (profilesResult.data ?? []) as ProfileDepartmentLookupRow[];
  const pendingExtensionRows = (pendingExtensionsResult.data ?? []) as PendingExtensionRow[];

  const todayText = toDateString(today);
  const next7Text = toDateString(plus7);
  const activeRows = actionRows.filter((row) => !isClosed(row));
  const closedRows = actionRows.filter((row) => isClosed(row));
  const actionMap = new Map(actionRows.map((row) => [row.action_id, row]));
  const closedActionsCount = closedRows.length;
  const completionRate = actionRows.length ? Number(((closedActionsCount / actionRows.length) * 100).toFixed(1)) : 0;

  const upcomingActions = [...activeRows]
    .sort((a, b) => getEffectiveDueDate(a).localeCompare(getEffectiveDueDate(b)))
    .slice(0, 8)
    .map((row) => ({
      id: row.action_id,
      actionNo: row.action_no,
      title: row.action_title,
      dueDate: getEffectiveDueDate(row),
      statusCode: row.status_code,
      priorityCode: row.priority_code,
      responsibleName: row.responsible_name,
    }));

  const ownerMap = new Map<
    string,
    {
      responsibleUserId: string | null;
      responsibleManualName: string | null;
      responsibleName: string;
      openCount: number;
      overdueCount: number;
      dueSoonCount: number;
      criticalCount: number;
    }
  >();

  for (const row of activeRows) {
    const key = row.responsible_user_id || `name:${row.responsible_name || "unassigned"}`;
    const bucket = ownerMap.get(key) ?? {
      responsibleUserId: row.responsible_user_id ?? null,
      responsibleManualName: row.responsible_user_id ? null : row.responsible_name ?? null,
      responsibleName: row.responsible_name || "Unassigned",
      openCount: 0,
      overdueCount: 0,
      dueSoonCount: 0,
      criticalCount: 0,
    };

    const effectiveDueDate = getEffectiveDueDate(row);
    bucket.openCount += 1;
    if (effectiveDueDate < todayText) bucket.overdueCount += 1;
    if (effectiveDueDate >= todayText && effectiveDueDate <= next7Text) bucket.dueSoonCount += 1;
    if (row.priority_code === "critical") bucket.criticalCount += 1;
    ownerMap.set(key, bucket);
  }

  const ownerWorkload = [...ownerMap.values()]
    .sort(
      (a, b) =>
        b.overdueCount - a.overdueCount ||
        b.openCount - a.openCount ||
        b.criticalCount - a.criticalCount ||
        a.responsibleName.localeCompare(b.responsibleName)
    )
    .slice(0, 8);

  const priorityMap = new Map<string, DashboardPrioritySnapshot>();
  for (const row of actionRows) {
    const key = row.priority_code || "unknown";
    const bucket = priorityMap.get(key) ?? {
      priorityCode: row.priority_code || "unknown",
      priorityName: row.priority_name || row.priority_code || "Unknown",
      totalCount: 0,
      openCount: 0,
      closedCount: 0,
      overdueCount: 0,
      closurePercent: 0,
    };
    bucket.totalCount += 1;
    if (isClosed(row)) {
      bucket.closedCount += 1;
    } else {
      bucket.openCount += 1;
      if (getEffectiveDueDate(row) < todayText) bucket.overdueCount += 1;
    }
    bucket.closurePercent = bucket.totalCount ? Number(((bucket.closedCount / bucket.totalCount) * 100).toFixed(1)) : 0;
    priorityMap.set(key, bucket);
  }

  const sortOrder: Record<string, number> = { critical: 1, high: 2, medium: 3, low: 4 };
  const prioritySnapshots = [...priorityMap.values()].sort(
    (a, b) => (sortOrder[a.priorityCode] ?? 99) - (sortOrder[b.priorityCode] ?? 99)
  );

  const statusMap = new Map<string, DashboardStatusSnapshot>();
  for (const row of actionRows) {
    const key = row.status_code || "unknown";
    const bucket = statusMap.get(key) ?? {
      statusCode: key,
      statusName: row.status_name || key,
      totalCount: 0,
      closureRelatedCount: 0,
    };
    bucket.totalCount += 1;
    if (isClosed(row)) bucket.closureRelatedCount += 1;
    statusMap.set(key, bucket);
  }
  const statusSnapshots = [...statusMap.values()].sort((a, b) => b.totalCount - a.totalCount);

  const trendStart = addMonths(new Date(today.getFullYear(), today.getMonth(), 1), -5);
  const trendBuckets = new Map<string, DashboardTrendSnapshot>();
  for (let index = 0; index < 6; index += 1) {
    const monthKey = toDateString(addMonths(trendStart, index)).slice(0, 7);
    trendBuckets.set(monthKey, {
      monthKey,
      monthLabel: getMonthLabel(monthKey),
      createdCount: 0,
      closedCount: 0,
    });
  }

  for (const row of actionRows) {
    const createdMonth = getMonthKey(row.created_at);
    if (trendBuckets.has(createdMonth)) {
      trendBuckets.get(createdMonth)!.createdCount += 1;
    }
    const closedMonth = getMonthKey(row.verified_date || row.completed_date);
    if (trendBuckets.has(closedMonth)) {
      trendBuckets.get(closedMonth)!.closedCount += 1;
    }
  }
  const trendSnapshots = [...trendBuckets.values()];

  const departmentById = new Map(departmentRows.map((row) => [row.id, row]));
  const departmentByName = new Map(departmentRows.map((row) => [normalizeResponsibleName(row.name), row]));
  const profileDepartmentMap = new Map(profileRows.map((row) => [row.id, row.department_id]));
  const departmentMap = new Map<
    string,
    {
      departmentId: string | null;
      departmentName: string;
      totalCount: number;
      openCount: number;
      closedCount: number;
      overdueCount: number;
    }
  >();

  for (const department of departmentRows) {
    departmentMap.set(department.id, {
      departmentId: department.id,
      departmentName: department.name,
      totalCount: 0,
      openCount: 0,
      closedCount: 0,
      overdueCount: 0,
    });
  }

  const unassignedKey = "__unassigned_responsible_department__";

  for (const row of actionRows) {
    const profileDepartmentId = row.responsible_user_id ? profileDepartmentMap.get(row.responsible_user_id) : null;
    const departmentFromProfile = profileDepartmentId ? departmentById.get(profileDepartmentId) : undefined;
    const departmentFromManualName = !departmentFromProfile ? departmentByName.get(normalizeResponsibleName(row.responsible_name)) : undefined;
    const department = departmentFromProfile ?? departmentFromManualName;
    const key = department?.id ?? unassignedKey;
    const bucket = departmentMap.get(key) ?? {
      departmentId: department?.id ?? null,
      departmentName: department?.name ?? "No responsible department",
      totalCount: 0,
      openCount: 0,
      closedCount: 0,
      overdueCount: 0,
    };

    const effectiveDueDate = getEffectiveDueDate(row);
    bucket.totalCount += 1;
    if (isClosed(row)) {
      bucket.closedCount += 1;
    } else {
      bucket.openCount += 1;
      if (effectiveDueDate < todayText) bucket.overdueCount += 1;
    }
    departmentMap.set(key, bucket);
  }

  const departmentSnapshots = [...departmentMap.values()]
    .filter((row) => row.totalCount > 0 || row.departmentId !== null)
    .map((row) => ({
      departmentId: row.departmentId,
      departmentName: row.departmentName,
      totalCount: row.totalCount,
      openCount: row.openCount,
      closedCount: row.closedCount,
      overdueCount: row.overdueCount,
      closurePercent: row.totalCount ? Number(((row.closedCount / row.totalCount) * 100).toFixed(1)) : 0,
    }))
    .sort(
      (a, b) =>
        b.openCount - a.openCount ||
        b.overdueCount - a.overdueCount ||
        b.totalCount - a.totalCount ||
        a.departmentName.localeCompare(b.departmentName)
    );

  const overdueItems = activeRows
    .filter((row) => getEffectiveDueDate(row) < todayText)
    .sort((a, b) => getEffectiveDueDate(a).localeCompare(getEffectiveDueDate(b)))
    .slice(0, 6)
    .map(mapActionAlert);

  const dueSoonItems = activeRows
    .filter((row) => {
      const due = getEffectiveDueDate(row);
      return due >= todayText && due <= next7Text;
    })
    .sort((a, b) => getEffectiveDueDate(a).localeCompare(getEffectiveDueDate(b)))
    .slice(0, 6)
    .map(mapActionAlert);

  const pendingVerificationItems = activeRows
    .filter((row) => row.status_code === "pending_verification")
    .sort((a, b) => getEffectiveDueDate(a).localeCompare(getEffectiveDueDate(b)))
    .slice(0, 6)
    .map(mapActionAlert);

  const pendingExtensionItems = pendingExtensionRows
    .map((row) => {
      const action = actionMap.get(row.action_id);
      if (!action) return null;
      return {
        requestId: row.id,
        actionId: row.action_id,
        actionNo: action.action_no,
        title: action.action_title,
        responsibleName: action.responsible_name,
        requestedUntil: row.requested_until,
        createdAt: row.created_at,
      } satisfies DashboardExtensionAlert;
    })
    .filter(Boolean)
    .slice(0, 6) as DashboardExtensionAlert[];

  return {
    kpis: {
      totalActions: actionRows.length,
      openActions: activeRows.length,
      closedActions: closedActionsCount,
      overdueActions: activeRows.filter((row) => getEffectiveDueDate(row) < todayText).length,
      dueIn7Days: activeRows.filter((row) => {
        const due = getEffectiveDueDate(row);
        return due >= todayText && due <= next7Text;
      }).length,
      pendingVerification: actionRows.filter((row) => row.status_code === "pending_verification").length,
      verifiedActions: actionRows.filter((row) => row.status_code === "verified").length,
      pendingExtensions: pendingExtensionRows.length,
      completionRate,
    },
    upcomingActions,
    ownerWorkload,
    departmentSnapshots,
    prioritySnapshots,
    statusSnapshots,
    trendSnapshots,
    departmentDirectory: departmentRows.map((row) => ({ id: row.id, name: row.name })),
    notifications: {
      overdueCount: overdueItems.length,
      dueSoonCount: dueSoonItems.length,
      pendingVerificationCount: pendingVerificationItems.length,
      pendingExtensionApprovals: pendingExtensionRows.length,
      overdueItems,
      dueSoonItems,
      pendingVerificationItems,
      pendingExtensionItems,
    },
  };
}
