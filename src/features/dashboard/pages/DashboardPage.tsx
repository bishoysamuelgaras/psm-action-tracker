import { Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState, type ReactNode } from "react";
import * as echarts from "echarts";
import type { EChartsOption } from "echarts";

import { Badge } from "@/components/ui/badge";
import { BidiText } from "@/components/ui/bidi";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { PriorityInfoTooltip } from "@/components/ui/priority-info-tooltip";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useDashboardOverview } from "@/features/dashboard/hooks/useDashboardOverview";
import type {
  DashboardPrioritySnapshot,
  DashboardTrendSnapshot,
} from "@/features/dashboard/api/dashboard.api";
import { ROLE_LABELS } from "@/lib/constants";
import { getPriorityBadgeLabel, getPriorityDisplayLabel } from "@/lib/priority";

const statusMeta: Record<string, { label: string; tone: MetricTone }> = {
  open: { label: "Open", tone: "slate" },
  in_progress: { label: "In Progress", tone: "blue" },
  pending_verification: { label: "Pending Verification", tone: "amber" },
  on_hold: { label: "On Hold", tone: "red" },
  closed: { label: "Closed", tone: "green" },
  verified: { label: "Verified", tone: "green" },
  cancelled: { label: "Cancelled", tone: "slate" },
  draft: { label: "Draft", tone: "slate" },
};

const priorityMeta: Record<
  string,
  { label: string; tone: MetricTone; colorClass: string }
> = {
  low: { label: "P4", tone: "green", colorClass: "stroke-emerald-500" },
  medium: { label: "P3", tone: "blue", colorClass: "stroke-blue-500" },
  high: { label: "P2", tone: "amber", colorClass: "stroke-amber-500" },
  critical: { label: "P1", tone: "red", colorClass: "stroke-red-500" },
};

type MetricTone = "slate" | "red" | "amber" | "green" | "blue" | "purple";

type DonutSegment = {
  label: string;
  value: number;
  colorClass: string;
  tone: MetricTone;
  to?: string;
};

const CARD_SHELL =
  "h-full border-slate-200/80 bg-white/95 shadow-[0_18px_48px_rgba(15,23,42,0.07)]";
const INNER_CARD = "rounded-2xl border border-slate-200 bg-white shadow-sm";
const SOFT_PANEL = "rounded-2xl border border-slate-200 bg-slate-50/80";
const ACTION_HOVER =
  "transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/70 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500/25";
const PIE_TONES: MetricTone[] = [
  "blue",
  "green",
  "amber",
  "red",
  "purple",
  "slate",
];
const PIE_STROKES = [
  "stroke-blue-500",
  "stroke-emerald-500",
  "stroke-amber-500",
  "stroke-red-500",
  "stroke-violet-500",
  "stroke-slate-500",
];

