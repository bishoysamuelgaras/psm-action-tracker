import { cn } from "@/lib/utils";

export type StatTone = "slate" | "red" | "amber" | "green" | "blue";

type StatCardProps = {
  label: string;
  value: string | number;
  tone?: StatTone;
  hint?: string;
  compact?: boolean;
};

const toneStyles: Record<StatTone, { dot: string; value: string }> = {
  slate: { dot: "bg-slate-400", value: "text-slate-950" },
  red: { dot: "bg-red-500", value: "text-red-700" },
  amber: { dot: "bg-amber-500", value: "text-amber-700" },
  green: { dot: "bg-emerald-500", value: "text-emerald-700" },
  blue: { dot: "bg-blue-500", value: "text-blue-700" }
};

export function StatCard({ label, value, tone = "slate", hint, compact = false }: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm",
        compact ? "min-h-[110px]" : "min-h-[126px]"
      )}
    >
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
        <span className={cn("h-2.5 w-2.5 rounded-full", toneStyles[tone].dot)} />
        <span>{label}</span>
      </div>
      <div className={cn("mt-4 font-black tracking-tight", compact ? "text-3xl" : "text-4xl", toneStyles[tone].value)}>
        {value}
      </div>
      {hint ? <div className="mt-2 text-xs leading-5 text-slate-500">{hint}</div> : null}
    </div>
  );
}
