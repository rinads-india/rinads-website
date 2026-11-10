/**
 * Unit tests: RBAC guards
 */
import {
  requireConnectionManagementTier,
  requireDisconnectTier,
  requireApprovalTier,
} from "../guard";

describe("requireConnectionManagementTier", () => {
  it("allows staff", () => {
    expect(requireConnectionManagementTier("staff").ok).toBe(true);
  });
  it("allows admin", () => {
    expect(requireConnectionManagementTier("admin").ok).toBe(true);
  });
  it("denies client", () => {
    expect(requireConnectionManagementTier("client").ok).toBe(false);
  });
});

describe("requireDisconnectTier", () => {
  it("allows admin", () => {
    expect(requireDisconnectTier("admin").ok).toBe(true);
  });
  it("denies staff", () => {
    expect(requireDisconnectTier("staff").ok).toBe(false);
  });
  it("denies client", () => {
    expect(requireDisconnectTier("client").ok).toBe(false);
  });
});

describe("requireApprovalTier", () => {
  it("allows staff", () => {
    expect(requireApprovalTier("staff").ok).toBe(true);
  });
  it("allows admin", () => {
    expect(requireApprovalTier("admin").ok).toBe(true);
  });
  it("denies client", () => {
    expect(requireApprovalTier("client").ok).toBe(false);
  });
});
