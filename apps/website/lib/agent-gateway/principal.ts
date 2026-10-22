import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import {
  ACTIVE_ORG_COOKIE,
  loadMemberships,
  type TenancySupabaseClient,
} from "@rinads/tenancy";
import { getSupabasePublicConfig, isSupabaseMode } from "@/lib/supabase/env";
import { createWebsiteServerClient } from "@/lib/supabase/server";
import {
  resolveRinadsAgentScope,
  type RinadsAgentAuthMethod,
} from "./scope";

export type RinadsAgentPrincipal = {
  actorId: string;
  organizationId: string;
  organizationName: string;
  roleKey: string;
  permissionIds: string[];
  authMethod: RinadsAgentAuthMethod;
};

export type RinadsAgentPrincipalResolution =
  | { status: "authenticated"; principal: RinadsAgentPrincipal }
  | { status: "unauthenticated" }
  | { status: "scope_required"; authMethod: RinadsAgentAuthMethod }
  | { status: "membership_required"; authMethod: RinadsAgentAuthMethod }
  | { status: "unavailable"; reason: string };

function bearerToken(request: Request): string | undefined {
  const authorization = request.headers.get("authorization")?.trim();
  if (!authorization) return undefined;
  const match = /^Bearer\s+(.+)$/i.exec(authorization);
  const token = match?.[1]?.trim();
  return token || undefined;
}

async function resolveAuthenticatedPrincipal(input: {
  client: TenancySupabaseClient;
  userId: string;
  authMethod: RinadsAgentAuthMethod;
  activeOrganizationId?: string | null;
}): Promise<RinadsAgentPrincipalResolution> {
  const memberships = await loadMemberships(input.client, input.userId);
  const scope = resolveRinadsAgentScope({
    memberships,
    authMethod: input.authMethod,
    activeOrganizationId: input.activeOrganizationId,
  });

  if (scope.status === "scope_required") {
    return { status: "scope_required", authMethod: input.authMethod };
  }
  if (scope.status === "no_active_membership") {
    return { status: "membership_required", authMethod: input.authMethod };
  }

  return {
    status: "authenticated",
    principal: {
      actorId: input.userId,
      organizationId: scope.membership.organizationId,
      organizationName: scope.membership.organizationName,
      roleKey: scope.membership.roleKey,
      permissionIds: scope.membership.permissions.map(String),
      authMethod: input.authMethod,
    },
  };
}

/**
 * Authenticate an external/first-party RINADS agent request using the existing
 * Supabase identity and tenancy model.
 *
 * - Browser/session calls reuse the normal RINADS auth cookies and signed
 *   active-organization cookie.
 * - Bearer calls validate the Supabase access token with `auth.getUser(token)`.
 * - An external caller can never select `organization_id` through request
 *   payload/headers in this resolver.
 * - Multi-organization bearer identities fail closed until an organization-
 *   bound delegation/OAuth token exists.
 */
export async function resolveRinadsAgentPrincipal(
  request: Request
): Promise<RinadsAgentPrincipalResolution> {
  if (!isSupabaseMode()) {
    return {
      status: "unavailable",
      reason: "RINADS Agent Gateway requires Supabase authentication in this environment.",
    };
  }

  const token = bearerToken(request);
  if (token) {
    const { url, anonKey } = getSupabasePublicConfig();
    const supabase = createClient(url, anonKey, {
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

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return { status: "unauthenticated" };

    return resolveAuthenticatedPrincipal({
      client: supabase as unknown as TenancySupabaseClient,
      userId: data.user.id,
      authMethod: "bearer",
    });
  }

  const supabase = await createWebsiteServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return { status: "unauthenticated" };

  const activeOrganizationId = (await cookies()).get(ACTIVE_ORG_COOKIE)?.value;
  return resolveAuthenticatedPrincipal({
    client: supabase as unknown as TenancySupabaseClient,
    userId: data.user.id,
    authMethod: "session",
    activeOrganizationId,
  });
}
