import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getLogisticsCredentialBindingMetadata,
  resolveLogisticsCredentialBinding,
} from "../src/logistics-secrets";

describe("logistics credential bindings", () => {
  it("resolves Delhivery through a server-owned opaque binding", () => {
    const result = resolveLogisticsCredentialBinding(
      {
        providerKey: "delhivery",
        credentialSource: "environment",
        credentialKey: "delhivery_primary",
      },
      { RINADS_DELHIVERY_API_TOKEN: "delhivery-secret" }
    );

    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.bundle.providerKey, "delhivery");
      assert.equal(result.bundle.bindingId, "delhivery_primary");
      assert.deepEqual(result.bundle.values, { apiToken: "delhivery-secret" });
    }
  });

  it("resolves Shiprocket API-user credentials through its opaque server binding", () => {
    const result = resolveLogisticsCredentialBinding(
      {
        providerKey: "shiprocket",
        credentialSource: "environment",
        credentialKey: "shiprocket_primary",
      },
      {
        RINADS_SHIPROCKET_API_EMAIL: "api-user@example.com",
        RINADS_SHIPROCKET_API_PASSWORD: "shiprocket-password",
      }
    );

    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.bundle.providerKey, "shiprocket");
      assert.deepEqual(result.bundle.values, {
        apiEmail: "api-user@example.com",
        apiPassword: "shiprocket-password",
      });
    }
  });

  it("never treats a tenant-supplied environment variable name as a binding", () => {
    const result = resolveLogisticsCredentialBinding(
      {
        providerKey: "delhivery",
        credentialSource: "environment",
        credentialKey: "SUPABASE_SERVICE_ROLE_KEY",
      },
      {
        SUPABASE_SERVICE_ROLE_KEY: "must-never-be-readable-via-logistics",
        RINADS_DELHIVERY_API_TOKEN: "real-logistics-token",
      }
    );

    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.status, "unknown_binding");
  });

  it("fails closed when the server secret for a verified binding is absent", () => {
    const result = resolveLogisticsCredentialBinding(
      {
        providerKey: "delhivery",
        credentialSource: "environment",
        credentialKey: "delhivery_primary",
      },
      {}
    );

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.status, "missing_secret");
      assert.deepEqual(result.missingKeys, ["RINADS_DELHIVERY_API_TOKEN"]);
    }
  });

  it("requires both Shiprocket API-user secrets", () => {
    const result = resolveLogisticsCredentialBinding(
      {
        providerKey: "shiprocket",
        credentialSource: "environment",
        credentialKey: "shiprocket_primary",
      },
      { RINADS_SHIPROCKET_API_EMAIL: "api-user@example.com" }
    );

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.status, "missing_secret");
      assert.deepEqual(result.missingKeys, ["RINADS_SHIPROCKET_API_PASSWORD"]);
    }
  });

  it("does not resolve DTDC until its exact auth contract is verified", () => {
    const result = resolveLogisticsCredentialBinding(
      {
        providerKey: "dtdc",
        credentialSource: "environment",
        credentialKey: "dtdc_primary",
      },
      { RINADS_DTDC_API_TOKEN: "provisional-value" }
    );

    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.status, "credential_contract_pending");
  });

  it("keeps non-environment sources explicit instead of guessing resolver behavior", () => {
    const result = resolveLogisticsCredentialBinding({
      providerKey: "delhivery",
      credentialSource: "vault",
      credentialKey: "delhivery_primary",
    });

    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.status, "unsupported_source");
  });

  it("publishes only secret names in metadata, never secret values", () => {
    const metadata = getLogisticsCredentialBindingMetadata();
    const delhivery = metadata.find((binding) => binding.providerKey === "delhivery");
    const shiprocket = metadata.find((binding) => binding.providerKey === "shiprocket");

    assert.ok(delhivery);
    assert.equal(delhivery.bindingId, "delhivery_primary");
    assert.equal(delhivery.contractVerified, true);
    assert.deepEqual(delhivery.requiredSecretNames, ["RINADS_DELHIVERY_API_TOKEN"]);

    assert.ok(shiprocket);
    assert.equal(shiprocket.bindingId, "shiprocket_primary");
    assert.equal(shiprocket.contractVerified, true);
    assert.deepEqual(shiprocket.requiredSecretNames, [
      "RINADS_SHIPROCKET_API_EMAIL",
      "RINADS_SHIPROCKET_API_PASSWORD",
    ]);
  });
});
