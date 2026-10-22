import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { getLogisticsProviderReadiness } from "../lib/logistics-os";

const KEYS = [
  "RINADS_DTDC_API_TOKEN",
  "RINADS_DTDC_LIVE",
  "RINADS_DELHIVERY_API_TOKEN",
  "RINADS_DELHIVERY_LIVE",
] as const;

const original = new Map(KEYS.map((key) => [key, process.env[key]]));

afterEach(() => {
  for (const key of KEYS) {
    const value = original.get(key);
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe("Logistics OS provider readiness", () => {
  it("keeps DTDC fail-closed while its exact credential contract is pending", () => {
    process.env.RINADS_DTDC_API_TOKEN = "provisional-token";
    process.env.RINADS_DTDC_LIVE = "1";

    const dtdc = getLogisticsProviderReadiness().find((provider) => provider.key === "dtdc");
    assert.ok(dtdc);
    assert.equal(dtdc.credentialContractVerified, false);
    assert.equal(dtdc.credentialsDetected, false);
    assert.equal(dtdc.liveVerified, false);
    assert.equal(dtdc.state, "credential_contract_pending");
  });

  it("recognizes Delhivery token presence but does not mark it live before adapter verification", () => {
    process.env.RINADS_DELHIVERY_API_TOKEN = "test-token";
    process.env.RINADS_DELHIVERY_LIVE = "1";

    const delhivery = getLogisticsProviderReadiness().find(
      (provider) => provider.key === "delhivery"
    );
    assert.ok(delhivery);
    assert.equal(delhivery.credentialContractVerified, true);
    assert.equal(delhivery.credentialsDetected, true);
    assert.equal(delhivery.adapterImplemented, false);
    assert.equal(delhivery.liveVerified, false);
    assert.equal(delhivery.state, "credentials_detected");
  });
});
