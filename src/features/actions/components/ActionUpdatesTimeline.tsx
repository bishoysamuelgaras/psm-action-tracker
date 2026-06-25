import { Badge } from "@/components/ui/badge";
import { BidiBlock, BidiText } from "@/components/ui/bidi";
import type { ActionHistoryItem, ActionUpdateItem } from "@/features/actions/api/actions.api";

export function ActionUpdatesTimeline({ items }: { items: ActionUpdateItem[] }) {
  if (!items.length) {
    return <div className="text-sm text-slate-500">No progress updates yet.</div>;
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-sm font-semibold text-slate-900">{new Date(item.updateDate).toLocaleString()}</div>
            {item.statusCode ? <Badge tone="blue">{item.statusName}</Badge> : null}
            {item.progressPercent !== null ? <Badge tone="slate">{item.progressPercent}%</Badge> : null}
          </div>
          <BidiBlock className="mt-3 text-sm leading-7 text-slate-700">{item.progressNote}</BidiBlock>
          <div className="mt-3 text-xs text-slate-500">
            By <BidiText>{item.updatedByName}</BidiText>
            {item.nextFollowUpDate ? ` • Next follow-up: ${item.nextFollowUpDate}` : ""}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ActionHistoryList({ items }: { items: ActionHistoryItem[] }) {
  if (!items.length) {
    return <div className="text-sm text-slate-500">No history entries yet.</div>;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-sm font-semibold text-slate-900">{item.fieldName}</div>
          <div className="mt-2 text-sm text-slate-600">
            <span className="font-medium">Old:</span> <BidiText>{String(item.oldValue ?? "—")}</BidiText>
          </div>
          <div className="mt-1 text-sm text-slate-600">
            <span className="font-medium">New:</span> <BidiText>{String(item.newValue ?? "—")}</BidiText>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {new Date(item.changedAt).toLocaleString()} • <BidiText>{item.changedByName}</BidiText> • {item.changeSource}
          </div>
        </div>
      ))}
    </div>
  );
}
