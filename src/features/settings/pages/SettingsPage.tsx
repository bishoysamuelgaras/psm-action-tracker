import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { BidiBlock, BidiText } from "@/components/ui/bidi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FeatureIntro } from "@/components/ui/feature-intro";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { StatCard } from "@/components/ui/stat-card";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useRoleAccess } from "@/features/auth/hooks/useRoleAccess";
import { deleteMasterData, listMasterData, saveMasterData, type MasterDataRecord } from "@/features/master-data/api/masterData.api";
import {
  deleteUserAccess,
  inviteUser,
  listRolePermissionMatrix,
  listUserAccess,
  listUserDepartmentOptions,
  listUserRoleOptions,
  resetUserPassword,
  saveRolePermissions,
  setUserPassword,
  updateUserAccess,
  type InviteUserPayload,
  type RolePermissionAssignment,
  type UpdateUserAccessPayload,
} from "@/features/settings/api/users.api";
import { APP_PERMISSION_OPTIONS, getDefaultPermissionsForRole } from "@/lib/permissions";
import { ROLE_BADGE_TONES, ROLE_LABELS } from "@/lib/constants";
import { cn, formatDateLabel } from "@/lib/utils";

function mapRoleLabel(code: string) {
  return ROLE_LABELS[code as keyof typeof ROLE_LABELS] ?? code;
}

function mapRoleTone(code: string) {
  return ROLE_BADGE_TONES[code as keyof typeof ROLE_BADGE_TONES] ?? "slate";
}

function emptyDraft(): UpdateUserAccessPayload {
  return {
    fullName: "",
    employeeCode: "",
    departmentId: "",
    roleCode: "viewer",
    jobTitle: "",
    isActive: true,
  };
}

function emptyInviteDraft(): InviteUserPayload {
  return {
    email: "",
    fullName: "",
    employeeCode: "",
    departmentId: "",
    roleCode: "viewer",
    jobTitle: "",
  };
}


type DepartmentDraft = {
  id?: string;
  originalRowKey?: string;
  code: string;
  name: string;
  isActive: boolean;
};

type SaveDepartmentPayload = {
  mode: "create" | "update";
  draft: DepartmentDraft;
};

function emptyDepartmentDraft(): DepartmentDraft {
  return {
    code: "",
    name: "",
    isActive: true,
  };
}

function toDepartmentDraft(record?: MasterDataRecord | null): DepartmentDraft {
  if (!record) return emptyDepartmentDraft();
  return {
    id: record.id,
    originalRowKey: record.rowKey,
    code: record.code,
    name: record.name,
    isActive: record.isActive,
  };
}

