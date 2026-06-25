import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren
} from "react";
import type { Session, User } from "@supabase/supabase-js";

import { getDefaultPermissionsForRole, hasPermissionInRole } from "@/lib/permissions";
import { writeAuditLog } from "@/features/logs/api/logs.api";
import { supabase, SUPABASE_IS_CONFIGURED } from "@/lib/supabase";
import type { AppProfile, AppRole, AuthContextValue } from "@/types/auth";

type ProfileRow = {
  id: string;
  email: string;
  full_name: string;
  department_id: string | null;
  job_title: string | null;
  role_code: string;
  is_active: boolean;
};

type RolePermissionRow = {
  permission_code: string;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function mapRole(roleCode: string | null | undefined): AppRole {
  if (roleCode === "admin" || roleCode === "psm_manager" || roleCode === "action_owner") {
    return roleCode;
  }

  return "viewer";
}

function mapProfile(row: ProfileRow, permissions: string[]): AppProfile {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    departmentId: row.department_id,
    jobTitle: row.job_title,
    role: mapRole(row.role_code),
    permissions,
    isActive: row.is_active
  };
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AppProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  const fetchRolePermissions = useCallback(async (roleCode: string) => {
    const { data, error } = await supabase
      .from("role_permissions")
      .select("permission_code")
      .eq("role_code", roleCode);

    if (error) {
      return getDefaultPermissionsForRole(roleCode);
    }

    const granted = ((data ?? []) as RolePermissionRow[]).map((item) => item.permission_code);
    return granted.length ? granted : getDefaultPermissionsForRole(roleCode);
  }, []);

  const fetchProfile = useCallback(
    async (userId: string) => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, department_id, job_title, role_code, is_active")
        .eq("id", userId)
        .single();

      if (error) {
        throw error;
      }

      const row = data as ProfileRow;
      const permissions = await fetchRolePermissions(row.role_code);
      return mapProfile(row, permissions);
    },
    [fetchRolePermissions]
  );

  const hydrateSession = useCallback(
    async (nextSession: Session | null) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setAuthError("");

      if (!nextSession?.user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        const nextProfile = await fetchProfile(nextSession.user.id);
        setProfile(nextProfile);

        if (!nextProfile.isActive) {
          setAuthError("Your profile exists but is marked as inactive. Please contact the system administrator.");
        }
      } catch (error) {
        setProfile(null);
        setAuthError(
          error instanceof Error
            ? error.message
            : "Could not load your application profile from Supabase."
        );
      } finally {
        setLoading(false);
      }
    },
    [fetchProfile]
  );

  useEffect(() => {
    let isMounted = true;

    if (!SUPABASE_IS_CONFIGURED) {
      setLoading(false);
      return () => undefined;
    }

    void supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      void hydrateSession(data.session);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void hydrateSession(nextSession);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [hydrateSession]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!SUPABASE_IS_CONFIGURED) {
      throw new Error("Supabase environment variables are not configured yet.");
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    try {
      await writeAuditLog({
        entityType: "auth",
        eventType: "login",
        entityId: data.user?.id ?? null,
        entityLabel: data.user?.email ?? email,
        message: `User logged in`,
        details: { method: "password" }
      });
    } catch {
      // Do not block login if audit logging is temporarily unavailable.
    }
  }, []);

  const signOut = useCallback(async () => {
    if (!SUPABASE_IS_CONFIGURED) return;

    try {
      if (user) {
        await writeAuditLog({
          entityType: "auth",
          eventType: "logout",
          entityId: user.id,
          entityLabel: user.email ?? null,
          message: `User logged out`,
          details: {}
        });
      }
    } catch {
      // Do not block logout if audit logging is temporarily unavailable.
    }

    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, [user]);

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      return;
    }

    setLoading(true);
    await hydrateSession(session);
  }, [hydrateSession, session, user]);

  const hasRole = useCallback(
    (roles: AppRole | AppRole[]) => {
      if (!profile?.isActive || !profile.role) return false;
      const normalizedRoles = Array.isArray(roles) ? roles : [roles];
      return normalizedRoles.includes(profile.role);
    },
    [profile]
  );

  const hasPermission = useCallback(
    (permissions: string | string[]) => {
      if (!profile?.isActive || !profile.role) return false;
      return hasPermissionInRole(profile.role, profile.permissions, permissions);
    },
    [profile]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      profile,
      role: profile?.role ?? null,
      loading,
      authError,
      isAuthenticated: Boolean(user && profile && profile.isActive),
      signIn,
      signOut,
      refreshProfile,
      hasRole,
      hasPermission
    }),
    [authError, hasPermission, hasRole, loading, profile, refreshProfile, session, signIn, signOut, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthContext };
