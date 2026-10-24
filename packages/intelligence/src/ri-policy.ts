import type {
  RiActionIntent,
  RiAuthorization,
  RiAutonomyLevel,
  RiRiskLevel,
  RiToolCategory,
} from "./ri-types";

const RISK_ORDER: Record<RiRiskLevel, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

function hasSensitiveSideEffect(action: RiActionIntent): boolean {
  return Boolean(
    action.financialSideEffect ||
      action.pricingMutation ||
      action.refundOrPayout ||
      action.inventoryMutation
  );
}

function deny(reason: string): RiAuthorization {
  return { allowed: false, requiresApproval: false, stage: "AUTHORIZE", reason };
}

function allow(reason: string, requiresApproval = false): RiAuthorization {
  return {
    allowed: true,
    requiresApproval,
    stage: requiresApproval ? "AUTHORIZE" : "ACT",
    reason,
  };
}

function isCommittedMutation(category: RiToolCategory): boolean {
  return category === "WRITE" || category === "ACTION" || category === "SENSITIVE";
}

/**
 * Deterministic RI authorization boundary.
 *
 * LLM output may propose an action, but it cannot change the result of this
 * policy. Existing RLS, permission checks, RINPO registry gates and runtime
 * confirmations remain authoritative after this evaluation.
 */
export function evaluateRiAuthorization(input: {
  autonomyLevel: RiAutonomyLevel;
  category: RiToolCategory;
  risk: RiRiskLevel;
  action?: RiActionIntent;
}): RiAuthorization {
  const { autonomyLevel, category, risk } = input;
  const action = input.action ?? { category };

  if (action.hardBlocked) {
    return deny("Action is blocked by a hard platform safety limit.");
  }

  if (risk === "critical") {
    return deny("Critical-risk actions are not autonomous in RI v1.");
  }

  if (category === "READ") {
    return allow("Read-only intelligence is permitted.");
  }

  if (category === "DRAFT") {
    if (autonomyLevel < 2) {
      return deny("Autonomy level does not permit drafting state or external actions.");
    }
    return allow("Draft creation is permitted and does not commit the final side effect.");
  }

  if (!isCommittedMutation(category)) {
    return deny("Unknown RI tool category.");
  }

  if (autonomyLevel < 3) {
    return deny("Autonomy level does not permit execution actions.");
  }

  // RINPO SENSITIVE tools always remain approval-gated when routed through RI.
  // Existing direct product flows may enforce stricter or specialized rules.
  if (category === "SENSITIVE") {
    return allow("Sensitive RINPO tool requires explicit human approval in RI v1.", true);
  }

  if (hasSensitiveSideEffect(action)) {
    return allow("Sensitive business mutation requires explicit human approval.", true);
  }

  if (autonomyLevel === 3) {
    return allow("Approve-to-act mode requires explicit human approval.", true);
  }

  if (autonomyLevel === 4) {
    if (risk === "low") {
      return allow("Low-risk action is permitted by autonomous mode.");
    }
    return allow("Medium or high-risk action requires human approval in level 4.", true);
  }

  // Level 5: low/medium non-sensitive mutations may execute; high risk escalates.
  if (RISK_ORDER[risk] <= RISK_ORDER.medium) {
    return allow("Action is within level-5 autonomous risk tolerance.");
  }

  return allow("High-risk action is escalated for explicit human approval.", true);
}
