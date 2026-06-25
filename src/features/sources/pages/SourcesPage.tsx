import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FeatureIntro } from "@/components/ui/feature-intro";
import { StatCard } from "@/components/ui/stat-card";
import { Spinner } from "@/components/ui/spinner";
import { useRoleAccess } from "@/features/auth/hooks/useRoleAccess";
import { fetchSourceCreatorName, type SourceListItem } from "@/features/sources/api/sources.api";
import { SourceFilters } from "@/features/sources/components/SourceFilters";
import { SourceForm } from "@/features/sources/components/SourceForm";
import { SourceListTable } from "@/features/sources/components/SourceListTable";
import { useCreateSource, useDeleteSource, useDepartments, useSources, useSourceTypes, useUpdateSource } from "@/features/sources/hooks/useSources";

export function SourcesPage() {
  const { canManageSources: canManage } = useRoleAccess();

  const sourcesQuery = useSources();
  const sourceTypesQuery = useSourceTypes();
  const departmentsQuery = useDepartments();

  const createMutation = useCreateSource();
  const updateMutation = useUpdateSource();
  const deleteMutation = useDeleteSource();

  const [searchValue, setSearchValue] = useState("");
  const [sourceTypeFilter, setSourceTypeFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [creatorName, setCreatorName] = useState<string | null>(null);
  const [pageError, setPageError] = useState("");

  const sources = sourcesQuery.data ?? [];
  const sourceTypes = sourceTypesQuery.data ?? [];
  const departments = departmentsQuery.data ?? [];

  const filteredRows = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();
    return sources.filter((row) => {
      const matchesSearch = !normalizedSearch || [row.sourceNo, row.title, row.referenceNo ?? "", row.summary ?? ""].join(" ").toLowerCase().includes(normalizedSearch);
      const matchesType = !sourceTypeFilter || row.sourceTypeCode === sourceTypeFilter;
      const matchesDepartment = !departmentFilter || row.departmentId === departmentFilter;
      return matchesSearch && matchesType && matchesDepartment;
    });
  }, [departmentFilter, searchValue, sourceTypeFilter, sources]);

  const selectedSource = useMemo<SourceListItem | null>(() => {
    if (!selectedId) return null;
    return sources.find((row) => row.id === selectedId) ?? null;
  }, [selectedId, sources]);

  const referenceSourceOptions = useMemo(() => {
    return sources
      .filter((row) => row.sourceNo && row.id !== selectedId)
      .map((row) => ({
        value: row.sourceNo,
        label: row.title ? `${row.sourceNo} — ${row.title}` : row.sourceNo
      }));
  }, [selectedId, sources]);

  const isBusy = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  useEffect(() => {
    if (mode === "edit" && !selectedSource) setMode("create");
  }, [mode, selectedSource]);

  useEffect(() => {
    let cancelled = false;
    async function loadCreatorName() {
      if (!selectedSource?.createdBy) {
        setCreatorName(null);
        return;
      }
      const name = await fetchSourceCreatorName(selectedSource.createdBy);
      if (!cancelled) setCreatorName(name);
    }
    void loadCreatorName();
    return () => { cancelled = true; };
  }, [selectedSource?.createdBy]);

  const counts = useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    return { total: sources.length, filtered: filteredRows.length, thisMonth: sources.filter((row) => row.createdAt.slice(0, 7) === currentMonth).length, withReference: sources.filter((row) => Boolean(row.referenceNo)).length };
  }, [filteredRows.length, sources]);

  async function handleCreate(values: Parameters<typeof createMutation.mutateAsync>[0]) {
    try {
      setPageError("");
      const created = await createMutation.mutateAsync(values);
      setSelectedId(created.id);
      setMode("edit");
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Failed to create source.");
    }
  }

  async function handleUpdate(values: Parameters<typeof updateMutation.mutateAsync>[0]["values"]) {
    if (!selectedSource) return;
    try {
      setPageError("");
      await updateMutation.mutateAsync({ id: selectedSource.id, values });
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Failed to update source.");
    }
  }

  async function handleDelete() {
    if (!selectedSource) return;
    try {
      setPageError("");
      await deleteMutation.mutateAsync(selectedSource.id);
      setSelectedId(null);
      setMode("create");
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Failed to delete source.");
    }
  }

  const loading = sourcesQuery.isLoading || sourceTypesQuery.isLoading || departmentsQuery.isLoading;
  const queryError = sourcesQuery.error || sourceTypesQuery.error || departmentsQuery.error;

  return (
    <div className="space-y-5">
      <FeatureIntro
        title="Sources"
        description="Start here. Create the source once, then open recommendations and actions from it later."
        actions={canManage ? <Badge tone="green">Create or edit</Badge> : <Badge tone="amber">Read only</Badge>}
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total sources" value={counts.total} compact />
        <StatCard label="Filtered" value={counts.filtered} tone="blue" compact />
        <StatCard label="Created this month" value={counts.thisMonth} tone="green" compact />
        <StatCard label="With reference" value={counts.withReference} tone="amber" compact />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="order-2 xl:order-1">
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><CardTitle>Sources</CardTitle></div>
              <div className="flex flex-wrap items-center gap-2">
                {canManage ? <Badge tone="green">Create or edit</Badge> : <Badge tone="amber">Read only</Badge>}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <SourceFilters searchValue={searchValue} sourceTypeValue={sourceTypeFilter} departmentValue={departmentFilter} sourceTypes={sourceTypes} departments={departments} onSearchChange={setSearchValue} onSourceTypeChange={setSourceTypeFilter} onDepartmentChange={setDepartmentFilter} onReset={() => { setSearchValue(""); setSourceTypeFilter(""); setDepartmentFilter(""); }} />
            {loading ? <div className="flex min-h-[160px] items-center justify-center"><Spinner /></div> : queryError ? <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-sm leading-7 text-red-700">{queryError instanceof Error ? queryError.message : "Unable to load sources."}</div> : <SourceListTable rows={filteredRows} selectedId={selectedId} sourceTypes={sourceTypes} departments={departments} onSelect={(id) => { setSelectedId(id); setMode("edit"); setPageError(""); }} />}
          </CardContent>
        </Card>

        <Card className="order-1 xl:order-2">
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><CardTitle>{canManage ? (mode === "create" ? "Source form" : "Source details") : "Source details"}</CardTitle></div>
              {selectedSource ? <Badge tone="green">Selected</Badge> : <Badge tone="slate">No selection</Badge>}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {pageError ? <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm leading-7 text-red-700">{pageError}</div> : null}
            <SourceForm mode={canManage ? mode : "edit"} source={selectedSource} canManage={canManage} sourceTypes={sourceTypes} departments={departments} creatorName={creatorName} busy={isBusy} onSubmit={async (values) => { if (mode === "create") { await handleCreate(values); return; } await handleUpdate(values); }} onDelete={handleDelete} onCancelCreate={() => { setMode("create"); setSelectedId(null); setPageError(""); }} referenceSourceOptions={referenceSourceOptions} />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

