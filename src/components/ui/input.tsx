import * as React from "react";

import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, dir, ...props }, ref) => {
  return (
    <input
      ref={ref}
      dir={dir ?? "auto"}
      className={cn(
        "h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-start text-sm font-medium text-slate-950 outline-none ring-0 transition placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 focus:border-slate-400 focus:bg-white",
        className
      )}
      {...props}
    />
  );
});

Input.displayName = "Input";
