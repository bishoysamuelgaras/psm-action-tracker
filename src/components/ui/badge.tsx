import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type BadgeTone = "slate" | "red" | "amber" | "green" | "blue" | "purple";

const toneClasses: Record<BadgeTone, string> = {
  slate: "bg-slate-100 text-slate-700 border-slate-200",
  red: "bg-red-50 text-red-700 border-red-200",
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  green: "bg-emerald-50 text-emerald-700 border-emerald-200",
  blue: "bg-blue-50 text-blue-700 border-blue-200",
  purple: "bg-violet-50 text-violet-700 border-violet-200"
};

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
};

export function Badge({ className, tone = "slate", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
        toneClasses[tone],
        className
      )}
      {...props}
    />
  );
}
