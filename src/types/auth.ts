import type { Session, User } from "@supabase/supabase-js";

export type AppRole = "admin" | "psm_manager" | "action_owner" | "viewer";

export type AppProfile = {
  id: string;
  email: string;
  fullName: string;
  departmentId?: string | null;
  jobTitle?: string | null;
  role: AppRole;
  permissions: string[];
  isActive: boolean;
};

export type AuthContextValue = {
  user: User | null;
  session: Session | null;
  profile: AppProfile | null;
  role: AppRole | null;
  loading: boolean;
  authError: string;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  hasRole: (roles: AppRole | AppRole[]) => boolean;
  hasPermission: (permissions: string | string[]) => boolean;
};
