/**
 * Side-effect-free server access decisions for RI Delivery read-only previews.
 * These are an additional guard, NEVER a replacement for Supabase RLS.
 */
export type ReadGateStatus = 200 | 401 | 403 | 503;
export type ReadGateDecision =
  | { allowed: true; status: 200; code: "OK" }
  | { allowed: false; status: 401 | 403 | 503; code: string };

export type MerchantReadGateInput = {
  enabled: boolean;
  authenticated: boolean;
  isDemo: boolean;
  organizationActive: boolean;
  hasLogisticsReadPermission: boolean;
};

export function evaluateMerchantDeliveryRead(input: MerchantReadGateInput): ReadGateDecision {
  if (!input.enabled || input.isDemo) return { allowed: false, status: 503, code: "FEATURE_NOT_LIVE" };
  if (!input.authenticated) return { allowed: false, status: 401, code: "AUTH_REQUIRED" };
  if (!input.organizationActive) return { allowed: false, status: 403, code: "ORGANIZATION_INACTIVE" };
  if (!input.hasLogisticsReadPermission) return { allowed: false, status: 403, code: "PERMISSION_REQUIRED" };
  return { allowed: true, status: 200, code: "OK" };
}

export type DriverReadGateInput = {
  enabled: boolean;
  authenticated: boolean;
  anonymousUser: boolean;
};

export function evaluateDriverOfferRead(input: DriverReadGateInput): ReadGateDecision {
  if (!input.enabled) return { allowed: false, status: 503, code: "FEATURE_NOT_LIVE" };
  if (!input.authenticated || input.anonymousUser) return { allowed: false, status: 401, code: "AUTH_REQUIRED" };
  return { allowed: true, status: 200, code: "OK" };
}
