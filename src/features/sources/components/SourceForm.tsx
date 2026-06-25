import { useEffect, useMemo, useState, type FormEvent } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  reserveSourceNumber,
  type SourceFormValues,
  type SourceListItem,
  type SourceOption
} from "@/features/sources/api/sources.api";
import { formatDateLabel, formatDateTimeLabel } from "@/lib/utils";

type SourceFormProps = {
  mode: "create" | "edit";
  source: SourceListItem | null;
  canManage: boolean;
  sourceTypes: SourceOption[];
  departments: SourceOption[];
  creatorName: string | null;
  busy: boolean;
  onSubmit: (values: SourceFormValues) => Promise<void>;
  onDelete: () => Promise<void>;
  onCancelCreate: () => void;
  referenceSourceOptions: Array<{ value: string; label: string }>;
};

const defaultValues: SourceFormValues = {
  sourceNo: "",
  sourceTypeCode: "",
  title: "",
  referenceNo: "",
  sourceDate: new Date().toISOString().slice(0, 10),
  departmentId: "",
  summary: ""
};

function toFormValues(source: SourceListItem | null): SourceFormValues {
  if (!source) return defaultValues;

  return {
    sourceNo: source.sourceNo,
    sourceTypeCode: source.sourceTypeCode,
    title: source.title,
    referenceNo: source.referenceNo ?? "",
    sourceDate: source.sourceDate,
    departmentId: source.departmentId ?? "",
    summary: source.summary ?? ""
  };
}

function SectionCard({
  badge,
  title,
  children
}: {
  badge: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-center gap-3">
        <Badge tone="blue">{badge}</Badge>
        <h4 className="text-lg font-bold text-slate-900">{title}</h4>
      </div>
      {children}
    </div>
  );
}

function SnapshotBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5">
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className="mt-2 text-base font-semibold text-slate-900">{value}</div>
    </div>
  );
}