export function DashboardPage() {
  const { profile } = useAuth();
  const { data, isLoading, isError, error } = useDashboardOverview();

  const totalActions = data?.kpis.totalActions ?? 0;
  const activeActions = data?.kpis.openActions ?? 0;
  const closedActions =
    data?.kpis.closedActions ?? Math.max(totalActions - activeActions, 0);
  const completionRate =
    data?.kpis.completionRate ??
    (totalActions
      ? Number(((closedActions / totalActions) * 100).toFixed(1))
      : 0);
  const verifiedActions = data?.kpis.verifiedActions ?? 0;
  const needsAttention =
    (data?.kpis.overdueActions ?? 0) +
    (data?.kpis.dueIn7Days ?? 0) +
    (data?.kpis.pendingExtensions ?? 0) +
    (data?.kpis.pendingVerification ?? 0);
  const attentionRate = totalActions
    ? Math.round((needsAttention / totalActions) * 100)
    : 0;
  const departmentName =
    data?.departmentDirectory.find((item) => item.id === profile?.departmentId)
      ?.name ??
    (profile?.departmentId
      ? "Not found in active departments"
      : "Not assigned");

  const lifecycleSegments: DonutSegment[] = [
    {
      label: "Active",
      value: activeActions,
      colorClass: "stroke-blue-500",
      tone: "blue" as const,
      to: actionsPath({ dashboardFilter: "active" }),
    },
    {
      label: "Closed / verified",
      value: closedActions,
      colorClass: "stroke-emerald-500",
      tone: "green" as const,
      to: actionsPath({ dashboardFilter: "closed" }),
    },
  ].filter((item) => item.value > 0);

  const prioritySegments: DonutSegment[] = (data?.prioritySnapshots ?? [])
    .filter((item) => item.totalCount > 0)
    .map((item) => {
      const priority = priorityMeta[item.priorityCode] ?? {
        label: getPriorityBadgeLabel(item.priorityCode),
        tone: "slate" as const,
        colorClass: "stroke-slate-400",
      };
      return {
        label: getPriorityDisplayLabel(item.priorityCode, item.priorityName),
        value: item.totalCount,
        colorClass: priority.colorClass,
        tone: priority.tone,
        to: actionsPath({ priority: item.priorityCode }),
      };
    });

  const kpiCards = [
    {
      label: "Total actions",
      value: totalActions,
      hint: "All actions currently registered.",
      tone: "slate" as const,
      to: actionsPath(),
    },
    {
      label: "Open actions",
      value: activeActions,
      hint: "Open workload that still needs follow-up.",
      tone: "blue" as const,
      to: actionsPath({ dashboardFilter: "active" }),
    },
    {
      label: "Closed actions",
      value: closedActions,
      hint: `Closed from total actions · ${completionRate}%`,
      tone: "green" as const,
      to: actionsPath({ dashboardFilter: "closed" }),
    },
    {
      label: "Overdue",
      value: data?.kpis.overdueActions ?? 0,
      hint: "Past the effective due date.",
      tone: "red" as const,
      to: actionsPath({ dashboardFilter: "overdue" }),
    },
    {
      label: "Due in 7 days",
      value: data?.kpis.dueIn7Days ?? 0,
      hint: "Upcoming follow-up window.",
      tone: "amber" as const,
      to: actionsPath({ dashboardFilter: "due_soon" }),
    },
    {
      label: "Pending verification",
      value: data?.kpis.pendingVerification ?? 0,
      hint: "Needs verification decision.",
      tone: "purple" as const,
      to: actionsPath({ dashboardFilter: "pending_verification" }),
    },
  ];

  const interventionTiles = [
    {
      label: "Overdue recovery",
      value: data?.kpis.overdueActions ?? 0,
      tone: "red" as const,
      helper: "Past due and still open",
      to: actionsPath({ dashboardFilter: "overdue" }),
    },
    {
      label: "7-day readiness",
      value: data?.kpis.dueIn7Days ?? 0,
      tone: "amber" as const,
      helper: "Due soon follow-up",
      to: actionsPath({ dashboardFilter: "due_soon" }),
    },
    {
      label: "Verification gate",
      value: data?.kpis.pendingVerification ?? 0,
      tone: "blue" as const,
      helper: "Ready for close-out check",
      to: actionsPath({ dashboardFilter: "pending_verification" }),
    },
    {
      label: "Extension control",
      value: data?.kpis.pendingExtensions ?? 0,
      tone: "red" as const,
      helper: "Waiting approval decision",
      to: actionsPath({ dashboardFilter: "pending_extensions" }),
    },
  ];

  const ownerPieSegments: DonutSegment[] = (data?.ownerWorkload ?? [])
    .filter((item) => item.openCount > 0)
    .map((item, index) => ({
      label: item.responsibleName,
      value: item.openCount,
      colorClass: PIE_STROKES[index % PIE_STROKES.length],
      tone: PIE_TONES[index % PIE_TONES.length],
      to: item.responsibleUserId
        ? actionsPath({
            responsibleUserId: item.responsibleUserId,
            dashboardFilter: "active",
          })
        : item.responsibleManualName
          ? actionsPath({
              responsibleManualName: item.responsibleManualName,
              dashboardFilter: "active",
            })
          : actionsPath({
              search: item.responsibleName,
              dashboardFilter: "active",
            }),
    }));

  const ownerOpenTotal = ownerPieSegments.reduce(
    (sum, item) => sum + item.value,
    0,
  );
  const ownerOverdueTotal = (data?.ownerWorkload ?? []).reduce(
    (sum, item) => sum + item.overdueCount,
    0,
  );
  const ownerDueSoonTotal = (data?.ownerWorkload ?? []).reduce(
    (sum, item) => sum + item.dueSoonCount,
    0,
  );

  const departmentPieSegments: DonutSegment[] = (
    data?.departmentSnapshots ?? []
  )
    .filter((item) => item.totalCount > 0)
    .map((item, index) => ({
      label: item.departmentName,
      value: item.totalCount,
      colorClass: PIE_STROKES[index % PIE_STROKES.length],
      tone: PIE_TONES[index % PIE_TONES.length],
      to: item.departmentId
        ? actionsPath({ responsibleDepartmentId: item.departmentId })
        : actionsPath({ responsibleDepartmentId: "__unassigned__" }),
    }));

  const departmentTotal = departmentPieSegments.reduce(
    (sum, item) => sum + item.value,
    0,
  );
  const departmentClosedTotal = (data?.departmentSnapshots ?? []).reduce(
    (sum, item) => sum + item.closedCount,
    0,
  );
  const departmentOpenTotal = (data?.departmentSnapshots ?? []).reduce(
    (sum, item) => sum + item.openCount,
    0,
  );

  return (
    <div className="space-y-3 lg:-mx-6 xl:-mx-10 2xl:-mx-14">
      <section className="grid gap-3 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.45fr)]">
        <Card
          className={`${CARD_SHELL} overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white`}
        >
          <CardContent className="p-5 md:p-6">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_230px] lg:items-center">
              <div className="min-w-0 space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="blue">Premium dashboard</Badge>
                  <Badge tone={needsAttention ? "red" : "green"}>
                    {needsAttention
                      ? `${needsAttention} need attention`
                      : "Healthy flow"}
                  </Badge>
                </div>
                <div>
                  <h1 className="text-2xl font-black tracking-tight md:text-4xl">
                    PSM follow-up command center
                  </h1>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-200 md:text-[15px]">
                    Dynamic view for action closure, workload pressure, priority
                    exposure, and department follow-up. Every signal opens the
                    related actions list with the right filter.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-4">
                  <HeroSignal
                    label="Progress"
                    value={`${completionRate}%`}
                    helper="Closed / total actions"
                    tone="green"
                    to={actionsPath({ dashboardFilter: "closed" })}
                  />
                  <HeroSignal
                    label="Open actions"
                    value={activeActions}
                    helper="Still open"
                    tone="blue"
                    to={actionsPath({ dashboardFilter: "active" })}
                  />
                  <HeroSignal
                    label="Attention queue"
                    value={`${attentionRate}%`}
                    helper="Overdue + due soon + verification + extensions"
                    tone="amber"
                    to={actionsPath({ dashboardFilter: "attention" })}
                  />
                  <HeroSignal
                    label="Verified"
                    value={verifiedActions}
                    helper="Verified close-out"
                    tone="green"
                    to={actionsPath({ dashboardFilter: "verified" })}
                  />
                </div>
              </div>

              <ExecutiveGauge
                value={completionRate}
                totalActions={totalActions}
                closedActions={closedActions}
                attentionRate={attentionRate}
                to={actionsPath({ dashboardFilter: "closed" })}
              />
            </div>
          </CardContent>
        </Card>

        <Card className={`${CARD_SHELL} overflow-hidden`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-black tracking-tight text-slate-950">
              Account summary
            </CardTitle>
            <CardDescription className="text-xs leading-5 text-slate-500">
              Compact profile context.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            <MiniProfileInfo label="User" value={profile?.fullName ?? "—"} />
            <MiniProfileInfo
              label="Role"
              value={profile ? ROLE_LABELS[profile.role] : "—"}
            />
            <MiniProfileInfo label="Department" value={departmentName} />
            <Link
              to="/settings"
              className="mt-1 inline-flex w-full justify-center rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            >
              Manage profile access
            </Link>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {kpiCards.map((item) => (
          <MetricCard key={item.label} {...item} loading={isLoading} />
        ))}
      </section>

      <section className="grid gap-3 xl:grid-cols-2">
        <Card className={CARD_SHELL}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-black tracking-tight text-slate-950">
              Action lifecycle
            </CardTitle>
            <CardDescription>
              Closed ratio is calculated from total actions, not action weight.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderPanelState(
              isError,
              isLoading,
              error,
              totalActions,
              "No action lifecycle data yet.",
              () => (
                <div className="grid items-start gap-4 sm:grid-cols-[210px_1fr]">
                  <DonutChart
                    segments={lifecycleSegments}
                    total={Math.max(totalActions, 1)}
                    centerLabel={`${completionRate}%`}
                    centerHint="Closed"
                  />
                  <div className="space-y-2.5">
                    {lifecycleSegments.map((item) => (
                      <LegendLinkRow
                        key={item.label}
                        label={item.label}
                        value={item.value}
                        tone={item.tone}
                        to={item.to ?? actionsPath()}
                      />
                    ))}
                    <Link
                      to={actionsPath()}
                      className={`${INNER_CARD} ${ACTION_HOVER} block px-3.5 py-3 text-sm text-slate-600`}
                    >
                      <span className="font-semibold text-slate-900">
                        Closed actions:
                      </span>{" "}
                      {closedActions} of {totalActions}
                    </Link>
                  </div>
                </div>
              ),
            )}
          </CardContent>
        </Card>

        <Card className={CARD_SHELL}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-black tracking-tight text-slate-950">
              <span className="inline-flex items-center gap-2">
                Priority distribution <PriorityInfoTooltip />
              </span>
            </CardTitle>
            <CardDescription>
              Doughnut view showing total actions and closed actions per
              priority.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderPanelState(
              isError,
              isLoading,
              error,
              data?.prioritySnapshots.length ?? 0,
              "No priority data found.",
              () => (
                <div className="grid items-start gap-4 lg:grid-cols-[220px_1fr]">
                  <DonutChart
                    segments={prioritySegments}
                    total={Math.max(
                      prioritySegments.reduce(
                        (sum, item) => sum + item.value,
                        0,
                      ),
                      1,
                    )}
                    centerLabel={String(totalActions)}
                    centerHint="Total"
                  />
                  <div className="space-y-2.5">
                    {(data?.prioritySnapshots ?? []).map((item) => (
                      <PriorityRow key={item.priorityCode} item={item} />
                    ))}
                  </div>
                </div>
              ),
            )}
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className={CARD_SHELL}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-black tracking-tight text-slate-950">
              Responsible departments
            </CardTitle>
            <CardDescription>
              Doughnut-first view by responsible department with compact closure
              rows. Click any department to open filtered actions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderPanelState(
              isError,
              isLoading,
              error,
              data?.departmentSnapshots.length ?? 0,
              "No department snapshot found.",
              () => (
                <div className="space-y-3">
                  <PieInsightPanel
                    title="Department action split"
                    description="Total action distribution by responsible department."
                    segments={departmentPieSegments}
                    total={departmentTotal}
                    centerLabel={String(departmentTotal)}
                    centerHint="Total"
                    stats={[
                      {
                        label: "Closed",
                        value: departmentClosedTotal,
                        tone: "green",
                        to: actionsPath({ dashboardFilter: "closed" }),
                      },
                      {
                        label: "Open",
                        value: departmentOpenTotal,
                        tone: "blue",
                        to: actionsPath({ dashboardFilter: "active" }),
                      },
                    ]}
                  />
                  <div className="grid max-h-[360px] gap-2 overflow-y-auto pr-1 xl:grid-cols-2">
                    {(data?.departmentSnapshots ?? []).map((item) => (
                      <DepartmentRow
                        key={item.departmentId ?? item.departmentName}
                        departmentId={item.departmentId}
                        name={item.departmentName}
                        totalCount={item.totalCount}
                        closedCount={item.closedCount}
                        openCount={item.openCount}
                        overdueCount={item.overdueCount}
                        closurePercent={item.closurePercent}
                      />
                    ))}
                  </div>
                </div>
              ),
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card className={CARD_SHELL}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-black tracking-tight text-slate-950">
                  Monthly action trend
                </CardTitle>
                <CardDescription>
                  Created vs closed actions during the last 6 months.
                </CardDescription>
              </div>
              <Link
                to={actionsPath()}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-blue-700 transition hover:bg-blue-50"
              >
                Open actions
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {renderPanelState(
              isError,
              isLoading,
              error,
              data?.trendSnapshots.length ?? 0,
              "No trend data yet.",
              () => (
                <TrendBars items={data?.trendSnapshots ?? []} />
              ),
            )}
          </CardContent>
        </Card>

        <Card className={CARD_SHELL}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-black tracking-tight text-slate-950">
              Status flow
            </CardTitle>
            <CardDescription>
              Clickable status bars by current action status.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderPanelState(
              isError,
              isLoading,
              error,
              data?.statusSnapshots.length ?? 0,
              "No status data found.",
              () => (
                <div className="space-y-2.5">
                  {(data?.statusSnapshots ?? []).map((item) => {
                    const status = statusMeta[item.statusCode] ?? {
                      label: item.statusName,
                      tone: "slate" as const,
                    };
                    return (
                      <BarLinkRow
                        key={item.statusCode}
                        label={status.label}
                        value={item.totalCount}
                        tone={status.tone}
                        max={getMaxValue(
                          (data?.statusSnapshots ?? []).map(
                            (row) => row.totalCount,
                          ),
                        )}
                        to={actionsPath({ status: item.statusCode })}
                      />
                    );
                  })}
                </div>
              ),
            )}
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className={CARD_SHELL}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-black tracking-tight text-slate-950">
              Owner workload
            </CardTitle>
            <CardDescription>
              Full-width doughnut-first row for open action ownership; compact
              bars remain for quick ranking.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderPanelState(
              isError,
              isLoading,
              error,
              data?.ownerWorkload.length ?? 0,
              "No owner workload found.",
              () => (
                <div className="space-y-3">
                  <PieInsightPanel
                    title="Open owner split"
                    description="Distribution of open actions across the busiest owners."
                    segments={ownerPieSegments}
                    total={ownerOpenTotal}
                    centerLabel={String(ownerOpenTotal)}
                    centerHint="Open"
                    stats={[
                      {
                        label: "Overdue",
                        value: ownerOverdueTotal,
                        tone: "red",
                        to: actionsPath({ dashboardFilter: "overdue" }),
                      },
                      {
                        label: "Due soon",
                        value: ownerDueSoonTotal,
                        tone: "amber",
                        to: actionsPath({ dashboardFilter: "due_soon" }),
                      },
                    ]}
                  />
                  <div className="grid max-h-[340px] gap-2 overflow-y-auto pr-1 xl:grid-cols-2 2xl:grid-cols-3">
                    {(data?.ownerWorkload ?? []).map((item) => (
                      <WorkloadRow
                        key={`${item.responsibleUserId ?? "manual"}-${item.responsibleManualName ?? item.responsibleName}`}
                        responsibleUserId={item.responsibleUserId}
                        responsibleManualName={item.responsibleManualName}
                        label={item.responsibleName}
                        openCount={item.openCount}
                        overdueCount={item.overdueCount}
                        dueSoonCount={item.dueSoonCount}
                        criticalCount={item.criticalCount}
                        max={getMaxValue(
                          (data?.ownerWorkload ?? []).map(
                            (row) => row.openCount,
                          ),
                        )}
                      />
                    ))}
                  </div>
                </div>
              ),
            )}
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className={CARD_SHELL}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-black tracking-tight text-slate-950">
              Intervention command matrix
            </CardTitle>
            <CardDescription>
              Professional action pressure view grouped at the end of the
              dashboard for management follow-up.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderPanelState(
              isError,
              isLoading,
              error,
              1,
              "No intervention data available.",
              () => (
                <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                    {interventionTiles.map((item) => (
                      <InterventionTile
                        key={item.label}
                        {...item}
                        total={Math.max(totalActions, 1)}
                      />
                    ))}
                  </div>
                  <div className={`${SOFT_PANEL} p-4`}>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="text-sm font-bold text-slate-900">
                        Pressure pulse
                      </span>
                      <span className="text-sm font-black text-slate-950">
                        {attentionRate}%
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-white">
                      <div
                        className={`h-full rounded-full ${attentionRate >= 30 ? "bg-red-500" : attentionRate >= 12 ? "bg-amber-500" : "bg-emerald-500"}`}
                        style={{ width: `${Math.min(attentionRate, 100)}%` }}
                      />
                    </div>
                    <p className="mt-3 text-xs font-semibold leading-5 text-slate-500">
                      Overdue, due soon, pending verification, and pending
                      extension requests as a share of all actions.
                    </p>
                  </div>
                </div>
              ),
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function renderPanelState(
  isError: boolean,
  isLoading: boolean,
  error: unknown,
  dataCount: number,
  emptyText: string,
  children: () => ReactNode,
) {
  if (isError)
    return (
      <ErrorBox
        message={
          error instanceof Error
            ? error.message
            : "Unable to load dashboard data."
        }
      />
    );
  if (isLoading) return <CenteredSpinner />;
  if (!dataCount) return <EmptyBox text={emptyText} />;
  return children();
}

function actionsPath(
  params: Record<string, string | number | boolean | null | undefined> = {},
) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "") return;
    searchParams.set(key, String(value));
  });
  const query = searchParams.toString();
  return query ? `/actions?${query}` : "/actions";
}

