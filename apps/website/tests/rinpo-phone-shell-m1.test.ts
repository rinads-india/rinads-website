import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

function read(relative: string) {
  return readFileSync(new URL(relative, import.meta.url), "utf8");
}

describe("RINPO Phone M1 shell contracts", () => {
  it("keeps a compact dock instead of exposing every business mode as primary navigation", () => {
    const modes = read("../lib/rinpo-phone-modes.ts");

    assert.match(modes, /getPhoneDockModesForAudience/);
    assert.match(modes, /id: "today"[\s\S]*placement: "dock"/);
    assert.match(modes, /id: "ask"[\s\S]*placement: "dock"/);
    assert.match(modes, /id: "world"[\s\S]*placement: "dock"/);
    assert.match(modes, /id: "apps"[\s\S]*placement: "dock"/);
    assert.match(modes, /id: "approvals"[\s\S]*placement: "library"/);
    assert.match(modes, /id: "settings"[\s\S]*placement: "library"/);
  });

  it("keeps WORLD behind an explicit trust boundary", () => {
    const screens = read("../components/rinpo/RinpoPhoneScreens/PhoneWorldSettingsScreens.tsx");

    assert.match(screens, /does not directly read private tenant business data/i);
    assert.match(screens, /governed connectors only/i);
    assert.match(screens, /rather than game-side writes/i);
    assert.match(screens, /no live cross-device sync claim/i);
  });

  it("labels current memory controls honestly as browser-scoped", () => {
    const screens = read("../components/rinpo/RinpoPhoneScreens/PhoneWorldSettingsScreens.tsx");

    assert.match(screens, /Current browser/);
    assert.match(screens, /Persistent cross-device memory and device revocation remain behind the M1 backend\/security work/);
    assert.match(screens, /Local handset preference only/);
  });

  it("routes settings from the handset header without putting it in the primary dock", () => {
    const phone = read("../components/rinpo/RinpoPhone.tsx");

    assert.match(phone, /openPhoneScreen\("settings"\)/);
    assert.match(phone, /getPhoneDockModesForAudience/);
    assert.match(phone, /PhoneWorldScreen/);
    assert.match(phone, /PhoneSettingsScreen/);
  });
});
