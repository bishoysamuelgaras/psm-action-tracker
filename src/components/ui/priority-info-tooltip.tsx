import { cn } from "@/lib/utils";

type PriorityInfoTooltipProps = {
  className?: string;
  imageClassName?: string;
};

export function PriorityInfoTooltip({ className, imageClassName }: PriorityInfoTooltipProps) {
  return (
    <span className={cn("group relative inline-flex", className)}>
      <button
        type="button"
        tabIndex={0}
        aria-label="Show priority guide"
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 bg-white text-[11px] font-bold text-slate-500 transition hover:border-slate-400 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300"
      >
        i
      </button>
      <span className="pointer-events-none absolute left-full top-1/2 z-30 ml-3 hidden -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl group-hover:block group-focus-within:block">
        <img
          src="/p.png"
          alt="Priority rating guide"
          className={cn("w-[420px] max-w-[88vw] rounded-xl border border-slate-200", imageClassName)}
        />
      </span>
    </span>
  );
}