function HeroSignal({
  label,
  value,
  helper,
  tone,
  to,
}: {
  label: string;
  value: string | number;
  helper: string;
  tone: MetricTone;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="rounded-2xl border border-white/10 bg-white/10 px-3.5 py-3 backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/35"
    >
      <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-300">
        {label}
      </div>
      <div
        className={`mt-2 text-3xl font-black tracking-tight ${getHeroToneClass(tone)}`}
      >
        {value}
      </div>
      <div className="mt-1 text-xs font-semibold text-slate-300">{helper}</div>
    </Link>
  );
}

function MiniProfileInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5">
      <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </div>
      <BidiText className="mt-1 block break-words text-sm font-black leading-5 text-slate-950">
        {value}
      </BidiText>
    </div>
  );
}

function MetricCard({
  label,
  value,
  hint,
  tone,
  loading,
  to,
}: {
  label: string;
  value: string | number;
  hint: string;
  tone: MetricTone;
  loading?: boolean;
  to: string;
}) {
  return (
    <Link
      to={to}
      className={`${CARD_SHELL} ${ACTION_HOVER} group block min-h-[130px] rounded-2xl border bg-white p-4 md:rounded-3xl`}
    >
      <div className="flex h-full flex-col justify-between gap-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2 text-sm text-slate-600">
            <span
              className={`h-2.5 w-2.5 rounded-full ${getDotToneClass(tone)}`}
            />
            <span className="truncate font-bold">{label}</span>
          </div>
          {loading ? (
            <Spinner />
          ) : (
            <span className="text-xs font-black text-blue-600 opacity-0 transition group-hover:opacity-100">
              Open →
            </span>
          )}
        </div>
        <div>
          <div
            className={`text-3xl font-black tracking-tight ${getValueToneClass(tone)}`}
          >
            {value}
          </div>
          <div className="mt-1.5 text-sm leading-6 text-slate-500">{hint}</div>
        </div>
      </div>
    </Link>
  );
}

