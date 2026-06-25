import { useMemo } from "react";
import { useLocation } from "react-router-dom";

import { APP_NAME, ROLE_BADGE_TONES, ROLE_LABELS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { BidiText } from "@/components/ui/bidi";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/hooks/useAuth";

function resolvePageTitle(pathname: string) {
  if (pathname.startsWith("/actions/")) return "Action details";

  const routeTitles: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/sources": "Sources",
    "/recommendations": "Recommendations",
    "/actions": "Actions",
    "/reports": "Reports",
    "/logs": "Logs",
    "/settings": "Users & Access",
    "/master-data": "Master data"
  };

  return routeTitles[pathname] ?? APP_NAME;
}

export function AppHeader() {
  const location = useLocation();
  const { profile, user, signOut } = useAuth();

  const pageTitle = useMemo(() => resolvePageTitle(location.pathname), [location.pathname]);

  return (
    <header className="app-shell-header no-print sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1360px] flex-wrap items-center justify-between gap-3 px-3 py-3 sm:px-5 lg:px-8">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">ANRPC • PSM</p>
          <h2 className="truncate text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">{pageTitle}</h2>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden min-w-[240px] rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-600 md:block">
            <BidiText className="block truncate font-semibold text-slate-900">{profile?.fullName || user?.email || "No active user"}</BidiText>
            <div className="mt-1 flex items-center gap-2 overflow-hidden">
              {profile ? <Badge tone={ROLE_BADGE_TONES[profile.role]}>{ROLE_LABELS[profile.role]}</Badge> : null}
              <BidiText className="truncate text-xs text-slate-500">{user?.email ?? ""}</BidiText>
            </div>
          </div>

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white p-2 shadow-sm sm:h-12 sm:w-12">
            <img src="/logo.png" alt="ANRPC logo" className="h-full w-full object-contain" />
          </div>

          <Button
            type="button"
            variant="outline"
            className="h-10 px-3 sm:h-11 sm:px-4"
            onClick={() => {
              void signOut();
            }}
          >
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}
