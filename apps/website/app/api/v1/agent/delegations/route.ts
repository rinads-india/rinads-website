import {
  loadMemberships,
  type TenancySupabaseClient,
} from "@rinads/tenancy";
import { isSupabaseMode } from "@/lib/supabase/env";
import { createWebsiteServerClient } from "@/lib/supabase/server";
import {
  issueRinadsAgentDelegation,
  isRinadsExternalAgentClient,
  isRinadsExternalAgentReadScope,
  type RinadsExternalAgentReadScope,
} from "@/lib/agent-gateway/delegation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" } as const;

const REQUIRED_PERMISSION: Record<RinadsExternalAgentReadScope, string> = {
  "intelligence.business_summary.read": "org.read",
  "commerce.catalog.read": "commerce.catalog.read",
  "commerce.order.read": "commerce.order.read",
};

type JsonObject = Record<string, unknown>;

function asRecord(value: unknown): JsonObject | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonObject)
    : null;
}

function invalid(message: string, status = 400): Response {
  return Response.json({ ok: false, error: message }, { status, headers: NO_STORE_HEADERS });
}

/**
 * Mint a short-lived, organization-bound READ delegation for an authenticated
 * RI ID. The selected organization is validated against authoritative active
 * membership state before the token is issued. The raw token is returned once
 * and is never persisted.
 */
export async function POST(request: Request): Promise<Response> {
  if (!isSupabaseMode()) {
    return invalid("RINADS delegation requires Supabase authentication.", 503);
  }

  const secret = process.env.RINADS_AGENT_DELEGATION_SECRET?.trim();
  if (!secret || secret.length < 32) {
    return invalid("RINADS delegation signing is not configured.", 503);
  }

  let body: JsonObject | null;
  try {
    body = asRecord(await request.json());
  } catch {
    return invalid("Request body must be valid JSON.");
  }
  if (!body) return invalid("Request body must be an object.");

  const organizationId =
    typeof body.organization_id === "string" ? body.organization_id.trim() : "";
  if (!organizationId) return invalid("organization_id is required.");

  if (!isRinadsExternalAgentClient(body.client) || body.client === "internal") {
    return invalid("Unsupported external agent client.");
  }

  if (!Array.isArray(body.scopes) || body.scopes.length === 0) {
    return invalid("At least one READ scope is required.");
  }
  if (!body.scopes.every(isRinadsExternalAgentReadScope)) {
    return invalid("One or more requested scopes are not delegable.");
  }
  const scopes = Array.from(new Set(body.scopes)) as RinadsExternalAgentReadScope[];

  const supabase = await createWebsiteServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return invalid("Authentication required.", 401);

  const memberships = await loadMemberships(
    supabase as unknown as TenancySupabaseClient,
    userData.user.id
  );
  const membership = memberships.find(
    (candidate) =>
      candidate.organizationId === organizationId &&
      candidate.organizationStatus === "active"
  );
  if (!membership) return invalid("Active organization membership required.", 403);

  const permissions = new Set(membership.permissions.map(String));
  const unauthorizedScope = scopes.find(
    (scope) => !permissions.has(REQUIRED_PERMISSION[scope])
  );
  if (unauthorizedScope) {
    return invalid(`Missing permission required for scope: ${unauthorizedScope}`, 403);
  }

  const issued = issueRinadsAgentDelegation({
    actorId: userData.user.id,
    organizationId,
    client: body.client,
    scopes,
    secret,
  });

  const issuedAt = new Date(issued.claims.iat * 1000).toISOString();
  const expiresAt = new Date(issued.claims.exp * 1000).toISOString();
  const userAgent = request.headers.get("user-agent")?.slice(0, 500) ?? null;

  const { error: ledgerError } = await supabase
    .from("external_agent_delegations")
    .insert({
      token_id: issued.claims.jti,
      user_id: userData.user.id,
      organization_id: organizationId,
      client: issued.claims.client,
      scopes: issued.claims.scopes,
      issued_at: issuedAt,
      expires_at: expiresAt,
      metadata: {
        source: "agent-delegation-api",
        user_agent: userAgent,
      },
    });

  if (ledgerError) {
    return invalid("Unable to persist delegation evidence.", 503);
  }

  const { error: auditError } = await supabase.from("audit_logs").insert({
    organization_id: organizationId,
    actor_type: "user",
    actor_id: userData.user.id,
    action: "agent.delegation.issue",
    entity: "external_agent_delegations",
    entity_id: issued.claims.jti,
    after: {
      client: issued.claims.client,
      scopes: issued.claims.scopes,
      expires_at: expiresAt,
    },
    source: "agent-delegation-api",
    user_agent: userAgent,
  });

  if (auditError) {
    await supabase.rpc("revoke_external_agent_delegation", {
      p_token_id: issued.claims.jti,
    });
    return invalid("Delegation audit could not be recorded.", 503);
  }

  return Response.json(
    {
      ok: true,
      token: issued.token,
      token_id: issued.claims.jti,
      organization_id: organizationId,
      client: issued.claims.client,
      scopes: issued.claims.scopes,
      expires_at: expiresAt,
    },
    { status: 201, headers: NO_STORE_HEADERS }
  );
}
