import { createClient } from "@supabase/supabase-js";

export async function requireUserManagementPermission(event) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const authHeader = event.headers.authorization || event.headers.Authorization;

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    throw new Error("Missing Supabase environment variables on Netlify.");
  }

  if (!authHeader?.startsWith("Bearer ")) {
    const error = new Error("Missing bearer token.");
    error.statusCode = 401;
    throw error;
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();

  if (userError || !user) {
    const error = new Error("Invalid session.");
    error.statusCode = 401;
    throw error;
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("id, role_code, is_active")
    .eq("id", user.id)
    .single();

  if (profileError || !profile?.is_active) {
    const error = new Error("Active profile is required for this action.");
    error.statusCode = 403;
    throw error;
  }

  const { data: permissionRow, error: permissionError } = await adminClient
    .from("role_permissions")
    .select("permission_code")
    .eq("role_code", profile.role_code)
    .eq("permission_code", "settings.users.manage")
    .maybeSingle();

  if (permissionError || !permissionRow) {
    const error = new Error("You do not have permission to manage users.");
    error.statusCode = 403;
    throw error;
  }

  return { adminClient, currentUserId: user.id, currentRoleCode: profile.role_code };
}
