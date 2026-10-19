import type { RinpoApprovalPolicy, RinpoRiskLevel } from "./types";

export const DEFAULT_RINPO_APPROVAL_POLICIES: Record<RinpoRiskLevel, RinpoApprovalPolicy> = {
  0: {
    level: 0,
    title: "Read",
    summary: "Read-only access within the current authorized context.",
    authenticationRequired: "none",
  },
  1: {
    level: 1,
    title: "Suggest",
    summary: "Generate a recommendation without changing external state.",
    authenticationRequired: "none",
  },
  2: {
    level: 2,
    title: "Draft",
    summary: "Prepare a draft that is not sent or committed automatically.",
    authenticationRequired: "none",
  },
  3: {
    level: 3,
    title: "External action",
    summary: "Send or trigger an external action after explicit confirmation when policy requires it.",
    authenticationRequired: "confirm",
  },
  4: {
    level: 4,
    title: "Business commitment",
    summary: "Create or alter a business commitment such as an order, booking, or approval.",
    authenticationRequired: "confirm",
  },
  5: {
    level: 5,
    title: "Financial or destructive",
    summary: "Financial, deletion, refund, or other high-impact action.",
    authenticationRequired: "biometric",
  },
  6: {
    level: 6,
    title: "Privileged administration",
    summary: "Permissions, security, production configuration, or privileged administrative action.",
    authenticationRequired: "mfa",
  },
};

export function getDefaultApprovalPolicy(level: RinpoRiskLevel): RinpoApprovalPolicy {
  return DEFAULT_RINPO_APPROVAL_POLICIES[level];
}
