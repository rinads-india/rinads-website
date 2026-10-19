import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { resolveRinpoPhoneHome } from "../lib/rinpo-phone/home";

function baseInput() {
  return {
    userId: "user-1",
    rinpoId: "auth:user-1",
    workspaceId: "personal:user-1",
    workspaceType: "personal" as const,
    tenantId: null,
    roleIds: [] as string[],
    permissionIds: [] as string[],
    planId: null,
    deviceId: "web:unregistered",
    platform: "web" as const,
    requestId: "request-1",
    sessionId: "session-1",
  };
}

describe("RINPO Phone M1 home resolver", () => {
  it("keeps organisation work out of a personal workspace", () => {
    const home = resolveRinpoPhoneHome(baseInput());
    const slugs = home.apps.map((app) => app.slug);

    assert.ok(slugs.includes("today"));
    assert.ok(slugs.includes("ask-rinpo"));
    assert.ok(slugs.includes("apps"));
    assert.ok(slugs.includes("world"));
    assert.ok(slugs.includes("settings"));
    assert.equal(slugs.includes("work"), false);
  });

  it("exposes Work inside an authorised organisation workspace", () => {
    const home = resolveRinpoPhoneHome({
      ...baseInput(),
      workspaceId: "org:org-1",
      workspaceType: "organisation",
      tenantId: "org-1",
      roleIds: ["staff"],
      permissionIds: ["org.read"],
    });

    assert.ok(home.apps.some((app) => app.slug === "work" && app.route === "/os/work"));
  });

  it("keeps resolved tenant identity inside the workspace boundary", () => {
    const home = resolveRinpoPhoneHome({
      ...baseInput(),
      workspaceId: "org:org-2",
      workspaceType: "organisation",
      tenantId: "org-2",
      roleIds: ["manager"],
    });

    assert.equal(home.workspace.tenantId, "org-2");
    assert.deepEqual(home.workspace.roles, ["manager"]);
  });
});

describe("RINPO Phone M1 routes", () => {
  it("ships the authenticated shell and server-side home API", () => {
    const root = process.cwd();
    const page = join(root, "app", "phone", "page.tsx");
    const api = join(root, "app", "api", "v1", "phone", "home", "route.ts");

    assert.ok(existsSync(page), `missing ${page}`);
    assert.ok(existsSync(api), `missing ${api}`);
    assert.match(readFileSync(page, "utf8"), /resolveRinpoPhoneAccess/);
    assert.match(readFileSync(api, "utf8"), /cache-control/);
  });
});