function ExecutiveGauge({
  value,
  totalActions,
  closedActions,
  attentionRate,
  to,
}: {
  value: number;
  totalActions: number;
  closedActions: number;
  attentionRate: number;
  to: string;
}) {
  const chartRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const safeValue = Math.min(
    Math.max(Number.isFinite(value) ? value : 0, 0),
    100,
  );
  const pressureColor =
    attentionRate >= 30
      ? "#fb7185"
      : attentionRate >= 12
        ? "#fbbf24"
        : "#34d399";

  useEffect(() => {
    if (!chartRef.current) return;
    const chart = echarts.init(chartRef.current, "dark", {
      renderer: "canvas",
    });
    const option: EChartsOption = {
      backgroundColor: "transparent",
      textStyle: {
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      },
      tooltip: {
        trigger: "item",
        borderWidth: 0,
        backgroundColor: "rgba(15, 23, 42, 0.94)",
        textStyle: { color: "#fff", fontSize: 12, fontWeight: 700 },
        formatter: () =>
          `Progress: ${safeValue}%<br/>Closed: ${closedActions} / ${totalActions}<br/>Attention: ${attentionRate}%`,
      },
      series: [
        {
          name: "PSM progress",
          type: "gauge",
          min: 0,
          max: 100,
          radius: "92%",
          startAngle: 225,
          endAngle: -45,
          splitNumber: 4,
          animationDuration: 1800,
          animationEasing: "quadraticOut",
          axisLine: {
            roundCap: true,
            lineStyle: {
              width: 10,
              color: [
                [0.45, "rgba(248, 113, 113, 0.9)"],
                [0.75, "rgba(251, 191, 36, 0.9)"],
                [1, "rgba(52, 211, 153, 0.95)"],
              ],
            },
          },
          progress: {
            show: true,
            overlap: false,
            roundCap: true,
            width: 28,
            itemStyle: {
              color: new echarts.graphic.RadialGradient(0.5, 0.5, 0.75, [
                { offset: 0, color: "rgba(14, 165, 233, 0.04)" },
                { offset: 0.65, color: "rgba(59, 130, 246, 0.20)" },
                { offset: 0.9, color: "rgba(125, 211, 252, 0.75)" },
                { offset: 1, color: "rgba(255,255,255,0.98)" },
              ]),
              shadowBlur: 28,
              shadowColor: "rgba(125, 211, 252, 0.45)",
            },
          },
          pointer: {
            show: true,
            length: "72%",
            width: 5,
            offsetCenter: [0, "10%"],
            itemStyle: {
              color: "rgba(255,255,255,0.96)",
              shadowBlur: 18,
              shadowColor: "rgba(255,255,255,0.45)",
            },
          },
          anchor: {
            show: true,
            showAbove: true,
            size: 18,
            itemStyle: {
              color: "#020617",
              borderColor: "rgba(255,255,255,0.88)",
              borderWidth: 2,
              shadowBlur: 24,
              shadowColor: "rgba(255,255,255,0.36)",
            },
          },
          axisTick: {
            distance: -22,
            length: 6,
            lineStyle: { color: "rgba(255,255,255,0.45)", width: 1 },
          },
          splitLine: {
            distance: -28,
            length: 12,
            lineStyle: { color: "rgba(255,255,255,0.75)", width: 2 },
          },
          axisLabel: {
            distance: -8,
            color: "rgba(226,232,240,0.86)",
            fontSize: 10,
            fontWeight: 800,
          },
          title: { show: false },
          detail: {
            valueAnimation: true,
            formatter: "{value}%\n{unit|progress}",
            offsetCenter: [0, "52%"],
            color: "#fff",
            fontSize: 30,
            fontWeight: 900,
            lineHeight: 34,
            rich: {
              unit: {
                color: "rgba(203,213,225,0.9)",
                fontSize: 11,
                fontWeight: 800,
                lineHeight: 22,
              },
            },
          },
          data: [{ value: safeValue, name: "Progress" }],
        },
      ],
      graphic: [
        {
          type: "circle",
          left: "center",
          top: "middle",
          shape: { r: 74 },
          style: {
            fill: "rgba(15, 23, 42, 0.36)",
            stroke: "rgba(255,255,255,0.08)",
            lineWidth: 1,
          },
          silent: true,
          z: -1,
        },
        {
          type: "text",
          right: 8,
          top: 8,
          style: {
            text: `Attention ${attentionRate}%`,
            fill: pressureColor,
            fontSize: 11,
            fontWeight: 900,
          },
          silent: true,
        },
      ],
    };

    chart.setOption(option);
    chart.on("click", () => {
      void navigate(to);
    });
    const handleResize = () => chart.resize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.dispose();
    };
  }, [
    attentionRate,
    closedActions,
    navigate,
    pressureColor,
    safeValue,
    to,
    totalActions,
  ]);

  return (
    <button
      type="button"
      onClick={() => navigate(to)}
      className="group mx-auto block w-full rounded-[2rem] border border-white/15 bg-[radial-gradient(circle_at_50%_35%,rgba(56,189,248,0.25),rgba(15,23,42,0.1)_48%,rgba(2,6,23,0.32))] p-3 shadow-2xl shadow-blue-950/40 backdrop-blur transition hover:scale-[1.02] hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/40"
      aria-label="Open closed actions"
    >
      <div ref={chartRef} className="h-[230px] w-full" />
      <div className="-mt-2 grid grid-cols-2 gap-2 px-2 pb-1 text-left">
        <div className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2">
          <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-300">
            Closed
          </div>
          <div className="mt-1 text-xl font-black text-emerald-300">
            {closedActions}
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2">
          <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-300">
            Total
          </div>
          <div className="mt-1 text-xl font-black text-white">
            {totalActions}
          </div>
        </div>
      </div>
    </button>
  );
}

