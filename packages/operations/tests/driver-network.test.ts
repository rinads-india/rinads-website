import { test } from "node:test";
import assert from "node:assert/strict";
import {
  rankEligibleDrivers, transitionDispatch, proposePayout, DispatchPolicyError,
} from "../src/shipping/driver-network.ts";

const scope = {
  organizationId: "org-cake-farm", actorId: "dispatcher1",
  actorRole: "dispatcher", allowVerifiedMarketplaceDrivers: true,
};
const job = {
  id: "job-1", organizationId: scope.organizationId, status: "ready",
  requiredVehicle: "scooter", tripDistanceKm: 4, approvedMaxPayoutMinor: 10000,
  approvedByMerchant: true, offeredDriverId: null, assignedDriverId: null,
  payoutMinor: null, proofReference: null, exceptionReason: null, settled: false,
  version: 1, processedEventIds: [],
};
const driver = (opts = {}) => ({
  id: "rider1", employerOrganizationId: null, relationship: "freelancer",
  verification: "verified", licenceVerified: true, insuranceVerified: true,
  vehicle: "scooter", available: true, onShift: true, networkOptIn: true,
  zoneRadiusKm: 10, currentDistanceToPickupKm: 2, proposedPayoutMinor: 7800,
  ...opts,
});
const event = (type, actorRole, actorId, version, rest = {}) => ({
  id: "e-" + type + "-" + version, type, actorRole, actorId,
  organizationId: scope.organizationId, expectedVersion: version, ...rest,
});
const apply = (j, e, auth = { ...scope, actorId: e.actorId, actorRole: e.actorRole }) =>
  transitionDispatch(auth, j, e);
function err(fn, code) {
  assert.throws(fn, e => e instanceof DispatchPolicyError && e.code === code);
}
test("cross tenant access fails closed", () =>
  err(() => rankEligibleDrivers(scope, {...job, organizationId: "other"}, [driver()]), "TENANT_SCOPE_MISMATCH"));
test("merchant acceptance required", () =>
  err(() => rankEligibleDrivers(scope, {...job, approvedByMerchant: false}, [driver()]), "MERCHANT_ACCEPTANCE_REQUIRED"));
test("pending driver blocked", () =>
  assert.equal(rankEligibleDrivers(scope, job, [driver({verification:"pending"})]).candidates.length, 0));
test("uninsured driver blocked", () =>
  assert.equal(rankEligibleDrivers(scope,job,[driver({insuranceVerified:false})]).rejected[0].reason,"DOCUMENTS_NOT_VERIFIED"));
test("freelancer opt-in required", () =>
  assert.equal(rankEligibleDrivers(scope,job,[driver({networkOptIn:false})]).candidates.length,0));
test("another tenant staff blocked", () =>
  assert.equal(rankEligibleDrivers(scope,job,[driver({employerOrganizationId:"other",relationship:"client_staff"})]).candidates.length,0));
test("client-employed driver without marketplace access", () =>
  assert.equal(rankEligibleDrivers({...scope,allowVerifiedMarketplaceDrivers:false},job,[driver({employerOrganizationId:scope.organizationId,relationship:"client_staff",networkOptIn:false})]).candidates.length,1));
test("over-budget payout rejected", () =>
  assert.equal(rankEligibleDrivers(scope,job,[driver({proposedPayoutMinor:11000})]).rejected[0].reason,"PAYOUT_NOT_APPROVED"));
test("ranked by payout then distance", () =>
  assert.deepEqual(rankEligibleDrivers(scope,job,[driver({id:"high",proposedPayoutMinor:9000}),driver({id:"low",proposedPayoutMinor:6500})]).candidates.map(x=>x.driverId),["low","high"]));
test("driver cannot accept another offer", () => {
  const o=apply(job,event("offer","dispatcher","dispatcher1",1,{driverId:"rider1",payoutMinor:7800}));
  err(()=>apply(o,event("accept","driver","rider2",2,{driverId:"rider2"})),"ACCEPT_NOT_AUTHORISED");
});
test("decline returns job to ready", () => {
  const o=apply(job,event("offer","dispatcher","dispatcher1",1,{driverId:"rider1",payoutMinor:7800}));
  const d=apply(o,event("decline","driver","rider1",2,{driverId:"rider1"}));
  assert.equal(d.status,"ready");assert.equal(d.payoutMinor,null);
});
test("duplicate event replay is idempotent", () => {
  const e=event("offer","dispatcher","dispatcher1",1,{driverId:"rider1",payoutMinor:7800});
  const o=apply(job,e);assert.deepEqual(apply(o,e),o);
});
test("stale version is rejected", () =>
  err(()=>apply(job,event("offer","dispatcher","dispatcher1",15,{driverId:"rider1",payoutMinor:7800})),"STALE_VERSION"));
test("completion requires proof", () => {
  const o=apply(job,event("offer","dispatcher","dispatcher1",1,{driverId:"rider1",payoutMinor:7800}));
  const a=apply(o,event("accept","driver","rider1",2,{driverId:"rider1"}));
  const p=apply(a,event("pickup","driver","rider1",3,{driverId:"rider1"}));
  err(()=>apply(p,event("deliver","driver","rider1",4,{driverId:"rider1"})),"DELIVERY_PROOF_REQUIRED");
});
test("finance payout proposal after delivery only", () => {
  const o=apply(job,event("offer","dispatcher","dispatcher1",1,{driverId:"rider1",payoutMinor:7800}));
  const a=apply(o,event("accept","driver","rider1",2,{driverId:"rider1"}));
  const p=apply(a,event("pickup","driver","rider1",3,{driverId:"rider1"}));
  const d=apply(p,event("deliver","driver","rider1",4,{driverId:"rider1",proofReference:"pod/ref-1"}));
  assert.equal(proposePayout({...scope,actorRole:"finance",actorId:"finance1"},d).state,"awaiting_finance_approval");
  err(()=>proposePayout(scope,d),"FINANCE_REVIEW_REQUIRED");
});
test("settled jobs cannot generate a second payout proposal", () => {
  err(()=>proposePayout({...scope,actorRole:"finance"},job),"PAYOUT_NOT_READY");
  err(()=>proposePayout({...scope,actorRole:"finance"},{...job,status:"delivered",assignedDriverId:"rider1",payoutMinor:7800,proofReference:"pod",settled:true}),"PAYOUT_NOT_READY");
});
test("no unapproved cancel after pickup", () =>
  err(()=>apply({...job,status:"picked_up"},event("cancel","dispatcher","dispatcher1",1,{reason:"customer request"})),"CANCELLATION_REQUIRES_APPROVAL"));
test("event organisation mismatch rejected", () =>
  err(()=>apply(job,event("offer","dispatcher","dispatcher1",1,{organizationId:"other",driverId:"rider1",payoutMinor:7800})),"TENANT_SCOPE_MISMATCH"));
test("forged event actor rejected against trusted context", () =>
  err(()=>apply(job,event("offer","dispatcher","fake",1,{driverId:"rider1",payoutMinor:7800}),{...scope,actorId:"real"}),"AUTH_CONTEXT_MISMATCH"));
