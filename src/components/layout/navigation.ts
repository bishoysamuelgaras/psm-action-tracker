import type { AppRole } from "@/types/auth";

export type NavItem = {
  to: string;
  label: string;
  mobileLabel: string;
  description?: string;
  allowedRoles?: AppRole[];
  allowedPermissions?: string[];
};

export const APP_NAV_ITEMS: NavItem[] = [
  {
    to: "/dashboard",
    label: "Dashboard",
    mobileLabel: "Dash",
    description: "KPIs and alerts"
  },
  {
    to: "/sources",
    label: "Sources",
    mobileLabel: "Sources",
    description: "Investigations and origins"
  },
  {
    to: "/recommendations",
    label: "Recommendations",
    mobileLabel: "Recs",
    description: "Findings and recommendations"
  },
  {
    to: "/actions",
    label: "Actions",
    mobileLabel: "Actions",
    description: "Execution and follow-up"
  },
  {
    to: "/reports",
    label: "Reports",
    mobileLabel: "Reports",
    description: "Print and export",
    allowedPermissions: ["reports.view"]
  },
  {
    to: "/logs",
    label: "Logs",
    mobileLabel: "Logs",
    description: "Audit trail and activity",
    allowedPermissions: ["logs.view"]
  },
  {
    to: "/settings",
    label: "Users & Access",
    mobileLabel: "Users",
    description: "Roles and access",
    allowedPermissions: ["settings.users.manage", "settings.roles.manage"]
  }
];
