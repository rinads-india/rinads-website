import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { createWixAppAccessToken } from "../lib/integrations/wix-oauth";

const originalEnv = {
  WIX_APP_ID: process.env.WIX_APP_ID,
  WIX_APP_SECRET: process.env.WIX_APP_SECRET,
};

afterEach(() => {
  for (const [key, value] of Object.entries(originalEnv)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe("Wix OAuth", () => {
  it("mints an app-instance access token with client_credentials", async () => {
    process.env.WIX_APP_ID = "app-1";
    process.env.WIX_APP_SECRET = "secret-1";

    let requestBody: unknown;
    const mockFetch = (async (input: string | URL | Request, init?: RequestInit) => {
      assert.equal(String(input), "https://www.wixapis.com/oauth2/token");
      assert.equal(init?.method, "POST");
      requestBody = JSON.parse(String(init?.body));
      return new Response(
        JSON.stringify({ access_token: "token-1", token_type: "Bearer", expires_in: 14_400 }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }) as typeof fetch;

    const token = await createWixAppAccessToken("instance-1", mockFetch);
    assert.deepEqual(requestBody, {
      grant_type: "client_credentials",
      client_id: "app-1",
      client_secret: "secret-1",
      instance_id: "instance-1",
    });
    assert.deepEqual(token, {
      accessToken: "token-1",
      tokenType: "Bearer",
      expiresIn: 14_400,
    });
  });

  it("fails closed when server credentials are missing", async () => {
    delete process.env.WIX_APP_ID;
    delete process.env.WIX_APP_SECRET;

    await assert.rejects(
      () => createWixAppAccessToken("instance-1", (() => Promise.reject(new Error("should not call fetch"))) as typeof fetch),
      /Wix OAuth is not configured/,
    );
  });
});
