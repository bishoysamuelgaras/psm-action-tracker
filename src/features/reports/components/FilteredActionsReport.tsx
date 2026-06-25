import { useMemo } from "react";

import { BidiBlock, BidiCode, BidiText } from "@/components/ui/bidi";
import type { FilteredActionsReport as FilteredActionsReportData } from "@/features/reports/api/reports.api";
import { getPriorityDisplayLabel } from "@/lib/priority";
import { formatDateLabel } from "@/lib/utils";
import { sortByConfig, type SortConfig } from "@/lib/sorting";
import { OperationalSummaryVisuals } from "@/features/reports/components/OperationalSummaryVisuals";

function formatOptionalText(value: string | null | undefined) {
  return value && value.trim() ? value : "—";
}

function priorityLabel(priorityName: string | null | undefined, priorityCode: string | null | undefined) {
  return getPriorityDisplayLabel(priorityCode, priorityName);
}

function statusLabel(action: FilteredActionsReportData["actions"][number]) {
  return action.statusName || action.statusCode || "—";
}

function buildFilterChip(label: string, value: string | null | undefined) {
  return { label, value: value && value.trim() ? value : "All" };
}

function effectiveDueDate(action: FilteredActionsReportData["actions"][number]) {
  return action.latestExtensionUntil || action.dueDate;
}

function actionTitle(action: FilteredActionsReportData["actions"][number]) {
  return action.title || "—";
}

function actionDescription(action: FilteredActionsReportData["actions"][number]) {
  return action.description || "—";
}

export type FilteredActionsReportSortKey = "actionTitle" | "actionDescription" | "source" | "responsible" | "priority" | "status" | "due" | "progress";

function getReportSortValue(action: FilteredActionsReportData["actions"][number], key: FilteredActionsReportSortKey) {
  switch (key) {
    case "actionTitle":
      return `${action.actionNo} ${action.title || ""}`;
    case "actionDescription":
      return action.description || "";
    case "source":
      return `${action.sourceNo} ${action.sourceTitle || ""}`;
    case "responsible":
      return action.responsible?.fullName || "Unassigned";
    case "priority":
      return priorityLabel(action.priorityName, action.priorityCode);
    case "status":
      return statusLabel(action);
    case "due":
      return effectiveDueDate(action);
    case "progress":
      return action.progressPercent ?? 0;
    default:
      return "";
  }
}

export function FilteredActionsReport({ report, sortConfig }: { report: FilteredActionsReportData; sortConfig?: SortConfig<FilteredActionsReportSortKey> }) {
  const sortedActions = useMemo(
    () => (sortConfig ? sortByConfig(report.actions, sortConfig, getReportSortValue) : report.actions),
    [report.actions, sortConfig]
  );

  const filterChips = [
    buildFilterChip("Search", report.filterLabels.search),
    buildFilterChip("Source type", report.filterLabels.sourceTypeName),
    buildFilterChip("Source", report.filterLabels.sourceLabel),
    buildFilterChip("Responsible department", report.filterLabels.departmentName),
    buildFilterChip("Status", report.filterLabels.statusName),
    buildFilterChip("Priority", report.filterLabels.priorityName),
    { label: "Overdue", value: report.filterLabels.overdueOnly ? "Yes" : "All" }
  ];

  return (
    <article id="filtered-actions-report-printable" className="report-doc filtered-actions-report-doc text-slate-900">
      <section className="filtered-report-first-page">
        <header className="report-header report-keep-together filtered-report-header">
          <div>
            <div className="report-kicker">ANRPC • PSM • ACTION TRACKER</div>
            <h1 className="report-title">Operational Actions Report</h1>
            <p className="report-subtitle">
              Filtered action register generated from the current Operational Summary view.
            </p>
          </div>

          <div className="report-header-side">
            <div className="report-ref">{report.actions.length} actions</div>
            <div className="report-header-meta">Generated {new Date(report.generatedAt).toLocaleString()}</div>
          </div>
        </header>

        <section className="report-section report-keep-together filtered-report-filters">
          <div className="filtered-report-filter-grid">
            {filterChips.map((chip) => (
              <span key={chip.label} className="filtered-report-filter-chip">
                <strong>{chip.label}</strong>
                <BidiText>{chip.value}</BidiText>
              </span>
            ))}
          </div>
        </section>

        <section className="report-section report-keep-together filtered-report-cover-page">
          <OperationalSummaryVisuals actions={report.actions} stats={report.stats} mode="print" />
        </section>
      </section>

      <section className="report-section filtered-report-register-section">
        <div className="filtered-report-register-heading report-keep-together">
          <div>
            <div className="report-kicker">FILTERED REGISTER</div>
            <h2>Action register</h2>
          </div>
          <strong>{sortedActions.length} actions</strong>
        </div>
        {sortedActions.length ? (
          <table className="filtered-report-table">
            <thead>
              <tr>
                <th>Action title</th>
                <th>Action description</th>
                <th>Source</th>
                <th>Responsible</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Due</th>
                <th>Progress</th>
              </tr>
            </thead>
            <tbody>
              {sortedActions.map((action) => (
                <tr key={action.id}>
                  <td>
                    <BidiCode className="filtered-report-main-code">{action.actionNo}</BidiCode>
                    <BidiBlock className="filtered-report-cell-note filtered-report-action-title">
                      {actionTitle(action)}
                    </BidiBlock>
                  </td>
                  <td>
                    <BidiBlock className="filtered-report-cell-note filtered-report-description-text">
                      {actionDescription(action)}
                    </BidiBlock>
                  </td>
                  <td>
                    <BidiCode className="filtered-report-main-code">{action.sourceNo}</BidiCode>
                    <BidiBlock className="filtered-report-cell-note">{action.sourceTitle}</BidiBlock>
                  </td>
                  <td><BidiText>{formatOptionalText(action.responsible?.fullName)}</BidiText></td>
                  <td>{priorityLabel(action.priorityName, action.priorityCode)}</td>
                  <td>
                    <span className="filtered-report-pill">{statusLabel(action)}</span>
                    {action.isOverdue ? <span className="filtered-report-pill filtered-report-pill-danger">Overdue</span> : null}
                  </td>
                  <td>{formatDateLabel(effectiveDueDate(action))}</td>
                  <td className="filtered-report-progress">{action.progressPercent}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="report-empty">No actions match the current filters.</div>
        )}
      </section>
    </article>
  );
}
