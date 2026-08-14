import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { loadUserMemory } from "../hooks/useRinpoMemory";

describe("useRinpoMemory helpers", () => {
  it("loads default profile for guest", () => {
    const memory = loadUserMemory("Guest");
    assert.equal(memory.username, "Guest");
    assert.equal(memory.role, "visitor");
    assert.ok(Array.isArray(memory.interests));
    assert.ok(Array.isArray(memory.favoriteServices));
  });

  it("loads custom username properly", () => {
    const memory = loadUserMemory("Dr. Ananya");
    assert.equal(memory.username, "Dr. Ananya");
  });
});
