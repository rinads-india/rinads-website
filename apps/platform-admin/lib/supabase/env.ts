import { resolveAuthConfig, isSupabaseAuthReady } from "@rinads/auth";

export function getAuthConfig() {
  return resolveAuthConfig({
    NEXT_PUBLIC_AUTH_PROVIDER: process.env.NEXT_PUBLIC_AUTH_PROVIDER,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
}

export function isSupabaseMode(): boolean {
  return isSupabaseAuthReady(getAuthConfig());
}

export function isDemoMode(): boolean {
  return process.env.USE_DEMO_STORE === "1" || !isSupabaseMode();
}

export function getSupabasePublicConfig() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  };
}

export function getServiceRoleKey(): string | undefined {
  return process.env.SUPABASE_SERVICE_ROLE_KEY;
}
