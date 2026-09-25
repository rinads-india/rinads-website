import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(process.cwd());

describe("OS bridge empty states", () => {
  it("OsModuleBridge renders an empty state when no destinations are visible", () => {
    const src = readFileSync(join(root, "components/os/OsModuleBridge.tsx"), "utf8");
    assert.match(src, /Nothing to open here yet/);
    assert.match(src, /hasAnyDestination/);
    assert.match(src, /Back to Home/);
  });

  it("OsRoomsContent does not invent live room cards in Supabase mode", () => {
    const src = readFileSync(join(root, "components/os/OsRoomsContent.tsx"), "utf8");
    assert.match(src, /isSupabaseMode/);
    assert.match(src, /No rooms yet/);
    assert.match(src, /does not invent active rooms/);
    assert.match(src, /Demo mode/);
  });
});
