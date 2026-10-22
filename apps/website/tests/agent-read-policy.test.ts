import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isRinadsAgentReadEnabledForActor } from "../lib/agent-gateway/read-policy";

describe("RINADS Agent READ entitlement policy", () => {
  it("defaults to disabled when no override exists", () => {
    assert.equal(isRinadsAgentReadEnabledForActor([], "user_1"), false);
  });

  it("uses the organization override when no user override exists", () => {
    assert.equal(
      isRinadsAgentReadEnabledForActor([{ user_id: null, enabled: true }], "user_1"),
      true
    );
  });

  it("lets a user-specific disable override an organization enable", () => {
    assert.equal(
      isRinadsAgentReadEnabledForActor(
        [
          { user_id: null, enabled: true },
          { user_id: "user_1", enabled: false },
        ],
        "user_1"
      ),
      false
    );
  });

  it("lets a user-specific enable override an organization disable", () => {
    assert.equal(
      isRinadsAgentReadEnabledForActor(
        [
          { user_id: null, enabled: false },
          { user_id: "user_1", enabled: true },
        ],
        "user_1"
      ),
      true
    );
  });
});
