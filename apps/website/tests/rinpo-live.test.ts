import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { COMMERCIAL_CONFIG } from "../lib/content/commercialConfig";
import { SOLUTION_CATALOG } from "../lib/content/solutionCatalog";
import {
  DEFAULT_MAX_DURATION_SECONDS,
  RUNWAY_MAX_DURATION_SECONDS,
  readLiveConfig,
} from "../lib/rinpo-live/config";
import {
  LIVE_PER_IP_MAX,
  createLiveGuards,
  isAllowedOrigin,
} from "../lib/rinpo-live/guard";
import {
  KNOWLEDGE_TOKEN_LIMIT,
  buildGeneratedKnowledge,
  buildKnowledgeDocuments,
  totalKnowledgeTokens,
} from "../lib/rinpo-live/knowledge";
import {
  LIVE_LANGUAGES,
  getLiveLanguage,
  isLiveLanguageCode,
} from "../lib/rinpo-live/languages";
import {
  PERSONALITY_MAX_CHARS,
  START_SCRIPT_MAX_CHARS,
  buildPersonality,
  buildStartScript,
} from "../lib/rinpo-live/personality";
import {
  LiveSessionError,
  createLiveSession,
  type LiveSessionDeps,
} from "../lib/rinpo-live/session";
import {
  SUGGESTABLE_PAGES,
  SUGGEST_LINK_TOOL,
  resolveSuggestedLink,
} from "../lib/rinpo-live/tools";
import { formatClock, speakerOf } from "../lib/rinpo-live/transcript";

const WEBSITE_ROOT = new URL("..", import.meta.url).pathname;

function read(relative: string): string {
  return readFileSync(join(WEBSITE_ROOT, relative), "utf8");
}

function authoredKnowledge() {
  const dir = join(WEBSITE_ROOT, "content", "rinpo-knowledge");
  return readdirSync(dir)
    .filter((file) => file.endsWith(".md"))
    .map((file) => ({
      key: file.replace(/\.md$/, ""),
      name: file,
      content: readFileSync(join(dir, file), "utf8"),
    }));
}

describe("RINPO Live languages", () => {
  it("has unique codes, a valid auto default, and fits Runway's start-script limit", () => {
    const codes = LIVE_LANGUAGES.map((language) => language.code);
    assert.equal(new Set(codes).size, codes.length);
    assert.equal(LIVE_LANGUAGES[0].code, "auto");
    for (const language of LIVE_LANGUAGES) {
      assert.ok(language.greeting.length > 0 && language.greeting.length <= START_SCRIPT_MAX_CHARS);
      assert.equal(buildStartScript(language.code), language.greeting);
    }
  });

  it("labels languages Runway does not document for voices as beta", () => {
    const beta = LIVE_LANGUAGES.filter((language) => language.support === "beta").map((l) => l.code);
    assert.deepEqual(beta.sort(), ["ar", "ml", "ta"]);
  });

  it("validates codes strictly", () => {
    assert.equal(isLiveLanguageCode("ml"), true);
    assert.equal(isLiveLanguageCode("xx"), false);
    assert.equal(isLiveLanguageCode(undefined), false);
    assert.equal(isLiveLanguageCode("constructor"), false);
  });
});

describe("RINPO Live personality", () => {
  it("fits Runway's personality limit in every language", () => {
    for (const language of LIVE_LANGUAGES) {
      assert.ok(buildPersonality(language.code).length <= PERSONALITY_MAX_CHARS);
    }
  });

  it("applies the chosen language, and follows the visitor in auto mode", () => {
    assert.match(buildPersonality("ml"), /Speak Malayalam/);
    assert.match(buildPersonality("ml"), /short, simple sentences/); // beta guidance
    assert.doesNotMatch(buildPersonality("en"), /short, simple sentences/);
    assert.match(buildPersonality("auto"), /same language the visitor is speaking/);
  });

  it("keeps the honesty rules in every language", () => {
    for (const language of LIVE_LANGUAGES) {
      const prompt = buildPersonality(language.code);
      assert.match(prompt, /Never quote a price/);
      assert.match(prompt, /never present a preview or roadmap item/i);
      assert.match(prompt, /AI character, not a human/);
      assert.match(prompt, /Never ask for or accept passwords/);
    }
  });

  it("only advertises pages the avatar may actually show", () => {
    const prompt = buildPersonality("en");
    for (const key of Object.keys(SUGGESTABLE_PAGES)) assert.ok(prompt.includes(key));
  });
});

