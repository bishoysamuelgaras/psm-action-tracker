import { useMemo } from "react";

import { useAuth } from "@/features/auth/hooks/useAuth";
export function useRoleAccess() {
  const { role, hasRole, hasPermission } = useAuth();

  return useMemo(
    () => ({
      role,
      isAdmin: hasRole("admin"),
      isPsmManager: hasRole("psm_manager"),
      isActionOwner: hasRole("action_owner"),
      isViewer: hasRole("viewer"),
      canManageUsers: hasPermission("settings.users.manage"),
      canManageRoles: hasPermission("settings.roles.manage"),
      canManageMasterData: hasRole(["admin", "psm_manager"]),
      canManageSources: hasPermission("sources.manage"),
      canManageRecommendations: hasPermission("recommendations.manage"),
      canManageActions: hasPermission("actions.manage"),
      canUpdateAssignedActions: hasPermission("actions.assigned_update"),
      canApproveExtensions: hasPermission("actions.extensions.approve"),
      canVerifyActions: hasPermission("actions.verify"),
      canViewReports: hasPermission("reports.view"),
      canViewLogs: hasPermission("logs.view"),
      canViewDashboard: hasPermission("dashboard.view")
    }),
    [hasPermission, hasRole, role]
  );
}
