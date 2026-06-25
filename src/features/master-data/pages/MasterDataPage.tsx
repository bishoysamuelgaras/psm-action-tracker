import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { BidiText } from "@/components/ui/bidi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/features/auth/hooks/useAuth";
import {
  deleteMasterData,
  listMasterData,
  MASTER_DATA_SECTIONS,
  saveMasterData,
  type MasterDataEntityKey,
  type MasterDataRecord,
  type MasterDataSection
} from "@/features/master-data/api/masterData.api";
import { cn } from "@/lib/utils";

type FormState = {
  id?: string;
  originalRowKey?: string;
  code: string;
  name: string;
  sortOrder: string;
  tone: string;
  slaDays: string;
  isActive: boolean;
  isTerminal: boolean;
  requiresCompletionDate: boolean;
  requiresVerificationDate: boolean;
};

type SavePayload = {
  mode: "create" | "update";
  values: FormState;
  record?: MasterDataRecord | null;
};

const initialFormState: FormState = {
  code: "",
  name: "",
  sortOrder: "0",
  tone: "slate",
  slaDays: "",
  isActive: true,
  isTerminal: false,
  requiresCompletionDate: false,
  requiresVerificationDate: false
};

const toneOptions = ["slate", "blue", "green", "amber", "red"] as const;

function toFormState(record?: MasterDataRecord | null): FormState {
  if (!record) return { ...initialFormState };

  return {
    id: record.id,
    originalRowKey: record.rowKey,
    code: record.code,
    name: record.name,
    sortOrder: String(record.sortOrder ?? 0),
    tone: record.tone ?? "slate",
    slaDays: record.slaDays == null ? "" : String(record.slaDays),
    isActive: record.isActive,
    isTerminal: Boolean(record.isTerminal),
    requiresCompletionDate: Boolean(record.requiresCompletionDate),
    requiresVerificationDate: Boolean(record.requiresVerificationDate)
  };
}