function DonutChart({
  segments,
  total,
  centerLabel,
  centerHint,
  size = "default",
}: {
  segments: DonutSegment[];
  total: number;
  centerLabel: string;
  centerHint: string;
  size?: "default" | "compact" | "hero";
}) {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const isCompact = size === "compact";
  const isHero = size === "hero";
  const radius = isCompact ? 42 : isHero ? 50 : 46;
  const strokeWidth = isCompact ? 9 : isHero ? 14 : 11;
  const activeStrokeWidth = strokeWidth + (isHero ? 4 : 3);
  const circumference = 2 * Math.PI * radius;
  const boxClass = isCompact
    ? "h-[140px] w-[140px]"
    : isHero
      ? "h-[310px] w-[310px]"
      : "h-[205px] w-[205px]";
  const numberClass = isCompact
    ? "text-[24px]"
    : isHero
      ? "text-[48px]"
      : "text-[34px]";
  const activeSegment = activeIndex === null ? null : segments[activeIndex];
  const activeShare =
    activeSegment && total > 0
      ? Math.round((activeSegment.value / total) * 100)
      : 0;
  let accumulated = 0;

  return (
    <div className={`mx-auto flex ${boxClass} items-start justify-center`}>
      <div
        className={`relative ${boxClass}`}
        onMouseLeave={() => setActiveIndex(null)}
      >
        <svg
          viewBox="0 0 120 120"
          className="h-full w-full -rotate-90 overflow-visible"
        >
          <circle
            cx="60"
            cy="60"
            r={radius}
            className="fill-none stroke-slate-200"
            strokeWidth={strokeWidth}
          />
          {segments.map((segment, index) => {
            const dash =
              total > 0 ? (segment.value / total) * circumference : 0;
            const dashOffset = -accumulated;
            accumulated += dash;
            const isActive = activeIndex === index;

            return (
              <circle
                key={`${segment.label}-${index}`}
                cx="60"
                cy="60"
                r={radius}
                className={`dashboard-donut-segment fill-none ${segment.colorClass} ${isActive ? "opacity-100 drop-shadow-md" : activeIndex === null ? "opacity-95" : "opacity-35"}`}
                strokeWidth={isActive ? activeStrokeWidth : strokeWidth}
                strokeLinecap="round"
                strokeDasharray={`${dash} ${Math.max(circumference - dash, 0)}`}
                strokeDashoffset={dashOffset}
                style={{
                  animationDelay: `${index * 90}ms`,
                  cursor: segment.to ? "pointer" : "default",
                  pointerEvents: "stroke",
                }}
                onMouseEnter={() => setActiveIndex(index)}
                onFocus={() => setActiveIndex(index)}
                onClick={() => {
                  if (segment.to) navigate(segment.to);
                }}
                role={segment.to ? "link" : "img"}
                tabIndex={segment.to ? 0 : -1}
                onKeyDown={(event) => {
                  if (!segment.to) return;
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    navigate(segment.to);
                  }
                }}
              >
                <title>{`${segment.label}: ${segment.value} actions${total > 0 ? ` · ${Math.round((segment.value / total) * 100)}%` : ""}`}</title>
              </circle>
            );
          })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <div
            className={`${numberClass} font-black tracking-tight text-slate-950`}
          >
            {activeSegment ? activeSegment.value : centerLabel}
          </div>
          <div className="mt-1 max-w-[72%] truncate text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
            {activeSegment ? activeSegment.label : centerHint}
          </div>
          {activeSegment ? (
            <div className="mt-2 rounded-full border border-slate-200 bg-white/95 px-2.5 py-1 text-xs font-black text-slate-700 shadow-sm">
              {activeShare}% share
            </div>
          ) : null}
        </div>
        {activeSegment ? (
          <div className="pointer-events-none absolute left-1/2 top-2 z-10 -translate-x-1/2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-700 shadow-xl">
            <BidiText>{activeSegment.label}</BidiText> · {activeSegment.value}
          </div>
        ) : null}
      </div>
    </div>
  );
}

