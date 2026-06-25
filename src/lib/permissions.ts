import type { AppRole } from "@/types/auth";

export const APP_PERMISSION_OPTIONS = [
  {
    code: "dashboard.view",
    label: "Dashboard access",
    description: "Allow the role to open the dashboard and see overview widgets."
  },
  {
    code: "sources.manage",
    label: "Manage sources",
    description: "Create, edit, and delete source records."
  },
  {
    code: "recommendations.manage",
    label: "Manage recommendations",
    description: "Create, edit, and delete recommendations."
  },
  {
    code: "actions.manage",
    label: "Manage actions",
    description: "Create, edit, and delete tracked actions."
  },
  {
    code: "actions.assigned_update",
    label: "Update assigned actions",
    description: "Post updates and upload evidence on assigned actions."
  },
  {
    code: "actions.extensions.approve",
    label: "Manage extension requests",
    description: "Approve or reject pending action extension requests."
  },
  {
    code: "actions.verify",
    label: "Verify completed actions",
    description: "Review completed actions and mark them as verified."
  },
  {
    code: "reports.view",
    label: "View reports",
    description: "Open the reports page and print or export reports."
  },
  {
    code: "logs.view",
    label: "View logs",
    description: "Open the logs page and review the application audit trail."
  },
  {
    code: "settings.users.manage",
    label: "Manage users",
    description: "Edit user profiles, activate or deactivate users, and manage invites."
  },
  {
    code: "settings.roles.manage",
    label: "Manage role permissions",
    description: "Change the permission matrix assigned to each application role."
  }
] as const;

export type AppPermission = (typeof APP_PERMISSION_OPTIONS)[number]["code"];

export const DEFAULT_ROLE_PERMISSIONS: Record<AppRole, AppPermission[]> = {
  admin: [
    "dashboard.view",
    "sources.manage",
    "recommendations.manage",
    "actions.manage",
    "actions.assigned_update",
    "actions.extensions.approve",
    "actions.verify",
    "reports.view",
    "logs.view",
    "settings.users.manage",
    "settings.roles.manage"
  ],
  psm_manager: [
    "dashboard.view",
    "sources.manage",
    "recommendations.manage",
    "actions.manage",
    "actions.assigned_update",
    "actions.extensions.approve",
    "actions.verify",
    "reports.view",
    "logs.view",
    "settings.users.manage",
    "settings.roles.manage"
  ],
  action_owner: [
    "dashboard.view",
    "actions.assigned_update",
    "reports.view"
  ],
  viewer: ["dashboard.view", "reports.view"]
};

export function getDefaultPermissionsForRole(roleCode: string | null | undefined) {
  const normalizedRole =
    roleCode === "admin" || roleCode === "psm_manager" || roleCode === "action_owner"
      ? roleCode
      : "viewer";

  return [...DEFAULT_ROLE_PERMISSIONS[normalizedRole]];
}

export function hasPermissionInRole(
  _roleCode: string | null | undefined,
  permissions: readonly string[],
  expected: string | string[]
) {
  const granted = new Set(permissions);
  const normalizedExpected = Array.isArray(expected) ? expected : [expected];
  return normalizedExpected.some((permission) => granted.has(permission));
}
