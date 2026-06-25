import { Link, useLocation } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { ROLE_LABELS } from "@/lib/constants";

type UnauthorizedState = {
  from?: string;
};

export function UnauthorizedPage() {
  const { profile } = useAuth();
  const location = useLocation();
  const redirectFrom = (location.state as UnauthorizedState | null)?.from;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <div className="max-w-lg rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="mb-2 text-sm font-semibold text-red-600">Access denied</p>
        <h1 className="mb-3 text-2xl font-bold text-slate-900">You are not authorized</h1>
        <p className="mb-4 text-sm leading-7 text-slate-600">
          Your account is signed in correctly, but your current role does not have access to this section.
        </p>

        <div className="mb-6 flex flex-wrap items-center gap-3">
          {profile ? <Badge tone="blue">Role: {ROLE_LABELS[profile.role]}</Badge> : null}
          {redirectFrom ? <Badge tone="slate">Requested: {redirectFrom}</Badge> : null}
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            to="/dashboard"
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Back to dashboard
          </Link>
          <Link
            to="/login"
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
