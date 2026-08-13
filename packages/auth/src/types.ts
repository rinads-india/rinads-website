/**
 * Future production auth types (Supabase Auth in Phase 1+).
 * Phase 0 does not implement live authentication here.
 */

export type AuthProvider = "supabase" | "demo";

export type AuthUser = {
  id: string;
  email?: string | null;
  displayName?: string | null;
};

export type AuthSession = {
  user: AuthUser;
  accessToken?: string;
  expiresAt?: string;
  /** true when session is non-production / local demo */
  demo?: boolean;
};

export type AuthConfig = {
  provider: AuthProvider;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
};
