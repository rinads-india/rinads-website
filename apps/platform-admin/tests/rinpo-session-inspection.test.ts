import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const adapters = readFileSync(new URL("../lib/rinpo-control/adapters.ts", import.meta.url), "utf8");
const page = readFileSync(new URL("../app/(founder)/rinpo/sessions/page.tsx", import.meta.url), "utf8");

describe("RINPO session inspection", () => {
  it("requests only session metadata from Supabase", () => {
    assert.match(adapters, /select: "id,organization_id,user_id,created_at,updated_at"/);
    assert.doesNotMatch(adapters, /select: "[^"]*messages/);
    assert.doesNotMatch(adapters, /select: "[^"]*context/);
    assert.match(adapters, /SESSION_INSPECTION_LIMIT = 12/);
  });

  it("keeps transcript and context out of the founder session table", () => {
    assert.match(page, /Actor and tenant metadata without transcript access/);
    assert.match(page, /transcript messages, conversation context, memory content and model payloads are not requested/i);
    assert.doesNotMatch(page, /session\.messages/);
    assert.doesNotMatch(page, /session\.context/);
  });

  it("renders identifiers in redacted form", () => {
    assert.match(page, /function shortId/);
    assert.match(page, /shortId\(session\.id\)/);
    assert.match(page, /shortId\(session\.organizationId\)/);
    assert.match(page, /shortId\(session\.userId\)/);
  });
});
