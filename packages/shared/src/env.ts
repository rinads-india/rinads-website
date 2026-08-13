/**
 * Public / documented environment contract (Phase 0 — unused for live Supabase).
 * Service-role keys must never appear in client bundles.
 */
export type PublicEnv = {
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
};

export type ServerOnlyEnvHint = {
  /** Server-only. Never expose to the browser. Not used in Phase 0. */
  SUPABASE_SERVICE_ROLE_KEY?: string;
};
