import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { positionMegaMenu, positionPlainMenu } from "../lib/nav-menu-position";

describe("nav menu viewport positioning", () => {
  it("centers mega menus under the viewport and keeps them fully inside at 1280px", () => {
    const box = positionMegaMenu({ viewportWidth: 1280, islandBottom: 72 });
    assert.equal(box.width, 58 * 16);
    assert.equal(box.left, (1280 - box.width) / 2);
    assert.ok(box.left >= 12);
    assert.ok(box.left + box.width <= 1280 - 12);
    assert.equal(box.top, 84);
  });

  it("keeps mega menus centered at 1024px and clamps when viewport is tighter", () => {
    const at1024 = positionMegaMenu({ viewportWidth: 1024, islandBottom: 72 });
    assert.equal(at1024.width, 58 * 16);
    assert.equal(at1024.left, (1024 - at1024.width) / 2);
    assert.ok(at1024.left >= 12);

    const tight = positionMegaMenu({ viewportWidth: 800, islandBottom: 72 });
    assert.equal(tight.width, 800 - 24);
    assert.equal(tight.left, 12);
    assert.ok(tight.left + tight.width <= 800 - 12);
  });

  it("clamps plain menus near the left edge", () => {
    const box = positionPlainMenu({
      viewportWidth: 1024,
      triggerLeft: 40,
      triggerWidth: 80,
      triggerBottom: 64,
    });
    assert.equal(box.left, 12);
    assert.ok(box.left + box.width <= 1024 - 12);
  });

  it("clamps plain menus near the right edge", () => {
    const box = positionPlainMenu({
      viewportWidth: 1280,
      triggerLeft: 1180,
      triggerWidth: 90,
      triggerBottom: 64,
    });
    assert.ok(box.left + box.width <= 1280 - 12);
    assert.ok(box.left >= 12);
  });
});
