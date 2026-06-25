import { cn } from "@/lib/utils";

type SmartRobotIconProps = {
  className?: string;
  bubbleClassName?: string;
  eyeClassName?: string;
};

export function SmartRobotIcon({
  className,
  bubbleClassName,
  eyeClassName
}: SmartRobotIconProps) {
  return (
    <span
      className={cn(
        "relative inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/30 bg-white/18 shadow-[0_10px_26px_rgba(15,23,42,0.18)] backdrop-blur-sm",
        className
      )}
      aria-hidden="true"
    >
      <span
        className={cn(
          "absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.28),transparent_58%)]",
          bubbleClassName
        )}
      />
      <svg viewBox="0 0 64 64" className="relative h-7 w-7" fill="none">
        <rect x="15" y="18" width="34" height="28" rx="10" className="fill-slate-950/90" />
        <rect x="19" y="22" width="26" height="20" rx="8" className="fill-white" />
        <circle cx="27" cy="31" r="3.6" className={cn("fill-sky-500", eyeClassName)} />
        <circle cx="37" cy="31" r="3.6" className={cn("fill-emerald-500", eyeClassName)} />
        <path d="M26 38c1.8 1.8 4 2.7 6 2.7s4.2-.9 6-2.7" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" className="text-slate-700" />
        <path d="M32 11v7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-slate-900" />
        <circle cx="32" cy="9" r="3.2" className="fill-amber-400" />
        <path d="M15 28h-3.5M52.5 28H49" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" className="text-slate-900" />
        <path d="M21 49.5h22" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-slate-900" />
      </svg>
    </span>
  );
}
