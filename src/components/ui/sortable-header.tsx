import type { ReactNode } from "react";
import type { SortConfig } from "@/lib/sorting";

export function SortableHeader<K extends string>({
  sortKey,
  sortConfig,
  onSort,
  children,
  className = "px-3 py-2",
  align = "left"
}: {
  sortKey: K;
  sortConfig: SortConfig<K>;
  onSort: (key: K) => void;
  children: ReactNode;
  className?: string;
  align?: "left" | "right";
}) {
  const active = sortConfig.key === sortKey;
  const arrow = active ? (sortConfig.direction === "asc" ? "↑" : "↓") : "↕";

  return (
    <th className={className} aria-sort={active ? (sortConfig.direction === "asc" ? "ascending" : "descending") : "none"}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`inline-flex w-full items-center gap-1.5 rounded-xl px-1 py-1 text-xs font-black uppercase tracking-[0.12em] transition hover:bg-slate-100 hover:text-blue-700 ${
          align === "right" ? "justify-end text-right" : "justify-start text-left"
        } ${active ? "text-blue-700" : "text-slate-500"}`}
      >
        <span>{children}</span>
        <span className="text-[11px] leading-none text-slate-400">{arrow}</span>
      </button>
    </th>
  );
}
