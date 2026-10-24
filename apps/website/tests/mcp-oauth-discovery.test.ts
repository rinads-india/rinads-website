import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  rinadsMcpAuthChallenge,
  rinadsMcpAuthorizationServer,
  rinadsMcpProtectedResourceMetadata,
  rinadsMcpResourceMetadataUrl,
  rinadsMcpSecuritySchemes,
} from "../lib/agent-gateway/oauth";

const mcpRoute = readFileSync(
  new URL("../app/api/mcp/route.ts", import.meta.url),
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
        resource: "https://www.rinads.com",
        authorization_servers: ["https://project.supabase.co/auth/v1"],
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

  it("keeps OAuth discovery server-resolved and free of caller supplied tenant identifiers", () => {
    assert.equal(
      rinadsMcpResourceMetadataUrl("https://www.rinads.com/api/mcp"),
      "https://www.rinads.com/.well-known/oauth-protected-resource"
    );
    assert.doesNotMatch(resourceMetadataRoute, /organization_id/);
    assert.match(resourceMetadataRoute, /getSupabasePublicConfig/);
  });
});
