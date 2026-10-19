import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { join } from "node:path";
import { evaluateWhatsAppSendGate, parseWhatsAppOrgConfig } from "@rinads/salon-server";

const root = process.cwd();

describe("R GLOW WhatsApp Settings → Communications surface", () => {
  it("wires Settings and Communications to the shared readiness helper", () => {
    const settings = readFileSync(join(root, "app/(console)/settings/page.tsx"), "utf8");
    const communications = readFileSync(join(root, "app/(console)/communications/page.tsx"), "utf8");
    assert.match(settings, /getWhatsAppReadiness/);
    assert.match(settings, /WhatsAppReadinessCard/);
    assert.match(settings, /id="communications"|WhatsAppReadinessCard/);
    assert.match(communications, /Settings → Communications/);
    assert.match(communications, /getWhatsAppReadiness/);
  });

  it("keeps the default send gate closed", () => {
    const config = parseWhatsAppOrgConfig({});
    const gate = evaluateWhatsAppSendGate({ sendEnabled: false, config, recipient: "+919000000001" });
    assert.equal(config.mode, "off");
    assert.equal(gate.allowed, false);
  });
});
