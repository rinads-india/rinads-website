import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isRinadsCatalogReadEnabledForActor,
  parseRinadsCatalogReadInput,
} from "../lib/agent-gateway/catalog-read";

describe("RINADS agent catalog read policy", () => {
  it("uses safe defaults for an empty input", () => {
    assert.deepEqual(parseRinadsCatalogReadInput(undefined), {
      ok: true,
      limit: 25,
    });
  });

  it("rejects organization_id and every undeclared tool argument", () => {
    const parsed = parseRinadsCatalogReadInput({
      organization_id: "org_attacker_selected",
      query: "pebbles",
    });

    assert.equal(parsed.ok, false);
    if (!parsed.ok) assert.match(parsed.reason, /organization_id/);
  });

  it("limits catalog reads to a bounded result size", () => {
    assert.equal(parseRinadsCatalogReadInput({ limit: 0 }).ok, false);
    assert.equal(parseRinadsCatalogReadInput({ limit: 51 }).ok, false);
    assert.deepEqual(parseRinadsCatalogReadInput({ query: "pebbles", limit: 10 }), {
      ok: true,
      query: "pebbles",
      limit: 10,
    });
  });

  it("keeps the capability off without an explicit enabled override", () => {
    assert.equal(isRinadsCatalogReadEnabledForActor([], "user_1"), false);
    assert.equal(
      isRinadsCatalogReadEnabledForActor(
        [{ user_id: null, enabled: false }],
        "user_1"
      ),
      false
    );
  });

  it("lets a user-specific override take precedence over the organization override", () => {
    assert.equal(
      isRinadsCatalogReadEnabledForActor(
        [
          { user_id: null, enabled: true },
          { user_id: "user_1", enabled: false },
        ],
        "user_1"
      ),
      false
    );

    assert.equal(
      isRinadsCatalogReadEnabledForActor(
        [
          { user_id: null, enabled: false },
          { user_id: "user_1", enabled: true },
        ],
        "user_1"
      ),
      true
    );
  });
});
