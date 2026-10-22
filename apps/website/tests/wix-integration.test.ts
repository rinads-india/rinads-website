import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { getWixConfigurationStatus, WIX_INTEGRATION } from "../lib/integrations/wix";

const originalEnv = {
  WIX_APP_ID: process.env.WIX_APP_ID,
  WIX_APP_SECRET: process.env.WIX_APP_SECRET,
  WIX_WEBHOOK_PUBLIC_KEY: process.env.WIX_WEBHOOK_PUBLIC_KEY,
};

afterEach(() => {
  for (const [key, value] of Object.entries(originalEnv)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe("Wix integration", () => {
  it("stays private preview until the provider connection is actually configured", () => {
    assert.equal(WIX_INTEGRATION.status, "private_preview");
    assert.equal(WIX_INTEGRATION.productStatus, "preview");
  });

  it("does not expose an install URL when server credentials are incomplete", () => {
    delete process.env.WIX_APP_ID;
    delete process.env.WIX_APP_SECRET;
    delete process.env.WIX_WEBHOOK_PUBLIC_KEY;

    assert.deepEqual(getWixConfigurationStatus(), {
      configured: false,
      installUrl: null,
    });
  });

  it("enables the Wix installer only when all server-side credentials exist", () => {
    process.env.WIX_APP_ID = "11111111-2222-3333-4444-555555555555";
    process.env.WIX_APP_SECRET = "server-secret";
    process.env.WIX_WEBHOOK_PUBLIC_KEY = "public-key";

    const status = getWixConfigurationStatus();
    assert.equal(status.configured, true);
    assert.equal(
      status.installUrl,
      "https://www.wix.com/app-installer?appId=11111111-2222-3333-4444-555555555555",
    );
  });
});
