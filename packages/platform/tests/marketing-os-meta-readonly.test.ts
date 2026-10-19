import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ChannelGatewayError,
  MetaChannelAdapter,
  MetaGraphClient,
  type ChannelAccount,
  type ChannelConnection,
  type MetaAccessCredential,
} from "../src/marketing/index";

describe("Marketing OS Meta read-only adapter", () => {
  it("pins the Graph version and creates an OAuth URL with only requested scopes", () => {
    const graph = new MetaGraphClient({
      appId: "app-123",
      graphVersion: "v99.0",
      defaultScopes: ["pages_show_list", "instagram_basic"],
    });
    const result = graph.authorization({
      organizationId: "org-1",
      callbackUrl: "https://example.test/api/marketing/meta/callback",
      state: "signed-state",
    });
    const url = new URL(result.authorizationUrl);
    assert.equal(url.pathname, "/v99.0/dialog/oauth");
    assert.equal(url.searchParams.get("client_id"), "app-123");
    assert.equal(url.searchParams.get("scope"), "pages_show_list,instagram_basic");
  });

  it("discovers Facebook Page and linked Instagram accounts without persisting provider tokens", async () => {
    const calls: Array<{ url: URL; authorization?: string }> = [];
    const graph = new MetaGraphClient(
      { appId: "app-123", graphVersion: "v99.0" },
      async (input, init) => {
        const url = new URL(input.toString());
        calls.push({ url, authorization: new Headers(init?.headers).get("authorization") ?? undefined });
        return new Response(
          JSON.stringify({
            data: [
              {
                id: "page-1",
                name: "RINADS",
                category: "Software company",
                fan_count: 1200,
                followers_count: 1300,
                instagram_business_account: {
                  id: "ig-1",
                  username: "rinads",
                  name: "RINADS",
                  followers_count: 2200,
                  media_count: 85,
                },
              },
            ],
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      },
    );

    const accounts = await graph.discoverAccounts("super-secret-token");
    assert.equal(accounts.length, 2);
    assert.equal(accounts[0]?.accountType, "facebook_page");
    assert.equal(accounts[1]?.accountType, "instagram_business");
    assert.equal(calls[0]?.url.toString().includes("super-secret-token"), false);
    assert.equal(calls[0]?.authorization, "Bearer super-secret-token");
    assert.equal(JSON.stringify(accounts).includes("super-secret-token"), false);
  });

  it("enables read-side adapter capabilities but keeps publishing fail-closed", async () => {
    const connection: ChannelConnection = {
      id: "conn-1",
      organizationId: "org-1",
      provider: "meta",
      status: "active",
      credentialRef: "marketing-credential://credential-1",
      scopes: ["pages_show_list"],
    };
    const account: ChannelAccount = {
      id: "acct-1",
      organizationId: "org-1",
      connectionId: "conn-1",
      provider: "meta",
      accountType: "facebook_page",
      externalAccountId: "page-1",
      displayName: "RINADS",
      status: "active",
    };
    const credential: MetaAccessCredential = {
      accessToken: "token",
      scopes: ["pages_show_list"],
    };
    const graph = new MetaGraphClient(
      { appId: "app-123", graphVersion: "v99.0" },
      async () =>
        new Response(JSON.stringify({ id: "page-1", name: "RINADS", followers_count: 100 }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    );
    const adapter = new MetaChannelAdapter({
      graph,
      credentials: { resolve: async () => credential },
    });

    assert.equal(adapter.capabilities.has("connect"), true);
    assert.equal(adapter.capabilities.has("discover_accounts"), true);
    assert.equal(adapter.capabilities.has("read_account_metrics"), true);
    assert.equal(adapter.capabilities.has("publish"), false);

    const metrics = await adapter.getAccountMetrics({ organizationId: "org-1", connection, account });
    assert.equal(metrics.metrics[0]?.name, "followers_count");
    assert.equal(metrics.metrics[0]?.value, 100);

    await assert.rejects(
      () =>
        adapter.publish({
          organizationId: "org-1",
          account,
          publicationId: "pub-1",
          idempotencyKey: "pub-1",
          text: "blocked",
        }),
      (error: unknown) =>
        error instanceof ChannelGatewayError && error.code === "INTEGRATION_NOT_CONFIGURED",
    );
  });
});
