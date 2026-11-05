import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { contactSourcePath } from "../lib/lead-source";

describe("Lead campaign attribution", () => {
  it("preserves the existing start route", () => {
    assert.equal(contactSourcePath("start"), "/start");
  });

  it("retains bounded campaign source identifiers", () => {
    assert.equal(
      contactSourcePath("RI-GROWTH-SEARCH-INTELLIGENCE"),
      "/contact?source=ri-growth-search-intelligence",
    );
    assert.equal(contactSourcePath(" launch_nov14 "), "/contact?source=launch_nov14");
  });

  it("does not persist arbitrary parameters, URLs or contact information", () => {
    for (const unsafe of ["a@b.com", "https://example.com", "token=abc", "sale&email=person", "x".repeat(65)]) {
      assert.equal(contactSourcePath(unsafe), "/contact");
    }
    assert.equal(contactSourcePath(null), "/contact");
    assert.equal(contactSourcePath(""), "/contact");
  });
});

describe("Lead submission fail-closed contract", () => {
  it("never confirms an unconfigured persistence sink or caches failed writes as duplicates", () => {
    const route = readFileSync(join(process.cwd(), "app/api/leads/route.ts"), "utf8");
    assert.match(route, /throw new Error\("Lead persistence is not configured"\)/);
    assert.match(route, /if \(!result\.stored\) throw new Error\("Lead persistence did not confirm storage"\)/);
    assert.match(route, /const result = await storeLead\(validated\.value\);[\s\S]{0,250}recentFingerprints\.set\(fp, Date\.now\(\)\);/);
    assert.doesNotMatch(route, /recentFingerprints\.set\(fp, now\)/);
    assert.doesNotMatch(route, /Persistence is pending configuration/);
  });
});
