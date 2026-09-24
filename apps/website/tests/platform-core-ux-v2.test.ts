import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { PLATFORM_OS } from "../lib/product-ia";

describe("Platform core UX V2 contracts", () => {
  it("keeps eight operating systems plus core product layers", () => {
    const operatingSystems = PLATFORM_OS.filter((item) => item.section !== "Core");
    const core = PLATFORM_OS.filter((item) => item.section === "Core");

    assert.equal(operatingSystems.length, 8);
    assert.ok(core.some((item) => item.label === "RINPO"));
    assert.ok(core.some((item) => item.label === "RINADS Intelligence"));
    assert.ok(core.some((item) => item.label === "RINADS Cloud"));
  });

  it("uses dedicated Intelligence and Cloud experiences instead of the generic OS page template", () => {
    const intelligencePage = readFileSync(
      new URL("../app/platform/rinads-intelligence/page.tsx", import.meta.url),
      "utf8"
    );
    const cloudPage = readFileSync(
      new URL("../app/platform/rinads-cloud/page.tsx", import.meta.url),
      "utf8"
    );

    assert.match(intelligencePage, /IntelligenceClient/);
    assert.doesNotMatch(intelligencePage, /OsMarketingPage/);
    assert.match(cloudPage, /CloudClient/);
    assert.doesNotMatch(cloudPage, /OsMarketingPage/);
  });

  it("keeps model-provider language distinct from an implemented AI gateway claim", () => {
    const cloudClient = readFileSync(
      new URL("../app/platform/rinads-cloud/CloudClient.tsx", import.meta.url),
      "utf8"
    );

    assert.match(cloudClient, /Model-provider boundary/);
    assert.doesNotMatch(cloudClient, /AI gateway position/);
  });
});
