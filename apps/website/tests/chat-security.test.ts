import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CHAT_MAX_MESSAGE_LENGTH,
  createRateLimiter,
  validateChatBody,
} from "../lib/chat-security";
import { isDemoAllowedRole } from "../lib/demo-auth";

describe("validateChatBody", () => {
  it("rejects non-objects", () => {
    const result = validateChatBody(null);
    assert.equal("error" in result && result.status, 400);
  });

  it("rejects empty message", () => {
    const result = validateChatBody({ message: "   " });
    assert.equal("error" in result && result.error, "Message is required");
  });

  it("rejects oversized message", () => {
    const result = validateChatBody({
      message: "x".repeat(CHAT_MAX_MESSAGE_LENGTH + 1),
    });
    assert.equal("error" in result, true);
  });

  it("accepts valid message", () => {
    const result = validateChatBody({ message: "Hello RINPO", lang: "en" });
    assert.equal("message" in result && result.message, "Hello RINPO");
  });
});

describe("rate limiter", () => {
  it("blocks after max hits", () => {
    const limiter = createRateLimiter(60_000, 2);
    assert.equal(limiter.check("a").allowed, true);
    assert.equal(limiter.check("a").allowed, true);
    assert.equal(limiter.check("a").allowed, false);
  });
});

describe("demo auth roles", () => {
  it("allows client/staff/admin only", () => {
    assert.equal(isDemoAllowedRole("client"), true);
    assert.equal(isDemoAllowedRole("founder"), false);
    assert.equal(isDemoAllowedRole("super-admin"), false);
  });
});
