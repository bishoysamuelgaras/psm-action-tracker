import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { BidiBlock, BidiText } from "@/components/ui/bidi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
  createActionUpdate,
  createExtensionRequest,
  decideExtensionRequest,
  deleteActionAttachment,
  getActionAttachmentDownloadUrl,
  getActionDetails,
  getIsOverdue,
  listActionLookups,
  type SaveActionInput,
  updateAction,
  uploadActionAttachment
} from "@/features/actions/api/actions.api";
import { ActionAttachmentUploader } from "@/features/actions/components/ActionAttachmentUploader";
import { getPriorityBadgeLabel } from "@/lib/priority";
import { ActionUpdateForm } from "@/features/actions/components/ActionUpdateForm";
import { ActionUpdatesTimeline } from "@/features/actions/components/ActionUpdatesTimeline";
import { ExtensionRequestForm } from "@/features/actions/components/ExtensionRequestForm";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useRoleAccess } from "@/features/auth/hooks/useRoleAccess";
import { formatDateLabel } from "@/lib/utils";

function badgeToneFromApi(value: string): "slate" | "red" | "amber" | "green" | "blue" {
  if (value === "red") return "red";
  if (value === "amber") return "amber";
  if (value === "green") return "green";
  if (value === "blue") return "blue";
  return "slate";
}