export function SettingsPage() {
  const queryClient = useQueryClient();
  const { profile, refreshProfile } = useAuth();
  const { isAdmin, canManageRoles, canManageUsers } = useRoleAccess();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("all");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [draft, setDraft] = useState<UpdateUserAccessPayload>(emptyDraft);
  const [inviteDraft, setInviteDraft] = useState<InviteUserPayload>(emptyInviteDraft);
  const [message, setMessage] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [customPassword, setCustomPassword] = useState("");
  const [roleMatrixMessage, setRoleMatrixMessage] = useState("");
  const [roleDrafts, setRoleDrafts] = useState<Record<string, string[]>>({});
  const [departmentSearch, setDepartmentSearch] = useState("");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [departmentDraft, setDepartmentDraft] = useState<DepartmentDraft>(emptyDepartmentDraft);
  const [isDepartmentCreateModalOpen, setIsDepartmentCreateModalOpen] = useState(false);
  const [createDepartmentDraft, setCreateDepartmentDraft] = useState<DepartmentDraft>(emptyDepartmentDraft);
  const [departmentMessage, setDepartmentMessage] = useState("");

  const usersQuery = useQuery({
    queryKey: ["user-access", search, roleFilter, activeFilter],
    queryFn: () => listUserAccess({ search, roleCode: roleFilter, active: activeFilter }),
  });
  const rolesQuery = useQuery({ queryKey: ["user-role-options"], queryFn: listUserRoleOptions });
  const departmentsQuery = useQuery({ queryKey: ["user-department-options"], queryFn: listUserDepartmentOptions });
  const departmentManagerQuery = useQuery({
    queryKey: ["master-data", "departments"],
    queryFn: () => listMasterData("departments"),
    enabled: canManageUsers,
  });
  const rolePermissionsQuery = useQuery({
    queryKey: ["role-permission-matrix"],
    queryFn: listRolePermissionMatrix,
    enabled: canManageRoles,
  });

  const users = usersQuery.data ?? [];
  const roleAssignments = rolePermissionsQuery.data ?? [];
  const departmentRecords = departmentManagerQuery.data ?? [];

  useEffect(() => {
    if (!users.length) {
      setSelectedUserId("");
      setDraft(emptyDraft());
      return;
    }
    const exists = users.some((item) => item.id === selectedUserId);
    setSelectedUserId(exists ? selectedUserId : users[0].id);
  }, [selectedUserId, users]);

  const selectedUser = useMemo(() => users.find((item) => item.id === selectedUserId) ?? null, [selectedUserId, users]);

  useEffect(() => {
    if (!selectedUser) {
      setDraft(emptyDraft());
      return;
    }
    setDraft({
      fullName: selectedUser.fullName,
      employeeCode: selectedUser.employeeCode ?? "",
      departmentId: selectedUser.departmentId ?? "",
      roleCode: selectedUser.roleCode,
      jobTitle: selectedUser.jobTitle ?? "",
      isActive: selectedUser.isActive,
    });
    setTemporaryPassword("");
    setCustomPassword("");
    setMessage("");
  }, [selectedUser]);

  useEffect(() => {
    if (!departmentRecords.length) {
      setSelectedDepartmentId("");
      setDepartmentDraft(emptyDepartmentDraft());
      return;
    }

    const exists = departmentRecords.some((item) => item.id === selectedDepartmentId);
    const nextSelectedId = exists ? selectedDepartmentId : departmentRecords[0].id ?? "";
    setSelectedDepartmentId(nextSelectedId);
  }, [departmentRecords, selectedDepartmentId]);

  const selectedDepartment = useMemo(
    () => departmentRecords.find((item) => item.id === selectedDepartmentId) ?? null,
    [departmentRecords, selectedDepartmentId]
  );

  useEffect(() => {
    if (!selectedDepartment) {
      setDepartmentDraft(emptyDepartmentDraft());
      return;
    }

    setDepartmentDraft(toDepartmentDraft(selectedDepartment));
    setDepartmentMessage("");
  }, [selectedDepartment]);

  useEffect(() => {
    if (!roleAssignments.length) return;
    setRoleDrafts((prev) => {
      const next: Record<string, string[]> = { ...prev };
      for (const role of roleAssignments) {
        if (!next[role.roleCode]) {
          next[role.roleCode] = [...role.permissions];
        }
      }
      return next;
    });
  }, [roleAssignments]);

  const summary = useMemo(
    () =>
      users.reduce(
        (acc, item) => {
          acc.total += 1;
          if (item.isActive) acc.active += 1;
          if (item.roleCode === "admin") acc.admin += 1;
          if (item.roleCode === "action_owner") acc.owners += 1;
          return acc;
        },
        { total: 0, active: 0, admin: 0, owners: 0 }
      ),
    [users]
  );

  const roleSummary = useMemo(
    () => ({
      totalRoles: roleAssignments.length,
      editableRoles: roleAssignments.filter((item) => item.isActive).length,
      permissionSets: roleAssignments.reduce((acc, item) => acc + (roleDrafts[item.roleCode]?.length ?? item.permissions.length), 0),
    }),
    [roleAssignments, roleDrafts]
  );

  const filteredDepartments = useMemo(() => {
    const normalized = departmentSearch.trim().toLowerCase();
    if (!normalized) return departmentRecords;

    return departmentRecords.filter((item) =>
      [item.code, item.name].join(" ").toLowerCase().includes(normalized)
    );
  }, [departmentRecords, departmentSearch]);

  const departmentSummary = useMemo(
    () => ({
      total: departmentRecords.length,
      active: departmentRecords.filter((item) => item.isActive).length,
    }),
    [departmentRecords]
  );

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUser) throw new Error("Select a user first.");
      return updateUserAccess(selectedUser.id, draft);
    },
    onSuccess: async () => {
      setMessage("Saved.");
      await queryClient.invalidateQueries({ queryKey: ["user-access"] });
      if (selectedUser?.id === profile?.id) {
        await refreshProfile();
      }
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Save failed."),
  });

  const inviteMutation = useMutation({
    mutationFn: () => inviteUser(inviteDraft),
    onSuccess: async (result) => {
      setInviteMessage(result.message);
      setInviteDraft(emptyInviteDraft());
      await queryClient.invalidateQueries({ queryKey: ["user-access"] });
    },
    onError: (error) => setInviteMessage(error instanceof Error ? error.message : "Invite failed."),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUser) throw new Error("Select a user first.");
      return resetUserPassword(selectedUser.id);
    },
    onSuccess: (result) => {
      setTemporaryPassword(result.temporaryPassword);
      setCustomPassword("");
      setMessage("Temporary password generated.");
    },
    onError: (error) => {
      setMessage(error instanceof Error ? error.message : "Reset failed.");
      setTemporaryPassword("");
    },
  });

  const setPasswordMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUser) throw new Error("Select a user first.");
      if (customPassword.trim().length < 8) throw new Error("Password must be at least 8 characters.");
      return setUserPassword(selectedUser.id, customPassword.trim());
    },
    onSuccess: async (result) => {
      setMessage(result.message);
      setTemporaryPassword("");
      setCustomPassword("");
      await queryClient.invalidateQueries({ queryKey: ["user-access"] });
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Password update failed."),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUser) throw new Error("Select a user first.");
      return deleteUserAccess(selectedUser.id);
    },
    onSuccess: async (result) => {
      setMessage(result.message);
      setSelectedUserId("");
      setTemporaryPassword("");
      setCustomPassword("");
      await queryClient.invalidateQueries({ queryKey: ["user-access"] });
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Delete failed."),
  });

  const saveDepartmentMutation = useMutation({
    mutationFn: async ({ mode, draft: nextDraft }: SaveDepartmentPayload) => {
      if (!nextDraft.code.trim() || !nextDraft.name.trim()) {
        throw new Error("Department code and name are required.");
      }

      await saveMasterData("departments", {
        mode,
        id: mode === "update" ? nextDraft.id : undefined,
        originalRowKey: mode === "update" ? nextDraft.originalRowKey : undefined,
        code: nextDraft.code,
        name: nextDraft.name,
        isActive: nextDraft.isActive,
      });
    },
    onSuccess: async (_result, variables: SaveDepartmentPayload) => {
      await queryClient.invalidateQueries({ queryKey: ["master-data", "departments"] });
      await queryClient.invalidateQueries({ queryKey: ["user-department-options"] });
      await queryClient.invalidateQueries({ queryKey: ["user-access"] });

      if (variables.mode === "create") {
        setDepartmentMessage("Department added.");
        setCreateDepartmentDraft(emptyDepartmentDraft());
        setIsDepartmentCreateModalOpen(false);
        return;
      }

      setDepartmentMessage("Department updated.");
    },
    onError: (error) => setDepartmentMessage(error instanceof Error ? error.message : "Department save failed."),
  });

  const openDepartmentCreateModal = () => {
    saveDepartmentMutation.reset();
    setDepartmentMessage("");
    setCreateDepartmentDraft(emptyDepartmentDraft());
    setIsDepartmentCreateModalOpen(true);
  };

  const closeDepartmentCreateModal = () => {
    if (saveDepartmentMutation.isPending) return;
    setIsDepartmentCreateModalOpen(false);
    setCreateDepartmentDraft(emptyDepartmentDraft());
    setDepartmentMessage("");
  };

  useEffect(() => {
    if (!isDepartmentCreateModalOpen) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeDepartmentCreateModal();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDepartmentCreateModalOpen, saveDepartmentMutation.isPending]);

  const deleteDepartmentMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDepartment) throw new Error("Select a department first.");
      await deleteMasterData("departments", selectedDepartment);
    },
    onSuccess: async () => {
      setDepartmentMessage("Department deleted.");
      await queryClient.invalidateQueries({ queryKey: ["master-data", "departments"] });
      await queryClient.invalidateQueries({ queryKey: ["user-department-options"] });
      await queryClient.invalidateQueries({ queryKey: ["user-access"] });
      setSelectedDepartmentId("");
      setDepartmentDraft(emptyDepartmentDraft());
    },
    onError: (error) => setDepartmentMessage(error instanceof Error ? error.message : "Department delete failed."),
  });

  const saveRoleMutation = useMutation({
    mutationFn: async ({ roleCode, permissions }: { roleCode: string; permissions: string[] }) => saveRolePermissions(roleCode, permissions),
    onSuccess: async () => {
      setRoleMatrixMessage("Role permissions saved.");
      await queryClient.invalidateQueries({ queryKey: ["role-permission-matrix"] });
      await queryClient.invalidateQueries({ queryKey: ["user-access"] });
      await refreshProfile();
    },
    onError: (error) => setRoleMatrixMessage(error instanceof Error ? error.message : "Permission save failed."),
  });

  const busy =
    saveMutation.isPending ||
    inviteMutation.isPending ||
    resetPasswordMutation.isPending ||
    setPasswordMutation.isPending ||
    deleteMutation.isPending ||
    saveDepartmentMutation.isPending ||
    deleteDepartmentMutation.isPending ||
    saveRoleMutation.isPending;

  function toggleRolePermission(roleCode: string, permissionCode: string) {
    setRoleDrafts((prev) => {
      const current = new Set(prev[roleCode] ?? getDefaultPermissionsForRole(roleCode));
      if (current.has(permissionCode)) {
        current.delete(permissionCode);
      } else {
        current.add(permissionCode);
      }
      return {
        ...prev,
        [roleCode]: [...current].sort(),
      };
    });
  }

  function resetRoleDraft(role: RolePermissionAssignment) {
    setRoleDrafts((prev) => ({
      ...prev,
      [role.roleCode]: [...role.permissions],
    }));
  }

  return (
    <div className="space-y-5">
      <FeatureIntro
        title="Users & access"
        description="Keep the user admin area compact: edit profiles, manage passwords, remove users when needed, and maintain the permission matrix at the bottom."
        actions={busy ? <Spinner /> : undefined}
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Users" value={summary.total} compact />
        <StatCard label="Active" value={summary.active} tone="green" compact />
        <StatCard label="Admins" value={summary.admin} tone="red" compact />
        <StatCard label="Owners" value={summary.owners} tone="amber" compact />
      </section>

      <Card>
        <CardContent className="grid gap-3 pt-6 md:grid-cols-3 xl:grid-cols-[1.3fr_0.8fr_0.8fr]">
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name / email / employee code" />
          <Select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
            <option value="all">All roles</option>
            {(rolesQuery.data ?? []).map((role) => <option key={role.code} value={role.code}>{role.name}</option>)}
          </Select>
          <Select value={activeFilter} onChange={(event) => setActiveFilter(event.target.value as typeof activeFilter)}>
            <option value="all">All status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        </CardContent>
      </Card>

      {canManageUsers ? (
        <Card className="border-blue-200/80 bg-gradient-to-br from-blue-50 via-white to-slate-50 shadow-[0_14px_36px_rgba(37,99,235,0.08)]">
          <CardHeader><CardTitle>Invite user</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <Field label="Email"><Input value={inviteDraft.email} onChange={(event) => setInviteDraft((prev) => ({ ...prev, email: event.target.value }))} placeholder="name@anrpc.com" /></Field>
              <Field label="Full name"><Input value={inviteDraft.fullName} onChange={(event) => setInviteDraft((prev) => ({ ...prev, fullName: event.target.value }))} /></Field>
              <Field label="Employee code"><Input value={inviteDraft.employeeCode ?? ""} onChange={(event) => setInviteDraft((prev) => ({ ...prev, employeeCode: event.target.value }))} /></Field>
              <Field label="Job title"><Input value={inviteDraft.jobTitle ?? ""} onChange={(event) => setInviteDraft((prev) => ({ ...prev, jobTitle: event.target.value }))} /></Field>
              <Field label="Department"><Select value={inviteDraft.departmentId ?? ""} onChange={(event) => setInviteDraft((prev) => ({ ...prev, departmentId: event.target.value }))}><option value="">No department</option>{(departmentsQuery.data ?? []).map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</Select></Field>
              <Field label="Role"><Select value={inviteDraft.roleCode} onChange={(event) => setInviteDraft((prev) => ({ ...prev, roleCode: event.target.value }))}>{(rolesQuery.data ?? []).map((role) => <option key={role.code} value={role.code}>{role.name}</option>)}</Select></Field>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={() => void inviteMutation.mutateAsync()} disabled={inviteMutation.isPending}>Send invite</Button>
              {inviteMessage ? <BidiText className="text-sm text-slate-600">{inviteMessage}</BidiText> : null}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {canManageUsers ? (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle>Departments</CardTitle>
              <div className="flex flex-wrap gap-2">
                <Badge tone="blue">{departmentSummary.total} total</Badge>
                <Badge tone="green">{departmentSummary.active} active</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
              <div className="space-y-3">
                <Input
                  value={departmentSearch}
                  onChange={(event) => setDepartmentSearch(event.target.value)}
                  placeholder="Search department code or name"
                />
                {departmentManagerQuery.isLoading ? (
                  <div className="flex min-h-[180px] items-center justify-center"><Spinner /></div>
                ) : departmentManagerQuery.error ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">Failed to load departments.</div>
                ) : !filteredDepartments.length ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">No departments found.</div>
                ) : (
                  <div className="overflow-hidden rounded-3xl border border-slate-200">
                    <table className="min-w-full text-sm">
                      <thead className="bg-slate-50 text-left text-slate-500">
                        <tr>
                          <th className="px-3 py-3 font-semibold">Code</th>
                          <th className="px-3 py-3 font-semibold">Name</th>
                          <th className="px-3 py-3 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDepartments.map((item) => {
                          const isSelected = item.id === selectedDepartmentId;
                          return (
                            <tr
                              key={item.rowKey}
                              className={cn(
                                "cursor-pointer border-t border-slate-100 transition hover:bg-slate-50",
                                isSelected && "bg-blue-50/60"
                              )}
                              onClick={() => {
                                setSelectedDepartmentId(item.id ?? "");
                                setDepartmentMessage("");
                              }}
                            >
                              <td className="px-3 py-3 font-semibold text-slate-900"><BidiText>{item.code}</BidiText></td>
                              <td className="px-3 py-3 text-slate-700"><BidiText>{item.name}</BidiText></td>
                              <td className="px-3 py-3">
                                <Badge tone={item.isActive ? "green" : "red"}>{item.isActive ? "Active" : "Inactive"}</Badge>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-base font-semibold text-slate-900">Edit department</div>
                    <div className="mt-1 text-sm text-slate-600">Select a department from the list to edit it. New departments now open in a separate pop-up.</div>
                  </div>
                  <Button
                    variant="outline"
                    className="border-blue-200 bg-blue-600 text-white hover:bg-blue-500"
                    onClick={openDepartmentCreateModal}
                  >
                    New department
                  </Button>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <Field label="Department code">
                    <Input
                      value={departmentDraft.code}
                      onChange={(event) => setDepartmentDraft((prev) => ({ ...prev, code: event.target.value }))}
                      disabled={!canManageUsers}
                      placeholder="OPS"
                    />
                  </Field>
                  <Field label="Department name">
                    <Input
                      value={departmentDraft.name}
                      onChange={(event) => setDepartmentDraft((prev) => ({ ...prev, name: event.target.value }))}
                      disabled={!canManageUsers}
                      placeholder="Operations"
                    />
                  </Field>
                  <Field label="Status">
                    <Select
                      value={departmentDraft.isActive ? "active" : "inactive"}
                      onChange={(event) =>
                        setDepartmentDraft((prev) => ({ ...prev, isActive: event.target.value === "active" }))
                      }
                      disabled={!canManageUsers}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </Select>
                  </Field>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <Button
                    onClick={() => void saveDepartmentMutation.mutateAsync({ mode: "update", draft: departmentDraft })}
                    disabled={!canManageUsers || !selectedDepartment || saveDepartmentMutation.isPending}
                  >
                    Save department
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (!selectedDepartment) return;
                      setDepartmentDraft(toDepartmentDraft(selectedDepartment));
                      setDepartmentMessage("");
                    }}
                    disabled={!selectedDepartment}
                  >
                    Reset
                  </Button>
                  <Button
                    variant="outline"
                    className="border-red-300 text-red-700 hover:bg-red-100"
                    onClick={() => {
                      if (!selectedDepartment) return;
                      if (!window.confirm(`Delete department ${selectedDepartment.name}?`)) return;
                      void deleteDepartmentMutation.mutateAsync();
                    }}
                    disabled={!selectedDepartment || deleteDepartmentMutation.isPending}
                  >
                    Delete department
                  </Button>
                  {departmentMessage ? <BidiText className="text-sm text-slate-600">{departmentMessage}</BidiText> : null}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {isDepartmentCreateModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <button
            type="button"
            aria-label="Close new department modal"
            className="absolute inset-0 cursor-default"
            onClick={closeDepartmentCreateModal}
          />
          <div className="relative max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-[2rem] bg-white shadow-2xl">
            <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-6 py-5 backdrop-blur">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-blue-700">
                    Create department
                  </div>
                  <h2 className="mt-3 text-xl font-bold text-slate-950">New department</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    This pop-up always creates a new department and never updates the selected one.
                  </p>
                </div>
                <Button type="button" variant="ghost" onClick={closeDepartmentCreateModal} disabled={saveDepartmentMutation.isPending}>
                  Close
                </Button>
              </div>
            </div>

            <div className="space-y-4 p-6">
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Department code">
                  <Input
                    value={createDepartmentDraft.code}
                    onChange={(event) => setCreateDepartmentDraft((prev) => ({ ...prev, code: event.target.value }))}
                    disabled={!canManageUsers || saveDepartmentMutation.isPending}
                    placeholder="OPS"
                  />
                </Field>
                <Field label="Department name">
                  <Input
                    value={createDepartmentDraft.name}
                    onChange={(event) => setCreateDepartmentDraft((prev) => ({ ...prev, name: event.target.value }))}
                    disabled={!canManageUsers || saveDepartmentMutation.isPending}
                    placeholder="Operations"
                  />
                </Field>
                <Field label="Status">
                  <Select
                    value={createDepartmentDraft.isActive ? "active" : "inactive"}
                    onChange={(event) =>
                      setCreateDepartmentDraft((prev) => ({ ...prev, isActive: event.target.value === "active" }))
                    }
                    disabled={!canManageUsers || saveDepartmentMutation.isPending}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </Select>
                </Field>
              </div>

              <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 pt-4">
                <Button
                  onClick={() => void saveDepartmentMutation.mutateAsync({ mode: "create", draft: createDepartmentDraft })}
                  disabled={!canManageUsers || saveDepartmentMutation.isPending}
                >
                  {saveDepartmentMutation.isPending ? "Creating..." : "Create department"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    saveDepartmentMutation.reset();
                    setDepartmentMessage("");
                    setCreateDepartmentDraft(emptyDepartmentDraft());
                  }}
                  disabled={saveDepartmentMutation.isPending}
                >
                  Reset
                </Button>
                {departmentMessage ? <BidiText className="text-sm text-slate-600">{departmentMessage}</BidiText> : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader><CardTitle>Users</CardTitle></CardHeader>
          <CardContent>
            {usersQuery.isLoading ? (
              <div className="flex min-h-[260px] items-center justify-center"><Spinner /></div>
            ) : usersQuery.error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">Failed to load users.</div>
            ) : !users.length ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">No users found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-slate-500">
                      <th className="px-3 py-3 font-semibold">Name</th>
                      <th className="px-3 py-3 font-semibold">Role</th>
                      <th className="px-3 py-3 font-semibold">Department</th>
                      <th className="px-3 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((item) => {
                      const isSelected = item.id === selectedUserId;
                      return (
                        <tr key={item.id} className={cn("cursor-pointer border-b border-slate-100 transition hover:bg-slate-50", isSelected && "bg-blue-50/60")} onClick={() => setSelectedUserId(item.id)}>
                          <td className="px-3 py-4"><BidiText className="block font-semibold text-slate-900">{item.fullName}</BidiText><BidiText className="mt-1 block text-xs text-slate-500">{item.email}</BidiText>{item.employeeCode ? <BidiText className="mt-1 block text-xs text-slate-500">{item.employeeCode}</BidiText> : null}</td>
                          <td className="px-3 py-4"><Badge tone={mapRoleTone(item.roleCode)}>{mapRoleLabel(item.roleCode)}</Badge></td>
                          <td className="px-3 py-4 text-slate-700"><BidiText>{item.departmentName || "—"}</BidiText></td>
                          <td className="px-3 py-4"><Badge tone={item.isActive ? "green" : "red"}>{item.isActive ? "Active" : "Inactive"}</Badge></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><div className="flex items-center justify-between gap-3"><CardTitle>User details</CardTitle>{selectedUser ? <Badge tone={selectedUser.isActive ? "green" : "red"}>{selectedUser.isActive ? "Active" : "Inactive"}</Badge> : null}</div></CardHeader>
          <CardContent className="space-y-4">
            {!selectedUser ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">Select a user.</div>
            ) : (
              <>
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Full name"><Input value={draft.fullName} onChange={(event) => setDraft((prev) => ({ ...prev, fullName: event.target.value }))} disabled={!canManageUsers} /></Field>
                  <Field label="Email"><Input value={selectedUser.email} disabled /></Field>
                  <Field label="Employee code"><Input value={draft.employeeCode ?? ""} onChange={(event) => setDraft((prev) => ({ ...prev, employeeCode: event.target.value }))} disabled={!canManageUsers} /></Field>
                  <Field label="Job title"><Input value={draft.jobTitle ?? ""} onChange={(event) => setDraft((prev) => ({ ...prev, jobTitle: event.target.value }))} disabled={!canManageUsers} /></Field>
                  <Field label="Department"><Select value={draft.departmentId ?? ""} onChange={(event) => setDraft((prev) => ({ ...prev, departmentId: event.target.value }))} disabled={!canManageUsers}><option value="">No department</option>{(departmentsQuery.data ?? []).map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</Select></Field>
                  <Field label="Role"><Select value={draft.roleCode} onChange={(event) => setDraft((prev) => ({ ...prev, roleCode: event.target.value }))} disabled={!canManageUsers}>{(rolesQuery.data ?? []).map((role) => <option key={role.code} value={role.code}>{role.name}</option>)}</Select></Field>
                  <Field label="Access"><Select value={draft.isActive ? "active" : "inactive"} onChange={(event) => setDraft((prev) => ({ ...prev, isActive: event.target.value === "active" }))} disabled={!canManageUsers}><option value="active">Active</option><option value="inactive">Inactive</option></Select></Field>
                  <Field label="Created"><Input value={formatDateLabel(selectedUser.createdAt)} disabled /></Field>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {canManageUsers ? <Button onClick={() => void saveMutation.mutateAsync()} disabled={!selectedUser || saveMutation.isPending}>Save changes</Button> : null}
                  {canManageUsers ? <Button variant="outline" onClick={() => selectedUser && setDraft({ fullName: selectedUser.fullName, employeeCode: selectedUser.employeeCode ?? "", departmentId: selectedUser.departmentId ?? "", roleCode: selectedUser.roleCode, jobTitle: selectedUser.jobTitle ?? "", isActive: selectedUser.isActive })}>Reset</Button> : null}
                  {message ? <BidiText className="text-sm text-slate-600">{message}</BidiText> : null}
                </div>

                {isAdmin ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-sm font-semibold text-slate-900">Password tools</div>
                    <div className="mt-3 space-y-3">
                      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                        <Input
                          type="password"
                          value={customPassword}
                          onChange={(event) => setCustomPassword(event.target.value)}
                          placeholder="Set custom password"
                          className="min-w-0"
                        />
                        <Button
                          variant="outline"
                          className="w-full md:w-auto"
                          onClick={() => void setPasswordMutation.mutateAsync()}
                          disabled={setPasswordMutation.isPending || !customPassword.trim()}
                        >
                          Update password
                        </Button>
                      </div>
                      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-3">
                        <div className="flex flex-col gap-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Temporary password</div>
                              <div className="mt-1 text-xs leading-5 text-slate-600">Use this when reset email is unavailable or rate-limited.</div>
                            </div>
                            <Button
                              variant="outline"
                              className="w-full md:w-auto"
                              onClick={() => void resetPasswordMutation.mutateAsync()}
                              disabled={resetPasswordMutation.isPending}
                            >
                              Generate temporary password
                            </Button>
                          </div>
                          {temporaryPassword ? (
                            <div className="break-all rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 font-mono text-sm text-slate-900">
                              {temporaryPassword}
                            </div>
                          ) : (
                            <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-500">No temporary password generated yet.</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}

                {isAdmin ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                    <div className="text-sm font-semibold text-red-900">Danger zone</div>
                    <p className="mt-2 text-sm leading-6 text-red-800">Delete the selected user from authentication and profile records. This action cannot be undone.</p>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <Button
                        variant="outline"
                        className="border-red-300 text-red-700 hover:bg-red-100"
                        disabled={deleteMutation.isPending || selectedUser.id === profile?.id}
                        onClick={() => {
                          if (!window.confirm(`Delete ${selectedUser.fullName} permanently?`)) return;
                          void deleteMutation.mutateAsync();
                        }}
                      >
                        Delete user
                      </Button>
                      {selectedUser.id === profile?.id ? <span className="text-xs text-red-700">You cannot delete the currently signed-in admin.</span> : null}
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {canManageRoles ? (
        <section className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard label="Roles" value={roleSummary.totalRoles} compact />
            <StatCard label="Active roles" value={roleSummary.editableRoles} tone="blue" compact />
            <StatCard label="Assigned permissions" value={roleSummary.permissionSets} tone="amber" compact />
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle>Role permissions</CardTitle>
                {roleMatrixMessage ? <BidiText className="text-sm text-slate-600">{roleMatrixMessage}</BidiText> : null}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {rolePermissionsQuery.isLoading ? (
                <div className="flex min-h-[220px] items-center justify-center"><Spinner /></div>
              ) : rolePermissionsQuery.error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">Failed to load role permissions.</div>
              ) : !roleAssignments.length ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">No role data found.</div>
              ) : (
                <div className="space-y-4">
                  {roleAssignments.map((role) => {
                    const selectedPermissions = roleDrafts[role.roleCode] ?? role.permissions;
                    return (
                      <div key={role.roleCode} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <BidiText className="text-base font-semibold text-slate-900">{role.roleName}</BidiText>
                              <Badge tone={mapRoleTone(role.roleCode)}>{mapRoleLabel(role.roleCode)}</Badge>
                              {!role.isActive ? <Badge tone="red">Inactive</Badge> : null}
                            </div>
                            {role.roleDescription ? <BidiBlock className="mt-2 text-sm leading-6 text-slate-600">{role.roleDescription}</BidiBlock> : null}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button variant="outline" onClick={() => resetRoleDraft(role)}>Reset</Button>
                            <Button onClick={() => void saveRoleMutation.mutateAsync({ roleCode: role.roleCode, permissions: selectedPermissions })} disabled={saveRoleMutation.isPending}>Save role</Button>
                          </div>
                        </div>
                        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                          {APP_PERMISSION_OPTIONS.map((permission) => {
                            const checked = selectedPermissions.includes(permission.code);
                            return (
                              <label key={permission.code} className={cn("flex items-start gap-3 rounded-2xl border p-3 transition", checked ? "border-blue-300 bg-blue-50/70" : "border-slate-200 bg-slate-50 hover:bg-slate-100")}>
                                <input type="checkbox" className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600" checked={checked} onChange={() => toggleRolePermission(role.roleCode, permission.code)} />
                                <div>
                                  <BidiText className="block text-sm font-semibold text-slate-900">{permission.label}</BidiText>
                                  <BidiBlock className="mt-1 text-xs leading-5 text-slate-600">{permission.description}</BidiBlock>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      ) : null}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block"><div className="mb-2 text-sm font-semibold text-slate-700">{label}</div>{children}</label>;
}
