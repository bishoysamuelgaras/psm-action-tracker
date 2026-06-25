import type { ReactNode } from "react";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { ActionFilters, ActionLookups } from "@/features/actions/api/actions.api";

type ActionFiltersProps = {
  filters: ActionFilters;
  lookups: ActionLookups | undefined;
  onChange: (next: ActionFilters) => void;
  onReset: () => void;
};

function setResponsibleFilter(filters: ActionFilters, value: string): ActionFilters {
  if (!value) {
    return { ...filters, responsibleUserId: "", responsibleManualName: "", responsibleDepartmentId: "" };
  }

  const [type, rawValue] = value.split(":", 2);
  if (type === "department") {
    return { ...filters, responsibleUserId: "", responsibleManualName: "", responsibleDepartmentId: rawValue ?? "" };
  }
  if (type === "manual") {
    return { ...filters, responsibleUserId: "", responsibleManualName: rawValue ?? "", responsibleDepartmentId: "" };
  }

  return { ...filters, responsibleUserId: rawValue ?? "", responsibleManualName: "", responsibleDepartmentId: "" };
}

function getResponsibleFilterValue(filters: ActionFilters) {
  if (filters.responsibleUserId) return `user:${filters.responsibleUserId}`;
  if (filters.responsibleDepartmentId) return `department:${filters.responsibleDepartmentId}`;
  if (filters.responsibleManualName) return `manual:${filters.responsibleManualName}`;
  return "";
}

function FilterBlock({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block min-w-0 space-y-1">
      <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">{label}</span>
      {children}
    </label>
  );
}

export function ActionFilters({ filters, lookups, onChange, onReset }: ActionFiltersProps) {
  const visibleRecommendations = (lookups?.recommendations ?? []).filter(
    (item) => !filters.sourceId || item.sourceId === filters.sourceId
  );
  const responsibleValue = getResponsibleFilterValue(filters);
  const activeFiltersCount = [
    filters.search,
    filters.statusCode,
    filters.priorityCode,
    filters.responsibleUserId || filters.responsibleManualName || filters.responsibleDepartmentId,
    filters.dashboardFilter,
    filters.sourceId,
    filters.recommendationId,
    filters.overdueOnly ? "overdue" : ""
  ].filter(Boolean).length;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-2.5 py-2 shadow-sm sm:px-3">
      <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="text-sm font-black text-slate-950">Smart filters</div>
          <span className="hidden text-xs text-slate-500 lg:inline">Search, parent path, responsible, status, and priority.</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
            {activeFiltersCount ? `${activeFiltersCount} active` : "No filters"}
          </span>
          <button
            type="button"
            onClick={onReset}
            className="h-8 rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-[minmax(240px,1.35fr)_repeat(3,minmax(145px,0.8fr))]">
        <FilterBlock label="Search">
          <Input
            value={filters.search ?? ""}
            onChange={(event) => onChange({ ...filters, search: event.target.value })}
            placeholder="Search action no., source, title, people..."
            className="h-9 rounded-xl bg-slate-50 text-sm focus:bg-white"
          />
        </FilterBlock>

        <FilterBlock label="Status">
          <Select
            value={filters.statusCode ?? ""}
            onChange={(event) => onChange({ ...filters, statusCode: event.target.value })}
            className="h-9 rounded-xl text-sm"
          >
            <option value="">All statuses</option>
            {(lookups?.statuses ?? []).map((status) => (
              <option key={status.code} value={status.code}>
                {status.name}
              </option>
            ))}
          </Select>
        </FilterBlock>

        <FilterBlock label="Priority">
          <Select
            value={filters.priorityCode ?? ""}
            onChange={(event) => onChange({ ...filters, priorityCode: event.target.value })}
            className="h-9 rounded-xl text-sm"
          >
            <option value="">All priorities</option>
            {(lookups?.priorities ?? []).map((priority) => (
              <option key={priority.code} value={priority.code}>
                {priority.name}
              </option>
            ))}
          </Select>
        </FilterBlock>

        <FilterBlock label="Responsible">
          <Select
            value={responsibleValue}
            onChange={(event) => onChange(setResponsibleFilter(filters, event.target.value))}
            className="h-9 rounded-xl text-sm"
          >
            <option value="">All responsible</option>
            {(lookups?.users ?? []).length ? (
              <optgroup label="People">
                {(lookups?.users ?? []).map((user) => (
                  <option key={user.id} value={`user:${user.id}`}>
                    {user.fullName}
                  </option>
                ))}
              </optgroup>
            ) : null}
            {(lookups?.departments ?? []).length ? (
              <optgroup label="Departments">
                {(lookups?.departments ?? []).map((department) => (
                  <option key={department.id} value={`department:${department.id}`}>
                    {department.label}
                  </option>
                ))}
              </optgroup>
            ) : null}
          </Select>
        </FilterBlock>
      </div>

      <div className="mt-2 grid gap-2 md:grid-cols-2 xl:grid-cols-[minmax(190px,0.9fr)_minmax(260px,1.25fr)_auto]">
        <FilterBlock label="Source">
          <Select
            value={filters.sourceId ?? ""}
            onChange={(event) => onChange({ ...filters, sourceId: event.target.value, recommendationId: "" })}
            className="h-9 rounded-xl text-sm"
          >
            <option value="">All sources</option>
            {(lookups?.sources ?? []).map((source) => (
              <option key={source.id} value={source.id}>
                {source.label}
              </option>
            ))}
          </Select>
        </FilterBlock>

        <FilterBlock label="Recommendation">
          <Select
            value={filters.recommendationId ?? ""}
            onChange={(event) => onChange({ ...filters, recommendationId: event.target.value })}
            className="h-9 rounded-xl text-sm"
          >
            <option value="">All recommendations</option>
            {visibleRecommendations.map((recommendation) => (
              <option key={recommendation.id} value={recommendation.id}>
                {recommendation.label}
              </option>
            ))}
          </Select>
        </FilterBlock>

        <div className="flex items-end">
          <label className="flex h-9 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-3 text-xs font-bold text-slate-700 transition hover:bg-white xl:min-w-[140px]">
            <input
              type="checkbox"
              checked={Boolean(filters.overdueOnly)}
              onChange={(event) => onChange({ ...filters, overdueOnly: event.target.checked })}
            />
            Overdue only
          </label>
        </div>
      </div>
    </div>
  );
}
