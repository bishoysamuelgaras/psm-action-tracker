import { cn } from "@/lib/utils";

type ImageInfoTooltipProps = {
  imageSrc: string;
  imageAlt: string;
  buttonLabel?: string;
  className?: string;
  align?: "start" | "end";
};

export function ImageInfoTooltip({
  imageSrc,
  imageAlt,
  buttonLabel = "Show reference guide",
  className,
  align = "end"
}: ImageInfoTooltipProps) {
  return (
    <span className={cn("group relative inline-flex", className)}>
      <button
        type="button"
        tabIndex={0}
        aria-label={buttonLabel}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 bg-white text-[11px] font-bold text-slate-500 transition hover:border-slate-400 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300"
      >
        i
      </button>
      <span
        className={cn(
          "pointer-events-none absolute top-full z-30 mt-2 hidden rounded-3xl border border-slate-200 bg-white p-2 shadow-2xl group-hover:block group-focus-within:block",
          "w-[min(92vw,720px)]",
          align === "end" ? "right-0" : "left-0"
        )}
      >
        <img src={imageSrc} alt={imageAlt} className="max-h-[70vh] w-full rounded-2xl object-contain" />
      </span>
    </span>
  );
}
