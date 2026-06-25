import type { PropsWithChildren } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { SUPABASE_IS_CONFIGURED } from "@/lib/supabase";
import type { AppRole } from "@/types/auth";

type ProtectedRouteProps = PropsWithChildren<{
  allowedRoles?: AppRole[];
  allowedPermissions?: string[];
}>;

export function ProtectedRoute({ children, allowedRoles, allowedPermissions }: ProtectedRouteProps) {
  const { user, profile, loading, authError, hasPermission, hasRole, signOut } = useAuth();
  const location = useLocation();

  if (!SUPABASE_IS_CONFIGURED) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6"><div className="max-w-xl rounded-3xl border border-amber-200 bg-white p-8 shadow-sm"><p className="mb-3 text-sm font-semibold text-amber-700">Supabase is not configured yet</p><h1 className="mb-3 text-2xl font-bold text-slate-900">Add your environment variables first</h1><p className="text-sm leading-7 text-slate-600">Copy <code>.env.example</code> to <code>.env</code>, then set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>.</p></div></div>;
  }

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-slate-100"><div className="rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm font-medium text-slate-600 shadow-sm">Loading workspace...</div></div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  if (!profile || authError) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6"><div className="max-w-xl rounded-3xl border border-red-200 bg-white p-8 shadow-sm"><p className="mb-2 text-sm font-semibold text-red-600">Profile loading issue</p><h1 className="mb-3 text-2xl font-bold text-slate-900">Your account is not ready for the workspace</h1><p className="mb-6 text-sm leading-7 text-slate-600">{authError || "Make sure your account exists in public.profiles with a valid role."}</p><div className="flex flex-wrap gap-3"><Button type="button" variant="outline" onClick={() => window.location.reload()}>Reload</Button><Button type="button" onClick={() => { void signOut(); }}>Sign out</Button></div></div></div>;
  }

  if (!profile.isActive) return <Navigate to="/unauthorized" replace state={{ from: location.pathname }} />;
  if (allowedPermissions?.length && !hasPermission(allowedPermissions)) return <Navigate to="/unauthorized" replace state={{ from: location.pathname }} />;
  if (allowedRoles && !hasRole(allowedRoles)) return <Navigate to="/unauthorized" replace state={{ from: location.pathname }} />;
  return <>{children}</>;
}