export function SourceForm({
  mode,
  source,
  canManage,
  sourceTypes,
  departments,
  creatorName,
  busy,
  onSubmit,
  onDelete,
  onCancelCreate,
  referenceSourceOptions
}: SourceFormProps) {
  const [values, setValues] = useState<SourceFormValues>(defaultValues);
  const [errors, setErrors] = useState<Partial<Record<keyof SourceFormValues, string>>>({});
  const [numberBusy, setNumberBusy] = useState(false);
  const [numberHint, setNumberHint] = useState("Choose source type and source date to reserve the next source number.");

  useEffect(() => {
    setValues(toFormValues(source));
    setErrors({});
    setNumberHint(
      mode === "edit"
        ? "This number is locked after creation."
        : "Choose source type and source date to reserve the next source number."
    );
  }, [source, mode]);

  useEffect(() => {
    if (mode !== "create" || !canManage) return;

    if (!values.sourceTypeCode || !values.sourceDate) {
      setValues((current) => ({ ...current, sourceNo: "" }));
      setNumberHint("Choose source type and source date to reserve the next source number.");
      setNumberBusy(false);
      return;
    }

    let active = true;
    const nextTypeCode = values.sourceTypeCode;
    const nextDate = values.sourceDate;

    setNumberBusy(true);
    setNumberHint("Reserving source number...");

    void reserveSourceNumber(nextTypeCode, nextDate)
      .then((sourceNo) => {
        if (!active) return;
        setValues((current) => {
          if (current.sourceTypeCode !== nextTypeCode || current.sourceDate !== nextDate) {
            return current;
          }
          return { ...current, sourceNo };
        });
        setNumberHint("Reserved automatically. You cannot enter this number manually.");
      })
      .catch((error) => {
        if (!active) return;
        setValues((current) => ({ ...current, sourceNo: "" }));
        setNumberHint(error instanceof Error ? error.message : "Failed to reserve source number.");
      })
      .finally(() => {
        if (active) setNumberBusy(false);
      });

    return () => {
      active = false;
    };
  }, [canManage, mode, values.sourceDate, values.sourceTypeCode]);

  const title = useMemo(() => {
    return mode === "create" ? "Create new source" : "Source details";
  }, [mode]);

  const selectedSourceTypeLabel =
    sourceTypes.find((item) => item.value === values.sourceTypeCode)?.label ?? "Not selected";
  const selectedDepartmentLabel =
    departments.find((item) => item.value === values.departmentId)?.label ?? "Unassigned";

  function validate(nextValues: SourceFormValues) {
    const nextErrors: Partial<Record<keyof SourceFormValues, string>> = {};

    if (!nextValues.sourceTypeCode) nextErrors.sourceTypeCode = "Source type is required.";
    if (!nextValues.title.trim()) nextErrors.title = "Title is required.";
    if (!nextValues.sourceDate) nextErrors.sourceDate = "Source date is required.";
    if (!nextValues.sourceNo.trim()) nextErrors.sourceNo = "Wait until the source number is reserved automatically.";

    return nextErrors;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validate(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length) return;

    await onSubmit(values);
  }

  async function handleDelete() {
    const ok = window.confirm(
      "Delete this source permanently? Use this only if there are no recommendations linked to it yet."
    );

    if (!ok) return;

    await onDelete();
  }

  const readOnly = !canManage;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-2xl font-bold text-slate-950">{title}</h3>
            <Badge tone={mode === "create" ? "green" : "blue"}>
              {mode === "create" ? "Draft new" : "Existing source"}
            </Badge>
          </div>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            Save the source first, then continue with recommendations and actions.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone="slate">{source ? "Selected" : "No selection"}</Badge>
          {mode === "create" && canManage ? (
            <Button type="button" variant="outline" onClick={onCancelCreate}>
              Clear form
            </Button>
          ) : null}
        </div>
      </div>

      {!canManage ? (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-800">
          You currently have read-only access to sources. Admin and PSM Manager roles can create, edit, and delete.
        </div>
      ) : null}

      <form className="space-y-5" onSubmit={handleSubmit}>
        <SectionCard badge="Step 1" title="Identification and numbering">
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Source no.</label>
              <Input value={values.sourceNo} disabled placeholder="Reserved automatically" />
              <p className="mt-2 text-xs leading-6 text-slate-500">
                {numberBusy ? "Reserving next source number..." : numberHint}
              </p>
              {errors.sourceNo ? <p className="mt-2 text-xs text-red-600">{errors.sourceNo}</p> : null}
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Source type</label>
              <Select
                value={values.sourceTypeCode}
                disabled={readOnly || busy || mode === "edit"}
                onChange={(event) =>
                  setValues((current) => ({ ...current, sourceTypeCode: event.target.value, sourceNo: "" }))
                }
              >
                <option value="">Select source type</option>
                {sourceTypes.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </Select>
              {errors.sourceTypeCode ? (
                <p className="mt-2 text-xs text-red-600">{errors.sourceTypeCode}</p>
              ) : null}
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Source date</label>
              <Input
                type="date"
                value={values.sourceDate}
                disabled={readOnly || busy || mode === "edit"}
                onChange={(event) =>
                  setValues((current) => ({ ...current, sourceDate: event.target.value, sourceNo: "" }))
                }
              />
              {errors.sourceDate ? <p className="mt-2 text-xs text-red-600">{errors.sourceDate}</p> : null}
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Department</label>
              <Select
                value={values.departmentId}
                disabled={readOnly || busy}
                onChange={(event) => setValues((current) => ({ ...current, departmentId: event.target.value }))}
              >
                <option value="">Unassigned</option>
                {departments.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </SectionCard>

        <SectionCard badge="Preview" title="Source snapshot">
          <div className="space-y-3">
            <SnapshotBox label="Source no." value={values.sourceNo || "Will appear after type + date"} />
            <SnapshotBox label="Type" value={selectedSourceTypeLabel} />
            <SnapshotBox label="Date" value={formatDateLabel(values.sourceDate)} />
            <SnapshotBox label="Department" value={selectedDepartmentLabel} />
          </div>
        </SectionCard>

        <SectionCard badge="Step 2" title="Source details">
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Title</label>
              <Input
                value={values.title}
                disabled={readOnly || busy}
                onChange={(event) => setValues((current) => ({ ...current, title: event.target.value }))}
                placeholder="Investigation into compressor trip caused by lubrication system alarm"
              />
              {errors.title ? <p className="mt-2 text-xs text-red-600">{errors.title}</p> : null}
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Reference no.</label>
                <p className="text-xs leading-6 text-slate-500">
                  You can pick an existing source number as the reference, or enter a manual reference number.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Pick from saved sources
                </label>
                <Select
                  value=""
                  disabled={readOnly || busy || referenceSourceOptions.length === 0}
                  onChange={(event) => {
                    const selectedValue = event.target.value;
                    if (!selectedValue) return;
                    setValues((current) => ({ ...current, referenceNo: selectedValue }));
                  }}
                >
                  <option value="">
                    {referenceSourceOptions.length === 0 ? "No saved sources available" : "Select source number"}
                  </option>
                  {referenceSourceOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Or enter manually
                </label>
                <Input
                  value={values.referenceNo}
                  disabled={readOnly || busy}
                  onChange={(event) => setValues((current) => ({ ...current, referenceNo: event.target.value }))}
                  placeholder="Optional document or memo reference"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Summary</label>
              <Textarea
                value={values.summary}
                disabled={readOnly || busy}
                onChange={(event) => setValues((current) => ({ ...current, summary: event.target.value }))}
                placeholder="Brief context about the audit, incident investigation, or committee outcome"
              />
            </div>
          </div>
        </SectionCard>

        {canManage ? (
          <div className="flex flex-wrap items-center gap-3 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <Button type="submit" disabled={busy || numberBusy || (mode === "create" && !values.sourceNo)}>
              {busy ? "Saving..." : mode === "create" ? "Create source" : "Save changes"}
            </Button>
            {mode === "edit" ? (
              <Button type="button" variant="outline" disabled={busy} onClick={handleDelete}>
                Delete source
              </Button>
            ) : null}
          </div>
        ) : null}
      </form>

      {mode === "edit" && source ? (
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Created by</p>
            <p className="mt-2 text-base font-bold text-slate-900">{creatorName || "Unknown"}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Last updated</p>
            <p className="mt-2 text-base font-bold text-slate-900">{formatDateTimeLabel(source.updatedAt)}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Source date</p>
            <p className="mt-2 text-base font-bold text-slate-900">{formatDateLabel(source.sourceDate)}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Internal ID</p>
            <p className="mt-2 break-all text-sm font-semibold text-slate-700">{source.id}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
