/**
 * RI DELIVERY — deterministic, side-effect-free driver dispatch policy.
 * The server must supply trusted tenant/actor scope and persist transitions
 * atomically with a unique event key before performing side effects.
 */
export type DriverRelationship = "client_staff" | "rinads_staff" | "freelancer";
export type DriverVehicle = "scooter" | "car" | "van";
export type DriverVerification = "pending" | "verified" | "suspended" | "expired";
export type DeliveryStatus = "ready" | "offered" | "accepted" | "picked_up" | "delivered" | "exception" | "cancelled";
export type DeliveryActorRole = "dispatcher" | "driver" | "finance";

export type DriverProfile = {
  id: string;
  employerOrganizationId: string | null;
  relationship: DriverRelationship;
  verification: DriverVerification;
  licenceVerified: boolean;
  insuranceVerified: boolean;
  vehicle: DriverVehicle;
  available: boolean;
  onShift: boolean;
  networkOptIn: boolean;
  zoneRadiusKm: number;
  currentDistanceToPickupKm: number;
  proposedPayoutMinor: number;
};

export type DispatchJob = {
  id: string;
  organizationId: string;
  status: DeliveryStatus;
  requiredVehicle: DriverVehicle;
  tripDistanceKm: number;
  approvedMaxPayoutMinor: number;
  approvedByMerchant: boolean;
  offeredDriverId: string | null;
  assignedDriverId: string | null;
  payoutMinor: number | null;
  proofReference: string | null;
  exceptionReason: string | null;
  settled: boolean;
  version: number;
  processedEventIds: readonly string[];
};

export type DispatchScope = {
  organizationId: string;
  actorId: string;
  actorRole: DeliveryActorRole;
  allowVerifiedMarketplaceDrivers: boolean;
};

export type Candidate = {
  driverId: string;
  relationship: DriverRelationship;
  quotedPayoutMinor: number;
  distanceToPickupKm: number;
};

export type CandidateSelection = {
  candidates: Candidate[];
  rejected: { driverId: string; reason: string }[];
  requiresHumanApproval: boolean;
};

export class DispatchPolicyError extends Error {
  readonly code: string;
  constructor(code: string) {
    super(code);
    this.code = code;
    this.name = "DispatchPolicyError";
  }
}

function assertScope(scope: DispatchScope, job: DispatchJob): void {
  if (!scope.organizationId || !scope.actorId || job.organizationId !== scope.organizationId) {
    throw new DispatchPolicyError("TENANT_SCOPE_MISMATCH");
  }
}

