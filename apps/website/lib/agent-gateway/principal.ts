import { createServiceRoleClient } from "@rinads/database";
import { cookies } from "next/headers";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  ACTIVE_ORG_COOKIE,
  loadMemberships,
  type TenancySupabaseClient,
} from "@rinads/tenancy";
import { getSupabasePublicConfig, isSupabaseMode } from "@/lib/supabase/env";
import { createWebsiteServerClient } from "@/lib/supabase/server";
import {
  RINADS_AGENT_DELEGATION_TOKEN_PREFIX,
  isRinadsExternalAgentReadScope,
  verifyRinadsAgentDelegation,
  type RinadsExternalAgentClient,
  type RinadsExternalAgentReadScope,
} from "./delegation";
import {
  resolveRinadsAgentScope,
  type RinadsAgentAuthMethod,
} from "./scope";

const DELEGATION_SCOPE_PERMISSION: Record<RinadsExternalAgentReadScope, string> = {
  "intelligence.business_summary.read": "org.read",
  "commerce.catalog.read": "commerce.catalog.read",
  "commerce.order.read": "commerce.order.read",
};

type DelegationLedgerRow = {
  token_id?: unknown;
  user_id?: unknown;
  organization_id?: unknown;
  client?: unknown;
  scopes?: unknown;
  expires_at?: unknown;
  revoked_at?: unknown;
};

export type RinadsAgentPrincipal = {
  actorId: string;
  organizationId: string;
  organizationName: string;
  roleKey: string;
  permissionIds: string[];
  authMethod: RinadsAgentAuthMethod;
  delegationTokenId?: string;
  delegationClient?: RinadsExternalAgentClient;
  delegatedScopes?: RinadsExternalAgentReadScope[];
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

function isDelegationToken(token: string): boolean {
  return token.startsWith(`${RINADS_AGENT_DELEGATION_TOKEN_PREFIX}.`);
}

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function scopes(value: unknown): RinadsExternalAgentReadScope[] | null {
  if (!Array.isArray(value) || !value.every(isRinadsExternalAgentReadScope)) return null;
  return Array.from(new Set(value)).sort() as RinadsExternalAgentReadScope[];
}

function sameScopes(
  left: readonly RinadsExternalAgentReadScope[],
  right: readonly RinadsExternalAgentReadScope[]
): boolean {
  if (left.length !== right.length) return false;
  const normalizedLeft = [...left].sort();
  const normalizedRight = [...right].sort();
  return normalizedLeft.every((scope, index) => scope === normalizedRight[index]);
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
 * Validate a RINADS delegation token without using it as a Supabase data token.
 * A server-only service-role client is used strictly for authorization metadata:
 * delegation ledger + current membership/RBAC. It is never returned to business
 * capability executors and must not become a service-role data path.
 */
async function resolveDelegationPrincipal(
  token: string
): Promise<RinadsAgentPrincipalResolution> {
  const secret = process.env.RINADS_AGENT_DELEGATION_SECRET?.trim();
  if (!secret || secret.length < 32) {
    return {
      status: "unavailable",
      reason: "RINADS delegation verification is not configured in this environment.",
    };
  }

  const verified = await verifyRinadsAgentDelegation({ token, secret });
  if (!verified.ok || verified.claims.client === "internal") {
    return { status: "unauthenticated" };
  }

  const { url, anonKey } = getSupabasePublicConfig();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !anonKey || !serviceRoleKey) {
    return {
      status: "unavailable",
      reason: "RINADS delegation metadata verification requires server database configuration.",
    };
  }

  const serviceClient = createServiceRoleClient({
    url,
    anonKey,
    serviceRoleKey,
  }) as unknown as SupabaseClient;

  const { data: ledgerData, error: ledgerError } = await serviceClient
    .from("external_agent_delegations")
    .select(
      "token_id,user_id,organization_id,client,scopes,expires_at,revoked_at"
    )
    .eq("token_id", verified.claims.jti)
    .maybeSingle();

  if (ledgerError) {
    return {
      status: "unavailable",
      reason: "RINADS delegation ledger is unavailable in this environment.",
    };
  }
  if (!ledgerData) return { status: "unauthenticated" };

  const ledger = ledgerData as DelegationLedgerRow;
  const ledgerScopes = scopes(ledger.scopes);
  const ledgerExpiry = text(ledger.expires_at);
  const ledgerExpirySeconds = ledgerExpiry
    ? Math.floor(Date.parse(ledgerExpiry) / 1000)
    : Number.NaN;
  const ledgerNotRevoked =
    ledger.revoked_at === null || ledger.revoked_at === undefined;

  const ledgerMatches =
    text(ledger.token_id) === verified.claims.jti &&
    text(ledger.user_id) === verified.claims.sub &&
    text(ledger.organization_id) === verified.claims.org &&
    text(ledger.client) === verified.claims.client &&
    ledgerNotRevoked &&
    ledgerScopes !== null &&
    sameScopes(ledgerScopes, verified.claims.scopes) &&
    ledgerExpirySeconds === verified.claims.exp;

  if (!ledgerMatches) return { status: "unauthenticated" };

  const memberships = await loadMemberships(
    serviceClient as unknown as TenancySupabaseClient,
    verified.claims.sub
  );
  const membership = memberships.find(
    (candidate) =>
      candidate.organizationId === verified.claims.org &&
      candidate.organizationStatus === "active"
  );
  if (!membership) {
    return { status: "membership_required", authMethod: "delegation" };
  }

  // Delegation claims are never durable authorization. Re-check the actor's
  // CURRENT role permissions on every request so removing access takes effect
  // immediately even while a short-lived token has not yet expired.
  const currentPermissions = new Set(membership.permissions.map(String));
  const permissionRevoked = verified.claims.scopes.some(
    (scope) => !currentPermissions.has(DELEGATION_SCOPE_PERMISSION[scope])
  );
  if (permissionRevoked) return { status: "unauthenticated" };

  return {
    status: "authenticated",
    principal: {
      actorId: verified.claims.sub,
      organizationId: membership.organizationId,
      organizationName: membership.organizationName,
      roleKey: membership.roleKey,
      permissionIds: membership.permissions.map(String),
      authMethod: "delegation",
      delegationTokenId: verified.claims.jti,
      delegationClient: verified.claims.client,
      delegatedScopes: verified.claims.scopes,
    },
  };
}

/**
 * Authenticate an external/first-party RINADS agent request using the existing
 * Supabase identity and tenancy model.
 *
 * - Browser/session calls reuse normal RINADS auth cookies and the signed
 *   active-organization cookie.
 * - Ordinary bearer calls validate the Supabase access token with
 *   `auth.getUser(token)` and remain single-organization unless scoped.
 * - `rinads_dlg_v1` bearer tokens are verified cryptographically, matched to the
 *   revocation ledger, and re-checked against current membership/permissions.
 * - An external caller can never select `organization_id` through request
 *   payload/headers in this resolver.
 * - Delegation authentication does NOT itself establish an RLS-scoped business
 *   data client. Capability execution remains separately gated.
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
    if (isDelegationToken(token)) {
      return resolveDelegationPrincipal(token);
    }

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
