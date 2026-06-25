import { NavLink } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { BidiText } from "@/components/ui/bidi";
import { APP_NAV_ITEMS } from "@/components/layout/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { APP_NAME, ROLE_BADGE_TONES, ROLE_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

function navInitial(label: string) {
  return label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || label.slice(0, 1).toUpperCase();
}

export function AppSidebar() {
  const { profile, user, hasPermission, hasRole } = useAuth();

  const visibleItems = APP_NAV_ITEMS.filter((item) => {
    if (item.allowedPermissions?.length) return hasPermission(item.allowedPermissions);
    if (item.allowedRoles?.length) return hasRole(item.allowedRoles);
    return true;
  });

  return (
    <aside className="group/sidebar sticky top-0 z-40 h-screen w-[84px] overflow-hidden border-r border-slate-200 bg-slate-950 text-white shadow-2xl shadow-slate-950/10 transition-[width] duration-300 ease-out hover:w-[252px]">
      <div className="flex h-full flex-col px-3 py-5 group-hover/sidebar:px-4">
        <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-3 transition-all duration-300 group-hover/sidebar:p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/10 p-2">
              <img src="/logo.png" alt="ANRPC logo" className="h-full w-full object-contain" />
            </div>
            <div className="min-w-0 flex-1 overflow-hidden opacity-0 transition-opacity duration-200 group-hover/sidebar:opacity-100">
              <p className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.22em] text-white/55">ANRPC Refinery</p>
              <h1 className="mt-1 text-base font-bold leading-tight text-white sm:text-[1.05rem] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden">
                {APP_NAME}
              </h1>
            </div>
          </div>
          {profile ? (
            <div className="mt-4 hidden flex-wrap items-center gap-2 group-hover/sidebar:flex">
              <Badge tone={ROLE_BADGE_TONES[profile.role]}>{ROLE_LABELS[profile.role]}</Badge>
            </div>
          ) : null}
        </div>

        <nav className="mt-5 space-y-1.5">
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              title={item.label}
              className={({ isActive }) =>
                cn(
                  "flex min-h-[52px] items-center gap-3 rounded-2xl border px-3 py-2.5 transition-colors",
                  isActive
                    ? "border-sky-300/40 bg-sky-400/15 shadow-sm ring-1 ring-sky-300/20"
                    : "border-transparent text-slate-300 hover:bg-white/8 hover:text-white"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-xs font-black tracking-tight",
                      isActive
                        ? "border-sky-300/40 bg-sky-400/20 text-white"
                        : "border-white/10 bg-white/[0.07] text-slate-200"
                    )}
                  >
                    {navInitial(item.label)}
                  </span>
                  <span className="min-w-0 overflow-hidden opacity-0 transition-opacity duration-200 group-hover/sidebar:opacity-100">
                    <span className={cn("block whitespace-nowrap text-sm font-semibold", isActive ? "text-white" : "text-white")}>{item.label}</span>
                    {item.description ? (
                      <span className={cn("mt-1 block whitespace-nowrap text-xs leading-5", isActive ? "text-sky-100" : "text-slate-400")}>{item.description}</span>
                    ) : null}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {profile || user?.email ? (
          <div className="mt-auto flex items-center gap-3 rounded-3xl border border-white/10 bg-white/[0.06] p-3 text-sm text-slate-300 transition-all duration-300 group-hover/sidebar:p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-sm font-black text-white">
              {(profile?.fullName || user?.email || "U").slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 overflow-hidden opacity-0 transition-opacity duration-200 group-hover/sidebar:opacity-100">
              <BidiText className="block truncate font-semibold text-white">{profile?.fullName || user?.email}</BidiText>
              {profile?.jobTitle ? <BidiText className="mt-1 block truncate text-xs text-slate-400">{profile.jobTitle}</BidiText> : null}
              {user?.email ? <BidiText className="mt-1 block truncate text-xs text-slate-400">{user.email}</BidiText> : null}
            </div>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
