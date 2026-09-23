import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { OS_PAGES } from "../lib/content/platform-os";
import {
  OPERATING_SYSTEM_DEMOS,
  getOperatingSystemDemo,
} from "../lib/os-demo-config";

const OPERATING_SYSTEM_SLUGS = [
  "business-os",
  "commerce-os",
  "marketing-os",
  "logistics-os",
  "creative-os",
  "build-os",
  "academy-os",
  "automation-os",
] as const;

describe("Operating System UX V2 contracts", () => {
  it("defines exactly one signature demo for each of the eight Operating Systems", () => {
    assert.equal(Object.keys(OPERATING_SYSTEM_DEMOS).length, 8);

    for (const slug of OPERATING_SYSTEM_SLUGS) {
      const demo = getOperatingSystemDemo(slug);
      assert.ok(demo, `missing demo config for ${slug}`);
      assert.ok(demo.signature.length > 0);
      assert.ok(demo.workflow.length >= 6);
      assert.ok(demo.rinpoPrompt.length > 0);
    }
  });

  it("keeps every demo slug backed by an OS content page", () => {
    for (const slug of OPERATING_SYSTEM_SLUGS) {
      assert.ok(OS_PAGES[slug], `missing OS page content for ${slug}`);
    }
  });

  it("does not treat Intelligence or Cloud as signature Operating System demos", () => {
    assert.equal(getOperatingSystemDemo("rinads-intelligence"), null);
    assert.equal(getOperatingSystemDemo("rinads-cloud"), null);
  });

  it("removes the repeated generic stack diagram from the OS marketing frame", () => {
    const source = readFileSync(
      new URL("../components/system/OsMarketingPage.tsx", import.meta.url),
      "utf8"
    );

    assert.match(source, /OperatingSystemDemo/);
    assert.doesNotMatch(source, /WorkflowDiagram/);
    assert.match(source, /How work moves/);
  });
});
