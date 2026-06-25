import * as React from "react";

import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, dir, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      dir={dir ?? "auto"}
      className={cn(
        "min-h-[120px] w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-start text-sm font-medium text-slate-950 outline-none transition placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 focus:border-slate-400 focus:bg-white",
        className
      )}
      {...props}
    />
  );
});

Textarea.displayName = "Textarea";
