/**
 * Auth types — production path is Supabase Auth.
 * Demo provider remains for Public Experience until auth_supabase_enabled.
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

export type SignInWithPasswordInput = {
  email: string;
  password: string;
};

export type SignUpInput = {
  email: string;
  password: string;
  displayName?: string;
};
