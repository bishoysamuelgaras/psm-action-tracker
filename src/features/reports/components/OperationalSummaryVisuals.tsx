import { useMemo, useState } from "react";

import { BidiText } from "@/components/ui/bidi";
import { getPriorityDisplayLabel } from "@/lib/priority";

export type OperationalVisualAction = {
  id: string;
  statusCode: string | null;
  priorityCode: string | null;
  priorityName: string | null;
  sourceId: string;
  sourceTypeCode?: string | null;
  sourceTypeName?: string | null;
  owner?: { fullName: string } | null;
  responsible?: { fullName: string } | null;
  responsibleDepartmentName?: string | null;
};

export type OperationalVisualStats = {
  totalActions: number;
  openActions: number;
  closedActions?: number;
  closedOrVerifiedActions?: number;
  overdueActions: number;
  averageProgress: number;
  incidentCount?: number;
};

type ChartSegment = {
  label: string;
  value: number;
  total?: number;
  helper?: string;
  color: string;
};

const DASHBOARD_PIE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#64748b"];

const PRIORITY_COLORS: Record<string, string> = {
  low: "#10b981",
  medium: "#3b82f6",
  high: "#f59e0b",
  critical: "#ef4444"
};

function dashboardPieColor(index: number) {
  return DASHBOARD_PIE_COLORS[index % DASHBOARD_PIE_COLORS.length];
}

function priorityColor(priorityCode: string | null | undefined, index: number) {
  return PRIORITY_COLORS[(priorityCode ?? "").toLowerCase()] ?? dashboardPieColor(index);
}

function isClosedAction(statusCode: string | null | undefined) {
  return statusCode === "closed";
}

function isIncidentSource(action: OperationalVisualAction) {
  const code = (action.sourceTypeCode ?? "").toLowerCase();
  const name = (action.sourceTypeName ?? "").toLowerCase();
  return code.includes("incident") || name.includes("incident");
}

