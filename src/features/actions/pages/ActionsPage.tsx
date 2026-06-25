import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { BidiBlock, BidiText } from "@/components/ui/bidi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FeatureIntro } from "@/components/ui/feature-intro";
import { StatCard } from "@/components/ui/stat-card";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
  createAction,
  decideExtensionRequest,
  deleteAction,
  getIsOverdue,
  listActionLookups,
  listActions,
  listActionsNeedingVerification,
  listPendingExtensionApprovals,
  type ActionFilters,
  type ActionListItem,
  type PendingExtensionQueueItem,
  type SaveActionInput,
  type VerificationQueueItem,
  updateAction
} from "@/features/actions/api/actions.api";
import { ActionFilters as ActionFiltersPanel } from "@/features/actions/components/ActionFilters";
import { ActionForm } from "@/features/actions/components/ActionForm";
import { ActionListTable, type ActionTableSortKey } from "@/features/actions/components/ActionListTable";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useRoleAccess } from "@/features/auth/hooks/useRoleAccess";
import { nextSortConfig, sortByConfig, type SortConfig } from "@/lib/sorting";

type FormMode = "create" | "edit";
type QueueModalType = "extensions" | "verification" | null;
type PageSize = 10 | 20 | 30 | 50;

const pageSizeOptions: PageSize[] = [10, 20, 30, 50];

function getFiltersFromSearchParams(searchParams: URLSearchParams): ActionFilters {
  return {
    search: searchParams.get("search") ?? "",
    statusCode: searchParams.get("status") ?? "",
    priorityCode: searchParams.get("priority") ?? "",
    responsibleUserId: searchParams.get("responsibleUserId") ?? "",
    responsibleManualName: searchParams.get("responsibleManualName") ?? "",
    responsibleDepartmentId: searchParams.get("responsibleDepartmentId") ?? "",
    dashboardFilter: searchParams.get("dashboardFilter") ?? "",
    recommendationId: searchParams.get("recommendationId") ?? "",
    sourceId: searchParams.get("sourceId") ?? "",
    overdueOnly: searchParams.get("overdueOnly") === "true"
  };
}

function hasSearchParamFilters(searchParams: URLSearchParams) {
  return [
    "search",
    "status",
    "priority",
    "responsibleUserId",
    "responsibleManualName",
    "responsibleDepartmentId",
    "dashboardFilter",
    "recommendationId",
    "sourceId",
    "overdueOnly"
  ].some((key) => searchParams.has(key));
}

const initialFilters: ActionFilters = {
  search: "",
  statusCode: "",
  priorityCode: "",
  responsibleUserId: "",
  responsibleManualName: "",
  responsibleDepartmentId: "",
  dashboardFilter: "",
  recommendationId: "",
  sourceId: "",
  overdueOnly: false
};

