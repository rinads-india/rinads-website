const RINADS_MCP_OAUTH_SCOPES = ["email", "profile"] as const;

export type RinadsMcpOAuthScope = (typeof RINADS_MCP_OAUTH_SCOPES)[number];

export function rinadsMcpOAuthScopes(): readonly RinadsMcpOAuthScope[] {
  return RINADS_MCP_OAUTH_SCOPES;
}

export function rinadsMcpResourceMetadataUrl(requestUrl: string): string {
  return new URL("/.well-known/oauth-protected-resource", requestUrl).toString();
}

export function rinadsMcpAuthorizationServer(supabaseUrl: string): string {
  return `${supabaseUrl.replace(/\/$/, "")}/auth/v1`;
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
    resource: origin,
    authorization_servers: [rinadsMcpAuthorizationServer(input.supabaseUrl)],
    scopes_supported: [...RINADS_MCP_OAUTH_SCOPES],
    resource_documentation: `${origin}/developers`,
    resource_policy_uri: `${origin}/privacy`,
    resource_tos_uri: `${origin}/terms`,
  };
}
