import type { AuthConfig } from "./types";

export function resolveAuthConfig(env: {
  NEXT_PUBLIC_AUTH_PROVIDER?: string;
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
}): AuthConfig {
  const provider =
    env.NEXT_PUBLIC_AUTH_PROVIDER === "supabase" ? "supabase" : "demo";

  return {
    provider,
    supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
}

export function isSupabaseAuthReady(config: AuthConfig): boolean {
  return (
    config.provider === "supabase" &&
    Boolean(config.supabaseUrl && config.supabaseAnonKey)
  );
}
