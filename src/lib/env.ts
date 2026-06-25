/// <reference types="vite/client" />

type EnvConfig = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  appUrl: string;
};

function getEnvValue(key: keyof ImportMetaEnv) {
  return import.meta.env[key];
}

export const env: EnvConfig = {
  supabaseUrl: getEnvValue("VITE_SUPABASE_URL") ?? "",
  supabaseAnonKey: getEnvValue("VITE_SUPABASE_ANON_KEY") ?? "",
  appUrl: getEnvValue("VITE_APP_URL") ?? ""
};

export const hasSupabaseEnv = Boolean(env.supabaseUrl && env.supabaseAnonKey);