function finiteNonnegative(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

/** Returns recommendations; never sends messages or offers. */
export function rankEligibleDrivers(
  scope: DispatchScope,
  job: DispatchJob,
  drivers: readonly DriverProfile[],
): CandidateSelection {
  assertScope(scope, job);
  if (scope.actorRole !== "dispatcher") throw new DispatchPolicyError("DISPATCHER_REQUIRED");
  if (!job.approvedByMerchant || job.status !== "ready") {
    throw new DispatchPolicyError("MERCHANT_ACCEPTANCE_REQUIRED");
  }
  if (!Number.isInteger(job.approvedMaxPayoutMinor) || job.approvedMaxPayoutMinor < 0 ||
      !finiteNonnegative(job.tripDistanceKm)) {
    throw new DispatchPolicyError("INVALID_JOB_COST_OR_DISTANCE");
  }

  const candidates: Candidate[] = [];
  const rejected: CandidateSelection["rejected"] = [];
  for (const driver of drivers) {
    let reason: string | null = null;
    const ownEmployee = driver.relationship === "client_staff" &&
      driver.employerOrganizationId === job.organizationId;
    const network = (driver.relationship === "freelancer" || driver.relationship === "rinads_staff") &&
      scope.allowVerifiedMarketplaceDrivers && driver.networkOptIn;

    if (!ownEmployee && !network) reason = "NOT_AUTHORISED_FOR_MERCHANT";
    else if (driver.verification !== "verified" || !driver.licenceVerified || !driver.insuranceVerified) {
      reason = "DOCUMENTS_NOT_VERIFIED";
    } else if (!driver.available || !driver.onShift) reason = "DRIVER_UNAVAILABLE";
    else if (driver.vehicle !== job.requiredVehicle) reason = "VEHICLE_MISMATCH";
    else if (!finiteNonnegative(driver.zoneRadiusKm) || job.tripDistanceKm > driver.zoneRadiusKm) {
      reason = "OUTSIDE_DRIVER_ZONE";
    } else if (!finiteNonnegative(driver.currentDistanceToPickupKm)) reason = "INVALID_PICKUP_DISTANCE";
    else if (!Number.isInteger(driver.proposedPayoutMinor) ||
      driver.proposedPayoutMinor < 0 || driver.proposedPayoutMinor > job.approvedMaxPayoutMinor) {
      reason = "PAYOUT_NOT_APPROVED";
    }

    if (reason) rejected.push({ driverId: driver.id, reason });
    else candidates.push({
      driverId: driver.id, relationship: driver.relationship,
      quotedPayoutMinor: driver.proposedPayoutMinor,
      distanceToPickupKm: driver.currentDistanceToPickupKm,
    });
  }
  candidates.sort((a, b) => a.quotedPayoutMinor - b.quotedPayoutMinor ||
    a.distanceToPickupKm - b.distanceToPickupKm || a.driverId.localeCompare(b.driverId));
  return { candidates, rejected, requiresHumanApproval: true };
}

export type DeliveryEvent = {
  id: string;
  type: "offer" | "accept" | "decline" | "pickup" | "deliver" | "flag_exception" | "cancel";
  actorId: string;
  actorRole: DeliveryActorRole;
  organizationId: string;
  driverId?: string;
  payoutMinor?: number;
  proofReference?: string;
  reason?: string;
  expectedVersion: number;
};

/** Pure planner; real persistence requires atomic versioning and durable idempotency. */
export function transitionDispatch(
  scope: DispatchScope, job: DispatchJob, event: DeliveryEvent,
): DispatchJob {
  assertScope(scope, job);
  if (event.organizationId !== scope.organizationId) throw new DispatchPolicyError("TENANT_SCOPE_MISMATCH");
  if (event.actorId !== scope.actorId || event.actorRole !== scope.actorRole) {
    throw new DispatchPolicyError("AUTH_CONTEXT_MISMATCH");
  }
  if (!event.id || !event.actorId) throw new DispatchPolicyError("AUTHENTICATED_EVENT_REQUIRED");
  if (job.processedEventIds.includes(event.id)) return job;
  if (event.expectedVersion !== job.version) throw new DispatchPolicyError("STALE_VERSION");

  const dispatcher = event.actorRole === "dispatcher";
  const nominated = event.actorRole === "driver" && !!event.driverId && event.actorId === event.driverId;
  const isOfferedDriver = nominated && job.offeredDriverId === event.driverId;
  const isAssignedDriver = nominated && job.assignedDriverId === event.driverId;
  const next: DispatchJob = {
    ...job, version: job.version + 1,
    processedEventIds: [...job.processedEventIds, event.id],
  };

  switch (event.type) {
    case "offer":
      if (!dispatcher || !job.approvedByMerchant || job.status !== "ready" ||
        !event.driverId || !Number.isInteger(event.payoutMinor) ||
        (event.payoutMinor ?? -1) < 0 ||
        (event.payoutMinor ?? Infinity) > job.approvedMaxPayoutMinor) {
        throw new DispatchPolicyError("OFFER_NOT_AUTHORISED");
      }
      return { ...next, status: "offered", offeredDriverId: event.driverId,
        assignedDriverId: null, payoutMinor: event.payoutMinor ?? null };
    case "accept":
      if (job.status !== "offered" || !isOfferedDriver) {
        throw new DispatchPolicyError("ACCEPT_NOT_AUTHORISED");
      }
      return { ...next, status: "accepted", assignedDriverId: job.offeredDriverId };
    case "decline":
      if (job.status !== "offered" || !isOfferedDriver) {
        throw new DispatchPolicyError("DECLINE_NOT_AUTHORISED");
      }
      return { ...next, status: "ready", offeredDriverId: null, payoutMinor: null };
    case "pickup":
      if (job.status !== "accepted" || !isAssignedDriver) {
        throw new DispatchPolicyError("PICKUP_NOT_AUTHORISED");
      }
      return { ...next, status: "picked_up" };
    case "deliver":
      if (job.status !== "picked_up" || !isAssignedDriver || !event.proofReference?.trim()) {
        throw new DispatchPolicyError("DELIVERY_PROOF_REQUIRED");
      }
      return { ...next, status: "delivered", proofReference: event.proofReference };
    case "flag_exception":
      if (!dispatcher && !isOfferedDriver && !isAssignedDriver) {
        throw new DispatchPolicyError("EXCEPTION_NOT_AUTHORISED");
      }
      if (job.status === "delivered" || job.status === "cancelled" || !event.reason?.trim()) {
        throw new DispatchPolicyError("EXCEPTION_REASON_REQUIRED");
      }
      return { ...next, status: "exception", exceptionReason: event.reason };
    case "cancel":
      if (!dispatcher || job.status === "delivered" || job.status === "cancelled" ||
        job.status === "picked_up" || !event.reason?.trim()) {
        throw new DispatchPolicyError("CANCELLATION_REQUIRES_APPROVAL");
      }
      return { ...next, status: "cancelled", exceptionReason: event.reason };
  }
}

export type ProposedPayout = {
  jobId: string;
  driverId: string;
  amountMinor: number;
  state: "awaiting_finance_approval";
};

/** Never transfers money; finance must explicitly approve a separate payment action. */
export function proposePayout(scope: DispatchScope, job: DispatchJob): ProposedPayout {
  assertScope(scope, job);
  if (scope.actorRole !== "finance") throw new DispatchPolicyError("FINANCE_REVIEW_REQUIRED");
  if (job.status !== "delivered" || job.settled ||
    !job.assignedDriverId || !job.proofReference ||
    !Number.isInteger(job.payoutMinor) || (job.payoutMinor ?? -1) < 0) {
    throw new DispatchPolicyError("PAYOUT_NOT_READY");
  }
  return {
    jobId: job.id, driverId: job.assignedDriverId,
    amountMinor: job.payoutMinor ?? 0, state: "awaiting_finance_approval",
  };
}