function clampNumber(value: number) {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function buildTopSegments(
  entries: Array<[string, { total: number; closed: number }]>,
  maxItems: number,
  fallbackLabel: string,
  helperFormatter: (value: { total: number; closed: number }) => string = (value) => `${value.closed}/${value.total} closed`
): ChartSegment[] {
  const sorted = entries
    .filter(([, value]) => value.total > 0)
    .sort((a, b) => b[1].total - a[1].total);

  const head = sorted.slice(0, maxItems);
  const tail = sorted.slice(maxItems);
  const segments = head.map(([label, value], index) => ({
    label,
    value: value.total,
    total: value.total,
    helper: helperFormatter(value),
    color: dashboardPieColor(index)
  }));

  if (tail.length) {
    const total = tail.reduce((sum, [, value]) => sum + value.total, 0);
    const closed = tail.reduce((sum, [, value]) => sum + value.closed, 0);
    segments.push({
      label: "Others",
      value: total,
      total,
      helper: helperFormatter({ total, closed }),
      color: dashboardPieColor(segments.length)
    });
  }

  return segments.length ? segments : [{ label: fallbackLabel, value: 1, helper: "No matching data", color: "#cbd5e1" }];
}

function buildChartModel(actions: OperationalVisualAction[], stats: OperationalVisualStats) {
  const totalActions = stats.totalActions || actions.length;
  const closedActions = stats.closedActions ?? actions.filter((action) => isClosedAction(action.statusCode)).length;
  const openActions = Math.max(totalActions - closedActions, 0);
  const incidentCount = stats.incidentCount ?? new Set(actions.filter(isIncidentSource).map((action) => action.sourceId)).size;

  const lifecycleSegments: ChartSegment[] = [
    { label: "Active", value: openActions, helper: `${openActions} actions still open`, color: "#3b82f6" },
    { label: "Closed", value: closedActions, helper: `${closedActions} actions closed`, color: "#10b981" }
  ].filter((item) => item.value > 0);

  const priorityMap = new Map<string, { code: string; label: string; total: number; closed: number }>();
  actions.forEach((action) => {
    const code = action.priorityCode ?? "not_set";
    const current = priorityMap.get(code) ?? {
      code,
      label: getPriorityDisplayLabel(action.priorityCode ?? undefined, action.priorityName ?? undefined),
      total: 0,
      closed: 0
    };
    current.total += 1;
    if (isClosedAction(action.statusCode)) current.closed += 1;
    priorityMap.set(code, current);
  });

  const prioritySegments = Array.from(priorityMap.values())
    .sort((a, b) => b.total - a.total)
    .map((item, index) => ({
      label: item.label,
      value: item.total,
      total: item.total,
      helper: `${item.closed}/${item.total} closed`,
      color: priorityColor(item.code, index)
    }));

  const ownerMap = new Map<string, { total: number; closed: number }>();
  actions.forEach((action) => {
    if (isClosedAction(action.statusCode)) return;
    const label = action.owner?.fullName?.trim() || "Unassigned owner";
    const current = ownerMap.get(label) ?? { total: 0, closed: 0 };
    current.total += 1;
    ownerMap.set(label, current);
  });

  const responsibleMap = new Map<string, { total: number; closed: number }>();
  actions.forEach((action) => {
    const label = action.responsibleDepartmentName?.trim() || action.responsible?.fullName?.trim() || "Unassigned responsible";
    const current = responsibleMap.get(label) ?? { total: 0, closed: 0 };
    current.total += 1;
    if (isClosedAction(action.statusCode)) current.closed += 1;
    responsibleMap.set(label, current);
  });

  return {
    totalActions,
    closedActions,
    openActions,
    incidentCount,
    progress: totalActions ? Number(((closedActions / totalActions) * 100).toFixed(1)) : 0,
    lifecycleSegments: lifecycleSegments.length ? lifecycleSegments : [{ label: "No actions", value: 1, helper: "No matching data", color: "#cbd5e1" }],
    prioritySegments: prioritySegments.length ? prioritySegments : [{ label: "No priority", value: 1, helper: "No matching data", color: "#cbd5e1" }],
    ownerSegments: buildTopSegments(Array.from(ownerMap.entries()), 6, "No owners", (value) => `${value.total} open actions`),
    responsibleSegments: buildTopSegments(Array.from(responsibleMap.entries()), 6, "No responsible departments")
  };
}

export function OperationalSummaryVisuals({
  actions,
  stats,
  mode = "screen"
}: {
  actions: OperationalVisualAction[];
  stats: OperationalVisualStats;
  mode?: "screen" | "print";
}) {
  const model = useMemo(() => buildChartModel(actions, stats), [actions, stats]);
  const summaryCards = [
    { label: "Incidents", value: model.incidentCount, tone: "purple" },
    { label: "Total actions", value: model.totalActions, tone: "slate" },
    { label: "Open actions", value: model.openActions, tone: "blue" },
    { label: "Closed", value: model.closedActions, tone: "green" },
    { label: "Overdue", value: stats.overdueActions, tone: "red" },
    { label: "Progress", value: `${model.progress}%`, tone: "amber" }
  ];

  return (
    <section className={mode === "print" ? "operational-visuals operational-visuals-print" : "operational-visuals"}>
      <div className="operational-kpi-strip">
        {summaryCards.map((card) => (
          <div key={card.label} className={`operational-kpi-card operational-kpi-${card.tone}`}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
          </div>
        ))}
      </div>

      <div className="operational-chart-grid">
        <ReportDonutCard title="Action lifecycle" subtitle="Open versus closed actions" segments={model.lifecycleSegments} />
        <ReportDonutCard title="Priority distribution" subtitle="Total actions by priority with closure signal" segments={model.prioritySegments} />
        <ReportDonutCard title="Owner workload" subtitle="Top owners by assigned actions" segments={model.ownerSegments} />
        <ReportDonutCard title="Responsible departments" subtitle="Responsible workload by department" segments={model.responsibleSegments} />
      </div>
    </section>
  );
}

function ReportDonutCard({ title, subtitle, segments }: { title: string; subtitle: string; segments: ChartSegment[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const total = segments.reduce((sum, item) => sum + clampNumber(item.value), 0) || 1;
  const active = activeIndex == null ? null : segments[activeIndex] ?? null;
  const activeValue = active?.value ?? total;
  const activeLabel = active?.label ?? "Total";
  const activeShare = active ? Math.round((active.value / total) * 100) : 100;
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const showTrack = segments.length === 1 && segments[0]?.label.toLowerCase().includes("no ");
  let consumed = 0;

  return (
    <div className="operational-chart-card">
      <div className="operational-chart-head">
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
        <span>{total}</span>
      </div>

      <div className="operational-donut-layout">
        <div className="operational-donut-wrap" aria-label={title}>
          <svg viewBox="0 0 120 120" role="img">
            {showTrack ? <circle cx="60" cy="60" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="14" /> : null}
            {segments.map((segment, index) => {
              const value = clampNumber(segment.value);
              const dash = (value / total) * circumference;
              const gap = Math.max(circumference - dash, 0);
              const currentOffset = -consumed;
              consumed += dash;
              const isActive = activeIndex === index;
              const isDimmed = activeIndex != null && !isActive;
              return (
                <circle
                  key={`${segment.label}-${index}`}
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="none"
                  stroke={segment.color}
                  strokeWidth={isActive ? 18 : 14}
                  strokeLinecap="round"
                  strokeDasharray={`${dash} ${gap}`}
                  strokeDashoffset={currentOffset}
                  transform="rotate(-90 60 60)"
                  className={isDimmed ? "operational-donut-segment operational-donut-segment-dimmed" : "operational-donut-segment"}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  <title>{`${segment.label}: ${segment.value} of ${total} · ${Math.round((segment.value / total) * 100)}%${segment.helper ? ` · ${segment.helper}` : ""}`}</title>
                </circle>
              );
            })}
          </svg>
          <div className="operational-donut-center">
            <strong>{activeValue}</strong>
            <span>{activeLabel}</span>
            <em>{activeShare}%</em>
          </div>
        </div>

        <div className="operational-chart-legend">
          {segments.map((segment, index) => (
            <button
              key={`${segment.label}-legend-${index}`}
              type="button"
              className={activeIndex === index ? "operational-legend-row operational-legend-row-active" : "operational-legend-row"}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              <span className="operational-legend-dot" style={{ backgroundColor: segment.color }} />
              <span className="operational-legend-label"><BidiText>{segment.label}</BidiText></span>
              <strong>{segment.value}</strong>
              {segment.helper ? <small>{segment.helper}</small> : null}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
