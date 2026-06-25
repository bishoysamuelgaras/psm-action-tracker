import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { BidiBlock, BidiText } from "@/components/ui/bidi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FeatureIntro } from "@/components/ui/feature-intro";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { StatCard } from "@/components/ui/stat-card";
import { listAuditLogs, type AuditLogRow } from "@/features/logs/api/logs.api";
import { formatDateTimeLabel } from "@/lib/utils";

const ENTITY_OPTIONS = [
  { value: "all", label: "All modules" },
  { value: "auth", label: "Auth" },
  { value: "source", label: "Sources" },
  { value: "recommendation", label: "Recommendations" },
  { value: "action", label: "Actions" },
  { value: "action_update", label: "Action updates" },
  { value: "extension_request", label: "Extension requests" },
  { value: "profile", label: "Users & access" },
  { value: "other", label: "Other" }
] as const;

const EVENT_OPTIONS = [
  { value: "all", label: "All events" },
  { value: "login", label: "Login" },
  { value: "logout", label: "Logout" },
  { value: "create", label: "Create" },
  { value: "update", label: "Update" },
  { value: "delete", label: "Delete" },
  { value: "request", label: "Request" },
  { value: "decision", label: "Decision" },
  { value: "other", label: "Other" }
] as const;

function eventTone(eventType: string) {
  switch (eventType) {
    case "login":
      return "green" as const;
    case "logout":
      return "slate" as const;
    case "create":
      return "blue" as const;
    case "update":
      return "amber" as const;
    case "delete":
      return "red" as const;
    case "decision":
      return "blue" as const;
    case "request":
      return "blue" as const;
    default:
      return "slate" as const;
  }
}

function moduleTone(entityType: string) {
  switch (entityType) {
    case "auth":
      return "blue" as const;
    case "source":
      return "blue" as const;
    case "recommendation":
      return "blue" as const;
    case "action":
      return "amber" as const;
    case "action_update":
      return "green" as const;
    case "extension_request":
      return "red" as const;
    case "profile":
      return "slate" as const;
    default:
      return "slate" as const;
  }
}

function mapEntityLabel(value: string) {
  return ENTITY_OPTIONS.find((item) => item.value === value)?.label ?? value;
}

function mapEventLabel(value: string) {
  return EVENT_OPTIONS.find((item) => item.value === value)?.label ?? value;
}

function renderDetails(details: AuditLogRow["details"]) {
  if (!details || typeof details !== "object" || Array.isArray(details)) {
    return null;
  }

  const entries = Object.entries(details)
    .filter(([, value]) => value !== null && value !== "")
    .slice(0, 6);

  if (!entries.length) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {entries.map(([key, value]) => (
        <span key={key} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] text-slate-600">
          <span className="font-semibold text-slate-700">{key}</span>
          {": "}
          <BidiText>{typeof value === "object" ? JSON.stringify(value) : String(value)}</BidiText>
        </span>
      ))}
    </div>
  );
}

export function LogsPage() {
  const [search, setSearch] = useState("");
  const [entityType, setEntityType] = useState("all");
  const [eventType, setEventType] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 25;

  useEffect(() => {
    setPage(1);
  }, [search, entityType, eventType]);

  const logsQuery = useQuery({
    queryKey: ["audit-logs", search, entityType, eventType, page, pageSize],
    queryFn: () => listAuditLogs({ search, entityType, eventType, page, pageSize })
  });

  const rows = logsQuery.data?.rows ?? [];
  const total = logsQuery.data?.total ?? 0;
  const totalPages = logsQuery.data?.totalPages ?? 1;

  const summary = useMemo(
    () =>
      rows.reduce(
        (acc, item) => {
          acc.pageRows += 1;
          if (item.entityType === "auth") acc.auth += 1;
          if (item.eventType === "delete") acc.deletes += 1;
          return acc;
        },
        { pageRows: 0, auth: 0, deletes: 0 }
      ),
    [rows]
  );

  return (
    <div className="space-y-5">
      <FeatureIntro
        title="Logs"
        description="One place for authentication events and important changes across sources, recommendations, actions, and related follow-up records."
        actions={logsQuery.isFetching ? <Spinner /> : undefined}
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Matching logs" value={total} compact />
        <StatCard label="Rows on page" value={summary.pageRows} tone="blue" compact />
        <StatCard label="Auth events" value={summary.auth} tone="green" compact />
        <StatCard label="Delete events" value={summary.deletes} tone="red" compact />
      </section>

      <Card>
        <CardContent className="grid gap-3 pt-6 md:grid-cols-2 xl:grid-cols-[1.4fr_0.8fr_0.8fr_auto]">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search actor, email, message, or entity label"
          />
          <Select value={entityType} onChange={(event) => setEntityType(event.target.value)}>
            {ENTITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <Select value={eventType} onChange={(event) => setEventType(event.target.value)}>
            {EVENT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setSearch("");
              setEntityType("all");
              setEventType("all");
            }}
          >
            Reset
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>Activity register</CardTitle>
          <div className="text-sm text-slate-500">
            Page {page} of {totalPages}
          </div>
        </CardHeader>
        <CardContent>
          {logsQuery.isLoading ? (
            <div className="flex min-h-[280px] items-center justify-center">
              <Spinner />
            </div>
          ) : logsQuery.error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {logsQuery.error instanceof Error ? logsQuery.error.message : "Failed to load logs."}
            </div>
          ) : !rows.length ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
              No logs found for the current filters.
            </div>
          ) : (
            <div className="space-y-3">
              {rows.map((item) => (
                <div key={item.id} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={eventTone(item.eventType)}>{mapEventLabel(item.eventType)}</Badge>
                        <Badge tone={moduleTone(item.entityType)}>{mapEntityLabel(item.entityType)}</Badge>
                        {item.entityLabel ? (
                          <BidiText className="truncate text-sm font-semibold text-slate-900">{item.entityLabel}</BidiText>
                        ) : null}
                      </div>
                      <BidiBlock className="mt-2 text-sm font-semibold text-slate-900">{item.message}</BidiBlock>
                      <div className="mt-1 text-sm text-slate-600">
                        <BidiText>{item.actorName || item.actorEmail || "System"}</BidiText>
                        {item.actorEmail && item.actorName ? <> • <BidiText>{item.actorEmail}</BidiText></> : ""}
                        {item.actorRole ? <> • <BidiText>{item.actorRole}</BidiText></> : ""}
                      </div>
                      {renderDetails(item.details)}
                    </div>

                    <div className="text-right text-xs text-slate-500">
                      <div>{formatDateTimeLabel(item.occurredAt)}</div>
                      {item.entityId ? <div className="mt-1 break-all">ID: {item.entityId}</div> : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="text-sm text-slate-600">
              Showing {(page - 1) * pageSize + (rows.length ? 1 : 0)}-{(page - 1) * pageSize + rows.length} of {total}
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1 || logsQuery.isFetching}
              >
                Previous
              </Button>
              <div className="min-w-[82px] text-center text-sm font-semibold text-slate-700">
                {page} / {totalPages}
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={page >= totalPages || logsQuery.isFetching}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
