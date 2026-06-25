import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { BidiBlock, BidiCode, BidiText } from "@/components/ui/bidi";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { PriorityInfoTooltip } from "@/components/ui/priority-info-tooltip";
import { SortableHeader } from "@/components/ui/sortable-header";
import {
  getFilteredActionsReport,
  getIncidentFullReport,
  getReportsSnapshot,
  listIncidentSources,
  type ReportsFilters
} from "@/features/reports/api/reports.api";
import { FilteredActionsReport, type FilteredActionsReportSortKey } from "@/features/reports/components/FilteredActionsReport";
import { IncidentFullReport } from "@/features/reports/components/IncidentFullReport";
import { OperationalSummaryVisuals } from "@/features/reports/components/OperationalSummaryVisuals";
import { formatDateLabel } from "@/lib/utils";
import { getPriorityDisplayLabel } from "@/lib/priority";
import { getSourceDisplayNo } from "@/lib/source-display";
import { nextSortConfig, sortByConfig, type SortConfig } from "@/lib/sorting";

type ReportKey = "incident" | "summary" | "source-progress" | null;

function toCsvValue(value: unknown) {
  const text = value == null ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function downloadCsv(filename: string, rows: Array<Record<string, unknown>>) {
  if (!rows.length) return;

  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((row) => headers.map((key) => toCsvValue(row[key])).join(","))
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
}

let previousDocumentTitle: string | null = null;

function cleanPrintMode() {
  delete document.body.dataset.printMode;
  if (previousDocumentTitle) {
    document.title = previousDocumentTitle;
    previousDocumentTitle = null;
  }
}

function preparePrintMode(mode: "incident-report" | "actions-report", title: string) {
  previousDocumentTitle = document.title;
  document.title = title;
  document.body.dataset.printMode = mode;
}

export function ReportsPage() {
  const [filters, setFilters] = useState<ReportsFilters>({
    search: "",
    departmentCode: "",
    statusCode: "",
    priorityCode: "",
    sourceTypeCode: "",
    sourceId: "",
    overdueOnly: false
  });
  const [incidentSearch, setIncidentSearch] = useState("");
  const [incidentSourceTypeCode, setIncidentSourceTypeCode] = useState("");
  const [selectedIncidentId, setSelectedIncidentId] = useState("");
  const [activeReport, setActiveReport] = useState<ReportKey>(null);
  const [summarySortConfig, setSummarySortConfig] = useState<SortConfig<FilteredActionsReportSortKey>>({ key: "due", direction: "asc" });

  useEffect(() => {
    window.addEventListener("afterprint", cleanPrintMode);
    return () => {
      window.removeEventListener("afterprint", cleanPrintMode);
      cleanPrintMode();
    };
  }, []);

  const reportsQuery = useQuery({
    queryKey: ["reports-snapshot", filters],
    queryFn: () => getReportsSnapshot(filters)
  });

  const sourceOptionsQuery = useQuery({
    queryKey: ["report-source-options", filters.sourceTypeCode ?? ""],
    queryFn: () => listIncidentSources("", filters.sourceTypeCode ?? "")
  });

  const incidentsQuery = useQuery({
    queryKey: ["incident-source-options", incidentSearch, incidentSourceTypeCode],
    queryFn: () => listIncidentSources(incidentSearch, incidentSourceTypeCode)
  });

  useEffect(() => {
    const options = sourceOptionsQuery.data ?? [];
    if (!options.length) {
      setFilters((current) => (current.sourceId ? { ...current, sourceId: "" } : current));
      return;
    }

    setFilters((current) => {
      if (!current.sourceId) return current;
      const exists = options.some((item) => item.id === current.sourceId);
      return exists ? current : { ...current, sourceId: "" };
    });
  }, [sourceOptionsQuery.data]);

  useEffect(() => {
    const options = incidentsQuery.data ?? [];
    if (!options.length) {
      setSelectedIncidentId("");
      return;
    }

    const exists = options.some((item) => item.id === selectedIncidentId);
    if (!selectedIncidentId || !exists) {
      setSelectedIncidentId(options[0].id);
    }
  }, [incidentsQuery.data, selectedIncidentId]);

  const incidentReportQuery = useQuery({
    queryKey: ["incident-full-report", selectedIncidentId],
    queryFn: () => getIncidentFullReport(selectedIncidentId),
    enabled: Boolean(selectedIncidentId) && activeReport === "incident"
  });

  const filteredActionsReportQuery = useQuery({
    queryKey: ["filtered-actions-report", filters],
    queryFn: () => getFilteredActionsReport(filters),
    enabled: activeReport === "summary"
  });

  const summaryRows = reportsQuery.data?.actionSummaryRows ?? [];
  const sortedSummaryRows = useMemo(
    () =>
      sortByConfig(summaryRows, summarySortConfig, (row, key) => {
        switch (key) {
          case "actionTitle":
            return `${row.action_no} ${row.action_title || ""}`;
          case "actionDescription":
            return row.action_description || "";
          case "source":
            return `${getSourceDisplayNo(row.source_no, row.reference_no)} ${row.source_title || ""}`;
          case "responsible":
            return row.responsible_name || "Unassigned";
          case "priority":
            return getPriorityDisplayLabel(row.priority_code, row.priority_name);
          case "status":
            return row.status_name || row.status_code;
          case "due":
            return row.latest_extension_until || row.due_date;
          case "progress":
            return row.progress_percent ?? 0;
          default:
            return "";
        }
      }),
    [summaryRows, summarySortConfig]
  );
  const sourceRows = reportsQuery.data?.sourceProgressRows ?? [];
  const kpis = reportsQuery.data?.kpis;
  const filteredActionsReport = filteredActionsReportQuery.data;

  const exportRows = useMemo(
    () =>
      sortedSummaryRows.map((row) => ({
        action_no: row.action_no,
        action_title: row.action_title,
        action_description: row.action_description || "",
        source_no: getSourceDisplayNo(row.source_no, row.reference_no),
        source_title: row.source_title,
        recommendation_no: row.recommendation_no,
        department_name: row.department_name,
        responsible_name: row.responsible_name,
        priority_name: row.priority_name,
        status_name: row.status_name,
        due_date: row.latest_extension_until || row.due_date,
        progress_percent: row.progress_percent,
        is_overdue: row.is_overdue ? "yes" : "no"
      })),
    [sortedSummaryRows]
  );

  const selectedIncidentOption = (incidentsQuery.data ?? []).find(
    (item) => item.id === selectedIncidentId
  );

  const printIncidentReport = () => {
    if (!incidentReportQuery.data) return;
    preparePrintMode("incident-report", "ANRPC Source Full Report");
    window.print();
    window.setTimeout(cleanPrintMode, 250);
  };

  const printFilteredActionsReport = () => {
    if (!filteredActionsReportQuery.data) return;
    preparePrintMode("actions-report", "ANRPC Operational Actions Report");
    window.print();
    window.setTimeout(cleanPrintMode, 250);
  };

  if (reportsQuery.isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (reportsQuery.error || !reportsQuery.data) {
    return (
      <Card className="no-print">
        <CardHeader>
          <CardTitle>Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
            Failed to load reports.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="no-print">
        <CardHeader>
          <CardTitle>Report library</CardTitle>
          <CardDescription>
            Open only the report you need. Start with the incident report for printing, or use the summary reports for quick review and export.
          </CardDescription>
        </CardHeader>
      </Card>

      <section className="no-print grid gap-4 lg:grid-cols-3">
        <ReportLibraryCard
          title="Source full report"
          description="Open one source, choose its type, then print all recommendations, actions, dates, updates, attachments, and extensions."
          buttonLabel="Open"
          active={activeReport === "incident"}
          onOpen={() => setActiveReport((current) => (current === "incident" ? null : "incident"))}
        />
        <ReportLibraryCard
          title="Operational summary"
          description="Review KPIs, filter actions, and export the action summary report."
          buttonLabel="Review"
          active={activeReport === "summary"}
          onOpen={() => setActiveReport((current) => (current === "summary" ? null : "summary"))}
        />
        <ReportLibraryCard
          title="Source progress"
          description="Track closure progress and overdue exposure by source."
          buttonLabel="Track"
          active={activeReport === "source-progress"}
          onOpen={() => setActiveReport((current) => (current === "source-progress" ? null : "source-progress"))}
        />
      </section>

      {activeReport === "incident" ? (
        <Card className="incident-report-shell">
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <CardTitle>Source full report</CardTitle>
                <CardDescription>Select a source type, then choose one source to review and print.</CardDescription>
              </div>
              <div className="no-print flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={printIncidentReport}
                  disabled={!incidentReportQuery.data || incidentReportQuery.isLoading}
                >
                  Print source report
                </Button>
                <Button variant="ghost" onClick={() => setActiveReport(null)}>Close</Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="no-print grid gap-3 lg:grid-cols-[0.9fr_1.2fr_1.2fr_auto]">
              <Select
                value={incidentSourceTypeCode}
                onChange={(event) => {
                  setIncidentSourceTypeCode(event.target.value);
                  setSelectedIncidentId("");
                }}
              >
                <option value="">All source types</option>
                {reportsQuery.data.filters.sourceTypes.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.name}
                  </option>
                ))}
              </Select>

              <Input
                value={incidentSearch}
                onChange={(event) => setIncidentSearch(event.target.value)}
                placeholder="Search source no / title / reference"
              />

              <Select
                value={selectedIncidentId}
                onChange={(event) => setSelectedIncidentId(event.target.value)}
                disabled={incidentsQuery.isLoading || !(incidentsQuery.data ?? []).length}
              >
                {(incidentsQuery.data ?? []).length ? null : <option value="">No sources found</option>}
                {(incidentsQuery.data ?? []).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.sourceNo} — {item.title}
                  </option>
                ))}
              </Select>

              <Button
                variant="ghost"
                onClick={() => {
                  setIncidentSearch("");
                  incidentsQuery.refetch();
                }}
              >
                Refresh
              </Button>
            </div>

            {selectedIncidentOption ? (
              <div className="no-print flex flex-wrap gap-2">
                <Badge tone="blue"><BidiCode>{selectedIncidentOption.sourceNo}</BidiCode></Badge>
                {selectedIncidentOption.sourceTypeName ? <Badge><BidiText>{selectedIncidentOption.sourceTypeName}</BidiText></Badge> : null}
                <Badge>{formatDateLabel(selectedIncidentOption.sourceDate)}</Badge>
                {selectedIncidentOption.departmentName ? (
                  <Badge><BidiText>{selectedIncidentOption.departmentName}</BidiText></Badge>
                ) : null}
              </div>
            ) : null}

            {incidentsQuery.isLoading || incidentReportQuery.isLoading ? (
              <div className="flex min-h-[25vh] items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50">
                <Spinner />
              </div>
            ) : incidentReportQuery.error ? (
              <div className="rounded-2xl border border-dashed border-red-200 bg-red-50 p-6 text-sm text-red-700">
                Failed to load the incident report.
              </div>
            ) : incidentReportQuery.data ? (
              <IncidentFullReport report={incidentReportQuery.data} />
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
                No incident selected.
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      {activeReport === "summary" ? (
        <>
        <Card className="no-print">
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <CardTitle>Operational summary</CardTitle>
                <CardDescription>Filter the action register, review KPIs, then export the current view.</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={printFilteredActionsReport}
                  disabled={
                    filteredActionsReportQuery.isLoading ||
                    !filteredActionsReportQuery.data?.actions.length
                  }
                >
                  {filteredActionsReportQuery.isLoading ? "Preparing report..." : "Print filtered report"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => downloadCsv("action-summary-report.csv", exportRows)}
                  disabled={!exportRows.length}
                >
                  Export CSV
                </Button>
                <Button variant="ghost" onClick={() => setActiveReport(null)}>Close</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-[2rem] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-5 text-white shadow-[0_24px_70px_rgba(15,23,42,0.18)]">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.24em] text-blue-200">Operational command summary</div>
                  <h3 className="mt-2 text-2xl font-black">Filtered actions intelligence</h3>
                  <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-300">
                    KPIs, filters, and charts below are all generated from the current Operational Summary selection.
                  </p>
                </div>
                <Badge tone="blue">{summaryRows.length} matching actions</Badge>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                <MetricCard label="Incidents" value={String(kpis?.incidentCount ?? 0)} tone="purple" />
                <MetricCard label="Total actions" value={String(kpis?.totalActions ?? 0)} tone="slate" />
                <MetricCard label="Open" value={String(kpis?.openActions ?? 0)} tone="blue" />
                <MetricCard label="Closed" value={String(kpis?.closedActions ?? kpis?.closedOrVerifiedActions ?? 0)} tone="green" />
                <MetricCard label="Overdue" value={String(kpis?.overdueActions ?? 0)} tone="red" />
                <MetricCard label="Progress" value={`${kpis?.averageProgress ?? 0}%`} tone="amber" />
              </div>

              <div className="mt-5 rounded-[1.5rem] bg-white/95 p-4 text-slate-900">
                {filteredActionsReportQuery.isLoading ? (
                  <div className="flex min-h-[220px] items-center justify-center">
                    <Spinner />
                  </div>
                ) : filteredActionsReport ? (
                  <OperationalSummaryVisuals actions={filteredActionsReport.actions} stats={filteredActionsReport.stats} />
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
                    Charts will appear after the filtered report data is ready.
                  </div>
                )}
              </div>
            </div>

            <div className="mt-5 rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">Filters</h3>
                  <p className="mt-1 text-sm text-slate-600">Choose the exact operational slice you want to review or print.</p>
                </div>
                <Button
                  variant="ghost"
                  onClick={() =>
                    setFilters({
                      search: "",
                      departmentCode: "",
                      statusCode: "",
                      priorityCode: "",
                      sourceTypeCode: "",
                      sourceId: "",
                      overdueOnly: false
                    })
                  }
                >
                  Reset all filters
                </Button>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
              <Input
                value={filters.search ?? ""}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, search: event.target.value }))
                }
                placeholder="Search action / source / recommendation / responsible"
                className="xl:col-span-2"
              />

              <Select
                value={filters.sourceTypeCode ?? ""}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    sourceTypeCode: event.target.value,
                    sourceId: ""
                  }))
                }
              >
                <option value="">All source types</option>
                {reportsQuery.data.filters.sourceTypes.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.name}
                  </option>
                ))}
              </Select>

              <Select
                value={filters.sourceId ?? ""}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, sourceId: event.target.value }))
                }
                disabled={sourceOptionsQuery.isLoading}
              >
                <option value="">All sources</option>
                {(sourceOptionsQuery.data ?? []).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.sourceNo} — {item.title}
                  </option>
                ))}
              </Select>

              <Select
                value={filters.departmentCode ?? ""}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, departmentCode: event.target.value }))
                }
              >
                <option value="">All responsible departments</option>
                {reportsQuery.data.filters.departments.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.name}
                  </option>
                ))}
              </Select>

              <Select
                value={filters.statusCode ?? ""}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, statusCode: event.target.value }))
                }
              >
                <option value="">All statuses</option>
                {reportsQuery.data.filters.statuses.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.name}
                  </option>
                ))}
              </Select>

              <Select
                value={filters.priorityCode ?? ""}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, priorityCode: event.target.value }))
                }
              >
                <option value="">All priorities</option>
                {reportsQuery.data.filters.priorities.map((item) => (
                  <option key={item.code} value={item.code}>
                    {getPriorityDisplayLabel(item.code, item.name)}
                  </option>
                ))}
              </Select>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button
                variant={filters.overdueOnly ? "primary" : "outline"}
                onClick={() =>
                  setFilters((current) => ({ ...current, overdueOnly: !current.overdueOnly }))
                }
              >
                {filters.overdueOnly ? "Overdue only" : "Show overdue only"}
              </Button>

              <span className="text-xs font-semibold text-slate-500">
                Current view: {summaryRows.length} actions match the selected filters
              </span>
            </div>

            </div>

            <div className="mt-6">
              {summaryRows.length ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full border-separate border-spacing-y-2">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-[0.12em] text-slate-500">
                        <SortableHeader sortKey="actionTitle" sortConfig={summarySortConfig} onSort={(key) => setSummarySortConfig((current) => nextSortConfig(current, key))}>Action title</SortableHeader>
                        <SortableHeader sortKey="actionDescription" sortConfig={summarySortConfig} onSort={(key) => setSummarySortConfig((current) => nextSortConfig(current, key))}>Action description</SortableHeader>
                        <SortableHeader sortKey="source" sortConfig={summarySortConfig} onSort={(key) => setSummarySortConfig((current) => nextSortConfig(current, key))}>Source</SortableHeader>
                        <SortableHeader sortKey="responsible" sortConfig={summarySortConfig} onSort={(key) => setSummarySortConfig((current) => nextSortConfig(current, key))}>Responsible</SortableHeader>
                        <SortableHeader sortKey="priority" sortConfig={summarySortConfig} onSort={(key) => setSummarySortConfig((current) => nextSortConfig(current, key))}>
                          <span className="inline-flex items-center gap-2">Priority <PriorityInfoTooltip /></span>
                        </SortableHeader>
                        <SortableHeader sortKey="status" sortConfig={summarySortConfig} onSort={(key) => setSummarySortConfig((current) => nextSortConfig(current, key))}>Status</SortableHeader>
                        <SortableHeader sortKey="due" sortConfig={summarySortConfig} onSort={(key) => setSummarySortConfig((current) => nextSortConfig(current, key))}>Due</SortableHeader>
                        <SortableHeader sortKey="progress" sortConfig={summarySortConfig} onSort={(key) => setSummarySortConfig((current) => nextSortConfig(current, key))}>Progress</SortableHeader>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedSummaryRows.map((row) => (
                        <tr key={row.action_id} className="rounded-2xl bg-slate-50 text-sm text-slate-700">
                          <td className="rounded-l-2xl px-3 py-3 align-top">
                            <BidiCode className="font-semibold text-slate-900">{row.action_no}</BidiCode>
                            <BidiBlock className="mt-1 max-w-[20rem] text-xs font-semibold leading-6 text-slate-700">
                              {row.action_title || "—"}
                            </BidiBlock>
                          </td>
                          <td className="px-3 py-3 align-top">
                            <BidiBlock className="max-w-[24rem] text-xs leading-6 text-slate-600">
                              {row.action_description || "—"}
                            </BidiBlock>
                          </td>
                          <td className="px-3 py-3 align-top">
                            <BidiCode className="font-medium text-slate-900">{getSourceDisplayNo(row.source_no, row.reference_no)}</BidiCode>
                            <BidiBlock className="mt-1 text-xs leading-6 text-slate-600">{row.source_title}</BidiBlock>
                          </td>
                          <td className="px-3 py-3 align-top"><BidiText>{row.responsible_name || "Unassigned"}</BidiText></td>
                          <td className="px-3 py-3 align-top">{getPriorityDisplayLabel(row.priority_code, row.priority_name)}</td>
                          <td className="px-3 py-3 align-top">
                            <div className="flex flex-wrap gap-2">
                              <Badge tone={row.is_overdue ? "red" : "slate"}>
                                {row.status_name || row.status_code}
                              </Badge>
                              {row.is_overdue ? <Badge tone="red">Overdue</Badge> : null}
                            </div>
                          </td>
                          <td className="px-3 py-3 align-top">
                            {formatDateLabel(row.latest_extension_until || row.due_date)}
                          </td>
                          <td className="rounded-r-2xl px-3 py-3 align-top font-semibold text-slate-900">
                            {row.progress_percent}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
                  No rows match the current filters.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="actions-report-print-only">
          {filteredActionsReportQuery.data ? (
            <FilteredActionsReport report={filteredActionsReportQuery.data} sortConfig={summarySortConfig} />
          ) : null}
        </div>
        </>
      ) : null}

      {activeReport === "source-progress" ? (
        <Card className="no-print">
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <CardTitle>Source progress</CardTitle>
                <CardDescription>One place to review closure progress and overdue exposure by source.</CardDescription>
              </div>
              <Button variant="ghost" onClick={() => setActiveReport(null)}>Close</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sourceRows.length ? (
                sourceRows.map((row) => (
                  <div key={row.source_id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <BidiCode className="font-semibold text-slate-900">{getSourceDisplayNo(row.source_no)}</BidiCode>
                        <BidiBlock className="mt-1 text-sm leading-6 text-slate-600">{row.source_title}</BidiBlock>
                      </div>
                      <Badge tone={row.overdue_actions > 0 ? "red" : "green"}>
                        {row.overdue_actions > 0 ? `${row.overdue_actions} overdue` : "On track"}
                      </Badge>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-700 md:grid-cols-4">
                      <MiniStat label="Total" value={String(row.total_actions)} />
                      <MiniStat label="Open" value={String(row.open_actions)} />
                      <MiniStat label="Closed" value={String(row.closed_actions)} />
                      <MiniStat label="Verified" value={String(row.verified_actions)} />
                    </div>

                    <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                        <span>Closure</span>
                        <span>{row.closure_percent ?? 0}%</span>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-slate-900"
                          style={{ width: `${Math.max(0, Math.min(Number(row.closure_percent ?? 0), 100))}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
                  No rows match the current filters.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function ReportLibraryCard({
  title,
  description,
  buttonLabel,
  active,
  onOpen,
}: {
  title: string;
  description: string;
  buttonLabel: string;
  active: boolean;
  onOpen: () => void;
}) {
  return (
    <Card className={active ? "border-slate-900 bg-slate-950 text-white" : undefined}>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className={active ? "text-white" : undefined}>{title}</CardTitle>
          <Button variant={active ? "secondary" : "outline"} onClick={onOpen}>
            {active ? "Close" : buttonLabel}
          </Button>
        </div>
        <CardDescription className={active ? "text-slate-200" : undefined}>{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}

function MetricCard({
  label,
  value,
  tone
}: {
  label: string;
  value: string;
  tone: "slate" | "red" | "amber" | "green" | "blue" | "purple";
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-medium text-slate-600">{label}</div>
        <Badge tone={tone}>{label}</Badge>
      </div>
      <div className="mt-4 text-3xl font-bold text-slate-900">{value}</div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</div>
      <div className="mt-2 text-lg font-bold text-slate-900">{value}</div>
    </div>
  );
}
