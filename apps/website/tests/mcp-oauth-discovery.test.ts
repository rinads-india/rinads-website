import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  rinadsMcpAuthChallenge,
  rinadsMcpAuthorizationServer,
  rinadsMcpProtectedResourceMetadata,
  rinadsMcpResourceMetadataUrl,
  rinadsMcpResourceUrl,
  rinadsMcpSecuritySchemes,
  validateRinadsMcpOAuthClaims,
} from "../lib/agent-gateway/oauth";

const mcpRoute = readFileSync(
  new URL("../app/api/mcp/route.ts", import.meta.url),
  "utf8"
);
const mcpPrincipal = readFileSync(
  new URL("../lib/agent-gateway/mcp-principal.ts", import.meta.url),
  "utf8"
);
const resourceMetadataRoute = readFileSync(
  new URL("../app/.well-known/oauth-protected-resource/route.ts", import.meta.url),
  "utf8"
);

describe("RINADS MCP OAuth discovery", () => {
  it("derives Supabase Auth as the OAuth authorization server", () => {
    assert.equal(
      rinadsMcpAuthorizationServer("https://project.supabase.co/"),
      "https://project.supabase.co/auth/v1"
    );
  });

  it("publishes standards-shaped protected resource metadata", () => {
    assert.deepEqual(
      rinadsMcpProtectedResourceMetadata({
        requestUrl: "https://www.rinads.com/.well-known/oauth-protected-resource",
        supabaseUrl: "https://project.supabase.co",
      }),
      {
        resource: "https://www.rinads.com/api/mcp",
        authorization_servers: ["https://project.supabase.co/auth/v1"],
        bearer_methods_supported: ["header"],
        scopes_supported: ["email", "profile"],
        resource_documentation: "https://www.rinads.com/developers",
        resource_policy_uri: "https://www.rinads.com/privacy",
        resource_tos_uri: "https://www.rinads.com/terms",
      }
    );
  });

  it("advertises OAuth on every discovered MCP tool", () => {
    assert.deepEqual(rinadsMcpSecuritySchemes(), [
      { type: "oauth2", scopes: ["email", "profile"] },
    ]);
    assert.match(mcpRoute, /securitySchemes: rinadsMcpSecuritySchemes\(\)/);
  });

  it("returns a ChatGPT-compatible authentication challenge for unauthenticated tool calls", () => {
    const challenge = rinadsMcpAuthChallenge("https://www.rinads.com/api/mcp");
    assert.match(
      challenge,
      /resource_metadata="https:\/\/www\.rinads\.com\/\.well-known\/oauth-protected-resource"/
    );
    assert.match(challenge, /scope="email profile"/);
    assert.match(challenge, /error="invalid_token"/);
    assert.match(challenge, /error_description="Authenticate with RINADS Intelligence to continue"/);
    assert.match(mcpRoute, /"mcp\/www_authenticate"/);
  });

  it("keeps OAuth discovery server-resolved and bound to the canonical MCP resource", () => {
    assert.equal(
      rinadsMcpResourceMetadataUrl("https://www.rinads.com/api/mcp"),
      "https://www.rinads.com/.well-known/oauth-protected-resource"
    );
    assert.equal(
      rinadsMcpResourceUrl("https://www.rinads.com/.well-known/oauth-protected-resource"),
      "https://www.rinads.com/api/mcp"
    );
    assert.doesNotMatch(resourceMetadataRoute, /organization_id/);
    assert.match(resourceMetadataRoute, /getSupabasePublicConfig/);
  });

  it("accepts only an unexpired OAuth token bound to the expected issuer and MCP audience", () => {
    const result = validateRinadsMcpOAuthClaims({
      claims: {
        iss: "https://project.supabase.co/auth/v1",
        aud: "https://www.rinads.com/api/mcp",
        exp: 2_000_000_000,
        sub: "user-123",
        client_id: "oauth-client-123",
      },
      expectedIssuer: "https://project.supabase.co/auth/v1",
      expectedResource: "https://www.rinads.com/api/mcp",
      nowSeconds: 1_900_000_000,
    });

    assert.deepEqual(result, {
      ok: true,
      clientId: "oauth-client-123",
      subject: "user-123",
    });
  });

  it("rejects Supabase default audience and missing OAuth client identity", () => {
    assert.deepEqual(
      validateRinadsMcpOAuthClaims({
        claims: {
          iss: "https://project.supabase.co/auth/v1",
          aud: "authenticated",
          exp: 2_000_000_000,
          sub: "user-123",
          client_id: "oauth-client-123",
        },
        expectedIssuer: "https://project.supabase.co/auth/v1",
        expectedResource: "https://www.rinads.com/api/mcp",
        nowSeconds: 1_900_000_000,
      }),
      { ok: false, reason: "invalid_audience" }
    );

    assert.deepEqual(
      validateRinadsMcpOAuthClaims({
        claims: {
          iss: "https://project.supabase.co/auth/v1",
          aud: "https://www.rinads.com/api/mcp",
          exp: 2_000_000_000,
          sub: "user-123",
        },
        expectedIssuer: "https://project.supabase.co/auth/v1",
        expectedResource: "https://www.rinads.com/api/mcp",
        nowSeconds: 1_900_000_000,
      }),
      { ok: false, reason: "missing_client_id" }
    );
  });

  it("rejects expired or wrong-issuer MCP OAuth tokens", () => {
    assert.deepEqual(
      validateRinadsMcpOAuthClaims({
        claims: {
          iss: "https://other.supabase.co/auth/v1",
          aud: "https://www.rinads.com/api/mcp",
          exp: 2_000_000_000,
          sub: "user-123",
          client_id: "oauth-client-123",
        },
        expectedIssuer: "https://project.supabase.co/auth/v1",
        expectedResource: "https://www.rinads.com/api/mcp",
        nowSeconds: 1_900_000_000,
      }),
      { ok: false, reason: "invalid_issuer" }
    );

    assert.deepEqual(
      validateRinadsMcpOAuthClaims({
        claims: {
          iss: "https://project.supabase.co/auth/v1",
          aud: "https://www.rinads.com/api/mcp",
          exp: 1_900_000_000,
          sub: "user-123",
          client_id: "oauth-client-123",
        },
        expectedIssuer: "https://project.supabase.co/auth/v1",
        expectedResource: "https://www.rinads.com/api/mcp",
        nowSeconds: 1_900_000_000,
      }),
      { ok: false, reason: "expired" }
    );
  });

  it("enforces the resource gate only on MCP bearer tokens before existing RLS resolution", () => {
    assert.match(mcpRoute, /agent-gateway\/mcp-principal/);
    assert.match(mcpPrincipal, /auth\.getClaims\(token\)/);
    assert.match(mcpPrincipal, /validateRinadsMcpOAuthClaims/);
    assert.match(mcpPrincipal, /resolveBaseAgentPrincipal\(request\)/);
    assert.match(mcpPrincipal, /RINADS_AGENT_DELEGATION_TOKEN_PREFIX/);
  });
});
