import test from "node:test";
import assert from "node:assert/strict";
import {
  canAccessRinpoPhoneApp,
  createRinpoDeepLink,
  createRinpoWebFallback,
  getDefaultApprovalPolicy,
  parseRinpoDeepLink,
  resolvePhoneApps,
  validateRinpoRuntimeContext,
  type RinpoPhoneAppDefinition,
  type RinpoRuntimeContext,
} from "../src/index";

function baseContext(): RinpoRuntimeContext {
  return {
    requestId: "req-1",
    actor: { userId: "user-1", rinpoId: "rinpo-1" },
    workspace: {
      workspaceId: "ws-1",
      workspaceType: "organisation",
      tenantId: "tenant-1",
      roleIds: ["owner"],
      permissionIds: ["customers.read", "appointments.read"],
      planId: "pro",
    },
    device: {
      deviceId: "device-1",
      platform: "ios",
      appVersion: "1.0.0",
    },
    experience: {
      appId: "home",
      route: "/home",
      sessionId: "session-1",
    },
    runtime: {
      allowedTools: ["customers.lookup"],
      memoryScopes: ["tenant", "role"],
      confirmationPolicy: "default",
    },
  };
}

const apps: RinpoPhoneAppDefinition[] = [
  {
    id: "today",
    slug: "today",
    name: "Today",
    category: "core",
    status: "available",
    entry: { type: "module", route: "/today" },
    pinned: true,
    position: 1,
  },
  {
    id: "salon",
    slug: "r-salon",
    name: "R Salon",
    category: "business",
    status: "available",
    entry: { type: "module", route: "/apps/r-salon" },
    visibility: {
      workspaceTypes: ["organisation", "client"],
      roles: ["owner", "manager"],
      platforms: ["ios", "android", "web"],
    },
    requiredPermissions: ["appointments.read"],
    position: 10,
  },
  {
    id: "admin",
    slug: "admin",
    name: "Admin",
    category: "business",
    status: "available",
    entry: { type: "module", route: "/admin" },
    visibility: { roles: ["super_admin"] },
    requiredPermissions: ["permissions.write"],
  },
];

test("registry resolves only apps permitted by role, platform, and permissions", () => {
  const context = baseContext();
  const resolved = resolvePhoneApps({ context, apps });
  assert.deepEqual(resolved.map((app) => app.id), ["today", "salon"]);
  assert.equal(canAccessRinpoPhoneApp(apps[2], context), false);
});

test("registry fails closed when required permission is absent", () => {
  const context = baseContext();
  context.workspace.permissionIds = [];
  assert.equal(canAccessRinpoPhoneApp(apps[1], context), false);
});

test("runtime context requires tenant id for organisation workspaces", () => {
  const context = baseContext();
  context.workspace.tenantId = null;
  const result = validateRinpoRuntimeContext(context);
  assert.equal(result.ok, false);
  assert.match(result.errors.join(" "), /require tenantId/);
});

test("world context cannot request unrestricted tenant memory", () => {
  const context = baseContext();
  context.workspace = {
    ...context.workspace,
    workspaceType: "world",
    tenantId: null,
  };
  context.runtime.memoryScopes = ["world", "tenant:*"];
  const result = validateRinpoRuntimeContext(context);
  assert.equal(result.ok, false);
});

test("risk levels map to stronger confirmation requirements", () => {
  assert.equal(getDefaultApprovalPolicy(0).authenticationRequired, "none");
  assert.equal(getDefaultApprovalPolicy(5).authenticationRequired, "biometric");
  assert.equal(getDefaultApprovalPolicy(6).authenticationRequired, "mfa");
});

test("RINPO deep links only accept the RINPO scheme or canonical phone host", () => {
  assert.equal(createRinpoDeepLink("world/thrissur"), "rinpo://world/thrissur");
  assert.equal(createRinpoWebFallback("/today"), "https://phone.rinads.com/today");
  assert.deepEqual(parseRinpoDeepLink("rinpo://world/thrissur")?.segments, ["world", "thrissur"]);
  assert.equal(parseRinpoDeepLink("https://phone.rinads.com/today")?.path, "/today");
  assert.equal(parseRinpoDeepLink("https://example.com/today"), null);
});
