import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { BidiText } from "@/components/ui/bidi";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PriorityInfoTooltip } from "@/components/ui/priority-info-tooltip";
import {
  reserveActionNumber,
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
  onSelectionContextChange?: (context: { sourceId: string; recommendationId: string }) => void;
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
      <BidiText className="mt-2 block text-sm font-semibold text-slate-900">{value || "—"}</BidiText>
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
  onSubmit,
  onSelectionContextChange
}: ActionFormProps) {
  const [values, setValues] = useState<FormState>(emptyState);
  const [assigneeModes, setAssigneeModes] = useState<AssigneeModes>({
    responsible: "system",
    owner: "system",
    verifier: "system"
  });
  const [numberBusy, setNumberBusy] = useState(false);
  const [numberHint, setNumberHint] = useState("Select recommendation to preview the next action number.");
  const [selectedSourceId, setSelectedSourceId] = useState("");
  const [parentChangedAfterDetails, setParentChangedAfterDetails] = useState(false);
  const isEditing = Boolean(initialItem?.id);

  const recommendations = useMemo(() => lookups?.recommendations ?? [], [lookups]);
  const sources = useMemo(() => lookups?.sources ?? [], [lookups]);
  const users = useMemo(() => lookups?.users ?? [], [lookups]);
  const departments = useMemo(() => lookups?.departments ?? [], [lookups]);
  const selectedRecommendation = useMemo(
    () => recommendations.find((item) => item.id === values.recommendationId) ?? null,
    [recommendations, values.recommendationId]
  );
  const selectedSource = useMemo(() => sources.find((item) => item.id === selectedSourceId) ?? null, [sources, selectedSourceId]);
  const visibleRecommendations = useMemo(
    () => recommendations.filter((item) => !selectedSourceId || item.sourceId === selectedSourceId),
    [recommendations, selectedSourceId]
  );

  useEffect(() => {
    if (!open) return;
    setValues(toFormState(initialItem));
    setSelectedSourceId(initialItem?.sourceId ?? "");
    setAssigneeModes({
      responsible: resolveMode(initialItem?.responsibleUserId, initialItem?.responsibleNameManual, departments),
      owner: resolveMode(initialItem?.ownerUserId, initialItem?.ownerNameManual, departments),
      verifier: resolveMode(initialItem?.verifierUserId, initialItem?.verifierNameManual, departments)
    });
    setNumberHint(
      initialItem?.id ? "This number is locked after creation." : "Select recommendation to preview the next action number."
    );
    setParentChangedAfterDetails(false);
  }, [departments, initialItem, open]);


  useEffect(() => {
    if (!open) return;
    onSelectionContextChange?.({
      sourceId: selectedSourceId,
      recommendationId: values.recommendationId
    });
  }, [onSelectionContextChange, open, selectedSourceId, values.recommendationId]);

  const recommendationSummary = useMemo(() => {
    if (!selectedRecommendation) return "Not selected";
    const compactText = selectedRecommendation.recommendationText.replace(/\s+/g, " ").trim();
    const previewText = compactText.length > 120 ? `${compactText.slice(0, 117)}...` : compactText;
    return `${selectedRecommendation.recommendationNo} — ${previewText}`;
  }, [selectedRecommendation]);

  const sourceSummary = selectedSource ? `${selectedSource.sourceNo} — ${selectedSource.title}` : "Not selected";
  const breadcrumbActionLabel = isEditing ? values.actionNo || "Existing action" : values.actionNo || "New action";
  const parentReady = Boolean(selectedSource && selectedRecommendation);
  const hasExecutionDraft = Boolean(
    values.title.trim() ||
      normalizeOptionalText(values.description) ||
      values.responsibleUserId ||
      normalizeOptionalText(values.responsibleNameManual) ||
      values.ownerUserId ||
      normalizeOptionalText(values.ownerNameManual) ||
      values.verifierUserId ||
      normalizeOptionalText(values.verifierNameManual) ||
      values.priorityCode ||
      values.statusCode ||
      values.startDate ||
      values.dueDate ||
      values.evidenceSummary ||
      values.extensionReason
  );

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
            Select the source first, then choose its recommendation and save the action details.
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
          if (!isEditing) setParentChangedAfterDetails(false);
        }}
      >
        <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Parent path</div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-800">
            <span className={`rounded-full px-3 py-1 ${selectedSource ? "bg-slate-900 text-white" : "bg-white text-slate-500 border border-slate-200"}`}>
              {selectedSource ? selectedSource.sourceNo : "Select source"}
            </span>
            <span className="text-slate-400">/</span>
            <span
              className={`rounded-full px-3 py-1 ${selectedRecommendation ? "bg-blue-50 text-blue-700 border border-blue-200" : "bg-white text-slate-500 border border-slate-200"}`}
            >
              {selectedRecommendation ? selectedRecommendation.recommendationNo : "Select recommendation"}
            </span>
            <span className="text-slate-400">/</span>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 border border-emerald-200">{breadcrumbActionLabel}</span>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            This breadcrumb keeps the new action linked to the selected parent path before you save.
          </p>
        </div>
        <section className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4 md:p-5">
          <div className="mb-4 flex items-center gap-2">
            <Badge tone="blue">Step 1</Badge>
            <div className="text-sm font-semibold text-slate-900">Link and numbering</div>
          </div>

          <div className="space-y-4">
            <div className="space-y-4">
              <FormField label="Source" required>
                <Select
                  required
                  disabled={!canManage || isEditing}
                  value={selectedSourceId}
                  onChange={(event) => {
                    const nextSourceId = event.target.value;
                    if (!isEditing && nextSourceId !== selectedSourceId && hasExecutionDraft) {
                      setParentChangedAfterDetails(true);
                    }
                    setSelectedSourceId(nextSourceId);
                    setValues((current) => ({
                      ...current,
                      recommendationId: "",
                      actionNo: ""
                    }));
                    onSelectionContextChange?.({ sourceId: nextSourceId, recommendationId: "" });
                  }}
                >
                  <option value="">Select source</option>
                  {sources.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField label="Recommendation" required>
                <Select
                  required
                  disabled={!canManage || isEditing || !selectedSourceId}
                  value={values.recommendationId}
                  onChange={(event) => {
                    const nextRecommendationId = event.target.value;
                    if (!isEditing && nextRecommendationId !== values.recommendationId && hasExecutionDraft) {
                      setParentChangedAfterDetails(true);
                    }
                    setValues((current) => ({
                      ...current,
                      recommendationId: nextRecommendationId,
                      actionNo: ""
                    }));
                  }}
                >
                  <option value="">{selectedSourceId ? "Select recommendation" : "Select source first"}</option>
                  {visibleRecommendations.map((item) => (
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

            <div className="space-y-4">
              <div className="rounded-3xl border border-blue-200 bg-blue-50/70 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={parentReady ? "blue" : "amber"}>{parentReady ? "Linked parent" : "Waiting for link"}</Badge>
                  <div className="text-sm font-semibold text-slate-900">Parent card</div>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  Review the parent before saving so this action is created under the correct Source and Recommendation.
                </p>
                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  <SnapshotItem label="Source" value={sourceSummary} />
                  <SnapshotItem label="Recommendation" value={recommendationSummary} />
                </div>
                <div className="mt-3 rounded-2xl border border-blue-200 bg-white/80 px-4 py-3 text-sm text-slate-700">
                  {parentReady
                    ? "This action will be saved under the selected recommendation path shown above."
                    : "Choose Source first, then select its Recommendation to lock the parent path."}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2">
                  <Badge tone="slate">Preview</Badge>
                  <div className="text-sm font-semibold text-slate-900">Action snapshot</div>
                </div>
                <div className="mt-4 space-y-3">
                  <SnapshotItem label="Action no." value={values.actionNo || "Will appear after recommendation"} />
                  <SnapshotItem label="Source no." value={selectedSource?.sourceNo ?? "Not selected"} />
                  <SnapshotItem label="Recommendation no." value={selectedRecommendation?.recommendationNo ?? "Not selected"} />
                </div>
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
                <div className="text-xs text-slate-500">Current value: <BidiText>{assigneeDisplay.responsible}</BidiText></div>
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
                <div className="text-xs text-slate-500">Current value: <BidiText>{assigneeDisplay.owner}</BidiText></div>
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
                <div className="text-xs text-slate-500">Current value: <BidiText>{assigneeDisplay.verifier}</BidiText></div>
              </div>
            </div>

            <div className="space-y-4">
              <FormField label={<span className="inline-flex items-center gap-2">Priority <PriorityInfoTooltip /></span>} required>
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
              <div className="sm:col-span-2 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-slate-500">
                Progress, completion, verification, and extension fields appear after the action is created.
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

        <div className="space-y-3 pt-2">
          {!isEditing ? (
            <div
              className={`rounded-2xl border px-4 py-3 text-sm ${
                parentChangedAfterDetails
                  ? "border-amber-200 bg-amber-50 text-amber-800"
                  : parentReady
                    ? "border-slate-200 bg-slate-50 text-slate-700"
                    : "border-slate-200 bg-white text-slate-500"
              }`}
            >
              <div className="font-semibold text-slate-900">Save check</div>
              <p className="mt-1 leading-6">
                {parentChangedAfterDetails
                  ? "Source or Recommendation changed after you started entering action details. Review the parent card above before saving so the action is not linked to the wrong parent."
                  : parentReady
                    ? `This action will be created under ${selectedSource?.sourceNo} / ${selectedRecommendation?.recommendationNo}.`
                    : "Select Source and Recommendation first to confirm the parent path before save."}
              </p>
            </div>
          ) : null}

          <div className="flex flex-wrap justify-end gap-3">
            <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canManage || loading || (!isEditing && !values.actionNo)}>
              {loading ? "Saving..." : isEditing ? "Save changes" : "Create action"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
