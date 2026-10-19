import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { join } from "node:path";

const root = process.cwd();

describe("R GLOW inventory", () => {
  it("adds an inventory route with per-store stock, adjustments, and the 3-step transfer modal", () => {
    const page = readFileSync(join(root, "app/(console)/inventory/page.tsx"), "utf8");
    const modal = readFileSync(join(root, "app/(console)/inventory/TransferModal.tsx"), "utf8");
    const nav = readFileSync(join(root, "components/RinaglowNav.tsx"), "utf8");
    assert.match(page, /listStockLevels/);
    assert.match(page, /Universal/);
    assert.match(page, /AdjustStockForm/);
    assert.match(page, /TransferModal/);
    assert.match(page, /EmptyState/);
    assert.match(modal, /Choose products/);
    assert.match(modal, /Confirm transfer/);
    assert.match(modal, /rinpo-face\.png/);
    assert.match(nav, /\/inventory/);
    assert.doesNotMatch(page, /demoContext|USE_DEMO_STORE|Ringlow/);
  });
});
