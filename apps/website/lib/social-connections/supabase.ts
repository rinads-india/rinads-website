/**
 * Service-role Supabase client factory for social connections.
 * SERVER ONLY. Uses SUPABASE_SERVICE_ROLE_KEY.
 */
import { createServiceRoleClient } from "@rinads/database";

let _client: ReturnType<typeof createServiceRoleClient> | null = null;

export function getSocialServiceClient() {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for social connections."
    );
  }
  _client = createServiceRoleClient({ url, anonKey: "", serviceRoleKey: key });
  return _client;
}
