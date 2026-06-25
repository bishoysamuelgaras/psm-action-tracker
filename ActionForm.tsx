import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ActionAttachmentUploader } from "@/features/actions/components/ActionAttachmentUploader";
import { useAuth } from "@/features/auth/hooks/useAuth";
import {
  reserveActionNumber,
  uploadActionAttachment,
  type ActionListItem,
  type ActionLookups,
  type SaveActionInput
} from "@/features/actions/api/actions.api";

type ActionFormProps = {
  open: boolean;
  canManage: boolean;
  lookups: ActionLookups | undefined;
  initialItem?: ActionListItem | null;
  loading?: boolean;
  onCancel: () => void;
  onSubmit: (values: SaveActionInput) => Promise<void> | void;
};

type FormState = SaveActionInput;
type AssigneeMode = "system" | "manual";
type AssigneeKey = "responsible" | "owner" | "verifier";
type AssigneeModes = Record<AssigneeKey, AssigneeMode>;

type DepartmentLookup = {
  id: string;
  name: string;
  label: string;
};

const emptyState: FormState = {
  recommendationId: "",
  actionNo: "",
  title: "",
  description: "",
  responsibleUserId: "",
  responsibleNameManual: "",
  ownerUserId: "",
  ownerNameManual: "",
  verifierUserId: "",
  verifierNameManual: "",
  priorityCode: "",
  statusCode: "",
  startDate: "",
  dueDate: "",
  completedDate: "",
  verifiedDate: "",
  progressPercent: 0,
  latestExtensionUntil: "",
  extensionReason: "",
  evidenceSummary: ""
};

function normalizeOptionalText(value: string | null | undefined) {
  return value?.trim() ?? "";
}

function departmentMatch(name: string | null | undefined, departments: DepartmentLookup[]) {
  const normalized = normalizeOptionalText(name).toLowerCase();
  if (!normalized) return null;
  return departments.find((department) => department.name.trim().toLowerCase() === normalized) ?? null;
}

function resolveMode(
  userId: string | null | undefined,
  manualName: string | null | undefined,
  departments: DepartmentLookup[]
): AssigneeMode {
  if (userId) return "system";
  if (departmentMatch(manualName, departments)) return "system";
  return normalizeOptionalText(manualName) ? "manual" : "system";
}

function toFormState(item: ActionListItem | null | undefined): FormState {
  if (!item) return emptyState;
  return {
    recommendationId: item.recommendationId,
    actionNo: item.actionNo ?? "",
    title: item.title,
    description: item.description ?? "",
    responsibleUserId: item.responsibleUserId ?? "",
    responsibleNameManual: item.responsibleNameManual ?? "",
    ownerUserId: item.ownerUserId ?? "",
    ownerNameManual: item.ownerNameManual ?? "",
    verifierUserId: item.verifierUserId ?? "",
    verifierNameManual: item.verifierNameManual ?? "",
    priorityCode: item.priorityCode,
    statusCode: item.statusCode,
    startDate: item.startDate ?? "",
    dueDate: item.dueDate,
    completedDate: item.completedDate ?? "",
    verifiedDate: item.verifiedDate ?? "",
    progressPercent: item.progressPercent,
    latestExtensionUntil: item.latestExtensionUntil ?? "",
    extensionReason: "",
    evidenceSummary: ""
  };
}


function InfoTooltip({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        tabIndex={0}
        aria-label="Show role description"
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 bg-white text-[11px] font-bold text-slate-500 transition hover:border-slate-400 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300"
      >
        i
      </button>
      <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 hidden w-64 -translate-x-1/2 rounded-2xl border border-slate-200 bg-slate-950 px-3 py-2 text-xs font-medium leading-5 text-white shadow-xl group-hover:block group-focus-within:block">
        {text}
      </span>
    </span>
  );
}

function SnapshotItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className="mt-2 text-sm font-semibold text-slate-900">{value || "—"}</div>
    </div>
  );
}

