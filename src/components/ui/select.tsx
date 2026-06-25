import * as React from "react";

import { cn } from "@/lib/utils";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, dir, ...props }, ref) => {
  return (
    <div className="relative min-w-0">
      <select
        ref={ref}
        dir={dir ?? "auto"}
        className={cn(
          "block h-11 w-full min-w-0 appearance-none overflow-hidden rounded-2xl border border-slate-300 bg-white px-4 pr-11 text-start text-sm font-medium leading-6 text-slate-950 text-ellipsis whitespace-nowrap outline-none transition disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 focus:border-slate-400 focus:bg-white [&>option]:bg-white [&>option]:text-slate-950",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">⌄</span>
    </div>
  );
});

Select.displayName = "Select";
