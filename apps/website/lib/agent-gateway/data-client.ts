import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicConfig, isSupabaseMode } from "@/lib/supabase/env";
import { createWebsiteServerClient } from "@/lib/supabase/server";

function bearerToken(request: Request): string | undefined {
  const authorization = request.headers.get("authorization")?.trim();
  if (!authorization) return undefined;
  const match = /^Bearer\s+(.+)$/i.exec(authorization);
  const token = match?.[1]?.trim();
  return token || undefined;
}

/**
 * Create a user-scoped Supabase client for an already-authenticated Agent
 * Gateway request. This deliberately uses the public/anon key plus the user's
 * session/bearer token so normal RLS remains authoritative.
 *
 * Never substitute a service-role client here.
 */
export async function createRinadsAgentDataClient(
  request: Request
): Promise<SupabaseClient | null> {
  if (!isSupabaseMode()) return null;

  const token = bearerToken(request);
  if (token) {
    const { url, anonKey } = getSupabasePublicConfig();
    const client = createClient(url, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    const { data, error } = await client.auth.getUser(token);
    if (error || !data.user) return null;
    return client;
  }

  const client = await createWebsiteServerClient();
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return null;
  return client as unknown as SupabaseClient;
}
