import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const source = readFileSync(new URL("../components/rinpo/RinpoPhone.tsx", import.meta.url), "utf8");

describe("RINPO Phone accessibility contracts", () => {
  it("exposes an accessible modal dialog and restores keyboard focus", () => {
    assert.match(source, /role="dialog"/);
    assert.match(source, /aria-modal="true"/);
    assert.match(source, /aria-label="RINPO Phone"/);
    assert.match(source, /tabIndex=\{-1\}/);
    assert.match(source, /document\.addEventListener\("keydown", onKey\)/);
    assert.match(source, /event\.key === "Escape"/);
    assert.match(source, /last\.focus\(\)/);
    assert.match(source, /stablePrevious\s*\?\?\s*launcher/);
    assert.match(source, /\[data-rinpo-corner-launcher\] button/);
  });
  it("preserves mobile size and reduced-motion preferences", () => {
    assert.match(source, /h-\[100dvh\]/);
    assert.match(source, /min-h-11 min-w-/);
    assert.match(source, /useReducedMotion\(\)/);
    assert.match(source, /aria-current=\{isActive/);
  });
  it("labels non-live preview modes accurately", () => {
    assert.match(source, /activeMode\?\.demoPlaceholder/);
    assert.match(source, /role="status"/);
    assert.match(source, /not connected to live business data/);
  });
});
