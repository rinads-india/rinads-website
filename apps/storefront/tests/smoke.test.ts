import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatINR } from "../lib/format";

describe("formatINR", () => {
  it("formats whole rupee amounts", () => {
    const formatted = formatINR(149);
    assert.match(formatted, /149/);
    assert.match(formatted, /₹|INR/);
  });

  it("formats larger amounts with grouping", () => {
    const formatted = formatINR(1199);
    assert.match(formatted, /1,?199/);
  });
});
