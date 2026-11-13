import test from "node:test";
import assert from "node:assert/strict";
import { findGrowthGuide, GROWTH_CATEGORIES, GROWTH_GUIDES } from "../lib/content/growth-knowledge";

test("growth library provides original, non-empty guides with unique SEO-safe slugs", () => {
  assert.ok(GROWTH_GUIDES.length >= 6);
  assert.equal(new Set(GROWTH_GUIDES.map((guide) => guide.slug)).size, GROWTH_GUIDES.length);
  for (const guide of GROWTH_GUIDES) {
    assert.match(guide.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(guide.title.length > 20);
    assert.ok(guide.description.length > 40);
    assert.ok(guide.sections.length >= 2);
    assert.ok(guide.sections.every((section) => section.heading && section.paragraphs.every((paragraph) => paragraph.length > 30)));
    assert.equal(findGrowthGuide(guide.slug), guide);
    assert.ok(GROWTH_CATEGORIES.includes(guide.category));
  }
});

test("growth guide route lookups do not resolve unknown articles", () => {
  assert.equal(findGrowthGuide("nonexistent-guide"), undefined);
});
