import { getDefaultPermissionsForRole } from "@/lib/permissions";
import { supabase } from "@/lib/supabase";

type ProfileDepartmentRow = {
  id: string;
  code: string;
  name: string;
};

type ProfileRow = {
  id: string;
  email: string;
  full_name: string;
  employee_code: string | null;
  department_id: string | null;
  role_code: string;
  job_title: string | null;
  is_active: boolean;
  created_at: string;
  departments?: ProfileDepartmentRow | ProfileDepartmentRow[] | null;
};

type RolePermissionRow = {
  role_code: string;
  permission_code: string;
};

export type UserRoleOption = {
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
};

export type UserDepartmentOption = {
  id: string;
  code: string;
  name: string;
};

export type UserAccessRow = {
  id: string;
  email: string;
  fullName: string;
  employeeCode: string | null;
  departmentId: string | null;
  departmentName: string | null;
  departmentCode: string | null;
  roleCode: string;
  jobTitle: string | null;
  isActive: boolean;
  createdAt: string;
};

export type UserAccessFilters = {
  search?: string;
  roleCode?: string;
  active?: "all" | "active" | "inactive";
};

export type UpdateUserAccessPayload = {
  fullName: string;
  employeeCode?: string | null;
  departmentId?: string | null;
  roleCode: string;
  jobTitle?: string | null;
  isActive: boolean;
};

export type InviteUserPayload = {
  email: string;
  fullName: string;
  employeeCode?: string | null;
  departmentId?: string | null;
  roleCode: string;
  jobTitle?: string | null;
};

export type RolePermissionAssignment = {
  roleCode: string;
  roleName: string;
  roleDescription: string | null;
  isActive: boolean;
  permissions: string[];
};

function normalizeDepartment(
  value: ProfileDepartmentRow | ProfileDepartmentRow[] | null | undefined
): ProfileDepartmentRow | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function mapUser(row: ProfileRow): UserAccessRow {
  const department = normalizeDepartment(row.departments);

  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    employeeCode: row.employee_code,
    departmentId: row.department_id,
    departmentName: department?.name ?? null,
    departmentCode: department?.code ?? null,
    roleCode: row.role_code,
    jobTitle: row.job_title,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

async function callAdminFunction<T>(path: string, body: Record<string, unknown>) {
  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;

  if (!accessToken) {
    throw new Error("No active session found.");
  }

  const response = await fetch(`/.netlify/functions/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });

  const rawBody = await response.text();
  let payload = {} as T & { error?: string };

  if (rawBody) {
    try {
      payload = JSON.parse(rawBody) as T & { error?: string };
    } catch {
      if (!response.ok && response.status === 404) {
        throw new Error(`Function ${path} was not found. Run the updated Netlify functions locally with netlify dev or deploy them first.`);
      }
      throw new Error(`Function ${path} returned an unreadable response.`);
    }
  }

  if (!response.ok) {
    throw new Error(payload.error || `Function ${path} failed.`);
  }

  return payload;
}

export async function listUserAccess(filters: UserAccessFilters = {}) {
  let query = supabase
    .from("profiles")
    .select(
      "id, email, full_name, employee_code, department_id, role_code, job_title, is_active, created_at, departments(id, code, name)"
    )
    .order("full_name", { ascending: true });

  if (filters.roleCode && filters.roleCode !== "all") {
    query = query.eq("role_code", filters.roleCode);
  }

  if (filters.active === "active") {
    query = query.eq("is_active", true);
  } else if (filters.active === "inactive") {
    query = query.eq("is_active", false);
  }

  if (filters.search?.trim()) {
    const safe = filters.search.trim().replace(/,/g, " ");
    query = query.or(`full_name.ilike.%${safe}%,email.ilike.%${safe}%,employee_code.ilike.%${safe}%`);
  }

  const { data, error } = await query;
  if (error) throw error;

  return ((data ?? []) as unknown as ProfileRow[]).map(mapUser);
}

export async function listUserRoleOptions() {
  const { data, error } = await supabase
    .from("app_roles")
    .select("code, name, description, is_active")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) throw error;
  return ((data ?? []) as Array<{ code: string; name: string; description: string | null; is_active: boolean }>).map(
    (item) => ({
      code: item.code,
      name: item.name,
      description: item.description,
      isActive: item.is_active,
    })
  );
}

export async function listUserDepartmentOptions() {
  const { data, error } = await supabase
    .from("departments")
    .select("id, code, name")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []) as UserDepartmentOption[];
}

export async function listRolePermissionMatrix() {
  const [rolesResult, permissionsResult] = await Promise.all([
    supabase.from("app_roles").select("code, name, description, is_active").order("name", { ascending: true }),
    supabase.from("role_permissions").select("role_code, permission_code"),
  ]);

  if (rolesResult.error) throw rolesResult.error;

  const permissionRows = permissionsResult.error ? null : ((permissionsResult.data ?? []) as RolePermissionRow[]);
  const permissionsByRole = (permissionRows ?? []).reduce<Record<string, string[]>>((acc, item) => {
    const current = acc[item.role_code] ?? [];
    current.push(item.permission_code);
    acc[item.role_code] = current;
    return acc;
  }, {});

  return ((rolesResult.data ?? []) as Array<{ code: string; name: string; description: string | null; is_active: boolean }>).map(
    (role) => ({
      roleCode: role.code,
      roleName: role.name,
      roleDescription: role.description,
      isActive: role.is_active,
      permissions: permissionRows === null
        ? getDefaultPermissionsForRole(role.code)
        : [...new Set(permissionsByRole[role.code] ?? [])].sort(),
    })
  ) as RolePermissionAssignment[];
}

export async function saveRolePermissions(roleCode: string, permissions: string[]) {
  const normalizedPermissions = [...new Set(permissions)].sort();

  const { error } = await supabase.rpc("set_role_permissions", {
    p_role_code: roleCode,
    p_permission_codes: normalizedPermissions,
  });

  if (error) {
    throw new Error(
      error.message.includes("set_role_permissions")
        ? "Role-permission save RPC is missing. Run the latest SQL migration first."
        : error.message
    );
  }

  return normalizedPermissions;
}

export async function updateUserAccess(userId: string, payload: UpdateUserAccessPayload) {
  const { data, error } = await supabase
    .from("profiles")
    .update({
      full_name: payload.fullName,
      employee_code: payload.employeeCode || null,
      department_id: payload.departmentId || null,
      role_code: payload.roleCode,
      job_title: payload.jobTitle || null,
      is_active: payload.isActive,
    })
    .eq("id", userId)
    .select(
      "id, email, full_name, employee_code, department_id, role_code, job_title, is_active, created_at, departments(id, code, name)"
    )
    .single();

  if (error) throw error;
  return mapUser(data as unknown as ProfileRow);
}

export async function inviteUser(payload: InviteUserPayload) {
  return callAdminFunction<{ ok: true; message: string; userId: string }>("admin-invite-user", payload);
}

export async function resetUserPassword(userId: string) {
  return callAdminFunction<{ ok: true; message: string; temporaryPassword: string }>("admin-reset-password", { userId });
}

export async function setUserPassword(userId: string, password: string) {
  return callAdminFunction<{ ok: true; message: string }>("admin-set-password", { userId, password });
}

export async function deleteUserAccess(userId: string) {
  return callAdminFunction<{ ok: true; message: string }>("admin-delete-user", { userId });
}