export function ActionForm({
  open,
  canManage,
  lookups,
  initialItem,
  loading = false,
  onCancel,
  onSubmit
}: ActionFormProps) {
  const [values, setValues] = useState<FormState>(emptyState);
  const [assigneeModes, setAssigneeModes] = useState<AssigneeModes>({
    responsible: "system",
    owner: "system",
    verifier: "system"
  });
  const [numberBusy, setNumberBusy] = useState(false);
  const [numberHint, setNumberHint] = useState("Select recommendation to preview the next action number.");
  const [attachmentBusy, setAttachmentBusy] = useState(false);
  const [attachmentMessage, setAttachmentMessage] = useState("");
  const isEditing = Boolean(initialItem?.id);
  const { profile } = useAuth();

  const recommendations = useMemo(() => lookups?.recommendations ?? [], [lookups]);
  const users = useMemo(() => lookups?.users ?? [], [lookups]);
  const departments = useMemo(() => lookups?.departments ?? [], [lookups]);
  const selectedRecommendation = useMemo(
    () => recommendations.find((item) => item.id === values.recommendationId) ?? null,
    [recommendations, values.recommendationId]
  );

  useEffect(() => {
    if (!open) return;
    setValues(toFormState(initialItem));
    setAssigneeModes({
      responsible: resolveMode(initialItem?.responsibleUserId, initialItem?.responsibleNameManual, departments),
      owner: resolveMode(initialItem?.ownerUserId, initialItem?.ownerNameManual, departments),
      verifier: resolveMode(initialItem?.verifierUserId, initialItem?.verifierNameManual, departments)
    });
    setNumberHint(
      initialItem?.id ? "This number is locked after creation." : "Select recommendation to preview the next action number."
    );
  }, [departments, initialItem, open]);

  useEffect(() => {
    if (!open || isEditing || !canManage) return;

    if (!values.recommendationId) {
      setValues((current) => ({ ...current, actionNo: "" }));
      setNumberBusy(false);
      setNumberHint("Select recommendation to preview the next action number.");
      return;
    }

    let active = true;
    setNumberBusy(true);
    setNumberHint("Loading next number preview...");

    void reserveActionNumber(values.recommendationId)
      .then((actionNo) => {
        if (!active) return;
        setValues((current) => {
          if (current.recommendationId !== values.recommendationId || isEditing) return current;
          return { ...current, actionNo };
        });
        setNumberHint("Previewed automatically from the selected recommendation.");
      })
      .catch((error) => {
        if (!active) return;
        setValues((current) => ({ ...current, actionNo: "" }));
        setNumberHint(error instanceof Error ? error.message : "Failed to load action number preview.");
      })
      .finally(() => {
        if (active) setNumberBusy(false);
      });

    return () => {
      active = false;
    };
  }, [canManage, isEditing, open, values.recommendationId]);



  const handleAttachmentUpload = async (input: { actionId: string; file: File; description?: string | null }) => {
    setAttachmentBusy(true);
    setAttachmentMessage("");
    try {
      await uploadActionAttachment({
        ...input,
        uploadedBy: profile?.id ?? null
      });
      setAttachmentMessage("Attachment uploaded successfully.");
    } catch (error) {
      setAttachmentMessage(error instanceof Error ? error.message : "Attachment upload failed.");
      throw error;
    } finally {
      setAttachmentBusy(false);
    }
  };

  const assigneeDisplay = {
    responsible:
      users.find((user) => user.id === values.responsibleUserId)?.fullName || normalizeOptionalText(values.responsibleNameManual) || "Unassigned",
    owner:
      users.find((user) => user.id === values.ownerUserId)?.fullName || normalizeOptionalText(values.ownerNameManual) || "Not set",
    verifier:
      users.find((user) => user.id === values.verifierUserId)?.fullName || normalizeOptionalText(values.verifierNameManual) || "Not set"
  };

  const updateAssigneeMode = (key: AssigneeKey, mode: AssigneeMode) => {
    setAssigneeModes((current) => ({ ...current, [key]: mode }));
    setValues((current) => {
      if (key === "responsible") {
        return {
          ...current,
          responsibleUserId: mode === "system" ? current.responsibleUserId : "",
          responsibleNameManual: mode === "manual" ? current.responsibleNameManual : ""
        };
      }
      if (key === "owner") {
        return {
          ...current,
          ownerUserId: mode === "system" ? current.ownerUserId : "",
          ownerNameManual: mode === "manual" ? current.ownerNameManual : ""
        };
      }
      return {
        ...current,
        verifierUserId: mode === "system" ? current.verifierUserId : "",
        verifierNameManual: mode === "manual" ? current.verifierNameManual : ""
      };
    });
  };

  const systemSelectValue = (key: AssigneeKey) => {
    if (key === "responsible") {
      if (values.responsibleUserId) return `user:${values.responsibleUserId}`;
      const matchedDepartment = departmentMatch(values.responsibleNameManual, departments);
      return matchedDepartment ? `department:${matchedDepartment.name}` : "";
    }
    if (key === "owner") {
      if (values.ownerUserId) return `user:${values.ownerUserId}`;
      const matchedDepartment = departmentMatch(values.ownerNameManual, departments);
      return matchedDepartment ? `department:${matchedDepartment.name}` : "";
    }
    if (values.verifierUserId) return `user:${values.verifierUserId}`;
    const matchedDepartment = departmentMatch(values.verifierNameManual, departments);
    return matchedDepartment ? `department:${matchedDepartment.name}` : "";
  };

  const handleSystemAssigneeChange = (key: AssigneeKey, value: string) => {
    const [type, rawValue] = value.split(":", 2);

    setValues((current) => {
      const empty = !value;
      const isDepartment = type === "department";
      const nextUserId = empty || isDepartment ? "" : rawValue ?? "";
      const nextManualName = empty ? "" : isDepartment ? rawValue ?? "" : "";

      if (key === "responsible") {
        return {
          ...current,
          responsibleUserId: nextUserId,
          responsibleNameManual: nextManualName
        };
      }
      if (key === "owner") {
        return {
          ...current,
          ownerUserId: nextUserId,
          ownerNameManual: nextManualName
        };
      }
      return {
        ...current,
        verifierUserId: nextUserId,
        verifierNameManual: nextManualName
      };
    });
  };

  const buildSubmissionAssignee = (key: AssigneeKey) => {
    const mode = assigneeModes[key];
    if (key === "responsible") {
      const manualName = normalizeOptionalText(values.responsibleNameManual);
      return {
        userId: mode === "system" ? values.responsibleUserId || null : null,
        manualName: mode === "manual" || (!values.responsibleUserId && manualName) ? manualName || null : null
      };
    }
    if (key === "owner") {
      const manualName = normalizeOptionalText(values.ownerNameManual);
      return {
        userId: mode === "system" ? values.ownerUserId || null : null,
        manualName: mode === "manual" || (!values.ownerUserId && manualName) ? manualName || null : null
      };
    }
    const manualName = normalizeOptionalText(values.verifierNameManual);
    return {
      userId: mode === "system" ? values.verifierUserId || null : null,
      manualName: mode === "manual" || (!values.verifierUserId && manualName) ? manualName || null : null
    };
  };

  if (!open) return null;

  const responsibleSubmission = buildSubmissionAssignee("responsible");
  const ownerSubmission = buildSubmissionAssignee("owner");
  const verifierSubmission = buildSubmissionAssignee("verifier");

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-bold text-slate-900">{isEditing ? "Edit action" : "Create action"}</h3>
            <Badge tone={isEditing ? "blue" : "green"}>{isEditing ? "Existing action" : "New action"}</Badge>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Select the recommendation first, then confirm the action number and save the follow-up details.
          </p>
        </div>
        <Button variant="ghost" onClick={onCancel}>
          Close
        </Button>
      </div>

      {!canManage ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Read-only access.
        </div>
      ) : null}

      <form
        className="mt-5 space-y-4"
        onSubmit={async (event) => {
          event.preventDefault();
          if (!canManage) return;
          if (!isEditing && !values.actionNo) return;
          await onSubmit({
            ...values,
            responsibleUserId: responsibleSubmission.userId,
            responsibleNameManual: responsibleSubmission.manualName,
            ownerUserId: ownerSubmission.userId,
            ownerNameManual: ownerSubmission.manualName,
            verifierUserId: verifierSubmission.userId,
            verifierNameManual: verifierSubmission.manualName,
            progressPercent: Number(values.progressPercent || 0)
          });
        }}
      >
        <section className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4 md:p-5">
          <div className="mb-4 flex items-center gap-2">
            <Badge tone="blue">Step 1</Badge>
            <div className="text-sm font-semibold text-slate-900">Link and numbering</div>
          </div>

          <div className="space-y-4">
            <div className="space-y-4">
              <FormField label="Recommendation" required>
                <Select
                  required
                  disabled={!canManage || isEditing}
                  value={values.recommendationId}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      recommendationId: event.target.value,
                      actionNo: ""
                    }))
                  }
                >
                  <option value="">Select recommendation</option>
                  {recommendations.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField label="Action No" required hint={numberBusy ? "Loading preview..." : numberHint}>
                <Input value={values.actionNo} placeholder="Shown automatically" disabled />
              </FormField>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-2">
                <Badge tone="slate">Preview</Badge>
                <div className="text-sm font-semibold text-slate-900">Action snapshot</div>
              </div>
              <div className="mt-4 space-y-3">
                <SnapshotItem label="Action no." value={values.actionNo || "Will appear after recommendation"} />
                <SnapshotItem label="Source" value={selectedRecommendation?.sourceNo ?? "Not selected"} />
                <SnapshotItem label="Recommendation" value={selectedRecommendation?.recommendationNo ?? "Not selected"} />
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4 md:p-5">
          <div className="mb-4 flex items-center gap-2">
            <Badge tone="green">Step 2</Badge>
            <div className="text-sm font-semibold text-slate-900">Execution details</div>
          </div>

          <div className="space-y-4">
            <FormField label="Title" required>
              <Input
                required
                disabled={!canManage}
                value={values.title}
                onChange={(event) => setValues((current) => ({ ...current, title: event.target.value }))}
                placeholder="Short action title"
              />
            </FormField>

            <FormField label="Description">
              <Textarea
                disabled={!canManage}
                value={values.description ?? ""}
                onChange={(event) => setValues((current) => ({ ...current, description: event.target.value }))}
                rows={4}
                placeholder="Implementation scope, assumptions, deliverables, and notes"
              />
            </FormField>

            <div className="space-y-4">
              <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <span>Responsible</span>
                  <InfoTooltip text="The person who carries out the action and provides progress updates." />
                </div>
                <FormField label="Source">
                  <Select
                    disabled={!canManage}
                    value={assigneeModes.responsible}
                    onChange={(event) => updateAssigneeMode("responsible", event.target.value as AssigneeMode)}
                  >
                    <option value="system">From system</option>
                    <option value="manual">Enter name</option>
                  </Select>
                </FormField>
                <FormField label={assigneeModes.responsible === "system" ? "System user or department" : "Manual name"}>
                  {assigneeModes.responsible === "system" ? (
                    <Select
                      disabled={!canManage}
                      value={systemSelectValue("responsible")}
                      onChange={(event) => handleSystemAssigneeChange("responsible", event.target.value)}
                    >
                      <option value="">Unassigned</option>
                      {users.length ? (
                        <optgroup label="System users">
                          {users.map((user) => (
                            <option key={user.id} value={`user:${user.id}`}>
                              {user.label}
                            </option>
                          ))}
                        </optgroup>
                      ) : null}
                      {departments.length ? (
                        <optgroup label="Departments">
                          {departments.map((department) => (
                            <option key={department.id} value={`department:${department.name}`}>
                              {department.label}
                            </option>
                          ))}
                        </optgroup>
                      ) : null}
                    </Select>
                  ) : (
                    <Input
                      disabled={!canManage}
                      value={values.responsibleNameManual ?? ""}
                      onChange={(event) =>
                        setValues((current) => ({ ...current, responsibleNameManual: event.target.value, responsibleUserId: "" }))
                      }
                      placeholder="Type the responsible person name"
                    />
                  )}
                </FormField>
                <div className="text-xs text-slate-500">Current value: {assigneeDisplay.responsible}</div>
              </div>

              <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <span>Owner</span>
                  <InfoTooltip text="The person accountable for follow-up, coordination, and timely completion of the action." />
                </div>
                <FormField label="Source">
                  <Select
                    disabled={!canManage}
                    value={assigneeModes.owner}
                    onChange={(event) => updateAssigneeMode("owner", event.target.value as AssigneeMode)}
                  >
                    <option value="system">From system</option>
                    <option value="manual">Enter name</option>
                  </Select>
                </FormField>
                <FormField label={assigneeModes.owner === "system" ? "System user or department" : "Manual name"}>
                  {assigneeModes.owner === "system" ? (
                    <Select
                      disabled={!canManage}
                      value={systemSelectValue("owner")}
                      onChange={(event) => handleSystemAssigneeChange("owner", event.target.value)}
                    >
                      <option value="">Not set</option>
                      {users.length ? (
                        <optgroup label="System users">
                          {users.map((user) => (
                            <option key={user.id} value={`user:${user.id}`}>
                              {user.label}
                            </option>
                          ))}
                        </optgroup>
                      ) : null}
                      {departments.length ? (
                        <optgroup label="Departments">
                          {departments.map((department) => (
                            <option key={department.id} value={`department:${department.name}`}>
                              {department.label}
                            </option>
                          ))}
                        </optgroup>
                      ) : null}
                    </Select>
                  ) : (
                    <Input
                      disabled={!canManage}
                      value={values.ownerNameManual ?? ""}
                      onChange={(event) => setValues((current) => ({ ...current, ownerNameManual: event.target.value, ownerUserId: "" }))}
                      placeholder="Type the owner name"
                    />
                  )}
                </FormField>
                <div className="text-xs text-slate-500">Current value: {assigneeDisplay.owner}</div>
              </div>

              <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <span>Verifier</span>
                  <InfoTooltip text="The person who checks that the action was completed correctly before final closure." />
                </div>
                <FormField label="Source">
                  <Select
                    disabled={!canManage}
                    value={assigneeModes.verifier}
                    onChange={(event) => updateAssigneeMode("verifier", event.target.value as AssigneeMode)}
                  >
                    <option value="system">From system</option>
                    <option value="manual">Enter name</option>
                  </Select>
                </FormField>
                <FormField label={assigneeModes.verifier === "system" ? "System user or department" : "Manual name"}>
                  {assigneeModes.verifier === "system" ? (
                    <Select
                      disabled={!canManage}
                      value={systemSelectValue("verifier")}
                      onChange={(event) => handleSystemAssigneeChange("verifier", event.target.value)}
                    >
                      <option value="">Not set</option>
                      {users.length ? (
                        <optgroup label="System users">
                          {users.map((user) => (
                            <option key={user.id} value={`user:${user.id}`}>
                              {user.label}
                            </option>
                          ))}
                        </optgroup>
                      ) : null}
                      {departments.length ? (
                        <optgroup label="Departments">
                          {departments.map((department) => (
                            <option key={department.id} value={`department:${department.name}`}>
                              {department.label}
                            </option>
                          ))}
                        </optgroup>
                      ) : null}
                    </Select>
                  ) : (
                    <Input
                      disabled={!canManage}
                      value={values.verifierNameManual ?? ""}
                      onChange={(event) =>
                        setValues((current) => ({ ...current, verifierNameManual: event.target.value, verifierUserId: "" }))
                      }
                      placeholder="Type the verifier name"
                    />
                  )}
                </FormField>
                <div className="text-xs text-slate-500">Current value: {assigneeDisplay.verifier}</div>
              </div>
            </div>

            <div className="space-y-4">
              <FormField label="Priority" required>
                <Select
                  required
                  disabled={!canManage}
                  value={values.priorityCode}
                  onChange={(event) => setValues((current) => ({ ...current, priorityCode: event.target.value }))}
                >
                  <option value="">Select priority</option>
                  {(lookups?.priorities ?? []).map((priority) => (
                    <option key={priority.code} value={priority.code}>
                      {priority.name}
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField label="Status" required>
                <Select
                  required
                  disabled={!canManage}
                  value={values.statusCode}
                  onChange={(event) => setValues((current) => ({ ...current, statusCode: event.target.value }))}
                >
                  <option value="">Select status</option>
                  {(lookups?.statuses ?? []).map((status) => (
                    <option key={status.code} value={status.code}>
                      {status.name}
                    </option>
                  ))}
                </Select>
              </FormField>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4 md:p-5">
          <div className="mb-4 flex items-center gap-2">
            <Badge tone="amber">Step 3</Badge>
            <div className="text-sm font-semibold text-slate-900">Dates and progress</div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Start date">
              <Input
                type="date"
                disabled={!canManage}
                value={values.startDate ?? ""}
                onChange={(event) => setValues((current) => ({ ...current, startDate: event.target.value }))}
              />
            </FormField>

            <FormField label="Due date" required>
              <Input
                required
                type="date"
                disabled={!canManage}
                value={values.dueDate}
                onChange={(event) => setValues((current) => ({ ...current, dueDate: event.target.value }))}
              />
            </FormField>

            {isEditing ? (
              <>
                <FormField label="Completed date">
                  <Input
                    type="date"
                    disabled={!canManage}
                    value={values.completedDate ?? ""}
                    onChange={(event) => setValues((current) => ({ ...current, completedDate: event.target.value }))}
                  />
                </FormField>

                <FormField label="Verified date">
                  <Input
                    type="date"
                    disabled={!canManage}
                    value={values.verifiedDate ?? ""}
                    onChange={(event) => setValues((current) => ({ ...current, verifiedDate: event.target.value }))}
                  />
                </FormField>

                <FormField label="Progress %">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    disabled={!canManage}
                    value={String(values.progressPercent ?? 0)}
                    onChange={(event) => setValues((current) => ({ ...current, progressPercent: Number(event.target.value || 0) }))}
                  />
                </FormField>

                <FormField label="Latest extension until">
                  <Input
                    type="date"
                    disabled={!canManage}
                    value={values.latestExtensionUntil ?? ""}
                    onChange={(event) => setValues((current) => ({ ...current, latestExtensionUntil: event.target.value }))}
                  />
                </FormField>
              </>
            ) : (
              <div className="sm:col-span-2 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-slate-600">
                Progress, completion, verification, and extension fields will appear after the action is created.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4 md:p-5">
          <div className="mb-4 flex items-center gap-2">
            <Badge tone="slate">Step 4</Badge>
            <div className="text-sm font-semibold text-slate-900">Evidence and notes</div>
          </div>

          <div className="space-y-4">
            {isEditing ? (
              <FormField label="Extension reason">
                <Textarea
                  disabled={!canManage}
                  value={values.extensionReason ?? ""}
                  onChange={(event) => setValues((current) => ({ ...current, extensionReason: event.target.value }))}
                  rows={3}
                  placeholder="Reason for date change or delayed completion"
                />
              </FormField>
            ) : null}

            <FormField label="Evidence summary">
              <Textarea
                disabled={!canManage}
                value={values.evidenceSummary ?? ""}
                onChange={(event) => setValues((current) => ({ ...current, evidenceSummary: event.target.value }))}
                rows={3}
                placeholder="Summary of evidence, closure proof, or implementation notes"
              />
            </FormField>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4 md:p-5">
          <div className="mb-4 flex items-center gap-2">
            <Badge tone="blue">Step 5</Badge>
            <div className="text-sm font-semibold text-slate-900">Attachments</div>
          </div>

          {isEditing && initialItem?.id ? (
            <div className="space-y-3">
              <ActionAttachmentUploader
                actionId={initialItem.id}
                canUpload={canManage}
                loading={attachmentBusy}
                onUpload={handleAttachmentUpload}
              />
              {attachmentMessage ? (
                <div className={`rounded-2xl border px-4 py-3 text-sm ${attachmentMessage.toLowerCase().includes("success") ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"}`}>
                  {attachmentMessage}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-slate-600">
              Save the action first, then reopen it in edit mode to upload attachments.
            </div>
          )}
        </section>

        <div className="flex flex-wrap justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={!canManage || loading || (!isEditing && !values.actionNo)}>
            {loading ? "Saving..." : isEditing ? "Save changes" : "Create action"}
          </Button>
        </div>
      </form>
    </div>
  );
}
