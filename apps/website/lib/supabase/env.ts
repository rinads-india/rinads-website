import { resolveAuthConfig, isSupabaseAuthReady } from "@rinads/auth";

type WebsiteSupabaseEnv = {
  NEXT_PUBLIC_AUTH_PROVIDER?: string;
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
};

export function resolveWebsiteSupabasePublicKey(
  env: WebsiteSupabaseEnv = process.env
): string {
  return (
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    ""
  );
}

export function getAuthConfig() {
  const publicKey = resolveWebsiteSupabasePublicKey();
  return resolveAuthConfig({
    NEXT_PUBLIC_AUTH_PROVIDER: process.env.NEXT_PUBLIC_AUTH_PROVIDER,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    // @rinads/auth still names this compatibility field `anonKey`; Supabase
    // clients accept either the modern publishable key or the legacy anon key.
    NEXT_PUBLIC_SUPABASE_ANON_KEY: publicKey,
  });
}

export function isSupabaseMode(): boolean {
  return isSupabaseAuthReady(getAuthConfig());
}

export function getSupabasePublicConfig() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    anonKey: resolveWebsiteSupabasePublicKey(),
  };
}