type PieInsightStat = {
  label: string;
  value: number;
  tone: MetricTone;
  to: string;
};

function PieInsightPanel({
  title,
  description,
  segments,
  total,
  centerLabel,
  centerHint,
  stats,
}: {
  title: string;
  description: string;
  segments: DonutSegment[];
  total: number;
  centerLabel: string;
  centerHint: string;
  stats: PieInsightStat[];
}) {
  const visibleSegments = segments.slice(0, 8);

  return (
    <div className={`${SOFT_PANEL} p-5`}>
      <div className="grid gap-5 xl:grid-cols-[390px_1fr] xl:items-start">
        <div className="flex flex-col items-center justify-start self-start rounded-3xl border border-white bg-white p-5 shadow-sm">
          <DonutChart
            segments={segments}
            total={Math.max(total, 1)}
            centerLabel={centerLabel}
            centerHint={centerHint}
            size="hero"
          />
          <div className="mt-3 text-center">
            <div className="text-base font-black text-slate-950">{title}</div>
            <div className="mt-1 max-w-[320px] text-sm leading-6 text-slate-500">
              {description}
            </div>
          </div>
        </div>

        <div className="min-w-0 space-y-3 self-start">
          <div className="grid gap-2.5 sm:grid-cols-2">
            {stats.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className="rounded-2xl border border-white bg-white px-3.5 py-2.5 shadow-sm transition hover:border-blue-200 hover:bg-blue-50"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                    {item.label}
                  </span>
                  <span
                    className={`text-xl font-black ${getValueToneClass(item.tone)}`}
                  >
                    {item.value}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2">
            {visibleSegments.map((item) => (
              <Link
                key={item.label}
                to={item.to ?? actionsPath()}
                title={`${item.label}: ${item.value} actions`}
                className="flex min-w-0 items-center justify-between gap-3 rounded-2xl bg-white px-3.5 py-3 text-base font-black text-slate-700 transition hover:-translate-y-0.5 hover:bg-blue-50 hover:text-blue-700 hover:shadow-sm"
              >
                <span className="min-w-0 truncate">
                  <span
                    className={`mr-2 inline-block h-5 w-5 align-[-3px] rounded-full shadow-sm ${getDotToneClass(item.tone)}`}
                  />
                  <BidiText>{item.label}</BidiText>
                </span>
                <span className="text-lg text-slate-950">{item.value}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function LegendLinkRow({
  label,
  value,
  tone,
  to,
}: {
  label: string;
  value: number;
  tone: MetricTone;
  to: string;
}) {
  return (
    <Link
      to={to}
      className={`${SOFT_PANEL} ${ACTION_HOVER} flex items-center justify-between gap-3 px-4 py-3`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`h-4 w-4 rounded-full shadow-sm ${getDotToneClass(tone)}`}
        />
        <span className="text-base font-bold text-slate-700">{label}</span>
      </div>
      <span className="text-lg font-black tracking-tight text-slate-950">
        {value}
      </span>
    </Link>
  );
}

function PriorityRow({ item }: { item: DashboardPrioritySnapshot }) {
  const priority = priorityMeta[item.priorityCode] ?? {
    label: getPriorityBadgeLabel(item.priorityCode),
    tone: "slate" as const,
    colorClass: "stroke-slate-400",
  };

  return (
    <Link
      to={actionsPath({ priority: item.priorityCode })}
      className={`${SOFT_PANEL} ${ACTION_HOVER} block p-3`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={toBadgeTone(priority.tone)}>{priority.label}</Badge>
            <span className="text-sm font-black text-slate-900">
              {getPriorityDisplayLabel(item.priorityCode, item.priorityName)}
            </span>
          </div>
          <div className="mt-1 text-xs font-semibold text-slate-500">
            Closed {item.closedCount}/{item.totalCount} · {item.closurePercent}%
          </div>
        </div>
        <div className="text-right">
          <div className="text-xl font-black text-slate-950">
            {item.totalCount}
          </div>
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
            Total
          </div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs font-bold">
        <span className="rounded-xl bg-white px-2 py-1.5 text-emerald-700">
          Closed {item.closedCount}
        </span>
        <span className="rounded-xl bg-white px-2 py-1.5 text-blue-700">
          Open {item.openCount}
        </span>
        <span className="rounded-xl bg-white px-2 py-1.5 text-red-700">
          Overdue {item.overdueCount}
        </span>
      </div>
    </Link>
  );
}

function InterventionTile({
  label,
  value,
  helper,
  tone,
  total,
  to,
}: {
  label: string;
  value: number;
  helper: string;
  tone: MetricTone;
  total: number;
  to: string;
}) {
  const width = Math.min(
    Math.max((value / total) * 100, value > 0 ? 8 : 0),
    100,
  );

  return (
    <Link to={to} className={`${SOFT_PANEL} ${ACTION_HOVER} block p-3.5`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-black text-slate-900">{label}</div>
          <div className="mt-1 text-xs font-semibold text-slate-500">
            {helper}
          </div>
        </div>
        <div className={`text-2xl font-black ${getValueToneClass(tone)}`}>
          {value}
        </div>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
        <div
          className={`h-full rounded-full ${getBarToneClass(tone)}`}
          style={{ width: `${width}%` }}
        />
      </div>
    </Link>
  );
}

function TrendBars({ items }: { items: DashboardTrendSnapshot[] }) {
  const max = Math.max(
    1,
    ...items.flatMap((item) => [item.createdCount, item.closedCount]),
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3 text-xs font-bold text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
          Created
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          Closed
        </span>
      </div>
      <div className="grid h-[220px] grid-cols-6 items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
        {items.map((item) => {
          const createdHeight = Math.max(
            (item.createdCount / max) * 160,
            item.createdCount ? 8 : 2,
          );
          const closedHeight = Math.max(
            (item.closedCount / max) * 160,
            item.closedCount ? 8 : 2,
          );
          return (
            <div
              key={item.monthKey}
              className="flex h-full flex-col justify-end gap-2 text-center"
            >
              <Link
                to={actionsPath()}
                className="flex flex-1 items-end justify-center gap-1.5 rounded-xl transition hover:bg-white/70"
                title={`${item.monthLabel}: Created ${item.createdCount}, Closed ${item.closedCount}`}
              >
                <span
                  className="w-4 rounded-t-lg bg-blue-500"
                  style={{ height: `${createdHeight}px` }}
                />
                <span
                  className="w-4 rounded-t-lg bg-emerald-500"
                  style={{ height: `${closedHeight}px` }}
                />
              </Link>
              <div className="text-[11px] font-bold text-slate-500">
                {item.monthLabel}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BarLinkRow({
  label,
  value,
  tone,
  max,
  to,
}: {
  label: string;
  value: number;
  tone: MetricTone;
  max: number;
  to: string;
}) {
  const width = max > 0 ? Math.max((value / max) * 100, value > 0 ? 10 : 0) : 0;

  return (
    <Link to={to} className={`${SOFT_PANEL} ${ACTION_HOVER} block p-3.5`}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className={`h-2.5 w-2.5 rounded-full ${getDotToneClass(tone)}`}
          />
          <span className="text-sm font-black text-slate-800">{label}</span>
        </div>
        <span className="text-lg font-black tracking-tight text-slate-950">
          {value}
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-white">
        <div
          className={`h-full rounded-full ${getBarToneClass(tone)}`}
          style={{ width: `${width}%` }}
        />
      </div>
    </Link>
  );
}

function WorkloadRow({
  responsibleUserId,
  responsibleManualName,
  label,
  openCount,
  overdueCount,
  dueSoonCount,
  criticalCount,
  max,
}: {
  responsibleUserId: string | null;
  responsibleManualName: string | null;
  label: string;
  openCount: number;
  overdueCount: number;
  dueSoonCount: number;
  criticalCount: number;
  max: number;
}) {
  const width =
    max > 0 ? Math.max((openCount / max) * 100, openCount > 0 ? 12 : 0) : 0;
  const to = responsibleUserId
    ? actionsPath({ responsibleUserId, dashboardFilter: "active" })
    : responsibleManualName
      ? actionsPath({ responsibleManualName, dashboardFilter: "active" })
      : actionsPath({ search: label, dashboardFilter: "active" });

  return (
    <Link to={to} className={`${SOFT_PANEL} ${ACTION_HOVER} block p-2`}>
      <div className="flex items-start justify-between gap-2.5">
        <div className="min-w-0 flex-1">
          <BidiText className="block text-sm font-black text-slate-900">
            {label}
          </BidiText>
          <div className="mt-0.5 text-xs text-slate-500">
            Open follow-up: {openCount}
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Badge tone="red">Overdue {overdueCount}</Badge>
          <Badge tone="amber">Due soon {dueSoonCount}</Badge>
          <Badge tone="blue">P1 {criticalCount}</Badge>
        </div>
      </div>
      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white">
        <div
          className="h-full rounded-full bg-blue-500"
          style={{ width: `${width}%` }}
        />
      </div>
    </Link>
  );
}

function DepartmentRow({
  departmentId,
  name,
  totalCount,
  closedCount,
  openCount,
  overdueCount,
  closurePercent,
}: {
  departmentId: string | null;
  name: string;
  totalCount: number;
  closedCount: number;
  openCount: number;
  overdueCount: number;
  closurePercent: number;
}) {
  const closureWidth =
    totalCount > 0
      ? Math.min(Math.max(closurePercent, closedCount > 0 ? 4 : 0), 100)
      : 0;
  const filterPath = departmentId
    ? actionsPath({ responsibleDepartmentId: departmentId })
    : actionsPath({ responsibleDepartmentId: "__unassigned__" });

  return (
    <Link
      to={filterPath}
      aria-label={`Open actions filtered by ${name}`}
      className={`${SOFT_PANEL} ${ACTION_HOVER} group block p-2`}
    >
      <div className="flex items-start justify-between gap-2.5">
        <div className="min-w-0 flex-1">
          <BidiText className="block text-sm font-black text-slate-900">
            {name}
          </BidiText>
          <div className="mt-0.5 text-xs text-slate-500">
            Total actions: {totalCount}
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Badge tone="slate">Total {totalCount}</Badge>
          <Badge tone="green">Closed {closedCount}</Badge>
          <Badge tone="blue">Open {openCount}</Badge>
          {overdueCount > 0 ? (
            <Badge tone="red">Overdue {overdueCount}</Badge>
          ) : null}
          <span className="rounded-full border border-blue-200 bg-white px-2.5 py-1 text-xs font-bold text-blue-700 transition group-hover:border-blue-300 group-hover:bg-blue-50">
            Open filtered →
          </span>
        </div>
      </div>

      <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
        <div
          className="h-1 overflow-hidden rounded-full bg-slate-200"
          aria-label={`Closed ${closedCount} of ${totalCount} actions`}
          title={`Closed ${closedCount} of ${totalCount} actions`}
        >
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${closureWidth}%` }}
          />
        </div>
        <div className="whitespace-nowrap text-xs font-bold text-slate-500">
          Closed {closedCount}/{totalCount} · {closurePercent}%
        </div>
      </div>
    </Link>
  );
}

function CenteredSpinner() {
  return (
    <div className="flex min-h-[140px] items-center justify-center">
      <Spinner />
    </div>
  );
}

function EmptyBox({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-600">
      {text}
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-5 text-sm text-red-700">
      {message}
    </div>
  );
}

function getMaxValue(values: number[]) {
  return values.reduce((max, value) => Math.max(max, value), 0);
}

function toBadgeTone(
  tone: MetricTone,
): "slate" | "red" | "amber" | "green" | "blue" {
  return tone === "purple" ? "blue" : tone;
}

function getValueToneClass(tone: MetricTone) {
  switch (tone) {
    case "red":
      return "text-red-700";
    case "amber":
      return "text-amber-700";
    case "green":
      return "text-emerald-700";
    case "blue":
      return "text-blue-700";
    case "purple":
      return "text-violet-700";
    default:
      return "text-slate-950";
  }
}

function getHeroToneClass(tone: MetricTone) {
  switch (tone) {
    case "red":
      return "text-red-200";
    case "amber":
      return "text-amber-200";
    case "green":
      return "text-emerald-200";
    case "blue":
      return "text-blue-200";
    case "purple":
      return "text-violet-200";
    default:
      return "text-white";
  }
}

function getDotToneClass(tone: MetricTone) {
  switch (tone) {
    case "red":
      return "bg-red-500";
    case "amber":
      return "bg-amber-500";
    case "green":
      return "bg-emerald-500";
    case "blue":
      return "bg-blue-500";
    case "purple":
      return "bg-violet-500";
    default:
      return "bg-slate-400";
  }
}

function getBarToneClass(tone: MetricTone) {
  switch (tone) {
    case "red":
      return "bg-red-500";
    case "amber":
      return "bg-amber-500";
    case "green":
      return "bg-emerald-500";
    case "blue":
      return "bg-blue-500";
    case "purple":
      return "bg-violet-500";
    default:
      return "bg-slate-400";
  }
}
