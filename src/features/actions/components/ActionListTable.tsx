import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { BidiBlock, BidiText } from "@/components/ui/bidi";
import { Button } from "@/components/ui/button";
import { PriorityInfoTooltip } from "@/components/ui/priority-info-tooltip";
import { SortableHeader } from "@/components/ui/sortable-header";
import type { SortConfig } from "@/lib/sorting";
import { getEffectiveDueDate, getIsOverdue, type ActionListItem } from "@/features/actions/api/actions.api";
import { getPriorityBadgeLabel } from "@/lib/priority";

export type ActionTableSortKey = "action" | "responsible" | "priority" | "status" | "progress" | "due";

type ActionListTableProps = {
  items: ActionListItem[];
  canManage: boolean;
  sortConfig: SortConfig<ActionTableSortKey>;
  onSort: (key: ActionTableSortKey) => void;
  onEdit: (item: ActionListItem) => void;
  onDelete: (item: ActionListItem) => void;
};

function badgeToneFromApi(value: string): "slate" | "red" | "amber" | "green" | "blue" {
  if (value === "red") return "red";
  if (value === "amber") return "amber";
  if (value === "green") return "green";
  if (value === "blue") return "blue";
  return "slate";
}

export function ActionListTable({ items, canManage, sortConfig, onSort, onEdit, onDelete }: ActionListTableProps) {
  if (!items.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
        No actions match the current filters.
      </div>
    );
  }

  return (
    <>
      <div className="hidden overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm xl:block">
        <div className="max-h-[calc(100vh-225px)] min-h-[600px] overflow-auto">
          <table className="w-full min-w-[1220px] text-left text-sm">
            <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50/95 text-slate-600 backdrop-blur">
              <tr>
                <SortableHeader sortKey="action" sortConfig={sortConfig} onSort={onSort} className="w-[42%] px-3 py-3">Action</SortableHeader>
                <SortableHeader sortKey="responsible" sortConfig={sortConfig} onSort={onSort} className="w-[17%] px-3 py-3">Responsible</SortableHeader>
                <SortableHeader sortKey="priority" sortConfig={sortConfig} onSort={onSort} className="w-[9%] px-3 py-3">
                  <span className="inline-flex items-center gap-2">Priority <PriorityInfoTooltip /></span>
                </SortableHeader>
                <SortableHeader sortKey="status" sortConfig={sortConfig} onSort={onSort} className="w-[11%] px-3 py-3">Status</SortableHeader>
                <SortableHeader sortKey="progress" sortConfig={sortConfig} onSort={onSort} className="w-[8%] px-3 py-3">Progress</SortableHeader>
                <SortableHeader sortKey="due" sortConfig={sortConfig} onSort={onSort} className="w-[9%] px-3 py-3">Due</SortableHeader>
                <th className="w-[4%] px-3 py-3 text-right font-bold">Open</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => {
                const overdue = getIsOverdue(item);
                return (
                  <tr key={item.id} className="align-top transition hover:bg-slate-50/80">
                    <td className="px-3 py-3">
                      <div className={`rounded-2xl border bg-white p-3 shadow-sm ${overdue ? "border-red-200" : "border-slate-200"}`}>
                        <div className="flex flex-wrap items-center gap-2">
                          <Link to={`/actions/${item.id}`} dir="ltr" className="bidi-code-token font-black text-slate-950 hover:underline">
                            {item.actionNo}
                          </Link>
                          <Badge tone="slate" dir="ltr" className="bidi-code-token">{item.sourceNo}</Badge>
                          <Badge tone="blue" dir="ltr" className="bidi-code-token">{item.recommendationNo}</Badge>
                          {overdue ? <Badge tone="red">Overdue</Badge> : null}
                        </div>
                        <BidiBlock className="mt-2 font-semibold leading-6 text-slate-900">{item.title}</BidiBlock>
                        {item.description ? (
                          <BidiBlock className="mt-2 line-clamp-2 max-w-3xl text-xs leading-5 text-slate-500">{item.description}</BidiBlock>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-slate-700">
                      <BidiBlock className="rounded-2xl bg-slate-50 px-3 py-2 font-semibold leading-5 text-slate-800">
                        {item.responsibleUserName || "Unassigned"}
                      </BidiBlock>
                    </td>
                    <td className="px-3 py-3">
                      <Badge tone={badgeToneFromApi(item.priorityTone)}>{getPriorityBadgeLabel(item.priorityCode, item.priorityName)}</Badge>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-col items-start gap-2">
                        <Badge tone={badgeToneFromApi(item.statusTone)}>{item.statusName}</Badge>
                        {overdue ? <Badge tone="red">Past due</Badge> : null}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-slate-600">
                      <div className="mb-2 h-2.5 w-24 rounded-full bg-slate-100">
                        <div
                          className="h-2.5 rounded-full bg-slate-900"
                          style={{ width: `${Math.max(0, Math.min(100, item.progressPercent))}%` }}
                        />
                      </div>
                      <span className="font-bold text-slate-800">{item.progressPercent}%</span>
                    </td>
                    <td className="px-3 py-3 text-slate-700">
                      <div className={overdue ? "font-black text-red-700" : "font-semibold text-slate-800"}>{getEffectiveDueDate(item)}</div>
                      {item.latestExtensionUntil && item.latestExtensionUntil !== item.dueDate ? (
                        <div className="mt-1 text-xs leading-5 text-slate-500">Extended from {item.dueDate}</div>
                      ) : null}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-col items-end gap-2">
                        <Link to={`/actions/${item.id}`}>
                          <Button variant="outline" className="h-9 rounded-xl px-3 text-xs">Details</Button>
                        </Link>
                        {canManage ? (
                          <>
                            <Button variant="ghost" className="h-9 rounded-xl px-3 text-xs" onClick={() => onEdit(item)}>Edit</Button>
                            <Button variant="ghost" className="h-9 rounded-xl px-3 text-xs text-red-600 hover:bg-red-50" onClick={() => onDelete(item)}>Delete</Button>
                          </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-3 xl:hidden">
        {items.map((item) => {
          const overdue = getIsOverdue(item);
          return (
            <div key={item.id} className={`rounded-3xl border bg-white p-4 shadow-sm ${overdue ? "border-red-200" : "border-slate-200"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link to={`/actions/${item.id}`} dir="ltr" className="bidi-code-token text-sm font-black text-slate-950 hover:underline break-all">{item.actionNo}</Link>
                    <Badge tone="slate" dir="ltr" className="bidi-code-token">{item.sourceNo}</Badge>
                  </div>
                  <BidiBlock className="mt-2 text-sm font-bold leading-6 text-slate-900">{item.title}</BidiBlock>
                  <div dir="ltr" className="bidi-code-token mt-1 text-xs text-slate-500">{item.recommendationNo}</div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <Badge tone={badgeToneFromApi(item.statusTone)}>{item.statusName}</Badge>
                  {overdue ? <Badge tone="red">Overdue</Badge> : null}
                </div>
              </div>

              {item.description ? <BidiBlock className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{item.description}</BidiBlock> : null}

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <MiniInfo label="Responsible" value={item.responsibleUserName || "Unassigned"} />
                <MiniInfo label="Due" value={getEffectiveDueDate(item)} />
                <MiniInfo label="Priority" value={getPriorityBadgeLabel(item.priorityCode, item.priorityName)} />
                <MiniInfo label="Progress" value={`${item.progressPercent}%`} />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Link to={`/actions/${item.id}`}><Button variant="outline" className="h-9 rounded-xl px-3 text-xs">Details</Button></Link>
                {canManage ? (
                  <>
                    <Button variant="ghost" className="h-9 rounded-xl px-3 text-xs" onClick={() => onEdit(item)}>Edit</Button>
                    <Button variant="ghost" className="h-9 rounded-xl px-3 text-xs text-red-600 hover:bg-red-50" onClick={() => onDelete(item)}>Delete</Button>
                  </>
                ) : null}
              </div>
            </div>
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
      <BidiText className="mt-1 block break-words text-sm font-semibold text-slate-800">{value}</BidiText>
    </div>
  );
}