describe("RINPO Live suggest_link tool", () => {
  it("resolves only whitelisted page keys", () => {
    assert.deepEqual(resolveSuggestedLink({ page: "pricing" }), {
      key: "pricing",
      label: "Pricing",
      href: "/pricing",
    });
    for (const bad of [
      { page: "https://evil.example" },
      { page: "/admin" },
      { page: "constructor" },
      { page: "__proto__" },
      { page: 42 },
      {},
      null,
      "pricing",
      undefined,
    ]) {
      assert.equal(resolveSuggestedLink(bad), null);
    }
  });

  it("points every key at a page that exists", () => {
    for (const { href } of Object.values(SUGGESTABLE_PAGES)) {
      assert.ok(href.startsWith("/"));
      const file = join(WEBSITE_ROOT, "app", ...href.split("/").filter(Boolean), "page.tsx");
      assert.ok(existsSync(file), `${href} has no page.tsx`);
    }
  });

  it("sends Runway a closed enum matching the whitelist", () => {
    assert.equal(SUGGEST_LINK_TOOL.type, "client_event");
    const [parameter] = SUGGEST_LINK_TOOL.parameters ?? [];
    assert.equal(parameter?.type, "string");
    assert.deepEqual(
      (parameter as { enum?: string[] }).enum,
      Object.keys(SUGGESTABLE_PAGES),
    );
  });
});

describe("RINPO Live knowledge", () => {
  it("generates unique, non-empty documents", () => {
    const docs = buildGeneratedKnowledge();
    assert.ok(docs.length >= 6);
    assert.equal(new Set(docs.map((d) => d.key)).size, docs.length);
    assert.equal(new Set(docs.map((d) => d.name)).size, docs.length);
    for (const doc of docs) assert.ok(doc.content.trim().length > 100, doc.key);
  });

  it("fits Runway's token budget with hand-written documents included", () => {
    const total = totalKnowledgeTokens(buildKnowledgeDocuments(authoredKnowledge()));
    assert.ok(total < KNOWLEDGE_TOKEN_LIMIT * 0.8, `~${total} tokens`);
  });

  it("never describes a non-available edition as available", () => {
    const editions = buildGeneratedKnowledge().find((d) => d.key === "editions")!.content;
    for (const edition of SOLUTION_CATALOG.filter((e) => e.status === "roadmap")) {
      const block = editions
        .split("\n## ")
        .find((section) => section.includes(edition.editionName))!;
      assert.match(block, /\[Roadmap\]/);
      assert.doesNotMatch(block, /\[Available\]/);
    }
  });

  it("lists each edition page once, even when the catalog keeps legacy aliases", () => {
    const editions = buildGeneratedKnowledge().find((d) => d.key === "editions")!.content;
    const pages = [...editions.matchAll(/^Page: (.+)$/gm)].map((match) => match[1]);
    assert.ok(pages.length > 0);
    assert.equal(new Set(pages).size, pages.length);
  });

  it("renders clean markdown lists (no doubled bullets)", () => {
    for (const doc of buildGeneratedKnowledge()) {
      assert.doesNotMatch(doc.content, /^- - /m, doc.key);
    }
  });

  it("publishes no numeric price while prices are unapproved", () => {
    assert.equal(COMMERCIAL_CONFIG.priceApproved, false, "update this test when prices are approved");
    const pricing = buildGeneratedKnowledge().find((d) => d.key === "pricing")!.content;
    assert.match(pricing, /Never quote a number/);
    assert.doesNotMatch(pricing, /(INR|USD|₹|\$)\s?\d/);
  });

  it("includes the verified contact line", () => {
    const company = buildGeneratedKnowledge().find((d) => d.key === "company")!.content;
    assert.match(company, /\+91 89211 95996/);
    assert.match(company, /Thrissur/);
  });

  it("skips blank hand-written documents", () => {
    const docs = buildKnowledgeDocuments([{ key: "x", name: "X", content: "   \n" }]);
    assert.equal(docs.some((d) => d.key === "x"), false);
  });
});

