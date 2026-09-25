import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getDemoOsHomeData } from "../lib/os-home/demo/business-os-home";
import { buildLiveBrief } from "../lib/os-home/select-home-data";
import { loadLiveWorkspaceStatus } from "../lib/os-home/loaders/workspace-status";
import { loadLiveRooms } from "../lib/os-home/loaders/rooms";
import { getUserDisplayName } from "../lib/user-display-name";
import type { AttentionItem } from "../lib/os-home/types";

describe("os-home demo/live isolation", () => {
  it("tags every demo payload as source demo", () => {
    const data = getDemoOsHomeData();
    assert.equal(data.workspace.mode, "demo");
    assert.equal(data.liveAttempted, false);
    assert.ok(data.attention.every((i) => i.source === "demo"));
    assert.ok(data.pulse.every((i) => i.source === "demo"));
    assert.ok(data.continueWorking.every((i) => i.source === "demo"));
    assert.ok(data.rooms.every((i) => i.source === "demo"));
    assert.equal(data.brief.source, "demo");
    assert.ok(data.brief.recommendations.every((r) => r.source === "demo"));
    assert.ok(data.brief.recommendations.every((r) => r.kind !== "executed"));
  });

  it("live brief never invents unsupported CRM types", () => {
    const attention: AttentionItem[] = [
      {
        id: "live-tasks-due",
        type: "task_due",
        label: "Tasks due today",
        count: 2,
        href: "/os/work/tasks",
        source: "live",
      },
    ];
    const brief = buildLiveBrief(attention);
    assert.equal(brief.source, "live");
    assert.equal(brief.attentionCount, 2);
    assert.ok(brief.recommendations.every((r) => r.kind === "recommendation"));
    assert.ok(!brief.summary.toLowerCase().includes("invoice"));
    assert.ok(!brief.summary.toLowerCase().includes("lead"));
  });

  it("live rooms loader returns empty (no fabricated presenters)", async () => {
    const rooms = await loadLiveRooms();
    assert.deepEqual(rooms, []);
  });

  it("live workspace status labels live mode from membership", () => {
    const status = loadLiveWorkspaceStatus({
      memberships: [
        {
          organizationId: "org-1",
          organizationName: "Acme Retail",
          organizationSlug: "acme",
          organizationStatus: "active",
          roleKey: "staff",
          roleId: "role-1",
          permissions: [],
        },
      ],
      organizationId: "org-1",
      roleKey: "staff",
    });
    assert.equal(status.mode, "live");
    assert.equal(status.organizationName, "Acme Retail");
    assert.match(status.detail, /staff/i);
    assert.ok(!status.headline.includes("DEMO"));
  });

  it("empty live brief stays honest", () => {
    const brief = buildLiveBrief([]);
    assert.equal(brief.attentionCount, 0);
    assert.equal(brief.recommendations.length, 0);
    assert.match(brief.summary, /Nothing urgent|supported/i);
  });
});

describe("os-home greeting and chat honesty contracts", () => {
  it("never greets with raw email", () => {
    assert.equal(
      getUserDisplayName({ email: "andrinotd2021@gmail.com", displayName: null }),
      "there"
    );
  });

  it("Home content uses command centre not card feed", () => {
    const home = readFileSync(join(process.cwd(), "components/os/OsHomeContent.tsx"), "utf8");
    const hero = readFileSync(join(process.cwd(), "components/os/OsDashboardHero.tsx"), "utf8");
    const page = readFileSync(join(process.cwd(), "app/os/page.tsx"), "utf8");
    assert.match(home, /OsHomeCommandCentre/);
    assert.doesNotMatch(home, /OsCardGrid/);
    assert.doesNotMatch(home, /OsPresenceRow/);
    assert.doesNotMatch(hero, /12 new leads/);
    assert.match(page, /selectOsHomeData/);
  });

  it("OS chat surface does not invent invoice/lead counts", () => {
    const chat = readFileSync(join(process.cwd(), "app/api/chat/route.ts"), "utf8");
    assert.doesNotMatch(chat, /3 overdue invoices/);
    assert.doesNotMatch(chat, /7 leads need follow-up/);
    assert.match(chat, /will not invent/i);
  });

  it("selectOsHomeData routes demo vs live without mixing", () => {
    const source = readFileSync(join(process.cwd(), "lib/os-home/select-home-data.ts"), "utf8");
    assert.match(source, /getDemoOsHomeData/);
    assert.match(source, /isSupabaseMode/);
    assert.match(source, /loadLiveAttentionItems/);
    assert.doesNotMatch(source, /getDemoOsHomeData\(\).*loadLive/);
  });
});

describe("attention permission gating helpers", () => {
  it("demo attention includes sample types with href deep-links", () => {
    const data = getDemoOsHomeData();
    const leads = data.attention.find((i) => i.type === "lead_followup");
    assert.ok(leads);
    assert.equal(leads?.source, "demo");
    assert.ok(leads?.href.startsWith("/os/"));
  });
});
