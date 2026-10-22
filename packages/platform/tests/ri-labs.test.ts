import assert from "node:assert/strict";
import test from "node:test";
import {
  RI_LABS_MODULES,
  RUN_BUSINESS_24X7_LOOPS,
  canTransitionRiLabs,
  canTransitionSelfServe,
} from "../src/index";

test("RI Labs exposes the governed product factory modules", () => {
  assert.equal(RI_LABS_MODULES.length, 8);
  assert.equal(RI_LABS_MODULES.some((module) => module.key === "agent-eval"), true);
  assert.equal(RI_LABS_MODULES.some((module) => module.key === "launch-gate"), true);
});

test("RI Labs lifecycle cannot skip evidence gates", () => {
  assert.equal(canTransitionRiLabs("signal", "thesis"), true);
  assert.equal(canTransitionRiLabs("signal", "launch"), false);
  assert.equal(canTransitionRiLabs("eval", "pilot"), true);
  assert.equal(canTransitionRiLabs("pilot", "scale"), false);
});

test("self-serve activation requires entitlement before provisioning", () => {
  assert.equal(canTransitionSelfServe("paid", "entitled"), true);
  assert.equal(canTransitionSelfServe("paid", "provisioning"), false);
  assert.equal(canTransitionSelfServe("entitled", "provisioning"), true);
  assert.equal(canTransitionSelfServe("payment_pending", "active"), false);
});

test("blocked or failed activation cannot bypass verified payment and entitlement", () => {
  assert.equal(canTransitionSelfServe("blocked", "entitled"), false);
  assert.equal(canTransitionSelfServe("blocked", "provisioning"), false);
  assert.equal(canTransitionSelfServe("failed", "entitled"), false);
  assert.equal(canTransitionSelfServe("failed", "provisioning"), false);
  assert.equal(canTransitionSelfServe("blocked", "payment_pending"), true);
  assert.equal(canTransitionSelfServe("failed", "payment_pending"), true);
});

test("24x7 model covers sell, deliver, run, grow and support", () => {
  assert.deepEqual(
    RUN_BUSINESS_24X7_LOOPS.map((loop) => loop.key),
    ["sell", "deliver", "run", "grow", "support"],
  );
});