function formatFileSize(bytes: number | null) {
  if (!bytes && bytes !== 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(kb >= 100 ? 0 : 1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(mb >= 10 ? 0 : 2)} MB`;
}

function buildVerifyPayload(action: Awaited<ReturnType<typeof getActionDetails>>["action"]): SaveActionInput {
  const today = new Date().toISOString().slice(0, 10);

  return {
    recommendationId: action.recommendationId,
    actionNo: action.actionNo,
    title: action.title,
    description: action.description,
    responsibleUserId: action.responsibleUserId,
    responsibleNameManual: action.responsibleNameManual,
    ownerUserId: action.ownerUserId,
    ownerNameManual: action.ownerNameManual,
    verifierUserId: action.verifierUserId,
    verifierNameManual: action.verifierNameManual,
    priorityCode: action.priorityCode,
    statusCode: "verified",
    startDate: action.startDate,
    dueDate: action.dueDate,
    completedDate: action.completedDate || today,
    verifiedDate: today,
    progressPercent: action.progressPercent ? Math.max(action.progressPercent, 100) : 100,
    latestExtensionUntil: action.latestExtensionUntil,
    extensionReason: action.extensionReason,
    evidenceSummary: action.evidenceSummary
  };
}

export function ActionDetailsPage() {
  const { actionId = "" } = useParams();
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();
  const { canManageActions, canUpdateAssignedActions, canApproveExtensions, canVerifyActions } = useRoleAccess();
  const canManage = canManageActions;

  const lookupsQuery = useQuery({
    queryKey: ["action-lookups"],
    queryFn: listActionLookups,
    staleTime: 5 * 60_000
  });
  const detailsQuery = useQuery({
    queryKey: ["action-details", actionId],
    queryFn: () => getActionDetails(actionId),
    enabled: Boolean(actionId)
  });
  const updateMutation = useMutation({
    mutationFn: createActionUpdate,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["action-details", actionId] });
      await queryClient.invalidateQueries({ queryKey: ["actions"] });
    }
  });
  const extensionMutation = useMutation({
    mutationFn: createExtensionRequest,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["action-details", actionId] });
    }
  });
  const decisionMutation = useMutation({
    mutationFn: decideExtensionRequest,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["action-details", actionId] });
      await queryClient.invalidateQueries({ queryKey: ["actions"] });
      await queryClient.invalidateQueries({ queryKey: ["pending-extension-approvals"] });
    }
  });
  const verifyMutation = useMutation({
    mutationFn: async (values: SaveActionInput) => updateAction(actionId, values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["action-details", actionId] });
      await queryClient.invalidateQueries({ queryKey: ["actions"] });
      await queryClient.invalidateQueries({ queryKey: ["actions-needing-verification"] });
    }
  });
  const uploadAttachmentMutation = useMutation({
    mutationFn: uploadActionAttachment,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["action-details", actionId] });
    }
  });
  const deleteAttachmentMutation = useMutation({
    mutationFn: deleteActionAttachment,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["action-details", actionId] });
    }
  });

  const details = detailsQuery.data;

  if (detailsQuery.isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (detailsQuery.error || !details) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Action details</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  const { action } = details;
  const overdue = getIsOverdue(action);
  const isResponsibleOrOwner = Boolean(
    user?.id && [action.responsibleUserId, action.ownerUserId].filter((value): value is string => Boolean(value)).includes(user.id)
  );
  const participantIds = [action.responsibleUserId, action.ownerUserId, action.verifierUserId].filter(
    (value): value is string => Boolean(value)
  );
  const canSubmitProgress = canManage || canUpdateAssignedActions || Boolean(user?.id && participantIds.includes(user.id));
  const canRequestExtension = isResponsibleOrOwner || canApproveExtensions;
  const canApproveExtension = canApproveExtensions;
  const canVerifyCurrentAction = canVerifyActions && Boolean(action.completedDate) && !action.verifiedDate;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-sm text-slate-500">
            <Link to="/actions" className="font-medium text-slate-700 hover:text-slate-950">
              Actions
            </Link>
            <span className="mx-2">/</span>
            <span dir="ltr" className="bidi-code-token">{action.actionNo}</span>
          </div>
          <BidiBlock className="mt-2 text-2xl font-bold text-slate-900">{action.title}</BidiBlock>
          <BidiBlock className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">{action.description || "—"}</BidiBlock>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={badgeToneFromApi(action.priorityTone)}>{getPriorityBadgeLabel(action.priorityCode, action.priorityName)}</Badge>
          <Badge tone={badgeToneFromApi(action.statusTone)}>{action.statusName}</Badge>
          {overdue ? <Badge tone="red">Overdue</Badge> : null}
          {canVerifyCurrentAction ? (
            <Button
              variant="outline"
              className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
              disabled={verifyMutation.isPending}
              onClick={() => {
                if (!window.confirm(`Mark ${action.actionNo} as verified?`)) return;
                verifyMutation.mutate(buildVerifyPayload(action));
              }}
            >
              {verifyMutation.isPending ? "Verifying..." : "Mark as verified"}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <Info label="Action no" value={action.actionNo} />
                <Info label="Source" value={`${action.sourceNo} — ${action.sourceTitle}`} />
                <Info label="Recommendation" value={action.recommendationNo} />
                <Info label="Responsible" value={action.responsibleUserName} />
                <Info label="Owner" value={action.ownerUserName} />
                <Info label="Verifier" value={action.verifierUserName} />
                <Info label="Start date" value={action.startDate || "—"} />
                <Info label="Current due date" value={action.dueDate} />
                <Info label="Completed" value={action.completedDate || "—"} />
                <Info label="Verified" value={action.verifiedDate || "—"} />
                <Info label="Progress" value={`${action.progressPercent}%`} />
                <Info
                  label="Previous due date ref"
                  value={
                    details.extensionRequests.find((item) => item.requestStatus === "approved" && item.previousDueDate)?.previousDueDate || "—"
                  }
                />
              </div>
              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm font-semibold text-slate-800">Recommendation text</div>
                <BidiBlock className="mt-2 text-sm leading-7 text-slate-700">{action.recommendationText}</BidiBlock>
              </div>
              {action.evidenceSummary ? (
                <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <div className="text-sm font-semibold text-emerald-900">Evidence summary</div>
                  <BidiBlock className="mt-2 text-sm leading-7 text-emerald-900/90">{action.evidenceSummary}</BidiBlock>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Progress updates</CardTitle>
            </CardHeader>
            <CardContent>
              {canSubmitProgress ? (
                <ActionUpdateForm
                  actionId={action.id}
                  statuses={lookupsQuery.data?.statuses ?? []}
                  canSubmit={canSubmitProgress}
                  loading={updateMutation.isPending}
                  onSubmit={async (values) => {
                    await updateMutation.mutateAsync(values);
                  }}
                />
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  Read-only updates view.
                </div>
              )}
              <div className="mt-6">
                <ActionUpdatesTimeline items={details.updates} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">History</CardTitle>
            </CardHeader>
            <CardContent>
              <ActionHistoryList items={details.history} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Extension requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <span className="font-semibold text-slate-900">Policy:</span> extension requests can be created by the action Responsible, Owner, PSM Manager, or Admin. Approval is reserved to PSM Manager and Admin.
              </div>

              <div className="mt-4">
                {canRequestExtension ? (
                  <ExtensionRequestForm
                    actionId={action.id}
                    canSubmit={canRequestExtension}
                    loading={extensionMutation.isPending}
                    onSubmit={async (values) => {
                      await extensionMutation.mutateAsync(values);
                    }}
                  />
                ) : (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    Read-only extension view.
                  </div>
                )}
              </div>

              <div className="mt-6 space-y-3">
                {details.extensionRequests.length ? (
                  details.extensionRequests.map((request) => (
                    <div key={request.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-sm font-semibold text-slate-900">
                          Requested until {request.requestedUntil}
                        </div>
                        <Badge
                          tone={
                            request.requestStatus === "approved"
                              ? "green"
                              : request.requestStatus === "rejected"
                                ? "red"
                                : "amber"
                          }
                        >
                          {request.requestStatus}
                        </Badge>
                      </div>
                      <BidiBlock className="mt-3 text-sm leading-7 text-slate-700">{request.reason}</BidiBlock>
                      {request.requestStatus === "approved" && request.previousDueDate ? (
                        <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900">
                          Due date updated from {request.previousDueDate} to {request.requestedUntil}.
                        </div>
                      ) : null}
                      <div className="mt-3 text-xs text-slate-500">
                        Requested by <BidiText>{request.requestedByName}</BidiText> • {new Date(request.createdAt).toLocaleString()}
                      </div>
                      {request.decisionNote ? (
                        <div className="mt-2 text-xs text-slate-500">Decision note: <BidiText>{request.decisionNote}</BidiText></div>
                      ) : null}
                      {request.decidedAt ? (
                        <div className="mt-1 text-xs text-slate-500">
                          Decided by <BidiText>{request.decidedByName}</BidiText> • {new Date(request.decidedAt).toLocaleString()}
                        </div>
                      ) : null}
                      {canApproveExtension && request.requestStatus === "pending" ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                            onClick={() =>
                              decisionMutation.mutate({
                                requestId: request.id,
                                requestStatus: "approved",
                                decisionNote: window.prompt("Approval note", "") || "",
                                decidedBy: profile?.id ?? null
                              })
                            }
                          >
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            className="border-red-300 text-red-700 hover:bg-red-50"
                            onClick={() =>
                              decisionMutation.mutate({
                                requestId: request.id,
                                requestStatus: "rejected",
                                decisionNote: window.prompt("Rejection note", "") || "",
                                decidedBy: profile?.id ?? null
                              })
                            }
                          >
                            Reject
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-slate-500">No extension requests yet.</div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Attachments</CardTitle>
            </CardHeader>
            <CardContent>
              {canSubmitProgress ? (
                <ActionAttachmentUploader
                  actionId={action.id}
                  canUpload={canSubmitProgress}
                  loading={uploadAttachmentMutation.isPending}
                  onUpload={async (values) => {
                    await uploadAttachmentMutation.mutateAsync({
                      ...values,
                      uploadedBy: profile?.id ?? null
                    });
                  }}
                />
              ) : null}

              <div className="mt-6 space-y-3">
                {details.attachments.length ? (
                  details.attachments.map((attachment) => {
                    const canDelete = canManage || attachment.uploadedById === profile?.id;
                    return (
                      <div key={attachment.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <BidiText className="block text-sm font-semibold text-slate-900">{attachment.fileName}</BidiText>
                            <div className="mt-1 text-xs text-slate-500">
                              {formatFileSize(attachment.fileSizeBytes)} • {attachment.mimeType || "unknown type"}
                            </div>
                            {attachment.description ? (
                              <BidiBlock className="mt-2 text-sm leading-6 text-slate-700">{attachment.description}</BidiBlock>
                            ) : null}
                            <div className="mt-2 break-all text-xs text-slate-500">{attachment.filePath}</div>
                            <div className="mt-2 text-xs text-slate-500">
                              Uploaded by <BidiText>{attachment.uploadedByName}</BidiText> • {formatDateLabel(attachment.uploadedAt)}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant="outline"
                              onClick={async () => {
                                const signedUrl = await getActionAttachmentDownloadUrl(attachment);
                                window.open(signedUrl, "_blank", "noopener,noreferrer");
                              }}
                            >
                              Download
                            </Button>
                            {canDelete ? (
                              <Button
                                variant="outline"
                                className="border-red-300 text-red-700 hover:bg-red-50"
                                disabled={deleteAttachmentMutation.isPending}
                                onClick={() => {
                                  if (!window.confirm("Delete this attachment?")) return;
                                  deleteAttachmentMutation.mutate(attachment.id);
                                }}
                              >
                                Delete
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-sm text-slate-500">No attachment records yet.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</div>
      <BidiText className="mt-2 block text-sm font-semibold leading-6 text-slate-900">{value ?? "—"}</BidiText>
    </div>
  );
}

function ActionHistoryList({
  items
}: {
  items: Array<{
    id: string | number;
    fieldName: string;
    oldValue: unknown;
    newValue: unknown;
    changedByName: string;
    changedAt: string;
  }>;
}) {
  if (!items.length) return <div className="text-sm text-slate-500">No history yet.</div>;

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={String(item.id)} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-sm font-semibold text-slate-900">{item.fieldName}</div>
          <div className="mt-2 text-sm text-slate-700">
            <BidiText>{String(item.oldValue ?? "—")}</BidiText> → <BidiText>{String(item.newValue ?? "—")}</BidiText>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            <BidiText>{item.changedByName}</BidiText> • {new Date(item.changedAt).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}
