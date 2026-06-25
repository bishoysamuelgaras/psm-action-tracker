import { NavLink } from "react-router-dom";

import { APP_NAV_ITEMS } from "@/components/layout/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { cn } from "@/lib/utils";

export function AppMobileNav() {
  const { hasPermission, hasRole } = useAuth();

  const visibleItems = APP_NAV_ITEMS.filter((item) => {
    if (item.allowedPermissions?.length) return hasPermission(item.allowedPermissions);
    if (item.allowedRoles?.length) return hasRole(item.allowedRoles);
    return true;
  });

  return (
    <div className="no-print sticky top-[73px] z-20 border-b border-slate-200 bg-white/95 backdrop-blur lg:hidden">
      <div className="overflow-x-auto px-3 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <nav className="flex w-max min-w-full gap-2">
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition",
                  isActive
                    ? "border-slate-950 bg-slate-950 text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                )
              }
            >
              {item.mobileLabel}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
