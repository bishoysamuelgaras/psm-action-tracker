import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { BidiBlock, BidiCode, BidiText } from "@/components/ui/bidi";
import { SortableHeader } from "@/components/ui/sortable-header";
import type { SourceListItem, SourceOption } from "@/features/sources/api/sources.api";
import { cn, formatDateLabel } from "@/lib/utils";
import { nextSortConfig, sortByConfig, type SortConfig } from "@/lib/sorting";

type SourceSortKey = "sourceNo" | "title" | "type" | "date" | "department" | "reference";

type SourceListTableProps = {
  rows: SourceListItem[];
  selectedId: string | null;
  sourceTypes: SourceOption[];
  departments: SourceOption[];
  onSelect: (id: string) => void;
};

function getLabel(options: SourceOption[], value: string | null) {
  if (!value) return "—";
  return options.find((item) => item.value === value)?.label ?? value;
}

export function SourceListTable({ rows, selectedId, sourceTypes, departments, onSelect }: SourceListTableProps) {
  const [sortConfig, setSortConfig] = useState<SortConfig<SourceSortKey>>({ key: "date", direction: "desc" });
  const sortedRows = useMemo(
    () =>
      sortByConfig(rows, sortConfig, (row, key) => {
        switch (key) {
          case "sourceNo":
            return row.sourceNo;
          case "title":
            return row.title;
          case "type":
            return getLabel(sourceTypes, row.sourceTypeCode);
          case "date":
            return row.sourceDate;
          case "department":
            return getLabel(departments, row.departmentId);
          case "reference":
            return row.referenceNo || "";
          default:
            return "";
        }
      }),
    [rows, sortConfig, sourceTypes, departments]
  );
  if (!rows.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm leading-7 text-slate-600">
        No sources match the current filters.
      </div>
    );
  }

  return (
    <>
      <div className="hidden overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:block">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <SortableHeader sortKey="sourceNo" sortConfig={sortConfig} onSort={(key) => setSortConfig((current) => nextSortConfig(current, key))} className="px-3 py-3">Source no.</SortableHeader>
                <SortableHeader sortKey="title" sortConfig={sortConfig} onSort={(key) => setSortConfig((current) => nextSortConfig(current, key))} className="px-3 py-3">Title</SortableHeader>
                <SortableHeader sortKey="type" sortConfig={sortConfig} onSort={(key) => setSortConfig((current) => nextSortConfig(current, key))} className="px-3 py-3">Type</SortableHeader>
                <SortableHeader sortKey="date" sortConfig={sortConfig} onSort={(key) => setSortConfig((current) => nextSortConfig(current, key))} className="px-3 py-3">Date</SortableHeader>
                <SortableHeader sortKey="department" sortConfig={sortConfig} onSort={(key) => setSortConfig((current) => nextSortConfig(current, key))} className="px-3 py-3">Department</SortableHeader>
                <SortableHeader sortKey="reference" sortConfig={sortConfig} onSort={(key) => setSortConfig((current) => nextSortConfig(current, key))} className="px-3 py-3">Reference</SortableHeader>
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((row) => {
                const isActive = row.id === selectedId;

                return (
                  <tr
                    key={row.id}
                    onClick={() => onSelect(row.id)}
                    className={cn(
                      "cursor-pointer border-b border-slate-100 transition hover:bg-slate-50",
                      isActive && "bg-blue-50/60"
                    )}
                  >
                    <td className="px-3 py-4 align-top font-semibold text-slate-900"><BidiCode>{row.sourceNo}</BidiCode></td>
                    <td className="px-3 py-4 align-top">
                      <BidiBlock className="font-semibold text-slate-900">{row.title}</BidiBlock>
                      {row.summary ? <BidiBlock className="mt-1 line-clamp-2 max-w-xl text-xs leading-6 text-slate-500">{row.summary}</BidiBlock> : null}
                    </td>
                    <td className="px-3 py-4 align-top">
                      <Badge tone="blue">{getLabel(sourceTypes, row.sourceTypeCode)}</Badge>
                    </td>
                    <td className="px-3 py-4 align-top text-slate-700">{formatDateLabel(row.sourceDate)}</td>
                    <td className="px-3 py-4 align-top text-slate-700"><BidiText>{getLabel(departments, row.departmentId)}</BidiText></td>
                    <td className="px-3 py-4 align-top text-slate-700"><BidiText>{row.referenceNo || "—"}</BidiText></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-3 lg:hidden">
        {sortedRows.map((row) => {
          const isActive = row.id === selectedId;
          return (
            <button
              key={row.id}
              type="button"
              onClick={() => onSelect(row.id)}
              className={cn(
                "w-full rounded-3xl border bg-white p-4 text-left shadow-sm transition",
                isActive ? "border-blue-300 ring-2 ring-blue-100" : "border-slate-200"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <BidiCode className="text-sm font-bold text-slate-950 break-all">{row.sourceNo}</BidiCode>
                  <BidiBlock className="mt-1 text-sm font-medium text-slate-800">{row.title}</BidiBlock>
                </div>
                <Badge tone="blue">{getLabel(sourceTypes, row.sourceTypeCode)}</Badge>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <MiniInfo label="Date" value={formatDateLabel(row.sourceDate)} />
                <MiniInfo label="Department" value={getLabel(departments, row.departmentId)} />
                <MiniInfo label="Reference" value={row.referenceNo || "—"} />
                <MiniInfo label="State" value={isActive ? "Selected" : "Tap to open"} />
              </div>

              {row.summary ? <BidiBlock className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{row.summary}</BidiBlock> : null}
            </button>
          );
        })}
      </div>
    </>
  );
}

function MiniInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5">
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</div>
      <BidiText className="mt-1 block text-sm font-medium text-slate-800 break-words">{value}</BidiText>
    </div>
  );
}