export function ActionsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();
  const {
    canManageActions: canManage,
    canApproveExtensions,
    canVerifyActions
  } = useRoleAccess();

  const [filters, setFilters] = useState<ActionFilters>(() =>
    hasSearchParamFilters(searchParams) ? getFiltersFromSearchParams(searchParams) : initialFilters
  );
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>("create");
  const [selectedItem, setSelectedItem] = useState<ActionListItem | null>(null);
  const [queueModal, setQueueModal] = useState<QueueModalType>(null);
  const [pageSize, setPageSize] = useState<PageSize>(10);
  const [page, setPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<SortConfig<ActionTableSortKey>>({ key: "due", direction: "asc" });

  const lookupsQuery = useQuery({
    queryKey: ["action-lookups"],
    queryFn: listActionLookups,
    staleTime: 5 * 60_000
  });
  const actionsQuery = useQuery({
    queryKey: ["actions", filters],
    queryFn: () => listActions(filters)
  });
  const pendingExtensionsQuery = useQuery({
    queryKey: ["pending-extension-approvals"],
    queryFn: listPendingExtensionApprovals,
    enabled: canApproveExtensions
  });
  const verificationQueueQuery = useQuery({
    queryKey: ["actions-needing-verification"],
    queryFn: listActionsNeedingVerification,
    enabled: canVerifyActions
  });

  const createMutation = useMutation({
    mutationFn: async (values: SaveActionInput) => createAction({ ...values, createdBy: user?.id ?? null }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["actions"] });
      setFormMode("create");
      setFormOpen(false);
      setSelectedItem(null);
    }
  });
  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: SaveActionInput }) => updateAction(id, values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["actions"] });
      await queryClient.invalidateQueries({ queryKey: ["actions-needing-verification"] });
      setFormMode("create");
      setFormOpen(false);
      setSelectedItem(null);
    }
  });
  const deleteMutation = useMutation({
    mutationFn: deleteAction,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["actions"] });
    }
  });
  const extensionDecisionMutation = useMutation({
    mutationFn: decideExtensionRequest,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["pending-extension-approvals"] });
      await queryClient.invalidateQueries({ queryKey: ["action-details"] });
      await queryClient.invalidateQueries({ queryKey: ["actions"] });
    }
  });

  useEffect(() => {
    if (!hasSearchParamFilters(searchParams)) return;
    setFilters(getFiltersFromSearchParams(searchParams));
    setFormOpen(false);
  }, [searchParams]);

  const items = actionsQuery.data ?? [];
  const sortedItems = useMemo(
    () =>
      sortByConfig(items, sortConfig, (item, key) => {
        switch (key) {
          case "action":
            return `${item.actionNo} ${item.title}`;
          case "responsible":
            return item.responsibleUserName || "Unassigned";
          case "priority":
            return item.priorityName || item.priorityCode;
          case "status":
            return item.statusName || item.statusCode;
          case "progress":
            return item.progressPercent;
          case "due":
            return item.latestExtensionUntil || item.dueDate;
          default:
            return "";
        }
      }),
    [items, sortConfig]
  );
  const pendingExtensionItems = pendingExtensionsQuery.data ?? [];
  const verificationItems = verificationQueueQuery.data ?? [];
  const totalActions = sortedItems.length;
  const totalPages = Math.max(1, Math.ceil(totalActions / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageStartIndex = totalActions ? (currentPage - 1) * pageSize : 0;
  const pageEndIndex = Math.min(pageStartIndex + pageSize, totalActions);
  const paginatedItems = useMemo(
    () => sortedItems.slice(pageStartIndex, pageEndIndex),
    [sortedItems, pageStartIndex, pageEndIndex]
  );

  useEffect(() => {
    setPage(1);
  }, [filters, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const updateFilters = (next: ActionFilters) => {
    setFilters(next);
  };

  const resetFilters = () => {
    setFilters(initialFilters);
    setSearchParams({});
  };

  const activeSourceLabel = useMemo(
    () => lookupsQuery.data?.sources.find((item) => item.id === filters.sourceId)?.label ?? "",
    [filters.sourceId, lookupsQuery.data]
  );
  const activeRecommendationLabel = useMemo(
    () => lookupsQuery.data?.recommendations.find((item) => item.id === filters.recommendationId)?.label ?? "",
    [filters.recommendationId, lookupsQuery.data]
  );
  const activeResponsibleDepartmentLabel = useMemo(() => {
    if (filters.responsibleDepartmentId === "__unassigned__") return "No responsible department";
    return lookupsQuery.data?.departments.find((item) => item.id === filters.responsibleDepartmentId)?.label ?? "";
  }, [filters.responsibleDepartmentId, lookupsQuery.data]);
  const hasActiveFilters = Boolean(
    filters.search ||
      filters.statusCode ||
      filters.priorityCode ||
      filters.responsibleUserId ||
      filters.responsibleManualName ||
      filters.responsibleDepartmentId ||
      filters.dashboardFilter ||
      filters.recommendationId ||
      filters.sourceId ||
      filters.overdueOnly
  );
  const stats = useMemo(() => {
    const total = items.length;
    const overdue = items.filter((item) => getIsOverdue(item)).length;
    const closed = items.filter((item) => item.statusCode === "closed" || item.statusCode === "verified").length;
    const open = total - closed;
    return { total, overdue, closed, open };
  }, [items]);

  const submitForm = async (values: SaveActionInput) => {
    if (formMode === "edit" && selectedItem) {
      await updateMutation.mutateAsync({ id: selectedItem.id, values });
      return;
    }
    await createMutation.mutateAsync(values);
  };

  return (
    <>
      <div className="space-y-3 sm:space-y-4 lg:-mx-6 xl:-mx-12 2xl:-mx-20">
        <FeatureIntro
          title="Actions"
          description="Monitor actions in a wider register view. The new action form stays collapsed by default so the list remains clear."
          actions={canManage ? (
            <Button
              onClick={() => {
                setFormMode("create");
                setSelectedItem(null);
                setFormOpen((current) => !current || formMode === "edit");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              {formOpen && formMode === "create" ? "Hide action form" : "New action"}
            </Button>
          ) : (
            <Badge tone="amber">Read only</Badge>
          )}
        />

        {(canApproveExtensions || canVerifyActions) ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {canApproveExtensions ? (
              <QuickQueueStrip
                title="Manage extension requests"
                description="Pending requests raised by Action Responsible or Owner. Approval is reserved to PSM Manager and Admin."
                tone={pendingExtensionItems.length ? "amber" : "slate"}
                count={pendingExtensionItems.length}
                actionLabel="Open queue"
                loading={pendingExtensionsQuery.isLoading}
                onOpen={() => setQueueModal("extensions")}
              />
            ) : null}
            {canVerifyActions ? (
              <QuickQueueStrip
                title="Completed Actions need verification"
                description="Review completed actions that still need final verification before closure."
                tone={verificationItems.length ? "blue" : "slate"}
                count={verificationItems.length}
                actionLabel="Review items"
                loading={verificationQueueQuery.isLoading}
                onOpen={() => setQueueModal("verification")}
              />
            ) : null}
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total actions" value={stats.total} compact />
          <StatCard label="Open / active" value={stats.open} tone="blue" compact />
          <StatCard label="Overdue" value={stats.overdue} tone="red" compact />
          <StatCard label="Closed / verified" value={stats.closed} tone="green" compact />
        </div>

        {canManage ? (
          <Card className="overflow-hidden border-blue-200/80 bg-gradient-to-r from-blue-50 via-white to-cyan-50 shadow-md ring-1 ring-blue-100/80">
            <CardHeader className="p-3 sm:p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-xl font-black text-white shadow-sm">
                    +
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle>{formMode === "edit" ? "Edit selected action" : "Add new action"}</CardTitle>
                      <Badge tone={formOpen ? "blue" : "slate"}>{formOpen ? "Form open" : "Collapsed by default"}</Badge>
                    </div>
                    <CardDescription>
                      Use this highlighted card only when you need to create or edit an action; keep it collapsed for a wider monitoring view.
                    </CardDescription>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formOpen ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setFormMode("create");
                        setSelectedItem(null);
                        setFormOpen(false);
                      }}
                    >
                      Collapse form
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    className="bg-blue-700 text-white shadow-sm hover:bg-blue-800"
                    onClick={() => {
                      setFormMode("create");
                      setSelectedItem(null);
                      setFormOpen(true);
                    }}
                  >
                    {formOpen ? "New blank action" : "Open new action form"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            {formOpen ? (
              <CardContent className="border-t border-blue-100 bg-white/75 p-3 sm:p-4">
                <div className="mx-auto max-w-6xl">
                  <ActionForm
                    open={formOpen}
                    canManage={canManage}
                    lookups={lookupsQuery.data}
                    initialItem={selectedItem}
                    loading={createMutation.isPending || updateMutation.isPending}
                    onCancel={() => {
                      setFormMode("create");
                      setSelectedItem(null);
                      setFormOpen(false);
                    }}
                    onSubmit={submitForm}
                  />
                </div>
              </CardContent>
            ) : null}
          </Card>
        ) : null}

        <Card className="min-w-0 overflow-hidden border-slate-200/90 bg-white/95 shadow-sm ring-1 ring-white/70">
          <CardHeader className="border-b border-slate-100 bg-white p-3 sm:p-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle>Action register</CardTitle>
                  {hasActiveFilters ? <Badge tone="blue">Filtered view</Badge> : <Badge tone="slate">Full register</Badge>}
                </div>
                <CardDescription>
                  Full-width register with filters, pagination, and quick access to details or edit.
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                {canManage ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setFormMode("create");
                      setSelectedItem(null);
                      setFormOpen(true);
                    }}
                  >
                    Add action
                  </Button>
                ) : null}
                <Button type="button" onClick={() => void actionsQuery.refetch()} disabled={actionsQuery.isFetching}>
                  {actionsQuery.isFetching ? "Refreshing..." : "Refresh list"}
                </Button>
                <Button type="button" variant="outline" onClick={resetFilters}>
                  Clear filters
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="min-w-0 space-y-2 overflow-hidden p-2 sm:p-3">
            <ActionFiltersPanel
              filters={filters}
              lookups={lookupsQuery.data}
              onChange={updateFilters}
              onReset={resetFilters}
            />

            <div className="grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 xl:grid-cols-[1fr_auto] xl:items-center">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="font-semibold text-slate-800">
                  Showing {totalActions ? pageStartIndex + 1 : 0}-{pageEndIndex} of {totalActions} action{totalActions === 1 ? "" : "s"}
                </span>
                {hasActiveFilters ? <Badge tone="blue">Filtered</Badge> : <Badge tone="slate">All records</Badge>}
                {activeSourceLabel ? (
                  <Badge tone="slate">
                    Source: <BidiText className="ms-1">{activeSourceLabel}</BidiText>
                  </Badge>
                ) : null}
                {activeRecommendationLabel ? (
                  <Badge tone="slate">
                    Recommendation: <BidiText className="ms-1">{activeRecommendationLabel}</BidiText>
                  </Badge>
                ) : null}
                {filters.statusCode ? <Badge tone="slate">Status applied</Badge> : null}
                {filters.priorityCode ? <Badge tone="slate">Priority applied</Badge> : null}
                {filters.responsibleUserId || filters.responsibleManualName ? <Badge tone="slate">Responsible applied</Badge> : null}
                {activeResponsibleDepartmentLabel ? (
                  <Badge tone="blue">
                    Department: <BidiText className="ms-1">{activeResponsibleDepartmentLabel}</BidiText>
                  </Badge>
                ) : null}
                {filters.overdueOnly ? <Badge tone="red">Overdue only</Badge> : null}
              </div>

              <ActionPaginationControls
                page={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                totalItems={totalActions}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
              />
            </div>

            {actionsQuery.isLoading ? (
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Spinner /> Loading actions...
              </div>
            ) : actionsQuery.isError ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {(actionsQuery.error as Error)?.message || "Could not load actions."}
              </div>
            ) : (
              <>
                <ActionListTable
                  items={paginatedItems}
                  canManage={canManage}
                  sortConfig={sortConfig}
                  onSort={(key) => {
                    setSortConfig((current) => nextSortConfig(current, key));
                    setPage(1);
                  }}
                  onEdit={(item) => {
                    setFormMode("edit");
                    setSelectedItem(item);
                    setFormOpen(true);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  onDelete={(item) => {
                    if (!window.confirm(`Delete action ${item.actionNo}?`)) return;
                    deleteMutation.mutate(item.id);
                  }}
                />

                {totalActions > pageSize ? (
                  <div className="flex justify-end rounded-2xl border border-slate-200 bg-white px-3 py-2">
                    <ActionPaginationControls
                      page={currentPage}
                      totalPages={totalPages}
                      pageSize={pageSize}
                      totalItems={totalActions}
                      onPageChange={setPage}
                      onPageSizeChange={setPageSize}
                    />
                  </div>
                ) : null}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <QueueModal
        open={queueModal === "extensions"}
        title="Manage extension requests"
        description="Pending requests raised by Action Responsible or Owner. Approval is reserved to PSM Manager and Admin."
        onClose={() => setQueueModal(null)}
      >
        {pendingExtensionsQuery.isLoading ? (
          <InlineLoading label="Loading pending extension requests..." />
        ) : pendingExtensionItems.length ? (
          <div className="space-y-3">
            {pendingExtensionItems.map((item) => (
              <ExtensionQueueCard
                key={item.requestId}
                item={item}
                busy={extensionDecisionMutation.isPending}
                onOpen={() => {
                  setQueueModal(null);
                  navigate(`/actions/${item.actionId}`);
                }}
                onApprove={() =>
                  extensionDecisionMutation.mutate({
                    requestId: item.requestId,
                    requestStatus: "approved",
                    decisionNote: window.prompt("Approval note", "") || "",
                    decidedBy: profile?.id ?? null
                  })
                }
                onReject={() =>
                  extensionDecisionMutation.mutate({
                    requestId: item.requestId,
                    requestStatus: "rejected",
                    decisionNote: window.prompt("Rejection note", "") || "",
                    decidedBy: profile?.id ?? null
                  })
                }
              />
            ))}
          </div>
        ) : (
          <EmptyQueueState message="No pending extension requests right now." />
        )}
      </QueueModal>

      <QueueModal
        open={queueModal === "verification"}
        title="Completed Actions need verification"
        description="Review completed actions that still require final verification before closure."
        onClose={() => setQueueModal(null)}
      >
        {verificationQueueQuery.isLoading ? (
          <InlineLoading label="Loading completed actions..." />
        ) : verificationItems.length ? (
          <div className="space-y-3">
            {verificationItems.map((item) => (
              <VerificationQueueCard
                key={item.actionId}
                item={item}
                onOpen={() => {
                  setQueueModal(null);
                  navigate(`/actions/${item.actionId}`);
                }}
              />
            ))}
          </div>
        ) : (
          <EmptyQueueState message="No completed actions are waiting for verification." />
        )}
      </QueueModal>
    </>
  );
}


function ActionPaginationControls({
  page,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange
}: {
  page: number;
  totalPages: number;
  pageSize: PageSize;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: PageSize) => void;
}) {
  const canGoPrevious = page > 1;
  const canGoNext = page < totalPages;

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
      <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
        Rows
        <Select
          value={String(pageSize)}
          onChange={(event) => onPageSizeChange(Number(event.target.value) as PageSize)}
          className="h-9 min-w-[88px] rounded-xl bg-white text-sm tracking-normal"
        >
          {pageSizeOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
      </label>

      <div className="flex items-center justify-between gap-2 sm:justify-end">
        <Button
          type="button"
          variant="outline"
          className="h-9 rounded-xl px-3 text-xs"
          disabled={!canGoPrevious || totalItems === 0}
          onClick={() => onPageChange(1)}
        >
          First
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-9 rounded-xl px-3 text-xs"
          disabled={!canGoPrevious || totalItems === 0}
          onClick={() => onPageChange(page - 1)}
        >
          Prev
        </Button>
        <span className="min-w-[92px] text-center text-xs font-black text-slate-700">
          {totalItems === 0 ? "Page 0 / 0" : `Page ${page} / ${totalPages}`}
        </span>
        <Button
          type="button"
          variant="outline"
          className="h-9 rounded-xl px-3 text-xs"
          disabled={!canGoNext || totalItems === 0}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-9 rounded-xl px-3 text-xs"
          disabled={!canGoNext || totalItems === 0}
          onClick={() => onPageChange(totalPages)}
        >
          Last
        </Button>
      </div>
    </div>
  );
}

function QuickQueueStrip({
  title,
  description,
  tone,
  count,
  actionLabel,
  loading,
  onOpen
}: {
  title: string;
  description: string;
  tone: "slate" | "amber" | "blue";
  count: number;
  actionLabel: string;
  loading?: boolean;
  onOpen: () => void;
}) {
  return (
    <Card className="border-slate-200/90 bg-white/95">
      <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between md:p-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-sm font-semibold text-slate-950">{title}</div>
            <Badge tone={tone}>{loading ? "Loading" : `${count} item${count === 1 ? "" : "s"}`}</Badge>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {loading ? <Spinner /> : null}
          <Button variant="outline" onClick={onOpen} disabled={loading}>
            {actionLabel}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function QueueModal({
  open,
  title,
  description,
  onClose,
  children
}: {
  open: boolean;
  title: string;
  description: string;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-6">
      <div className="absolute inset-0" onClick={onClose} />
      <Card className="relative z-10 max-h-[85vh] w-full max-w-4xl overflow-hidden rounded-3xl border-slate-200">
        <CardHeader className="border-b border-slate-200 bg-slate-50">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          </div>
        </CardHeader>
        <CardContent className="max-h-[calc(85vh-96px)] overflow-y-auto p-4 md:p-5">{children}</CardContent>
      </Card>
    </div>
  );
}

function ExtensionQueueCard({
  item,
  busy,
  onOpen,
  onApprove,
  onReject
}: {
  item: PendingExtensionQueueItem;
  busy?: boolean;
  onOpen: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <div dir="ltr" className="bidi-code-token text-sm font-semibold text-slate-950">{item.actionNo}</div>
            <Badge tone="slate" dir="ltr" className="bidi-code-token">{item.sourceNo}</Badge>
            <Badge tone="amber">Pending</Badge>
          </div>
          <BidiBlock className="mt-2 text-sm font-medium text-slate-900">{item.title}</BidiBlock>
          <div className="mt-2 text-xs text-slate-500">
            Recommendation <span dir="ltr" className="bidi-code-token">{item.recommendationNo}</span> • Responsible: <BidiText>{item.responsibleName}</BidiText>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Requested by <BidiText>{item.requestedByName}</BidiText> • until {item.requestedUntil}
          </div>
          <BidiBlock className="mt-3 text-sm leading-6 text-slate-700">{item.reason}</BidiBlock>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button variant="outline" onClick={onOpen}>
            Open action
          </Button>
          <Button
            variant="outline"
            className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
            disabled={busy}
            onClick={onApprove}
          >
            Approve
          </Button>
          <Button
            variant="outline"
            className="border-red-300 text-red-700 hover:bg-red-50"
            disabled={busy}
            onClick={onReject}
          >
            Reject
          </Button>
        </div>
      </div>
    </div>
  );
}

function VerificationQueueCard({ item, onOpen }: { item: VerificationQueueItem; onOpen: () => void }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <div dir="ltr" className="bidi-code-token text-sm font-semibold text-slate-950">{item.actionNo}</div>
            <Badge tone="slate" dir="ltr" className="bidi-code-token">{item.sourceNo}</Badge>
            <Badge tone={item.statusTone === "red" ? "red" : item.statusTone === "amber" ? "amber" : item.statusTone === "green" ? "green" : item.statusTone === "blue" ? "blue" : "slate"}>
              {item.statusName}
            </Badge>
          </div>
          <BidiBlock className="mt-2 text-sm font-medium text-slate-900">{item.title}</BidiBlock>
          <div className="mt-2 text-xs text-slate-500">
            Recommendation <span dir="ltr" className="bidi-code-token">{item.recommendationNo}</span> • Responsible: <BidiText>{item.responsibleName}</BidiText> • Owner: <BidiText>{item.ownerName}</BidiText>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Completed on {item.completedDate} • Effective due date {item.latestExtensionUntil || item.dueDate}
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" onClick={onOpen}>
            Open action
          </Button>
        </div>
      </div>
    </div>
  );
}

function EmptyQueueState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-600">
      {message}
    </div>
  );
}

function InlineLoading({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-600">
      <Spinner />
      <span>{label}</span>
    </div>
  );
}
