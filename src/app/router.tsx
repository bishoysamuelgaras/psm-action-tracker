import { createBrowserRouter, Navigate } from "react-router-dom";

import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/features/auth/components/ProtectedRoute";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { UnauthorizedPage } from "@/features/auth/pages/UnauthorizedPage";
import { ActionDetailsPage } from "@/features/actions/pages/ActionDetailsPage";
import { ActionsPage } from "@/features/actions/pages/ActionsPage";
import { DashboardPage } from "@/features/dashboard/pages/DashboardPage";
import { RecommendationsPage } from "@/features/recommendations/pages/RecommendationsPage";
import { ReportsPage } from "@/features/reports/pages/ReportsPage";
import { LogsPage } from "@/features/logs/pages/LogsPage";
import { SettingsPage } from "@/features/settings/pages/SettingsPage";
import { SourcesPage } from "@/features/sources/pages/SourcesPage";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/unauthorized",
    element: <UnauthorizedPage />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: "dashboard",
        element: <DashboardPage />,
      },
      {
        path: "sources",
        element: <SourcesPage />,
      },
      {
        path: "recommendations",
        element: <RecommendationsPage />,
      },
      {
        path: "actions",
        element: <ActionsPage />,
      },
      {
        path: "actions/:actionId",
        element: <ActionDetailsPage />,
      },
      {
        path: "reports",
        element: (
          <ProtectedRoute allowedPermissions={["reports.view"]}>
            <ReportsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "logs",
        element: (
          <ProtectedRoute allowedPermissions={["logs.view"]}>
            <LogsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "settings",
        element: (
          <ProtectedRoute allowedPermissions={["settings.users.manage", "settings.roles.manage"]}>
            <SettingsPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/dashboard" replace />,
  },
]);