export function MasterDataPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const canManage = hasPermission(["settings.users.manage", "settings.roles.manage"]);

  const [activeSection, setActiveSection] = useState<MasterDataEntityKey>("departments");
  const [search, setSearch] = useState("");
  const [editingRecord, setEditingRecord] = useState<MasterDataRecord | null>(null);
  const [editFormState, setEditFormState] = useState<FormState>({ ...initialFormState });
  const [createFormState, setCreateFormState] = useState<FormState>({ ...initialFormState });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const sectionMeta = useMemo(
    () => MASTER_DATA_SECTIONS.find((section) => section.key === activeSection) ?? MASTER_DATA_SECTIONS[0],
    [activeSection]
  );

  const sectionSingularLabel = useMemo(
    () => getSectionSingularLabel(sectionMeta.label),
    [sectionMeta.label]
  );

  const recordsQuery = useQuery({
    queryKey: ["master-data", activeSection],
    queryFn: () => listMasterData(activeSection)
  });

  const resetCreateForm = () => {
    setCreateFormState({ ...initialFormState });
  };

  const resetEditForm = () => {
    setEditingRecord(null);
    setEditFormState({ ...initialFormState });
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    resetCreateForm();
  };

  const saveMutation = useMutation({
    mutationFn: async ({ mode, values, record }: SavePayload) => {
      await saveMasterData(activeSection, {
        mode,
        id: mode === "update" ? record?.id : undefined,
        originalRowKey: mode === "update" ? record?.rowKey : undefined,
        code: values.code,
        name: values.name,
        sortOrder: sectionMeta.supportsSortOrder ? Number(values.sortOrder || 0) : undefined,
        tone: sectionMeta.supportsTone ? values.tone : undefined,
        slaDays:
          sectionMeta.supportsSlaDays && values.slaDays.trim() !== ""
            ? Number(values.slaDays)
            : null,
        isActive: values.isActive,
        isTerminal: sectionMeta.supportsStatusFlags ? values.isTerminal : undefined,
        requiresCompletionDate: sectionMeta.supportsStatusFlags
          ? values.requiresCompletionDate
          : undefined,
        requiresVerificationDate: sectionMeta.supportsStatusFlags
          ? values.requiresVerificationDate
          : undefined
      });
    },
    onSuccess: async (_data, variables: SavePayload) => {
      await queryClient.invalidateQueries({ queryKey: ["master-data", activeSection] });
      if (variables.mode === "create") {
        closeCreateModal();
        return;
      }
      resetEditForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (record: MasterDataRecord) => {
      await deleteMasterData(activeSection, record);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["master-data", activeSection] });
      resetEditForm();
      closeCreateModal();
    }
  });

  const openCreateModal = () => {
    saveMutation.reset();
    resetEditForm();
    resetCreateForm();
    setIsCreateModalOpen(true);
  };

  const startEditMode = (record: MasterDataRecord) => {
    saveMutation.reset();
    setIsCreateModalOpen(false);
    resetCreateForm();
    setEditingRecord(record);
    setEditFormState(toFormState(record));
  };

  useEffect(() => {
    resetEditForm();
    closeCreateModal();
    setSearch("");
    saveMutation.reset();
  }, [activeSection]);

  useEffect(() => {
    if (!isCreateModalOpen) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saveMutation.isPending) {
        closeCreateModal();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCreateModalOpen, saveMutation.isPending]);

  const records = recordsQuery.data ?? [];
  const filteredRecords = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return records;

    return records.filter((record) => {
      const haystack = [record.code, record.name, record.tone ?? ""]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalized);
    });
  }, [records, search]);

  const activeCount = filteredRecords.filter((item) => item.isActive).length;
  const inactiveCount = filteredRecords.length - activeCount;

  if (recordsQuery.isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (recordsQuery.error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Master data</CardTitle>
          <CardDescription>We could not load the master data workspace.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <CardTitle>Master data</CardTitle>
              <CardDescription>
                Maintain the controlled lists used by actions, dashboards, filters, and reports.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge tone="blue">Admin workspace</Badge>
              {canManage ? <Badge tone="green">Edit enabled</Badge> : <Badge tone="slate">Read only</Badge>}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 lg:grid-cols-5">
            {MASTER_DATA_SECTIONS.map((section) => {
              const isActive = section.key === activeSection;
              return (
                <button
                  key={section.key}
                  type="button"
                  onClick={() => setActiveSection(section.key)}
                  className={cn(
                    "rounded-3xl border p-4 text-left transition",
                    isActive
                      ? "border-slate-950 bg-slate-950 text-white shadow-sm"
                      : "border-slate-200 bg-white text-slate-900 hover:border-slate-300 hover:bg-slate-50"
                  )}
                >
                  <div className="text-sm font-bold">{section.label}</div>
                  <div className={cn("mt-2 text-xs leading-6", isActive ? "text-white/80" : "text-slate-600")}>
                    {section.description}
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_25rem]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">{sectionMeta.label}</CardTitle>
                  <CardDescription>{sectionMeta.description}</CardDescription>
                </div>
                <div className="grid min-w-[16rem] grid-cols-3 gap-2">
                  <SummaryBox label="Rows" value={String(filteredRecords.length)} />
                  <SummaryBox label="Active" value={String(activeCount)} tone="green" />
                  <SummaryBox label="Inactive" value={String(inactiveCount)} tone="amber" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={`Search in ${sectionMeta.label.toLowerCase()}...`}
                  className="min-w-[14rem] max-w-md flex-1"
                />
                <Button
                  onClick={openCreateModal}
                  className="bg-blue-600 text-white hover:bg-blue-500 disabled:bg-blue-300"
                  disabled={!canManage}
                >
                  New {sectionSingularLabel}
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-y-2">
                  <thead>
                    <tr className="text-right text-xs uppercase tracking-[0.14em] text-slate-500">
                      <th className="px-3 py-2">Code</th>
                      <th className="px-3 py-2">Name</th>
                      {sectionMeta.supportsSortOrder ? <th className="px-3 py-2">Sort</th> : null}
                      {sectionMeta.supportsTone ? <th className="px-3 py-2">Tone</th> : null}
                      {sectionMeta.supportsSlaDays ? <th className="px-3 py-2">SLA</th> : null}
                      <th className="px-3 py-2">Status</th>
                      {sectionMeta.supportsStatusFlags ? <th className="px-3 py-2">Flags</th> : null}
                      <th className="px-3 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map((record) => {
                      const isSelected = editingRecord?.rowKey === record.rowKey;

                      return (
                        <tr
                          key={record.rowKey}
                          className={cn(
                            "bg-slate-50 text-sm text-slate-700 transition",
                            isSelected ? "outline outline-2 outline-blue-200" : "hover:bg-slate-100"
                          )}
                        >
                          <td className="rounded-r-2xl px-3 py-3 font-semibold text-slate-900"><BidiText>{record.code}</BidiText></td>
                          <td className="px-3 py-3"><BidiText>{record.name}</BidiText></td>
                          {sectionMeta.supportsSortOrder ? (
                            <td className="px-3 py-3">{record.sortOrder ?? 0}</td>
                          ) : null}
                          {sectionMeta.supportsTone ? (
                            <td className="px-3 py-3">
                              <Badge tone={(record.tone as "slate" | "blue" | "green" | "amber" | "red") || "slate"}>
                                {record.tone || "slate"}
                              </Badge>
                            </td>
                          ) : null}
                          {sectionMeta.supportsSlaDays ? (
                            <td className="px-3 py-3">{record.slaDays ?? "—"}</td>
                          ) : null}
                          <td className="px-3 py-3">
                            <Badge tone={record.isActive ? "green" : "amber"}>
                              {record.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </td>
                          {sectionMeta.supportsStatusFlags ? (
                            <td className="px-3 py-3">
                              <div className="flex flex-wrap gap-2">
                                {record.isTerminal ? <Badge tone="red">Terminal</Badge> : null}
                                {record.requiresCompletionDate ? <Badge tone="blue">Needs completion</Badge> : null}
                                {record.requiresVerificationDate ? <Badge tone="green">Needs verification</Badge> : null}
                                {!record.isTerminal && !record.requiresCompletionDate && !record.requiresVerificationDate ? (
                                  <span className="text-xs text-slate-400">—</span>
                                ) : null}
                              </div>
                            </td>
                          ) : null}
                          <td className="rounded-l-2xl px-3 py-3">
                            <div className="flex flex-wrap gap-2">
                              <Button
                                variant={isSelected ? "primary" : "outline"}
                                onClick={() => startEditMode(record)}
                              >
                                {isSelected ? "Editing" : "Edit"}
                              </Button>
                              {canManage ? (
                                <Button
                                  variant="ghost"
                                  onClick={() => {
                                    const confirmed = window.confirm(
                                      `Delete ${record.name}? This may fail if the row is already referenced.`
                                    );
                                    if (!confirmed) return;
                                    deleteMutation.mutate(record);
                                  }}
                                >
                                  Delete
                                </Button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {editingRecord ? (
          <Card className="h-fit xl:sticky xl:top-24">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-lg">Edit {sectionSingularLabel}</CardTitle>
                  <CardDescription>
                    You are editing an existing row. Creating a new department now opens in a separate pop-up.
                  </CardDescription>
                </div>
                <Badge tone="amber">Editing</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <MasterDataForm
                sectionMeta={sectionMeta}
                values={editFormState}
                onChange={setEditFormState}
                canManage={canManage}
                isSaving={saveMutation.isPending}
                saveError={saveMutation.error}
                submitLabel={saveMutation.isPending ? "Saving..." : "Save changes"}
                secondaryActionLabel="Cancel edit"
                onSecondaryAction={() => {
                  saveMutation.reset();
                  resetEditForm();
                }}
                onSubmit={() => {
                  if (!editingRecord) return;
                  saveMutation.mutate({ mode: "update", values: editFormState, record: editingRecord });
                }}
              />
            </CardContent>
          </Card>
        ) : (
          <Card className="h-fit border-dashed border-slate-300 bg-slate-50/70 xl:sticky xl:top-24">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-lg">No row selected</CardTitle>
                  <CardDescription>
                    Click Edit on any row to update it, or use the blue button to add a new {sectionSingularLabel.toLowerCase()} in a pop-up.
                  </CardDescription>
                </div>
                <Badge tone="slate">Safe mode</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Button
                onClick={openCreateModal}
                className="w-full bg-blue-600 text-white hover:bg-blue-500 disabled:bg-blue-300"
                disabled={!canManage}
              >
                New {sectionSingularLabel}
              </Button>
              <p className="mt-3 text-xs leading-5 text-slate-500">
                Create is now isolated from edit mode, so a new department cannot accidentally update an existing row.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {isCreateModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <button
            type="button"
            aria-label="Close create modal"
            className="absolute inset-0 cursor-default"
            onClick={() => {
              if (!saveMutation.isPending) closeCreateModal();
            }}
          />
          <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] bg-white shadow-2xl">
            <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-6 py-5 backdrop-blur">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-blue-700">
                    Create new row
                  </div>
                  <h2 className="mt-3 text-xl font-bold text-slate-950">New {sectionSingularLabel}</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    This pop-up always inserts a new row. It is fully separated from the edit panel.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={closeCreateModal}
                  disabled={saveMutation.isPending}
                >
                  Close
                </Button>
              </div>
            </div>
            <div className="p-6">
              <MasterDataForm
                sectionMeta={sectionMeta}
                values={createFormState}
                onChange={setCreateFormState}
                canManage={canManage}
                isSaving={saveMutation.isPending}
                saveError={saveMutation.error}
                submitLabel={saveMutation.isPending ? "Creating..." : `Create ${sectionSingularLabel}`}
                secondaryActionLabel="Reset"
                onSecondaryAction={() => {
                  saveMutation.reset();
                  resetCreateForm();
                }}
                onSubmit={() => saveMutation.mutate({ mode: "create", values: createFormState })}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MasterDataForm({
  sectionMeta,
  values,
  onChange,
  canManage,
  isSaving,
  saveError,
  submitLabel,
  secondaryActionLabel,
  onSecondaryAction,
  onSubmit
}: {
  sectionMeta: MasterDataSection;
  values: FormState;
  onChange: (values: FormState) => void;
  canManage: boolean;
  isSaving: boolean;
  saveError: unknown;
  submitLabel: string;
  secondaryActionLabel: string;
  onSecondaryAction: () => void;
  onSubmit: () => void;
}) {
  const setField = <Key extends keyof FormState>(key: Key, value: FormState[Key]) => {
    onChange({ ...values, [key]: value });
  };

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (!canManage) return;
        onSubmit();
      }}
    >
      <Field label="Code">
        <Input
          value={values.code}
          onChange={(event) => setField("code", event.target.value)}
          placeholder="e.g. process"
          disabled={!canManage}
        />
      </Field>

      <Field label="Name">
        <Input
          value={values.name}
          onChange={(event) => setField("name", event.target.value)}
          placeholder="Display name"
          disabled={!canManage}
        />
      </Field>

      {sectionMeta.supportsSortOrder ? (
        <Field label="Sort order">
          <Input
            type="number"
            value={values.sortOrder}
            onChange={(event) => setField("sortOrder", event.target.value)}
            disabled={!canManage}
          />
        </Field>
      ) : null}

      {sectionMeta.supportsTone ? (
        <Field label="Tone">
          <Select
            value={values.tone}
            onChange={(event) => setField("tone", event.target.value)}
            disabled={!canManage}
          >
            {toneOptions.map((tone) => (
              <option key={tone} value={tone}>
                {tone}
              </option>
            ))}
          </Select>
        </Field>
      ) : null}

      {sectionMeta.supportsSlaDays ? (
        <Field label="SLA days">
          <Input
            type="number"
            min="0"
            value={values.slaDays}
            onChange={(event) => setField("slaDays", event.target.value)}
            placeholder="Optional"
            disabled={!canManage}
          />
        </Field>
      ) : null}

      <ToggleRow
        label="Active row"
        checked={values.isActive}
        onChange={(checked) => setField("isActive", checked)}
        disabled={!canManage}
      />

      {sectionMeta.supportsStatusFlags ? (
        <div className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-sm font-semibold text-slate-900">Status behavior</div>
          <ToggleRow
            label="Terminal status"
            checked={values.isTerminal}
            onChange={(checked) => setField("isTerminal", checked)}
            disabled={!canManage}
          />
          <ToggleRow
            label="Requires completion date"
            checked={values.requiresCompletionDate}
            onChange={(checked) => setField("requiresCompletionDate", checked)}
            disabled={!canManage}
          />
          <ToggleRow
            label="Requires verification date"
            checked={values.requiresVerificationDate}
            onChange={(checked) => setField("requiresVerificationDate", checked)}
            disabled={!canManage}
          />
        </div>
      ) : null}

      {saveError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {formatSaveError(saveError)}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2 pt-2">
        <Button
          type="submit"
          disabled={!canManage || isSaving || !values.code.trim() || !values.name.trim()}
        >
          {submitLabel}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onSecondaryAction}
          disabled={isSaving}
        >
          {secondaryActionLabel}
        </Button>
      </div>
    </form>
  );
}

function getSectionSingularLabel(label: string) {
  if (label === "Recommendation categories") return "Recommendation category";
  if (label.endsWith("ies")) return `${label.slice(0, -3)}y`;
  if (label.endsWith("s")) return label.slice(0, -1);
  return label;
}

function formatSaveError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const lowered = message.toLowerCase();

  if (lowered.includes("duplicate") || lowered.includes("unique")) {
    return "A row with the same code or name already exists. Please use a new code/name, or click Edit to update the existing row.";
  }

  return message || "Could not save this row. Please try again.";
}

function Field({
  label,
  children
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-slate-800">{label}</span>
      {children}
    </label>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
  disabled
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
      <span className="font-medium text-slate-900">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        disabled={disabled}
        className="h-4 w-4 accent-slate-950"
      />
    </label>
  );
}

function SummaryBox({
  label,
  value,
  tone = "slate"
}: {
  label: string;
  value: string;
  tone?: "slate" | "green" | "amber";
}) {
  const classes = {
    slate: "border-slate-200 bg-slate-50 text-slate-800",
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700"
  }[tone];

  return (
    <div className={cn("rounded-2xl border px-3 py-3", classes)}>
      <div className="text-xs uppercase tracking-[0.12em]">{label}</div>
      <div className="mt-2 text-xl font-bold">{value}</div>
    </div>
  );
}