describe("RINPO Live config", () => {
  it("stays disabled until both secrets exist", () => {
    assert.equal(readLiveConfig({}), null);
    assert.equal(readLiveConfig({ RUNWAYML_API_SECRET: "k" }), null);
    assert.equal(readLiveConfig({ RUNWAY_AVATAR_ID: "a" }), null);
    assert.equal(readLiveConfig({ RUNWAYML_API_SECRET: " ", RUNWAY_AVATAR_ID: "a" }), null);
  });

  it("applies defaults and clamps limits to Runway's range", () => {
    const base = { RUNWAYML_API_SECRET: "k", RUNWAY_AVATAR_ID: "a" };
    assert.equal(readLiveConfig(base)?.maxDurationSeconds, DEFAULT_MAX_DURATION_SECONDS);
    assert.equal(
      readLiveConfig({ ...base, RINPO_LIVE_MAX_SECONDS: "9999" })?.maxDurationSeconds,
      RUNWAY_MAX_DURATION_SECONDS,
    );
    assert.equal(readLiveConfig({ ...base, RINPO_LIVE_MAX_SECONDS: "1" })?.maxDurationSeconds, 30);
    assert.equal(
      readLiveConfig({ ...base, RINPO_LIVE_MAX_SECONDS: "abc" })?.maxDurationSeconds,
      DEFAULT_MAX_DURATION_SECONDS,
    );
  });
});

describe("RINPO Live guards", () => {
  const site = "https://www.rinads.com";

  it("rejects foreign origins but allows own, apex/www variants and non-browser clients", () => {
    assert.equal(isAllowedOrigin("https://evil.example", "www.rinads.com", site), false);
    assert.equal(isAllowedOrigin("not a url", "www.rinads.com", site), false);
    assert.equal(isAllowedOrigin("https://www.rinads.com", "www.rinads.com", site), true);
    assert.equal(isAllowedOrigin("https://rinads.com", "www.rinads.com", site), true);
    assert.equal(isAllowedOrigin("http://localhost:3000", "localhost:3000", site), true);
    assert.equal(isAllowedOrigin(null, "www.rinads.com", site), true);
  });

  it("limits sessions per IP, then reports Retry-After", () => {
    const guards = createLiveGuards();
    const input = { ip: "1.2.3.4", origin: null, host: "www.rinads.com", siteUrl: site };
    for (let i = 0; i < LIVE_PER_IP_MAX; i += 1) {
      assert.equal(guards.check(input, { dailySessionCap: 100 }).ok, true);
    }
    const blocked = guards.check(input, { dailySessionCap: 100 });
    assert.equal(blocked.ok, false);
    assert.ok(!blocked.ok && blocked.status === 429 && blocked.retryAfterSec >= 1);
    // another network is unaffected
    assert.equal(guards.check({ ...input, ip: "5.6.7.8" }, { dailySessionCap: 100 }).ok, true);
  });

  it("enforces the daily ceiling across IPs", () => {
    const guards = createLiveGuards();
    const config = { dailySessionCap: 2 };
    const at = (ip: string) =>
      guards.check({ ip, origin: null, host: "www.rinads.com", siteUrl: site }, config);
    assert.equal(at("a").ok, true);
    assert.equal(at("b").ok, true);
    const third = at("c");
    assert.ok(!third.ok && third.status === 429);
  });

  it("returns 403 for a foreign origin before spending any quota", () => {
    const guards = createLiveGuards();
    const verdict = guards.check(
      { ip: "9.9.9.9", origin: "https://evil.example", host: "www.rinads.com", siteUrl: site },
      { dailySessionCap: 1 },
    );
    assert.ok(!verdict.ok && verdict.status === 403);
    // the daily slot was not consumed
    assert.equal(
      guards.check(
        { ip: "9.9.9.9", origin: null, host: "www.rinads.com", siteUrl: site },
        { dailySessionCap: 1 },
      ).ok,
      true,
    );
  });
});

