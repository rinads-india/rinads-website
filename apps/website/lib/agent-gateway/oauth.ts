const RINADS_MCP_OAUTH_SCOPES = ["email", "profile"] as const;

export type RinadsMcpOAuthScope = (typeof RINADS_MCP_OAUTH_SCOPES)[number];

export type RinadsMcpOAuthClaimValidation =
  | { ok: true; clientId: string; subject: string }
  | {
      ok: false;
      reason:
        | "invalid_issuer"
        | "invalid_audience"
        | "missing_client_id"
        | "missing_subject"
        | "expired";
    };

export function rinadsMcpOAuthScopes(): readonly RinadsMcpOAuthScope[] {
  return RINADS_MCP_OAUTH_SCOPES;
}

export function rinadsMcpResourceMetadataUrl(requestUrl: string): string {
  return new URL("/.well-known/oauth-protected-resource", requestUrl).toString();
}

export function rinadsMcpResourceUrl(requestUrl: string): string {
  return new URL("/api/mcp", requestUrl).toString();
}

export function rinadsMcpAuthorizationServer(supabaseUrl: string): string {
  return `${supabaseUrl.replace(/\/$/, "")}/auth/v1`;
}

function nonEmptyString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function audienceIncludes(value: unknown, expected: string): boolean {
  if (typeof value === "string") return value === expected;
  return Array.isArray(value) && value.some((item) => item === expected);
}

/**
 * Enforce the resource-server boundary for OAuth bearer tokens presented to
 * the RINADS MCP endpoint. Supabase validates signature/key material through
 * auth.getClaims(); this helper adds the MCP-specific issuer, audience,
 * expiration and OAuth-client requirements.
 *
 * OAuth identity scopes (email/profile) are intentionally not business-data
 * authorization. Supabase does not encode granted OAuth scopes in the access
 * token JWT; RLS, organization membership and RINPO capability policy remain
 * the authorization boundary after this eligibility check.
 */
export function validateRinadsMcpOAuthClaims(input: {
  claims: Record<string, unknown>;
  expectedIssuer: string;
  expectedResource: string;
  nowSeconds?: number;
}): RinadsMcpOAuthClaimValidation {
  if (nonEmptyString(input.claims.iss) !== input.expectedIssuer) {
    return { ok: false, reason: "invalid_issuer" };
  }

  if (!audienceIncludes(input.claims.aud, input.expectedResource)) {
    return { ok: false, reason: "invalid_audience" };
  }

  const clientId = nonEmptyString(input.claims.client_id);
  if (!clientId) return { ok: false, reason: "missing_client_id" };

  const subject = nonEmptyString(input.claims.sub);
  if (!subject) return { ok: false, reason: "missing_subject" };

  const exp = input.claims.exp;
  const nowSeconds = input.nowSeconds ?? Math.floor(Date.now() / 1000);
  if (typeof exp !== "number" || !Number.isFinite(exp) || exp <= nowSeconds) {
    return { ok: false, reason: "expired" };
  }

  return { ok: true, clientId, subject };
}

export function rinadsMcpSecuritySchemes(): Array<{
  type: "oauth2";
  scopes: RinadsMcpOAuthScope[];
}> {
  return [
    {
      type: "oauth2",
      scopes: [...RINADS_MCP_OAUTH_SCOPES],
    },
  ];
}

export function rinadsMcpAuthChallenge(requestUrl: string): string {
  const resourceMetadata = rinadsMcpResourceMetadataUrl(requestUrl);
  const scopes = RINADS_MCP_OAUTH_SCOPES.join(" ");

  return (
    `Bearer resource_metadata="${resourceMetadata}", ` +
    `scope="${scopes}", ` +
    'error="invalid_token", ' +
    'error_description="Authenticate with RINADS Intelligence to continue"'
  );
}

export function rinadsMcpProtectedResourceMetadata(input: {
  requestUrl: string;
  supabaseUrl: string;
}): Record<string, unknown> {
  const origin = new URL(input.requestUrl).origin;

  return {
    resource: rinadsMcpResourceUrl(input.requestUrl),
    authorization_servers: [rinadsMcpAuthorizationServer(input.supabaseUrl)],
    bearer_methods_supported: ["header"],
    scopes_supported: [...RINADS_MCP_OAUTH_SCOPES],
    resource_documentation: `${origin}/developers`,
    resource_policy_uri: `${origin}/privacy`,
    resource_tos_uri: `${origin}/terms`,
  };
}
