import { createClient } from "@supabase/supabase-js";

import { env, hasSupabaseEnv } from "@/lib/env";
import type { Database } from "@/types/database";

const fallbackUrl = "https://placeholder.supabase.co";
const fallbackAnonKey =
  "placeholder-anon-key-placeholder-anon-key-placeholder-anon-key";

export const supabase = createClient<Database>(
  hasSupabaseEnv ? env.supabaseUrl : fallbackUrl,
  hasSupabaseEnv ? env.supabaseAnonKey : fallbackAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);

export const SUPABASE_IS_CONFIGURED = hasSupabaseEnv;
