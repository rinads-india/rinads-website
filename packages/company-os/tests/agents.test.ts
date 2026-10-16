import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { AGENT_ROLES, agentActor, filterContextForRole, getAgentRole, validateProposals, validateRoleProfiles, type AgentWorker } from "../src";

describe("AI workforce roles", () => {
  it("defines exactly the twelve logical roles", () => {
    assert.deepEqual(
      AGENT_ROLES.map((r) => r.key).sort(),
      ["academy_director", "ads_manager", "ai_production_lead", "client_success", "creative_director", "engineering_lead", "founder_chief_of_staff", "growth_director", "operations_controller", "production_director", "sales_intelligence", "trend_intelligence"]
    );
  });

  it("is internally valid and every role is propose/read only (no autonomous execution in v1)", () => {
    assert.deepEqual(validateRoleProfiles(), []);
    for (const r of AGENT_ROLES) assert.ok(r.autonomy === "propose" || r.autonomy === "read", r.key);
  });

  it("roles are configuration: none names a provider", () => {
    const json = JSON.stringify(AGENT_ROLES).toLowerCase();
    for (const vendor of ["grok", "xai", "anthropic", "claude", "openai", "gpt", "gemini", "google"]) assert.ok(!json.includes(vendor), vendor);
  });

  it("filters out proposals outside the role's lane, unknown, forbidden or non-executable", () => {
    const ads = getAgentRole("ads_manager")!;
    const v = validateProposals(ads, [
      { actionKey: "ads.budget_change", input: { a: 1 }, rationale: "x" },
      { actionKey: "invoice.issue", input: {}, rationale: "out of lane" },
      { actionKey: "deploy.production", input: {}, rationale: "never" },
      { actionKey: "does.not.exist", input: {}, rationale: "?" },
      { actionKey: "invoice.void", input: {}, rationale: "agents may not prepare void" },
      { actionKey: "content.create", input: [] as unknown as Record<string, unknown>, rationale: "bad input" },
    ]);
    assert.deepEqual(v.accepted.map((p) => p.actionKey), ["ads.budget_change"]);
    assert.equal(v.rejected.length, 5);
  });

  it("only passes context domains the role may read", () => {
    const ctx = filterContextForRole(getAgentRole("trend_intelligence")!, {
      campaigns: { domain: "growth", data: [1] },
      invoices: { domain: "finance", data: ["secret"] },
      people: { domain: "people", data: ["x"] },
    });
    assert.deepEqual(Object.keys(ctx), ["campaigns"]);
  });

  it("any provider can implement the same worker interface and acts through an agent actor", async () => {
    const make = (provider: string, model: string): AgentWorker => ({
      provider,
      model,
      run: async () => ({ ok: true, text: "ok", proposals: [], usage: { inputTokens: 1, outputTokens: 1, costUsd: 0, latencyMs: 1 } }),
    });
    for (const w of [make("xai", "grok"), make("anthropic", "claude"), make("openai", "gpt"), make("google", "gemini"), make("future", "x")]) {
      const res = await w.run({ role: getAgentRole("founder_chief_of_staff")!, instruction: "brief", context: {} });
      assert.equal(res.ok, true);
      const actor = agentActor(getAgentRole("founder_chief_of_staff")!, "u1", w);
      assert.equal(actor.kind, "agent");
      assert.equal(actor.kind === "agent" && actor.provider, w.provider);
    }
  });
});
