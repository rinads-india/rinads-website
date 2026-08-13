import type { AuthConfig } from "./types";

/** Phase 0 default: demo only. Production Supabase Auth arrives in Phase 1. */
export const defaultAuthConfig: AuthConfig = {
  provider: "demo",
};
