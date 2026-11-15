/**
 * Unit tests: RBAC guards
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  requireConnectionManagementTier,
  requireDisconnectTier,
  requireApprovalTier,
} from "../guard";

describe("requireConnectionManagementTier", () => {
  it("allows staff", () => {
    assert.equal(requireConnectionManagementTier("staff").ok, true);
  });
  it("allows admin", () => {
    assert.equal(requireConnectionManagementTier("admin").ok, true);
  });
  it("denies client", () => {
    assert.equal(requireConnectionManagementTier("client").ok, false);
  });
});

describe("requireDisconnectTier", () => {
  it("allows admin", () => {
    assert.equal(requireDisconnectTier("admin").ok, true);
  });
  it("denies staff", () => {
    assert.equal(requireDisconnectTier("staff").ok, false);
  });
  it("denies client", () => {
    assert.equal(requireDisconnectTier("client").ok, false);
  });
});

describe("requireApprovalTier", () => {
  it("allows staff", () => {
    assert.equal(requireApprovalTier("staff").ok, true);
  });
  it("allows admin", () => {
    assert.equal(requireApprovalTier("admin").ok, true);
  });
  it("denies client", () => {
    assert.equal(requireApprovalTier("client").ok, false);
  });
});