describe("RINPO Live session service", () => {
  const config = {
    apiSecret: "secret",
    avatarId: "avatar-123",
    maxDurationSeconds: 120,
    dailySessionCap: 10,
  };

  function fakeDeps(overrides: Partial<LiveSessionDeps> = {}) {
    const calls = { create: [] as unknown[], cancel: [] as string[] };
    const deps: LiveSessionDeps = {
      create: async (body) => {
        calls.create.push(body);
        return { id: "sess-1" };
      },
      cancel: async (id) => {
        calls.cancel.push(id);
      },
      waitUntilReady: async (id) => ({ sessionId: id, sessionKey: "key-1" }),
      consume: async () => ({ url: "wss://rt.example", token: "tok", roomName: "room" }),
      ...overrides,
    };
    return { deps, calls };
  }

  it("creates a language-specific session and returns browser credentials only", async () => {
    const { deps, calls } = fakeDeps();
    const result = await createLiveSession(config, "ml", deps);

    assert.deepEqual(result, {
      sessionId: "sess-1",
      serverUrl: "wss://rt.example",
      token: "tok",
      roomName: "room",
      maxDurationSeconds: 120,
      language: "ml",
    });
    assert.equal(JSON.stringify(result).includes("secret"), false);
    assert.equal(JSON.stringify(result).includes("key-1"), false);

    const body = calls.create[0] as Record<string, unknown>;
    assert.equal(body.model, "gwm1_avatars");
    assert.deepEqual(body.avatar, { type: "custom", avatarId: "avatar-123" });
    assert.equal(body.maxDuration, 120);
    assert.equal(body.startScript, getLiveLanguage("ml").greeting);
    assert.match(String(body.personality), /Speak Malayalam/);
    assert.deepEqual(body.tools, [SUGGEST_LINK_TOOL]);
    assert.deepEqual(calls.cancel, []);
  });

  it("cancels a half-started session so it stops billing", async () => {
    const { deps, calls } = fakeDeps({
      consume: async () => {
        throw new Error("consume failed");
      },
    });
    await assert.rejects(() => createLiveSession(config, "en", deps), LiveSessionError);
    assert.deepEqual(calls.cancel, ["sess-1"]);
  });

  it("does not try to cancel when creation itself fails, and survives a failing cancel", async () => {
    const created = fakeDeps({
      create: async () => {
        throw new Error("401");
      },
    });
    await assert.rejects(() => createLiveSession(config, "en", created.deps), LiveSessionError);
    assert.deepEqual(created.calls.cancel, []);

    const stuck = fakeDeps({
      waitUntilReady: async () => {
        throw new Error("timeout");
      },
      cancel: async () => {
        throw new Error("cancel failed");
      },
    });
    await assert.rejects(() => createLiveSession(config, "en", stuck.deps), LiveSessionError);
  });

  it("hides provider detail from the error message", async () => {
    const { deps } = fakeDeps({
      create: async () => {
        throw new Error("secret-provider-detail");
      },
    });
    await assert.rejects(
      () => createLiveSession(config, "en", deps),
      (error: Error) => !error.message.includes("secret-provider-detail"),
    );
  });
});

describe("RINPO Live transcript helpers", () => {
  it("labels speakers from the Runway turn id, falling back to identity", () => {
    assert.equal(speakerOf({ id: "runway-transcription-user-3", participantIdentity: "x" }), "visitor");
    assert.equal(speakerOf({ id: "runway-transcription-assistant-3", participantIdentity: "x" }), "rinpo");
    assert.equal(speakerOf({ id: "seg-1", participantIdentity: "user-abc" }), "visitor");
    assert.equal(speakerOf({ id: "seg-2", participantIdentity: "avatar-worker" }), "rinpo");
  });

  it("formats the countdown clock", () => {
    assert.equal(formatClock(125), "2:05");
    assert.equal(formatClock(59.9), "0:59");
    assert.equal(formatClock(-4), "0:00");
  });
});

describe("RINPO Live surfaces", () => {
  it("is registered for SEO and linked from RINPO navigation", () => {
    assert.match(read("lib/route-registry.ts"), /path: "\/rinpo\/live"/);
    assert.match(read("lib/product-ia.ts"), /href: "\/rinpo\/live"/);
    assert.match(read("app/rinpo/live/page.tsx"), /LiveClient/);
  });

  it("is honest in the UI: AI disclosure, transcription notice, disabled state, beta labels", () => {
    const ui = read("components/rinpo/RinpoLive.tsx");
    assert.match(ui, /AI character, not a person/);
    assert.match(ui, /may be transcribed/);
    assert.match(ui, /not enabled on this deployment yet/);
    assert.match(ui, /Beta/);
    assert.match(ui, /dir="auto"/);
    assert.match(ui, /prefers-reduced-motion/);
  });

  it("opens suggested links in a new tab so the call is never interrupted", () => {
    const ui = read("components/rinpo/RinpoLive.tsx");
    assert.match(ui, /target="_blank"/);
    assert.match(ui, /rel="noopener noreferrer"/);
  });

  it("keeps the Runway secret out of client code", () => {
    for (const file of [
      "components/rinpo/RinpoLive.tsx",
      "app/rinpo/live/LiveClient.tsx",
      "lib/rinpo-live/languages.ts",
      "lib/rinpo-live/tools.ts",
      "lib/rinpo-live/transcript.ts",
    ]) {
      assert.doesNotMatch(read(file), /RUNWAYML_API_SECRET|NEXT_PUBLIC_RUNWAY/, file);
    }
  });

  it("route validates origin, rate limits and hides provider errors", () => {
    const route = read("app/api/rinpo/live/route.ts");
    assert.match(route, /guards\.check/);
    assert.match(route, /status: 503/);
    assert.match(route, /Provider detail stays in the server log/);
    assert.doesNotMatch(route, /error\.message/);
  });
});
